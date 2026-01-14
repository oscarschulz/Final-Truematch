// Landing page behaviour for TrueMatch

(function () {
  
  // --------------------------------------------------------
  // [FIX] Restore Scroll Position
  // Ensures browser remembers scroll position on reload
  // --------------------------------------------------------
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'auto';
  }

  // ------------------------
  // Helpers
  // ------------------------
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  // ------------------------
  // Smooth scroll for header/footer nav
  // ------------------------
  function initSmoothAnchors() {
    qsa('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const hash = a.getAttribute("href");
        if (!hash || hash === "#") return;
        const target = document.querySelector(hash);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  // ------------------------
  // Get Started / plan buttons → auth.html (signup)
  // ------------------------
  function buildQuery(params) {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") usp.set(k, String(v));
    });
    return usp.toString();
  }

  function initGetStartedRouting() {
    const btn = document.getElementById('btnGetStarted');
    if (!btn) return;

    btn.addEventListener('click', () => {
      // Optional loader while redirecting to sign-up
      try {
        if (window.TMLoader && typeof window.TMLoader.show === 'function') {
          window.TMLoader.show(
            'Setting things up…',
            'Redirecting you to sign‑up',
            'This only takes a moment.'
          );
        }
      } catch (e) {
        console.warn('[TM] loader error', e);
      }

      const params = new URLSearchParams();
      params.set('mode', 'signup');
      params.set('onboarding', '1');

      setTimeout(() => {
        window.location.href = `auth.html?${params.toString()}#signup`;
      }, 120);
    });
  }

  // Pricing cards logic
  qsa("a[data-plan]:not([data-action])").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const prePlan = btn.getAttribute("data-plan") || "";
      const qs = buildQuery({
        mode: "signup",
        onboarding: 1,
        prePlan: prePlan || undefined,
      });
      window.location.href = "/auth.html" + (qs ? "?" + qs : "");
    });
  });

  // ------------------------
  // Mobile nav dropdown (hamburger)
  // ------------------------
  function initNavDropdown() {
    const toggle = qs(".nav__toggle");
    const dropdown = qs("#navDropdown");
    const backdrop = qs(".nav__backdrop");
    
    // Safety check
    if (!toggle || !dropdown && !qs(".nav__dropdown")) return;
    const menu = dropdown || qs(".nav__dropdown");

    const open = () => {
      menu.style.display = "flex"; // Changed from block to flex for sidebar
      setTimeout(() => menu.classList.add("is-open"), 10);
      if (backdrop) backdrop.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    };
    const close = () => {
      menu.classList.remove("is-open");
      // Wait for animation to finish before hiding
      setTimeout(() => { 
        if(!menu.classList.contains("is-open")) menu.style.display = "none"; 
      }, 400);
      
      if (backdrop) backdrop.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    const isOpen = () => menu.classList.contains("is-open") || menu.style.display === "flex";

    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); 
      isOpen() ? close() : open();
    });

    // ADDED: Close button Logic
    const closeBtn = menu.querySelector(".nav__close");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        close();
      });
    }

    if (backdrop) {
      backdrop.addEventListener("click", close);
    }

    menu.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (link) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) close();
    });

    document.addEventListener(
      "click",
      (e) => {
        if (!isOpen()) return;
        const inside =
          e.target.closest(".nav__dropdown") || e.target.closest("#navDropdown") || e.target.closest(".nav__toggle");
        if (!inside) close();
      },
      true
    );
  }

  // ------------------------
  // Snap carousels
  // ------------------------
  function initSnapCarousel(root) {
    const cards = qsa(".snap-card", root);
    if (!cards.length) return;

    root.style.display = root.style.display || "flex";
    root.style.overflowX = root.style.overflowX || "auto";
    root.style.scrollSnapType = "none"; // manual snapping
    root.style.scrollBehavior = "auto";

    cards.forEach((card) => {
      if (!card.style.flex) card.style.flex = "0 0 100%";
    });

    let dots = [];
    const dotsId = root.getAttribute("data-dots");
    if (dotsId) {
      const dotsRoot = document.getElementById(dotsId);
      if (dotsRoot) {
        dotsRoot.innerHTML = "";
        dots = cards.map((_card, index) => {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.className = "dot";
          dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
          dotsRoot.appendChild(dot);
          dot.addEventListener("click", (e) => {
            e.preventDefault();
            scrollToIndex(index);
          });
          return dot;
        });
      }
    }

    function scrollToIndex(index) {
      const card = cards[index];
      if (!card) return;
      const left = card.offsetLeft - root.offsetLeft;
      root.scrollTo({ left, behavior: "smooth" });
    }

    function nearestIndex() {
      const viewport = root.getBoundingClientRect();
      let best = 0;
      let bestScore = -Infinity;
      cards.forEach((card, idx) => {
        const r = card.getBoundingClientRect();
        const visible =
          Math.min(r.right, viewport.right) - Math.max(r.left, viewport.left);
        const score = visible / viewport.width;
        if (score > bestScore) {
          bestScore = score;
          best = idx;
        }
      });
      return best;
    }

    function updateDots() {
      if (!dots.length) return;
      const idx = nearestIndex();
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === idx);
      });
    }

    let ticking = false;
    root.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateDots();
        ticking = false;
      });
    });
    updateDots();

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startScrollLeft = 0;
    let lockedAxis = null;
    const DRAG_THRESHOLD = 5;

    function getPoint(ev) {
      if (ev.touches && ev.touches[0]) {
        return { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
      }
      return { x: ev.clientX, y: ev.clientY };
    }

    function onDown(ev) {
      if (ev.button !== undefined && ev.button !== 0) return;
      const pt = getPoint(ev);
      isDragging = true;
      lockedAxis = null;
      startX = pt.x;
      startY = pt.y;
      startScrollLeft = root.scrollLeft;
      root.classList.add("is-dragging");
    }

    function onMove(ev) {
      if (!isDragging) return;
      const pt = getPoint(ev);
      const dx = pt.x - startX;
      const dy = pt.y - startY;

      if (!lockedAxis) {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) {
          return; 
        }
        lockedAxis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }

      if (lockedAxis === "x") {
        if (ev.cancelable) ev.preventDefault();
        root.scrollLeft = startScrollLeft - dx;
      } else {
        isDragging = false;
        root.classList.remove("is-dragging");
      }
    }

    function onUp() {
      if (!isDragging) return;
      isDragging = false;
      root.classList.remove("is-dragging");
      const idx = nearestIndex();
      scrollToIndex(idx); 
    }

    if (window.PointerEvent) {
      root.addEventListener("pointerdown", onDown);
      root.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    } else {
      root.addEventListener("mousedown", onDown);
      root.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      root.addEventListener("touchstart", onDown, { passive: true });
      root.addEventListener("touchmove", onMove, { passive: false });
      window.addEventListener("touchend", onUp);
      window.addEventListener("touchcancel", onUp);
    }

    root.addEventListener(
      "wheel",
      (e) => {
        const absX = Math.abs(e.deltaX);
        const absY = Math.abs(e.deltaY);
        if (absY >= absX) {
          return;
        }
        root.scrollLeft += e.deltaX || e.deltaY;
        if (e.cancelable) e.preventDefault();
      },
      { passive: false }
    );
  }

  function initCarousels() {
    qsa(".snap-carousel").forEach(initSnapCarousel);
  }

  // ------------------------
  // FAQ accordion
  // ------------------------
  function initFaqAccordion() {
    const items = qsa("#faq details");
    if (!items.length) return;

    items.forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) return;
        items.forEach((other) => {
          if (other !== item && other.open) other.open = false;
        });
      });
    });
  }

  // ------------------------
  // Footer year
  // ------------------------
  function initFooterYear() {
    const el = qs("#year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  // ------------------------
  // [NEW] Reversible & Directional Scroll Animation
  // ------------------------
  function initScrollReveal() {
    // Only on desktop to avoid weird scroll jumps on mobile
    if (window.innerWidth < 991) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15 // 15% visibility triggers animation
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add visible class -> Animate IN
          entry.target.classList.add('is-visible');
        } else {
          // Remove visible class -> Animate OUT (Reversible)
          entry.target.classList.remove('is-visible');
        }
      });
    }, observerOptions);

    // Target the PARENT TRIGGERs and direct elements
    const elements = document.querySelectorAll('.reveal-trigger, .reveal-up, .reveal-down, .reveal-left, .reveal-right');
    elements.forEach(el => observer.observe(el));
  }

  // ------------------------
  // Init on DOM ready
  // ------------------------
  function init() {
    initSmoothAnchors();
    initNavDropdown();
    initGetStartedRouting();
    initCarousels();
    initFaqAccordion();
    initFooterYear();
    
    // Initialize Scroll Animations
    initScrollReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();