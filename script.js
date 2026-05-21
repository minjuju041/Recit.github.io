document.addEventListener('DOMContentLoaded', () => {
  // --- Navigation Link Highlighter on Scroll ---
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const navObserverOptions = {
    root: null,
    rootMargin: '-40% 0px -50% 0px', // Trigger when section occupies the middle of the viewport
    threshold: 0
  };

  const navObserver = new IntersectionObserver((entries) => {
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


  // --- Scroll Reveal Animations ---
  // Create styles for reveal animation dynamically or use stylesheet rules
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    .reveal {
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 1s cubic-bezier(0.25, 1, 0.5, 1), transform 1s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .reveal.visible {
      opacity: 1;
      transform: translateY(0);
    }
    /* Delay children animations for custom visual staggering */
    .reveal-delay-1 { transition-delay: 0.15s; }
    .reveal-delay-2 { transition-delay: 0.3s; }
    .reveal-delay-3 { transition-delay: 0.45s; }
  `;
  document.head.appendChild(styleSheet);

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
