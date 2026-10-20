import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Zap, 
  Terminal, 
  Sparkles, 
  Check, 
  Globe, 
  Layers, 
  Cpu, 
  Code2, 
  Server,
  ArrowRight
} from 'lucide-react';
import { ALL_LANGUAGES, LANGUAGE_CATEGORIES } from '../services/languagesRegistry';

export default function LanguageMatrixModal({
  isOpen,
  onClose,
  currentLanguage,
  onSelectLanguage
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 80);
    }
  }, [isOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered languages
  const filteredLanguages = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ALL_LANGUAGES.filter(lang => {
      const matchCat = activeCategory === 'all' || lang.category === activeCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        lang.name.toLowerCase().includes(q) ||
        lang.id.toLowerCase().includes(q) ||
        lang.extension.toLowerCase().includes(q) ||
        lang.version.toLowerCase().includes(q) ||
        lang.shellCmd.toLowerCase().includes(q) ||
        (lang.category && lang.category.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, activeCategory]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { all: ALL_LANGUAGES.length };
    ALL_LANGUAGES.forEach(l => {
      counts[l.category] = (counts[l.category] || 0) + 1;
    });
    return counts;
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-label="Universal 116+ Language Matrix"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <Layers size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Universal Compiler & Language Hub
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {ALL_LANGUAGES.length}+ Languages
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-cluster execution • Judge0 CE & Extra-CE • Zero-install in-browser runtimes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close modal (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Stats Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 116+ languages by name, extension, or compiler (e.g., rust, clang, python, net, go, wasm)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 px-2 sm:self-center">
            <Server size={14} className="text-emerald-400" />
            <span>Found <strong className="text-white">{filteredLanguages.length}</strong> environments</span>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-800/60 overflow-x-auto scrollbar-thin bg-slate-950/30">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🌟 All Languages ({categoryCounts.all})
          </button>
          {LANGUAGE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.name} ({categoryCounts[cat.id] || 0})
            </button>
          ))}
        </div>

        {/* Language Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 scrollbar-thin">
          {filteredLanguages.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              <Code2 size={40} className="mx-auto mb-3 text-slate-600 opacity-60" />
              <p className="text-base font-medium text-slate-300">No language matching "{searchQuery}"</p>
              <p className="text-xs text-slate-500 mt-1">Try searching by extension (e.g. .rs, .py, .cpp, .cs) or clear your filter.</p>
            </div>
          ) : (
            filteredLanguages.map(lang => {
              const isSelected = currentLanguage === lang.id;
              return (
                <div
                  key={lang.id}
                  onClick={() => {
                    onSelectLanguage(lang.id);
                    onClose();
                  }}
                  className={`group relative flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-800/40 hover:bg-slate-800/90 border-slate-700/60 hover:border-slate-500'
                  }`}
                >
                  {/* Top info */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl" role="img" aria-label={lang.name}>
                        {lang.icon || '⚡'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-900 border border-slate-700 text-cyan-300">
                          .{lang.extension}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500 text-white">
                            <Check size={10} /> Active
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-semibold text-sm text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {lang.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      v{lang.version}
                    </p>
                  </div>

                  {/* Shell command / runtime preview */}
                  <div className="mt-3 pt-2.5 border-t border-slate-700/40 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 truncate max-w-[150px] font-mono text-[10px]" title={lang.shellCmd}>
                      {lang.isClient ? '⚡ In-Browser V8' : lang.isExtra ? '🚀 Extra Cluster' : '🌐 Judge0 CE'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                      Select <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All 116+ Languages Production Ready
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline">Monaco Editor Syntax Highlighting Synced</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Esc</kbd> to exit
          </div>
        </div>
      </div>
    </div>
  );
}
