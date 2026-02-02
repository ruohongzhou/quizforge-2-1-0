import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "relative px-8 py-4 rounded-xl font-black text-sm uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] border-4";
  
  const variants = {
    primary: "bg-indigo-600 text-white border-indigo-700 shadow-[6px_6px_0px_0px_rgba(79,70,229,0.3)] hover:shadow-[8px_8px_0px_0px_rgba(79,70,229,0.4)]",
    secondary: "bg-white text-slate-900 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,0.1)] hover:bg-slate-50",
    danger: "bg-rose-600 text-white border-rose-700 shadow-[6px_6px_0px_0px_rgba(225,29,72,0.3)] hover:shadow-[8px_8px_0px_0px_rgba(225,29,72,0.4)]",
    ghost: "bg-transparent text-slate-700 border-transparent hover:bg-slate-200/50 hover:text-slate-900",
    glass: "glass text-indigo-700 border-indigo-200 hover:bg-white shadow-[6px_6px_0px_0px_rgba(79,70,229,0.1)]"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      <span className={isLoading ? 'opacity-0' : 'opacity-100'}>{children}</span>
      {isLoading && <span className="absolute inset-0 flex items-center justify-center font-black">SYNTHESIZING</span>}
    </button>
  );
};