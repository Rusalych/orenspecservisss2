document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const introSessionKey = "ossIntroSeen";
  const introVideoSrc = "video/intro-logo.mp4";
  const siteHeader = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const navContainer = document.querySelector(".header-nav");
  const navLinks = document.querySelectorAll(".site-nav a");
  const navDropdowns = Array.from(document.querySelectorAll("[data-nav-dropdown]"));
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const monumentGroupPaths = new Set([
    "monuments.html",
    "catalog.html",
    "manufacturing-installation.html",
    "engraving-3d.html",
    "works.html"
  ]);
  let lastScrollY = window.scrollY;
  let scrollAccumulator = 0;
  let isHeaderVisible = true;
  let isScrollTopVisible = false;
  let headerTicking = false;
  const headerHideThreshold = 28;
  const headerTopZoneMin = 164;
  const headerTopZoneMax = 300;
  const headerScrollNoise = 6;

  const getScrollTopThreshold = () => Math.max(window.innerHeight * 0.72, 440);

  const scrollTopButton = document.createElement("button");
  scrollTopButton.className = "scroll-top-button";
  scrollTopButton.type = "button";
  scrollTopButton.setAttribute("aria-label", "Наверх");
  scrollTopButton.setAttribute("title", "Наверх");
  scrollTopButton.innerHTML = `
    <span class="scroll-top-button__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d="M12 5L6.5 10.5M12 5l5.5 5.5M12 5v14" />
      </svg>
    </span>
  `;
  document.body.append(scrollTopButton);

  const setHeaderVisible = (visible) => {
    if (!siteHeader || isHeaderVisible === visible) {
      return;
    }

    isHeaderVisible = visible;
    siteHeader.classList.toggle("is-hidden", !visible);
  };

  const setScrollTopVisible = (visible) => {
    if (isScrollTopVisible === visible) {
      return;
    }

    isScrollTopVisible = visible;
    scrollTopButton.classList.toggle("is-visible", visible);
  };

  const setDropdownOpen = (dropdown, open) => {
    const trigger = dropdown?.querySelector("[data-nav-trigger]");
    if (!dropdown || !trigger) {
      return;
    }

    dropdown.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  };

  const closeAllDropdowns = (except = null) => {
    navDropdowns.forEach((dropdown) => {
      if (dropdown !== except) {
        setDropdownOpen(dropdown, false);
      }
    });
  };

  const resetHeaderTracking = () => {
    lastScrollY = window.scrollY;
    scrollAccumulator = 0;
  };

  const readSessionFlag = (key) => {
    try {
      return window.sessionStorage.getItem(key);
    } catch (error) {
      return null;
    }
  };

  const writeSessionFlag = (key, value) => {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      // Ignore storage access issues and keep the site usable.
    }
  };

  const updateHeaderState = () => {
    const currentScrollY = Math.max(window.scrollY, 0);
    const navOpen = document.body.classList.contains("nav-open");
    const introActive = document.body.classList.contains("intro-active");

    setScrollTopVisible(!navOpen && !introActive && currentScrollY > getScrollTopThreshold());

    if (!siteHeader) {
      headerTicking = false;
      return;
    }

    const delta = currentScrollY - lastScrollY;
    const headerHideOffset = Math.min(Math.max(siteHeader.offsetHeight * 0.38, 42), 72);
    const headerTopZone = Math.min(Math.max(siteHeader.offsetHeight + 28, headerTopZoneMin), headerTopZoneMax);

    siteHeader.classList.toggle("is-scrolled", currentScrollY > 8);

    if (navOpen || introActive || currentScrollY <= headerTopZone) {
      setHeaderVisible(true);
      resetHeaderTracking();
      headerTicking = false;
      return;
    }

    if (Math.abs(delta) < headerScrollNoise) {
      lastScrollY = currentScrollY;
      headerTicking = false;
      return;
    }

    if (delta > 0) {
      scrollAccumulator += delta;
    } else {
      scrollAccumulator = 0;
    }

    if (scrollAccumulator >= headerHideThreshold && currentScrollY > headerHideOffset) {
      setHeaderVisible(false);
      scrollAccumulator = 0;
    }

    lastScrollY = currentScrollY;
    headerTicking = false;
  };

  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  });

  if (siteHeader || scrollTopButton) {
    const requestHeaderUpdate = () => {
      if (headerTicking) {
        return;
      }

      headerTicking = true;
      window.requestAnimationFrame(updateHeaderState);
    };

    window.addEventListener("scroll", requestHeaderUpdate, { passive: true });
    window.addEventListener("resize", () => {
      setHeaderVisible(true);
      resetHeaderTracking();
      updateHeaderState();
    });

    updateHeaderState();
  }

  if (menuToggle && navContainer) {
    navLinks.forEach((link, index) => {
      link.style.setProperty("--nav-index", String(index));
    });

    navDropdowns.forEach((dropdown, index) => {
      const trigger = dropdown.querySelector("[data-nav-trigger]");
      if (!trigger) {
        return;
      }

      trigger.style.setProperty("--nav-index", String(navLinks.length + index));
      trigger.setAttribute("aria-haspopup", "true");

      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        const shouldOpen = !dropdown.classList.contains("is-open");
        closeAllDropdowns(dropdown);
        setDropdownOpen(dropdown, shouldOpen);
      });
    });

    const closeMenu = () => {
      document.body.classList.remove("nav-open");
      menuToggle.setAttribute("aria-expanded", "false");
      closeAllDropdowns();
      setHeaderVisible(true);
      resetHeaderTracking();
      updateHeaderState();
    };

    menuToggle.addEventListener("click", () => {
      const isOpen = document.body.classList.toggle("nav-open");
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      if (isOpen && window.innerWidth <= 1024 && monumentGroupPaths.has(currentPath)) {
        const currentGroup = navDropdowns.find((dropdown) => dropdown.classList.contains("is-current")) || navDropdowns[0];
        if (currentGroup) {
          setDropdownOpen(currentGroup, true);
        }
      } else if (!isOpen) {
        closeAllDropdowns();
      }
      setHeaderVisible(true);
      resetHeaderTracking();
      updateHeaderState();
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", () => {
      closeAllDropdowns();
      if (window.innerWidth > 1024) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    document.addEventListener("click", (event) => {
      navDropdowns.forEach((dropdown) => {
        if (!dropdown.contains(event.target)) {
          setDropdownOpen(dropdown, false);
        }
      });
    });

    document.addEventListener("focusin", (event) => {
      navDropdowns.forEach((dropdown) => {
        if (!dropdown.contains(event.target)) {
          setDropdownOpen(dropdown, false);
        }
      });
    });
  }

  const shouldShowIntro = !readSessionFlag(introSessionKey);

  if (shouldShowIntro) {
    writeSessionFlag(introSessionKey, "1");

    const introOverlay = document.createElement("div");
    introOverlay.className = "site-intro";
    introOverlay.setAttribute("aria-label", "Заставка сайта");
    introOverlay.innerHTML = `
      <div class="site-intro__stage">
        <button class="site-intro__skip" type="button">Пропустить</button>
        <div class="site-intro__video-wrap">
          <video class="site-intro__video" playsinline muted preload="auto" autoplay>
            <source src="${introVideoSrc}" type="video/mp4">
          </video>
        </div>
      </div>
    `;

    const introVideo = introOverlay.querySelector(".site-intro__video");
    const introSkip = introOverlay.querySelector(".site-intro__skip");
    let introDismissed = false;
    let introFinalized = false;

    const finalizeIntro = () => {
      if (introFinalized) {
        return;
      }

      introFinalized = true;
      introOverlay.remove();
      document.body.classList.remove("intro-active");
      setHeaderVisible(true);
      resetHeaderTracking();
      updateHeaderState();
    };

    const dismissIntro = (immediate = false) => {
      if (introDismissed) {
        return;
      }

      introDismissed = true;
      document.body.classList.remove("intro-active");
      introOverlay.classList.add("is-closing");
      introOverlay.classList.remove("is-active");
      setHeaderVisible(true);
      resetHeaderTracking();

      if (immediate) {
        finalizeIntro();
        return;
      }

      introOverlay.addEventListener("transitionend", finalizeIntro, { once: true });
      window.setTimeout(finalizeIntro, 900);
    };

    introSkip?.addEventListener("click", () => dismissIntro());
    introVideo?.addEventListener("ended", () => dismissIntro());
    introVideo?.addEventListener("error", () => dismissIntro(true));
    introVideo?.addEventListener("abort", () => dismissIntro(true));

    document.body.prepend(introOverlay);
    document.body.classList.add("intro-active");
    setHeaderVisible(true);
    resetHeaderTracking();

    window.requestAnimationFrame(() => {
      introOverlay.classList.add("is-active");
    });

    if (introVideo) {
      introVideo.muted = true;
      const playIntro = () => {
        const playPromise = introVideo.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {
            dismissIntro(true);
          });
        }
      };

      if (introVideo.readyState >= 2) {
        playIntro();
      } else {
        introVideo.addEventListener("loadeddata", playIntro, { once: true });
      }
    } else {
      dismissIntro(true);
    }
  }

  const revealRegistry = new Set();

  const addRevealTarget = (element, delay = 0) => {
    if (!element || revealRegistry.has(element) || element.closest(".header-nav")) {
      return;
    }

    revealRegistry.add(element);
    element.classList.add("motion-reveal");

    if (delay) {
      element.style.setProperty("--reveal-delay", `${delay}ms`);
    }
  };

  const registerRevealGroup = (selector, delayStep = 70, startDelay = 0) => {
    document.querySelectorAll(selector).forEach((group) => {
      Array.from(group.children).forEach((child, index) => {
        addRevealTarget(child, startDelay + index * delayStep);
      });
    });
  };

  [
    ".hero__inner",
    ".page-hero__inner",
    ".section-head",
    ".card-grid",
    ".pricing-grid",
    ".catalog-grid",
    ".works-grid",
    ".gallery-grid",
    ".steps-grid",
    ".showcase-grid",
    ".showcase-metrics",
    ".hero-metrics",
    ".stats-grid",
    ".signature-list",
    ".transport-process-lead",
    ".transport-summary__points",
    ".transport-suite",
    ".contact-stack",
    ".faq-list",
    ".trust-points",
    ".footer-grid",
    ".footer-bottom"
  ].forEach((selector) => registerRevealGroup(selector));

  [
    ".note-panel",
    ".highlight-panel",
    ".cta-shell",
    ".map-card",
    ".transport-featured-block",
    ".transport-summary__intro"
  ].forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => addRevealTarget(element));
  });

  document.querySelectorAll(
    ".hero-card, .page-side-card, .showcase-card, .highlight-panel, .catalog-card, .portfolio-card, .fleet-grid .info-card, .hall-grid .info-card"
  ).forEach((element) => {
    element.classList.add("motion-depth");
  });

  if (prefersReducedMotion) {
    revealRegistry.forEach((element) => {
      element.classList.add("is-visible");
    });
  } else if (revealRegistry.size) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    revealRegistry.forEach((element) => {
      revealObserver.observe(element);
    });

    window.requestAnimationFrame(() => {
      revealRegistry.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92) {
          element.classList.add("is-visible");
          revealObserver.unobserve(element);
        }
      });
    });
  }

  document.querySelectorAll("[data-nav] a[href]").forEach((link) => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });

  if (monumentGroupPaths.has(currentPath)) {
    navDropdowns.forEach((dropdown) => {
      dropdown.classList.add("is-current");
      dropdown.querySelector("[data-nav-trigger]")?.classList.add("is-active");
    });
  }

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item, index) => {
    const button = item.querySelector(".faq-question");
    if (!button) {
      return;
    }

    const setOpen = (open) => {
      item.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
    };

    setOpen(index === 0);

    button.addEventListener("click", () => {
      const shouldOpen = !item.classList.contains("is-open");
      faqItems.forEach((entry) => {
        const otherButton = entry.querySelector(".faq-question");
        if (otherButton) {
          entry.classList.remove("is-open");
          otherButton.setAttribute("aria-expanded", "false");
        }
      });
      setOpen(shouldOpen);
    });
  });
});
