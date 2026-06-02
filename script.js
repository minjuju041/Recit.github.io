document.addEventListener('DOMContentLoaded', () => {
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


  // ══════════════════════════════════════════════════════════════════
  // LANDING — Canvas destination-out text mask
  //
  // · 배경 영상은 전체 섹션에 깔림
  // · Canvas가 검정으로 덮은 뒤 'Récit' 글자 모양을 destination-out으로 뚫음
  // · 투명해진 글자 영역에서만 영상이 보임 (mix-blend-mode 없음 → 빠름)
  // · 스크롤 휠로 virtualProgress 0→1 증가 시 자간/크기가 캔버스에 반영됨
  // ══════════════════════════════════════════════════════════════════
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

    // ── 캔버스 상태 ────────────────────────────────────────────────
    const BRAND      = 'Récit';
    const FONT_STYLE = 'italic 700';
    const BG         = '#000000';   // 완전한 검정 = 영상 0% 노출
    let   ldW = 0, ldH = 0;
    let   ldBaseFontSize  = 200;    // 뷰포트 너비에 맞게 재계산
    let   resizeTimer;

    // ── Canvas 렌더 ─────────────────────────────────────────────────
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

      // 1) 완전 검정 배경 (영상을 전부 가림)
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, ldW, ldH);

      // 2) 글자 모양을 destination-out으로 뚫음 (그 아래 영상이 보임)
      ctx.globalCompositeOperation = 'destination-out';
      ctx.font         = `${FONT_STYLE} ${fontSize}px 'Bodoni Moda', serif`;
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = 'rgba(255,255,255,1)';

      // letterSpacing 프로퍼티 지원 브라우저 우선, 아니면 수동 배치
      if ('letterSpacing' in ctx) {
        ctx.letterSpacing = `${ldLetterSpacing * fontSize}px`;
        ctx.textAlign = 'center';
        ctx.fillText(BRAND, ldW / 2, ldH / 2);
      } else {
        drawTextWithSpacing(ctx, BRAND, ldW / 2, ldH / 2, fontSize, ldLetterSpacing * fontSize);
      }

      ctx.restore();
    }

    // letterSpacing 미지원 폴백 — 문자 하나씩 직접 배치
    function drawTextWithSpacing(ctx, text, cx, cy, fontSize, spacingPx) {
      ctx.font      = `${FONT_STYLE} ${fontSize}px 'Bodoni Moda', serif`;
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

    // ── 폰트 크기 계산 (뷰포트 너비의 72% 채우기) ───────────────────
    function calcFontSize() {
      if (ldW <= 0) return;
      const probe = document.createElement('canvas').getContext('2d');
      const tp    = 300;
      probe.font  = `${FONT_STYLE} ${tp}px 'Bodoni Moda', serif`;
      const mw    = probe.measureText(BRAND).width;
      if (mw > 0) ldBaseFontSize = tp * (ldW * 0.72) / mw;
    }

    // ── ResizeObserver — 레이아웃 정확한 치수 ──────────────────────
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

    // ── 폰트 로드 후 초기 렌더 ─────────────────────────────────────
    document.fonts.ready.then(() => {
      calcFontSize();
      renderCanvas();
    });

    // 브라우저 스크롤 복원 방지 및 최상단 강제 고정
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { calcFontSize(); renderCanvas(); }, 80);
    });

    // ── 스크롤 애니메이션 ──────────────────────────────────────────
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

      // 자간·스케일 업데이트 → 캔버스 재렌더
      ldLetterSpacing = -0.04 + 0.14 * virtualProgress;  // -0.04em → 0.1em
      ldScale         = 1    + 0.3  * virtualProgress;   // 1 → 1.3
      renderCanvas();

      if (landingScrollHint) {
        landingScrollHint.classList.toggle('hide', virtualProgress > 0.05);
      }

      if (virtualProgress >= 1 && !autoScrollTriggered) {
        autoScrollTriggered = true;
        isTransitioning = true;

        const flash = document.querySelector('.landing-flash');

        // ─────────────────────────────────────────────────────────────
        //  0 ms   화이트 페이드인 (0.7 s)
        //700 ms   화이트 완전히 덮임
        //900 ms   hero 섹션으로 즉시 이동 (보이지 않음)
        //          hero 콘텐츠를 미리 opacity:0 처리 (.wt-entering)
        //1000 ms  nav 다크모드 해제
        //1200 ms  화이트 페이드아웃 시작 (1.4 s)
        //          동시에 hero 콘텐츠 페이드인 (.wt-revealed)
        //2600 ms  화이트 완전히 사라짐 / 워크 섹션 완전 노출
        // ─────────────────────────────────────────────────────────────

        // ① 화이트 페이드인
        if (flash) flash.classList.add('in');

        // ② nav 원복 (흰 화면 뒤에서 미리 실행하여 레이아웃을 sticky 흐름으로 변경)
        setTimeout(() => {
          if (siteHeader) siteHeader.classList.remove('nav--on-dark');
        }, 850);

        // ③ 흰 화면 아래서 hero로 이동 + 콘텐츠 숨김 준비 (sticky 레이아웃 기준 정확한 위치로 스크롤)
        setTimeout(() => {
          heroSection.scrollIntoView({ behavior: 'instant' });
          heroSection.classList.add('wt-entering');
        }, 950);

        // ④ 화이트 페이드아웃 (느리게) + hero 콘텐츠 등장
        setTimeout(() => {
          if (flash) {
            flash.style.transition = 'opacity 1.4s cubic-bezier(0.25, 1, 0.5, 1)';
            flash.classList.remove('in');
          }
          // 화이트가 걷히면서 hero 콘텐츠도 함께 올라옴
          heroSection.classList.add('wt-revealed');
        }, 1200);

        // ⑤ 전환 클래스 정리
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
});
