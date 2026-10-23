import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  BookOpen, 
  Plus, 
  ArrowRight, 
  ArrowLeft, 
  Copy, 
  Check, 
  Clock, 
  HardDrive, 
  Zap, 
  Code2, 
  ListFilter, 
  FileCode2,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { ALGORITHMS, ALGORITHM_CATEGORIES } from '../data/algorithmsLibrary';

export default function AlgorithmModal({
  isOpen,
  onClose,
  onOpenInNewTab,
  onLoadIntoCurrent,
  currentLanguage = 'python'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAlgoId, setSelectedAlgoId] = useState(ALGORITHMS[0]?.id || 'bst');
  const [mobileTab, setMobileTab] = useState('list'); // 'list' | 'preview'
  const [previewLanguage, setPreviewLanguage] = useState(() => {
    return ['python', 'cpp', 'java', 'javascript', 'matlab'].includes(currentLanguage) 
      ? currentLanguage 
      : (currentLanguage === 'octave' ? 'matlab' : 'python');
  });
  const [copied, setCopied] = useState(false);

  // Filtered algorithms
  const filteredAlgorithms = useMemo(() => {
    return ALGORITHMS.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const selectedAlgo = useMemo(() => {
    return ALGORITHMS.find(a => a.id === selectedAlgoId) || filteredAlgorithms[0] || ALGORITHMS[0];
  }, [selectedAlgoId, filteredAlgorithms]);

  // Code snippet for currently selected language
  const currentSnippet = selectedAlgo?.code?.[previewLanguage] || 
    selectedAlgo?.code?.python || 
    selectedAlgo?.code?.cpp || 
    selectedAlgo?.code?.matlab ||
    '';

  const codeLines = useMemo(() => {
    return currentSnippet ? currentSnippet.split('\n') : [];
  }, [currentSnippet]);

  const handleCopy = () => {
    if (!currentSnippet) return;
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleOpenNewTab = () => {
    if (onOpenInNewTab && selectedAlgo) {
      const ext = previewLanguage === 'python' ? 'py' : 
                  previewLanguage === 'cpp' ? 'cpp' : 
                  previewLanguage === 'java' ? 'java' : 
                  previewLanguage === 'matlab' ? 'm' : 'js';
      const fileName = `${selectedAlgo.id}_demo.${ext}`;
      onOpenInNewTab(fileName, currentSnippet, previewLanguage);
      onClose();
    }
  };

  const handleLoadCurrent = () => {
    if (onLoadIntoCurrent && selectedAlgo) {
      onLoadIntoCurrent(currentSnippet, previewLanguage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop algo-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className={`algorithm-modal-card mobile-active-${mobileTab}`} onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={`algo-modal-header ${mobileTab === 'preview' ? 'mobile-preview-header' : ''}`}>
          <div className="algo-header-left">
            {/* Mobile Back Button visible only when in preview tab */}
            <button 
              type="button" 
              className="algo-mobile-back-header-btn"
              onClick={() => setMobileTab('list')}
              aria-label="Back to Algorithm list"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <div className="algo-modal-title">
              <BookOpen size={20} className="algo-brand-icon" />
              <div>
                <div className="flex items-center gap-2">
                  <h3>{mobileTab === 'preview' ? (selectedAlgo?.title || 'Code Preview') : 'Algorithm Library'}</h3>
                  <span className="algo-count-badge">
                    {mobileTab === 'preview' ? selectedAlgo?.difficulty : `${filteredAlgorithms.length} Templates`}
                  </span>
                </div>
                <p className="algo-modal-subtitle">
                  {mobileTab === 'preview' 
                    ? `Time: ${selectedAlgo?.timeComplexity || 'O(N)'} • Space: ${selectedAlgo?.spaceComplexity || 'O(1)'}`
                    : 'Curated, ready-to-run DSA implementations across Python, C++, Java, JS & MATLAB'}
                </p>
              </div>
            </div>
          </div>

          <button className="algo-close-btn" onClick={onClose} title="Close Library (Esc)" aria-label="Close Modal">
            <X size={18} />
          </button>
        </div>

        {/* Search & Filter Bar (Only visible on mobile when mobileTab === 'list', always on desktop) */}
        <div className={`algo-filter-bar ${mobileTab === 'preview' ? 'mobile-hide-filter' : ''}`}>
          <div className="algo-search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="algo-search-input"
              placeholder="Search algorithms, data structures, trees, graphs, sorting..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus={mobileTab === 'list'}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')} aria-label="Clear Search">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Categories Horizontal Chip Row */}
          <div className="algo-category-tabs">
            {ALGORITHM_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`algo-cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile View Switcher Tab (Mobile Only) */}
        <div className="algo-mobile-view-tabs" role="tablist">
          <button 
            type="button"
            role="tab"
            aria-selected={mobileTab === 'list'}
            className={`algo-mobile-tab-btn ${mobileTab === 'list' ? 'active' : ''}`}
            onClick={() => setMobileTab('list')}
          >
            <ListFilter size={14} />
            <span>Browse Algorithms ({filteredAlgorithms.length})</span>
          </button>
          <button 
            type="button"
            role="tab"
            aria-selected={mobileTab === 'preview'}
            className={`algo-mobile-tab-btn ${mobileTab === 'preview' ? 'active' : ''}`}
            onClick={() => setMobileTab('preview')}
          >
            <FileCode2 size={14} />
            <span>Code Preview {selectedAlgo ? `• ${selectedAlgo.title.split(' ')[0]}` : ''}</span>
          </button>
        </div>

        {/* Main Body */}
        <div className={`algo-modal-body mobile-view-${mobileTab}`}>
          {/* Left Column: Algorithm List */}
          <div className={`algo-list-column ${mobileTab === 'list' ? 'mobile-visible' : 'mobile-hidden'}`}>
            {filteredAlgorithms.length === 0 ? (
              <div className="algo-empty-state">
                <p>No algorithms found matching "{searchQuery}"</p>
                <button 
                  className="reset-filter-link"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                >
                  Reset filters
                </button>
              </div>
            ) : (
              filteredAlgorithms.map(item => {
                const isSelected = selectedAlgo?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={`algo-item-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedAlgoId(item.id);
                      setMobileTab('preview');
                    }}
                  >
                    <div className="algo-item-top">
                      <span className="algo-item-name">{item.title}</span>
                      <div className="flex items-center gap-1">
                        <span className={`difficulty-badge ${item.difficulty.toLowerCase()}`}>
                          {item.difficulty}
                        </span>
                        <ChevronRight size={14} className="algo-arrow-icon" />
                      </div>
                    </div>
                    
                    <p className="algo-item-desc">{item.description}</p>
                    
                    {/* Complexity Strip right on card */}
                    <div className="algo-card-complexity-strip">
                      <span className="complexity-badge-mini">
                        <Clock size={11} /> {item.timeComplexity}
                      </span>
                      <span className="complexity-badge-mini">
                        <HardDrive size={11} /> {item.spaceComplexity}
                      </span>
                    </div>

                    <div className="algo-item-tags">
                      {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="algo-tag">#{tag}</span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Detail & Code Preview */}
          {selectedAlgo && (
            <div className={`algo-detail-column ${mobileTab === 'preview' ? 'mobile-visible' : 'mobile-hidden'}`}>
              <div className="algo-detail-header">
                <div className="algo-detail-meta">
                  <h4 className="algo-detail-title">{selectedAlgo.title}</h4>
                  <div className="algo-complexity-row">
                    <span className="complexity-badge">
                      <Clock size={12} />
                      Time: {selectedAlgo.timeComplexity}
                    </span>
                    <span className="complexity-badge">
                      <HardDrive size={12} />
                      Space: {selectedAlgo.spaceComplexity}
                    </span>
                  </div>
                </div>

                {/* Language Switcher Tabs */}
                <div className="algo-lang-pills">
                  {['python', 'cpp', 'java', 'javascript', 'matlab'].map(lang => (
                    <button
                      key={lang}
                      className={`lang-pill-btn ${previewLanguage === lang ? 'active' : ''}`}
                      onClick={() => setPreviewLanguage(lang)}
                    >
                      {lang === 'python' ? 'Python' : 
                       lang === 'cpp' ? 'C++' : 
                       lang === 'java' ? 'Java' : 
                       lang === 'javascript' ? 'JavaScript' : 'MATLAB'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Snippet Box with Line Numbers */}
              <div className="algo-code-preview-wrap">
                <div className="algo-code-header-bar">
                  <span className="algo-code-lang-label">
                    <Code2 size={13} />
                    <span>{previewLanguage.toUpperCase()} IMPLEMENTATION</span>
                  </span>
                  <button className="algo-copy-icon-btn" onClick={handleCopy} title="Copy Code">
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                
                <div className="algo-code-lines-container">
                  {codeLines.map((line, idx) => (
                    <div key={idx} className="algo-code-row">
                      <span className="algo-line-number">{idx + 1}</span>
                      <span className="algo-line-text">{line || ' '}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="algo-detail-footer">
                <button className="algo-copy-btn" onClick={handleCopy} title="Copy Code Snippet">
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
                </button>

                <div className="algo-cta-group">
                  <button className="algo-load-btn secondary" onClick={handleLoadCurrent} title="Replace editor with this algorithm">
                    <ArrowUpRight size={14} />
                    <span>Load to File</span>
                  </button>
                  <button className="algo-load-btn primary" onClick={handleOpenNewTab} title="Create new tab with this algorithm">
                    <Plus size={14} />
                    <span>Open New Tab</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
