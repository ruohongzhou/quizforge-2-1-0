
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { generateQuizBatch, convertPdfToText, generateLongAnswerQuestion, gradeLongAnswer, gradeFitbBatch } from './services/geminiService';
import { QuizConfig, QuizQuestion, QuestionType, UserAnswer, QuizFile, EssayGradingResult, FitbGradingResult } from './types';
import { Header } from './components/Header';
import { DebugModal } from './components/DebugModal';
import { ConfigStep } from './components/ConfigStep';
import { QuizStep } from './components/QuizStep';
import { ResultStep } from './components/ResultStep';

const PRESET_LEVELS = ["Elementary", "Middle School", "High School", "College", "Graduate School", "Expert"];
const APP_VERSION = "v2.1.0-Synthesis";
const DEBUG_PASSCODE = "FORGE_DEBUG";

const App: React.FC = () => {
  const [step, setStep] = useState<'config' | 'quiz' | 'result'>('config');
  const [mode, setMode] = useState<'guide' | 'topic'>('guide');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [topic, setTopic] = useState('');
  const [files, setFiles] = useState<QuizFile[]>([]);
  const [focusInput, setFocusInput] = useState('');
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [debugError, setDebugError] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [converterProgress, setConverterProgress] = useState(0);

  const [config, setConfig] = useState<QuizConfig>({
    totalQuestions: 20, totalFitbQuestions: 10, batchCount: 3, detailLevel: PRESET_LEVELS[2],
    includeApplication: true, includeLongAnswer: true, customLongAnswerPrompt: '',
    files: [], focusAreas: [], totalFocusWeight: 70
  });

  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [longAnswerQuestion, setLongAnswerQuestion] = useState<QuizQuestion | null>(null);
  const [essayGrading, setEssayGrading] = useState<EssayGradingResult | null>(null);
  const [fitbGrading, setFitbGrading] = useState<Record<string, FitbGradingResult>>({});
  const [isEssayLocked, setIsEssayLocked] = useState(false);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [gradingStatus, setGradingStatus] = useState<string | null>(null);
  const [currentBatchInfo, setCurrentBatchInfo] = useState<{ label: string; index: number; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const quizRef = useRef<QuizQuestion[]>([]);
  const generationActiveRef = useRef(false);

  useEffect(() => {
    const maxF = config.includeLongAnswer ? 30 : 50;
    if (config.totalFitbQuestions > maxF) {
      setConfig(prev => ({ ...prev, totalFitbQuestions: maxF }));
    }
  }, [config.includeLongAnswer, config.totalFitbQuestions]);

  useEffect(() => {
    const maxMCQ = config.includeLongAnswer ? 60 : 100;
    if (config.totalQuestions > maxMCQ) {
      setConfig(prev => ({ ...prev, totalQuestions: maxMCQ }));
    }
  }, [config.includeLongAnswer, config.totalQuestions]);

  useEffect(() => {
    const total = config.totalQuestions + config.totalFitbQuestions;
    const calculatedBatchCount = Math.floor(Math.log2(Math.max(1, total) / 5)) + 1;
    if (config.batchCount !== calculatedBatchCount) {
      setConfig(prev => ({ ...prev, batchCount: calculatedBatchCount }));
    }
  }, [config.totalQuestions, config.totalFitbQuestions]);

  useEffect(() => {
    if (isEssayLocked && !isGenerating && !essayGrading && longAnswerQuestion) {
      triggerEssayGrading();
    }
  }, [isEssayLocked, isGenerating, essayGrading, longAnswerQuestion]);

  const batches = useMemo(() => {
    const { totalQuestions: mcqs, totalFitbQuestions: fitbs, includeLongAnswer: thesis, batchCount: B } = config;
    const total = mcqs + fitbs;
    if (total <= 0) return [];

    if (thesis) {
      const result = [];
      if (fitbs > 0) result.push({ size: fitbs, fitbs, mcqs: 0, label: 'FITBs' });
      if (mcqs > 0) result.push({ size: mcqs, fitbs: 0, mcqs, label: 'MCQs' });
      return result;
    }

    let tempSizes: number[] = [];
    if (total < 10) {
      tempSizes = [total];
    } else {
      const sizes = [Math.max(2, Math.floor(total * 0.1))];
      let remaining = total - sizes[0];
      const weights = Array.from({ length: B - 1 }, (_, i) => Math.pow(1.8, i));
      const totalW = weights.reduce((a, b) => a + b, 0);
      let temp = weights.map(w => Math.max(1, Math.floor((w / totalW) * remaining)));
      let diff = remaining - temp.reduce((a, b) => a + b, 0);
      let idx = B - 2;
      while (diff !== 0) {
        if (diff > 0) { temp[idx]++; diff--; } else if (temp[idx] > 1) { temp[idx]--; diff++; }
        idx = (idx - 1 + (B - 1)) % (B - 1);
      }
      tempSizes = [...sizes, ...temp].sort((a, b) => a - b);
    }

    let rFitb = fitbs;
    let rMcq = mcqs;
    return tempSizes.map((s, i) => {
      const bFitb = Math.min(s, rFitb);
      const bMcq = s - bFitb;
      rFitb -= bFitb;
      rMcq -= bMcq;
      let label = `Batch ${i + 1}`;
      if (bFitb > 0 && bMcq === 0) label = 'FITBs';
      else if (bFitb === 0 && bMcq > 0) label = 'MCQs';
      else if (bFitb > 0 && bMcq > 0) label = 'Mixed Block';
      
      return { size: s, fitbs: bFitb, mcqs: bMcq, label };
    });
  }, [config.totalQuestions, config.totalFitbQuestions, config.batchCount, config.includeLongAnswer]);

  const handleTxtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      fileList.forEach((file: File) => {
        if (!file.name.endsWith('.txt')) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setFiles(prev => {
            if (prev.some(f => f.name === file.name)) return prev; 
            return [...prev, { name: file.name, content }].slice(0, 20);
          });
        };
        reader.readAsText(file);
      });
      e.target.value = ''; 
    }
  };

  const downloadTextFile = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConverterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const sliced = Array.from(e.target.files).slice(0, 10) as File[];
      setIsConverting(true);
      setError(null);
      const converted: QuizFile[] = [];
      try {
        for (let i = 0; i < sliced.length; i++) {
          const reader = new FileReader();
          const b64 = await new Promise<string>((res, rej) => {
            reader.onload = (ev) => res((ev.target?.result as string).split(',')[1]);
            reader.onerror = rej;
            reader.readAsDataURL(sliced[i]);
          });
          setConverterProgress(Math.round(((i + 0.5) / sliced.length) * 100));
          const content = await convertPdfToText(b64);
          
          const fileName = `Extracted_${sliced[i].name.replace(/\.[^/.]+$/, "")}.txt`;
          downloadTextFile(fileName, content);
          
          converted.push({ name: `Extracted: ${sliced[i].name}`, content });
          setConverterProgress(Math.round(((i + 1) / sliced.length) * 100));
        }
        setFiles(prev => {
          const newFiles = converted.filter(cf => !prev.some(pf => pf.name === cf.name));
          return [...prev, ...newFiles].slice(0, 20);
        });
      } catch (err) {
        console.error("PDF Processing error:", err);
        setError("Failed to process one or more PDF files.");
      } finally {
        setIsConverting(false);
        e.target.value = ''; 
      }
    }
  };

  const exportSessionConfig = () => {
    const data = { ...config, mode, topic, files };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `quizforge_session_${Date.now()}.json`; link.click();
    URL.revokeObjectURL(url);
  };

  const importSessionConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imp = JSON.parse(ev.target?.result as string);
        setMode(imp.mode || 'guide'); setTopic(imp.topic || '');
        if (imp.files) setFiles(imp.files);
        setConfig(prev => ({ ...prev, ...imp })); setError(null);
      } catch (err) { 
        console.error("Import error:", err);
        setError("Failed to parse config. Please ensure it is a valid JSON session file."); 
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const startQuiz = async () => {
    if (mode === 'guide' && files.length === 0) { setError("Upload notes first."); return; }
    if (mode === 'topic' && !topic.trim()) { setError("Enter a topic."); return; }
    setError(null); setQuiz([]); setEssayGrading(null); setFitbGrading({}); setIsEssayLocked(false);
    quizRef.current = []; setAnswers([]); setCurrentQuestionIndex(0); setStep('quiz');
    setIsGenerating(true); generationActiveRef.current = true;
    if (config.includeLongAnswer && config.customLongAnswerPrompt?.trim()) {
      setLongAnswerQuestion({ id: `custom-essay-${Date.now()}`, type: QuestionType.LONG_ANSWER, question: config.customLongAnswerPrompt, correctAnswer: '...', explanation: 'Custom' });
    }
    runBatchGeneration();
  };

  const runBatchGeneration = async () => {
    const combined = mode === 'guide' ? files.map(f => f.content).join('\n\n') : topic;
    
    if (config.includeLongAnswer && !config.customLongAnswerPrompt?.trim()) {
      try { 
        setCurrentBatchInfo({ label: 'Thesis Segment', index: 0, size: 1 });
        const la = await generateLongAnswerQuestion(combined, mode === 'topic', config, []); 
        setLongAnswerQuestion(la); 
      } catch (err: any) {
        setIsGenerating(false);
        generationActiveRef.current = false;
        setError(`Synthesis Terminated: ${err.message || 'API Constraint Hit'}`);
        return;
      }
    }

    for (let i = 0; i < batches.length; i++) {
      if (!generationActiveRef.current) break;
      const bConfig = batches[i];
      setCurrentBatchInfo({ label: bConfig.label, index: i + 1, size: bConfig.size });
      
      try {
        // AI sees ALL generated questions to avoid repeats
        const fullHistory = longAnswerQuestion ? [longAnswerQuestion, ...quizRef.current] : quizRef.current;
        const batch = await generateQuizBatch(combined, mode === 'topic', config, fullHistory, bConfig.fitbs, bConfig.mcqs, quizRef.current.length);
        quizRef.current = [...quizRef.current, ...batch];
        setQuiz([...quizRef.current]); 
      } catch (err: any) { 
        // If quota error, terminate instead of retrying forever
        if (err.message?.includes('429') || err.message?.includes('quota')) {
          setIsGenerating(false);
          generationActiveRef.current = false;
          setError(`Synthesis Terminated: API Token Limit Exceeded.`);
          break;
        }
        // General retry
        i--; 
        await new Promise(r => setTimeout(r, 3000)); 
      }
    }
    
    setIsGenerating(false); generationActiveRef.current = false;
  };

  const triggerEssayGrading = async () => {
    if (!longAnswerQuestion) return;
    setGradingStatus("Grading Long Answer Thesis...");
    const ans = answers.find(a => a.questionId === longAnswerQuestion.id)?.answer || "";
    const combined = mode === 'guide' ? files.map(f => f.content).join('\n\n') : topic;
    try { 
      const g = await gradeLongAnswer(longAnswerQuestion.question, ans, combined, config); 
      setEssayGrading(g); 
    } catch { 
      setEssayGrading({ grade: "Error", feedback: "Grading failed." }); 
    } finally {
      setGradingStatus(null);
    }
  };

  const finalizeQuiz = async () => {
    const fitbQuestions = quiz.filter(q => q.type === QuestionType.FILL_IN_BLANK);
    if (fitbQuestions.length > 0) {
      setGradingStatus("Grading Objective FITB Pipeline...");
      const combined = mode === 'guide' ? files.map(f => f.content).join('\n\n') : topic;
      try {
        const results = await gradeFitbBatch(fitbQuestions, answers, combined);
        setFitbGrading(results);
      } catch (err) {
        console.error("FITB grading error", err);
      } finally {
        setGradingStatus(null);
      }
    }
    setStep('result');
  };

  const submitDebug = () => {
    if (passcodeInput === DEBUG_PASSCODE) {
      setPasscodeInput('');
      setQuiz([
        { id: 'f1', type: QuestionType.FILL_IN_BLANK, question: 'A __ orbits Earth.', correctAnswer: 'Moon', explanation: 'Lunar body' },
        { id: 'd1', type: QuestionType.MULTIPLE_CHOICE, question: 'Sample?', options: ['Yes', 'No', 'Maybe', 'AI'], correctAnswer: 'Yes', explanation: 'Rationale' }
      ]);
      setLongAnswerQuestion({ id: 'dt', type: QuestionType.LONG_ANSWER, question: 'Discuss AI.', correctAnswer: 'Points...', explanation: 'Rationale' });
      setAnswers([{ questionId: 'f1', answer: 'Moon' }, { questionId: 'd1', answer: 'Yes' }, { questionId: 'dt', answer: 'AI is growing.' }]);
      setEssayGrading({ grade: "90/100", feedback: "Good." });
      setFitbGrading({ 'f1': { isCorrect: true, correctValue: 'Moon', feedback: 'Correct.' } });
      setShowDebugModal(false); setStep('result');
    } else { setDebugError(true); setTimeout(() => setDebugError(false), 2000); }
  };

  const objectiveScore = useMemo(() => {
    return quiz.reduce((acc, q) => {
      const ans = answers.find(a => a.questionId === q.id)?.answer;
      if (q.type === QuestionType.FILL_IN_BLANK) {
        return fitbGrading[q.id]?.isCorrect ? acc + 1 : acc;
      }
      return ans === q.correctAnswer ? acc + 1 : acc;
    }, 0);
  }, [answers, quiz, fitbGrading]);

  return (
    <div className="min-h-screen py-8 px-4 md:py-16 md:px-12 font-sans relative">
      <div className="fixed top-0 left-0 w-full h-1.5 bg-indigo-600 z-50"></div>
      <DebugModal show={showDebugModal} passcodeInput={passcodeInput} debugError={debugError} onClose={() => { setShowDebugModal(false); setPasscodeInput(''); }} onPasscodeChange={setPasscodeInput} onSubmit={submitDebug} />
      <div className="max-w-4xl mx-auto">
        <Header version={APP_VERSION} />
        {step === 'config' && (
          <ConfigStep 
            mode={mode} setMode={setMode} topic={topic} setTopic={setTopic} files={files} setFiles={setFiles}
            config={config} setConfig={setConfig} focusInput={focusInput} setFocusInput={setFocusInput}
            addFocusArea={() => { if (focusInput.trim()) { setConfig(p => ({ ...p, focusAreas: [...p.focusAreas, focusInput.trim()] })); setFocusInput(''); } }}
            removeFocusArea={(i) => setConfig(p => ({ ...p, focusAreas: p.focusAreas.filter((_, idx) => idx !== i) }))}
            isConverting={isConverting} converterProgress={converterProgress} handleTxtUpload={handleTxtUpload}
            handleConverterUpload={handleConverterUpload} exportSessionConfig={exportSessionConfig}
            importSessionConfig={importSessionConfig} startQuiz={startQuiz} isGenerating={isGenerating}
            error={error} showDebug={() => setShowDebugModal(true)} showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced} batches={batches}
          />
        )}
        {step === 'quiz' && (
          <QuizStep 
            currentQuestionIndex={currentQuestionIndex} quiz={quiz} config={config} longAnswerQuestion={longAnswerQuestion}
            answers={answers} handleAnswer={(val, id) => setAnswers(prev => [...prev.filter(a => a.questionId !== id), { questionId: id, answer: val }])}
            isEssayLocked={isEssayLocked} nextQuestion={() => {
              const totalObj = config.totalQuestions + config.totalFitbQuestions;
              if (config.includeLongAnswer && currentQuestionIndex === 0) { setIsEssayLocked(true); setCurrentQuestionIndex(1); }
              else if (currentQuestionIndex < (config.includeLongAnswer ? totalObj : totalObj - 1)) setCurrentQuestionIndex(p => p + 1);
              else finalizeQuiz();
            }}
            prevQuestion={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))}
            isGenerating={isGenerating} gradingStatus={gradingStatus} currentBatchInfo={currentBatchInfo}
          />
        )}
        {step === 'result' && (
          <ResultStep score={objectiveScore} totalObjective={quiz.length} quiz={quiz} config={config} longAnswerQuestion={longAnswerQuestion} answers={answers} essayGrading={essayGrading} fitbGrading={fitbGrading} isGenerating={isGenerating} onReset={() => setStep('config')} onDownloadReport={() => {}} />
        )}
      </div>
    </div>
  );
};

export default App;
