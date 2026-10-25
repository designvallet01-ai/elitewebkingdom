// --- ELITE WEB KINGDOM TEAM PORTAL JS ---

// --- SUPABASE CLIENT INITIALIZATION ---
const SUPABASE_URL = "https://jgvgqgbhzadxvcolgvly.supabase.co";
const SUPABASE_KEY = "sb_publishable_5ToLoZzsP_B3FQoYBzTnEA_re1QwPPv";
let supabaseClient = null;

try {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch (err) {
  console.error('Failed to initialize Supabase client:', err);
}

// --- INITIAL TEAM DATA ---
const DEFAULT_TEAM_USERS = [
  {
    teamId: 'EWK-FD-001',
    name: 'GOWRI NARAYANA GUDURU',
    role: 'FOUNDER & LEAD DEVELOPER',
    phone: '9985369590',
    email: 'gowrinarayanaguduru@gmail.com',
    password: 'G1o2w3r4i5@',
    avatar: 'GN',
    status: 'Online'
  }
];

const DEFAULT_ASSIGNED_TASKS = [];

const DEFAULT_PROJECTS = [];

// --- INITIALIZE LOCAL STORAGE STORES ---
function initTeamStorage() {
  try {
    if (typeof localStorage !== 'undefined') {
      if (!localStorage.getItem('ewk_team_users')) {
        localStorage.setItem('ewk_team_users', JSON.stringify(DEFAULT_TEAM_USERS));
      }
      if (!localStorage.getItem('ewk_team_tasks')) {
        localStorage.setItem('ewk_team_tasks', JSON.stringify(DEFAULT_ASSIGNED_TASKS));
      }
      if (!localStorage.getItem('ewk_team_standups')) {
        localStorage.setItem('ewk_team_standups', JSON.stringify([]));
      }
    }
  } catch (e) {
    console.warn('Storage unavailable in current browser mode:', e);
  }
}
initTeamStorage();

// Current Logged In User State
let currentUser = null;

// --- QUICK CREDENTIAL FILLER ---
window.fillTeamCredentials = function(email, role) {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  if (emailInput) emailInput.value = email;
  if (passwordInput) passwordInput.value = 'team123456';
};

// --- AUTHENTICATION HANDLERS ---
const loginForm = document.getElementById('team-login-form');
const loginError = document.getElementById('login-error');
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');

async function checkSession() {
  // Check active session in LocalStorage or Supabase
  const storedUserJson = localStorage.getItem('ewk_team_current_user');
  if (storedUserJson) {
    try {
      currentUser = JSON.parse(storedUserJson);
      showDashboard(currentUser);
      return;
    } catch (e) {
      console.warn('Invalid local user session.');
    }
  }

  if (supabaseClient) {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (session && session.user) {
        currentUser = {
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          role: session.user.user_metadata?.role || 'Team Member',
          avatar: session.user.email.substring(0, 2).toUpperCase(),
          status: 'Online'
        };
        localStorage.setItem('ewk_team_current_user', JSON.stringify(currentUser));
        showDashboard(currentUser);
        return;
      }
    } catch (err) {
      console.log('Supabase session check:', err);
    }
  }
  showLoginForm();
}

function showLoginForm() {
  if (loginContainer) loginContainer.style.display = 'flex';
  if (dashboardContainer) dashboardContainer.style.display = 'none';
}

function showDashboard(user) {
  if (loginContainer) loginContainer.style.display = 'none';
  if (dashboardContainer) dashboardContainer.style.display = 'flex';

  // Update UI Elements with current user
  const displayUserName = document.getElementById('display-user-name');
  const displayUserRole = document.getElementById('display-user-role');
  const displayUserAvatar = document.getElementById('display-user-avatar');
  const overviewUserName = document.getElementById('overview-user-name');

  if (displayUserName) displayUserName.textContent = user.name || user.email;
  if (displayUserRole) displayUserRole.textContent = user.role || 'Team Member';
  if (displayUserAvatar) displayUserAvatar.textContent = user.avatar || (user.name ? user.name.substring(0, 2).toUpperCase() : 'TM');
  if (overviewUserName) overviewUserName.textContent = user.name ? user.name.split(' ')[0] : 'Team Member';

  initDashboardData();
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputEl = document.getElementById('team-id') || document.getElementById('email');
    const inputId = inputEl ? inputEl.value.trim() : '';
    const password = document.getElementById('password').value.trim();

    if (loginError) loginError.style.display = 'none';

    // 1. Try matching with Team Users local registry created by Admin (matching ID Card Number or Email)
    const users = JSON.parse(localStorage.getItem('ewk_team_users') || '[]');
    let foundUser = users.find(u => 
      ((u.teamId && u.teamId.toLowerCase() === inputId.toLowerCase()) || 
       (u.email && u.email.toLowerCase() === inputId.toLowerCase())) &&
      (u.password ? u.password === password : true)
    );

    if (foundUser) {
      currentUser = foundUser;
      localStorage.setItem('ewk_team_current_user', JSON.stringify(currentUser));
      showDashboard(currentUser);
      return;
    }

    // 2. Try Supabase Database public.team_members check
    if (supabaseClient) {
      try {
        const { data: dbMembers } = await supabaseClient.from('team_members').select('*');
        if (dbMembers && dbMembers.length > 0) {
          const match = dbMembers.find(m => 
            ((m.team_id && m.team_id.toLowerCase() === inputId.toLowerCase()) || 
             (m.email && m.email.toLowerCase() === inputId.toLowerCase())) &&
            m.password === password
          );

          if (match) {
            currentUser = {
              id: match.id,
              teamId: match.team_id,
              email: match.email || `${match.team_id.toLowerCase()}@elitewebkingdom.com`,
              name: match.name,
              role: match.role,
              phone: match.phone || '',
              password: match.password,
              avatar: match.avatar || match.name.substring(0, 2).toUpperCase(),
              status: match.status || 'Online'
            };
            localStorage.setItem('ewk_team_current_user', JSON.stringify(currentUser));
            showDashboard(currentUser);
            return;
          }
        }
      } catch (dbErr) {
        console.warn('Supabase DB team_members auth check error:', dbErr);
      }
    }

    // 3. Try Supabase Auth API if configured
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email: inputId, password });
        if (error) throw error;
        if (data.user) {
          currentUser = {
            teamId: inputId,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || inputId,
            role: data.user.user_metadata?.role || 'Team Member',
            avatar: inputId.substring(0, 2).toUpperCase(),
            status: 'Online'
          };
          localStorage.setItem('ewk_team_current_user', JSON.stringify(currentUser));
          showDashboard(currentUser);
          return;
        }
      } catch (authErr) {
        console.warn('Supabase Auth error:', authErr.message);
      }
    }

    if (loginError) {
      loginError.textContent = 'Invalid Team ID Card Number or Password. Please check the credentials assigned to you by Admin.';
      loginError.style.display = 'block';
    }
  });
}

// LOGOUT
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    localStorage.removeItem('ewk_team_current_user');
    if (supabaseClient) {
      try { await supabaseClient.auth.signOut(); } catch (e) {}
    }
    window.location.reload();
  });
}

// --- TAB SWITCHER ---
window.switchTab = function(tabId) {
  const links = document.querySelectorAll('.sidebar-link');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === `#${tabId}`) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  const panels = document.querySelectorAll('.tab-panel');
  panels.forEach(panel => {
    if (panel.id === `tab-${tabId}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  if (tabId === 'certificates') {
    loadTeamCertificates();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- DATA INITIALIZATION & RENDERING ---
async function initDashboardData() {
  renderAssignedWorks();
  renderKanbanBoard();
  renderProjects();
  renderStandupHistory();
  renderTeamRoster();
  loadTeamCertificates();
  
  await loadTeamPortalDataFromSupabase();
}

async function loadTeamPortalDataFromSupabase() {
  if (!supabaseClient) return;

  try {
    // 1. Fetch Team Members
    const { data: members, error: memErr } = await supabaseClient
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: true });
      
    if (!memErr && members && members.length > 0) {
      const formattedMembers = members.map(m => ({
        id: m.id,
        teamId: m.team_id,
        name: m.name,
        role: m.role,
        phone: m.phone || '',
        email: m.email || '',
        password: m.password,
        avatar: m.avatar || m.name.substring(0, 2).toUpperCase(),
        status: m.status || 'Online'
      }));
      localStorage.setItem('ewk_team_users', JSON.stringify(formattedMembers));
      renderTeamRoster();
    }

    // 2. Fetch Team Tasks
    const { data: tasks, error: taskErr } = await supabaseClient
      .from('team_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!taskErr && tasks && tasks.length > 0) {
      const formattedTasks = tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        category: t.category || 'Backend',
        priority: t.priority || 'Medium',
        assignedTo: t.assigned_to,
        assignedByName: t.assigned_by_name || 'Admin',
        status: t.status || 'Pending',
        dueDate: t.due_date || '',
        createdAt: t.created_at
      }));
      localStorage.setItem('ewk_team_tasks', JSON.stringify(formattedTasks));
      renderAssignedWorks();
      renderKanbanBoard();
    }

    // 3. Fetch Team Standups
    const { data: standups, error: stErr } = await supabaseClient
      .from('team_standups')
      .select('*')
      .order('created_at', { ascending: false });

    if (!stErr && standups && standups.length > 0) {
      const formattedStandups = standups.map(s => ({
        id: s.id,
        userName: s.user_name,
        userRole: s.user_role || 'Specialist',
        userAvatar: s.user_avatar || 'TM',
        accomplished: s.accomplished,
        next: s.next,
        blockers: s.blockers || 'None',
        createdAt: new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today'
      }));
      localStorage.setItem('ewk_team_standups', JSON.stringify(formattedStandups));
      renderStandupHistory();
    }

    // 4. Fetch Client Projects
    const { data: projects, error: prjErr } = await supabaseClient
      .from('client_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (!prjErr && projects && projects.length > 0) {
      const formattedProjects = projects.map(p => ({
        id: p.id,
        title: p.title,
        client: p.client,
        progress: p.progress || 0,
        tech: p.tech ? p.tech.split(',').map(s => s.trim()) : [],
        deadline: p.deadline || 'Ongoing',
        createdAt: p.created_at
      }));
      localStorage.setItem('ewk_client_projects', JSON.stringify(formattedProjects));
      renderProjects();
    }
  } catch (err) {
    console.warn('Team Portal Supabase Sync Error:', err);
  }
}

// Render Works Assigned Specifically to Logged In User
function getTeamTasks() {
  return JSON.parse(localStorage.getItem('ewk_team_tasks') || '[]');
}

function saveTeamTasks(tasks) {
  localStorage.setItem('ewk_team_tasks', JSON.stringify(tasks));
}

function renderAssignedWorks() {
  const allTasks = getTeamTasks();
  const currentId = currentUser ? (currentUser.teamId || currentUser.email || '').toLowerCase() : '';

  // Filter tasks assigned to current user ID Card Number
  const myTasks = allTasks.filter(t => t.assignedTo && t.assignedTo.toLowerCase() === currentId);

  // Update counts
  const myWorksBadge = document.getElementById('my-works-count');
  if (myWorksBadge) myWorksBadge.textContent = myTasks.length;

  const kpiMyTasks = document.getElementById('kpi-my-tasks');
  const kpiInProgress = document.getElementById('kpi-in-progress');
  const kpiReviews = document.getElementById('kpi-reviews');
  const kpiCompleted = document.getElementById('kpi-completed');

  if (kpiMyTasks) kpiMyTasks.textContent = myTasks.length;
  if (kpiInProgress) kpiInProgress.textContent = myTasks.filter(t => t.status === 'In Progress').length;
  if (kpiReviews) kpiReviews.textContent = myTasks.filter(t => t.status === 'Code Review').length;
  if (kpiCompleted) kpiCompleted.textContent = myTasks.filter(t => t.status === 'Completed').length;

  // Render Table in Overview & My Works
  const overviewTbody = document.getElementById('overview-assigned-tbody');
  const myWorksTbody = document.getElementById('my-works-tbody');

  const rowsHtml = myTasks.length === 0 ? `
    <tr>
      <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">
        No pending works currently assigned to you by Admin.
      </td>
    </tr>
  ` : myTasks.map(t => `
    <tr>
      <td style="font-weight: 600; color: var(--text-bright);">${t.title}</td>
      <td><span style="background: rgba(255,255,255,0.06); padding: 4px 8px; border-radius: 4px; font-size: 0.78rem;">${t.category}</span></td>
      <td><span class="task-tag tag-${t.priority ? t.priority.toLowerCase() : 'medium'}">${t.priority}</span></td>
      <td><span style="color: ${getStatusColor(t.status)}; font-weight: 600;">${t.status}</span></td>
      <td style="font-size: 0.82rem; color: var(--text-muted);">${t.dueDate || 'No Due Date'}</td>
      <td>
        <div class="task-actions">
          ${t.status !== 'In Progress' && t.status !== 'Completed' ? `
            <button class="btn-task-action" onclick="updateTaskStatus('${t.id}', 'In Progress')">Start Work</button>
          ` : ''}
          ${t.status === 'In Progress' ? `
            <button class="btn-task-action" onclick="updateTaskStatus('${t.id}', 'Code Review')">Submit Review</button>
          ` : ''}
          ${t.status !== 'Completed' ? `
            <button class="btn-task-action" style="color: var(--emerald-accent);" onclick="updateTaskStatus('${t.id}', 'Completed')">Mark Done</button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  if (overviewTbody) overviewTbody.innerHTML = rowsHtml;
  if (myWorksTbody) myWorksTbody.innerHTML = rowsHtml;
}

function getStatusColor(status) {
  switch (status) {
    case 'In Progress': return '#f59e0b';
    case 'Code Review': return '#8b5cf6';
    case 'Completed': return '#10b981';
    default: return '#94a3b8';
  }
}

window.updateTaskStatus = async function(taskId, newStatus) {
  const tasks = getTeamTasks();
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.status = newStatus;
    saveTeamTasks(tasks);

    if (supabaseClient) {
      try {
        await supabaseClient.from('team_tasks').update({ status: newStatus }).eq('id', taskId);
      } catch (err) {
        console.warn('Supabase task status update error:', err);
      }
    }

    renderAssignedWorks();
    renderKanbanBoard();
  }
};

// Render Sprint Kanban Board
function renderKanbanBoard() {
  const tasks = getTeamTasks();

  const backlog = tasks.filter(t => t.status === 'Pending' || t.status === 'Backlog');
  const inProgress = tasks.filter(t => t.status === 'In Progress');
  const codeReview = tasks.filter(t => t.status === 'Code Review');
  const completed = tasks.filter(t => t.status === 'Completed');

  document.getElementById('count-backlog').textContent = backlog.length;
  document.getElementById('count-in-progress').textContent = inProgress.length;
  document.getElementById('count-code-review').textContent = codeReview.length;
  document.getElementById('count-completed').textContent = completed.length;

  document.getElementById('tasks-backlog').innerHTML = renderTaskCards(backlog);
  document.getElementById('tasks-in-progress').innerHTML = renderTaskCards(inProgress);
  document.getElementById('tasks-code-review').innerHTML = renderTaskCards(codeReview);
  document.getElementById('tasks-completed').innerHTML = renderTaskCards(completed);
}

function renderTaskCards(taskList) {
  if (taskList.length === 0) {
    return `<div style="font-size: 0.82rem; color: var(--text-subtle); padding: 12px; text-align: center;">No tasks</div>`;
  }
  return taskList.map(t => `
    <div class="task-card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="task-tag tag-${t.priority ? t.priority.toLowerCase() : 'medium'}">${t.priority}</span>
        <span style="font-size: 0.72rem; color: var(--text-subtle);">${t.category}</span>
      </div>
      <div class="task-title">${t.title}</div>
      <div class="task-desc">${t.description}</div>
      <div class="task-footer">
        <div class="task-assignee">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span>${t.assignedTo.split('@')[0]}</span>
        </div>
        <div>${t.dueDate ? t.dueDate.substring(5) : ''}</div>
      </div>
    </div>
  `).join('');
}

// Render Active Client Builds
function renderProjects() {
  const container = document.getElementById('projects-grid');
  if (!container) return;

  const projects = JSON.parse(localStorage.getItem('ewk_client_projects') || '[]');

  if (projects.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 32px; color: var(--text-muted);" class="glass-card">
        No active client builds created yet. Client projects are added and managed by Admin in the Admin Control Panel.
      </div>
    `;
    return;
  }

  container.innerHTML = projects.map(p => `
    <div class="glass-card" style="padding: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-bright);">${p.title}</h3>
        <span style="background: rgba(0, 242, 254, 0.1); color: var(--cyan-primary); padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600;">${p.progress || 0}% Complete</span>
      </div>
      <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">Client: ${p.client}</div>
      
      <!-- Progress Bar -->
      <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; margin-bottom: 16px;">
        <div style="width: ${p.progress || 0}%; height: 100%; background: var(--grad-primary);"></div>
      </div>

      <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
        ${(Array.isArray(p.tech) ? p.tech : (p.tech || '').split(',')).map(t => `<span style="background: rgba(255,255,255,0.05); font-size: 0.75rem; color: var(--text-muted); padding: 2px 8px; border-radius: 4px;">${t.trim()}</span>`).join('')}
      </div>

      <div style="font-size: 0.8rem; color: var(--text-subtle); display: flex; align-items: center; justify-content: space-between;">
        <span>Target Deadline:</span>
        <strong style="color: var(--text-main);">${p.deadline || 'Ongoing'}</strong>
      </div>
    </div>
  `).join('');
}

// Render Daily Standups
const standupForm = document.getElementById('standup-form');
if (standupForm) {
  standupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const accomplished = document.getElementById('standup-accomplished').value.trim();
    const next = document.getElementById('standup-next').value.trim();
    const blockers = document.getElementById('standup-blockers').value.trim();

    const newStandup = {
      id: 'st-' + Date.now(),
      userName: currentUser ? currentUser.name : 'Team Member',
      userRole: currentUser ? currentUser.role : 'Specialist',
      userAvatar: currentUser ? currentUser.avatar : 'TM',
      accomplished,
      next,
      blockers: blockers || 'None',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today'
    };

    const standups = JSON.parse(localStorage.getItem('ewk_team_standups') || '[]');
    standups.unshift(newStandup);
    localStorage.setItem('ewk_team_standups', JSON.stringify(standups));

    if (supabaseClient) {
      try {
        await supabaseClient.from('team_standups').insert([{
          id: newStandup.id,
          user_name: newStandup.userName,
          user_role: newStandup.userRole,
          user_avatar: newStandup.userAvatar,
          accomplished: newStandup.accomplished,
          next: newStandup.next,
          blockers: newStandup.blockers
        }]);
      } catch (err) {
        console.warn('Supabase standup insert error:', err);
      }
    }

    standupForm.reset();
    renderStandupHistory();
  });
}

function renderStandupHistory() {
  const container = document.getElementById('standup-history-list');
  if (!container) return;

  const standups = JSON.parse(localStorage.getItem('ewk_team_standups') || '[]');
  if (standups.length === 0) {
    container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem;">No standup entries recorded today yet. Be the first to submit!</div>`;
    return;
  }

  container.innerHTML = standups.map(s => `
    <div class="standup-history-item">
      <div class="standup-meta">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--grad-primary); color: #020617; font-weight: 800; font-size: 0.75rem; display: flex; align-items: center; justify-content: center;">${s.userAvatar}</div>
          <strong style="color: var(--text-bright);">${s.userName}</strong>
          <span style="color: var(--cyan-primary); font-size: 0.78rem;">(${s.userRole})</span>
        </div>
        <div>${s.createdAt}</div>
      </div>
      <div style="font-size: 0.88rem; color: var(--text-main); margin-bottom: 6px;">
        <strong style="color: var(--emerald-accent);">Accomplished:</strong> ${s.accomplished}
      </div>
      <div style="font-size: 0.88rem; color: var(--text-main); margin-bottom: 6px;">
        <strong style="color: var(--cyan-primary);">Next Steps:</strong> ${s.next}
      </div>
      ${s.blockers !== 'None' ? `
        <div style="font-size: 0.88rem; color: var(--rose-accent);">
          <strong>Blockers:</strong> ${s.blockers}
        </div>
      ` : ''}
    </div>
  `).join('');
}

// Render Team Roster
function renderTeamRoster() {
  const container = document.getElementById('roster-grid');
  if (!container) return;

  const users = JSON.parse(localStorage.getItem('ewk_team_users') || '[]');

  if (users.length === 0) {
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 24px;">No team members registered yet.</div>`;
    return;
  }

  container.innerHTML = users.map(u => `
    <div class="member-card glass-card">
      <div class="member-avatar">${u.avatar || u.name.substring(0,2).toUpperCase()}</div>
      <div class="member-name">${u.name}</div>
      <div class="member-role">${u.role}</div>
      <div style="font-size: 0.83rem; color: var(--text-muted); margin-top: 8px; display: flex; flex-direction: column; gap: 4px;">
        <span>📞 <a href="tel:${u.phone || ''}" style="color: var(--text-main); text-decoration: none;">${u.phone || 'N/A'}</a></span>
        <span>✉️ <a href="mailto:${u.email || ''}" style="color: var(--text-main); text-decoration: none;">${u.email || 'N/A'}</a></span>
      </div>
      <div style="margin-top: 12px; display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">
        ${u.phone ? `<a href="https://wa.me/${u.phone.replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-secondary btn-sm" style="color: #25D366;">WhatsApp</a>` : ''}
        ${u.email ? `<a href="mailto:${u.email}" class="btn btn-secondary btn-sm">Email</a>` : ''}
      </div>
    </div>
  `).join('');
}

// INITIAL CHECK
checkSession();

// =================================================================
// --- TEAM CERTIFICATES MANAGEMENT SUITE ---
// =================================================================
window.teamCertificates = [];

const DEFAULT_TEAM_CERTIFICATES = [
  {
    id: "cert-seed-001",
    certificate_id: "EIDE-2026-10-0001",
    main_heading: "Certificate of Achievement",
    recipient_name: "Korina Villanueva",
    award_category: "Top Performer & Coding Excellence",
    achievement_description: "in recognition of outstanding coding performance, problem-solving skills, and demonstrated technical excellence through Elite IDE. This award recognizes the recipient's dedication to programming, consistent performance, and commitment to innovation during the October 2026 evaluation period.",
    performance_month: "October 2026",
    issue_date: "2026-10-25",
    issuer_name: "Elite Web Kingdom & Elite IDE",
    signatory_name: "Bathala Harika",
    signatory_role: "Executive Director",
    status: "Verified"
  }
];

window.loadTeamCertificates = async function() {
  let certs = [];
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        certs = data.map(c => {
          if (!c.signatory_name || c.signatory_name === 'Gowri Narayana Guduru') {
            c.signatory_name = 'Bathala Harika';
            c.signatory_role = 'Executive Director';
          }
          return c;
        });
        try { localStorage.setItem('ewk_certificates', JSON.stringify(certs)); } catch(e){}
      }
    } catch (err) {
      console.warn("Supabase team certs load error:", err);
    }
  }

  if (certs.length === 0) {
    try {
      const local = localStorage.getItem('ewk_certificates');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          certs = parsed.map(c => {
            if (!c.signatory_name || c.signatory_name === 'Gowri Narayana Guduru') {
              c.signatory_name = 'Bathala Harika';
              c.signatory_role = 'Executive Director';
            }
            return c;
          });
        }
      }
    } catch(e){}
  }

  if (certs.length === 0) certs = DEFAULT_TEAM_CERTIFICATES;

  window.teamCertificates = certs;

  const countBadge = document.getElementById('team-certificates-count');
  if (countBadge) countBadge.textContent = certs.length;

  const dateInput = document.getElementById('team-cert-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  const idInput = document.getElementById('team-cert-id');
  if (idInput && !idInput.value) {
    window.generateTeamCertId();
  }

  window.renderTeamCertificates();
};

window.generateTeamCertId = function() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `EIDE-${year}-${month}-`;

  let maxSeq = 0;
  (window.teamCertificates || []).forEach(c => {
    if (c.certificate_id && c.certificate_id.startsWith(prefix)) {
      const parts = c.certificate_id.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxSeq) maxSeq = num;
    }
  });

  const nextId = `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
  const input = document.getElementById('team-cert-id');
  if (input) input.value = nextId;
  return nextId;
};

window.toggleTeamCertForm = function() {
  const card = document.getElementById('team-cert-form-card');
  const btn = document.getElementById('btn-toggle-team-cert-form');
  if (!card) return;

  if (card.style.display === 'none') {
    card.style.display = 'block';
    if (btn) btn.textContent = '✕ Close Form';
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    card.style.display = 'none';
    if (btn) btn.textContent = '+ Register New Certificate';
  }
};

window.handleTeamCertRegister = async function(e) {
  if (e) e.preventDefault();

  const heading = document.getElementById('team-cert-heading')?.value || 'Certificate of Achievement';
  const name = document.getElementById('team-cert-name')?.value.trim();
  const category = document.getElementById('team-cert-category')?.value || 'Top Performer';
  const month = document.getElementById('team-cert-month')?.value.trim() || 'October 2026';
  const issueDate = document.getElementById('team-cert-date')?.value || new Date().toISOString().split('T')[0];
  const certId = (document.getElementById('team-cert-id')?.value.trim() || window.generateTeamCertId()).toUpperCase();
  const desc = document.getElementById('team-cert-desc')?.value.trim();

  if (!name || !desc || !certId) {
    alert("Please fill in recipient name, certificate ID and description.");
    return;
  }

  const existing = (window.teamCertificates || []).find(c => c.certificate_id.toLowerCase() === certId.toLowerCase());
  if (existing) {
    alert(`Certificate ID '${certId}' is already registered for ${existing.recipient_name}.`);
    return;
  }

  const newCert = {
    id: `cert-${Date.now()}`,
    certificate_id: certId,
    main_heading: heading,
    recipient_name: name,
    award_category: category,
    achievement_description: desc,
    performance_month: month,
    issue_date: issueDate,
    issuer_name: "Elite Web Kingdom & Elite IDE",
    signatory_name: "Bathala Harika",
    signatory_role: "Executive Director",
    status: "Verified",
    created_at: new Date().toISOString()
  };

  if (supabaseClient) {
    try {
      await supabaseClient.from('certificates').insert([newCert]);
    } catch(err) {
      console.warn("Supabase insert cert error:", err);
    }
  }

  window.teamCertificates.unshift(newCert);
  try { localStorage.setItem('ewk_certificates', JSON.stringify(window.teamCertificates)); } catch(e){}

  // Reset form
  const nameInput = document.getElementById('team-cert-name');
  const descInput = document.getElementById('team-cert-desc');
  if (nameInput) nameInput.value = '';
  if (descInput) descInput.value = '';
  window.generateTeamCertId();

  window.loadTeamCertificates();

  const verifyUrl = `${window.location.origin}/verify-certificate.html?id=${encodeURIComponent(certId)}`;
  const open = confirm(`🎉 Certificate Successfully Registered!\n\nID: ${certId}\nDeveloper: ${name}\nCategory: ${category}\n\nOpen Verification Portal in new window now?`);
  if (open) {
    window.open(verifyUrl, '_blank');
  }
};

window.renderTeamCertificates = function() {
  const query = (document.getElementById('team-cert-search')?.value || '').toLowerCase().trim();
  const tbody = document.getElementById('team-certificates-tbody');
  if (!tbody) return;

  const filtered = (window.teamCertificates || []).filter(c => {
    return !query || 
      (c.certificate_id && c.certificate_id.toLowerCase().includes(query)) ||
      (c.recipient_name && c.recipient_name.toLowerCase().includes(query)) ||
      (c.award_category && c.award_category.toLowerCase().includes(query)) ||
      (c.performance_month && c.performance_month.toLowerCase().includes(query));
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 24px; color: var(--text-muted);">No certificates found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(c => `
    <tr>
      <td><strong style="color: var(--cyan-primary); font-family: monospace;">${escapeHtml(c.certificate_id)}</strong></td>
      <td style="font-weight: 700; color: #fff;">${escapeHtml(c.recipient_name)}</td>
      <td>
        <span style="display:inline-block; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 700; background: rgba(245,158,11,0.15); color: #fbbf24;">
          ${escapeHtml(c.award_category)}
        </span>
      </td>
      <td style="color: var(--text-muted); font-size: 0.85rem;">${escapeHtml(c.performance_month)}</td>
      <td style="color: var(--text-muted); font-size: 0.82rem; font-family: monospace;">${escapeHtml(c.issue_date)}</td>
      <td><span class="badge" style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); font-size: 0.72rem;">✓ Verified</span></td>
      <td>
        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
          <a href="../verify-certificate.html?id=${encodeURIComponent(c.certificate_id)}" target="_blank" class="btn btn-secondary btn-sm" style="color: var(--cyan-primary);" title="Verify Certificate">
            👁️
          </a>
          <button class="btn btn-secondary btn-sm" onclick="openTeamCertPreviewModal('${escapeHtml(c.certificate_id)}')" style="color: #fbbf24; border-color: rgba(245,158,11,0.4);" title="View Certificate Preview">
            🖨️ View
          </button>
          <button class="btn btn-secondary btn-sm" onclick="downloadTeamRowCert('${escapeHtml(c.certificate_id)}')" style="color: #34d399; border-color: rgba(16,185,129,0.4);" title="Download Certificate PNG">
            📥 Download
          </button>
          <button class="btn btn-secondary btn-sm" onclick="copyTeamCertLink('${escapeHtml(c.certificate_id)}')" title="Copy Link">
            📋
          </button>
        </div>
      </td>
    </tr>
  `).join('');
};

window.activeTeamPreviewCert = null;

function formatTeamCertDate(dateStr) {
  if (!dateStr) return '25 October 2026';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const y = parts[0];
      const m = months[parseInt(parts[1], 10) - 1] || parts[1];
      const d = parts[2];
      return `${d} ${m} ${y}`;
    }
    return dateStr;
  } catch(e) {
    return dateStr;
  }
}

function generateTeamLuxuryCertHtml(cert, canvasId, qrContainerId) {
  const descText = cert.achievement_description || 
    "Awarded in recognition of exceptional engineering leadership, delivering high-impact code across core platforms, and exemplary technical excellence.";

  return `
    <div id="${canvasId}" style="min-width: 720px; max-width: 820px; width: 100%; margin: 0 auto; background: radial-gradient(circle at 50% 30%, #0f172a 0%, #030712 100%); border: 3px solid #d4af37; border-radius: 12px; position: relative; padding: 36px 42px; box-shadow: 0 0 0 6px #030712, 0 0 0 8px rgba(212, 175, 55, 0.4), 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(245, 158, 11, 0.15); color: #ffffff; overflow: hidden; box-sizing: border-box; text-align: center;">
      <!-- Inner Border -->
      <div style="position: absolute; inset: 12px; border: 1px solid rgba(212, 175, 55, 0.5); pointer-events: none; border-radius: 6px;"></div>

      <!-- Gold Corner Accents -->
      <div style="position: absolute; top: 16px; left: 16px; width: 22px; height: 22px; border-top: 3px solid #d4af37; border-left: 3px solid #d4af37; pointer-events: none;"></div>
      <div style="position: absolute; top: 16px; right: 16px; width: 22px; height: 22px; border-top: 3px solid #d4af37; border-right: 3px solid #d4af37; pointer-events: none;"></div>
      <div style="position: absolute; bottom: 16px; left: 16px; width: 22px; height: 22px; border-bottom: 3px solid #d4af37; border-left: 3px solid #d4af37; pointer-events: none;"></div>
      <div style="position: absolute; bottom: 16px; right: 16px; width: 22px; height: 22px; border-bottom: 3px solid #d4af37; border-right: 3px solid #d4af37; pointer-events: none;"></div>

      <!-- Center Watermark -->
      <img src="/logo.jpeg" alt="Watermark" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.04; width: 360px; height: 360px; pointer-events: none; filter: grayscale(100%); z-index: 0;">

      <div style="position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center;">
        <!-- Brand Row -->
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 12px;">
          <img src="/logo.jpeg" alt="Logo" style="width: 46px; height: 46px; border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.6); box-shadow: 0 0 15px rgba(245, 158, 11, 0.3);">
          <div>
            <div style="font-family: 'Cinzel', serif; font-size: 1.15rem; font-weight: 800; letter-spacing: 3px; color: #f8fafc; text-transform: uppercase;">
              ELITE WEB KINGDOM
            </div>
            <div style="font-size: 0.72rem; color: #00f2fe; letter-spacing: 2px; text-transform: uppercase; font-weight: 600;">
              ENGINEERING DISTINCTION
            </div>
          </div>
        </div>

        <!-- Main Heading -->
        <h2 style="font-family: 'Cinzel', serif; font-size: 2rem; font-weight: 900; letter-spacing: 3px; color: #fbbf24; text-transform: uppercase; margin: 8px 0 3px; line-height: 1.2;">
          ${escapeHtml(cert.main_heading || 'CERTIFICATE OF ACHIEVEMENT')}
        </h2>
        <div style="font-size: 0.8rem; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px;">
          Official Credential of Engineering Distinction
        </div>

        <div style="font-style: italic; font-family: 'Playfair Display', serif; font-size: 1rem; color: #cbd5e1; margin-bottom: 6px;">
          This is proudly presented to
        </div>

        <!-- Recipient Name -->
        <div style="font-family: 'Playfair Display', serif; font-size: 2.3rem; font-weight: 700; color: #ffffff; letter-spacing: 1px; margin-bottom: 10px; text-shadow: 0 0 20px rgba(0, 242, 254, 0.3); border-bottom: 2px solid rgba(212, 175, 55, 0.6); padding-bottom: 4px; display: inline-block; min-width: 280px;">
          ${escapeHtml(cert.recipient_name)}
        </div>

        <!-- Award Category Pill -->
        <div style="display: inline-block; margin: 6px 0 12px; padding: 4px 16px; border-radius: 20px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #fbbf24; font-weight: 700; font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase;">
          ${escapeHtml(cert.award_category)}
        </div>

        <!-- Achievement Description -->
        <p style="max-width: 600px; font-size: 0.9rem; color: #cbd5e1; line-height: 1.55; margin: 0 auto 8px; font-style: italic;">
          "${escapeHtml(descText)}"
        </p>

        <div style="font-size: 0.82rem; color: #00f2fe; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 22px;">
          Performance Period: ${escapeHtml(cert.performance_month)}
        </div>

        <!-- Footer Row -->
        <div style="width: 100%; display: flex; align-items: flex-end; justify-content: space-between; margin-top: 6px; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.08); gap: 16px;">
          <!-- Left: QR Code Box + ID -->
          <div style="display: flex; flex-direction: column; align-items: flex-start; flex: 1;">
            <div id="${qrContainerId}" style="width: 74px; height: 74px; background: #ffffff; border-radius: 8px; padding: 4px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5); margin-bottom: 5px;"></div>
            <div style="font-family: monospace; font-size: 0.75rem; color: #00f2fe; font-weight: 700;">
              ID: ${escapeHtml(cert.certificate_id)}
            </div>
            <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 2px;">
              Issued: ${escapeHtml(cert.issue_date)}
            </div>
          </div>

          <!-- Center: Verified Seal Graphic -->
          <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
            <div style="width: 68px; height: 68px; border-radius: 50%; background: radial-gradient(circle, #f59e0b 0%, #b45309 80%, #78350f 100%); border: 3px double #fef08a; box-shadow: 0 0 25px rgba(245, 158, 11, 0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; color: #ffffff; text-align: center; margin-bottom: 4px; font-size: 0.56rem; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; line-height: 1.1; padding: 4px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fef08a" stroke-width="2.5" style="margin-bottom: 2px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              <span>ELITE<br>VERIFIED</span>
            </div>
            <span style="font-size: 0.6rem; color: #d4af37; letter-spacing: 1px; text-transform: uppercase; font-weight: 700;">Verified Seal</span>
          </div>

          <!-- Right: Signatory Bathala Harika - Executive Director -->
          <div style="display: flex; flex-direction: column; align-items: flex-end; flex: 1;">
            <div style="font-family: 'Herr Von Muellerhoff', cursive; font-size: 2rem; color: #f8fafc; letter-spacing: 1px; border-bottom: 1px solid rgba(212, 175, 55, 0.6); padding: 0 16px 2px; margin-bottom: 3px; line-height: 1;">
              Bathala Harika
            </div>
            <div style="font-size: 0.85rem; font-weight: 700; color: #ffffff;">
              Bathala Harika
            </div>
            <div style="font-size: 0.72rem; color: #fbbf24; font-weight: 600; letter-spacing: 0.5px;">
              Executive Director
            </div>
            <div style="font-size: 0.68rem; color: #94a3b8; margin-top: 1px;">
              Elite Web Kingdom
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderTeamCertQR(text, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (window.QRCode && typeof window.QRCode.toCanvas === 'function') {
    const canvas = document.createElement('canvas');
    window.QRCode.toCanvas(canvas, text, {
      width: 66,
      margin: 1,
      color: {
        dark: '#030712',
        light: '#ffffff'
      }
    }, function(error) {
      if (!error) {
        container.appendChild(canvas);
      } else {
        const img = document.createElement('img');
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(text)}`;
        img.style.width = '66px';
        img.style.height = '66px';
        container.appendChild(img);
      }
    });
  } else {
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(text)}`;
    img.style.width = '66px';
    img.style.height = '66px';
    container.appendChild(img);
  }
}

window.openTeamCertPreviewModal = function(certId) {
  const cert = (window.teamCertificates || []).find(c => c.certificate_id === certId);
  if (!cert) return;

  window.activeTeamPreviewCert = cert;
  const modal = document.getElementById('team-cert-preview-modal');
  const modalBody = document.getElementById('team-cert-modal-body');

  if (!modal || !modalBody) return;

  modalBody.innerHTML = generateTeamLuxuryCertHtml(cert, 'team-active-cert-canvas', 'team-modal-qr-container');
  const verifyUrl = `${window.location.origin}/verify-certificate.html?id=${encodeURIComponent(cert.certificate_id)}`;
  renderTeamCertQR(verifyUrl, 'team-modal-qr-container');
  modal.style.display = 'flex';
};

window.closeTeamCertPreviewModal = function() {
  const modal = document.getElementById('team-cert-preview-modal');
  if (modal) modal.style.display = 'none';
  window.activeTeamPreviewCert = null;
};

window.downloadTeamCertPNG = function() {
  const certEl = document.getElementById('team-active-cert-canvas');
  if (!certEl) return;
  const certId = window.activeTeamPreviewCert ? window.activeTeamPreviewCert.certificate_id : 'EIDE-CERT';

  if (window.html2canvas) {
    window.html2canvas(certEl, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#030712',
      logging: false
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = `Certificate_${certId}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }).catch(err => {
      console.error("Team canvas export error:", err);
      window.printTeamCert();
    });
  } else {
    window.printTeamCert();
  }
};

window.downloadTeamRowCert = function(certId) {
  const cert = (window.teamCertificates || []).find(c => c.certificate_id === certId);
  if (!cert) return;

  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  tempContainer.style.width = '820px';
  tempContainer.style.zIndex = '-9999';
  const qrId = `temp-team-row-qr-${Date.now()}`;
  tempContainer.innerHTML = generateTeamLuxuryCertHtml(cert, 'temp-team-row-canvas', qrId);
  document.body.appendChild(tempContainer);

  const verifyUrl = `${window.location.origin}/verify-certificate.html?id=${encodeURIComponent(cert.certificate_id)}`;
  renderTeamCertQR(verifyUrl, qrId);

  const canvasTarget = document.getElementById('temp-team-row-canvas') || tempContainer;

  setTimeout(() => {
    if (window.html2canvas) {
      window.html2canvas(canvasTarget, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#030712',
        logging: false
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Certificate_${cert.certificate_id}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
      }).catch(err => {
        console.error("Row cert download error:", err);
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
        window.openTeamCertPreviewModal(certId);
      });
    } else {
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
      window.openTeamCertPreviewModal(certId);
    }
  }, 100);
};

window.printTeamCert = function() {
  window.print();
};

window.openTeamCertDirectVerifier = function() {
  if (window.activeTeamPreviewCert) {
    const url = `../verify-certificate.html?id=${encodeURIComponent(window.activeTeamPreviewCert.certificate_id)}`;
    window.open(url, '_blank');
  }
};

window.copyTeamCertLink = function(certId) {
  const url = `${window.location.origin}/verify-certificate.html?id=${encodeURIComponent(certId)}`;
  navigator.clipboard.writeText(url).then(() => {
    alert(`Verification link copied to clipboard:\n${url}`);
  }).catch(() => {
    prompt("Copy this verification URL:", url);
  });
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

