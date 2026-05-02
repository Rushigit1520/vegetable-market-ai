/* ===================================================
   Vegetable Market AI — Micro-Interactions & UX
   =================================================== */

window.initUXEffects = function () {
  // 1. Custom Cursor Glow
  const cursor = document.getElementById("cursor-glow");
  if (cursor) {
    document.addEventListener("mousemove", (e) => {
      // Use requestAnimationFrame for smooth performance
      requestAnimationFrame(() => {
        cursor.style.left = e.clientX + "px";
        cursor.style.top = e.clientY + "px";
      });
    });

    // Fade out cursor when leaving window
    document.addEventListener("mouseleave", () => {
      cursor.style.opacity = "0";
    });
    document.addEventListener("mouseenter", () => {
      cursor.style.opacity = "1";
    });
  }

  // 2. Loading Screen Sequence
  const loader = document.getElementById("loading-screen");
  const progress = document.getElementById("loading-progress");
  if (loader && progress) {
    let p = 0;
    const interval = setInterval(() => {
      // Random jumps for realistic loading feel
      p += Math.random() * 15;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => {
          loader.classList.add("loaded");
          // Trigger entry animations after loader is gone
          if (window.gsap) triggerEntryAnimations();
        }, 400);
      }
      progress.style.width = p + "%";
    }, 80);
  } else if (window.gsap) {
    triggerEntryAnimations();
  }

  // 3. Staggered Entry Animations using GSAP
  function triggerEntryAnimations() {
    gsap.from(".hero-slide h2", {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    });
    
    gsap.from(".hero-slide p", {
      y: 20,
      opacity: 0,
      duration: 1,
      delay: 0.2,
      ease: "power3.out",
    });

    gsap.from(".btn-primary", {
      y: 20,
      opacity: 0,
      duration: 1,
      delay: 0.4,
      ease: "power3.out",
    });

    gsap.from(".hero-visual .floating-img", {
      x: 50,
      opacity: 0,
      duration: 1.2,
      delay: 0.3,
      ease: "elastic.out(1, 0.5)",
    });
  }

  // 4. Hero Carousel Auto-Rotation
  const track = document.getElementById("hero-carousel-track");
  const dotsContainer = document.getElementById("carousel-dots");
  if (track && dotsContainer) {
    const slides = document.querySelectorAll(".hero-slide");
    if (slides.length > 1) {
      // Create dots
      slides.forEach((_, i) => {
        const dot = document.createElement("div");
        dot.className = `dot ${i === 0 ? "active" : ""}`;
        dot.onclick = () => goToSlide(i);
        dotsContainer.appendChild(dot);
      });

      let currentSlide = 0;
      let slideInterval;

      function goToSlide(index) {
        currentSlide = index;
        track.style.transform = `translateX(-${index * 100}%)`;
        document.querySelectorAll(".dot").forEach((d, i) => {
          d.classList.toggle("active", i === index);
        });
        resetInterval();
      }

      function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        goToSlide(currentSlide);
      }

      function resetInterval() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 5000);
      }

      resetInterval();
    }
  }
};
