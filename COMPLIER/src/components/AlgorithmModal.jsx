import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  BookOpen, 
  Plus, 
  ArrowRight, 
  Copy, 
  Check, 
  Clock, 
  HardDrive, 
  Zap,
  Tag,
  Code2
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
  const [previewLanguage, setPreviewLanguage] = useState(() => {
    return ['python', 'cpp', 'java', 'javascript'].includes(currentLanguage) 
      ? currentLanguage 
      : 'python';
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
    '';

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
                  previewLanguage === 'java' ? 'java' : 'js';
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="algorithm-modal-card" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="algo-modal-header">
          <div className="algo-modal-title">
            <BookOpen size={20} className="algo-brand-icon" />
            <div>
              <h3>Algorithm & Data Structure Library</h3>
              <p className="algo-modal-subtitle">
                Curated, ready-to-run implementations across Python, C++, Java, & JavaScript
              </p>
            </div>
          </div>
          <button className="algo-close-btn" onClick={onClose} title="Close Library (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Modal Search & Filter Bar */}
        <div className="algo-filter-bar">
          <div className="algo-search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="algo-search-input"
              placeholder="Search algorithms, data structures, trees, dynamic programming..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Categories */}
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

        {/* Main Body: Master-Detail Layout */}
        <div className="algo-modal-body">
          {/* Left Column: Algorithm List */}
          <div className="algo-list-column">
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
                    onClick={() => setSelectedAlgoId(item.id)}
                  >
                    <div className="algo-item-top">
                      <span className="algo-item-name">{item.title}</span>
                      <span className={`difficulty-badge ${item.difficulty.toLowerCase()}`}>
                        {item.difficulty}
                      </span>
                    </div>
                    <p className="algo-item-desc">{item.description}</p>
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
            <div className="algo-detail-column">
              <div className="algo-detail-header">
                <div>
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
                  {['python', 'cpp', 'java', 'javascript'].map(lang => (
                    <button
                      key={lang}
                      className={`lang-pill-btn ${previewLanguage === lang ? 'active' : ''}`}
                      onClick={() => setPreviewLanguage(lang)}
                    >
                      {lang === 'python' ? 'Python' : lang === 'cpp' ? 'C++' : lang === 'java' ? 'Java' : 'JavaScript'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="algo-code-preview-wrap">
                <pre className="algo-code-preview">
                  <code>{currentSnippet}</code>
                </pre>
              </div>

              {/* Footer Actions */}
              <div className="algo-detail-footer">
                <button className="algo-copy-btn" onClick={handleCopy}>
                  {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>

                <div className="algo-cta-group">
                  <button className="algo-load-btn secondary" onClick={handleLoadCurrent}>
                    <span>Replace Current File</span>
                  </button>
                  <button className="algo-load-btn primary" onClick={handleOpenNewTab}>
                    <Plus size={14} />
                    <span>Open in New Tab</span>
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
