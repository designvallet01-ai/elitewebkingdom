import React, { useState } from 'react';
import { 
  Sparkles, 
  Wrench, 
  Check, 
  X, 
  AlertTriangle, 
  Play, 
  ArrowRight, 
  Copy, 
  FileCode2,
  Cpu,
  Layers,
  ShieldCheck
} from 'lucide-react';

export default function AiErrorFixModal({
  isOpen,
  onClose,
  healingData,
  onApplyFix,
  onApplyAndRun
}) {
  const [selectedModel, setSelectedModel] = useState('Gemini 1.5 Pro (Recommended)');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !healingData) return null;

  const handleCopyFixedCode = () => {
    navigator.clipboard.writeText(healingData.fixedCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const severityColor = 
    healingData.severity === 'CRITICAL' ? 'border-rose-500/50 bg-rose-950/30 text-rose-400' :
    healingData.severity === 'HIGH' ? 'border-amber-500/50 bg-amber-950/30 text-amber-400' :
    'border-sky-500/50 bg-sky-950/30 text-sky-400';

  return (
    <div className="elite-modal-backdrop" onClick={onClose}>
      <div 
        className="elite-modal-card ai-healer-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px', width: '92%' }}
      >
        {/* Modal Header */}
        <div className="elite-modal-header" style={{ borderBottom: '1px solid #1e293b' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/30 border border-indigo-500/30 text-indigo-400">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">Elite AI Code Doctor</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AUTONOMOUS AGENT
                </span>
              </div>
              <p className="text-xs text-slate-400">Root-cause diagnosis & 1-click AST repair engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-xs bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option>Gemini 1.5 Pro (Recommended)</option>
              <option>Claude 3.5 Sonnet</option>
              <option>DeepSeek Coder V2</option>
              <option>GPT-4o Agent</option>
            </select>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Diagnostic Badge Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${severityColor}`}>
                {healingData.severity || 'ERROR'}
              </span>
              <span className="text-sm font-semibold text-slate-200">
                {healingData.errorType}
              </span>
            </div>

            {healingData.problemLine && (
              <span className="text-xs font-mono px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Found on Line #{healingData.problemLine}
              </span>
            )}
          </div>

          {/* Root Cause Explanations (Dual English + Telugu) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block mb-1">
                Root Cause (English)
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {healingData.rootCauseEn}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                సమస్య వివరణ (Telugu)
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {healingData.rootCauseTe}
              </p>
            </div>
          </div>

          {/* Fix Summary */}
          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-indigo-300">Action Plan: </strong>
              <span>{healingData.fixSummaryEn} ({healingData.fixSummaryTe})</span>
            </div>
          </div>

          {/* Repaired Code Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-semibold flex items-center gap-1.5">
                <FileCode2 size={14} className="text-amber-400" />
                Proposed Repaired Code (AST Diff applied)
              </span>
              <button 
                onClick={handleCopyFixedCode}
                className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-3 max-h-56 overflow-auto font-mono text-xs text-slate-200 leading-relaxed shadow-inner">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {healingData.fixedCode}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            Dismiss
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onApplyFix(healingData.fixedCode);
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              <Wrench size={14} />
              <span>Apply Fix to Editor</span>
            </button>

            <button
              onClick={() => {
                if (onApplyAndRun) {
                  onApplyAndRun(healingData.fixedCode);
                } else {
                  onApplyFix(healingData.fixedCode);
                }
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-950"
            >
              <Play size={13} fill="currentColor" />
              <span>Apply & Re-Run Instantly ↵</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
