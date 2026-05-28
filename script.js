document.addEventListener('DOMContentLoaded', () => {
  // --- Page Transition Overlay (blur) ---
  const overlay = document.createElement('div');
  overlay.className = 'page-transition-overlay';
  document.body.appendChild(overlay);

  // Page enter: instantly start blurred, then smoothly unblur
  overlay.classList.add('blurred');
  overlay.style.transition = 'none';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.removeProperty('transition');
      overlay.classList.remove('blurred');
    });
  });

  // Intercept cross-page link clicks: blur out, then navigate
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('mailto:') && href.split('#')[0].endsWith('.html')) {
      link.addEventListener('click', e => {
        e.preventDefault();
        overlay.style.removeProperty('transition');
        overlay.classList.add('blurred');
        setTimeout(() => { window.location.href = href; }, 500);
      });
    }
  });


  // --- Navigation Link Highlighter on Scroll ---
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  let isManualScrolling = false;
  let scrollTimeout;

  const navObserverOptions = {
    root: null,
    rootMargin: '-40% 0px -50% 0px', // Trigger when section occupies the middle of the viewport
    threshold: 0
  };

  const navObserver = new IntersectionObserver((entries) => {
    if (isManualScrolling) return;

    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, navObserverOptions);

  sections.forEach(section => {
    navObserver.observe(section);
  });

  // Lock observer updates during click navigation to prevent intermediate link highlights
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      isManualScrolling = true;
      clearTimeout(scrollTimeout);

      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      scrollTimeout = setTimeout(() => {
        isManualScrolling = false;
      }, 800); // Wait for smooth scroll animation to finish
    });
  });


  // --- Scroll Reveal Animations ---

  const revealObserverOptions = {
    root: null,
    rootMargin: '0px 0px -10% 0px', // Trigger slightly before element enters viewport
    threshold: 0.05
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target); // Animate once
      }
    });
  }, revealObserverOptions);

  // Apply reveal class to sections and visual items
  const revealElements = [
    ...document.querySelectorAll('.intro-col-text'),
    ...document.querySelectorAll('.intro-col-image'),
    ...document.querySelectorAll('.gallery-header'),
    ...document.querySelectorAll('.gallery-item'),
    ...document.querySelectorAll('.process-row'),
    ...document.querySelectorAll('.cta-section'),
    ...document.querySelectorAll('.quote-container')
  ];

  revealElements.forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });
});
