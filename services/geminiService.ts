
import { GoogleGenAI, Type } from "@google/genai";
import { QuizConfig, QuizQuestion, QuestionType } from "../types";

export const generateLongAnswerQuestion = async (
  combinedContent: string,
  isTopicOnly: boolean,
  config: QuizConfig,
  previousQuestions: QuizQuestion[]
): Promise<QuizQuestion> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const sourceInstruction = isTopicOnly 
    ? `TOPIC: "${combinedContent}"`
    : `DOCUMENTS: ${combinedContent.substring(0, 15000)}`;

  let focusInstruction = '';
  if (config.focusAreas.length > 0) {
    focusInstruction = `PRIORITIZE these Collective Focus Areas: ${config.focusAreas.join(', ')}. 
    The question should ideally bridge the gap between these topics and the core material, 
    matching a target priority density of approximately ${config.totalFocusWeight}%.`;
  }

  const existingQuestionsList = previousQuestions
    .map((q, i) => `${i + 1}. [Type: ${q.type}] Question: ${q.question}`)
    .join('\n');

  const prompt = `
    Based on ${sourceInstruction}, ${focusInstruction} generate one complex, open-ended "Long Answer" or "Essay" question that requires deep critical thinking and synthesis of the material.
    
    GLOBAL REPETITION CONSTRAINT: Do NOT overlap with these existing items:
    ${existingQuestionsList || 'None yet.'}
    
    Also generate a preliminary rubric. You may use external sources to enhance the quality of the question.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are an expert educator. Generate a high-level essay question with a detailed rubric and explanation. Return ONLY a JSON object.",
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }],
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: [QuestionType.LONG_ANSWER] },
          question: { type: Type.STRING },
          correctAnswer: { type: Type.STRING, description: "Detailed rubric or key points that should be included in the answer." },
          explanation: { type: Type.STRING, description: "Why this question is important." }
        },
        required: ["type", "question", "correctAnswer", "explanation"]
      }
    }
  });

  const parsed = JSON.parse(response.text || "{}");
  return {
    ...parsed,
    id: `long-ans-${Date.now()}`
  };
};

export const gradeLongAnswer = async (
  question: string,
  userAnswer: string,
  combinedContent: string,
  config: QuizConfig
): Promise<{ grade: string; feedback: string; sources?: { title: string; uri: string }[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    ASSESSMENT CONTEXT: ${config.detailLevel} level.
    SOURCE MATERIAL (Internal): ${combinedContent.substring(0, 15000)}
    
    QUESTION: ${question}
    USER'S ANSWER: ${userAnswer}
    
    TASK: Grade this essay response using both the provided internal source material and external web verification for factual accuracy. 
    Provide a clear grade (e.g., A, B, C or 85/100) and constructive feedback.
    
    IMPORTANT: You must include a section at the very end of your response labeled "---JSON_DATA---" followed by a JSON block with "grade" and "feedback" keys.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are a fair and rigorous academic grader. You have access to Google Search to verify external claims. Provide detailed feedback first, then the JSON block.",
      tools: [{ googleSearch: {} }],
    }
  });

  const text = response.text || "";
  let grade = "N/A";
  let feedback = text;

  try {
    const jsonMatch = text.match(/---JSON_DATA---([\s\S]*)/);
    if (jsonMatch && jsonMatch[1]) {
      const parsed = JSON.parse(jsonMatch[1].trim());
      grade = parsed.grade || "N/A";
      feedback = text.split("---JSON_DATA---")[0].trim();
    }
  } catch (e) {
    console.error("Failed to parse grading JSON", e);
  }

  const sources: { title: string; uri: string }[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach((chunk: any) => {
      if (chunk.web?.uri) {
        sources.push({
          title: chunk.web.title || chunk.web.uri,
          uri: chunk.web.uri
        });
      }
    });
  }

  return { grade, feedback, sources: sources.length > 0 ? sources : undefined };
};

export const gradeFitbBatch = async (
  questions: QuizQuestion[],
  answers: { questionId: string; answer: string }[],
  combinedContent: string
): Promise<Record<string, { isCorrect: boolean; correctValue: string; feedback: string }>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const payload = questions.map(q => ({
    id: q.id,
    question: q.question,
    expected: q.correctAnswer,
    provided: answers.find(a => a.questionId === q.id)?.answer || ""
  }));

  const prompt = `
    TASK: Grade these short-answer/fill-in-the-blank responses in ONE BATCH.
    Context: ${combinedContent.substring(0, 10000)}
    
    For each response, determine if it is conceptually correct even if the wording slightly varies. 
    Return a JSON object where keys are question IDs.
    
    Input: ${JSON.stringify(payload)}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are a grading assistant. You assess conceptual accuracy for short answers. Return strictly a JSON object mapping IDs to { isCorrect: boolean, correctValue: string, feedback: string }.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        description: "Mapping of question ID to grading results",
        additionalProperties: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            correctValue: { type: Type.STRING },
            feedback: { type: Type.STRING }
          },
          required: ["isCorrect", "correctValue", "feedback"]
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateQuizBatch = async (
  combinedContent: string,
  isTopicOnly: boolean,
  config: QuizConfig,
  previousQuestions: QuizQuestion[],
  fitbCount: number,
  mcqCount: number,
  startIndex: number
): Promise<QuizQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const existingQuestionsList = previousQuestions
    .map((q, i) => `${i + 1}. [Type: ${q.type}] Question: ${q.question}`)
    .join('\n');
  
  const sourceInstruction = isTopicOnly 
    ? `Generate an assessment for the TOPIC: "${combinedContent}".`
    : `Generate an assessment using these study notes as source material:\n---\n${combinedContent.substring(0, 30000)}\n---`;

  let focusInstruction = '';
  if (config.focusAreas.length > 0) {
    focusInstruction = `
    NEURAL PRIORITIZATION: Target ${config.totalFocusWeight}% aggregate focus on: ${config.focusAreas.join(', ')}.
    `;
  }

  const prompt = `
    ${sourceInstruction}
    ${focusInstruction}
    
    GLOBAL REPETITION CONSTRAINT: Do NOT repeat or overlap with the content, phrasing, or facts covered in the following existing questions:
    ${existingQuestionsList || 'None yet.'}
    
    TASK: Generate exactly ${fitbCount} FILL_IN_BLANK questions and ${mcqCount} MULTIPLE_CHOICE questions.
    Total this batch: ${fitbCount + mcqCount}.
    
    Constraints for FILL_IN_BLANK:
    - The correct answer should be a single word or a very short phrase (1-3 words).
    
    Constraints for MULTIPLE_CHOICE:
    - Exactly 4 options.
    - Balanced distractor lengths.
    
    Difficulty: "${config.detailLevel}".
    Return strictly a JSON array.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are an elite academic assessment bot. You ensure variety and parity in distractors. You return ONLY a JSON array of objects with 'type' (multiple_choice or fill_in_blank), 'question', 'options' (only for MCQs), 'correctAnswer', and 'explanation'.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: [QuestionType.MULTIPLE_CHOICE, QuestionType.FILL_IN_BLANK] },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["type", "question", "correctAnswer", "explanation"]
        }
      }
    }
  });

  try {
    const jsonStr = response.text || "[]";
    const parsed = JSON.parse(jsonStr);
    return parsed.map((q: any, i: number) => ({
      ...q,
      id: `q-${Date.now()}-${startIndex + i}`
    }));
  } catch (error) {
    console.error("Batch generation failed:", error);
    throw new Error("Batch synthesis failed. API Limit reached or Network error.");
  }
};

export const convertPdfToText = async (base64Pdf: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Pdf,
        },
      },
      {
        text: 'Extract all factual information, concepts, and key details from this document. Transform it into a comprehensive, high-density structured set of study notes. Focus on completeness and clarity.',
      },
    ],
    config: {
      systemInstruction: 'You are a senior academic researcher. Your goal is to convert raw document data into high-quality, dense, and structured educational text. Capture every important term and definition.',
    },
  });

  return response.text || "No content extracted.";
};
