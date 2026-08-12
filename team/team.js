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

    // 2. Try Supabase Authentication if configured
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

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- DATA INITIALIZATION & RENDERING ---
function initDashboardData() {
  renderAssignedWorks();
  renderKanbanBoard();
  renderProjects();
  renderStandupHistory();
  renderTeamRoster();
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

window.updateTaskStatus = function(taskId, newStatus) {
  const tasks = getTeamTasks();
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.status = newStatus;
    saveTeamTasks(tasks);
    initDashboardData();
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
  standupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const accomplished = document.getElementById('standup-accomplished').value.trim();
    const next = document.getElementById('standup-next').value.trim();
    const blockers = document.getElementById('standup-blockers').value.trim();

    const standups = JSON.parse(localStorage.getItem('ewk_team_standups') || '[]');
    standups.unshift({
      id: 'st-' + Date.now(),
      userName: currentUser ? currentUser.name : 'Team Member',
      userRole: currentUser ? currentUser.role : 'Specialist',
      userAvatar: currentUser ? currentUser.avatar : 'TM',
      accomplished,
      next,
      blockers: blockers || 'None',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today'
    });

    localStorage.setItem('ewk_team_standups', JSON.stringify(standups));
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
      <div style="font-size: 0.8rem; color: var(--cyan-primary); font-weight: 600; margin-top: 4px;">
        ID Card: ${u.teamId || u.email}
      </div>
      <div style="font-size: 0.83rem; color: var(--text-muted); margin-top: 6px; display: flex; flex-direction: column; gap: 4px;">
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
