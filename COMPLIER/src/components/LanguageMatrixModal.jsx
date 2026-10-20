import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Zap, 
  Layers, 
  Check, 
  Server,
  ArrowRight,
  Code2
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
    <div className="lang-matrix-overlay" onClick={onClose}>
      <div 
        className="lang-matrix-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Universal 116+ Language Matrix"
      >
        {/* Header */}
        <div className="lang-matrix-header">
          <div className="lang-matrix-header-left">
            <div className="lang-matrix-icon-box">
              <Layers size={22} />
            </div>
            <div>
              <div className="lang-matrix-title-row">
                <h2 className="lang-matrix-title">
                  Universal Compiler & Language Hub
                </h2>
                <span className="lang-matrix-count-badge">
                  {ALL_LANGUAGES.length}+ Languages
                </span>
              </div>
              <p className="lang-matrix-subtitle">
                Multi-cluster execution • Judge0 CE & Extra-CE • Zero-install browser runtimes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="lang-matrix-close-btn"
            title="Close modal (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Stats Bar */}
        <div className="lang-matrix-search-bar">
          <div className="lang-matrix-input-wrapper">
            <Search size={16} className="lang-matrix-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 116+ languages by name, extension, or compiler (e.g. rust, clang, python, net, go, zig, wasm)..."
              className="lang-matrix-input"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="lang-matrix-clear-btn"
              >
                Clear
              </button>
            )}
          </div>

          <div className="lang-matrix-stats-pill">
            <Server size={13} className="text-emerald" />
            <span>Showing <strong>{filteredLanguages.length}</strong> of {ALL_LANGUAGES.length}</span>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="lang-matrix-categories">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`lang-matrix-cat-pill ${activeCategory === 'all' ? 'active' : ''}`}
          >
            🌟 All ({categoryCounts.all})
          </button>
          {LANGUAGE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`lang-matrix-cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
            >
              {cat.name} ({categoryCounts[cat.id] || 0})
            </button>
          ))}
        </div>

        {/* Language Grid */}
        <div className="lang-matrix-grid">
          {filteredLanguages.length === 0 ? (
            <div className="lang-matrix-empty">
              <Code2 size={36} className="empty-icon" />
              <p className="empty-title">No language matching "{searchQuery}"</p>
              <p className="empty-desc">Try searching by file extension (e.g. .rs, .py, .cpp, .cs) or clear filter.</p>
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
                  className={`lang-matrix-card ${isSelected ? 'active' : ''}`}
                >
                  <div className="card-top">
                    <div className="card-icon-row">
                      <span className="card-emoji">{lang.icon || '⚡'}</span>
                      <div className="card-badges">
                        <span className="card-ext-badge">.{lang.extension}</span>
                        {isSelected && (
                          <span className="card-active-badge">
                            <Check size={10} /> Active
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="card-lang-name">{lang.name}</h3>
                    <p className="card-version">v{lang.version}</p>
                  </div>

                  <div className="card-bottom">
                    <span className="card-cluster-info" title={lang.shellCmd}>
                      {lang.isClient ? '⚡ In-Browser V8' : lang.isExtra ? '🚀 Extra Cluster' : '🌐 Judge0 CE'}
                    </span>
                    <span className="card-select-hint">
                      Select <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="lang-matrix-footer">
          <div className="footer-status">
            <span className="status-live-dot"></span>
            <span>All 116+ Languages Production Ready</span>
            <span className="footer-sep">•</span>
            <span>Monaco Syntax Highlight Synced</span>
          </div>
          <div className="footer-hint">
            Press <kbd>Esc</kbd> to exit
          </div>
        </div>
      </div>
    </div>
  );
}
