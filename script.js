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

  // --- HEADER SCROLL ACTION ---
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // --- MOBILE MENU TOGGLE ---
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('open');
      navMenu.classList.toggle('open');
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('open');
        navMenu.classList.remove('open');
      });
    });
  }

  // --- SCROLL REVEAL ANIMATIONS (Intersection Observer) ---
  const revealElements = document.querySelectorAll('.reveal');
  
  const revealOnScroll = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Once animated, no need to observe it again
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => {
    revealOnScroll.observe(el);
  });

  // --- ACTIVE NAVBAR LINKS ON SCROLL ---
  const sections = document.querySelectorAll('section[id]');
  
  const scrollSpy = () => {
    const scrollY = window.pageYOffset;
    
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 160; // offset for nav height
      const sectionId = current.getAttribute('id');
      const activeLink = document.querySelector(`.nav-menu a[href*=${sectionId}]`);
      
      if (activeLink) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          navLinks.forEach(link => link.classList.remove('active'));
          activeLink.classList.add('active');
        }
      }
    });
  };
  
  window.addEventListener('scroll', scrollSpy);

  // --- CONTACT FORM HANDLER WITH WHATSAPP INTEGRATION ---
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Get form fields
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

      // Show submitting state
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Preparing proposal... <span class="spinner"></span>';
      showStatus('Filing proposal in database...', 'success');

      // Generate a client-side alphanumeric tracker ID (e.g. EWK8F2A)
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let alphanumericId = 'EWK';
      for (let i = 0; i < 5; i++) {
        alphanumericId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const tempId = alphanumericId;
      let finalId = tempId;

      // Save lead to Supabase database (real connection)
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('leads')
            .insert([
              {
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
              }
            ])
            .select();
            
          if (error) throw error;
          
          if (data && data[0]) {
            finalId = data[0].id;
            console.log('Lead synced to Supabase. ID generated:', finalId);
          }
        } catch (dbErr) {
          console.error('Supabase DB insertion error, using local fallback:', dbErr);
        }
      }

      // Save lead to localStorage for local logging/redundancy
      const newLead = {
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
      };
      
      try {
        let leads = JSON.parse(localStorage.getItem('ewk_leads')) || [];
        leads.unshift(newLead);
        localStorage.setItem('ewk_leads', JSON.stringify(leads));
      } catch (err) {
        console.error('Error saving lead to localStorage:', err);
      }

      // Create WhatsApp message string
      const whatsappBase = "https://wa.me/919985369590";
      const companyLine = company ? `\nCompany: *${company}*` : '';
      const textMessage = `Hello Elite Web Kingdom! 🌟\n\n` +
                          `I'd like to submit a project brief:\n\n` +
                          `Project Tracker ID: *${finalId}*\n` +
                          `Name: *${name}*\n` +
                          `Email: *${email}*\n` +
                          `Phone: *${phone}*${companyLine}\n` +
                          `Service: *${category}*\n` +
                          `Est. Budget: *${budget}*\n` +
                          `Est. Timeline: *${timeline}*\n\n` +
                          `*Project Brief:*\n${message}\n\n` +
                          `Please let me know when we can align.`;
                          
      const encodedText = encodeURIComponent(textMessage);
      const whatsappURL = `${whatsappBase}?text=${encodedText}`;

      setTimeout(() => {
        showStatus(`Proposal submitted successfully! Your Unique Project Tracker ID is: ${finalId}. Save this ID to track your status. Redirecting to WhatsApp...`, 'success');
        
        // Reset form
        contactForm.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Proposal Request <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
        
        // Redirect to WhatsApp
        window.open(whatsappURL, '_blank');
      }, 1500);
    });
  }

  // --- CLIENT PROJECT STATUS TRACKER CONTROLLER ---
  const trackBtn = document.getElementById('track-btn');
  const trackerInput = document.getElementById('tracker-id-input');
  const trackerError = document.getElementById('tracker-search-error');
  const trackerResults = document.getElementById('tracker-results');
  
  if (trackBtn && trackerInput) {
    trackBtn.addEventListener('click', async () => {
      const inputVal = trackerInput.value.trim();
      if (trackerError) trackerError.style.display = 'none';
      if (trackerResults) trackerResults.style.display = 'none';
      
      if (!inputVal) {
        showTrackerError('Please enter a Unique Project ID or Email Address.');
        return;
      }
      
      trackBtn.disabled = true;
      trackBtn.innerHTML = 'Retrieving... <span class="spinner"></span>';
      
      let projectData = null;
      let loaded = false;
      
      // 1. Try fetching from Supabase leads table
      if (supabase) {
        try {
          let query = supabase.from('leads').select('*');
          if (inputVal.includes('@')) {
            query = query.eq('email', inputVal);
          } else {
            query = query.eq('id', inputVal);
          }
          
          const { data, error } = await query;
          if (error) throw error;
          
          if (data && data.length > 0) {
            projectData = data[0];
            loaded = true;
          }
        } catch (dbErr) {
          console.warn('Failed querying tracker from Supabase:', dbErr);
        }
      }
      
      // 2. Try fetching from LocalStorage fallback
      if (!loaded) {
        try {
          const localLeads = JSON.parse(localStorage.getItem('ewk_leads')) || [];
          projectData = localLeads.find(l => 
            String(l.id) === inputVal || 
            l.email.toLowerCase() === inputVal.toLowerCase()
          );
          if (projectData) loaded = true;
        } catch (err) {
          console.error('Error querying local storage for tracker:', err);
        }
      }
      
      trackBtn.disabled = false;
      trackBtn.innerHTML = 'Check Status <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
      
      if (loaded && projectData) {
        renderTrackerResults(projectData);
      } else {
        showTrackerError('No project found matching that ID or Email. Please check your credentials or contact Gowri.');
      }
    });
  }
  
  function showTrackerError(msg) {
    if (trackerError) {
      trackerError.textContent = msg;
      trackerError.style.display = 'block';
    }
  }
  
  function renderTrackerResults(data) {
    if (!trackerResults) return;
    
    // Set headers
    const clientName = document.getElementById('track-client-name');
    const projectType = document.getElementById('track-project-type');
    const currentStatus = document.getElementById('track-current-status');
    const statusMemo = document.getElementById('track-status-memo');
    
    if (clientName) clientName.textContent = data.name + (data.company && data.company !== 'N/A' ? ` (${data.company})` : '');
    if (projectType) projectType.textContent = data.category;
    
    const statusMap = {
      'new': { label: 'Proposal Received', step: 1, pct: '0%', memo: 'Thank you! Gowri has received your proposal request and is evaluating scope, layout mockups, and deployment estimates. We will reach out shortly.' },
      'under-review': { label: 'Under Review', step: 2, pct: '25%', memo: 'Your project brief is currently under active review. We are auditing target APIs, DB requirements, and design scopes.' },
      'accepted': { label: 'Project Accepted', step: 3, pct: '50%', memo: 'Elite Web Kingdom has officially accepted your project! Gowri is establishing wireframes, setting up database tables, and coding backend routes.' },
      'in-progress': { label: 'In Development', step: 4, pct: '75%', memo: 'Active development phase. Coding modules, connecting Supabase integrations, and compiling styling grids in real time.' },
      'completed': { label: 'Completed & Live', step: 5, pct: '100%', memo: 'Congratulations! Your digital kingdom is fully complete, security checked, and live on production servers. All assets synchronized.' },
      'archived': { label: 'Archived / Closed', step: 5, pct: '100%', memo: 'This project code log has been archived. Please contact support if you need further system maintenance.' },
      'denied': { label: 'Denied', step: 0, pct: '0%', memo: 'Your project proposal has been denied.' }
    };
    
    const state = statusMap[data.status] || statusMap['new'];
    
    if (currentStatus) {
      currentStatus.textContent = state.label.toUpperCase();
      currentStatus.className = `status-badge ${data.status}`;
    }
    if (statusMemo) statusMemo.textContent = state.memo;
    
    // Toggle stepper display if status is denied
    const stepperEl = document.querySelector('.tracker-stepper');
    if (data.status === 'denied') {
      if (stepperEl) stepperEl.style.display = 'none';
    } else {
      if (stepperEl) stepperEl.style.display = 'flex';
      
      const steps = ['new', 'under-review', 'accepted', 'in-progress', 'completed'];
      const currentStepIndex = steps.indexOf(data.status === 'archived' ? 'completed' : data.status);
      
      steps.forEach((stepName, idx) => {
        const stepEl = document.getElementById(`step-${stepName}`);
        if (stepEl) {
          stepEl.classList.remove('active', 'completed');
          if (idx < currentStepIndex) {
            stepEl.classList.add('completed');
          } else if (idx === currentStepIndex) {
            stepEl.classList.add('active');
          }
        }
      });
      
      const progressBar = document.getElementById('stepper-progress-bar');
      if (progressBar) {
        const widthPct = currentStepIndex >= 0 ? `${(currentStepIndex / 4) * 100}%` : '0%';
        progressBar.style.width = widthPct;
        progressBar.style.height = widthPct;
      }
    }
    
    trackerResults.style.display = 'block';
    trackerResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Helper function for status messages
  function showStatus(msg, type) {
    if (formStatus) {
      formStatus.textContent = msg;
      formStatus.className = 'form-status'; // Reset classes
      formStatus.classList.add(type);
      formStatus.style.display = 'block';
    }
  }

  // --- NEWSLETTER FORM ---
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('.newsletter-input');
      if (emailInput && emailInput.value) {
        alert(`Thank you for subscribing, ${emailInput.value}! Keep an eye on your inbox.`);
        newsletterForm.reset();
      }
    });
  }
});
