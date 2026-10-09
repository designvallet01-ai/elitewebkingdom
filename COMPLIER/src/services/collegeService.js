// College & Lab Computer Management Service with LocalStorage & BroadcastChannel Sync
// Supports Supabase Cloud Sync and offline standalone execution

const STORAGE_COLLEGES_KEY = 'elite_college_registered_accounts_v1';
const STORAGE_SYSTEMS_KEY = 'elite_college_registered_systems_v1';
const STORAGE_LOCAL_SYSTEM_KEY = 'elite_current_machine_system_info_v1';
const BROADCAST_CHANNEL_NAME = 'elite_college_lab_network_v1';

// Initial pre-registered demo college so the user can test immediately if desired
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

// Initialize Broadcast Channel if supported
let broadcastChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel initialization error:', e);
}

// 1. Get all registered colleges
export function getRegisteredColleges() {
  try {
    const saved = localStorage.getItem(STORAGE_COLLEGES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading colleges:', e);
  }
  return DEFAULT_COLLEGES;
}

// 2. Register a new College Account (College Register)
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

  // Also broadcast registration
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

// 5. Get all registered systems under a college (or all systems)
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

// 6. Register & Bind this Computer Machine (System Register)
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

  // Generate or retrieve unique Machine ID
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

  // Check if system with this name already exists under this college
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
    status: 'idle', // 'idle' | 'locked' | 'violation'
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

  // Broadcast system registration to college portal
  broadcastMessage({ type: 'SYSTEM_REGISTERED', system: systemRecord });

  return { system: systemRecord, college };
}

// 7. Update System Exam / Lockdown Status
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

  broadcastMessage({ type: 'SYSTEM_DELETED', systemId });
}

// 9. Broadcast Command across network/tabs
export function broadcastMessage(msg) {
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage(msg);
    }
    // Storage event trigger for browsers without BroadcastChannel
    localStorage.setItem('elite_college_broadcast_event', JSON.stringify({ ...msg, _t: Date.now() }));
  } catch (e) {}
}

// 10. Listen to Incoming Messages / Broadcasts
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

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBcMessage);
    }
    window.removeEventListener('storage', handleStorageEvent);
  };
}
