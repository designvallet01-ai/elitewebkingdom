import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Flame, 
  Award, 
  Calendar, 
  Star, 
  ShieldCheck, 
  Zap, 
  Users, 
  Clock, 
  CheckCircle2, 
  Lock, 
  X, 
  Filter,
  Sparkles,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Globe
} from 'lucide-react';
import { 
  fetchLiveUpcomingContests, 
  fetchLiveGlobalLeaderboard, 
  fetchLiveCollegeLeaderboard, 
  computeUserRealStats 
} from '../services/liveLeaderboardService';

const RANK_TIERS = [
  { name: 'Novice', range: '0 - 999', icon: '🥉', color: '#94a3b8' },
  { name: 'Specialist', range: '1000 - 1399', icon: '🥈', color: '#38bdf8' },
  { name: 'Expert', range: '1400 - 1899', icon: '🥇', color: '#10b981' },
  { name: 'Master', range: '1900 - 2399', icon: '🔮', color: '#a855f7' },
  { name: 'Grandmaster', range: '2400 - 2999', icon: '💎', color: '#f59e0b' },
  { name: 'Legendary Grandmaster', range: '3000+', icon: '👑', color: '#f43f5e' }
];

export default function LeaderboardBadgesModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'leaderboard' | 'badges' | 'hackathons'
  const [leaderboardFilter, setLeaderboardFilter] = useState('global'); // 'global' | 'college'
  const [registeredHackathons, setRegisteredHackathons] = useState({});
  const [liveContests, setLiveContests] = useState([]);
  const [globalCoders, setGlobalCoders] = useState([]);
  const [collegeCoders, setCollegeCoders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userStats, setUserStats] = useState(null);

  // Load real telemetry and live API data on open
  useEffect(() => {
    if (isOpen) {
      // 1. Calculate authentic stats from local execution telemetry
      const stats = computeUserRealStats();
      setUserStats(stats);

      // 2. Fetch live data from Codeforces & Supabase
      setIsLoading(true);
      Promise.allSettled([
        fetchLiveUpcomingContests(),
        fetchLiveGlobalLeaderboard(),
        fetchLiveCollegeLeaderboard()
      ]).then(([contestsRes, globalRes, collegeRes]) => {
        if (contestsRes.status === 'fulfilled') setLiveContests(contestsRes.value);
        if (globalRes.status === 'fulfilled') setGlobalCoders(globalRes.value);
        if (collegeRes.status === 'fulfilled') setCollegeCoders(collegeRes.value);
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const stats = userStats || computeUserRealStats();

  // Dynamic Real Badges based on user's actual telemetry
  const BADGES = [
    { 
      id: 'b1', 
      name: 'Algorithm Pioneer', 
      category: 'Algorithms', 
      rarity: 'Common', 
      icon: '🎯', 
      desc: 'Executed your first competitive programming problem', 
      unlocked: stats.totalRuns >= 1, 
      progress: Math.min(100, (stats.totalRuns / 1) * 100) 
    },
    { 
      id: 'b2', 
      name: 'Polyglot Titan', 
      category: 'Languages', 
      rarity: 'Rare', 
      icon: '🌐', 
      desc: 'Compile code in at least 3 distinct programming languages', 
      unlocked: stats.distinctLangs.length >= 3, 
      progress: Math.min(100, Math.round((stats.distinctLangs.length / 3) * 100)) 
    },
    { 
      id: 'b3', 
      name: 'Speed Demon', 
      category: 'Arenas', 
      rarity: 'Epic', 
      icon: '⚡', 
      desc: 'Win a 1v1 Speed Coding match in the Arena', 
      unlocked: stats.arenaWins >= 1, 
      progress: stats.arenaWins > 0 ? 100 : 0 
    },
    { 
      id: 'b4', 
      name: 'Consistent Coder', 
      category: 'Streaks', 
      rarity: 'Rare', 
      icon: '🔥', 
      desc: 'Maintain a 3-day active coding streak', 
      unlocked: stats.streak >= 3, 
      progress: Math.min(100, Math.round((stats.streak / 3) * 100)) 
    },
    { 
      id: 'b5', 
      name: 'Master Problem Solver', 
      category: 'DSA', 
      rarity: 'Epic', 
      icon: '🏆', 
      desc: 'Achieve 10 successful code executions with zero runtime errors', 
      unlocked: stats.successfulRuns >= 10, 
      progress: Math.min(100, Math.round((stats.successfulRuns / 10) * 100)) 
    },
    { 
      id: 'b6', 
      name: 'Coliseum Veteran', 
      category: 'Rating', 
      rarity: 'Legendary', 
      icon: '💎', 
      desc: 'Reach 1600+ ELO in the 1v1 Competitive Arena', 
      unlocked: stats.currentRating >= 1600, 
      progress: Math.min(100, Math.round((stats.currentRating / 1600) * 100)) 
    }
  ];

  const handleRegisterHackathon = (id, contestUrl) => {
    setRegisteredHackathons(prev => ({ ...prev, [id]: true }));
    if (contestUrl) {
      window.open(contestUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Determine user rank tier
  const getUserTier = (rating) => {
    if (rating >= 3000) return '👑 Legendary Grandmaster';
    if (rating >= 2400) return '💎 Grandmaster';
    if (rating >= 1900) return '🔮 Master';
    if (rating >= 1400) return '🥇 Expert';
    if (rating >= 1000) return '🥈 Specialist';
    return '🥉 Novice';
  };

  const userTierName = getUserTier(stats.currentRating);

  // Active Leaderboard Data
  const displayedLeaderboard = leaderboardFilter === 'college' ? collegeCoders : globalCoders;

  return (
    <div className="s-tier-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="s-tier-modal-container lb-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="s-tier-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge lb-badge">
              <Trophy size={22} className="text-amber-400" />
            </div>
            <div>
              <div className="modal-title-row">
                <h2>Gamification Hub & Global Leaderboards</h2>
                <span className="s-tier-pill lb-pill">Live Telemetry & Real-Time Sync</span>
              </div>
              <p className="modal-subtitle">Real-time Codeforces world ratings, live ICPC contests, and authentic coding telemetry</p>
            </div>
          </div>
          <button className="s-tier-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="oj-tabs-bar">
          <div className="oj-tabs-left">
            <button 
              className={`oj-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <Flame size={15} />
              <span>Streaks & Telemetry ({stats.streak}d)</span>
            </button>
            <button 
              className={`oj-tab-btn ${activeTab === 'badges' ? 'active' : ''}`}
              onClick={() => setActiveTab('badges')}
            >
              <Award size={15} />
              <span>Badges ({BADGES.filter(b => b.unlocked).length}/{BADGES.length} Unlocked)</span>
            </button>
            <button 
              className={`oj-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('leaderboard')}
            >
              <Trophy size={15} />
              <span>Global Leaderboard ({displayedLeaderboard.length})</span>
            </button>
            <button 
              className={`oj-tab-btn ${activeTab === 'hackathons' ? 'active' : ''}`}
              onClick={() => setActiveTab('hackathons')}
            >
              <Sparkles size={15} />
              <span>Live Contests ({liveContests.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="lb-modal-body">
          {activeTab === 'profile' && (
            <div className="lb-profile-view">
              {/* Streak Card */}
              <div className="streak-hero-card">
                <div className="streak-hero-left">
                  <div className="flame-icon-wrap">
                    <Flame size={48} className="text-orange-500 animate-bounce" />
                  </div>
                  <div>
                    <div className="streak-count-row">
                      <span className="streak-big-num">{stats.streak}</span>
                      <span className="streak-unit">DAY STREAK</span>
                    </div>
                    <p className="streak-subtext">
                      {stats.totalRuns > 0 
                        ? `Authentic execution telemetry: ${stats.totalRuns} total runs logged, ${stats.successfulRuns} successful compiles!`
                        : 'Click "Run Code" in the editor to initiate your authentic daily coding streak!'}
                    </p>
                  </div>
                </div>

                <div className="streak-stats-grid">
                  <div className="s-stat-box">
                    <span className="stat-label">Total Executions</span>
                    <span className="stat-val">{stats.totalRuns} Runs</span>
                  </div>
                  <div className="s-stat-box">
                    <span className="stat-label">Languages Used</span>
                    <span className="stat-val">{stats.distinctLangs.length ? stats.distinctLangs.join(', ').toUpperCase() : 'None yet'}</span>
                  </div>
                  <div className="s-stat-box">
                    <span className="stat-label">Arena ELO</span>
                    <span className="stat-val">{stats.currentRating} ELO</span>
                  </div>
                </div>
              </div>

              {/* 60-Day Activity Heatmap */}
              <div className="activity-heatmap-section">
                <div className="flex-between mb-2">
                  <h4>Real 60-Day Coding Consistency Heatmap</h4>
                  <span className="text-xs text-gray-400">Computed live from execution logs</span>
                </div>
                <div className="heatmap-grid">
                  {stats.heatMapDays.map(d => (
                    <div
                      key={d.day}
                      className={`heatmap-box count-${Math.min(5, d.count)}`}
                      title={`${d.date}: ${d.count} executions`}
                    />
                  ))}
                </div>
                <div className="heatmap-legend">
                  <span>0 Runs</span>
                  <div className="heatmap-box count-0" />
                  <div className="heatmap-box count-1" />
                  <div className="heatmap-box count-3" />
                  <div className="heatmap-box count-5" />
                  <span>5+ Runs</span>
                </div>
              </div>

              {/* Rank Tiers Progression */}
              <div className="rank-tiers-section">
                <h4>Rank Tier Progression Path</h4>
                <div className="tiers-horizontal-bar">
                  {RANK_TIERS.map(t => {
                    const isCurrent = userTierName.includes(t.name);
                    return (
                      <div key={t.name} className={`tier-card ${isCurrent ? 'current-tier' : ''}`}>
                        <div className="tier-icon">{t.icon}</div>
                        <div className="tier-name">{t.name}</div>
                        <div className="tier-range">{t.range}</div>
                        {isCurrent && <span className="tier-active-badge">Your Rank</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="lb-badges-view">
              <div className="badges-grid">
                {BADGES.map(b => (
                  <div key={b.id} className={`badge-card ${b.unlocked ? 'badge-unlocked' : 'badge-locked'}`}>
                    <div className="badge-card-top">
                      <span className="badge-icon">{b.icon}</span>
                      <span className={`badge-rarity-pill rarity-${b.rarity.toLowerCase()}`}>{b.rarity}</span>
                    </div>
                    <div className="badge-name">{b.name}</div>
                    <div className="badge-desc">{b.desc}</div>
                    <div className="badge-progress-wrap">
                      <div className="badge-prog-bar">
                        <div className="badge-prog-fill" style={{ width: `${b.progress}%` }} />
                      </div>
                      <span className="badge-prog-text">{b.unlocked ? 'Unlocked 🏆' : `${Math.round(b.progress)}% Complete`}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="lb-table-view">
              <div className="oj-filter-bar">
                <Filter size={14} className="text-gray-400" />
                <span className="filter-label">Live Source:</span>
                <button
                  className={`oj-filter-pill ${leaderboardFilter === 'global' ? 'active' : ''}`}
                  onClick={() => setLeaderboardFilter('global')}
                >
                  <Globe size={13} className="inline mr-1" />
                  CODEFORCES WORLD TOP ({globalCoders.length})
                </button>
                <button
                  className={`oj-filter-pill ${leaderboardFilter === 'college' ? 'active' : ''}`}
                  onClick={() => setLeaderboardFilter('college')}
                >
                  <Users size={13} className="inline mr-1" />
                  CAMPUS LAB (SUPABASE REALTIME)
                </button>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-gray-400">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-primary" />
                  <p>Syncing live global standings from Codeforces official API...</p>
                </div>
              ) : (
                <div className="leaderboard-table">
                  <div className="table-header-row">
                    <div className="col-rank">#</div>
                    <div className="col-user">Developer</div>
                    <div className="col-college">Institution / Team</div>
                    <div className="col-tier">Rank Tier</div>
                    <div className="col-rating">World Rating</div>
                  </div>

                  {displayedLeaderboard.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No records found in this category. Switch to Global tab for live worldwide coders.
                    </div>
                  ) : (
                    displayedLeaderboard.map(user => (
                      <div key={user.rank} className="table-row">
                        <div className="col-rank">
                          {user.rank === 1 ? '🥇 1' : user.rank === 2 ? '🥈 2' : user.rank === 3 ? '🥉 3' : user.rank}
                        </div>
                        <div className="col-user">
                          <div className="user-name">{user.name}</div>
                          <div className="user-handle">{user.handle}</div>
                        </div>
                        <div className="col-college">{user.college}</div>
                        <div className="col-tier">{user.tier}</div>
                        <div className="col-rating font-bold text-amber-400">{user.rating}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'hackathons' && (
            <div className="lb-hackathons-view">
              <div className="flex-between mb-3">
                <span className="text-sm text-gray-400">
                  Official live competitive programming contests fetched directly from Codeforces:
                </span>
                <span className="text-xs text-emerald-400 font-mono">● LIVE API CONNECTED</span>
              </div>

              <div className="hackathons-grid">
                {liveContests.map(h => (
                  <div key={h.id} className="hackathon-card">
                    <div className="hack-card-top">
                      <span className="hack-status-badge">{h.status}</span>
                      <span className="hack-duration">
                        <Clock size={13} />
                        <span>{h.duration}</span>
                      </span>
                    </div>
                    <h3 className="hack-title">{h.title}</h3>
                    <div className="hack-date">📅 {h.date}</div>
                    <div className="hack-prize">🏆 Rewards: <strong>{h.prizePool}</strong></div>
                    <div className="hack-tags">
                      {h.tags.map(t => (
                        <span key={t} className="hack-tag">{t}</span>
                      ))}
                    </div>
                    <div className="hack-footer">
                      <span className="hack-participants">
                        <Users size={14} />
                        <span>{h.participants.toLocaleString()} participants</span>
                      </span>
                      <button
                        className={`hack-register-btn ${registeredHackathons[h.id] ? 'registered' : ''}`}
                        onClick={() => handleRegisterHackathon(h.id, h.url)}
                      >
                        {registeredHackathons[h.id] ? 'Open Contest ↗' : 'Register on Codeforces ↗'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
