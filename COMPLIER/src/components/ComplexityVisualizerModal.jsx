import React, { useMemo } from 'react';
import { 
  LineChart, 
  Clock, 
  Cpu, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  X, 
  TrendingUp,
  Lightbulb,
  FileCode2
} from 'lucide-react';
import { analyzeComplexity } from '../services/complexityAnalyzer';

export default function ComplexityVisualizerModal({
  isOpen,
  onClose,
  code = '',
  language = 'python'
}) {
  const analysis = useMemo(() => {
    return analyzeComplexity(code, language);
  }, [code, language]);

  if (!isOpen) return null;

  // Pre-calculate SVG points for curves
  // Width 500, Height 240
  const curves = [
    { label: 'O(1)', color: '#10b981', points: '30,210 120,210 220,210 320,210 420,210 480,210' },
    { label: 'O(log N)', color: '#06b6d4', points: '30,210 120,200 220,185 320,175 420,165 480,158' },
    { label: 'O(N)', color: '#3b82f6', points: '30,210 120,180 220,140 320,100 420,60 480,35' },
    { label: 'O(N log N)', color: '#8b5cf6', points: '30,210 120,170 220,120 320,70 390,30 420,15' },
    { label: 'O(N²)', color: '#f59e0b', points: '30,210 80,180 140,120 180,60 210,20 220,15' },
    { label: 'O(2^N)', color: '#ef4444', points: '30,210 60,160 85,90 100,30 110,15' }
  ];

  return (
    <div className="s-tier-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="s-tier-modal-container complexity-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="s-tier-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge complexity-badge">
              <TrendingUp size={22} className="text-teal-400" />
            </div>
            <div>
              <div className="modal-title-row">
                <h2>Time & Space Complexity Visualizer</h2>
                <span className="s-tier-pill complexity-pill">Big-O Scalability Matrix</span>
              </div>
              <p className="modal-subtitle">Analytical asymptotic bounds, CPU time scaling, and memory stress simulation</p>
            </div>
          </div>
          <button className="s-tier-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="complexity-modal-body">
          {/* Complexity Scorecards */}
          <div className="complexity-cards-grid">
            <div className="comp-card time-card">
              <div className="comp-card-top">
                <div className="comp-icon-pill">
                  <Clock size={16} />
                  <span>Time Complexity</span>
                </div>
                <span className="comp-rating-badge">{analysis.timeRating}</span>
              </div>
              <div className="comp-big-val" style={{ color: analysis.timeColor }}>
                {analysis.timeComplexity}
              </div>
              <div className="comp-subtext">{analysis.timeNotation}</div>
            </div>

            <div className="comp-card space-card">
              <div className="comp-card-top">
                <div className="comp-icon-pill">
                  <Cpu size={16} />
                  <span>Space Complexity</span>
                </div>
                <span className="comp-rating-badge">{analysis.spaceRating}</span>
              </div>
              <div className="comp-big-val" style={{ color: analysis.spaceColor }}>
                {analysis.spaceComplexity}
              </div>
              <div className="comp-subtext">{analysis.spaceNotation}</div>
            </div>
          </div>

          {/* Interactive Scalability Chart */}
          <div className="comp-chart-section">
            <div className="chart-header">
              <h4>Asymptotic Scaling Curves vs Input Size N</h4>
              <div className="chart-legend">
                {curves.map(c => (
                  <span 
                    key={c.label} 
                    className={`legend-item ${analysis.timeComplexity === c.label ? 'legend-active' : ''}`}
                    style={{ borderColor: c.color }}
                  >
                    <span className="legend-dot" style={{ background: c.color }} />
                    <span style={{ color: c.color }}>{c.label}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="chart-svg-wrapper">
              <svg viewBox="0 0 520 240" className="comp-svg-chart">
                {/* Grid Lines */}
                <line x1="30" y1="210" x2="500" y2="210" stroke="#334155" strokeWidth="1.5" />
                <line x1="30" y1="20" x2="30" y2="210" stroke="#334155" strokeWidth="1.5" />
                <line x1="30" y1="140" x2="500" y2="140" stroke="#1e293b" strokeDasharray="4 4" />
                <line x1="30" y1="70" x2="500" y2="70" stroke="#1e293b" strokeDasharray="4 4" />

                {/* Reference Curves */}
                {curves.map(c => {
                  const isUserCurve = analysis.timeComplexity === c.label;
                  return (
                    <polyline
                      key={c.label}
                      fill="none"
                      stroke={c.color}
                      strokeWidth={isUserCurve ? 3.5 : 1.5}
                      strokeOpacity={isUserCurve ? 1 : 0.45}
                      points={c.points}
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* X Axis Labels */}
                <text x="30" y="230" fill="#64748b" fontSize="11">N=10</text>
                <text x="120" y="230" fill="#64748b" fontSize="11">100</text>
                <text x="220" y="230" fill="#64748b" fontSize="11">1,000</text>
                <text x="320" y="230" fill="#64748b" fontSize="11">10,000</text>
                <text x="420" y="230" fill="#64748b" fontSize="11">100k</text>
                <text x="480" y="230" fill="#64748b" fontSize="11">1M</text>

                {/* Y Axis Label */}
                <text x="10" y="20" fill="#64748b" fontSize="10" transform="rotate(-90 10,20)">Operations / Time</text>
              </svg>
            </div>
          </div>

          {/* Scaling Stress Simulation Table */}
          <div className="comp-simulation-table">
            <h4>CPU & Memory Stress Scaling Matrix</h4>
            <div className="table-responsive">
              <table className="scaling-table">
                <thead>
                  <tr>
                    <th>Input Size (N)</th>
                    <th>Operations Count</th>
                    <th>Estimated CPU Time</th>
                    <th>Memory Footprint</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.scalingData.map(row => (
                    <tr key={row.n}>
                      <td className="font-semibold text-sky-400">N = {row.nLabel}</td>
                      <td>{row.operations.toLocaleString()} ops</td>
                      <td>
                        <span className={`time-pill ${row.cpuTimeMs > 1000 ? 'time-danger' : ''}`}>
                          {row.cpuTimeMs} ms
                        </span>
                      </td>
                      <td>{row.memMb} MB</td>
                      <td>
                        <span className={`status-pill pill-${row.status.toLowerCase().replace(/[^a-z]/g, '')}`}>
                          {row.status === 'Pass' ? '✓ OK' : row.status === 'Heavy' ? '⚠️ Heavy' : '🛑 TLE Warning'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Optimization Suggestions */}
          <div className="comp-suggestions-section">
            <div className="suggestions-header">
              <Lightbulb size={16} className="text-amber-400" />
              <h4>AI Optimization Recommendations</h4>
            </div>
            <div className="suggestions-list">
              {analysis.suggestions.map(s => (
                <div key={s.id} className="suggestion-card">
                  <div className="sugg-title">{s.title}</div>
                  <div className="sugg-desc">{s.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
