import React, { useState } from 'react';
import { 
  GitCommit, 
  GitBranch, 
  GitPullRequest, 
  Download, 
  Upload, 
  RefreshCw, 
  Check, 
  X, 
  FileCode, 
  FolderGit2, 
  History, 
  Plus, 
  ArrowRight,
  ExternalLink,
  Shield,
  Layers
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
  const [currentBranch, setCurrentBranch] = useState('main');
  const [repoUrl, setRepoUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [cloneError, setCloneError] = useState('');
  const [commitHistory, setCommitHistory] = useState([
    {
      hash: 'a1b8c4d',
      message: 'chore: initial project template workspace',
      author: 'Developer',
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

  // Download Workspace as JSON/Archive
  const handleDownloadWorkspace = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(files, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `elite_ide_workspace_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Mock GitHub Clone
  const handleCloneRepo = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsCloning(true);
    setCloneError('');

    try {
      // Extract owner and repo from URL (e.g., https://github.com/owner/repo)
      let cleaned = repoUrl.replace('https://github.com/', '').replace('.git', '').trim();
      const parts = cleaned.split('/');

      if (parts.length < 2) {
        throw new Error('Please enter a valid GitHub repository URL (e.g. https://github.com/owner/repo)');
      }

      const [owner, repo] = parts;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;

      const res = await fetch(apiUrl);
      if (!res.ok) {
        throw new Error(`GitHub API returned status ${res.status}. (Ensure repo is public or rate limit not reached)`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Repository contents could not be parsed.');
      }

      // Filter text/code files
      const newFiles = [];
      for (const item of data.slice(0, 5)) {
        if (item.type === 'file') {
          newFiles.push({
            id: `git-${item.name}-${Date.now()}`,
            name: item.name,
            code: `// Cloned from GitHub: ${owner}/${repo}/${item.name}\n// Loading remote buffer...`,
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
    <div className="elite-modal-backdrop" onClick={onClose}>
      <div 
        className="elite-modal-card git-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '750px', width: '92%' }}
      >
        {/* Modal Header */}
        <div className="elite-modal-header" style={{ borderBottom: '1px solid #1e293b' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sky-400">
              <FolderGit2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">Version Control</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-sky-400 border border-slate-700 flex items-center gap-1">
                  <GitBranch size={11} /> {currentBranch}
                </span>
              </div>
              <p className="text-xs text-slate-400">Git commit engine, branch tracker & GitHub repository cloner</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 px-5 pt-3 gap-3 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('changes')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'changes' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitCommit size={14} />
            <span>Changes ({files.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'history' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History size={14} />
            <span>Commit History ({commitHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('clone')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'clone' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download size={14} />
            <span>Clone GitHub Repo</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* TAB 1: CHANGES & COMMIT */}
          {activeTab === 'changes' && (
            <div className="space-y-4">
              {/* Commit form */}
              <form onSubmit={handleCommit} className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Commit Staged Workspace Changes:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="e.g., feat: optimize sorting algorithm complexity..."
                    className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={!commitMessage.trim()}
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    <GitCommit size={14} />
                    <span>Commit</span>
                  </button>
                </div>
              </form>

              {commitSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
                  <Check size={14} />
                  <span>Changes committed successfully to {currentBranch} HEAD!</span>
                </div>
              )}

              {/* File list */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-400 block px-1">
                  Workspace Files:
                </span>
                <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                  {files.map((file) => (
                    <div key={file.id} className="p-3 flex items-center justify-between hover:bg-slate-800/40 transition">
                      <div className="flex items-center gap-2.5">
                        <FileCode size={15} className="text-sky-400" />
                        <span className="text-xs font-mono text-slate-200">{file.name}</span>
                        <span className="text-[10px] text-slate-500 uppercase">{file.language}</span>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
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
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 block px-1">
                Branch Log ({currentBranch}):
              </span>
              <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                {commitHistory.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-start justify-between hover:bg-slate-800/40 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-400 border border-sky-800/40">
                          {item.hash}
                        </span>
                        <p className="text-xs font-semibold text-slate-200">{item.message}</p>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Committed by {item.author} • {item.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CLONE GITHUB REPOSITORY */}
          {activeTab === 'clone' && (
            <div className="space-y-4">
              <form onSubmit={handleCloneRepo} className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">
                  GitHub Public Repository URL:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/octocat/Hello-World"
                    className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={isCloning || !repoUrl.trim()}
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    {isCloning ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                    <span>{isCloning ? 'Cloning...' : 'Clone'}</span>
                  </button>
                </div>
              </form>

              {cloneError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-400">
                  {cloneError}
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Codespaces Framework Info:</p>
                <p>Loads public repositories from GitHub directly into your Elite IDE workspace tab matrix for offline inspection and execution.</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleDownloadWorkspace}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Download size={13} />
            <span>Export Workspace (JSON)</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
