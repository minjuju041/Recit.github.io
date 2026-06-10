document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.ct-form');
  const popupOverlay = document.getElementById('success-popup');
  const popupCloseBtn = document.getElementById('success-close');

  if (form && popupOverlay && popupCloseBtn) {
    form.addEventListener('submit', (e) => {
      e.preventDefault(); // Prevent actual form submission (page reload)

      // Show the success popup
      popupOverlay.classList.add('active');
    });

    // Close the popup when clicking the close button
    popupCloseBtn.addEventListener('click', () => {
      popupOverlay.classList.remove('active');
      form.reset(); // Clear the form fields after successful submission
    });

    // Close the popup when clicking outside of it
    popupOverlay.addEventListener('click', (e) => {
      if (e.target === popupOverlay) {
        popupOverlay.classList.remove('active');
        form.reset();
      }
    });
  }
});
