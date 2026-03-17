/* =====================================================
   script.js – Portfolio JavaScript
   ===================================================== */

// ── Theme Toggle ──
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');
const themeLabel  = document.getElementById('themeLabel');

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-mode');
    if (themeIcon)  themeIcon.textContent  = '☀️';
    if (themeLabel) themeLabel.textContent = 'Light';
  } else {
    document.body.classList.remove('light-mode');
    if (themeIcon)  themeIcon.textContent  = '🌙';
    if (themeLabel) themeLabel.textContent = 'Dark';
  }
}

const savedTheme = localStorage.getItem('theme') || 'dark';
applyTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light-mode');
    const newTheme = isLight ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  });
}

// ── Active Nav Link ──
(function setActiveLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

// ── Hamburger Menu ──
const hamburger  = document.getElementById('hamburger');
const mobileNav  = document.getElementById('mobileNav');

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open');
  });
  // close on link click
  mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
    });
  });
}

// ── Scroll Animations ──
const observer = new IntersectionObserver(
  (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } }),
  { threshold: 0.12 }
);
document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

// ── Particles ──
function createParticles() {
  const container = document.querySelector('.particles');
  if (!container) return;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    p.style.left     = Math.random() * 100 + '%';
    p.style.width    = Math.random() * 4 + 2 + 'px';
    p.style.height   = p.style.width;
    p.style.animationDuration  = Math.random() * 15 + 10 + 's';
    p.style.animationDelay     = Math.random() * 10 + 's';
    p.style.opacity  = Math.random() * 0.5 + 0.1;
    container.appendChild(p);
  }
}
createParticles();

// ── Typing Effect (home page) ──
const typingEl = document.getElementById('typingText');
if (typingEl) {
  const words = ['Full Stack Developer', 'Android Developer', 'Problem Solver', 'Tech Enthusiast'];
  let wi = 0, ci = 0, deleting = false;

  function type() {
    const word = words[wi];
    typingEl.textContent = deleting ? word.substring(0, ci--) : word.substring(0, ci++);

    if (!deleting && ci === word.length + 1) {
      deleting = true;
      setTimeout(type, 1800);
    } else if (deleting && ci === 0) {
      deleting = false;
      wi = (wi + 1) % words.length;
      setTimeout(type, 400);
    } else {
      setTimeout(type, deleting ? 60 : 100);
    }
  }
  setTimeout(type, 1200);
}

// ── Counter Animation (home stats) ──
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const step = target / (duration / 16);
  let current = 0;

  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = Math.floor(current) + (el.dataset.suffix || '');
  }, 16);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.stat-number[data-target]').forEach(animateCounter);
      statsObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.hero-stats').forEach(s => statsObserver.observe(s));

// ── Contact Form ──
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const statusEl = document.getElementById('formStatus');
    const successEl = document.getElementById('formSuccess');
    const receivedMetaEl = document.getElementById('receivedMeta');

    if (statusEl) {
      statusEl.textContent = '';
      statusEl.className = 'form-status';
    }

    btn.textContent = 'Sending...';
    btn.disabled = true;

    const payload = {
      name: document.getElementById('name')?.value?.trim() || '',
      email: document.getElementById('email')?.value?.trim() || '',
      subject: document.getElementById('subject')?.value?.trim() || '',
      message: document.getElementById('message')?.value?.trim() || ''
    };

    const apiBase = window.location.port === '5000' ? '' : 'http://127.0.0.1:5000';

    try {
      const res = await fetch(`${apiBase}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || 'Unable to send message right now.');
      }

      if (statusEl) {
        statusEl.textContent = 'Message sent and received.';
        statusEl.classList.add('success');
      }

      contactForm.style.display = 'none';
      if (successEl) successEl.style.display = 'block';

      if (receivedMetaEl) {
        receivedMetaEl.textContent = `Receipt: ${data.ticketId} | Received: ${data.receivedAt}`;
      }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = err.message || 'Message sending failed.';
        statusEl.classList.add('error');
      }
      btn.textContent = 'Try Again';
      btn.disabled = false;
    }
  });

  const sendAnotherBtn = document.getElementById('sendAnotherBtn');
  if (sendAnotherBtn) {
    sendAnotherBtn.addEventListener('click', () => {
      const successEl = document.getElementById('formSuccess');
      const statusEl = document.getElementById('formStatus');
      const submitBtn = contactForm.querySelector('button[type="submit"]');

      contactForm.reset();
      contactForm.style.display = 'block';
      if (successEl) successEl.style.display = 'none';

      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = 'form-status';
      }

      if (submitBtn) {
        submitBtn.textContent = '✉️ Send Message';
        submitBtn.disabled = false;
      }
    });
  }
}

// ── Smooth scroll for anchor links ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});
