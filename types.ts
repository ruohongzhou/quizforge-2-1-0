export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  FILL_IN_BLANK = 'fill_in_blank',
  LONG_ANSWER = 'long_answer'
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizFile {
  name: string;
  content: string;
}

export interface QuizConfig {
  totalQuestions: number;
  totalFitbQuestions: number;
  batchCount: number;
  detailLevel: string;
  includeApplication: boolean;
  includeLongAnswer: boolean;
  customLongAnswerPrompt?: string;
  files: QuizFile[];
  focusAreas: string[];
  totalFocusWeight: number;
}

export interface UserAnswer {
  questionId: string;
  answer: string;
}

export interface EssayGradingResult {
  grade: string;
  feedback: string;
  sources?: { title: string; uri: string }[];
}

export interface FitbGradingResult {
  isCorrect: boolean;
  correctValue: string;
  feedback: string;
}