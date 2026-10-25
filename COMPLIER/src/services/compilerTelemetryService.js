// ============================================================================
// Elite IDE - Real-Time Live Compiler Telemetry & Presence Service
// Tracks who is using the compiler, active sessions, and live code executions
// Syncs to Supabase Cloud & broadcasts instant events via Supabase Realtime
// ============================================================================

import { supabase } from '../supabase';
import { recordExecutionTelemetry } from './liveLeaderboardService';

const USER_ID_KEY = 'ewk_compiler_user_id';
const USER_NAME_KEY = 'ewk_compiler_user_name';
const USER_PROFILE_KEY = 'ewk_user_profile';
const LOCAL_RUNS_CACHE_KEY = 'ewk_compiler_recent_runs';
const SESSION_COUNTED_KEY = 'ewk_compiler_pageview_logged';

// Client IP cache
let cachedClientIp = null;
let currentSessionId = null;
let heartbeatIntervalId = null;
let realtimeChannel = null;
let activeCollegeName = 'Web IDE';
let activeSystemName = '';

// Run debounce cooldown trackers to prevent duplicate recording
let lastLoggedCode = '';
let lastLoggedTimestamp = 0;

// Retrieve saved user profile (Name, Mobile, Email)
export function getUserProfile() {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {}
  return null;
}

// Save & Sync User Profile across LocalStorage, Supabase Realtime & Database
export async function saveUserProfile({ name, mobile, email }) {
  const userId = getOrCreateUserId();
  const cleanName = (name || '').trim().substring(0, 60);
  const cleanMobile = (mobile || '').trim().substring(0, 25);
  const cleanEmail = (email || '').trim().substring(0, 100);
  const nowIso = new Date().toISOString();

  const profileData = {
    userId,
    name: cleanName,
    mobile: cleanMobile,
    email: cleanEmail,
    updated_at: nowIso
  };

  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profileData));
    if (cleanName) {
      localStorage.setItem(USER_NAME_KEY, cleanName);
    }
  } catch (e) {}

  const device = detectDevice();
  const browser = detectBrowser();
  const os = detectOS();
  const ip = cachedClientIp || (await fetchPublicIp());

  // 1. Broadcast profile update to Supabase Realtime Channel (<30ms)
  if (realtimeChannel) {
    try {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'profile_updated',
        payload: {
          sessionId: currentSessionId,
          userId,
          name: cleanName,
          mobile: cleanMobile,
          email: cleanEmail,
          device,
          browser,
          os,
          ip,
          timestamp: nowIso
        }
      });
    } catch (e) {}
  }

  // 2. Persist to Supabase Database
  if (supabase) {
    try {
      // 2a. Primary save: Dedicated compiler_user_profiles table (if created)
      supabase
        .from('compiler_user_profiles')
        .upsert([{
          user_id: userId,
          name: cleanName,
          mobile: cleanMobile,
          email: cleanEmail,
          device,
          browser,
          os,
          ip,
          last_active: nowIso
        }], { onConflict: 'user_id' })
        .then(({ error }) => {
          if (error) console.warn('[Telemetry] compiler_user_profiles upsert notice:', error.message);
        })
        .catch(() => {});

      // 2b. Backup save into leads table (ensures persistence even if SQL table compiler_user_profiles was not run in Supabase)
      supabase
        .from('leads')
        .insert([{
          name: cleanName,
          email: cleanEmail || `${cleanMobile || userId}@compiler.user`,
          phone: cleanMobile || 'N/A',
          company: 'Elite IDE Developer',
          category: 'Compiler Developer Profile',
          budget: '₹0',
          timeline: 'Active User',
          message: `Developer Profile from Elite IDE.\nUser ID: ${userId}\nDevice: ${device} | ${os} (${browser})\nIP: ${ip}`,
          status: 'Proposal Received'
        }])
        .then(() => {})
        .catch(() => {});

      // 2c. Update active session with developer name and phone in college_name
      if (currentSessionId) {
        supabase
          .from('compiler_active_sessions')
          .update({
            user_name: cleanName || undefined,
            college_name: cleanMobile ? `${activeCollegeName} • 📱 ${cleanMobile}` : activeCollegeName
          })
          .eq('session_id', currentSessionId)
          .then(() => {})
          .catch(() => {});
      }
    } catch (err) {
      console.warn('[Telemetry] Save profile notice:', err);
    }
  }

  return profileData;
}

// Generate persistent unique developer ID
export function getOrCreateUserId() {
  try {
    let uid = localStorage.getItem(USER_ID_KEY);
    if (!uid) {
      uid = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).slice(-4);
      localStorage.setItem(USER_ID_KEY, uid);
    }
    return uid;
  } catch (e) {
    return 'usr_' + Math.random().toString(36).substring(2, 8);
  }
}

// Generate or retrieve developer alias / student name
export function getOrCreateUserName() {
  const profile = getUserProfile();
  if (profile && profile.name) {
    return profile.name;
  }
  try {
    let name = localStorage.getItem(USER_NAME_KEY);
    if (!name) {
      const suffixes = ['Ninja', 'Coder', 'Architect', 'Dev', 'Hacker', 'Knight', 'Wizard', 'Falcon'];
      const randSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      const randNum = Math.floor(1000 + Math.random() * 9000);
      name = `${randSuffix}-${randNum}`;
      localStorage.setItem(USER_NAME_KEY, name);
    }
    return name;
  } catch (e) {
    return 'Dev-' + Math.floor(1000 + Math.random() * 9000);
  }
}

export function updateCompilerUserName(newName) {
  if (!newName || !newName.trim()) return;
  const cleanName = newName.trim().substring(0, 50);
  try {
    localStorage.setItem(USER_NAME_KEY, cleanName);
  } catch (e) {}

  if (currentSessionId && supabase) {
    supabase
      .from('compiler_active_sessions')
      .update({ user_name: cleanName })
      .eq('session_id', currentSessionId)
      .then(() => {})
      .catch(() => {});

    if (realtimeChannel) {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'user_renamed',
        payload: { sessionId: currentSessionId, userName: cleanName }
      });
    }
  }
}

// Telemetry detectors
export function detectDevice() {
  const ua = navigator.userAgent || '';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'Tablet';
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Opera M(obi|ini)/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

export function detectBrowser() {
  const ua = navigator.userAgent || '';
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\/|opera/i.test(ua)) return 'Opera';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  return 'Browser';
}

export function detectOS() {
  const ua = navigator.userAgent || '';
  if (/windows nt/i.test(ua)) return 'Windows';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Other OS';
}

// Fetch public IP in background with safe fallback
async function fetchPublicIp() {
  if (cachedClientIp) return cachedClientIp;
  try {
    const cached = sessionStorage.getItem('ewk_client_ip');
    if (cached) {
      cachedClientIp = cached;
      return cached;
    }
  } catch (e) {}

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        cachedClientIp = data.ip;
        try { sessionStorage.setItem('ewk_client_ip', data.ip); } catch (e) {}
        return data.ip;
      }
    }
  } catch (e) {
    // fallback
  }
  return 'Direct Web Client';
}

// Initialize compiler presence and realtime connection
export async function initCompilerTelemetry(initialLang = 'python', collegeDetails = null) {
  // Session ID for current tab
  try {
    let sid = sessionStorage.getItem('ewk_compiler_session_id');
    if (!sid) {
      sid = 'ses_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      sessionStorage.setItem('ewk_compiler_session_id', sid);
    }
    currentSessionId = sid;
  } catch (e) {
    currentSessionId = 'ses_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  }

  const profile = getUserProfile();
  const userMobile = (profile && profile.mobile) ? profile.mobile : '';
  const userEmail = (profile && profile.email) ? profile.email : '';
  if (profile && profile.name) {
    userName = profile.name;
  }

  if (collegeDetails) {
    if (collegeDetails.collegeName) activeCollegeName = collegeDetails.collegeName;
    if (collegeDetails.systemName) activeSystemName = collegeDetails.systemName;
    if (collegeDetails.studentName) {
      userName = collegeDetails.studentName;
    }
  }

  // Auto-sync stored user profile to Supabase to guarantee permanent admin reflection
  if (profile && (profile.mobile || profile.email)) {
    saveUserProfile({
      name: profile.name || userName,
      mobile: profile.mobile,
      email: profile.email
    }).catch(() => {});
  }

  const device = detectDevice();
  const browser = detectBrowser();
  const os = detectOS();
  const ip = await fetchPublicIp();

  // 1. Join Supabase Realtime Broadcast Channel
  if (supabase && !realtimeChannel) {
    try {
      realtimeChannel = supabase.channel('compiler_realtime_stream');
      realtimeChannel
        .on('broadcast', { event: 'ping' }, () => {})
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Broadcast initial presence ping
            realtimeChannel.send({
              type: 'broadcast',
              event: 'user_joined',
              payload: {
                sessionId: currentSessionId,
                userId,
                userName,
                user_mobile: userMobile,
                user_email: userEmail,
                language: initialLang,
                device,
                browser,
                os,
                ip,
                collegeName: activeCollegeName,
                timestamp: new Date().toISOString()
              }
            });
          }
        });
    } catch (err) {
      console.warn('[Telemetry] Realtime channel init notice:', err);
    }
  }

  // 2. Register Active Session in Database (Using strictly Supabase verified columns)
  const sessionDbPayload = {
    session_id: currentSessionId,
    user_id: userId,
    user_name: userName,
    college_name: userMobile ? `${activeCollegeName} • 📱 ${userMobile}` : activeCollegeName,
    current_language: initialLang,
    device,
    browser,
    os,
    ip,
    runs_count: 0,
    last_heartbeat: new Date().toISOString(),
    is_online: true,
    created_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      await supabase.from('compiler_active_sessions').upsert(sessionDbPayload);
    } catch (dbErr) {
      console.warn('[Telemetry] Active session upsert notice:', dbErr);
    }
  }

  // 3. Heartbeat loop (every 12 seconds to keep live presence fresh and online)
  if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);
  heartbeatIntervalId = setInterval(async () => {
    if (!currentSessionId) return;
    const nowIso = new Date().toISOString();

    if (supabase) {
      try {
        await supabase
          .from('compiler_active_sessions')
          .upsert({
            session_id: currentSessionId,
            user_id: userId,
            user_name: userName,
            college_name: userMobile ? `${activeCollegeName} • 📱 ${userMobile}` : activeCollegeName,
            current_language: initialLang,
            device,
            browser,
            os,
            ip,
            last_heartbeat: nowIso,
            is_online: true
          });
      } catch (e) {}
    }

    if (realtimeChannel) {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'presence_heartbeat',
        payload: {
          sessionId: currentSessionId,
          userId,
          userName,
          user_mobile: userMobile,
          user_email: userEmail,
          device,
          os,
          timestamp: nowIso
        }
      });
    }
  }, 12000);

  // 4. Handle Tab close / Unload to mark offline
  const handleUnload = () => {
    if (!currentSessionId) return;
    try {
      if (realtimeChannel) {
        realtimeChannel.send({
          type: 'broadcast',
          event: 'user_left',
          payload: { sessionId: currentSessionId, userId }
        });
      }
      if (supabase) {
        // Beacon update
        const updateUrl = `${supabase.supabaseUrl || 'https://jgvgqgbhzadxvcolgvly.supabase.co'}/rest/v1/compiler_active_sessions?session_id=eq.${encodeURIComponent(currentSessionId)}`;
        const headers = {
          'Content-Type': 'application/json',
          'apikey': 'sb_publishable_5ToLoZzsP_B3FQoYBzTnEA_re1QwPPv',
          'Authorization': 'Bearer sb_publishable_5ToLoZzsP_B3FQoYBzTnEA_re1QwPPv',
          'Prefer': 'return=minimal'
        };
        const body = JSON.stringify({ is_online: false, last_heartbeat: new Date().toISOString() });
        navigator.sendBeacon && navigator.sendBeacon(updateUrl, body);
      }
    } catch (e) {}
  };

  window.addEventListener('beforeunload', handleUnload);

  // 5. Track general pageview in pageviews table if not already tracked
  try {
    if (!sessionStorage.getItem(SESSION_COUNTED_KEY)) {
      sessionStorage.setItem(SESSION_COUNTED_KEY, 'true');
      if (supabase) {
        supabase.from('pageviews').insert([{
          url: '/compiler/',
          hostname: window.location.hostname || 'elitewebkingdom.in',
          user_agent: (navigator.userAgent || '').substring(0, 250),
          referrer: document.referrer ? document.referrer.substring(0, 200) : 'direct',
          device,
          browser,
          os,
          ip: ip !== 'Direct Web Client' ? ip : null,
          created_at: new Date().toISOString()
        }]).then(() => {}).catch(() => {});
      }
    }
  } catch (e) {}

  return {
    sessionId: currentSessionId,
    userId,
    userName,
    device,
    browser,
    os,
    ip
  };
}

// Update current active language in presence
export function updateTelemetryLanguage(lang) {
  if (!currentSessionId || !lang) return;
  if (supabase) {
    supabase
      .from('compiler_active_sessions')
      .update({ current_language: lang })
      .eq('session_id', currentSessionId)
      .then(() => {})
      .catch(() => {});
  }
  if (realtimeChannel) {
    realtimeChannel.send({
      type: 'broadcast',
      event: 'language_changed',
      payload: { sessionId: currentSessionId, language: lang }
    });
  }
}

// Log a real compiler execution (triggered whenever code is run)
export async function logCompilerRun({
  language,
  success,
  code = '',
  executionTime = 0,
  errorMessage = '',
  runner = 'Elite Engine',
  collegeData = null
}) {
  const nowMs = Date.now();
  const trimmedCode = (code || '').trim();

  // Cooldown debounce (1200ms) to prevent duplicate triggers from double taps or rapid re-runs
  if (lastLoggedCode === trimmedCode && (nowMs - lastLoggedTimestamp) < 1200) {
    console.log('[Telemetry] Debouncing duplicate run invocation.');
    return null;
  }
  lastLoggedCode = trimmedCode;
  lastLoggedTimestamp = nowMs;

  const runId = 'run_' + nowMs + '_' + Math.random().toString(36).substring(2, 8);
  const profile = getUserProfile();
  const userId = getOrCreateUserId();
  const userName = (profile && profile.name) ? profile.name : getOrCreateUserName();
  const userMobile = (profile && profile.mobile) ? profile.mobile : '';
  const userEmail = (profile && profile.email) ? profile.email : '';
  const device = detectDevice();
  const browser = detectBrowser();
  const os = detectOS();
  const ip = cachedClientIp || (await fetchPublicIp());
  const nowIso = new Date().toISOString();

  let collegeName = activeCollegeName;
  let systemName = activeSystemName;
  if (collegeData) {
    if (collegeData.collegeName) collegeName = collegeData.collegeName;
    if (collegeData.systemName) systemName = collegeData.systemName;
  }
  // Store contact in system_name as a 100% resilient fallback for existing tables
  if (!systemName && (userMobile || userEmail)) {
    systemName = `${userMobile} | ${userEmail}`.trim();
  }

  // Prepare safe snippet (up to 700 chars)
  const codeSnippet = (code || '').trim().substring(0, 700);
  const lineCount = (code || '').split('\n').length;
  const status = success ? 'SUCCESS' : 'ERROR';

  const telemetryDbPayload = {
    session_id: currentSessionId || ('ses_' + Date.now()),
    user_id: userId,
    user_name: userName,
    college_name: collegeName,
    system_name: systemName,
    language: (language || 'python').toLowerCase(),
    status,
    line_count: lineCount,
    code_snippet: codeSnippet,
    execution_time_ms: Math.max(1, Math.round(executionTime || 0)),
    error_message: errorMessage ? errorMessage.substring(0, 400) : null,
    device,
    browser,
    os,
    ip,
    created_at: nowIso
  };

  // 1. Broadcast instant event over Supabase Realtime Channel (<30ms global latency)
  if (realtimeChannel) {
    try {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'code_run',
        payload: {
          ...telemetryDbPayload,
          run_id: runId,
          user_mobile: userMobile,
          user_email: userEmail,
          runner
        }
      });
    } catch (broadcastErr) {
      console.warn('[Telemetry] Realtime broadcast error:', broadcastErr);
    }
  }

  // 2. Persist to Supabase Database (Permanent audit log)
  if (supabase) {
    try {
      supabase.from('compiler_telemetry').insert([telemetryDbPayload]).then(({ error }) => {
        if (error) {
          console.warn('[Telemetry] Supabase compiler_telemetry insert notice:', error.message);
        }
      }).catch(err => {
        console.warn('[Telemetry] Supabase db error:', err);
      });

      // Update active session runs count
      if (currentSessionId) {
        supabase.rpc('increment_compiler_session_runs', { p_session_id: currentSessionId })
          .catch(() => {
            // Fallback direct update
            supabase.from('compiler_active_sessions')
              .update({
                last_run_at: nowIso,
                last_heartbeat: nowIso,
                current_language: (language || 'python').toLowerCase(),
                is_online: true
              })
              .eq('session_id', currentSessionId)
              .then(() => {})
              .catch(() => {});
          });
      }
    } catch (e) {
      console.warn('[Telemetry] DB insert error:', e);
    }
  }

  // 3. Keep local circular buffer in LocalStorage
  try {
    const raw = localStorage.getItem(LOCAL_RUNS_CACHE_KEY);
    const localLogs = raw ? JSON.parse(raw) : [];
    localLogs.unshift({
      ...telemetryPayload,
      runner
    });
    if (localLogs.length > 50) localLogs.pop();
    localStorage.setItem(LOCAL_RUNS_CACHE_KEY, JSON.stringify(localLogs));
  } catch (e) {}

  // 4. Update authentic streaks & badges service
  try {
    recordExecutionTelemetry(language, success, code);
  } catch (e) {}

  return telemetryPayload;
}
