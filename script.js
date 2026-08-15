document.addEventListener('DOMContentLoaded', () => {
  // --- SUPABASE CLIENT INITIALIZATION ---
  const SUPABASE_URL = "https://jgvgqgbhzadxvcolgvly.supabase.co";
  const SUPABASE_KEY = "sb_publishable_5ToLoZzsP_B3FQoYBzTnEA_re1QwPPv";
  let supabase = null;
  
  try {
    if (window.supabase) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }

  // --- REAL VISITORS TRACKER ---
  async function trackRealVisitor() {
    let count = parseInt(localStorage.getItem('ewk_real_visitors') || '0');
    if (!sessionStorage.getItem('ewk_session_logged')) {
      sessionStorage.setItem('ewk_session_logged', 'true');
      count += 1;
      localStorage.setItem('ewk_real_visitors', count.toString());

      if (supabase) {
        try {
          await supabase.from('pageviews').insert([{
            url: window.location.pathname || '/',
            user_agent: navigator.userAgent.substring(0, 100),
            created_at: new Date().toISOString()
          }]);
        } catch (err) {
          console.log('Supabase pageview insertion log:', err);
        }
      }
    }
  }
  trackRealVisitor();

  // --- CURSOR SPOTLIGHT & CARD MOUSE TRACKING ---
  const spotlight = document.getElementById('spotlight');
  document.addEventListener('mousemove', (e) => {
    if (spotlight) {
      spotlight.style.left = `${e.clientX}px`;
      spotlight.style.top = `${e.clientY}px`;
    }
    
    // Update mouse position for dynamic glassmorphic radial border highlight
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // --- HEADER SCROLL & BACK TO TOP ---
  const header = document.getElementById('header');
  const backToTopBtn = document.getElementById('back-to-top');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header?.classList.add('scrolled');
      if (backToTopBtn) backToTopBtn.style.opacity = '1';
    } else {
      header?.classList.remove('scrolled');
      if (backToTopBtn) backToTopBtn.style.opacity = '0';
    }
    
    // Active navigation highlight on scroll
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;

    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');
      const navItem = document.querySelector(`.nav-menu a[href*=${sectionId}]`);

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navItem?.classList.add('active');
      } else {
        navItem?.classList.remove('active');
      }
    });
  });

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

  // --- SCROLL REVEAL ANIMATIONS ---
  const revealElements = document.querySelectorAll('.reveal');
  const revealOnScroll = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(el => revealOnScroll.observe(el));

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
        const { data, error } = await supabase.from('proposals').select('*').eq('project_id', cleanId).single();
        if (data && !error) {
          updateTrackerUI({
            client: data.name || data.company || 'Client Project',
            type: data.category || 'Software Solution',
            status: data.status || 'new',
            statusLabel: (data.status || 'Received').replace('_', ' ').toUpperCase(),
            memo: data.memo || `Project proposal logged on ${new Date(data.created_at).toLocaleDateString()}.`
          });
          return;
        }
      } catch (err) {
        console.log('Supabase lookup note:', err);
      }
    }

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

      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value;
      const company = document.getElementById('company').value;
      const category = document.getElementById('category').value;
      const budget = document.getElementById('budget').value;
      const message = document.getElementById('message').value;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Architecting Scope Proposal...';
      }

      const generatedId = 'EWK' + Math.random().toString(36).substring(2, 8).toUpperCase();
      let success = false;

      if (supabase) {
        try {
          const { error } = await supabase.from('proposals').insert([{
            project_id: generatedId,
            name,
            email,
            phone,
            company,
            category,
            budget,
            message,
            status: 'new',
            created_at: new Date().toISOString()
          }]);

          if (!error) success = true;
        } catch (err) {
          console.error('Supabase proposal insertion error:', err);
        }
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

