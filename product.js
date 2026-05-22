// Product page interactions
document.addEventListener('DOMContentLoaded', () => {

  // Quantity selector
  const qtyBtns = document.querySelectorAll('.pd-qty-btn');
  qtyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      qtyBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Reveal animations for product sections
  const styleSheet = document.createElement('style');
  styleSheet.innerText = `
    .pd-reveal {
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 1s cubic-bezier(0.25, 1, 0.5, 1), transform 1s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .pd-reveal.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .pd-reveal-delay-1 { transition-delay: 0.15s; }
    .pd-reveal-delay-2 { transition-delay: 0.3s; }
    .pd-reveal-delay-3 { transition-delay: 0.45s; }
  `;
  document.head.appendChild(styleSheet);

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

  const revealTargets = [
    ...document.querySelectorAll('.pd-narrative-inner'),
    ...document.querySelectorAll('.pd-step'),
    ...document.querySelectorAll('.pd-instrument'),
    ...document.querySelectorAll('.pd-immersive-card'),
    ...document.querySelectorAll('.pd-buy-heading'),
    ...document.querySelectorAll('.pd-buy-grid'),
  ];

  revealTargets.forEach((el, i) => {
    el.classList.add('pd-reveal');
    revealObs.observe(el);
  });
});
