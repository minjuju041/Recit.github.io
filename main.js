document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const observerOptions = {
    root: null,
    rootMargin: '-50% 0px -50% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => link.classList.remove('active'));
        
        const currentId = entry.target.getAttribute('id');
        const activeLink = document.querySelector(`.nav-links a[href="#${currentId}"]`);
        
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    });
  }, observerOptions);

  sections.forEach(section => {
    observer.observe(section);
  });
});
