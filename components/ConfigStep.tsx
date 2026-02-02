
import React from 'react';
import { QuizConfig, QuizFile } from '../types';
import { Button } from './Button';

const PRESET_LEVELS = ["Elementary", "Middle School", "High School", "College", "Graduate School", "Expert"];

interface BatchConfig {
  size: number;
  fitbs: number;
  mcqs: number;
  label: string;
}

interface ConfigStepProps {
  mode: 'guide' | 'topic';
  setMode: (mode: 'guide' | 'topic') => void;
  topic: string;
  setTopic: (val: string) => void;
  files: QuizFile[];
  setFiles: React.Dispatch<React.SetStateAction<QuizFile[]>>;
  config: QuizConfig;
  setConfig: React.Dispatch<React.SetStateAction<QuizConfig>>;
  focusInput: string;
  setFocusInput: (val: string) => void;
  addFocusArea: () => void;
  removeFocusArea: (idx: number) => void;
  isConverting: boolean;
  converterProgress: number;
  handleTxtUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleConverterUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  exportSessionConfig: () => void;
  importSessionConfig: (e: React.ChangeEvent<HTMLInputElement>) => void;
  startQuiz: () => void;
  isGenerating: boolean;
  error: string | null;
  showDebug: () => void;
  showAdvanced: boolean;
  setShowAdvanced: (val: boolean) => void;
  batches: BatchConfig[];
}

export const ConfigStep: React.FC<ConfigStepProps> = ({
  mode, setMode, topic, setTopic, files, setFiles, config, setConfig,
  focusInput, setFocusInput, addFocusArea, removeFocusArea,
  isConverting, converterProgress, handleTxtUpload, handleConverterUpload,
  exportSessionConfig, importSessionConfig, startQuiz, isGenerating, error,
  showDebug, showAdvanced, setShowAdvanced, batches
}) => {
  const maxFitb = config.includeLongAnswer ? 30 : 50;
  const maxMcq = config.includeLongAnswer ? 60 : 100;

  // Max size for scaling logic
  const maxBatchSizeInConfig = Math.max(...batches.map(b => b.size), 1);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="paper-card rounded-xl overflow-hidden border-4">
        <div className="bg-slate-900 px-8 py-4 border-b-4 border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">Session Setup</h2>
            <div className="flex gap-2">
              <button onClick={exportSessionConfig} className="text-[8px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors border border-slate-700 px-2 py-0.5 rounded">Export</button>
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors border border-slate-700 px-2 py-0.5 rounded cursor-pointer">
                Import
                <input type="file" accept=".json" onChange={importSessionConfig} className="hidden" />
              </label>
            </div>
          </div>
          <button onClick={showDebug} className="text-[8px] font-black text-slate-600 uppercase tracking-widest hover:text-indigo-400 transition-colors">[Bypass.sys]</button>
        </div>
        
        <div className="p-8 md:p-12 space-y-12">
          <div className="flex p-1 bg-slate-200/50 rounded-xl border-2 border-slate-400 mb-4">
            <button onClick={() => setMode('guide')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase transition-all border-2 ${mode === 'guide' ? 'bg-white shadow-md text-indigo-600 border-slate-400' : 'bg-transparent border-transparent text-slate-400'}`}>Notes Mode</button>
            <button onClick={() => setMode('topic')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase transition-all border-2 ${mode === 'topic' ? 'bg-white shadow-md text-indigo-600 border-slate-400' : 'bg-transparent border-transparent text-slate-400'}`}>Topic Mode</button>
          </div>

          {mode === 'guide' ? (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Input Notes (.TXT)</label>
                   <div className="border-4 border-slate-800 rounded-2xl p-8 text-center bg-indigo-50 hover:bg-white hover:border-indigo-600 transition-all cursor-pointer relative min-h-[160px] flex flex-col justify-center shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
                      <input type="file" multiple accept=".txt" onChange={handleTxtUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <p className="text-sm font-black text-indigo-900 uppercase">Load TXT</p>
                      <p className="text-[10px] font-bold text-indigo-400 mt-2 uppercase">RAW TEXT (Max 20)</p>
                   </div>
                </div>
                <div className="space-y-4">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Slide Processor (.PDF)</label>
                   <div className="border-4 border-slate-800 rounded-2xl p-8 text-center bg-indigo-50 hover:bg-white hover:border-indigo-600 transition-all cursor-pointer relative min-h-[160px] flex flex-col justify-center shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
                      <input type="file" multiple accept=".pdf" onChange={handleConverterUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <p className="text-sm font-black text-indigo-900 uppercase">Vision Synth</p>
                      <p className="text-[10px] font-bold text-indigo-400 mt-2 uppercase">PDF Extraction</p>
                      {isConverting && (
                        <div className="mt-4 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${converterProgress}%` }} />
                        </div>
                      )}
                   </div>
                </div>
              </div>

              {files.length > 0 && (
                <div className="space-y-4 pt-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Synthesis Sources ({files.length}/20)</label>
                    <button onClick={() => setFiles([])} className="text-[8px] font-black text-rose-500 uppercase tracking-widest hover:underline">Wipe All</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white border-2 border-slate-200 rounded-xl group hover:border-indigo-400 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-2 h-2 rounded-full ${file.name.includes('Extracted') ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                          <span className="text-[10px] font-bold text-slate-700 truncate">{file.name}</span>
                        </div>
                        <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-rose-500 transition-colors px-2 font-black text-xs">&times;</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Synthesis Subject</label>
              <input 
                type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Astrophysics, Medieval History, etc..."
                className="w-full px-8 py-6 rounded-2xl border-4 border-slate-400 bg-white text-slate-900 focus:border-indigo-600 focus:bg-white transition-all outline-none font-extrabold text-2xl placeholder:opacity-30"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t-2 border-slate-400 pt-10">
            <div className="flex flex-col h-full space-y-4">
              <div className="flex justify-between items-center h-10">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">MCQ Goal</label>
                <span className="text-2xl font-black text-indigo-600 tabular-nums">{config.totalQuestions}</span>
              </div>
              <div className="flex-grow flex items-center">
                <input type="range" min="0" max={maxMcq} step="1" value={config.totalQuestions} onChange={(e) => setConfig({...config, totalQuestions: parseInt(e.target.value)})} className="w-full" />
              </div>
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase"><span>0 Qs</span><span>{maxMcq} Qs</span></div>
            </div>
            
            <div className="flex flex-col h-full space-y-4">
              <div className="flex justify-between items-center h-10">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">FITB Goal</label>
                <span className="text-2xl font-black text-indigo-600 tabular-nums">{config.totalFitbQuestions}</span>
              </div>
              <div className="flex-grow flex items-center">
                <input type="range" min="0" max={maxFitb} step="1" value={config.totalFitbQuestions} onChange={(e) => setConfig({...config, totalFitbQuestions: parseInt(e.target.value)})} className="w-full" />
              </div>
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase"><span>0 Qs</span><span>{maxFitb} Qs</span></div>
            </div>

            <div className="flex flex-col h-full space-y-4 md:col-span-2 pt-4">
              <div className="flex justify-between items-center h-10">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Complexity Level</label>
                <span className="text-sm font-black text-indigo-600 uppercase tracking-wider text-right">{config.detailLevel}</span>
              </div>
              <div className="flex-grow flex items-center">
                <input type="range" min="0" max={PRESET_LEVELS.length - 1} step="1" value={PRESET_LEVELS.indexOf(config.detailLevel)} onChange={(e) => setConfig({...config, detailLevel: PRESET_LEVELS[parseInt(e.target.value)]})} className="w-full" />
              </div>
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase"><span>Base</span><span>Apex</span></div>
            </div>
          </div>

          <div className="space-y-6 pt-10 border-t-2 border-slate-400">
             <div className="flex justify-between items-baseline mb-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Strategic Focus Engine</label>
                <span className="text-[10px] font-black text-indigo-400 uppercase">Neural Density Mapping</span>
             </div>
             
             <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center px-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Focus Density Target</p>
                   <span className="text-2xl font-black text-indigo-600 tabular-nums">~{config.totalFocusWeight}%</span>
                </div>
                <input type="range" min="1" max="100" step="1" value={config.totalFocusWeight} onChange={(e) => setConfig({...config, totalFocusWeight: parseInt(e.target.value)})} className="w-full" />
                <p className="text-[8px] font-bold text-slate-400 uppercase italic">The AI targets {config.totalFocusWeight}% of the quiz on priority subjects.</p>
             </div>

             <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-400 space-y-6">
                <div className="flex gap-4 items-end">
                   <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Add Priority Topic</label>
                      <input type="text" value={focusInput} onChange={(e) => setFocusInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addFocusArea()} placeholder="e.g. Thermodynamics..." className="w-full px-6 py-4 rounded-xl border-2 border-slate-400 bg-white text-slate-900 focus:border-indigo-400 outline-none font-bold text-sm" />
                   </div>
                   <button onClick={addFocusArea} className="px-8 py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest border-b-4 border-slate-950 active:translate-y-1 transition-all">Add [+]</button>
                </div>
             </div>

             {config.focusAreas.length > 0 && (
               <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-400">
                 {config.focusAreas.map((topicStr, i) => (
                   <div key={i} className="flex items-center gap-4 px-4 py-2 bg-white border-2 border-indigo-200 rounded-lg shadow-sm">
                     <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{topicStr}</span>
                     <button onClick={() => removeFocusArea(i)} className="text-rose-600 font-bold hover:scale-125 transition-transform">&times;</button>
                   </div>
                 ))}
               </div>
             )}
          </div>

          <div className="pt-10 border-t-2 border-slate-400 space-y-8">
             <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border-2 border-slate-300">
                <div className="flex items-center gap-6">
                  <button onClick={() => setConfig({...config, includeLongAnswer: !config.includeLongAnswer})} className={`w-14 h-8 rounded-lg border-2 transition-all relative ${config.includeLongAnswer ? 'bg-indigo-600 border-indigo-700' : 'bg-slate-300 border-slate-400'}`}>
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded transition-all ${config.includeLongAnswer ? 'translate-x-6' : ''}`} />
                  </button>
                  <div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Include Thesis Prompt</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Enables Sequential Batch Logic</p>
                  </div>
                </div>
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-[10px] font-black text-slate-500 uppercase tracking-widest underline decoration-2 decoration-slate-400 underline-offset-4 hover:text-indigo-600 transition-colors">{showAdvanced ? 'Collapse Map' : 'Expand Strategy'}</button>
             </div>

             {config.includeLongAnswer && (
                <textarea value={config.customLongAnswerPrompt} onChange={(e) => setConfig({...config, customLongAnswerPrompt: e.target.value})} placeholder="Define your specific essay question here..." className="w-full p-6 bg-white border-4 border-slate-400 rounded-2xl text-sm font-bold outline-none focus:border-indigo-400 min-h-[100px] shadow-inner" />
             )}

             {showAdvanced && (
               <div className="bg-slate-900 p-8 md:p-12 rounded-2xl animate-fade-in border-b-8 border-slate-950 space-y-12 overflow-hidden mt-12">
                 <div className="flex justify-between items-center text-indigo-400 border-b border-slate-800 pb-4">
                   <label className="text-xs font-black uppercase tracking-[0.2em]">Neural Batch Distribution</label>
                   <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Synthesis Pipeline &rarr;</span>
                 </div>
                 
                 <div className="flex flex-wrap gap-x-12 gap-y-12 items-end justify-center py-10">
                    {batches.map((b, i) => {
                      const isMixed = b.fitbs > 0 && b.mcqs > 0;
                      const minD = 50;
                      const maxD = 100;
                      const d = minD + (b.size / maxBatchSizeInConfig) * (maxD - minD);
                      
                      return (
                        <div key={i} className="flex flex-col items-center">
                          <div 
                            className="relative flex items-center justify-center rounded-full transition-all border-4 overflow-hidden shadow-lg"
                            style={{ 
                                width: `${d}px`, 
                                height: `${d}px`,
                                background: isMixed 
                                    ? '#78350f' 
                                    : (b.fitbs > 0 ? '#10b981' : '#f43f5e'),
                                borderColor: isMixed ? '#92400e' : (b.fitbs > 0 ? '#34d399' : '#fb7185')
                            }}
                          >
                             <span className="text-xl font-medium text-white tabular-nums">
                                {b.size}
                             </span>
                          </div>

                          <div className="w-px h-8 bg-slate-700/60 my-2"></div>

                          <div className="text-center w-full min-w-[60px]">
                            <span className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap">{b.label}</span>
                            <div className="flex flex-col items-center text-[8px] font-black text-slate-500 uppercase tracking-tighter mt-1">
                               {isMixed ? (
                                 <span>F:{b.fitbs}, M:{b.mcqs}</span>
                               ) : (
                                 <>
                                   {b.fitbs > 0 && <span>F:{b.fitbs}</span>}
                                   {b.mcqs > 0 && <span>M:{b.mcqs}</span>}
                                 </>
                               )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                 </div>

                 <div className="flex flex-col sm:flex-row justify-center items-center gap-10 pt-10 border-t border-slate-800">
                    <div className="flex items-center gap-4">
                       <div className="w-6 h-6 bg-emerald-500 rounded-full border-2 border-emerald-400" />
                       <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">FITB Cluster</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="w-6 h-6 bg-rose-500 rounded-full border-2 border-rose-400" />
                       <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">MCQ Cluster</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="w-6 h-6 bg-[#78350f] rounded-full border-2 border-[#92400e]" />
                       <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Mixed Block</span>
                    </div>
                    <div className="hidden sm:block w-px h-6 bg-slate-800" />
                    <div className="flex items-center gap-4 text-xs font-black text-slate-500 uppercase italic tracking-tighter">
                       Batch Scale Factor: {maxBatchSizeInConfig} Qs Unit
                    </div>
                 </div>
               </div>
             )}
          </div>

          {error && <div className="p-4 bg-rose-50 text-rose-600 text-[10px] font-black uppercase rounded-xl border-2 border-rose-400 text-center">{error}</div>}

          <Button onClick={startQuiz} isLoading={isGenerating} className="w-full py-6 text-2xl tracking-[0.4em] border-b-8">Forge Quiz</Button>
        </div>
      </div>
    </div>
  );
};
