const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const navPanel = document.querySelector("[data-nav-panel]");
const navLinks = document.querySelectorAll(".nav-link");
const currentYear = document.querySelector("[data-current-year]");
const modalTriggers = document.querySelectorAll("[data-modal-target]");
const modals = document.querySelectorAll(".modal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileNavQuery = window.matchMedia("(max-width: 768px)");

let activeModal = null;
let lastFocusedElement = null;

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function setHeaderState() {
  header.classList.toggle("is-scrolled", window.scrollY > 12);
}

function setMenuState(isOpen) {
  document.body.classList.toggle("nav-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
  navPanel.setAttribute("aria-hidden", String(mobileNavQuery.matches && !isOpen));
}

function closeMenu() {
  setMenuState(false);
}

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(focusableSelector)).filter((element) => {
    return !element.hasAttribute("disabled") && element.offsetParent !== null;
  });
}

function openModal(modal, trigger) {
  if (!modal) {
    return;
  }

  lastFocusedElement = trigger;
  activeModal = modal;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  const dialog = modal.querySelector(".modal__dialog");
  dialog.focus({ preventScroll: true });
}

function closeModal() {
  if (!activeModal) {
    return;
  }

  activeModal.classList.remove("is-open");
  activeModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  if (lastFocusedElement) {
    lastFocusedElement.focus({ preventScroll: true });
  }

  activeModal = null;
  lastFocusedElement = null;
}

function trapFocus(event) {
  if (!activeModal || event.key !== "Tab") {
    return;
  }

  const dialog = activeModal.querySelector(".modal__dialog");
  const focusableElements = getFocusableElements(dialog);

  if (!focusableElements.length) {
    event.preventDefault();
    dialog.focus();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (!dialog.contains(document.activeElement)) {
    event.preventDefault();
    firstElement.focus();
    return;
  }

  if (event.shiftKey && (document.activeElement === firstElement || document.activeElement === dialog)) {
    event.preventDefault();
    lastElement.focus();
  }

  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function scrollToTarget(hash) {
  const target = document.querySelector(hash);

  if (!target) {
    return;
  }

  target.scrollIntoView({
    behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    block: "start",
  });
}

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

setHeaderState();
setMenuState(false);
window.addEventListener("scroll", setHeaderState, { passive: true });
mobileNavQuery.addEventListener("change", () => setMenuState(false));

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  setMenuState(!isOpen);
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const hash = anchor.getAttribute("href");

    if (!hash || hash === "#") {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    closeMenu();
    scrollToTarget(hash);
  });
});

modalTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    openModal(document.getElementById(trigger.dataset.modalTarget), trigger);
  });
});

modals.forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-modal-close")) {
      closeModal();
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (activeModal) {
      closeModal();
      return;
    }

    closeMenu();
  }

  trapFocus(event);
});

if ("IntersectionObserver" in window) {
  const observedSections = Array.from(document.querySelectorAll("main section[id]")).filter(
    (section) => section.id !== "top",
  );

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        navLinks.forEach((link) => {
          const isActive = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("is-active", isActive);

          if (isActive) {
            link.setAttribute("aria-current", "page");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      });
    },
    {
      rootMargin: "-42% 0px -52% 0px",
      threshold: 0,
    },
  );

  observedSections.forEach((section) => sectionObserver.observe(section));
}

/* ==============================
PROJECT CAROUSEL
============================== */
const projectCarousel = document.querySelector("[data-project-carousel]");
const projectTrack = document.querySelector("[data-project-track]");
const carouselPrev = document.querySelector("[data-carousel-prev]");
const carouselNext = document.querySelector("[data-carousel-next]");
const projectCounter = document.querySelector("[data-project-counter]");

function getProjectCards() {
  if (!projectTrack) {
    return [];
  }

  return Array.from(projectTrack.querySelectorAll(".project-card"));
}

function getCarouselStep() {
  const cards = getProjectCards();
  const firstCard = cards[0];

  if (!projectTrack || !firstCard) {
    return 0;
  }

  const styles = window.getComputedStyle(projectTrack);
  const gap = parseFloat(styles.columnGap || styles.gap) || 0;

  return firstCard.getBoundingClientRect().width + gap;
}

function getActiveProjectIndex() {
  const cards = getProjectCards();

  if (!projectTrack || !cards.length) {
    return 0;
  }

  const trackLeft = projectTrack.getBoundingClientRect().left;
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  cards.forEach((card, index) => {
    const distance = Math.abs(card.getBoundingClientRect().left - trackLeft);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function formatProjectCounter(index, total) {
  const current = String(index + 1).padStart(2, "0");
  const count = String(total).padStart(2, "0");

  return `${current} / ${count}`;
}

function updateCarouselState() {
  if (!projectTrack) {
    return;
  }

  const cards = getProjectCards();
  const total = cards.length;
  const maxScrollLeft = projectTrack.scrollWidth - projectTrack.clientWidth;
  const atStart = projectTrack.scrollLeft <= 2;
  const atEnd = projectTrack.scrollLeft >= maxScrollLeft - 2;

  if (carouselPrev) {
    carouselPrev.disabled = atStart;
  }

  if (carouselNext) {
    carouselNext.disabled = atEnd;
  }

  if (projectCounter && total) {
    projectCounter.textContent = formatProjectCounter(getActiveProjectIndex(), total);
  }
}

function scrollProjects(direction) {
  if (!projectTrack) {
    return;
  }

  const step = getCarouselStep();

  projectTrack.scrollBy({
    left: step * direction,
    behavior: prefersReducedMotion.matches ? "auto" : "smooth",
  });
}

if (projectCarousel && projectTrack) {
  carouselPrev?.addEventListener("click", () => scrollProjects(-1));
  carouselNext?.addEventListener("click", () => scrollProjects(1));
  projectTrack.addEventListener("scroll", updateCarouselState, { passive: true });
  window.addEventListener("resize", updateCarouselState);
  updateCarouselState();
}
