
import React from 'react';
import { QuizQuestion, UserAnswer, QuizConfig, QuestionType } from '../types';
import { Button } from './Button';

interface QuizStepProps {
  currentQuestionIndex: number;
  quiz: QuizQuestion[];
  config: QuizConfig;
  longAnswerQuestion: QuizQuestion | null;
  answers: UserAnswer[];
  handleAnswer: (val: string, qId: string) => void;
  isEssayLocked: boolean;
  nextQuestion: () => void;
  prevQuestion: () => void;
  isGenerating: boolean;
  gradingStatus: string | null;
  currentBatchInfo: { label: string; index: number; size: number } | null;
}

export const QuizStep: React.FC<QuizStepProps> = ({
  currentQuestionIndex, quiz, config, longAnswerQuestion, answers, handleAnswer,
  isEssayLocked, nextQuestion, prevQuestion, isGenerating, gradingStatus, currentBatchInfo
}) => {
  const isThesisStep = config.includeLongAnswer && currentQuestionIndex === 0;
  
  // Calculate true quiz index
  const quizIdx = config.includeLongAnswer ? currentQuestionIndex - 1 : currentQuestionIndex;
  const q = isThesisStep ? longAnswerQuestion : quiz[quizIdx];

  const statusText = gradingStatus 
    ? gradingStatus 
    : isGenerating 
      ? `Synthesizing ${currentBatchInfo?.label || 'Neural Data'}...` 
      : 'Synthesis Online';

  const isBusy = isGenerating || gradingStatus !== null;

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-xl border-4 border-slate-900 flex items-center justify-center font-black text-slate-900 text-3xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] tabular-nums">
            {currentQuestionIndex + 1}
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Synapse Index</h3>
            <p className="text-sm font-black text-indigo-600 mt-1 uppercase tracking-widest">
              Buffered: {quiz.length} / {config.totalQuestions + config.totalFitbQuestions}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-3 justify-end">
             <span className={`text-[10px] font-black uppercase tracking-tighter ${gradingStatus ? 'text-amber-500' : 'text-slate-400'}`}>
              {statusText}
            </span>
            {isBusy && <div className="w-3 h-3 bg-indigo-600 rounded-full animate-ping" />}
          </div>
        </div>
      </div>

      {isThesisStep ? (
        <div className="paper-card rounded-2xl p-12 md:p-16 border-4">
          <div className="mb-12 border-b-4 border-slate-200 pb-10">
            <span className="inline-block px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase mb-8 tracking-[0.3em]">Core Thesis Assignment</span>
            {longAnswerQuestion ? (
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tighter">{longAnswerQuestion.question}</h2>
            ) : (
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-slate-100 rounded-lg w-full"></div>
                <div className="h-10 bg-slate-100 rounded-lg w-2/3"></div>
              </div>
            )}
          </div>
          <textarea 
            value={answers.find(a => a.questionId === longAnswerQuestion?.id)?.answer || ''}
            onChange={(e) => longAnswerQuestion && handleAnswer(e.target.value, longAnswerQuestion.id)}
            readOnly={isEssayLocked}
            placeholder={isEssayLocked ? "Locked for evaluation..." : "Type your response..."}
            className={`w-full min-h-[350px] p-8 rounded-2xl border-4 outline-none font-bold text-slate-900 text-xl leading-relaxed shadow-inner transition-all ${isEssayLocked ? 'bg-slate-100 border-slate-300' : 'bg-slate-50 border-slate-300 focus:bg-white focus:border-indigo-600'}`}
          />
          <div className="mt-12 pt-10 border-t-4 border-slate-200 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase">{isEssayLocked ? "Grading active..." : "Pending confirmation..."}</p>
            <Button onClick={nextQuestion} disabled={!longAnswerQuestion} isLoading={gradingStatus !== null} className="px-12 py-5 text-lg">
              {gradingStatus ? 'GRADING' : 'Begin Objective Block'}
            </Button>
          </div>
        </div>
      ) : (
        (() => {
          if (!q) return (
            <div className="py-24 text-center bg-white/50 border-4 border-dashed border-slate-300 rounded-2xl">
               <div className="w-20 h-20 bg-indigo-600 mx-auto rounded-2xl animate-spin mb-8"></div>
               <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Compiling {currentBatchInfo?.label || 'Neural Data'}...</h3>
            </div>
          );
          
          const currentAns = answers.find(a => a.questionId === q.id)?.answer || '';
          const isFitb = q.type === QuestionType.FILL_IN_BLANK;

          return (
            <div className="paper-card rounded-2xl p-12 md:p-16 border-4">
              <div className="mb-12 border-b-4 border-slate-200 pb-10">
                <span className="inline-block px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase mb-8 tracking-[0.3em]">
                  {isFitb ? 'Fill-in-the-Blank' : 'Objective MCQ'}
                </span>
                <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tighter">{q.question}</h2>
              </div>
              
              {isFitb ? (
                <div className="space-y-6">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Response Input</label>
                   <input 
                    type="text"
                    value={currentAns}
                    onChange={(e) => handleAnswer(e.target.value, q.id)}
                    placeholder="Enter short answer..."
                    className="w-full p-8 bg-slate-50 border-4 border-slate-300 rounded-2xl text-2xl font-black text-indigo-900 outline-none focus:bg-white focus:border-indigo-600 shadow-inner"
                   />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {q.options?.map((opt, i) => {
                    const isSelected = currentAns === opt;
                    return (
                      <button key={i} onClick={() => handleAnswer(opt, q.id)} className={`w-full p-8 rounded-2xl border-4 text-left flex items-center gap-8 transition-all active:scale-95 ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-[6px_6px_0px_0px_rgba(79,70,229,1)]' : 'border-slate-300 bg-white hover:border-slate-400'}`}>
                        <div className={`w-12 h-12 flex-shrink-0 rounded-lg flex items-center justify-center font-black text-xl border-4 ${isSelected ? 'bg-indigo-600 border-indigo-700 text-white' : 'border-slate-300 text-slate-400'}`}>{String.fromCharCode(65 + i)}</div>
                        <span className={`font-black text-xl ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-12 pt-12 border-t-4 border-slate-200 flex items-center justify-between">
                <button onClick={prevQuestion} className="font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900">[-] Prev</button>
                <Button onClick={nextQuestion} disabled={!currentAns.trim()} isLoading={gradingStatus !== null} className="px-14 py-5 text-xl">
                  {gradingStatus ? 'GRADING' : (quizIdx === quiz.length - 1 ? 'Finalize' : 'Confirm [+]')}
                </Button>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};
