
import React from 'react';
import { QuizQuestion, UserAnswer, EssayGradingResult, QuizConfig, FitbGradingResult, QuestionType } from '../types';
import { Button } from './Button';

interface ResultStepProps {
  score: number;
  totalObjective: number;
  quiz: QuizQuestion[];
  config: QuizConfig;
  longAnswerQuestion: QuizQuestion | null;
  answers: UserAnswer[];
  essayGrading: EssayGradingResult | null;
  fitbGrading: Record<string, FitbGradingResult>;
  isGenerating: boolean;
  onReset: () => void;
  onDownloadReport: () => void;
}

export const ResultStep: React.FC<ResultStepProps> = ({
  score, totalObjective, quiz, config, longAnswerQuestion, answers, essayGrading, fitbGrading, isGenerating, onReset, onDownloadReport
}) => {
  return (
    <div className="space-y-16 animate-fade-in pb-40">
      <div className="paper-card rounded-2xl p-20 text-center border-4">
        <div className="w-full max-w-lg mx-auto bg-slate-900 rounded-3xl flex items-center justify-center mb-12 shadow-[12px_12px_0px_0px_rgba(79,70,229,1)] px-12 py-12">
          <span className="text-5xl md:text-7xl font-black text-white tabular-nums leading-none tracking-tighter">
            {score} / {totalObjective}
          </span>
        </div>
        <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Synthesis Summary</h2>
        <div className="flex flex-col md:flex-row gap-6 justify-center mt-12">
          <Button onClick={onReset} className="px-14 py-5 text-xl">Reset</Button>
          <button onClick={onDownloadReport} className="px-14 py-5 border-4 border-slate-900 rounded-xl font-black uppercase text-sm hover:bg-slate-900 hover:text-white transition-all shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] tracking-widest flex items-center justify-center gap-4">Download Report</button>
        </div>
      </div>

      <div className="space-y-10">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.5em] px-4 border-l-8 border-slate-900">Analysis Breakdown</h3>
        
        {config.includeLongAnswer && longAnswerQuestion && (
          <div className="paper-card rounded-2xl p-12 border-l-[30px] border-l-indigo-600 border-4">
             <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded">Thesis Evaluation</span>
                  {essayGrading && <span className="text-3xl font-black text-indigo-600">{essayGrading.grade}</span>}
                </div>
                <p className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tighter">{longAnswerQuestion.question}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="p-8 bg-slate-50 border-4 border-slate-200 rounded-2xl">
                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Your Entry</label>
                     <p className="font-bold text-slate-700 whitespace-pre-wrap">{answers.find(a => a.questionId === longAnswerQuestion.id)?.answer || '[Empty]'}</p>
                   </div>
                   <div className="p-8 bg-slate-900 border-4 border-slate-800 rounded-2xl">
                     <label className="block text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">AI Feedback</label>
                     {essayGrading ? (
                       <div className="space-y-4">
                         <p className="font-bold text-indigo-400 whitespace-pre-wrap text-sm leading-relaxed">{essayGrading.feedback}</p>
                         {essayGrading.sources && (
                           <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-2">
                             {essayGrading.sources.map((s, idx) => (<a key={idx} href={s.uri} target="_blank" className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20">{s.title}</a>))}
                           </div>
                         )}
                       </div>
                     ) : <div className="animate-pulse h-20 bg-slate-800 rounded w-full" />}
                   </div>
                </div>
             </div>
          </div>
        )}

        {quiz.map((q, idx) => {
          const userAns = answers.find(a => a.questionId === q.id)?.answer;
          const isFitb = q.type === QuestionType.FILL_IN_BLANK;
          const grading = isFitb ? fitbGrading[q.id] : null;
          const isCorrect = isFitb ? grading?.isCorrect : userAns === q.correctAnswer;
          
          return (
            <div key={q.id} className={`paper-card rounded-2xl p-12 border-l-[30px] ${isCorrect ? 'border-l-emerald-500' : 'border-l-rose-500'} border-4`}>
              <div className="flex flex-col md:flex-row gap-10">
                <div className={`w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-4xl border-4 ${isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-rose-50 border-rose-500 text-rose-700'}`}>{idx + 1}</div>
                <div className="flex-1 space-y-8">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{isFitb ? 'FILL-IN-BLANK' : 'MULTIPLE CHOICE'}</span>
                    <p className="text-3xl font-black text-slate-900 leading-tight">{q.question}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-slate-50 rounded-2xl border-4">
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Provided</label>
                      <span className="font-black text-xl text-slate-800">{userAns || '[None]'}</span>
                    </div>
                    <div className="p-8 bg-slate-900 border-4 border-slate-800 rounded-2xl">
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Target Answer</label>
                      <span className="font-black text-xl text-indigo-400">{isFitb ? (grading?.correctValue || q.correctAnswer) : q.correctAnswer}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-2xl border-4 border-slate-200">
                    <p className="text-lg font-bold text-slate-600 leading-relaxed italic">
                      {isFitb && grading?.feedback ? grading.feedback : q.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
