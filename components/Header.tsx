import React from 'react';
import { Sparkles, RefreshCcw } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, loading }) => {
  return (
    <header className="fixed w-full top-0 z-50 glass border-b border-white/50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-2 rounded-xl text-white shadow-lg shadow-brand-200">
            <Sparkles size={20} fill="currentColor" className="text-white/90" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">PetLead <span className="text-brand-600">Hub</span></h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">AI Intelligence System</p>
          </div>
        </div>
        
        <button 
          onClick={onRefresh}
          disabled={loading}
          className={`p-2.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all shadow-sm hover:shadow-md active:scale-95 ${loading ? 'animate-spin text-brand-600' : ''}`}
          title="Atualizar dados"
        >
          <RefreshCcw size={18} />
        </button>
      </div>
    </header>
  );
};