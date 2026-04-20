/* ============================================================
   CML SHARED MODULE — Central Maryland Lax
   Included on every page. Pure vanilla JS, no dependencies.
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. PAGE TRANSITION OVERLAY
     #page-overlay starts at opacity:1, fades to 0 on load.
     On internal link click: fade back to 1, then navigate.
  ---------------------------------------------------------- */
  const overlay = document.getElementById('page-overlay');

  if (overlay) {
    // Fade out immediately — script is at end of body so DOM is ready.
    // Double rAF ensures the browser has painted the overlay before removing it.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add('fade-out');
      });
    });

    // Intercept internal link clicks
    document.addEventListener('click', function (e) {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Skip: mailto, tel, hash-only, hash-with-path on same page, target=_blank, external
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      const linkPage    = href.split('#')[0] || currentPage;
      const hasHash     = href.includes('#');
      if (
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        (hasHash && linkPage === currentPage) ||
        link.getAttribute('target') === '_blank' ||
        href.startsWith('http://') ||
        href.startsWith('https://')
      ) return;

      e.preventDefault();
      overlay.classList.remove('fade-out');

      setTimeout(function () {
        window.location.href = href;
      }, 380);
    });
  }

  /* ----------------------------------------------------------
     2. NAV SCROLL BEHAVIOR
     On homepage (body.is-homepage): starts transparent, gets
     'scrolled' class after 60px. All other pages: always scrolled.
  ---------------------------------------------------------- */
  const nav = document.getElementById('cml-nav');
  const isHomepage = document.body.classList.contains('is-homepage');

  if (nav) {
    if (!isHomepage) {
      nav.classList.add('scrolled');
    }

    window.addEventListener('scroll', function () {
      if (isHomepage) {
        nav.classList.toggle('scrolled', window.scrollY > 60);
      }
      // Non-homepage always stays scrolled; no change needed
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     3. MOBILE HAMBURGER
  ---------------------------------------------------------- */
  const hamburger = document.getElementById('nav-hamburger');
  const navMenu = document.getElementById('nav-menu');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('open');
      navMenu.classList.toggle('open');
    });

    // Mobile dropdown: tap trigger button to toggle panel
    const dropdownTrigger = navMenu.querySelector('.nav-dropdown-trigger');
    const dropdownPanel   = navMenu.querySelector('.nav-dropdown-panel');
    if (dropdownTrigger && dropdownPanel) {
      dropdownTrigger.addEventListener('click', function () {
        if (window.innerWidth <= 960) {
          const isOpen = dropdownPanel.classList.toggle('mobile-open');
          dropdownTrigger.setAttribute('aria-expanded', String(isOpen));
        }
      });
      // Desktop hover opens/closes via CSS; mirror the state into aria-expanded.
      const dropdownLi = dropdownTrigger.closest('.nav-dropdown');
      if (dropdownLi) {
        dropdownLi.addEventListener('mouseenter', function () {
          if (window.innerWidth > 960) dropdownTrigger.setAttribute('aria-expanded', 'true');
        });
        dropdownLi.addEventListener('mouseleave', function () {
          if (window.innerWidth > 960) dropdownTrigger.setAttribute('aria-expanded', 'false');
        });
        dropdownLi.addEventListener('focusin', function () {
          dropdownTrigger.setAttribute('aria-expanded', 'true');
        });
        dropdownLi.addEventListener('focusout', function (e) {
          if (!dropdownLi.contains(e.relatedTarget)) {
            dropdownTrigger.setAttribute('aria-expanded', 'false');
          }
        });
      }
    }

    // Close on any nav link click
    navMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('open');
        navMenu.classList.remove('open');
        if (dropdownPanel) dropdownPanel.classList.remove('mobile-open');
        if (dropdownTrigger) dropdownTrigger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ----------------------------------------------------------
     4. NAV INK UNDERLINE
     Desktop only (>960px). Tracks active link, animates to
     hovered link, returns to active on mouseleave.
  ---------------------------------------------------------- */
  (function initNavInk() {
    if (!nav) return;

    const ink = document.querySelector('.nav-ink');
    if (!ink) return;

    function positionInkUnder(el) {
      if (window.innerWidth <= 960) {
        ink.style.opacity = '0';
        return;
      }
      const navRect = nav.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      ink.style.left = (elRect.left - navRect.left) + 'px';
      ink.style.width = elRect.width + 'px';
      ink.style.opacity = '1';
    }

    function getActiveLink() {
      // Check direct <a> links and dropdown trigger buttons
      return nav.querySelector('.nav-menu > li > a.active') ||
             nav.querySelector('.nav-menu > li > button.active');
    }

    function resetInkToActive() {
      if (window.innerWidth <= 960) {
        ink.style.opacity = '0';
        return;
      }
      const active = getActiveLink();
      if (active) {
        positionInkUnder(active);
      } else {
        ink.style.opacity = '0';
      }
    }

    // Set ink on load
    window.addEventListener('load', resetInkToActive);

    // Hover over top-level nav items
    const topLevelItems = nav.querySelectorAll('.nav-menu > li > a, .nav-menu > li > button');
    topLevelItems.forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        if (window.innerWidth <= 960) return;
        positionInkUnder(el);
      });
    });

    // Mouse leaves the nav menu area — return to active
    const navMenuEl = nav.querySelector('.nav-menu');
    if (navMenuEl) {
      navMenuEl.addEventListener('mouseleave', resetInkToActive);
    }

    // Recalculate on resize
    window.addEventListener('resize', resetInkToActive);
  })();

  /* ----------------------------------------------------------
     5. SCROLL REVEAL
     IntersectionObserver on .reveal, .reveal-l, .reveal-r
  ---------------------------------------------------------- */
  (function initReveal() {
    const revealEls = document.querySelectorAll('.reveal, .reveal-l, .reveal-r');
    if (!revealEls.length) return;

    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  })();

  /* ----------------------------------------------------------
     6. COUNTER ANIMATION
     [data-target] elements count from 0 to target over 1800ms.
     Uses ease-out-quartic easing. Appends data-suffix if present.
     Sets data-counted to prevent repeat triggers.
  ---------------------------------------------------------- */
  (function initCounters() {
    const counterEls = document.querySelectorAll('[data-target]');
    if (!counterEls.length) return;

    function easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function animateCounter(el) {
      if (el.dataset.counted) return;
      el.dataset.counted = 'true';

      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1800;
      const startTime = performance.now();

      function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutQuart(progress);
        const current = Math.round(eased * target);
        el.textContent = current + suffix;

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = target + suffix;
        }
      }

      requestAnimationFrame(tick);
    }

    const counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.3
    });

    counterEls.forEach(function (el) {
      counterObserver.observe(el);
    });
  })();

  /* ----------------------------------------------------------
     7. HERO WORD-DROP ANIMATION
     Splits .hero-headline by <br> into lines, each line by
     spaces into words, wraps each in .word-wrap > .word with
     staggered animation-delay.
  ---------------------------------------------------------- */
  (function initWordDrop() {
    const headline = document.querySelector('.hero-headline');
    if (!headline) return;

    // Split raw innerHTML on <br> tags (case-insensitive)
    const rawHTML = headline.innerHTML;
    const lines = rawHTML.split(/<br\s*\/?>/i);

    let delay = 0.05;
    const lineHTMLParts = [];

    lines.forEach(function (line, lineIndex) {
      const trimmed = line.trim();
      if (!trimmed) {
        lineHTMLParts.push('');
        return;
      }

      // Split by spaces, filter empty strings
      const words = trimmed.split(/\s+/).filter(Boolean);
      const wordSpans = words.map(function (word) {
        const span = `<span class="word-wrap"><span class="word" style="animation-delay:${delay.toFixed(2)}s">${word}</span></span>`;
        delay += 0.1;
        return span;
      });

      lineHTMLParts.push(wordSpans.join(' '));
    });

    headline.innerHTML = lineHTMLParts.join('<br>');
    // Override opacity since JS animation handles it
    headline.style.opacity = '1';
    headline.style.animation = 'none';
    headline.style.transform = 'none';
  })();

  /* ----------------------------------------------------------
     8. HERO PARALLAX
     Moves .hero-parallax-inner on scroll for depth effect.
  ---------------------------------------------------------- */
  (function initParallax() {
    const heroBgInner = document.querySelector('.hero-parallax-inner');
    if (!heroBgInner) return;

    window.addEventListener('scroll', function () {
      heroBgInner.style.transform = 'translateY(' + (window.scrollY * 0.35) + 'px) scale(1.08)';
    }, { passive: true });
  })();

  /* ----------------------------------------------------------
     9. QUOTE CURTAIN REVEAL
     IntersectionObserver on .quote-curtain, adds 'in-view'.
  ---------------------------------------------------------- */
  (function initQuoteCurtain() {
    const curtains = document.querySelectorAll('.quote-curtain');
    if (!curtains.length) return;

    const curtainObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          curtainObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.3
    });

    curtains.forEach(function (el) {
      curtainObserver.observe(el);
    });
  })();

  /* ----------------------------------------------------------
     10. DRAW-LINE DIVIDERS
     Already handled by scroll reveal observer (class .reveal
     on .draw-line elements). The CSS transition handles the
     width animation when .in-view is added.
  ---------------------------------------------------------- */

  /* ----------------------------------------------------------
     11. PILLAR SVG DRAW
     IntersectionObserver on .pillar-svg-wrap. When visible,
     adds class 'drawn' to the parent .pillar element.
  ---------------------------------------------------------- */
  (function initPillarSVG() {
    const svgWraps = document.querySelectorAll('.pillar-svg-wrap');
    if (!svgWraps.length) return;

    const svgObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const pillar = entry.target.closest('.pillar');
          if (pillar) {
            pillar.classList.add('drawn');
          }
          svgObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2
    });

    svgWraps.forEach(function (el) {
      svgObserver.observe(el);
    });
  })();

})();
