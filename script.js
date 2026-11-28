(function () {
  // Sticky / moving navbar state on scroll
  const siteHeader = document.querySelector(".site-header");
  if (siteHeader) {
    function syncHeaderScroll() {
      if (window.scrollY > 60) {
        siteHeader.classList.add("is-scrolled");
      } else {
        siteHeader.classList.remove("is-scrolled");
      }
    }

    window.addEventListener("scroll", syncHeaderScroll, { passive: true });
    syncHeaderScroll();
  }

  // Desktop Procedures mega-dropdown (click + hover)
  const dropdowns = document.querySelectorAll(".has-dropdown");
  dropdowns.forEach(function (dropdown) {
    const trigger = dropdown.querySelector(".dropdown-trigger");
    const menu = dropdown.querySelector(".dropdown");
    if (!trigger) return;

    function openDropdown() {
      dropdowns.forEach(function (item) {
        item.classList.remove("open");
        const btn = item.querySelector(".dropdown-trigger");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
      dropdown.classList.add("open");
      trigger.setAttribute("aria-expanded", "true");
    }

    function closeDropdown() {
      dropdown.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    }

    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      if (dropdown.classList.contains("open")) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    dropdown.addEventListener("mouseenter", openDropdown);
    dropdown.addEventListener("mouseleave", closeDropdown);

    if (menu) {
      menu.addEventListener("click", function (e) {
        if (e.target.closest("a")) {
          closeDropdown();
        } else {
          e.stopPropagation();
        }
      });
    }
  });

  document.addEventListener("click", function () {
    dropdowns.forEach(function (dropdown) {
      dropdown.classList.remove("open");
      const trigger = dropdown.querySelector(".dropdown-trigger");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
  });

  // Mobile drawer & accordion
  const menuToggle = document.getElementById("menuToggle");
  const mobileDrawer = document.getElementById("mobileDrawer");
  if (menuToggle && mobileDrawer) {
    menuToggle.addEventListener("click", function () {
      const expanded = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!expanded));
      mobileDrawer.hidden = expanded;
    });

    mobileDrawer.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menuToggle.setAttribute("aria-expanded", "false");
        mobileDrawer.hidden = true;
      });
    });
  }

  const accordionBtn = document.querySelector(".drawer-accordion");
  const drawerSublist = document.getElementById("drawerProcedures");
  if (accordionBtn && drawerSublist) {
    accordionBtn.addEventListener("click", function () {
      const expanded = accordionBtn.getAttribute("aria-expanded") === "true";
      accordionBtn.setAttribute("aria-expanded", String(!expanded));
      drawerSublist.hidden = expanded;
      const plus = accordionBtn.querySelector(".drawer-plus");
      if (plus) plus.textContent = expanded ? "+" : "−";
    });
  }

  // Testimonials: smooth edge-to-edge flow behind fixed left intro card
  const scroller = document.getElementById("tScroller");
  const prevBtn = document.getElementById("tPrev");
  const nextBtn = document.getElementById("tNext");
  if (scroller && prevBtn && nextBtn) {
    const baseCards = Array.from(scroller.querySelectorAll(".t-card"));
    const total = baseCards.length;

    if (total > 0) {
      let track = scroller.querySelector(".t-slide-track");
      if (!track) {
        track = document.createElement("div");
        track.className = "t-slide-track";
        scroller.innerHTML = "";
        scroller.appendChild(track);
      }

      const cloneCount = Math.max(total * 2, 6);
      const prependClones = [];
      const appendClones = [];

      for (let i = 0; i < cloneCount; i++) {
        const prevIdx = (((total - ((cloneCount - i) % total)) % total) + total) % total;
        const pClone = baseCards[prevIdx].cloneNode(true);
        pClone.classList.add("is-clone");
        pClone.setAttribute("aria-hidden", "true");
        prependClones.push(pClone);

        const nextIdx = i % total;
        const aClone = baseCards[nextIdx].cloneNode(true);
        aClone.classList.add("is-clone");
        aClone.setAttribute("aria-hidden", "true");
        appendClones.push(aClone);
      }

      track.innerHTML = "";
      prependClones.forEach(function (c) { track.appendChild(c); });
      baseCards.forEach(function (c) { track.appendChild(c); });
      appendClones.forEach(function (c) { track.appendChild(c); });

      const allItems = Array.from(track.children);
      let trackIndex = cloneCount;
      let isAnimating = false;
      let finishTimer = null;

      prevBtn.disabled = false;
      nextBtn.disabled = false;

      function getStepSize() {
        const sample = allItems[0];
        if (!sample) return 400;
        const styles = window.getComputedStyle(track);
        const gap = parseFloat(styles.columnGap || styles.gap) || 28;
        return sample.getBoundingClientRect().width + gap;
      }

      function applyInstantTransition() {
        track.style.transitionProperty = "none";
        track.style.transitionDuration = "0s";
        track.style.transitionTimingFunction = "ease";
        track.style.transitionDelay = "0s";
        track.style.transitionBehavior = "normal";
      }

      function applySlideTransition() {
        track.style.transitionProperty = "transform";
        track.style.transitionDuration = "0.28s";
        track.style.transitionTimingFunction = "ease-in-out";
        track.style.transitionDelay = "0s";
        track.style.transitionBehavior = "normal";
      }

      function setTrackPosition(instant) {
        const x = -(trackIndex * getStepSize());
        if (instant) {
          applyInstantTransition();
        } else {
          applySlideTransition();
        }
        track.style.transform = "translate3d(" + x + "px, 0, 0)";
        if (instant) {
          track.getBoundingClientRect();
          applySlideTransition();
        }
      }

      function wrapTrackIfNeeded() {
        if (trackIndex >= cloneCount + total) {
          trackIndex = cloneCount + ((trackIndex - cloneCount) % total);
          setTrackPosition(true);
        } else if (trackIndex < cloneCount) {
          const stepsBack = (cloneCount - trackIndex) % total;
          trackIndex = stepsBack === 0 ? cloneCount : cloneCount + total - stepsBack;
          setTrackPosition(true);
        }
      }

      function completeMove() {
        if (finishTimer) {
          window.clearTimeout(finishTimer);
          finishTimer = null;
        }
        wrapTrackIfNeeded();
        isAnimating = false;
      }

      track.addEventListener("transitionend", function (e) {
        if (e.target !== track || e.propertyName !== "transform") return;
        completeMove();
      });

      function moveCards(direction) {
        if (isAnimating) {
          wrapTrackIfNeeded();
        }
        isAnimating = true;
        trackIndex += direction;
        setTrackPosition(false);

        finishTimer = window.setTimeout(function () {
          completeMove();
        }, 300);
      }

      nextBtn.addEventListener("click", function (e) {
        e.preventDefault();
        moveCards(1);
      });

      prevBtn.addEventListener("click", function (e) {
        e.preventDefault();
        moveCards(-1);
      });

      window.addEventListener("resize", function () {
        completeMove();
        setTrackPosition(true);
      }, { passive: true });

      setTrackPosition(true);
    }
  }

  // Appointment form validation & Formspree submission
  const apptForm = document.getElementById("appointmentForm");
  const apptStatus = document.getElementById("apptStatus");
  const FORMSPREE_ENDPOINT = "https://formspree.io/f/xgakqnyn";

  if (apptForm && apptStatus) {
    apptForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const fullName = document.getElementById("fullName");
      const email = document.getElementById("email");
      const phone = document.getElementById("phone");
      const clinic = document.getElementById("clinic");
      const reason = document.getElementById("reason");

      const nameVal = fullName ? fullName.value.trim() : "";
      const emailVal = email ? email.value.trim() : "";
      const phoneVal = phone ? phone.value.trim() : "";
      const clinicVal = clinic ? clinic.value.trim() : "";
      const reasonVal = reason ? reason.value.trim() : "";

      apptStatus.hidden = false;

      if (!nameVal || !emailVal || !phoneVal || !clinicVal || !reasonVal) {
        apptStatus.textContent = "Please complete all required fields before submitting.";
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        apptStatus.textContent = "Please enter a valid email address.";
        return;
      }

      const submitBtn = apptForm.querySelector(".appt-submit");
      const endpoint = apptForm.getAttribute("action") || FORMSPREE_ENDPOINT;
      const formData = new FormData(apptForm);

      if (submitBtn) submitBtn.disabled = true;
      apptStatus.textContent = "Sending your appointment request...";

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json"
          }
        });

        if (response.ok) {
          apptForm.reset();
          apptStatus.textContent =
            "Thank you. Your appointment request has been sent. Please call +92 321 5667709 if you need immediate assistance.";
        } else {
          const data = await response.json().catch(function () {
            return null;
          });
          apptStatus.textContent =
            (data && data.errors && data.errors.map(function (err) { return err.message; }).join(", ")) ||
            "Could not send request. Please try again or call +92 321 5667709.";
        }
      } catch (error) {
        apptStatus.textContent =
          "Network error. Please check your connection or call +92 321 5667709.";
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // Pending links toast
  const toast = document.getElementById("toast");
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.hidden = true;
    }, 3200);
  }

  document.querySelectorAll("[data-pending-link]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      const type = el.getAttribute("data-pending-link");
      if (type === "speciality") {
        const specSection = document.getElementById("specialities");
        if (specSection) {
          specSection.scrollIntoView({ behavior: "smooth" });
        }
        showToast("Detailed procedure pages will be added once finalized.");
      } else if (type === "profile") {
        showToast("Full biography and credentials page coming soon.");
      } else if (type === "reviews") {
        showToast("Additional verified patient reviews coming soon.");
      } else if (type === "contact") {
        showToast("Direct contact details are listed below.");
      } else if (type === "privacy") {
        showToast("Privacy policy details will be published once finalized.");
      } else {
        showToast("This section is currently being finalized.");
      }
    });
  });

  // Watch Film modal with Assets/hero.webm
  const watchFilmBtn = document.getElementById("watchFilmBtn");
  const filmModal = document.getElementById("filmModal");
  const filmBackdrop = document.getElementById("filmBackdrop");
  const filmClose = document.getElementById("filmClose");
  const filmVideo = document.getElementById("filmVideo");

  if (watchFilmBtn && filmModal && filmVideo) {
    function openFilmModal() {
      filmModal.hidden = false;
      document.body.style.overflow = "hidden";
      filmVideo.currentTime = 0;
      const playPromise = filmVideo.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    }

    function closeFilmModal() {
      filmModal.hidden = true;
      document.body.style.overflow = "";
      filmVideo.pause();
    }

    watchFilmBtn.addEventListener("click", openFilmModal);
    if (filmClose) filmClose.addEventListener("click", closeFilmModal);
    if (filmBackdrop) filmBackdrop.addEventListener("click", closeFilmModal);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !filmModal.hidden) {
        closeFilmModal();
      }
    });
  }
})();
