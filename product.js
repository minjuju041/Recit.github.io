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

// Added to Cart Popup Logic (Robust Initialization)
const initCartPopup = () => {
  const overlay = document.getElementById('cart-popup-overlay');
  const closeBtn = document.getElementById('cart-popup-close-btn');
  const priceDisplay = document.getElementById('cart-popup-prod-price');

  if (!overlay || !priceDisplay) return;

  const openCartPopup = () => {
    // Get selected quantity
    const activeQtyBtn = document.querySelector('.pd-qty-btn.active');
    const qty = activeQtyBtn ? parseInt(activeQtyBtn.getAttribute('data-qty'), 10) : 1;
    
    // Calculate total price
    const totalPrice = qty * 185;
    priceDisplay.textContent = `$${totalPrice}`;

    // Open popup
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Prevent body scrolling
  };

  const closeCartPopup = () => {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Restore body scrolling
  };

  // Event Delegation for the Buy Button
  document.addEventListener('click', (e) => {
    const buyBtn = e.target.closest('.pd-buy-btn');
    if (buyBtn) {
      e.preventDefault();
      openCartPopup();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeCartPopup);
  }

  // Close when clicking on overlay backdrop
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeCartPopup();
    }
  });

  // Close on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeCartPopup();
    }
  });

  // Premium micro-interactions for the footer buttons inside the modal
  const modalBuyBtn = overlay.querySelector('.btn-buy-now');
  const modalCartBtn = overlay.querySelector('.btn-view-cart');

  if (modalBuyBtn) {
    modalBuyBtn.addEventListener('click', () => {
      alert('Thank you! Redirecting to checkout...');
      closeCartPopup();
    });
  }

  if (modalCartBtn) {
    modalCartBtn.addEventListener('click', () => {
      alert('Opening your shopping cart...');
      closeCartPopup();
    });
  }
};

// Guarantee execution regardless of when the script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCartPopup);
} else {
  initCartPopup();
}

