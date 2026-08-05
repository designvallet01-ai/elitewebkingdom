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

  // --- CURSOR SPOTLIGHT EFFECT & CARD MOUSE TRACKING ---
  const spotlight = document.getElementById('spotlight');
  document.addEventListener('mousemove', (e) => {
    if (spotlight) {
      spotlight.style.left = `${e.clientX}px`;
      spotlight.style.top = `${e.clientY}px`;
    }
    
    // Update cards mouse position for dynamic radial border gradient
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // --- HEADER SCROLL ACTION ---
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
  });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- MOBILE MENU TOGGLE ---
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('open');
      navMenu.classList.toggle('open');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('open');
        navMenu.classList.remove('open');
      });
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
      <div class="code-line"><span class="code-keyword">const</span> kingdomSystem = <span class="code-keyword">new</span> EliteEngine({</div>
      <div class="code-line" style="padding-left: 20px;">framework: <span class="code-str">'React / Next.js'</span>,</div>
      <div class="code-line" style="padding-left: 20px;">speedIndex: <span class="code-num">0.8</span>, <span class="code-str">// seconds</span></div>
      <div class="code-line" style="padding-left: 20px;">security: <span class="code-str">'A+ Encrypted'</span>,</div>
      <div class="code-line" style="padding-left: 20px;">status: <span class="code-str">'PRODUCTION READY'</span></div>
      <div class="code-line">});</div>
      <div class="code-line" style="margin-top: 15px; color: var(--emerald-accent);">// ⚡ Status: All 15+ nodes online</div>
    `,
    mobile: `
      <div class="code-line"><span class="code-keyword">class</span> MobileApp <span class="code-keyword">extends</span> NativeComponent {</div>
      <div class="code-line" style="padding-left: 20px;">platform: [<span class="code-str">'Android (Kotlin)'</span>, <span class="code-str">'iOS (Swift)'</span>],</div>
      <div class="code-line" style="padding-left: 20px;">uiEngine: <span class="code-str">'Jetpack Compose / SwiftUI'</span>,</div>
      <div class="code-line" style="padding-left: 20px;">storeReady: <span class="code-keyword">true</span></div>
      <div class="code-line">}</div>
      <div class="code-line" style="margin-top: 15px; color: var(--cyan-primary);">// 📱 60 FPS Fluid Gesture Engine active</div>
    `,
    cloud: `
      <div class="code-line"><span class="code-keyword">service</span> CloudRealm {</div>
      <div class="code-line" style="padding-left: 20px;">database: <span class="code-str">'Supabase PostgreSQL'</span>,</div>
      <div class="code-line" style="padding-left: 20px;">auth: <span class="code-str">'JWT & Multi-Factor'</span>,</div>
      <div class="code-line" style="padding-left: 20px;">hosting: <span class="code-str">'AWS Edge Gateway'</span></div>
      <div class="code-line">}</div>
      <div class="code-line" style="margin-top: 15px; color: var(--violet-primary);">// ☁️ Distributed server response: 12ms</div>
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

  if (estService && estScale && estTimeline) {
    estService.addEventListener('change', calculateEstimate);
    estScale.addEventListener('change', calculateEstimate);
    estTimeline.addEventListener('change', calculateEstimate);
    calculateEstimate();
  }

  if (estApplyBtn) {
    estApplyBtn.addEventListener('click', () => {
      const selectedService = estService.value;
      const categorySelect = document.getElementById('category');
      if (categorySelect) {
        categorySelect.value = selectedService;
      }
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // --- PROJECT TRACKER & DEMO CHIPS LOGIC ---
  const trackBtn = document.getElementById('track-btn');
  const trackInput = document.getElementById('tracker-id-input');
  const trackResults = document.getElementById('tracker-results');
  const trackError = document.getElementById('tracker-search-error');
  const demoChips = document.querySelectorAll('.demo-chip');

  const demoDatabase = {
    'EWK8F27A': {
      client: 'Apex Tech Innovations',
      type: 'Web & Mobile App Hybrid',
      status: 'in-progress',
      memo: 'Sprint 3 complete. Supabase user database integration finalized. API tests clean.'
    },
    'DEMO101': {
      client: 'Vanguard Global',
      type: 'E-Commerce Hub',
      status: 'completed',
      memo: 'Project live on production server! SSL security A+ rating verified.'
    }
  };

  demoChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const demoId = chip.getAttribute('data-id');
      if (trackInput && demoId) {
        trackInput.value = demoId;
        performTrack(demoId);
      }
    });
  });

  if (trackBtn && trackInput) {
    trackBtn.addEventListener('click', () => {
      const inputVal = trackInput.value.trim().toUpperCase();
      if (inputVal) {
        performTrack(inputVal);
      } else {
        showTrackError('Please enter a valid Project ID.');
      }
    });
  }

  async function performTrack(projectId) {
    hideTrackError();
    let leadData = null;

    // Check pre-filled demo database
    if (demoDatabase[projectId]) {
      leadData = demoDatabase[projectId];
    }

    // Check localStorage fallback
    if (!leadData) {
      try {
        const localLeads = JSON.parse(localStorage.getItem('ewk_leads')) || [];
        const found = localLeads.find(l => l.id.toUpperCase() === projectId);
        if (found) {
          leadData = {
            client: found.name + (found.company ? ` (${found.company})` : ''),
            type: found.category,
            status: found.status || 'new',
            memo: `Proposal recorded on ${found.date}. Awaiting developer review.`
          };
        }
      } catch (err) {
        console.error('LocalStorage lookup error:', err);
      }
    }

    // Check Supabase DB
    if (!leadData && supabase) {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('id', projectId)
          .single();

        if (data && !error) {
          leadData = {
            client: data.name + (data.company && data.company !== 'N/A' ? ` (${data.company})` : ''),
            type: data.category,
            status: data.status || 'new',
            memo: data.developer_memo || 'Proposal submitted. Our lead developer will reach out shortly.'
          };
        }
      } catch (dbErr) {
        console.error('Supabase lookup error:', dbErr);
      }
    }

    if (leadData) {
      renderTrackerUI(leadData);
    } else {
      showTrackError(`No project found with ID: ${projectId}. Please double check the ID or contact support.`);
    }
  }

  function renderTrackerUI(data) {
    if (!trackResults) return;
    trackResults.style.display = 'block';

    document.getElementById('track-client-name').textContent = data.client || '-';
    document.getElementById('track-project-type').textContent = data.type || '-';
    document.getElementById('track-current-status').textContent = (data.status || 'new').toUpperCase();
    document.getElementById('track-status-memo').textContent = data.memo || '-';

    // Milestone Stepper Highlighting
    const steps = ['new', 'under-review', 'accepted', 'in-progress', 'completed'];
    const stepElements = {
      'new': document.getElementById('step-new'),
      'under-review': document.getElementById('step-under-review'),
      'accepted': document.getElementById('step-accepted'),
      'in-progress': document.getElementById('step-in-progress'),
      'completed': document.getElementById('step-completed')
    };

    const statusIndex = steps.indexOf(data.status || 'new');
    const progressWidth = statusIndex >= 0 ? (statusIndex / (steps.length - 1)) * 100 : 0;
    
    const progressBar = document.getElementById('stepper-progress-bar');
    if (progressBar) progressBar.style.width = `${progressWidth}%`;

    steps.forEach((stepKey, idx) => {
      const el = stepElements[stepKey];
      if (el) {
        if (idx <= statusIndex) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });

    trackResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showTrackError(msg) {
    if (trackError) {
      trackError.style.display = 'block';
      trackError.textContent = msg;
    }
    if (trackResults) trackResults.style.display = 'none';
  }

  function hideTrackError() {
    if (trackError) trackError.style.display = 'none';
  }

  // --- CONTACT FORM HANDLER WITH WHATSAPP INTEGRATION ---
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const company = document.getElementById('company').value.trim();
      const category = document.getElementById('category').value;
      const budget = document.getElementById('budget').value;
      const timeline = document.getElementById('timeline').value;
      const message = document.getElementById('message').value.trim();
      
      if (!name || !email || !phone || !category || !budget || !timeline || !message) {
        showStatus('Please fill in all required fields.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Filing Proposal... ⚡';
      showStatus('Securing lead entry in database...', 'success');

      // Generate alphanumeric ID (e.g. EWK98A2F)
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let alphanumericId = 'EWK';
      for (let i = 0; i < 5; i++) {
        alphanumericId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      let finalId = alphanumericId;

      // Save to Supabase
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('leads')
            .insert([{
              id: finalId,
              name: name,
              email: email,
              phone: phone,
              company: company || 'N/A',
              category: category,
              budget: budget,
              timeline: timeline,
              message: message,
              status: 'new'
            }]).select();
            
          if (data && data[0]) {
            finalId = data[0].id;
          }
        } catch (dbErr) {
          console.error('Supabase DB error, using local fallback:', dbErr);
        }
      }

      // Save to localStorage
      try {
        let leads = JSON.parse(localStorage.getItem('ewk_leads')) || [];
        leads.unshift({
          id: finalId,
          name: name,
          email: email,
          phone: phone,
          company: company || 'N/A',
          category: category,
          budget: budget,
          timeline: timeline,
          message: message,
          date: new Date().toLocaleDateString(),
          status: 'new'
        });
        localStorage.setItem('ewk_leads', JSON.stringify(leads));
      } catch (err) {
        console.error('LocalStorage write error:', err);
      }

      // Construct WhatsApp link
      const whatsappBase = "https://wa.me/919985369590";
      const textMessage = `Hello Elite Web Kingdom! 🌟\n\n` +
                          `I would like to file a project brief:\n\n` +
                          `Project Tracker ID: *${finalId}*\n` +
                          `Name: *${name}*\n` +
                          `Email: *${email}*\n` +
                          `Phone: *${phone}*\n` +
                          (company ? `Company: *${company}*\n` : '') +
                          `Service: *${category}*\n` +
                          `Est. Budget: *${budget}*\n` +
                          `Est. Timeline: *${timeline}*\n\n` +
                          `*Project Brief:*\n${message}\n\n` +
                          `Please let me know when we can connect!`;

      const whatsappURL = `${whatsappBase}?text=${encodeURIComponent(textMessage)}`;

      showStatus(`Proposal filed successfully! Your Project Tracker ID is: ${finalId}. Redirecting to WhatsApp...`, 'success');

      setTimeout(() => {
        window.open(whatsappURL, '_blank');
        contactForm.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Submit Proposal Request <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
      }, 1500);
    });
  }

  function showStatus(msg, type) {
    if (formStatus) {
      formStatus.className = `form-status ${type}`;
      formStatus.textContent = msg;
    }
  }

  // --- NEWSLETTER FORM HANDLER ---
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Thank you for subscribing to Elite Web Kingdom insights!');
      newsletterForm.reset();
    });
  }
});
