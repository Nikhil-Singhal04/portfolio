const revealElements = document.querySelectorAll('.reveal');
const statValues = document.querySelectorAll('.stat-value');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const year = document.querySelector('#year');
const headshotPreview = document.querySelector('#headshotPreview');
const themeToggle = document.querySelector('.theme-toggle');
const root = document.documentElement;
const projectCards = document.querySelectorAll('.project-card');

const getSavedTheme = () => {
  try {
    return localStorage.getItem('portfolioTheme');
  } catch (error) {
    return null;
  }
};

const saveTheme = (theme) => {
  try {
    localStorage.setItem('portfolioTheme', theme);
  } catch (error) {
    // Ignore storage restrictions in private browsing modes.
  }
};

const setTheme = (theme) => {
  root.setAttribute('data-theme', theme);

  if (!themeToggle) {
    return;
  }

  const isLight = theme === 'light';
  themeToggle.textContent = isLight ? 'Dark mode' : 'Light mode';
  themeToggle.setAttribute('aria-pressed', String(isLight));
};

const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
const savedTheme = getSavedTheme();
const initialTheme = savedTheme || (prefersLight ? 'light' : 'dark');

setTheme(initialTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const currentTheme = root.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    saveTheme(nextTheme);
  });
}

if (year) {
  year.textContent = new Date().getFullYear();
}

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

if (headshotPreview) {
  headshotPreview.addEventListener('error', () => {
    headshotPreview.src = 'assets/headshot-placeholder.svg';
  });
}

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const supportsPointerEvents = 'PointerEvent' in window;

const resetProjectCardMotion = (card) => {
  card.style.setProperty('--project-tilt-x', '0deg');
  card.style.setProperty('--project-tilt-y', '0deg');
  card.style.setProperty('--project-glow-x', '50%');
  card.style.setProperty('--project-glow-y', '50%');
};

if (!motionQuery.matches && supportsPointerEvents && projectCards.length > 0) {
  projectCards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') {
        return;
      }

      const rect = card.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const ratioX = Math.min(Math.max(localX / rect.width, 0), 1);
      const ratioY = Math.min(Math.max(localY / rect.height, 0), 1);
      const tiltY = (ratioX - 0.5) * 7;
      const tiltX = (0.5 - ratioY) * 7;

      card.style.setProperty('--project-tilt-x', `${tiltX.toFixed(2)}deg`);
      card.style.setProperty('--project-tilt-y', `${tiltY.toFixed(2)}deg`);
      card.style.setProperty('--project-glow-x', `${(ratioX * 100).toFixed(1)}%`);
      card.style.setProperty('--project-glow-y', `${(ratioY * 100).toFixed(1)}%`);
    });

    card.addEventListener('pointerleave', () => {
      resetProjectCardMotion(card);
    });
  });
}

const countUp = (element) => {
  const target = Number(element.dataset.count || 0);
  let value = 0;
  const duration = 1200;
  const stepTime = 16;
  const increment = target / (duration / stepTime);

  const timer = setInterval(() => {
    value += increment;
    if (value >= target) {
      element.textContent = String(target);
      clearInterval(timer);
      return;
    }
    element.textContent = String(Math.floor(value));
  }, stepTime);
};

const observer = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add('is-visible');

      if (entry.target.classList.contains('stat-value')) {
        countUp(entry.target);
      }

      obs.unobserve(entry.target);
    });
  },
  {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  }
);

revealElements.forEach((element) => observer.observe(element));
statValues.forEach((stat) => observer.observe(stat));
