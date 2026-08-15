// --- ELITE WEB KINGDOM WORK SHOWCASE & FREE DOWNLOADS PORTAL JS (PURE SUPABASE) ---

// --- SUPABASE CLIENT INITIALIZATION ---
const SUPABASE_URL = "https://jgvgqgbhzadxvcolgvly.supabase.co";
const SUPABASE_KEY = "sb_publishable_5ToLoZzsP_B3FQoYBzTnEA_re1QwPPv";
let supabaseClient = null;

try {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch (err) {
  console.error('Failed to initialize Supabase in Showcase portal:', err);
}

let cachedPortalStoreItems = [];

async function loadPortalStoreItems() {
  let items = [];

  // Fetch strictly from Supabase published_store_items
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('published_store_items')
        .select('*')
        .eq('status', 'Published')
        .order('created_at', { ascending: false });

      if (!error && data) {
        items = data.map(s => ({
          id: s.id,
          title: s.title,
          category: s.category,
          price: s.price || 'FREE DOWNLOAD',
          previewUrl: s.preview_url || '',
          downloadUrl: s.download_url || '',
          description: s.description || '',
          techStack: s.tech_stack || '',
          imageUrl: s.image_url || '/1.jpeg',
          badge: s.badge || 'FREE / OPEN SOURCE',
          status: s.status || 'Published',
          createdAt: s.created_at
        }));
      }
    } catch (err) {
      console.warn('Error querying Supabase published_store_items:', err);
    }
  }

  // Fallback to local storage if offline
  if (items.length === 0) {
    const local = localStorage.getItem('ewk_published_store_items');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          items = parsed.filter(i => i.status === 'Published');
        }
      } catch (e) {
        console.warn('Error parsing local store items:', e);
      }
    }
  }

  cachedPortalStoreItems = items;
  renderPortalStoreGrid();
}

function renderPortalStoreGrid(filterCategory = 'all', searchQuery = '') {
  const grid = document.getElementById('portal-store-grid');
  if (!grid) return;

  const filtered = cachedPortalStoreItems.filter(item => {
    const matchesCat = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.techStack || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: rgba(255,255,255,0.02); border-radius: var(--radius-lg); border: 1px dashed rgba(255,255,255,0.1);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-muted); margin-bottom: 14px;"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line></svg>
        <h3 style="color: var(--text-bright); font-size: 1.2rem;">No showcase products published in Supabase yet.</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 6px;">Admin will publish new designed projects soon. Check back shortly!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const techTags = (item.techStack || '').split(',').map(t => `<span class="tech-chip">${t.trim()}</span>`).join('');
    const downloadHref = item.downloadUrl || 'https://github.com/designvallet01-ai';
    const previewHref = item.previewUrl || 'https://www.elitewebkingdom.in/';
    const isApp = item.category === 'Android App' || item.category === 'iOS App';

    return `
      <div class="glass-card">
        <div>
          <div class="card-img-wrapper">
            <img src="${item.imageUrl || '/1.jpeg'}" alt="${item.title}" class="card-img">
            <span class="promo-badge">${item.badge || 'FREE ACCESS'}</span>
            <span class="price-tag" style="background: linear-gradient(135deg, ${isApp ? '#059669, #10B981' : '#0284C7, #38BDF8'});">
              ${isApp ? 'APK DOWNLOAD 📥' : 'WEB SITE 🌐'}
            </span>
          </div>

          <div class="card-content">
            <span class="cat-label">${item.category.toUpperCase()}</span>
            <h3 class="card-title">${item.title}</h3>
            <p class="card-desc">${item.description}</p>
            <div class="tech-tags">${techTags}</div>
          </div>
        </div>

        <div class="card-actions" style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${isApp ? `
            <a href="${downloadHref}" download target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="flex: 1; padding: 9px 12px; font-size: 0.82rem; background: linear-gradient(135deg, #059669, #047857); text-align: center; text-decoration: none; color: #fff;">
              Download APK File 📥
            </a>
          ` : `
            <a href="${previewHref}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="flex: 1; padding: 9px 12px; font-size: 0.82rem; background: linear-gradient(135deg, #0284C7, #0369A1); text-align: center; text-decoration: none; color: #fff;">
              Visit Web Site 🌐
            </a>
          `}
          ${previewHref && isApp ? `
            <a href="${previewHref}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="flex: 1; padding: 9px 12px; font-size: 0.82rem; text-align: center; text-decoration: none;">
              Live Demo ↗
            </a>
          ` : ''}
          <button class="btn btn-secondary" onclick="openPortalStoreModal('${item.id}')" style="padding: 9px 12px; font-size: 0.82rem;" title="View Details">
            🔍
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.openPortalStoreModal = function(id) {
  const modal = document.getElementById('portal-store-modal');
  const body = document.getElementById('portal-modal-body');
  if (!modal || !body) return;

  const item = cachedPortalStoreItems.find(i => i.id === id);
  if (!item) return;

  const techTags = (item.techStack || '').split(',').map(t => `<span class="tech-chip">${t.trim()}</span>`).join('');
  const downloadHref = item.downloadUrl || 'https://github.com/designvallet01-ai';
  const previewHref = item.previewUrl || 'https://www.elitewebkingdom.in/';

  body.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="${item.imageUrl || '/1.jpeg'}" alt="${item.title}" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: var(--radius-md); margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.1);">
      <span class="cat-label">${item.category.toUpperCase()}</span>
      <h2 style="font-size: 1.6rem; color: var(--text-bright); margin: 6px 0 10px;">${item.title}</h2>
      <div style="display: flex; gap: 12px; justify-content: center; align-items: center; margin-bottom: 16px;">
        <span class="price-tag" style="position: static; font-size: 0.9rem; padding: 6px 16px; background: linear-gradient(135deg, #059669, #10B981);">${item.price || 'FREE DOWNLOAD'} ⬇️</span>
        <span class="promo-badge" style="position: static; font-size: 0.8rem;">${item.badge || 'WORK SHOWCASE'}</span>
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <h4 style="color: var(--cyan-primary); font-size: 0.95rem; margin-bottom: 8px;">Architecture Overview & Work Showcase:</h4>
      <p style="color: var(--text-muted); font-size: 0.92rem; line-height: 1.6;">${item.description}</p>
    </div>

    <div style="margin-bottom: 24px;">
      <h4 style="color: var(--cyan-primary); font-size: 0.95rem; margin-bottom: 8px;">Tech Stack & Frameworks:</h4>
      <div class="tech-tags">${techTags}</div>
    </div>

    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
      <a href="${downloadHref}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="flex: 1; text-align: center; background: linear-gradient(135deg, #059669, #047857);">
        Free Download Source / File ⬇️
      </a>
      ${previewHref ? `<a href="${previewHref}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="flex: 1; text-align: center;">Live Demo Preview ↗</a>` : ''}
    </div>
  `;

  modal.style.display = 'flex';
};

window.closePortalStoreModal = function() {
  const modal = document.getElementById('portal-store-modal');
  if (modal) modal.style.display = 'none';
};

document.addEventListener('DOMContentLoaded', () => {
  loadPortalStoreItems();

  const filterBtns = document.querySelectorAll('.store-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter');
      const searchVal = document.getElementById('portal-store-search')?.value || '';
      renderPortalStoreGrid(cat, searchVal);
    });
  });

  const searchInput = document.getElementById('portal-store-search');
  if (searchInput) {
    searchInput.addEventListener('keyup', () => {
      const activeBtn = document.querySelector('.store-filter-btn.active');
      const cat = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
      renderPortalStoreGrid(cat, searchInput.value);
    });
  }
});
