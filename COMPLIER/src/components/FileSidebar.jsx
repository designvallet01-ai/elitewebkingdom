import React, { useState } from 'react';
import { 
  FolderTree, 
  FileCode2, 
  Plus, 
  BookOpen, 
  FileEdit, 
  Trash2, 
  X, 
  Check, 
  Edit3, 
  Code,
  Sparkles,
  FileText
} from 'lucide-react';

export default function FileSidebar({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onCloseFile,
  onRenameFile,
  onOpenTemplates,
  isOpen,
  onToggleSidebar,
  isMobile = false
}) {
  const [editingFileId, setEditingFileId] = useState(null);
  const [renameText, setRenameText] = useState('');

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

  const getLanguageColor = (lang) => {
    switch (lang) {
      case 'python': return '#3572A5';
      case 'cpp': return '#f34b7d';
      case 'c': return '#555555';
      case 'java': return '#b07219';
      case 'javascript': return '#f1e05a';
      case 'html': return '#e34c26';
      default: return '#8b949e';
    }
  };

  const getLanguageBadge = (lang) => {
    switch (lang) {
      case 'python': return 'PY';
      case 'cpp': return 'C++';
      case 'c': return 'C';
      case 'java': return 'JV';
      case 'javascript': return 'JS';
      case 'html': return 'HT';
      default: return 'TXT';
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="workspace-sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-title">
          <FolderTree size={16} className="sidebar-folder-icon" />
          <span>Workspace Files</span>
          <span className="file-count-badge">{files.length}</span>
        </div>

        <div className="sidebar-actions">
          <button
            className="sidebar-tool-btn"
            onClick={() => onCreateFile('file')}
            title="New Code File"
            id="sidebar-new-file-btn"
          >
            <Plus size={15} />
          </button>
          <button
            className="sidebar-tool-btn"
            onClick={onOpenTemplates}
            title="Algorithm & Template Library"
            id="sidebar-templates-btn"
          >
            <BookOpen size={15} />
          </button>
          {isMobile && (
            <button
              className="sidebar-tool-btn close-drawer-btn"
              onClick={onToggleSidebar}
              title="Close Drawer"
              id="sidebar-close-drawer-btn"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* File List */}
      <div className="sidebar-file-list">
        {files.map((file) => {
          const isActive = file.id === activeFileId;
          const isEditing = editingFileId === file.id;

          return (
            <div
              key={file.id}
              className={`sidebar-file-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectFile(file.id)}
              onDoubleClick={(e) => startRename(file, e)}
              title={`${file.name} (Double-click to rename)`}
            >
              <div className="file-item-left">
                <span 
                  className="file-type-pill" 
                  style={{ backgroundColor: `${getLanguageColor(file.language)}22`, color: getLanguageColor(file.language), borderColor: `${getLanguageColor(file.language)}55` }}
                >
                  {getLanguageBadge(file.language)}
                </span>

                {isEditing ? (
                  <div className="inline-rename-wrapper" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      className="inline-rename-input"
                      value={renameText}
                      onChange={e => setRenameText(e.target.value)}
                      onKeyDown={e => handleKeyDown(file.id, e)}
                      onBlur={() => submitRename(file.id)}
                      autoFocus
                    />
                    <button className="rename-confirm-btn" onClick={() => submitRename(file.id)}>
                      <Check size={12} />
                    </button>
                  </div>
                ) : (
                  <span className="file-item-name">{file.name}</span>
                )}
              </div>

              <div className="file-item-right">
                {file.isModified && <span className="unsaved-dot" title="Unsaved changes" />}

                {!isEditing && (
                  <div className="file-hover-actions">
                    <button
                      className="file-action-icon"
                      onClick={(e) => startRename(file, e)}
                      title="Rename file"
                    >
                      <Edit3 size={12} />
                    </button>
                    {files.length > 1 && (
                      <button
                        className="file-action-icon danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCloseFile(file.id);
                        }}
                        title="Close file"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Scratchpad & Algorithm CTA footer */}
      <div className="sidebar-footer">
        <button 
          className="sidebar-quick-btn" 
          onClick={() => onCreateFile('scratchpad')}
          title="Create a quick scratchpad session"
        >
          <FileText size={13} />
          <span>New Scratchpad</span>
        </button>
        <button 
          className="sidebar-quick-btn algo" 
          onClick={onOpenTemplates}
          title="Browse Curated Data Structures & Algorithms"
        >
          <Sparkles size={13} />
          <span>Templates Library</span>
        </button>
      </div>
    </aside>
  );
}
