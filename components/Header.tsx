import React from 'react';

interface HeaderProps {
  version: string;
}

export const Header: React.FC<HeaderProps> = ({ version }) => (
  <header className="mb-12 text-center animate-fade-in">
    <h1 className="text-6xl md:text-8xl font-extrabold text-slate-900 mb-2 tracking-tighter">
      Quiz<span className="text-indigo-600">Forge</span>
    </h1>
    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] mb-8">
      Advanced MCQ Synthesis Engine | <span className="text-indigo-600">{version}</span>
    </p>
  </header>
);