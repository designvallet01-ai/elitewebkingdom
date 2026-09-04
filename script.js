// Safe Local & Session Storage wrappers for iOS Safari / Private Browsing / WebViews
const SafeStorage = {
  get(type, key, defaultValue = null) {
    try {
      const storage = window[type];
      if (!storage) return defaultValue;
      const val = storage.getItem(key);
      return val !== null ? val : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },
  set(type, key, value) {
    try {
      const storage = window[type];
      if (storage) storage.setItem(key, value);
    } catch (e) {}
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // --- IMMEDIATE FAILSAFE REVEAL FOR IOS / SLOW CONNECTIONS ---
  function activateReveals() {
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => {
      // If element is already in viewport or above fold, activate immediately
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 50) {
        el.classList.add('active');
      }
    });
  }
  activateReveals();
  setTimeout(activateReveals, 100);
  setTimeout(activateReveals, 500);

  // --- SUPABASE CLIENT INITIALIZATION ---
  const SUPABASE_URL = "https://jgvgqgbhzadxvcolgvly.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5ToLoZzsP_B3FQoYBzTnEA_re1QwPPv";
  let supabase = null;
  
  try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }

  // --- REAL VISITORS TRACKER (STRICTLY ON elitewebkingdom.in) ---
  async function trackRealVisitor() {
    try {
      const hostname = window.location.hostname.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();

      // STRICT DOMAIN CHECK: Only count real visitors on elitewebkingdom.in
      const isProduction = hostname === 'elitewebkingdom.in' || 
                           hostname === 'www.elitewebkingdom.in' || 
                           hostname.endsWith('.elitewebkingdom.in');

      if (!isProduction) {
        // Exclude localhost, 127.0.0.1, or non-production previews
        return;
      }

      // Exclude Admin portal or Team management internal views
      if (pathname.includes('/admin') || pathname.includes('/team')) {
        return;
      }

      // Count each unique visitor session once
      if (!SafeStorage.get('sessionStorage', 'ewk_session_counted')) {
        SafeStorage.set('sessionStorage', 'ewk_session_counted', 'true');

        let count = parseInt(SafeStorage.get('localStorage', 'ewk_real_visitors', '0') || '0');
        count += 1;
        SafeStorage.set('localStorage', 'ewk_real_visitors', count.toString());

        if (supabase) {
          try {
            await supabase.from('pageviews').insert([{
              url: window.location.pathname || '/',
              hostname: hostname,
              user_agent: (navigator.userAgent || '').substring(0, 150),
              referrer: document.referrer ? document.referrer.substring(0, 150) : 'direct',
              created_at: new Date().toISOString()
            }]);
          } catch (err) {
            console.warn('Pageview tracking log:', err);
          }
        }
      }
    } catch (e) {
      console.warn('Visitor tracking error:', e);
    }
  }
  trackRealVisitor();

  // --- CURSOR SPOTLIGHT & CARD MOUSE TRACKING ---
  const spotlight = document.getElementById('spotlight');
  if (spotlight && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('mousemove', (e) => {
      spotlight.style.left = `${e.clientX}px`;
      spotlight.style.top = `${e.clientY}px`;
      
      const cards = document.querySelectorAll('.glass-card');
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    }, { passive: true });
  }

  // --- HEADER SCROLL & BACK TO TOP ---
  const header = document.getElementById('header');
  const backToTopBtn = document.getElementById('back-to-top');

  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (scrollY > 50) {
      header?.classList.add('scrolled');
      if (backToTopBtn) backToTopBtn.style.opacity = '1';
    } else {
      header?.classList.remove('scrolled');
      if (backToTopBtn) backToTopBtn.style.opacity = '0';
    }
    
    // Active navigation highlight on scroll
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 140;
      const sectionId = current.getAttribute('id');
      const navItem = document.querySelector(`.nav-menu a[href*="${sectionId}"]`);

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navItem?.classList.add('active');
      } else {
        navItem?.classList.remove('active');
      }
    });
  }, { passive: true });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- MOBILE MENU TOGGLE ---
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link, .mobile-cta-btn');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      menuToggle.classList.toggle('open');
      navMenu.classList.toggle('open');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('open');
        navMenu.classList.remove('open');
      });
    });

    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        menuToggle.classList.remove('open');
        navMenu.classList.remove('open');
      }
    });
  }

  // --- SCROLL REVEAL ANIMATIONS (WITH SAFARI COMPATIBILITY) ---
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealOnScroll = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px 50px 0px' });

    revealElements.forEach(el => revealOnScroll.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('active'));
  }

  // --- HERO INTERACTIVE TAB PREVIEW ---
  const tabBtns = document.querySelectorAll('.preview-tabs .tab-btn');
  const previewTabContent = document.getElementById('preview-tab-content');

  const tabContents = {
    web: `
      <div class="code-line"><span class="code-keyword">const</span> enterpriseCluster = <span class="code-keyword">new</span> SystemArchitecture({</div>
      <div class="code-line" style="padding-left: 20px;">framework: <span class="code-str">'React / Next.js Micro-Frontends'</span>,</div>
      <div class="code-line" style="padding-left: 20px;">latency: <span class="code-num">0.8</span>, <span class="code-str">// seconds</span></div>
      <div class="code-line" style="padding-left: 20px;">security: <span class="code-str">'A+ Zero-Trust Encryption'</span>,</div>
      <div class="code-line" style="padding-left: 20px;">status: <span class="code-str">'ENTERPRISE PRODUCTION READY'</span></div>
      <div class="code-line">});</div>
      <div class="code-line" style="margin-top: 15px; color: var(--emerald-accent);">// ⚡ Status: 100% Core Nodes Operational</div>
    `,
    mobile: `
      <div class="code-line"><span class="code-keyword">class</span> MobileApp <span class="code-keyword">extends</span> NativeComponent {</div>
      <div class="code-line" style="padding-left: 20px;">platform: [<span class="code-str">'Android (Kotlin)'</span>, <span class="code-str">'iOS (Swift)'</span>],</div>
      <div class="code-line" style="padding-left: 20px;">uiEngine: <span class="code-str">'Jetpack Compose / SwiftUI'</span>,</div>
      <div class="code-line" style="padding-left: 20px;">storeReady: <span class="code-keyword">true</span></div>
      <div class="code-line">}</div>
      <div class="code-line" style="margin-top: 15px; color: var(--cyan-primary);">// 📱 60 FPS Fluid Gesture Engine Active</div>
    `,
    cloud: `
      <div class="code-line"><span class="code-keyword">service</span> CloudRealm {</div>
      <div class="code-line" style="padding-left: 20px;">database: <span class="code-str">'Supabase PostgreSQL'</span>,</div>
      <div class="code-line" style="padding-left: 20px;">auth: <span class="code-str">'JWT & Multi-Factor'</span>,</div>
      <div class="code-line" style="padding-left: 20px;">hosting: <span class="code-str">'AWS Edge Gateway'</span></div>
      <div class="code-line">}</div>
      <div class="code-line" style="margin-top: 15px; color: var(--violet-primary);">// ☁️ Distributed Server Response: 12ms</div>
    `
  };

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tabKey = btn.getAttribute('data-tab');
      if (previewTabContent && tabContents[tabKey]) {
        previewTabContent.innerHTML = tabContents[tabKey];
      }
    });
  });

  // --- PORTFOLIO FILTER LOGIC ---
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portfolioCards = document.querySelectorAll('.portfolio-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filterValue = btn.getAttribute('data-filter');

      portfolioCards.forEach(card => {
        const cardCat = card.getAttribute('data-category');
        if (filterValue === 'all' || cardCat === filterValue) {
          card.style.display = 'flex';
          card.classList.add('active');
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // --- INSTANT COST ESTIMATOR LOGIC ---
  const estService = document.getElementById('est-service');
  const estScale = document.getElementById('est-scale');
  const estTimeline = document.getElementById('est-timeline');
  const estResultPrice = document.getElementById('est-result-price');
  const estResultTime = document.getElementById('est-result-time');
  const estApplyBtn = document.getElementById('est-apply-btn');

  function calculateEstimate() {
    if (!estService || !estScale || !estTimeline) return;
    const selectedOption = estService.options[estService.selectedIndex];
    const basePrice = parseInt(selectedOption.getAttribute('data-price') || 25000);
    const baseTime = selectedOption.getAttribute('data-time') || '2-3 Weeks';

    const scaleMult = parseFloat(estScale.options[estScale.selectedIndex].getAttribute('data-mult') || 1.0);
    const timeMult = parseFloat(estTimeline.options[estTimeline.selectedIndex].getAttribute('data-mult') || 1.0);

    const calculatedPrice = Math.round(basePrice * scaleMult * timeMult);
    const minPrice = Math.round(calculatedPrice * 0.9);
    const maxPrice = Math.round(calculatedPrice * 1.15);

    if (estResultPrice) {
      estResultPrice.textContent = `₹${minPrice.toLocaleString('en-IN')} - ₹${maxPrice.toLocaleString('en-IN')}`;
    }
    if (estResultTime) {
      estResultTime.textContent = baseTime;
    }
  }

  [estService, estScale, estTimeline].forEach(select => {
    select?.addEventListener('change', calculateEstimate);
  });
  calculateEstimate();

  if (estApplyBtn) {
    estApplyBtn.addEventListener('click', () => {
      const selectedService = estService.value;
      const priceText = estResultPrice.textContent;
      const timelineText = estResultTime.textContent;

      const categorySelect = document.getElementById('category');
      const budgetSelect = document.getElementById('budget');
      const messageTextarea = document.getElementById('message');

      if (categorySelect) categorySelect.value = selectedService;
      
      // Match budget select
      if (budgetSelect) {
        if (priceText.includes('25,000') || priceText.includes('35,000')) {
          budgetSelect.value = '₹25,000 - ₹50,000';
        } else if (priceText.includes('50,000') || priceText.includes('60,000')) {
          budgetSelect.value = '₹50,000 - ₹1,00,000';
        } else if (priceText.includes('1,00,000')) {
          budgetSelect.value = '₹1,00,000 - ₹2,50,000';
        }
      }

      if (messageTextarea) {
        messageTextarea.value = `Applied Estimate: Service: ${selectedService} | Estimated Range: ${priceText} | Expected Timeline: ${timelineText}.\n\nAdditional Requirements: `;
      }

      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // --- PROJECT TRACKER LOGIC ---
  const trackerInput = document.getElementById('tracker-id-input');
  const trackBtn = document.getElementById('track-btn');
  const trackerError = document.getElementById('tracker-search-error');
  const trackerResults = document.getElementById('tracker-results');
  const demoChips = document.querySelectorAll('.demo-chip');

  const mockTrackerDb = {
    'EWK8F27A': {
      client: 'Acme Enterprise Solutions',
      type: 'Full Stack Web Platform',
      status: 'in_progress',
      statusLabel: 'In Progress (80%)',
      memo: 'Sprint 4 complete. React micro-frontends deployed to staging server. Final API security audit underway.'
    },
    'DEMO101': {
      client: 'Kingdom Retail Network',
      type: 'Native Android & iOS App',
      status: 'completed',
      statusLabel: 'Production Live',
      memo: 'App Store & Play Store approval confirmed. Production build live on Google Play & Apple App Store.'
    }
  };

  function updateTrackerUI(data) {
    if (!data) return;
    document.getElementById('track-client-name').textContent = data.client || '-';
    document.getElementById('track-project-type').textContent = data.type || '-';
    document.getElementById('track-current-status').textContent = data.statusLabel || data.status || '-';
    document.getElementById('track-status-memo').textContent = data.memo || 'No active developer notes.';

    // Stepper progress logic
    const steps = ['new', 'under-review', 'accepted', 'in-progress', 'completed'];
    const stepElements = {
      'new': document.getElementById('step-new'),
      'under-review': document.getElementById('step-under-review'),
      'accepted': document.getElementById('step-accepted'),
      'in-progress': document.getElementById('step-in-progress'),
      'completed': document.getElementById('step-completed')
    };

    const statusMap = {
      'new': 0,
      'under_review': 1,
      'under-review': 1,
      'accepted': 2,
      'in_progress': 3,
      'in-progress': 3,
      'completed': 4
    };

    const activeIndex = statusMap[data.status] ?? 0;
    const progressWidths = ['0%', '25%', '50%', '75%', '100%'];
    
    const progressBar = document.getElementById('stepper-progress-bar');
    if (progressBar) progressBar.style.width = progressWidths[activeIndex];

    steps.forEach((stepKey, idx) => {
      const el = stepElements[stepKey];
      if (el) {
        el.classList.remove('completed', 'active');
        if (idx < activeIndex) {
          el.classList.add('completed');
        } else if (idx === activeIndex) {
          el.classList.add('active');
        }
      }
    });

    if (trackerResults) trackerResults.style.display = 'block';
    if (trackerError) trackerError.style.display = 'none';
  }

  async function searchProject(id) {
    const cleanId = id.trim().toUpperCase();
    if (!cleanId) return;

    if (trackerError) trackerError.style.display = 'none';

    // Check Supabase first if available
    if (supabase) {
      try {
        const { data, error } = await supabase.from('leads').select('*').eq('id', cleanId).single();
        if (data && !error) {
          updateTrackerUI({
            client: data.name || data.company || 'Client Project',
            type: data.category || 'Software Solution',
            status: data.status || 'new',
            statusLabel: (data.status || 'Received').replace('_', ' ').replace('-', ' ').toUpperCase(),
            memo: data.message ? `Requirements: "${data.message.substring(0, 80)}..."` : `Project proposal logged on ${new Date(data.created_at).toLocaleDateString()}.`
          });
          return;
        }
      } catch (err) {
        console.log('Supabase lookup note:', err);
      }
    }

    // Check LocalStorage cache
    try {
      const localLeads = JSON.parse(localStorage.getItem('ewk_leads')) || [];
      const foundLead = localLeads.find(l => l.id && l.id.toUpperCase() === cleanId);
      if (foundLead) {
        updateTrackerUI({
          client: foundLead.name || foundLead.company || 'Client Project',
          type: foundLead.category || 'Software Solution',
          status: foundLead.status || 'new',
          statusLabel: (foundLead.status || 'Received').replace('_', ' ').replace('-', ' ').toUpperCase(),
          memo: foundLead.message ? `Requirements: "${foundLead.message.substring(0, 80)}..."` : `Project proposal logged.`
        });
        return;
      }
    } catch (e) {}

    // Fallback to mock DB
    if (mockTrackerDb[cleanId]) {
      updateTrackerUI(mockTrackerDb[cleanId]);
    } else {
      if (trackerResults) trackerResults.style.display = 'none';
      if (trackerError) {
        trackerError.textContent = `Project ID "${cleanId}" not found in current staging registry. Please verify your ID or contact support.`;
        trackerError.style.display = 'block';
      }
    }
  }

  if (trackBtn && trackerInput) {
    trackBtn.addEventListener('click', () => searchProject(trackerInput.value));
    trackerInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchProject(trackerInput.value);
    });
  }

  demoChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const demoId = chip.getAttribute('data-id');
      if (trackerInput && demoId) {
        trackerInput.value = demoId;
        searchProject(demoId);
      }
    });
  });

  // --- CONTACT FORM SUBMISSION HANDLER ---
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const company = document.getElementById('company')?.value?.trim() || 'N/A';
      const category = document.getElementById('category').value;
      const budget = document.getElementById('budget').value;
      const timeline = document.getElementById('timeline')?.value || 'Standard (2-4 Weeks)';
      const message = document.getElementById('message').value.trim();

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Architecting Scope Proposal...';
      }

      const generatedId = 'EWK' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const nowIso = new Date().toISOString();
      const leadPayload = {
        id: generatedId,
        name,
        email,
        phone: phone || 'N/A',
        company: company || 'N/A',
        category,
        budget,
        timeline,
        message,
        status: 'new',
        created_at: nowIso
      };

      let savedToSupabase = false;

      // 1. Insert into Supabase table 'leads'
      if (supabase) {
        try {
          const { error } = await supabase.from('leads').insert([leadPayload]);
          if (!error) {
            savedToSupabase = true;
          } else {
            console.error('Supabase lead insertion error:', error);
          }
        } catch (err) {
          console.error('Supabase proposal insertion error:', err);
        }
      }

      // 2. LocalStorage backup (ewk_leads) so Admin can immediately view proposal
      try {
        let localLeads = JSON.parse(localStorage.getItem('ewk_leads')) || [];
        localLeads.unshift({
          id: generatedId,
          name,
          email,
          phone: phone || 'N/A',
          company: company || 'N/A',
          category,
          budget,
          timeline,
          message,
          date: new Date().toLocaleDateString(),
          status: 'new'
        });
        localStorage.setItem('ewk_leads', JSON.stringify(localLeads));
      } catch (lsErr) {
        console.warn('LocalStorage lead backup error:', lsErr);
      }

      // Always display success alert with project ID & WhatsApp direct handoff
      if (formStatus) {
        formStatus.className = 'form-status success';
        formStatus.innerHTML = `
          <strong>Proposal Submitted Successfully!</strong><br>
          Your assigned Project Tracking ID is: <strong style="color: var(--cyan-primary); font-family: var(--font-mono);">${generatedId}</strong><br>
          <span style="font-size: 0.85rem;">Lead Architect Gowri Narayana Guduru will review your requirements shortly.</span>
          <div style="margin-top: 12px;">
            <a href="https://wa.me/919985369590?text=Hello%20Gowri%20Narayana,%20I%20just%20submitted%20a%20proposal%20request%20with%20ID:%20${generatedId}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp" style="padding: 8px 16px; font-size: 0.82rem;">
              Connect on WhatsApp with ID: ${generatedId}
            </a>
          </div>
        `;
        formStatus.style.display = 'block';
      }

      contactForm.reset();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          Submit Proposal Request
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        `;
      }
    });
  }

  // --- NEWSLETTER FORM ---
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Thank you for subscribing to Elite Web Kingdom Architecture Insights!');
      newsletterForm.reset();
    });
  }
});

// Handle asset prefill from showcase portal
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const assetName = urlParams.get('asset');
  if (assetName) {
    const messageInput = document.getElementById('message');
    const categoryInput = document.getElementById('category');
    if (categoryInput) categoryInput.value = 'Web Architecture';
    if (messageInput) {
      messageInput.value = `Hello Elite Web Kingdom, I am interested in your showcase work: "${assetName}". Please provide details for custom development.`;
    }
  }
});

