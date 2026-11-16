import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode2,
  FilePlus,
  FolderPlus,
  Trash2,
  Edit3,
  Search,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  RotateCcw,
  Sparkles,
  FileText
} from 'lucide-react';

export default function FileSidebar({
  files = [],
  activeFileId,
  onSelectFile,
  onCreateFile,
  onCloseFile,
  onRenameFile,
  onOpenTemplates,
  isOpen = true,
  onToggleSidebar,
  isMobile = false,
  projectName = 'elite-project',
  onProjectNameChange
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFileId, setEditingFileId] = useState(null);
  const [renameText, setRenameText] = useState('');
  const [openFolders, setOpenFolders] = useState({ src: true, tests: false });

  if (!isOpen) return null;

  const toggleFolder = (folderName) => {
    setOpenFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  const startRename = (file, e) => {
    e.stopPropagation();
    setEditingFileId(file.id);
    setRenameText(file.name);
  };

  const submitRename = (fileId) => {
    if (renameText.trim()) {
      onRenameFile(fileId, renameText.trim());
    }
    setEditingFileId(null);
  };

  const handleKeyDown = (fileId, e) => {
    if (e.key === 'Enter') {
      submitRename(fileId);
    } else if (e.key === 'Escape') {
      setEditingFileId(null);
    }
  };

  // Helper: File Icon and Color by Extension
  const getFileBadge = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'py': return { label: 'PY', color: '#38bdf8' };
      case 'cpp':
      case 'cc': return { label: 'C++', color: '#f43f5e' };
      case 'c': return { label: 'C', color: '#94a3b8' };
      case 'java': return { label: 'JV', color: '#f59e0b' };
      case 'js':
      case 'jsx': return { label: 'JS', color: '#facc15' };
      case 'ts':
      case 'tsx': return { label: 'TS', color: '#60a5fa' };
      case 'html': return { label: 'HT', color: '#fb923c' };
      case 'css': return { label: 'CS', color: '#38bdf8' };
      case 'sql': return { label: 'SQL', color: '#c084fc' };
      case 'json': return { label: 'JSON', color: '#34d399' };
      case 'rs': return { label: 'RS', color: '#f87171' };
      case 'go': return { label: 'GO', color: '#2dd4bf' };
      case 'md': return { label: 'MD', color: '#94a3b8' };
      default: return { label: 'TXT', color: '#64748b' };
    }
  };

  const filteredFiles = files.filter(f =>
    !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="elite-file-explorer" aria-label="Project Explorer">
      {/* Explorer Top Header */}
      <div className="explorer-header">
        <div className="explorer-title">
          <span>EXPLORER</span>
        </div>
        <div className="explorer-header-actions">
          <button
            type="button"
            className="explorer-action-btn"
            onClick={() => onCreateFile('file')}
            title="New File"
          >
            <FilePlus size={14} />
          </button>
          <button
            type="button"
            className="explorer-action-btn"
            onClick={() => {
              const folderName = prompt('Enter folder name (e.g. components, utils):');
              if (folderName) {
                onCreateFile('file', `${folderName}/script.py`);
              }
            }}
            title="New Folder"
          >
            <FolderPlus size={14} />
          </button>
          <button
            type="button"
            className="explorer-action-btn"
            onClick={onOpenTemplates}
            title="Algorithm & DSA Starter Templates"
          >
            <Sparkles size={14} />
          </button>
        </div>
      </div>

      {/* Explorer Quick Search Filter */}
      <div className="explorer-search-bar">
        <Search size={13} className="text-slate-400" />
        <input
          type="text"
          className="explorer-search-input font-mono"
          placeholder="Filter files (e.g. main.py)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery('')} className="explorer-search-clear">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Root Project Tree */}
      <div className="explorer-tree-body">
        {/* Project Root Folder */}
        <div className="tree-project-root">
          <div
            className="tree-folder-row"
            onClick={() => toggleFolder('root')}
          >
            {openFolders.root !== false ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {openFolders.root !== false ? <FolderOpen size={15} className="folder-icon text-blue-400" /> : <Folder size={15} className="folder-icon text-blue-400" />}
            <span className="font-semibold text-slate-200 text-xs tracking-wide uppercase">{projectName}</span>
            <span className="tree-badge-count">{files.length}</span>
          </div>

          {openFolders.root !== false && (
            <div className="tree-children-container">
              {filteredFiles.length === 0 ? (
                <div className="explorer-empty-files text-xs text-slate-500 italic p-3">
                  {searchQuery ? `No files matching "${searchQuery}"` : 'No files in workspace'}
                </div>
              ) : (
                filteredFiles.map((file) => {
                  const badge = getFileBadge(file.name);
                  const isEditing = editingFileId === file.id;
                  const isActive = activeFileId === file.id;

                  return (
                    <div
                      key={file.id}
                      className={`tree-file-row ${isActive ? 'active' : ''}`}
                      onClick={() => onSelectFile(file.id)}
                      title={file.name}
                    >
                      <span
                        className="file-type-pill font-mono"
                        style={{ color: badge.color, borderColor: `${badge.color}40`, backgroundColor: `${badge.color}15` }}
                      >
                        {badge.label}
                      </span>

                      {isEditing ? (
                        <input
                          type="text"
                          className="tree-rename-input font-mono"
                          value={renameText}
                          onChange={(e) => setRenameText(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(file.id, e)}
                          onBlur={() => submitRename(file.id)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="tree-file-name font-mono truncate">{file.name}</span>
                      )}

                      {/* File Item Hover Actions */}
                      <div className="tree-file-actions">
                        {!isEditing && (
                          <button
                            type="button"
                            className="tree-action-btn"
                            onClick={(e) => startRename(file, e)}
                            title="Rename File"
                          >
                            <Edit3 size={12} />
                          </button>
                        )}
                        {files.length > 1 && (
                          <button
                            type="button"
                            className="tree-action-btn delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCloseFile(file.id);
                            }}
                            title="Delete File"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
