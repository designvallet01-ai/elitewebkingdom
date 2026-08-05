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
};

// --- DASHBOARD INITIALIZATION & DATA LOADING ---
const mockLeads = [];

function initDashboard() {
  loadLeads();
  loadSettingsState();
  loadRealVisitorCount();
}

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
