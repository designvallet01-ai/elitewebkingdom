import React, { useState } from 'react';
import { 
  GitCommit, 
  GitBranch, 
  Download, 
  RefreshCw, 
  Check, 
  X, 
  FileCode, 
  FolderGit2, 
  History
} from 'lucide-react';

export default function GitControlModal({
  isOpen,
  onClose,
  files = [],
  activeFile,
  onUpdateFileCode,
  onAddFiles
}) {
  const [activeTab, setActiveTab] = useState('changes'); // 'changes' | 'history' | 'clone'
  const [commitMessage, setCommitMessage] = useState('');
  const [currentBranch] = useState('main');
  const [repoUrl, setRepoUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [cloneError, setCloneError] = useState('');
  const [commitHistory, setCommitHistory] = useState([
    {
      hash: 'a1b8c4d',
      message: 'chore: initial project workspace setup',
      author: 'Gowri Narayana (Elite IDE)',
      date: 'Just now'
    }
  ]);
  const [commitSuccess, setCommitSuccess] = useState(false);

  if (!isOpen) return null;

  // Handle Commit
  const handleCommit = (e) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;

    const newCommit = {
      hash: Math.random().toString(36).substring(2, 9),
      message: commitMessage.trim(),
      author: 'Gowri Narayana (Elite IDE)',
      date: new Date().toLocaleTimeString()
    };

    setCommitHistory([newCommit, ...commitHistory]);
    setCommitMessage('');
    setCommitSuccess(true);
    setTimeout(() => setCommitSuccess(false), 2500);
  };

  // Download Workspace
  const handleDownloadWorkspace = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(files, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `elite_ide_workspace_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // GitHub Clone
  const handleCloneRepo = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsCloning(true);
    setCloneError('');

    try {
      let cleaned = repoUrl.replace('https://github.com/', '').replace('.git', '').trim();
      const parts = cleaned.split('/');

      if (parts.length < 2) {
        throw new Error('Please enter a valid GitHub repository URL (e.g. https://github.com/owner/repo)');
      }

      const [owner, repo] = parts;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;

      const res = await fetch(apiUrl);
      if (!res.ok) {
        throw new Error(`GitHub API responded with status ${res.status}. Ensure repo is public.`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Repository contents could not be parsed.');
      }

      const newFiles = [];
      for (const item of data.slice(0, 5)) {
        if (item.type === 'file') {
          newFiles.push({
            id: `git-${item.name}-${Date.now()}`,
            name: item.name,
            code: `// Cloned from GitHub: ${owner}/${repo}/${item.name}\n// Ready for execution in Elite IDE!`,
            language: item.name.endsWith('.py') ? 'python' : item.name.endsWith('.js') ? 'javascript' : item.name.endsWith('.cpp') ? 'cpp' : 'c',
            isModified: false
          });
        }
      }

      if (newFiles.length > 0 && onAddFiles) {
        onAddFiles(newFiles);
        setActiveTab('changes');
      } else {
        throw new Error('No compatible code files found in repository root.');
      }

    } catch (err) {
      setCloneError(err.message || 'Clone failed');
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="git-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="git-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="git-modal-header">
          <div className="git-modal-header-left">
            <div className="git-icon-badge">
              <FolderGit2 size={20} />
            </div>
            <div className="git-modal-title-wrap">
              <h3>
                <span>Version Control Matrix</span>
                <span className="git-branch-tag">
                  <GitBranch size={11} /> {currentBranch}
                </span>
              </h3>
              <p>Git commit engine, branch tracker & GitHub repository cloner</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="ai-modal-close-btn"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Tab Bar */}
        <div className="git-tabs-bar">
          <button
            type="button"
            onClick={() => setActiveTab('changes')}
            className={`git-tab-item ${activeTab === 'changes' ? 'active' : ''}`}
          >
            <GitCommit size={14} />
            <span>Workspace Changes ({files.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`git-tab-item ${activeTab === 'history' ? 'active' : ''}`}
          >
            <History size={14} />
            <span>Commit History ({commitHistory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clone')}
            className={`git-tab-item ${activeTab === 'clone' ? 'active' : ''}`}
          >
            <Download size={14} />
            <span>Clone GitHub Repo</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="git-modal-body">
          {/* TAB 1: CHANGES & COMMIT */}
          {activeTab === 'changes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <form onSubmit={handleCommit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>
                  Commit Staged Workspace Changes:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="e.g., feat: optimize binary search time complexity..."
                    className="git-input-box"
                  />
                  <button
                    type="submit"
                    disabled={!commitMessage.trim()}
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      opacity: !commitMessage.trim() ? 0.5 : 1
                    }}
                  >
                    <GitCommit size={14} />
                    <span>Commit</span>
                  </button>
                </div>
              </form>

              {commitSuccess && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Check size={14} />
                  <span>Changes committed successfully to {currentBranch} HEAD!</span>
                </div>
              )}

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Tracked Files in Workspace:
                </span>
                <div className="git-file-list">
                  {files.map((file) => (
                    <div key={file.id} className="git-file-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileCode size={15} style={{ color: '#38bdf8' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', color: '#f1f5f9' }}>
                          {file.name}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>
                          {file.language}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '0.68rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.25)'
                      }}>
                        TRACKED
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMMIT HISTORY */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
                Branch History ({currentBranch}):
              </span>
              <div className="git-file-list">
                {commitHistory.map((item, idx) => (
                  <div key={idx} className="git-file-row" style={{ alignItems: 'flex-start', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontFamily: 'JetBrains Mono, monospace',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.3)'
                        }}>
                          {item.hash}
                        </span>
                        <strong style={{ fontSize: '0.85rem', color: '#f1f5f9' }}>{item.message}</strong>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        By {item.author} • {item.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CLONE GITHUB REPOSITORY */}
          {activeTab === 'clone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <form onSubmit={handleCloneRepo} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>
                  GitHub Public Repository URL:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/octocat/Hello-World"
                    className="git-input-box"
                  />
                  <button
                    type="submit"
                    disabled={isCloning || !repoUrl.trim()}
                    style={{
                      background: '#6366f1',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      opacity: isCloning || !repoUrl.trim() ? 0.5 : 1
                    }}
                  >
                    {isCloning ? <RefreshCw size={14} className="spin-fast" /> : <Download size={14} />}
                    <span>{isCloning ? 'Cloning...' : 'Clone'}</span>
                  </button>
                </div>
              </form>

              {cloneError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#fb7185',
                  fontSize: '0.8rem'
                }}>
                  {cloneError}
                </div>
              )}

              <div style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.78rem',
                color: '#94a3b8',
                lineHeight: 1.5
              }}>
                <strong style={{ color: '#cbd5e1' }}>GitHub Codespaces Framework:</strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  Loads public repositories from GitHub directly into your Elite IDE workspace for real-time inspection, editing, and compilation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="git-modal-footer">
          <button
            type="button"
            onClick={handleDownloadWorkspace}
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={13} />
            <span>Export Workspace (JSON)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="ai-btn-dismiss"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
