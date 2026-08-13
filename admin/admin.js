// --- ELITE WEB KINGDOM ADMIN CONTROL PORTAL JS ---

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

// --- AUTHENTICATION CHECK ---
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');

// Check active session
async function checkSession() {
  if (supabaseClient) {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (error) throw error;
      if (session) {
        showDashboard(session.user);
      } else {
        showLoginForm();
      }
    } catch (err) {
      console.error('Error getting session:', err);
      showLoginForm();
    }
  } else {
    showLoginForm();
    if (loginError) {
      loginError.textContent = 'Supabase SDK not initialized. Please verify configuration.';
      loginError.style.display = 'block';
    }
  }
}

// Listen for auth state changes
if (supabaseClient) {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
      showDashboard(session.user);
    } else {
      showLoginForm();
    }
  });
}

function showLoginForm() {
  if (loginContainer) loginContainer.style.display = 'flex';
  if (dashboardContainer) dashboardContainer.style.display = 'none';
}

function showDashboard(user) {
  if (loginContainer) loginContainer.style.display = 'none';
  if (dashboardContainer) dashboardContainer.style.display = 'flex';
  
  const authBadge = document.getElementById('auth-mode-badge');
  if (authBadge) {
    authBadge.textContent = 'SUPABASE AUTH';
    authBadge.style.background = 'rgba(39, 174, 96, 0.1)';
    authBadge.style.color = '#2ecc71';
    authBadge.style.display = 'inline-flex';
  }
  
  // Dynamically update admin user details using logged in user email
  const userNameEl = document.querySelector('.admin-user-info h4');
  const userRoleEl = document.querySelector('.admin-user-info p');
  const userAvatarEl = document.querySelector('.admin-avatar');
  if (user && user.email) {
    const emailPrefix = user.email.split('@')[0];
    if (userNameEl) userNameEl.textContent = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    if (userRoleEl) userRoleEl.textContent = 'System Administrator';
    if (userAvatarEl) userAvatarEl.textContent = emailPrefix.substring(0, 2).toUpperCase();
  }
  
  initDashboard();
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('email').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    if (loginError) loginError.style.display = 'none';

    if (!supabaseClient) {
      if (loginError) {
        loginError.textContent = 'Supabase SDK not initialized. Cannot authenticate.';
        loginError.style.display = 'block';
      }
      return;
    }

    try {
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';
      }

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput
      });
      
      if (error) throw error;
      
    } catch (authErr) {
      console.warn('Supabase authentication failed:', authErr.message);
      if (loginError) {
        loginError.textContent = `Login Error: ${authErr.message}`;
        loginError.style.display = 'block';
      }
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Access Dashboard';
      }
    }
  });
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    if (supabaseClient) {
      try {
        await supabaseClient.auth.signOut();
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    window.location.reload();
  });
}

// Initial session check
checkSession();

// --- TAB SWITCHER ---
window.switchTab = function(tabId) {
  const links = document.querySelectorAll('.sidebar-link');
  links.forEach(link => {
    if (link.getAttribute('href') === `#${tabId}`) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  const panels = document.querySelectorAll('.tab-panel');
  panels.forEach(panel => {
    if (panel.getAttribute('id') === `tab-${tabId}`) {
      panel.style.display = 'block';
    } else {
      panel.style.display = 'none';
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- DASHBOARD INITIALIZATION & DATA LOADING ---
const mockLeads = [];

function initDashboard() {
  loadLeads();
  loadSettingsState();
  loadRealVisitorCount();
  loadTeamMembersDropdown();
  renderAdminTeamMembers();
  renderAdminAssignedTasks();
  renderTeamAnalytics();
  renderAdminProjects();
  loadTeamDataFromSupabase();
}

// --- SUPABASE TEAM DATA LOAD & UPLOAD ENGINE ---
async function loadTeamDataFromSupabase() {
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
      loadTeamMembersDropdown();
      renderAdminTeamMembers();
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
      renderAdminAssignedTasks();
      renderTeamAnalytics();
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
      renderTeamAnalytics();
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
      renderAdminProjects();
    }
  } catch (err) {
    console.warn('Error loading team data from Supabase:', err);
  }
}

window.uploadAllTeamDataToSupabase = async function() {
  if (!supabaseClient) {
    alert('Supabase client SDK is not initialized. Please verify network connection.');
    return;
  }

  const syncBtns = document.querySelectorAll('#upload-team-data-btn');
  syncBtns.forEach(btn => {
    btn.disabled = true;
    btn.innerHTML = `⚡ Syncing to Supabase...`;
  });

  try {
    let syncedMembers = 0, syncedTasks = 0, syncedStandups = 0, syncedProjects = 0;

    // 1. Team Members
    const users = JSON.parse(localStorage.getItem('ewk_team_users') || '[]');
    if (users.length > 0) {
      const memberPayloads = users.map(u => ({
        id: u.id || ('mem-' + (u.teamId || u.email || Date.now()).replace(/[^a-zA-Z0-9-]/g, '')),
        team_id: u.teamId || u.email,
        name: u.name,
        role: u.role,
        phone: u.phone || null,
        email: u.email || null,
        password: u.password || 'team123456',
        avatar: u.avatar || u.name.substring(0, 2).toUpperCase(),
        status: u.status || 'Online'
      }));
      const { error: memErr } = await supabaseClient.from('team_members').upsert(memberPayloads, { onConflict: 'team_id' });
      if (memErr) console.warn('Supabase members upsert error:', memErr);
      else syncedMembers = memberPayloads.length;
    }

    // 2. Team Tasks
    const tasks = JSON.parse(localStorage.getItem('ewk_team_tasks') || '[]');
    if (tasks.length > 0) {
      const taskPayloads = tasks.map(t => ({
        id: t.id || ('task-' + Date.now()),
        title: t.title,
        description: t.description || '',
        category: t.category || 'General',
        priority: t.priority || 'Medium',
        assigned_to: t.assignedTo,
        assigned_by_name: t.assignedByName || 'Admin',
        status: t.status || 'Pending',
        due_date: t.dueDate || null
      }));
      const { error: taskErr } = await supabaseClient.from('team_tasks').upsert(taskPayloads, { onConflict: 'id' });
      if (taskErr) console.warn('Supabase tasks upsert error:', taskErr);
      else syncedTasks = taskPayloads.length;
    }

    // 3. Team Standups
    const standups = JSON.parse(localStorage.getItem('ewk_team_standups') || '[]');
    if (standups.length > 0) {
      const standupPayloads = standups.map(s => ({
        id: s.id || ('st-' + Date.now()),
        user_name: s.userName || 'Team Member',
        user_role: s.userRole || 'Specialist',
        user_avatar: s.userAvatar || 'TM',
        accomplished: s.accomplished,
        next: s.next,
        blockers: s.blockers || 'None'
      }));
      const { error: stErr } = await supabaseClient.from('team_standups').upsert(standupPayloads, { onConflict: 'id' });
      if (stErr) console.warn('Supabase standups upsert error:', stErr);
      else syncedStandups = standupPayloads.length;
    }

    // 4. Client Projects
    const projects = JSON.parse(localStorage.getItem('ewk_client_projects') || '[]');
    if (projects.length > 0) {
      const projPayloads = projects.map(p => ({
        id: p.id || ('proj-' + Date.now()),
        title: p.title,
        client: p.client,
        progress: parseInt(p.progress || 0),
        tech: Array.isArray(p.tech) ? p.tech.join(', ') : (p.tech || ''),
        deadline: p.deadline || 'Ongoing',
        status: p.status || 'Active'
      }));
      const { error: prjErr } = await supabaseClient.from('client_projects').upsert(projPayloads, { onConflict: 'id' });
      if (prjErr) console.warn('Supabase projects upsert error:', prjErr);
      else syncedProjects = projPayloads.length;
    }

    alert(`Successfully synced team data to Supabase Database!\n\n- ${syncedMembers} Team Members\n- ${syncedTasks} Tasks\n- ${syncedStandups} Daily Standups\n- ${syncedProjects} Client Builds`);

    await loadTeamDataFromSupabase();
  } catch (err) {
    console.error('Failed to upload team data to Supabase:', err);
    alert(`Supabase Sync Error: ${err.message || err}`);
  } finally {
    syncBtns.forEach(btn => {
      btn.disabled = false;
      btn.innerHTML = `⚡ Upload Team Data to Supabase`;
    });
  }
};

async function loadRealVisitorCount() {
  const totalVisitorsVal = document.getElementById('total-visitors-val');
  if (!totalVisitorsVal) return;

  let realCount = parseInt(localStorage.getItem('ewk_real_visitors') || '0');

  if (supabaseClient) {
    try {
      const { count, error } = await supabaseClient
        .from('pageviews')
        .select('*', { count: 'exact', head: true });

      if (!error && count !== null && count > 0) {
        realCount = count;
      }
    } catch (err) {
      console.warn('Pageviews fetch log:', err);
    }
  }

  totalVisitorsVal.textContent = realCount > 0 ? realCount.toLocaleString('en-IN') : '1';
}

async function loadLeads() {
  let leads = [];
  let loadedFromSupabase = false;

  // 1. Attempt to load from Supabase Database
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        leads = data.map(item => ({
          id: item.id,
          name: item.name,
          email: item.email,
          phone: item.phone || 'N/A',
          company: item.company || 'N/A',
          category: item.category,
          budget: item.budget || 'N/A',
          timeline: item.timeline || 'N/A',
          message: item.message,
          date: item.created_at ? new Date(item.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
          status: item.status || 'new'
        }));
        loadedFromSupabase = true;
      }
    } catch (dbErr) {
      console.warn('Failed to load from Supabase leads table, using local storage fallback:', dbErr);
    }
  }

  // 2. Fallback to LocalStorage
  if (!loadedFromSupabase) {
    leads = JSON.parse(localStorage.getItem('ewk_leads'));
    if (!leads || leads.length === 0) {
      leads = mockLeads;
      localStorage.setItem('ewk_leads', JSON.stringify(leads));
    }
  }

  // Cache current leads list globally for row index references
  window.currentLeadsList = leads;

  // Update counters (exclude denied projects)
  const proposalsCount = leads.filter(l => l.status === 'new' || l.status === 'under-review').length;
  const takenCount = leads.filter(l => l.status === 'accepted' || l.status === 'in-progress' || l.status === 'completed').length;
  
  const sidebarCount = document.getElementById('sidebar-leads-count');
  const sidebarTakenCount = document.getElementById('sidebar-taken-count');
  const cardCount = document.getElementById('leads-count-card');
  const trendCount = document.getElementById('leads-count-trend');
  
  if (sidebarCount) sidebarCount.textContent = proposalsCount;
  if (sidebarTakenCount) sidebarTakenCount.textContent = takenCount;
  if (cardCount) cardCount.textContent = proposalsCount;
  
  const countNew = leads.filter(l => l.status === 'new').length;
  if (trendCount) trendCount.textContent = `▲ ${countNew} New`;

  // Dynamically update active projects statistics
  const activeProjectsCount = leads.filter(l => l.status === 'accepted' || l.status === 'in-progress').length;
  const activeProjectsValEl = document.getElementById('active-projects-val');
  if (activeProjectsValEl) {
    activeProjectsValEl.textContent = activeProjectsCount;
  }
  
  // Calculate estimated pipeline valuation (Rupees) (exclude denied projects)
  let totalPipeline = 0;
  leads.forEach(l => {
    if (l.status === 'denied') return; // Skip denied projects
    
    if (l.budget.includes('2,50,000')) totalPipeline += 250000;
    else if (l.budget.includes('1,00,000')) totalPipeline += 150000;
    else if (l.budget.includes('50,000')) totalPipeline += 75000;
    else if (l.budget.includes('25,000')) totalPipeline += 37500;
    else if (l.budget.includes('10,000')) totalPipeline += 17500;
    else totalPipeline += 15000;
  });
  
  const pipelineValEl = document.getElementById('pipeline-value');
  if (pipelineValEl) {
    pipelineValEl.textContent = `₹${totalPipeline.toLocaleString('en-IN')}`;
  }

  // Populate Overview Table
  const overviewTbody = document.getElementById('overview-leads-tbody');
  if (overviewTbody) {
    overviewTbody.innerHTML = '';
    leads.slice(0, 3).forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${l.name}</strong><br><span style="font-size: 0.75rem; color: var(--text-muted);">${l.email}</span></td>
        <td>${l.category}</td>
        <td><span class="badge" style="background: rgba(255,255,255,0.03); color: #fff;">${l.budget.split(' ')[0]}</span></td>
        <td><span class="status-badge ${l.status}">${l.status.toUpperCase()}</span></td>
      `;
      overviewTbody.appendChild(tr);
    });
  }

  // Populate Proposals Table (new, under-review, archived, denied)
  const leadsTbody = document.getElementById('leads-tbody');
  if (leadsTbody) {
    leadsTbody.innerHTML = '';
    const proposals = leads.filter(l => l.status === 'new' || l.status === 'under-review' || l.status === 'archived' || l.status === 'denied');
    proposals.forEach((l) => {
      const tr = document.createElement('tr');
      const companyLabel = l.company && l.company !== 'N/A' ? `<span style="font-size:0.75rem; color: var(--accent-cyan); display:block;">${l.company}</span>` : '';
      const origIndex = leads.findIndex(item => item.id === l.id);
      const idArg = l.id ? `'${l.id}'` : 'null';
      const phoneVal = l.phone || 'N/A';
      
      tr.innerHTML = `
        <td>
          <strong>${l.date}</strong>
          <span style="font-size: 0.75rem; color: var(--accent-cyan); display:block;">ID: ${l.id}</span>
        </td>
        <td>
          <strong>${l.name}</strong>
          ${companyLabel}
          <span style="font-size: 0.75rem; color: var(--text-muted); display:block;">Email: ${l.email}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted); display:block;">Phone: ${phoneVal}</span>
        </td>
        <td><span class="badge">${l.category}</span></td>
        <td>
          <strong>${l.budget}</strong>
          <span style="font-size: 0.75rem; color: var(--text-secondary); display:block;">Timeline: ${l.timeline}</span>
        </td>
        <td>
          <select class="form-control status-select" style="background: #08091a; padding: 4px 8px; font-size: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--glass-border); color: #fff; cursor: pointer;" onchange="changeLeadStatus(${origIndex}, ${idArg}, this.value)">
            <option value="new" ${l.status === 'new' ? 'selected' : ''}>Proposal Received</option>
            <option value="under-review" ${l.status === 'under-review' ? 'selected' : ''}>Under Review</option>
            <option value="accepted" ${l.status === 'accepted' ? 'selected' : ''}>Accepted</option>
            <option value="in-progress" ${l.status === 'in-progress' ? 'selected' : ''}>Development</option>
            <option value="completed" ${l.status === 'completed' ? 'selected' : ''}>Completed & Live</option>
            <option value="archived" ${l.status === 'archived' ? 'selected' : ''}>Archived / Closed</option>
            <option value="denied" ${l.status === 'denied' ? 'selected' : ''}>Denied / Rejected</option>
          </select>
        </td>
        <td>
          <div class="table-actions">
            <button class="action-icon-btn" title="Contact & Send Tracker Link" onclick="contactLeadViaWhatsApp('${l.name}', '${phoneVal}', '${l.id}')">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 2.01 14.069.99 11.519.99c-5.44 0-9.866 4.372-9.87 9.802 0 1.698.459 3.356 1.321 4.8l-.299.988-.888 3.243 3.33-.874.944-.287zm12.56-8.528c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.568-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/></svg>
            </button>
            <button class="action-icon-btn" title="Delete Lead" onclick="deleteLead(${origIndex}, ${idArg})">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        </td>
      `;
      leadsTbody.appendChild(tr);
    });
  }

  // Populate Taken Projects Table (accepted, in-progress, completed)
  const takenProjects = leads.filter(l => l.status === 'accepted' || l.status === 'in-progress' || l.status === 'completed');
  window.allTakenProjects = takenProjects;
  renderTakenRows(takenProjects);
}

// Separate function to render taken projects rows (called initially and during search filter)
function renderTakenRows(projectsList) {
  const takenTbody = document.getElementById('taken-tbody');
  if (!takenTbody) return;
  takenTbody.innerHTML = '';
  
  projectsList.forEach((l) => {
    const tr = document.createElement('tr');
    const companyLabel = l.company && l.company !== 'N/A' ? `<span style="font-size:0.75rem; color: var(--accent-cyan); display:block;">${l.company}</span>` : '';
    const origIndex = window.currentLeadsList ? window.currentLeadsList.findIndex(item => item.id === l.id) : 0;
    const idArg = l.id ? `'${l.id}'` : 'null';
    const phoneVal = l.phone || 'N/A';
    
    tr.innerHTML = `
      <td>
        <strong>${l.date}</strong>
        <span style="font-size: 0.75rem; color: var(--accent-cyan); display:block;">ID: ${l.id}</span>
      </td>
      <td>
        <strong>${l.name}</strong>
        ${companyLabel}
        <span style="font-size: 0.75rem; color: var(--text-muted); display:block;">Email: ${l.email}</span>
        <span style="font-size: 0.75rem; color: var(--text-muted); display:block;">Phone: ${phoneVal}</span>
      </td>
      <td><span class="badge">${l.category}</span></td>
      <td>
        <strong>${l.budget}</strong>
        <span style="font-size: 0.75rem; color: var(--text-secondary); display:block;">Timeline: ${l.timeline}</span>
      </td>
      <td>
        <select class="form-control status-select" style="background: #08091a; padding: 4px 8px; font-size: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--glass-border); color: #fff; cursor: pointer;" onchange="changeLeadStatus(${origIndex}, ${idArg}, this.value)">
          <option value="new" ${l.status === 'new' ? 'selected' : ''}>Proposal Received</option>
          <option value="under-review" ${l.status === 'under-review' ? 'selected' : ''}>Under Review</option>
          <option value="accepted" ${l.status === 'accepted' ? 'selected' : ''}>Accepted</option>
          <option value="in-progress" ${l.status === 'in-progress' ? 'selected' : ''}>Development</option>
          <option value="completed" ${l.status === 'completed' ? 'selected' : ''}>Completed & Live</option>
          <option value="archived" ${l.status === 'archived' ? 'selected' : ''}>Archived / Closed</option>
          <option value="denied" ${l.status === 'denied' ? 'selected' : ''}>Denied / Rejected</option>
        </select>
      </td>
      <td>
        <div class="table-actions">
          <button class="action-icon-btn" title="Contact & Send Tracker Link" onclick="contactLeadViaWhatsApp('${l.name}', '${phoneVal}', '${l.id}')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 2.01 14.069.99 11.519.99c-5.44 0-9.866 4.372-9.87 9.802 0 1.698.459 3.356 1.321 4.8l-.299.988-.888 3.243 3.33-.874.944-.287zm12.56-8.528c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.568-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/></svg>
          </button>
          <button class="action-icon-btn" title="Delete Lead" onclick="deleteLead(${origIndex}, ${idArg})">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      </td>
    `;
    takenTbody.appendChild(tr);
  });
}

// Search filter for Taken Projects
window.filterTakenProjects = function() {
  const query = document.getElementById('taken-search-input').value.toLowerCase().trim();
  
  if (!query) {
    renderTakenRows(window.allTakenProjects || []);
    return;
  }
  
  const filtered = (window.allTakenProjects || []).filter(l => 
    String(l.id).toLowerCase().includes(query) ||
    l.name.toLowerCase().includes(query) ||
    l.email.toLowerCase().includes(query) ||
    l.category.toLowerCase().includes(query) ||
    (l.company && l.company.toLowerCase().includes(query))
  );
  
  renderTakenRows(filtered);
};

window.contactLeadViaWhatsApp = function(name, phone, projectId) {
  if (!phone || phone === 'N/A') {
    alert('No phone number available for this lead.');
    return;
  }
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const origin = window.location.origin.replace('/admin', ''); 
  
  const message = `Hello ${name}! 👋\n\n` +
                  `This is Gowri from Elite Web Kingdom regarding your project proposal.\n\n` +
                  `Your project is active in our system! You can track its live milestones and progress here:\n` +
                  `${origin}/#track\n\n` +
                  `Your Unique Project ID is: *${projectId}*\n\n` +
                  `Let's connect here to align further.`;
                  
  const whatsappURL = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(whatsappURL, '_blank');
};

// Change Lead Status (Database & Local Backup)
window.changeLeadStatus = async function(index, dbId, newStatus) {
  let loadedFromSupabase = false;

  if (supabaseClient && dbId) {
    try {
      const { error } = await supabaseClient
        .from('leads')
        .update({ status: newStatus })
        .eq('id', dbId);
      if (error) throw error;
      
      console.log(`Updated status to ${newStatus} in Supabase`);
      loadedFromSupabase = true;
    } catch (dbErr) {
      console.error('Supabase status update failed, shifting to local fallback:', dbErr);
    }
  }

  if (!loadedFromSupabase) {
    let leads = JSON.parse(localStorage.getItem('ewk_leads')) || [];
    if (leads[index]) {
      leads[index].status = newStatus;
      localStorage.setItem('ewk_leads', JSON.stringify(leads));
    }
  }
  
  loadLeads();
};

// Delete Lead (Database & Local Backup) -> Now updates status to 'denied'
window.deleteLead = async function(index, dbId) {
  if (confirm('Are you sure you want to mark this proposal lead as Denied?')) {
    let updatedInSupabase = false;
    
    if (supabaseClient && dbId) {
      try {
        const { error } = await supabaseClient
          .from('leads')
          .update({ status: 'denied' })
          .eq('id', dbId);
        if (error) throw error;
        console.log('Marked lead as Denied in Supabase');
        updatedInSupabase = true;
      } catch (dbErr) {
        console.error('Failed to update status in Supabase:', dbErr);
      }
    }
    
    if (!updatedInSupabase) {
      let leads = JSON.parse(localStorage.getItem('ewk_leads')) || [];
      if (leads[index]) {
        leads[index].status = 'denied';
        localStorage.setItem('ewk_leads', JSON.stringify(leads));
      }
    }
    
    loadLeads();
  }
};

// Reset leads with security PIN check
window.clearAllLeads = async function() {
  const pin = prompt("Enter Security PIN to reset leads (Hint: DOB):");
  if (pin === null) return; // Cancelled
  
  if (pin.trim() !== "3101") {
    alert("Incorrect PIN! Reset aborted.");
    return;
  }

  if (confirm('This will delete custom leads and restore the default list of mock proposals. Continue?')) {
    if (supabaseClient) {
      try {
        const { data } = await supabaseClient.from('leads').select('id');
        if (data && data.length > 0) {
          const ids = data.map(item => item.id);
          await supabaseClient.from('leads').delete().in('id', ids);
        }
      } catch (err) {
        console.error('Failed to clear Supabase leads:', err);
      }
    }
    localStorage.removeItem('ewk_leads');
    loadLeads();
  }
};

// --- SETTINGS STATE CONTROLLERS ---
window.saveSettings = function() {
  const maintMode = document.getElementById('maint-mode-switch').checked;
  const emailNotify = document.getElementById('email-notify-switch').checked;
  const dbBackup = document.getElementById('backup-switch').checked;

  const settings = {
    maintMode,
    emailNotify,
    dbBackup
  };
  
  localStorage.setItem('ewk_admin_settings', JSON.stringify(settings));
  alert('Settings saved successfully!');
};

function loadSettingsState() {
  const settings = JSON.parse(localStorage.getItem('ewk_admin_settings'));
  if (settings) {
    document.getElementById('maint-mode-switch').checked = settings.maintMode;
    document.getElementById('email-notify-switch').checked = settings.emailNotify;
    document.getElementById('backup-switch').checked = settings.dbBackup;
  }
}

function loadTeamMembersDropdown() {
  const select = document.getElementById('assignee-select');
  if (!select) return;

  const users = JSON.parse(localStorage.getItem('ewk_team_users') || '[]');
  let html = `<option value="">-- Choose Team Member --</option>`;
  users.forEach(u => {
    const idVal = u.teamId || u.email;
    html += `<option value="${idVal}">${idVal} - ${u.name} (${u.role})</option>`;
  });
  select.innerHTML = html;
}

function renderAdminTeamMembers() {
  const container = document.getElementById('admin-members-list');
  const users = JSON.parse(localStorage.getItem('ewk_team_users') || '[]');

  const sidebarCount = document.getElementById('sidebar-members-count');
  if (sidebarCount) sidebarCount.textContent = users.length;

  if (!container) return;

  if (users.length === 0) {
    container.innerHTML = `<div style="grid-column: 1 / -1; font-size: 0.88rem; color: var(--text-muted); padding: 16px; text-align: center;">No team member accounts registered yet. Click "+ Add New Team Member" above to create one.</div>`;
    return;
  }

  container.innerHTML = users.map(u => {
    const idVal = u.teamId || u.email;
    return `
      <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-sm); padding: 14px; display: flex; flex-direction: column; gap: 10px; font-size: 0.85rem;">
        <!-- Header & Action Row -->
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--grad-primary); color: #020617; font-weight: 800; font-size: 0.8rem; display: flex; align-items: center; justify-content: center;">${u.avatar || u.name.substring(0,2).toUpperCase()}</div>
            <div>
              <div style="font-weight: 700; color: #fff; font-size: 0.92rem;">${u.name}</div>
              <div style="font-size: 0.76rem; color: var(--cyan-primary); font-weight: 600;">${u.role}</div>
            </div>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary" style="padding: 3px 10px; font-size: 0.74rem; color: var(--cyan-primary); border-color: rgba(0,242,254,0.3);" onclick="openEditMemberModal('${idVal}')">
              Edit
            </button>
            <button class="btn btn-secondary" style="padding: 3px 10px; font-size: 0.74rem; color: #f43f5e; border-color: rgba(244,63,94,0.3);" onclick="deleteTeamMember('${idVal}')">
              Delete
            </button>
          </div>
        </div>

        <!-- Info Details Block -->
        <div style="color: var(--text-muted); font-size: 0.8rem; display: flex; flex-wrap: wrap; gap: 12px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.04);">
          <span>🪪 ID Card No: <strong style="color: var(--cyan-primary);">${idVal}</strong></span>
          <span>📞 Phone: <strong style="color: #fff;">${u.phone || 'N/A'}</strong></span>
          <span>✉️ Email: <strong style="color: #fff;">${u.email || 'N/A'}</strong></span>
        </div>

        <!-- SEPARATE HIGHLIGHTED PASSWORD BLOCK -->
        <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 6px; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem; color: #f59e0b;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span>Assigned Password:</span>
            <strong style="color: #fff; font-family: var(--font-mono); letter-spacing: 0.05em; font-size: 0.9rem;">${u.password || '••••••••'}</strong>
          </div>
          <span style="font-size: 0.7rem; color: var(--text-subtle); text-transform: uppercase;">LOGIN KEY</span>
        </div>
      </div>
    `;
  }).join('');
}

window.deleteTeamMember = async function(memberId) {
  if (confirm(`Delete team account for ID ${memberId}?`)) {
    let users = JSON.parse(localStorage.getItem('ewk_team_users') || '[]');
    users = users.filter(u => (u.teamId ? u.teamId.toLowerCase() : u.email.toLowerCase()) !== memberId.toLowerCase());
    localStorage.setItem('ewk_team_users', JSON.stringify(users));

    if (supabaseClient) {
      try {
        await supabaseClient.from('team_members').delete().eq('team_id', memberId);
      } catch (err) {
        console.warn('Supabase member delete error:', err);
      }
    }

    renderAdminTeamMembers();
    loadTeamMembersDropdown();
    renderTeamAnalytics();
  }
};

function renderAdminAssignedTasks() {
  const tasks = JSON.parse(localStorage.getItem('ewk_team_tasks') || '[]');
  
  const sidebarCount = document.getElementById('sidebar-tasks-count');
  const badgeCount = document.getElementById('total-assigned-badge');
  if (sidebarCount) sidebarCount.textContent = tasks.length;
  if (badgeCount) badgeCount.textContent = `${tasks.length} TASKS`;

  const tbody = document.getElementById('admin-tasks-tbody');
  if (!tbody) return;

  if (tasks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: var(--text-muted);">No assigned works found. Use the form above to assign work to a team member.</td></tr>`;
    return;
  }

  tbody.innerHTML = tasks.map(t => `
    <tr>
      <td style="font-weight: 600; color: #fff;">${t.title}</td>
      <td><span style="color: var(--cyan-primary); font-weight: 600;">${t.assignedTo}</span></td>
      <td><span style="background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 4px; font-size: 0.78rem;">${t.category}</span></td>
      <td><span style="padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; background: ${getPriorityColorBg(t.priority)}; color: ${getPriorityColorText(t.priority)};">${t.priority}</span></td>
      <td><span style="font-weight: 600; color: ${getAdminStatusColor(t.status)};">${t.status}</span></td>
      <td style="font-size: 0.82rem; color: var(--text-muted);">${t.dueDate || 'No Due Date'}</td>
      <td>
        <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.78rem; color: #f43f5e; border-color: rgba(244,63,94,0.3);" onclick="deleteAdminTask('${t.id}')">
          Remove
        </button>
      </td>
    </tr>
  `).join('');
}

function getPriorityColorBg(p) {
  switch(p) {
    case 'Critical': return 'rgba(244,63,94,0.15)';
    case 'High': return 'rgba(245,158,11,0.15)';
    case 'Medium': return 'rgba(59,130,246,0.15)';
    default: return 'rgba(16,185,129,0.15)';
  }
}

function getPriorityColorText(p) {
  switch(p) {
    case 'Critical': return '#f43f5e';
    case 'High': return '#f59e0b';
    case 'Medium': return '#3b82f6';
    default: return '#10b981';
  }
}

function getAdminStatusColor(s) {
  switch(s) {
    case 'In Progress': return '#f59e0b';
    case 'Code Review': return '#8b5cf6';
    case 'Completed': return '#10b981';
    default: return '#94a3b8';
  }
}

// Handle Form Submissions
document.addEventListener('DOMContentLoaded', () => {
  const assignForm = document.getElementById('assign-work-form');
  if (assignForm) {
    assignForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const assignedTo = document.getElementById('assignee-select').value;
      const title = document.getElementById('task-title-input').value.trim();
      const category = document.getElementById('task-category-select').value;
      const priority = document.getElementById('task-priority-select').value;
      const dueDate = document.getElementById('task-duedate-input').value;
      const description = document.getElementById('task-desc-input').value.trim();

      const newTask = {
        id: 'task-' + Date.now(),
        title,
        description,
        category,
        priority,
        assignedTo,
        assignedByName: 'Admin',
        status: 'Pending',
        dueDate,
        createdAt: new Date().toISOString()
      };

      const tasks = JSON.parse(localStorage.getItem('ewk_team_tasks') || '[]');
      tasks.unshift(newTask);
      localStorage.setItem('ewk_team_tasks', JSON.stringify(tasks));

      if (supabaseClient) {
        try {
          await supabaseClient.from('team_tasks').insert([{
            title, description, category, priority, assigned_to: assignedTo, status: 'Pending', due_date: dueDate
          }]);
        } catch (err) {
          console.warn('Supabase task insert:', err);
        }
      }

      assignForm.reset();
      alert(`Work successfully assigned to ${assignedTo}!`);
      renderAdminAssignedTasks();
    });
  }

  const registerForm = document.getElementById('register-team-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('new-member-name').value.trim();
      const memberIdEl = document.getElementById('new-member-id') || document.getElementById('new-member-email');
      const teamId = memberIdEl ? memberIdEl.value.trim() : '';
      const phone = (document.getElementById('new-member-phone')?.value || '').trim();
      const email = (document.getElementById('new-member-email')?.value || '').trim();
      const role = document.getElementById('new-member-role').value.trim();
      const password = document.getElementById('new-member-password').value.trim();

      const newUser = {
        teamId: teamId,
        email: email || `${teamId.toLowerCase()}@elitewebkingdom.com`,
        phone: phone || '+91 9985369590',
        password,
        name,
        role,
        avatar: name.substring(0, 2).toUpperCase(),
        status: 'Online'
      };

      const users = JSON.parse(localStorage.getItem('ewk_team_users') || '[]');
      if (users.some(u => (u.teamId && u.teamId.toLowerCase() === teamId.toLowerCase()) || (u.email && u.email.toLowerCase() === teamId.toLowerCase()))) {
        alert('A team member with this ID Card Number already exists!');
        return;
      }
      users.push(newUser);
      localStorage.setItem('ewk_team_users', JSON.stringify(users));

      if (supabaseClient) {
        try {
          await supabaseClient.from('team_members').insert([{
            id: 'mem-' + (teamId || email).replace(/[^a-zA-Z0-9-]/g, ''),
            team_id: teamId,
            name,
            role,
            phone,
            email,
            password,
            avatar: name.substring(0, 2).toUpperCase(),
            status: 'Online'
          }]);
        } catch (err) {
          console.warn('Supabase member insert error:', err);
        }
      }

      registerForm.reset();
      alert(`Team member account for ${name} (ID: ${teamId}) created successfully!`);
      loadTeamMembersDropdown();
      renderAdminTeamMembers();
      renderTeamAnalytics();
    });
  }

  // Handle Edit Member Form
  const editForm = document.getElementById('edit-member-form');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const origId = document.getElementById('edit-original-id').value;
      const name = document.getElementById('edit-member-name').value.trim();
      const newId = document.getElementById('edit-member-id').value.trim();
      const phone = document.getElementById('edit-member-phone').value.trim();
      const email = document.getElementById('edit-member-email').value.trim();
      const role = document.getElementById('edit-member-role').value.trim();
      const password = document.getElementById('edit-member-password').value.trim();

      let users = JSON.parse(localStorage.getItem('ewk_team_users') || '[]');
      const userIndex = users.findIndex(u => (u.teamId || u.email).toLowerCase() === origId.toLowerCase());

      if (userIndex !== -1) {
        const updatedUser = {
          ...users[userIndex],
          name,
          teamId: newId,
          phone,
          email,
          role,
          password,
          avatar: name.substring(0, 2).toUpperCase()
        };
        users[userIndex] = updatedUser;
        localStorage.setItem('ewk_team_users', JSON.stringify(users));

        if (supabaseClient) {
          try {
            await supabaseClient.from('team_members').upsert([{
              id: updatedUser.id || ('mem-' + newId.replace(/[^a-zA-Z0-9-]/g, '')),
              team_id: newId,
              name,
              role,
              phone,
              email,
              password,
              avatar: name.substring(0, 2).toUpperCase(),
              status: 'Online'
            }], { onConflict: 'team_id' });
          } catch (err) {
            console.warn('Supabase member update error:', err);
          }
        }

        // Update assigned tasks if ID changed
        if (origId !== newId) {
          let tasks = JSON.parse(localStorage.getItem('ewk_team_tasks') || '[]');
          tasks.forEach(t => {
            if (t.assignedTo && t.assignedTo.toLowerCase() === origId.toLowerCase()) {
              t.assignedTo = newId;
            }
          });
          localStorage.setItem('ewk_team_tasks', JSON.stringify(tasks));
        }

        closeEditModal();
        alert('Team member details updated successfully!');
        renderAdminTeamMembers();
        loadTeamMembersDropdown();
        renderTeamAnalytics();
        renderAdminAssignedTasks();
      }
    });
  }
});

// Edit Member Modal Handlers
window.openEditMemberModal = function(memberId) {
  const users = JSON.parse(localStorage.getItem('ewk_team_users') || '[]');
  const user = users.find(u => (u.teamId || u.email).toLowerCase() === memberId.toLowerCase());
  if (!user) return;

  document.getElementById('edit-original-id').value = user.teamId || user.email;
  document.getElementById('edit-member-name').value = user.name || '';
  document.getElementById('edit-member-id').value = user.teamId || user.email;
  document.getElementById('edit-member-phone').value = user.phone || '';
  document.getElementById('edit-member-email').value = user.email || '';
  document.getElementById('edit-member-role').value = user.role || '';
  document.getElementById('edit-member-password').value = user.password || '';

  const modal = document.getElementById('edit-member-modal');
  if (modal) modal.style.display = 'flex';
};

window.closeEditModal = function() {
  const modal = document.getElementById('edit-member-modal');
  if (modal) modal.style.display = 'none';
};

window.deleteAdminTask = async function(taskId) {
  if (confirm('Are you sure you want to remove this assigned task?')) {
    let tasks = JSON.parse(localStorage.getItem('ewk_team_tasks') || '[]');
    tasks = tasks.filter(t => t.id !== taskId);
    localStorage.setItem('ewk_team_tasks', JSON.stringify(tasks));

    if (supabaseClient) {
      try {
        await supabaseClient.from('team_tasks').delete().eq('id', taskId);
      } catch (err) {
        console.warn('Supabase task delete error:', err);
      }
    }

    renderAdminAssignedTasks();
    renderTeamAnalytics();
  }
};

// --- REAL-TIME TEAM ANALYTICS & MONITORING MODULE ---
function renderTeamAnalytics() {
  const users = JSON.parse(localStorage.getItem('ewk_team_users') || '[]');
  const tasks = JSON.parse(localStorage.getItem('ewk_team_tasks') || '[]');
  const standups = JSON.parse(localStorage.getItem('ewk_team_standups') || '[]');

  // 1. KPI Cards
  const totalMembersEl = document.getElementById('analytics-total-members');
  const assignedWorksEl = document.getElementById('analytics-assigned-works');
  const completionRateEl = document.getElementById('analytics-completion-rate');
  const standupsCountEl = document.getElementById('analytics-standups-count');

  const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;
  const ratePct = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  if (totalMembersEl) totalMembersEl.textContent = users.length;
  if (assignedWorksEl) assignedWorksEl.textContent = tasks.length;
  if (completionRateEl) completionRateEl.textContent = `${ratePct}%`;
  if (standupsCountEl) standupsCountEl.textContent = standups.length;

  // 2. Individual Member Workload Breakdown Cards
  const gridContainer = document.getElementById('team-analytics-grid');
  if (gridContainer) {
    if (users.length === 0) {
      gridContainer.innerHTML = `<div style="font-size: 0.88rem; color: var(--text-muted); padding: 12px;">No registered team members to analyze yet. Add members in the Assign Work & Team tab!</div>`;
    } else {
      gridContainer.innerHTML = users.map(u => {
        const uEmail = u.email.toLowerCase();
        const memberTasks = tasks.filter(t => t.assignedTo && t.assignedTo.toLowerCase() === uEmail);
        const doneCount = memberTasks.filter(t => t.status === 'Completed').length;
        const inProgressCount = memberTasks.filter(t => t.status === 'In Progress').length;
        const reviewCount = memberTasks.filter(t => t.status === 'Code Review').length;
        const memberRate = memberTasks.length > 0 ? Math.round((doneCount / memberTasks.length) * 100) : 0;

        let badgeLabel = '⚡ On Track';
        let badgeColor = '#3b82f6';
        if (memberRate >= 75 && memberTasks.length > 0) { badgeLabel = '🔥 High Performer'; badgeColor = '#10b981'; }
        else if (memberTasks.length === 0) { badgeLabel = '⏳ Ready for Assignment'; badgeColor = '#94a3b8'; }

        return `
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <h4 style="font-size: 1.05rem; font-weight: 700; color: #fff;">${u.name}</h4>
                <div style="font-size: 0.8rem; color: var(--cyan-primary); font-weight: 600;">${u.role}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">${u.email}</div>
              </div>
              <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full); background: rgba(255,255,255,0.05); color: ${badgeColor}; border: 1px solid ${badgeColor}40;">
                ${badgeLabel}
              </span>
            </div>

            <!-- Progress Meter -->
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 6px;">
                <span style="color: var(--text-muted);">Work Completion:</span>
                <strong style="color: #fff;">${memberRate}% (${doneCount}/${memberTasks.length})</strong>
              </div>
              <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden;">
                <div style="width: ${memberRate}%; height: 100%; background: linear-gradient(90deg, #00f2fe, #10b981);"></div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.04); color: var(--text-muted);">
              <span>In Progress: <strong style="color: #f59e0b;">${inProgressCount}</strong></span>
              <span>Review: <strong style="color: #8b5cf6;">${reviewCount}</strong></span>
              <span>Completed: <strong style="color: #10b981;">${doneCount}</strong></span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 3. Live Daily Standup Feed
  const standupsFeed = document.getElementById('admin-standups-feed');
  if (standupsFeed) {
    if (standups.length === 0) {
      standupsFeed.innerHTML = `<div style="font-size: 0.88rem; color: var(--text-muted); padding: 12px; text-align: center;">No daily standup reports submitted by team members yet today.</div>`;
    } else {
      standupsFeed.innerHTML = standups.map(s => `
        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: var(--radius-sm); padding: 14px 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.82rem;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 700; color: #fff;">${s.userName}</span>
              <span style="color: var(--cyan-primary); font-size: 0.78rem;">(${s.userRole})</span>
            </div>
            <span style="color: var(--text-muted); font-size: 0.78rem;">${s.createdAt}</span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 4px;">
            <strong style="color: #10b981;">Accomplished:</strong> ${s.accomplished}
          </div>
          <div style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 4px;">
            <strong style="color: #00f2fe;">Next Steps:</strong> ${s.next}
          </div>
          ${s.blockers && s.blockers !== 'None' ? `
            <div style="font-size: 0.85rem; color: #f43f5e;">
              <strong>Blockers:</strong> ${s.blockers}
            </div>
          ` : ''}
        </div>
      `).join('');
    }
  }
}

// --- PRODUCTION CLIENT BUILDS MANAGEMENT ---
function renderAdminProjects() {
  const projects = JSON.parse(localStorage.getItem('ewk_client_projects') || '[]');

  const badge = document.getElementById('admin-projects-badge');
  const sidebarTakenCount = document.getElementById('sidebar-taken-count');
  if (badge) badge.textContent = `${projects.length} BUILDS`;
  if (sidebarTakenCount) sidebarTakenCount.textContent = projects.length;

  const tbody = document.getElementById('admin-projects-tbody');
  if (!tbody) return;

  if (projects.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--text-muted);">No client production builds created yet. Use the form above to add a project.</td></tr>`;
    return;
  }

  tbody.innerHTML = projects.map(p => `
    <tr>
      <td style="font-weight: 700; color: #fff;">${p.title}</td>
      <td><span style="color: var(--cyan-primary); font-weight: 600;">${p.client}</span></td>
      <td><span style="font-size: 0.78rem; color: var(--text-muted);">${Array.isArray(p.tech) ? p.tech.join(', ') : p.tech}</span></td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="number" min="0" max="100" value="${p.progress || 0}" style="width: 60px; padding: 2px 6px; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;" onchange="updateProjectProgress('${p.id}', this.value)">
          <span style="font-size: 0.8rem; font-weight: 600; color: #10b981;">%</span>
        </div>
      </td>
      <td style="font-size: 0.82rem; color: var(--text-muted);">${p.deadline}</td>
      <td>
        <button class="btn btn-secondary" style="padding: 2px 8px; font-size: 0.72rem; color: #f43f5e; border-color: rgba(244,63,94,0.3);" onclick="deleteAdminProject('${p.id}')">
          Remove
        </button>
      </td>
    </tr>
  `).join('');
}

window.updateProjectProgress = async function(projectId, newProgress) {
  let projects = JSON.parse(localStorage.getItem('ewk_client_projects') || '[]');
  const project = projects.find(p => p.id === projectId);
  if (project) {
    project.progress = parseInt(newProgress) || 0;
    localStorage.setItem('ewk_client_projects', JSON.stringify(projects));

    if (supabaseClient) {
      try {
        await supabaseClient.from('client_projects').update({ progress: project.progress }).eq('id', projectId);
      } catch (err) {
        console.warn('Supabase project progress update error:', err);
      }
    }

    renderAdminProjects();
  }
};

window.deleteAdminProject = async function(projectId) {
  if (confirm('Are you sure you want to remove this client production build?')) {
    let projects = JSON.parse(localStorage.getItem('ewk_client_projects') || '[]');
    projects = projects.filter(p => p.id !== projectId);
    localStorage.setItem('ewk_client_projects', JSON.stringify(projects));

    if (supabaseClient) {
      try {
        await supabaseClient.from('client_projects').delete().eq('id', projectId);
      } catch (err) {
        console.warn('Supabase project delete error:', err);
      }
    }

    renderAdminProjects();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const projectForm = document.getElementById('create-project-form');
  if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('proj-title-input').value.trim();
      const client = document.getElementById('proj-client-input').value.trim();
      const techStr = document.getElementById('proj-tech-input').value.trim();
      const deadline = document.getElementById('proj-deadline-input').value.trim();
      const progress = parseInt(document.getElementById('proj-progress-input').value) || 0;

      const newProject = {
        id: 'proj-' + Date.now(),
        title,
        client,
        tech: techStr.split(',').map(s => s.trim()),
        deadline,
        progress,
        createdAt: new Date().toISOString()
      };

      const projects = JSON.parse(localStorage.getItem('ewk_client_projects') || '[]');
      projects.unshift(newProject);
      localStorage.setItem('ewk_client_projects', JSON.stringify(projects));

      if (supabaseClient) {
        try {
          await supabaseClient.from('client_projects').insert([{
            id: newProject.id,
            title,
            client,
            progress,
            tech: techStr,
            deadline,
            status: 'Active'
          }]);
        } catch (err) {
          console.warn('Supabase project insert error:', err);
        }
      }

      projectForm.reset();
      alert(`Production Client Build "${title}" created successfully!`);
      renderAdminProjects();
    });
  }
});

// --- INTERACTIVE KPI STAT BUTTONS HANDLER ---
window.onKpiClick = function(type) {
  if (type === 'members') {
    switchTab('assign-work');
    setTimeout(() => {
      const el = document.getElementById('admin-members-list');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  } else if (type === 'tasks') {
    switchTab('assign-work');
    setTimeout(() => {
      const el = document.getElementById('admin-tasks-tbody');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  } else if (type === 'completion') {
    switchTab('team-analytics');
    setTimeout(() => {
      const el = document.getElementById('team-analytics-grid');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  } else if (type === 'standups') {
    switchTab('team-analytics');
    setTimeout(() => {
      const el = document.getElementById('admin-standups-feed');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  }
};

