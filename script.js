document.addEventListener('DOMContentLoaded', () => {
  // --- Custom Ring Cursor ---
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  const cursorInner = document.createElement('div');
  cursorInner.className = 'custom-cursor-inner';
  cursor.appendChild(cursorInner);
  document.body.appendChild(cursor);
  document.body.classList.add('has-custom-cursor');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = window.innerWidth / 2;
  let cursorY = window.innerHeight / 2;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.2;
    cursorY += (mouseY - cursorY) * 0.2;
    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  const updateHoverElements = () => {
    const clickables = document.querySelectorAll('a, button, .pd-immersive-card, input, textarea, select');
    clickables.forEach(el => {
      el.removeEventListener('mouseenter', addHoverState);
      el.removeEventListener('mouseleave', removeHoverState);
      el.addEventListener('mouseenter', addHoverState);
      el.addEventListener('mouseleave', removeHoverState);
    });
  };

  const addHoverState = () => cursor.classList.add('hover');
  const removeHoverState = () => cursor.classList.remove('hover');

  updateHoverElements();
  const hoverObserver = new MutationObserver(updateHoverElements);
  hoverObserver.observe(document.body, { childList: true, subtree: true });

  // --- Outer Scope Variables for Global Navigation & State Sync ---
  const siteHeader = document.querySelector('.site-header');
  const landingContainer = document.querySelector('.landing-container');
  const landingScrollHint = document.querySelector('.landing-scroll');
  const hasLocalHash = window.location.hash && ['#hero', '#narrative', '#about', '#studio', '#contact'].includes(window.location.hash);

  let isLocked = false;
  let virtualProgress = 0;
  let autoScrollTriggered = false;
  let isTransitioning = false;
  let ldLetterSpacing = -0.04;
  let ldScale = 1;
  let renderCanvas = null;

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
      // If the navbar is in dark mode (on the landing page), revert it immediately before scrolling
      if (siteHeader && siteHeader.classList.contains('nav--on-dark')) {
        siteHeader.classList.remove('nav--on-dark');
        isLocked = false;
        virtualProgress = 1;
        autoScrollTriggered = true;
        isTransitioning = false;

        // Render canvas at progress 1 (fully expanded text)
        if (typeof renderCanvas === 'function') {
          ldLetterSpacing = -0.04 + 0.14 * virtualProgress;
          ldScale         = 1    + 0.3  * virtualProgress;
          renderCanvas();
        }
        if (landingScrollHint) {
          landingScrollHint.classList.add('hide');
        }
      }

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
    ...document.querySelectorAll('.narrative-preview'),
    ...document.querySelectorAll('.process-row'),
    ...document.querySelectorAll('.cta-section'),
    ...document.querySelectorAll('.quote-container')
  ];

  revealElements.forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });

  // --- Gallery: dfyint-style Interactive Parallax & Background Typography Scroll ---
  const galleryContainer = document.querySelector('.gallery-scroll-container');
  const projectCards     = document.querySelectorAll('.gallery-project-card');
  const bgTextWrappers   = document.querySelectorAll('.gallery-bg-text-wrapper');

  function updateGalleryParallax() {
    if (!galleryContainer) return;

    const rect = galleryContainer.getBoundingClientRect();
    const viewH = window.innerHeight;
    const containerH = galleryContainer.offsetHeight;

    // 1. Calculate overall scroll progress of the gallery section
    // Starts when container top enters viewport (rect.top <= viewH)
    // Ends when container bottom leaves viewport (rect.bottom <= 0)
    const startOffset = viewH;
    const totalScrollRange = containerH + viewH;
    const scrolled = startOffset - rect.top;
    const progress = Math.min(1, Math.max(0, scrolled / totalScrollRange)); // 0 ??1

    // 2. Translate bg rows horizontally based on progress
    bgTextWrappers.forEach(wrapper => {
      const row1 = wrapper.querySelector('.bg-row-1');
      const row2 = wrapper.querySelector('.bg-row-2');
      if (row1) {
        // Slide Row 1 left
        const shiftX1 = 5 - progress * 40;
        row1.style.transform = `translateX(${shiftX1}vw)`;
      }
      if (row2) {
        // Slide Row 2 right
        const shiftX2 = -35 + progress * 40;
        row2.style.transform = `translateX(${shiftX2}vw)`;
      }
    });

    // 3. Determine the active project based on card center distance from viewport center
    let activeIndex = 0;
    let minDistance = Infinity;
    const viewportCenter = viewH / 2;

    projectCards.forEach((card, index) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.top + cardRect.height / 2;
      const distance = Math.abs(cardCenter - viewportCenter);

      if (distance < minDistance) {
        minDistance = distance;
        activeIndex = index;
      }

      // 4. Parallax effect inside individual card image wrapper
      // 0 when card top enters viewport, 1 when card bottom leaves
      const cardVisibleProgress = (viewH - cardRect.top) / (viewH + cardRect.height);
      const clampedCardProgress = Math.min(1, Math.max(0, cardVisibleProgress));
      
      const img = card.querySelector('.card-img-wrap img');
      if (img) {
        // Move image inside its wrap (top is styled at -10%, we translate from -10% to 10%)
        const yOffset = -8 + clampedCardProgress * 16; 
        img.style.transform = `translateY(${yOffset}%)`;
      }
    });

    // 5. Update active class on text wrappers to trigger fade transitions
    bgTextWrappers.forEach((wrapper, index) => {
      if (index === activeIndex) {
        wrapper.classList.add('active');
      } else {
        wrapper.classList.remove('active');
      }
    });
  }

  if (galleryContainer) {
    window.addEventListener('scroll', updateGalleryParallax, { passive: true });
    window.addEventListener('resize', updateGalleryParallax, { passive: true });
    updateGalleryParallax();
  }


  // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
  // LANDING ??Canvas destination-out text mask
  //
  // · 諛곌꼍 ?곸긽? ?꾩껜 ?뱀뀡??源붾┝
  // · Canvas媛 寃?뺤쑝濡???? ??'Récit' 湲??紐⑥뼇??destination-out?쇰줈 ?レ쓬
  // · ?щ챸?댁쭊 湲???곸뿭?먯꽌留??곸긽??蹂댁엫 (mix-blend-mode ?놁쓬 ??鍮좊쫫)
  // · ?ㅽ겕濡??좊줈 virtualProgress 0?? 利앷? ???먭컙/?ш린媛 罹붾쾭?ㅼ뿉 諛섏쁺??
  // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
  const landingSection    = document.querySelector('.landing-section');
  const landingCanvas     = document.querySelector('.logo-canvas');
  const heroSection       = document.querySelector('#hero');
  if (siteHeader && landingContainer && !hasLocalHash) {
    siteHeader.classList.add('nav--on-dark');
  }

  if (landingContainer && landingCanvas && heroSection) {
    if (hasLocalHash) {
      isLocked = false;
      virtualProgress = 1;
      autoScrollTriggered = true;
      ldLetterSpacing = 0.1;
      ldScale = 1.3;
      if (landingScrollHint) {
        landingScrollHint.classList.add('hide');
      }
    } else {
      isLocked = true;
    }

    // ?? 罹붾쾭???곹깭 ????????????????????????????????????????????????
    const BRAND      = 'Récit';
    const FONT_STYLE = 'italic 700';
    const BG         = '#000000';   // ?꾩쟾??寃??= ?곸긽 0% ?몄텧
    let   ldW = 0, ldH = 0;
    let   ldBaseFontSize  = 200;    // 酉고룷???덈퉬??留욊쾶 ?ш퀎??
    let   resizeTimer;

    // ?? Canvas ?뚮뜑 ?????????????????????????????????????????????????
    renderCanvas = function() {
      if (!landingCanvas || ldW <= 0 || ldH <= 0) return;

      const dpr  = window.devicePixelRatio || 1;
      const tw   = Math.round(ldW * dpr);
      const th   = Math.round(ldH * dpr);

      if (landingCanvas.width !== tw || landingCanvas.height !== th) {
        landingCanvas.width  = tw;
        landingCanvas.height = th;
      }

      const ctx  = landingCanvas.getContext('2d');
      const fontSize = ldBaseFontSize * ldScale;

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1) ?꾩쟾 寃??諛곌꼍 (?곸긽???꾨? 媛由?
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, ldW, ldH);

      // 2) 湲??紐⑥뼇??destination-out?쇰줈 ?レ쓬 (洹??꾨옒 ?곸긽??蹂댁엫)
      ctx.globalCompositeOperation = 'destination-out';
      ctx.font         = `${FONT_STYLE} ${fontSize}px 'Cormorant Garamond', serif`;
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = 'rgba(255,255,255,1)';

      // letterSpacing ?꾨줈?쇳떚 吏??釉뚮씪?곗? ?곗꽑, ?꾨땲硫??섎룞 諛곗튂
      if ('letterSpacing' in ctx) {
        ctx.letterSpacing = `${ldLetterSpacing * fontSize}px`;
        ctx.textAlign = 'center';
        ctx.fillText(BRAND, ldW / 2, ldH / 2);
      } else {
        drawTextWithSpacing(ctx, BRAND, ldW / 2, ldH / 2, fontSize, ldLetterSpacing * fontSize);
      }

      ctx.restore();
    }

    // letterSpacing 誘몄????대갚 ??臾몄옄 ?섎굹??吏곸젒 諛곗튂
    function drawTextWithSpacing(ctx, text, cx, cy, fontSize, spacingPx) {
      ctx.font      = `${FONT_STYLE} ${fontSize}px 'Cormorant Garamond', serif`;
      ctx.textAlign = 'left';
      const chars   = Array.from(text);
      const widths  = chars.map(c => ctx.measureText(c).width);
      const total   = widths.reduce((a, b) => a + b, 0) + spacingPx * (chars.length - 1);
      let   x       = cx - total / 2;
      chars.forEach((ch, i) => {
        ctx.fillText(ch, x, cy);
        x += widths[i] + spacingPx;
      });
    }

    // ?? ?고듃 ?ш린 怨꾩궛 (酉고룷???덈퉬??72% 梨꾩슦湲? ???????????????????
    function calcFontSize() {
      if (ldW <= 0) return;
      const probe = document.createElement('canvas').getContext('2d');
      const tp    = 300;
      probe.font  = `${FONT_STYLE} ${tp}px 'Cormorant Garamond', serif`;
      const mw    = probe.measureText(BRAND).width;
      if (mw > 0) ldBaseFontSize = tp * (ldW * 0.72) / mw;
    }

    // ?? ResizeObserver ???덉씠?꾩썐 ?뺥솗??移섏닔 ??????????????????????
    if (window.ResizeObserver) {
      new ResizeObserver(entries => {
        for (const e of entries) {
          const { width, height } = e.contentRect;
          if (width > 0 && height > 0) {
            ldW = width; ldH = height;
            calcFontSize();
            renderCanvas();
          }
        }
      }).observe(landingSection);
    }

    // ?? ?고듃 濡쒕뱶 ??珥덇린 ?뚮뜑 ?????????????????????????????????????
    document.fonts.ready.then(() => {
      calcFontSize();
      renderCanvas();
    });

    // 釉뚮씪?곗? ?ㅽ겕濡?蹂듭썝 諛⑹? 諛?理쒖긽??媛뺤젣 怨좎젙
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { calcFontSize(); renderCanvas(); }, 80);
    });

    // ?? ?ㅽ겕濡??좊땲硫붿씠????????????????????????????????????????????
    window.addEventListener('scroll', () => {
      if (window.scrollY === 0) {
        virtualProgress = 0; isLocked = true; autoScrollTriggered = false; isTransitioning = false;
        ldLetterSpacing = -0.04; ldScale = 1;
        renderCanvas();
        if (landingScrollHint) landingScrollHint.classList.remove('hide');
      }
      
      if (siteHeader && !autoScrollTriggered) {
        siteHeader.classList.toggle('nav--on-dark', window.scrollY < 50);
      } else if (siteHeader && window.scrollY === 0) {
        // Force it on if we're at the very top, even if it was an auto-scroll
        siteHeader.classList.add('nav--on-dark');
      }
    });

    const handleWheel = (e) => {
      if (isTransitioning) {
        if (e.cancelable) e.preventDefault();
        return;
      }
      if (window.scrollY > 50) { isLocked = false; return; }
      if (!isLocked) return;

      if (e.cancelable) e.preventDefault();

      let delta = 0;
      if (e.type === 'wheel') {
        delta = e.deltaY * 0.002;
      } else if (e.type === 'touchmove' && e.touches.length > 0) {
        if (window._lTY == null) window._lTY = e.touches[0].clientY;
        delta = (window._lTY - e.touches[0].clientY) * 0.01;
        window._lTY = e.touches[0].clientY;
      }

      virtualProgress = Math.max(0, Math.min(virtualProgress + delta, 1));

      // ?먭컙·?ㅼ????낅뜲?댄듃 ??罹붾쾭???щ젋??
      ldLetterSpacing = -0.04 + 0.14 * virtualProgress;  // -0.04em ??0.1em
      ldScale         = 1    + 0.3  * virtualProgress;   // 1 ??1.3
      renderCanvas();

      if (landingScrollHint) {
        landingScrollHint.classList.toggle('hide', virtualProgress > 0.05);
      }

      if (virtualProgress >= 1 && !autoScrollTriggered) {
        autoScrollTriggered = true;
        isTransitioning = true;

        const flash = document.querySelector('.landing-flash');

        // ?????????????????????????????????????????????????????????????
        //  0 ms   ?붿씠???섏씠?쒖씤 (0.7 s)
        //700 ms   ?붿씠???꾩쟾????엫
        //900 ms   hero ?뱀뀡?쇰줈 利됱떆 ?대룞 (蹂댁씠吏 ?딆쓬)
        //          hero 肄섑뀗痢좊? 誘몃━ opacity:0 泥섎━ (.wt-entering)
        //1000 ms  nav ?ㅽ겕紐⑤뱶 ?댁젣
        //1200 ms  ?붿씠???섏씠?쒖븘???쒖옉 (1.4 s)
        //          ?숈떆??hero 肄섑뀗痢??섏씠?쒖씤 (.wt-revealed)
        //2600 ms  ?붿씠???꾩쟾???щ씪吏?/ ?뚰겕 ?뱀뀡 ?꾩쟾 ?몄텧
        // ?????????????????????????????????????????????????????????????

        // ???붿씠???섏씠?쒖씤
        if (flash) flash.classList.add('in');

        // ??nav ?먮났 (???붾㈃ ?ㅼ뿉??誘몃━ ?ㅽ뻾?섏뿬 ?덉씠?꾩썐??sticky ?먮쫫?쇰줈 蹂寃?
        setTimeout(() => {
          if (siteHeader) siteHeader.classList.remove('nav--on-dark');
        }, 850);

        // ?????붾㈃ ?꾨옒??hero濡??대룞 + 肄섑뀗痢??④? 以鍮?(sticky ?덉씠?꾩썐 湲곗? ?뺥솗???꾩튂濡??ㅽ겕濡?
        setTimeout(() => {
          heroSection.scrollIntoView({ behavior: 'instant' });
          heroSection.classList.add('wt-entering');
        }, 950);

        // ???붿씠???섏씠?쒖븘??(?먮━寃? + hero 肄섑뀗痢??깆옣
        setTimeout(() => {
          if (flash) {
            flash.style.transition = 'opacity 1.4s cubic-bezier(0.25, 1, 0.5, 1)';
            flash.classList.remove('in');
          }
          // ?붿씠?멸? 嫄룻엳硫댁꽌 hero 肄섑뀗痢좊룄 ?④퍡 ?щ씪??
          heroSection.classList.add('wt-revealed');
        }, 1200);

        // ???꾪솚 ?대옒???뺣━
        setTimeout(() => {
          heroSection.classList.remove('wt-entering', 'wt-revealed');
          if (flash) flash.style.transition = '';
          isTransitioning = false;
          isLocked = false;
          autoScrollTriggered = false; // Add this line so normal scroll works again
        }, 3000);
      }
    };

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) window._lTY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('wheel',     handleWheel, { passive: false });
    window.addEventListener('touchmove', handleWheel, { passive: false });
  }

  // --- Typewriter Effect for CTA ---
  const ctaHeading = document.querySelector('.cta-heading');
  if (ctaHeading) {
    const text = ctaHeading.textContent;
    ctaHeading.textContent = '';
    const chars = Array.from(text).map(char => {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.opacity = '0';
      if (char === ' ') span.style.whiteSpace = 'pre';
      ctaHeading.appendChild(span);
      return span;
    });

    const typeWriterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          typeWriterObserver.unobserve(entry.target);
          chars.forEach((span, index) => {
            setTimeout(() => {
              span.style.opacity = '1';
            }, index * 70);
          });
        }
      });
    }, { threshold: 0.5 });
    
    typeWriterObserver.observe(ctaHeading);
  }

  // --- Play/Pause Videos on Intersection ---
  const videoObserverOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) {
        // narrative-preview-video: active??寃껊쭔 ?ъ깮
        if (video.classList.contains('narrative-preview-video')) {
          if (video.classList.contains('active')) {
            video.play().catch(() => {});
          }
        } else {
          video.play().catch(() => {});
        }
      } else {
        video.pause();
      }
    });
  }, videoObserverOptions);

  document.querySelectorAll('video').forEach(video => {
    videoObserver.observe(video);
  });

  // --- Narrative Video Slideshow (5珥덈쭏???ㅼ쓬 ?곸긽?쇰줈 ?щ줈?ㅽ럹?대뱶) ---
  const narrativeVideos = document.querySelectorAll('.narrative-preview-video');
  if (narrativeVideos.length > 0) {
    let currentNarrativeIdx = 0;
    let narrativeTimer = null;

    function switchNarrativeVideo() {
      const current = narrativeVideos[currentNarrativeIdx];
      const nextIdx = (currentNarrativeIdx + 1) % narrativeVideos.length;
      const next    = narrativeVideos[nextIdx];

      // ?ㅼ쓬 ?곸긽 以鍮?& ?ъ깮
      next.currentTime = 0;
      next.play().catch(() => {});

      // 利됱떆 ?꾪솚 (?몃옖吏???놁쓬)
      next.classList.add('active');
      current.classList.remove('active');
      current.pause();

      currentNarrativeIdx = nextIdx;
    }

    function startNarrativeSlideshow() {
      if (narrativeTimer) return;
      narrativeTimer = setInterval(switchNarrativeVideo, 5000);
    }

    function stopNarrativeSlideshow() {
      clearInterval(narrativeTimer);
      narrativeTimer = null;
    }

    // ?뱀뀡 媛?쒖꽦???곕씪 ??대㉧ ?쒖옉/?뺤?
    const narrativeWrapper = document.querySelector('.narrative-video-wrapper');
    if (narrativeWrapper) {
      const slideshowObserver = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            startNarrativeSlideshow();
          } else {
            stopNarrativeSlideshow();
          }
        });
      }, { threshold: 0.1 });
      slideshowObserver.observe(narrativeWrapper);
    }
  }


});
