import React from 'react';

interface DebugModalProps {
  show: boolean;
  passcodeInput: string;
  debugError: boolean;
  onClose: () => void;
  onPasscodeChange: (val: string) => void;
  onSubmit: () => void;
}

export const DebugModal: React.FC<DebugModalProps> = ({
  show,
  passcodeInput,
  debugError,
  onClose,
  onPasscodeChange,
  onSubmit
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="paper-card w-full max-w-md p-8 rounded-2xl border-4 relative overflow-hidden">
        <div className="mb-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Security Challenge</h3>
          <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Enter Bypass Code</p>
        </div>
        
        <input 
          type="password"
          value={passcodeInput}
          autoFocus
          onChange={(e) => onPasscodeChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          className={`w-full px-6 py-4 rounded-xl border-4 outline-none font-black text-xl tracking-widest transition-all ${debugError ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-slate-300 bg-slate-50 focus:border-indigo-600 focus:bg-white'}`}
          placeholder="••••••••"
        />
        
        {debugError && <p className="text-[10px] font-black text-rose-500 uppercase mt-2 tracking-widest animate-pulse">Access Denied: Check Key</p>}

        <div className="mt-8 flex gap-4">
           <button 
            onClick={onClose}
            className="flex-1 py-3 border-4 border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
           >
             Cancel
           </button>
           <button 
            onClick={onSubmit}
            className="flex-[2] py-3 bg-indigo-600 text-white border-4 border-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(79,70,229,1)] active:translate-y-1 active:shadow-none transition-all"
           >
             Inject Samples
           </button>
        </div>
      </div>
    </div>
  );
};