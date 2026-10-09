import React from 'react';
import { 
  Play, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Trophy, 
  Sparkles, 
  Flame, 
  ChevronDown, 
  Palette,
  RotateCcw
} from 'lucide-react';

const LANGUAGES = [
  { id: 'python', label: 'Python 3.11', icon: '🐍' },
  { id: 'javascript', label: 'JavaScript (Node 24)', icon: '⚡' },
  { id: 'cpp', label: 'C++ (G++)', icon: '⚙️' },
  { id: 'c', label: 'C (GCC)', icon: '🔧' },
  { id: 'java', label: 'Java (OpenJDK 17)', icon: '☕' },
  { id: 'typescript', label: 'TypeScript', icon: '🔷' },
  { id: 'rust', label: 'Rust', icon: '🦀' },
  { id: 'go', label: 'Go', icon: '🥊' },
  { id: 'html', label: 'HTML / CSS / JS Sandbox', icon: '🌐' }
];

const THEMES = [
  { id: 'wrestlemania', name: 'WrestleMania Gold', color: '#ffd700', bg: '#800000' },
  { id: 'smackdown', name: 'Friday SmackDown Blue', color: '#00d2ff', bg: '#002244' },
  { id: 'raw', name: 'Monday Night RAW Red', color: '#ff2a2a', bg: '#3a0000' },
  { id: 'cyber', name: 'Cyber Matrix IDE', color: '#10b981', bg: '#0f172a' }
];

export default function ArenaHeader({
  language,
  onLanguageChange,
  theme,
  onThemeChange,
  soundEnabled,
  onToggleSound,
  voiceEnabled,
  onToggleVoice,
  onRun,
  isRunning,
  streak,
  onResetStreak
}) {
  // Determine Championship Belt title based on streak
  const getBelt = () => {
    if (streak >= 5) return { title: 'UNDISPUTED UNIVERSAL CHAMPION', belt: '👑 WWE Universal Title' };
    if (streak >= 3) return { title: 'WORLD HEAVYWEIGHT CHAMPION', belt: '🏆 World Heavyweight Title' };
    if (streak >= 1) return { title: 'INTERCONTINENTAL CHAMPION', belt: '🥇 Intercontinental Title' };
    return { title: 'ROOKIE CONTENDER', belt: '🥊 Cruiserweight Contender' };
  };

  const championInfo = getBelt();

  return (
    <header className="arena-header">
      {/* Top Banner: Arena Logo & Championship Streak */}
      <div className="arena-top-row">
        <div className="arena-brand">
          <div className="brand-badge">
            <Flame size={20} className="flame-icon" />
            <span className="brand-prefix">WWE</span>
          </div>
          <h1 className="brand-title">CODE ARENA</h1>
          <span className="brand-sub">All-in-One Multi-Language Compiler & Visual Graph IDE</span>
        </div>

        {/* Championship Belt Status */}
        <div className="championship-bar" title="Current arena streak for error-free compilations">
          <Trophy size={18} className="trophy-gold" />
          <div className="champ-details">
            <span className="champ-belt">{championInfo.belt}</span>
            <span className="champ-streak">Win Streak: <strong>{streak}</strong></span>
          </div>
          {streak > 0 && (
            <button 
              className="reset-streak-btn" 
              onClick={onResetStreak} 
              title="Reset Streak"
            >
              <RotateCcw size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Selector, Controls & Run Button */}
      <div className="arena-control-row">
        {/* Language Selector */}
        <div className="selector-group">
          <label className="selector-label">Language / Engine:</label>
          <div className="custom-select-wrapper">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="custom-select"
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.icon} {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Theme Picker */}
        <div className="selector-group">
          <label className="selector-label">Arena Theme:</label>
          <div className="theme-toggle-group">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`theme-chip ${theme === t.id ? 'active' : ''}`}
                onClick={() => onThemeChange(t.id)}
                title={t.name}
              >
                <span className="theme-dot" style={{ backgroundColor: t.color }}></span>
                <span>{t.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Audio & Commentary FX Controls */}
        <div className="fx-controls">
          <button 
            className={`fx-toggle-btn ${soundEnabled ? 'active' : ''}`}
            onClick={onToggleSound}
            title={soundEnabled ? 'Arena Sound FX On (Ding Ding Ding!)' : 'Arena Sound Muted'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>Sound FX</span>
          </button>

          <button 
            className={`fx-toggle-btn ${voiceEnabled ? 'active' : ''}`}
            onClick={onToggleVoice}
            title={voiceEnabled ? 'WWE Announcer Voice On' : 'Announcer Muted'}
          >
            {voiceEnabled ? <Mic size={16} /> : <MicOff size={16} />}
            <span>Announcer</span>
          </button>
        </div>

        {/* Big Finisher Run Button */}
        <button
          className={`deliver-finisher-btn ${isRunning ? 'running' : ''}`}
          onClick={onRun}
          disabled={isRunning}
          title="Compile and Execute Code (Ctrl + Enter)"
        >
          <Play size={18} fill="currentColor" />
          <span>{isRunning ? 'EXECUTING IN RING...' : 'DELIVER FINISHER (RUN)'}</span>
          <span className="btn-shortcut">Ctrl+↵</span>
        </button>
      </div>
    </header>
  );
}
