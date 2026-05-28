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
