/* ===================================================
   Vegetable Market AI — UX Effects (God Mode)
   GSAP Animations, Loading Screen, Cursor Effects
   =================================================== */

// -------- Loading Screen --------
function initLoadingScreen() {
  const loader = document.getElementById("loading-screen");
  if (!loader) return;

  const bar = document.getElementById("loading-bar-fill");
  const text = document.getElementById("loading-text");
  let progress = 0;

  const messages = [
    "Initializing AI Engine...",
    "Loading Fresh Produce...",
    "Preparing 3D Scene...",
    "Optimizing Experience...",
    "Almost Ready...",
  ];

  const interval = setInterval(() => {
    progress += Math.random() * 15 + 5;
    if (progress > 100) progress = 100;

    if (bar) bar.style.width = progress + "%";
    if (text) {
      const idx = Math.min(Math.floor(progress / 20), messages.length - 1);
      text.textContent = messages[idx];
    }

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        loader.classList.add("loaded");
        setTimeout(() => loader.remove(), 600);
      }, 400);
    }
  }, 200);
}

// -------- GSAP Scroll Animations --------
function initScrollAnimations() {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  // Fade-in product cards on scroll
  gsap.utils.toArray(".product-card").forEach((card, i) => {
    gsap.from(card, {
      opacity: 0,
      y: 60,
      scale: 0.95,
      duration: 0.6,
      delay: i * 0.05,
      ease: "power3.out",
      scrollTrigger: {
        trigger: card,
        start: "top 90%",
        toggleActions: "play none none none",
      },
    });
  });

  // Animate stat cards
  gsap.utils.toArray(".stat-card").forEach((card, i) => {
    gsap.from(card, {
      opacity: 0,
      x: -40,
      duration: 0.5,
      delay: i * 0.15,
      ease: "power2.out",
    });
  });

  // Animate trend cards
  gsap.utils.toArray(".trend-card").forEach((card, i) => {
    gsap.from(card, {
      opacity: 0,
      x: 40,
      duration: 0.5,
      delay: i * 0.15,
      ease: "power2.out",
    });
  });

  // Animate group titles
  gsap.utils.toArray(".group-title").forEach((title) => {
    gsap.from(title, {
      opacity: 0,
      y: 20,
      duration: 0.4,
      ease: "power2.out",
      scrollTrigger: {
        trigger: title,
        start: "top 95%",
      },
    });
  });
}

// Re-trigger scroll animations when products are re-rendered
function refreshScrollAnimations() {
  if (typeof ScrollTrigger !== "undefined") {
    ScrollTrigger.refresh();
  }
  // Animate newly added product cards
  setTimeout(() => {
    if (typeof gsap === "undefined") return;
    gsap.utils.toArray(".product-card").forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 40, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          delay: i * 0.04,
          ease: "power2.out",
        }
      );
    });
  }, 50);
}

// -------- Magnetic Buttons --------
function initMagneticButtons() {
  const buttons = document.querySelectorAll(".btn-add-to-cart, .cat-chip, .action-btn, .nav-item");

  buttons.forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });
}

// -------- Cursor Glow Trail --------
function initCursorGlow() {
  // Skip on touch devices
  if ("ontouchstart" in window) return;

  const glow = document.createElement("div");
  glow.id = "cursor-glow";
  document.body.appendChild(glow);

  let mouseX = 0, mouseY = 0;
  let glowX = 0, glowY = 0;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateGlow() {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    glow.style.left = glowX + "px";
    glow.style.top = glowY + "px";
    requestAnimationFrame(animateGlow);
  }
  animateGlow();
}

// -------- Smooth Page Transitions --------
function smoothTransition(fromPage, toPage) {
  if (typeof gsap === "undefined") return false;

  if (fromPage && fromPage !== toPage) {
    gsap.to(fromPage, {
      opacity: 0,
      y: -20,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        fromPage.classList.remove("active");
        fromPage.style.opacity = "";
        fromPage.style.transform = "";
        toPage.classList.add("active");
        gsap.fromTo(
          toPage,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
        );
      },
    });
    return true;
  }
  return false;
}

// -------- Counter Animation --------
function animateCounters() {
  document.querySelectorAll(".stat-value").forEach((el) => {
    const text = el.textContent;
    const match = text.match(/([\d,.]+)/);
    if (!match) return;

    const target = parseFloat(match[1].replace(/,/g, ""));
    const suffix = text.replace(match[1], "");
    const hasDecimal = match[1].includes(".");
    let current = 0;

    const step = () => {
      current += target / 40;
      if (current >= target) {
        el.textContent = text; // restore original
        return;
      }
      const val = hasDecimal ? current.toFixed(1) : Math.floor(current).toLocaleString();
      el.textContent = val + suffix;
      requestAnimationFrame(step);
    };
    step();
  });
}

// -------- Export init function --------
window.initUXEffects = function () {
  initLoadingScreen();
  initCursorGlow();
  // Delay animations to let DOM settle
  setTimeout(() => {
    initScrollAnimations();
    initMagneticButtons();
    animateCounters();
  }, 800);
};

window.refreshScrollAnimations = refreshScrollAnimations;
window.smoothTransition = smoothTransition;
