// College & Lab Computer Management Service with Supabase Cloud Database & Realtime Network
import { supabase } from '../supabase';

const STORAGE_COLLEGES_KEY = 'elite_college_registered_accounts_v1';
const STORAGE_SYSTEMS_KEY = 'elite_college_registered_systems_v1';
const STORAGE_LOCAL_SYSTEM_KEY = 'elite_current_machine_system_info_v1';
const BROADCAST_CHANNEL_NAME = 'elite_college_lab_network_v1';

// Initial pre-registered demo college
const DEFAULT_COLLEGES = [
  {
    collegeId: 'EWK-COLLEGE-01',
    collegeName: 'Elite Engineering College',
    department: 'Computer Science & Engineering',
    adminEmail: 'admin@elitecollege.edu.in',
    password: 'admin123',
    defaultPin: '1234',
    createdAt: new Date().toISOString()
  }
];

// Initialize Local Broadcast Channel if supported
let broadcastChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel initialization error:', e);
}

// Initialize Supabase Global Realtime Broadcast Channel
let supabaseRealtimeChannel = null;
try {
  if (supabase) {
    supabaseRealtimeChannel = supabase.channel('college_lab_network_channel');
    supabaseRealtimeChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('⚡ Supabase Worldwide Realtime Lab Channel Connected!');
      }
    });
  }
} catch (e) {
  console.warn('Supabase Realtime Channel error:', e);
}

// 1. Get all registered colleges (LocalStorage cache + background Supabase fetch)
export function getRegisteredColleges() {
  try {
    const saved = localStorage.getItem(STORAGE_COLLEGES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading colleges from storage:', e);
  }
  return DEFAULT_COLLEGES;
}

// Asynchronously fetch and sync colleges from Supabase Cloud
export async function syncCollegesFromSupabase() {
  try {
    if (!supabase) return getRegisteredColleges();
    const { data, error } = await supabase.from('college_accounts').select('*');
    if (error) {
      console.warn('Supabase colleges fetch notice:', error.message);
      return getRegisteredColleges();
    }

    if (Array.isArray(data) && data.length > 0) {
      const formatted = data.map(c => ({
        collegeId: c.college_id,
        collegeName: c.college_name,
        department: c.department,
        adminEmail: c.admin_email,
        password: c.password,
        defaultPin: c.default_pin || '1234',
        createdAt: c.created_at
      }));

      // Merge with default and cached
      const current = getRegisteredColleges();
      const mergedMap = new Map();
      current.forEach(c => mergedMap.set(c.collegeId, c));
      formatted.forEach(c => mergedMap.set(c.collegeId, c));
      const mergedList = Array.from(mergedMap.values());

      try {
        localStorage.setItem(STORAGE_COLLEGES_KEY, JSON.stringify(mergedList));
      } catch (e) {}

      return mergedList;
    }
  } catch (e) {
    console.warn('syncCollegesFromSupabase error:', e);
  }
  return getRegisteredColleges();
}

// 2. Register a new College Account (Saves to LocalStorage AND Supabase Cloud)
export function registerCollege({ collegeName, collegeId, department, adminEmail, password, defaultPin = '1234' }) {
  if (!collegeName || !collegeId || !password) {
    throw new Error('College Name, College ID, and Password are required.');
  }

  const cleanId = collegeId.trim().toUpperCase();
  const colleges = getRegisteredColleges();

  // Check if ID already exists
  const existing = colleges.find(c => c.collegeId === cleanId);
  if (existing) {
    throw new Error(`College ID "${cleanId}" is already registered. Please use another ID or log in.`);
  }

  const newCollege = {
    collegeId: cleanId,
    collegeName: collegeName.trim(),
    department: department?.trim() || 'Engineering & Technology',
    adminEmail: adminEmail?.trim() || '',
    password: password.trim(),
    defaultPin: (defaultPin || '1234').trim(),
    createdAt: new Date().toISOString()
  };

  const updated = [...colleges, newCollege];
  try {
    localStorage.setItem(STORAGE_COLLEGES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }

  // Save to Supabase Cloud Database (Asynchronous Background Sync)
  if (supabase) {
    supabase.from('college_accounts').upsert({
      college_id: cleanId,
      college_name: newCollege.collegeName,
      department: newCollege.department,
      admin_email: newCollege.adminEmail,
      password: newCollege.password,
      default_pin: newCollege.defaultPin
    }).then(({ error }) => {
      if (error) console.warn('Supabase cloud insert notice (college_accounts):', error.message);
    }).catch(err => console.warn('Supabase cloud college error:', err));
  }

  // Broadcast registration across local network and Supabase Realtime
  broadcastMessage({ type: 'COLLEGE_REGISTERED', college: newCollege });

  return newCollege;
}

// 3. Verify College Login Credentials
export function verifyCollegeLogin(collegeId, password) {
  if (!collegeId || !password) return null;
  const cleanId = collegeId.trim().toUpperCase();
  const cleanPass = password.trim();

  const colleges = getRegisteredColleges();
  const college = colleges.find(c => c.collegeId === cleanId && c.password === cleanPass);
  return college || null;
}

// 4. Get this machine's registered System Info (if bound)
export function getCurrentMachineSystem() {
  try {
    const saved = localStorage.getItem(STORAGE_LOCAL_SYSTEM_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return null;
}

// 5. Get all registered systems under a college
export function getRegisteredSystems(collegeId = null) {
  try {
    const saved = localStorage.getItem(STORAGE_SYSTEMS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        if (!collegeId) return parsed;
        const cleanId = collegeId.trim().toUpperCase();
        return parsed.filter(s => s.collegeId === cleanId);
      }
    }
  } catch (e) {}
  return [];
}

// Asynchronously fetch and sync systems from Supabase Cloud
export async function syncSystemsFromSupabase(collegeId = null) {
  try {
    if (!supabase) return getRegisteredSystems(collegeId);
    let query = supabase.from('college_systems').select('*');
    if (collegeId) {
      query = query.eq('college_id', collegeId.trim().toUpperCase());
    }
    const { data, error } = await query;
    if (error) {
      console.warn('Supabase systems fetch notice:', error.message);
      return getRegisteredSystems(collegeId);
    }

    if (Array.isArray(data)) {
      const formatted = data.map(s => ({
        systemId: s.system_id,
        machineId: s.machine_id,
        collegeId: s.college_id,
        collegeName: s.college_name,
        systemName: s.system_name,
        labRoom: s.lab_room,
        status: s.status || 'idle',
        currentStudentRoll: s.current_student_roll || '',
        currentStudentName: s.current_student_name || '',
        currentExamName: s.current_exam_name || '',
        violationsCount: s.violations_count || 0,
        examStartTime: s.exam_start_time,
        registeredAt: s.registered_at,
        lastPing: s.last_ping
      }));

      // Merge with local storage
      const currentAll = getRegisteredSystems();
      const map = new Map();
      currentAll.forEach(s => map.set(s.systemId, s));
      formatted.forEach(s => map.set(s.systemId, s));
      const merged = Array.from(map.values());

      try {
        localStorage.setItem(STORAGE_SYSTEMS_KEY, JSON.stringify(merged));
      } catch (e) {}

      if (collegeId) {
        return merged.filter(s => s.collegeId === collegeId.trim().toUpperCase());
      }
      return merged;
    }
  } catch (e) {
    console.warn('syncSystemsFromSupabase error:', e);
  }
  return getRegisteredSystems(collegeId);
}

// 6. Register & Bind this Computer Machine (System Register - Saves to Local + Supabase)
export function registerSystem({ collegeId, password, systemName, labRoom = 'Computer Lab 1' }) {
  if (!collegeId || !password || !systemName) {
    throw new Error('College ID, Password, and System Name are required.');
  }

  const college = verifyCollegeLogin(collegeId, password);
  if (!college) {
    throw new Error('Invalid College ID or Password. Please register the college first.');
  }

  const cleanSystemName = systemName.trim().toUpperCase();
  const allSystems = getRegisteredSystems();

  // Generate or retrieve unique Machine Hardware ID
  let machineId = '';
  try {
    machineId = localStorage.getItem('elite_unique_machine_hardware_id');
    if (!machineId) {
      machineId = 'MC-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      localStorage.setItem('elite_unique_machine_hardware_id', machineId);
    }
  } catch (e) {
    machineId = 'MC-' + Date.now().toString(36).toUpperCase();
  }

  const existingIndex = allSystems.findIndex(
    s => s.collegeId === college.collegeId && (s.systemName === cleanSystemName || s.machineId === machineId)
  );

  const systemRecord = {
    systemId: `SYS-${college.collegeId}-${cleanSystemName}`,
    machineId,
    collegeId: college.collegeId,
    collegeName: college.collegeName,
    systemName: cleanSystemName,
    labRoom: labRoom.trim() || 'Computer Lab',
    status: 'idle',
    currentStudentRoll: '',
    currentStudentName: '',
    currentExamName: '',
    violationsCount: 0,
    examStartTime: null,
    registeredAt: new Date().toISOString(),
    lastPing: new Date().toISOString()
  };

  let updatedSystems = [...allSystems];
  if (existingIndex >= 0) {
    updatedSystems[existingIndex] = { ...updatedSystems[existingIndex], ...systemRecord };
  } else {
    updatedSystems.push(systemRecord);
  }

  try {
    localStorage.setItem(STORAGE_SYSTEMS_KEY, JSON.stringify(updatedSystems));
    localStorage.setItem(STORAGE_LOCAL_SYSTEM_KEY, JSON.stringify(systemRecord));
  } catch (e) {
    console.warn('System save error:', e);
  }

  // Save to Supabase Cloud Database (Asynchronous Background Sync)
  if (supabase) {
    supabase.from('college_systems').upsert({
      system_id: systemRecord.systemId,
      college_id: systemRecord.collegeId,
      college_name: systemRecord.collegeName,
      system_name: systemRecord.systemName,
      lab_room: systemRecord.labRoom,
      machine_id: systemRecord.machineId,
      status: 'idle',
      current_student_roll: '',
      current_student_name: '',
      current_exam_name: '',
      violations_count: 0
    }).then(({ error }) => {
      if (error) console.warn('Supabase cloud insert notice (college_systems):', error.message);
    }).catch(err => console.warn('Supabase cloud system error:', err));
  }

  // Broadcast system registration to college portal
  broadcastMessage({ type: 'SYSTEM_REGISTERED', system: systemRecord });

  return { system: systemRecord, college };
}

// 7. Update System Exam / Lockdown Status (Syncs Local + Supabase)
export function updateSystemStatus(systemNameOrId, updates = {}) {
  const allSystems = getRegisteredSystems();
  const updated = allSystems.map(s => {
    if (s.systemId === systemNameOrId || s.systemName === systemNameOrId || s.machineId === systemNameOrId) {
      return {
        ...s,
        ...updates,
        lastPing: new Date().toISOString()
      };
    }
    return s;
  });

  try {
    localStorage.setItem(STORAGE_SYSTEMS_KEY, JSON.stringify(updated));
    const current = getCurrentMachineSystem();
    if (current && (current.systemId === systemNameOrId || current.systemName === systemNameOrId)) {
      localStorage.setItem(STORAGE_LOCAL_SYSTEM_KEY, JSON.stringify({ ...current, ...updates }));
    }
  } catch (e) {}

  // Update in Supabase Cloud
  if (supabase) {
    const updatePayload = {};
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.currentStudentRoll !== undefined) updatePayload.current_student_roll = updates.currentStudentRoll;
    if (updates.currentStudentName !== undefined) updatePayload.current_student_name = updates.currentStudentName;
    if (updates.currentExamName !== undefined) updatePayload.current_exam_name = updates.currentExamName;
    if (updates.violationsCount !== undefined) updatePayload.violations_count = updates.violationsCount;
    if (updates.examStartTime !== undefined) updatePayload.exam_start_time = updates.examStartTime;
    updatePayload.last_ping = new Date().toISOString();

    supabase.from('college_systems')
      .update(updatePayload)
      .or(`system_id.eq.${systemNameOrId},system_name.eq.${systemNameOrId}`)
      .then(({ error }) => {
        if (error) console.warn('Supabase system update notice:', error.message);
      })
      .catch(err => console.warn('Supabase update error:', err));
  }

  broadcastMessage({ type: 'SYSTEM_STATUS_UPDATED', systemId: systemNameOrId, updates });
}

// 8. Delete / Unregister a System
export function unregisterSystem(systemId) {
  const allSystems = getRegisteredSystems();
  const filtered = allSystems.filter(s => s.systemId !== systemId);

  try {
    localStorage.setItem(STORAGE_SYSTEMS_KEY, JSON.stringify(filtered));
    const current = getCurrentMachineSystem();
    if (current && current.systemId === systemId) {
      localStorage.removeItem(STORAGE_LOCAL_SYSTEM_KEY);
    }
  } catch (e) {}

  // Delete from Supabase Cloud
  if (supabase) {
    supabase.from('college_systems').delete().eq('system_id', systemId).then(() => {}).catch(() => {});
  }

  broadcastMessage({ type: 'SYSTEM_DELETED', systemId });
}

// 9. Report Cheating Incident to Supabase Logs
export function reportIncidentLog(log) {
  if (!log) return;
  if (supabase) {
    supabase.from('college_incident_logs').insert([{
      id: log.id || 'log-' + Date.now(),
      college_id: log.collegeId || '',
      system_id: log.systemId || '',
      system_name: log.systemName || 'Lab PC',
      student_roll: log.studentRoll || 'Unknown',
      student_name: log.studentName || 'Student',
      reason: log.reason || 'Security Violation'
    }]).then(() => {}).catch(err => console.warn('Supabase log error:', err));
  }
}

// 10. Broadcast Command across Local Network AND Worldwide Supabase Realtime
export function broadcastMessage(msg) {
  try {
    // 1. Local Browser BroadcastChannel (Instant tabs on same device)
    if (broadcastChannel) {
      broadcastChannel.postMessage(msg);
    }

    // 2. Storage Event (Fallback for tabs)
    localStorage.setItem('elite_college_broadcast_event', JSON.stringify({ ...msg, _t: Date.now() }));

    // 3. Supabase Cloud Worldwide Realtime (Instant across entire Internet / all networks)
    if (supabaseRealtimeChannel) {
      supabaseRealtimeChannel.send({
        type: 'broadcast',
        event: 'college_lab_event',
        payload: msg
      }).catch(err => console.warn('Supabase realtime broadcast error:', err));
    }
  } catch (e) {}
}

// 11. Listen to Incoming Messages / Broadcasts (Local + Supabase Cloud)
export function subscribeToCollegeEvents(callback) {
  const handleBcMessage = (event) => {
    if (event && event.data) {
      callback(event.data);
    }
  };

  const handleStorageEvent = (event) => {
    if (event.key === 'elite_college_broadcast_event' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        callback(parsed);
      } catch (e) {}
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBcMessage);
  }
  window.addEventListener('storage', handleStorageEvent);

  // Subscribe to Supabase Realtime Broadcast events
  if (supabaseRealtimeChannel) {
    supabaseRealtimeChannel.on('broadcast', { event: 'college_lab_event' }, ({ payload }) => {
      if (payload) callback(payload);
    });
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBcMessage);
    }
    window.removeEventListener('storage', handleStorageEvent);
  };
}
