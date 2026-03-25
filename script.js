const revealElements = document.querySelectorAll('.reveal');
const statValues = document.querySelectorAll('.stat-value');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const year = document.querySelector('#year');
const headshotPreview = document.querySelector('#headshotPreview');
const themeToggle = document.querySelector('.theme-toggle');
const root = document.documentElement;
const projectCards = document.querySelectorAll('.project-card');
const portfolioBot = document.querySelector('#portfolioBot');
const botFab = document.querySelector('#botFab');
const botPanel = document.querySelector('#botPanel');
const botClose = document.querySelector('#botClose');
const botMessages = document.querySelector('#botMessages');
const botForm = document.querySelector('#botForm');
const botInput = document.querySelector('#botInput');
const botQuickActions = document.querySelector('#botQuickActions');

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

const getText = (selector, scope = document) => {
  const node = scope.querySelector(selector);
  return node ? node.textContent.trim() : '';
};

const getAllText = (selector, scope = document) => {
  return Array.from(scope.querySelectorAll(selector))
    .map((node) => node.textContent.trim())
    .filter(Boolean);
};

const tokenize = (text) => {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);
};

const scoreOverlap = (queryTokens, text) => {
  const targetTokens = new Set(tokenize(text));
  return queryTokens.reduce((score, token) => score + (targetTokens.has(token) ? 1 : 0), 0);
};

const getRankedProjects = (question, projects) => {
  const tokens = tokenize(question);

  return projects
    .map((project) => ({
      ...project,
      score: scoreOverlap(
        tokens,
        `${project.title} ${project.period} ${project.bullets.join(' ')} ${project.technologies.join(' ')}`
      )
    }))
    .sort((a, b) => b.score - a.score);
};

const getProjectByTitle = (projects, title) => {
  if (!title) {
    return null;
  }

  return projects.find((project) => project.title === title) || null;
};

const formatProjectExplanation = (project) => {
  if (!project) {
    return '';
  }

  const stackLine = project.technologies.length > 0
    ? `Tech stack: ${project.technologies.join(', ')}.`
    : 'Tech stack details are available in the project card.';
  const bullets = project.bullets.join(' ');
  const repoLine = project.repoUrl ? `Repository: ${project.repoUrl}` : '';

  return `${project.title} (${project.period}) is focused on ${bullets} ${stackLine} ${repoLine}`.trim();
};

const buildPortfolioKnowledge = () => {
  const name = getText('.brand') || 'Nikhil Singhal';
  const role = getText('.hero-copy .eyebrow') || 'DevOps Engineer';
  const about = getText('.hero-copy .lead');
  const skills = getAllText('#skills .skill-item');

  const projects = Array.from(document.querySelectorAll('#projects .project-card')).map((card) => {
    return {
      title: getText('h3', card),
      period: getText('.project-meta span', card),
      bullets: getAllText('ul li', card),
      technologies: getAllText('.tech-row span', card),
      repoUrl: getText('.cta-outline', card) ? (card.querySelector('.cta-outline')?.getAttribute('href') || '').trim() : ''
    };
  });

  const certifications = getAllText('#skills .cert-item h3');
  const training = getText('#skills .training-block h3');

  const education = Array.from(document.querySelectorAll('#education .timeline-item')).map((item) => {
    return {
      institute: getText('h3', item),
      detail: getText('p.meta', item),
      locationAndDate: getText('p.meta:nth-of-type(2)', item)
    };
  });

  const emailNode = Array.from(document.querySelectorAll('#contact .contact-grid a')).find((link) =>
    link.getAttribute('href')?.startsWith('mailto:')
  );
  const linkedinNode = Array.from(document.querySelectorAll('#contact .contact-grid a')).find((link) =>
    link.getAttribute('href')?.includes('linkedin.com')
  );
  const githubNode = Array.from(document.querySelectorAll('#contact .contact-grid a')).find((link) =>
    link.getAttribute('href')?.includes('github.com')
  );

  const emailHref = emailNode ? emailNode.getAttribute('href') || '' : '';
  const email = emailHref.toLowerCase().startsWith('mailto:')
    ? emailHref.replace(/^mailto:/i, '').trim()
    : emailNode
      ? emailNode.textContent.trim()
      : '';

  const linkedinUrl = linkedinNode ? (linkedinNode.getAttribute('href') || '').trim() : '';
  const githubUrl = githubNode ? (githubNode.getAttribute('href') || '').trim() : '';

  return {
    name,
    role,
    about,
    skills,
    projects,
    certifications,
    training,
    education,
    contact: {
      email,
      linkedin: linkedinUrl,
      github: githubUrl
    }
  };
};

const getPortfolioAnswer = (question, knowledge, botContext = {}) => {
  const lowerQuestion = question.toLowerCase();
  const tokens = tokenize(question);
  const rankedProjects = getRankedProjects(question, knowledge.projects);
  const matchedProject = rankedProjects[0] && rankedProjects[0].score >= 2 ? rankedProjects[0] : null;

  const asksToExplainProject = /\b(explain|describe|detail|details|walk|breakdown|tell)\b/.test(lowerQuestion)
    && /\b(project|this project|that project)\b/.test(lowerQuestion);

  const asksForThisProject = /\b(this project|that project|current project)\b/.test(lowerQuestion);
  const asksToExplainByName = /\b(explain|describe|detail|details|walk|breakdown|tell)\b/.test(lowerQuestion)
    && Boolean(matchedProject);

  if (asksToExplainProject || asksForThisProject || asksToExplainByName) {
    const contextProject = getProjectByTitle(knowledge.projects, botContext.activeProjectTitle);
    const focusedProject = asksForThisProject ? (contextProject || matchedProject) : (matchedProject || contextProject);

    if (focusedProject) {
      return {
        text: formatProjectExplanation(focusedProject),
        context: {
          activeProjectTitle: focusedProject.title
        }
      };
    }

    const projectNames = knowledge.projects.map((project) => project.title).join(' | ');
    return {
      text: `Yes, I can explain your projects. Please mention a project name or click one project card first, then ask \"explain this project\". Available projects: ${projectNames}.`
    };
  }

  if (/\b(hi|hello|hey|hii)\b/.test(lowerQuestion)) {
    return {
      text: `Hi! Ask me anything about ${knowledge.name}'s portfolio, like projects, skills, education, certifications, or contact details.`
    };
  }

  if (/\b(who|about|introduce|profile|devops)\b/.test(lowerQuestion)) {
    return {
      text: `${knowledge.name} is a ${knowledge.role}. ${knowledge.about}`
    };
  }

  if (/\b(skill|skills|tech|stack|tools|technology)\b/.test(lowerQuestion)) {
    const topSkills = knowledge.skills.slice(0, 10).join(', ');
    return {
      text: `Top skills include ${topSkills}. Overall, the portfolio lists ${knowledge.skills.length}+ tools and technologies.`
    };
  }

  if (/\b(project|projects|work|built|build)\b/.test(lowerQuestion)) {
    if (rankedProjects[0] && rankedProjects[0].score >= 2) {
      const focused = rankedProjects[0];
      return {
        text: `${focused.title} (${focused.period}): ${focused.bullets.join(' ')}`,
        context: {
          activeProjectTitle: focused.title
        }
      };
    }

    const list = knowledge.projects.map((project) => `${project.title} (${project.period})`).join(' | ');
    return {
      text: `Main projects are: ${list}. Ask me about any one project name for details.`
    };
  }

  if (/\b(certification|certifications|certificate|training|course|courses)\b/.test(lowerQuestion)) {
    const certList = knowledge.certifications.join(', ');
    return {
      text: `Certifications include ${certList}. Training highlight: ${knowledge.training}.`
    };
  }

  if (/\b(education|college|school|cgpa|university|study)\b/.test(lowerQuestion)) {
    const eduLine = knowledge.education
      .map((item) => `${item.institute} - ${item.detail}`)
      .join(' | ');
    return {
      text: `Education summary: ${eduLine}.`
    };
  }

  if (/\b(email|mail|gmail)\b/.test(lowerQuestion) && !/\b(linkedin|github)\b/.test(lowerQuestion)) {
    return {
      text: knowledge.contact.email
        ? `Nikhil's email is ${knowledge.contact.email}.`
        : `I could not find the email in the portfolio contact section.`
    };
  }

  if (/\b(linkedin)\b/.test(lowerQuestion)) {
    return {
      text: knowledge.contact.linkedin
        ? `Nikhil's LinkedIn URL is ${knowledge.contact.linkedin}.`
        : `I could not find the LinkedIn URL in the portfolio contact section.`
    };
  }

  if (/\b(github)\b/.test(lowerQuestion)) {
    return {
      text: knowledge.contact.github
        ? `Nikhil's GitHub URL is ${knowledge.contact.github}.`
        : `I could not find the GitHub URL in the portfolio contact section.`
    };
  }

  if (/\b(contact|email|mail|linkedin|github|reach|connect|hire)\b/.test(lowerQuestion)) {
    return {
      text: `You can reach ${knowledge.name} via Email: ${knowledge.contact.email}, LinkedIn: ${knowledge.contact.linkedin}, GitHub: ${knowledge.contact.github}.`
    };
  }

  const documents = [
    `${knowledge.name} ${knowledge.role} ${knowledge.about}`,
    ...knowledge.projects.map((project) => `${project.title} ${project.period} ${project.bullets.join(' ')}`),
    `Skills ${knowledge.skills.join(' ')}`,
    `Certifications ${knowledge.certifications.join(' ')} ${knowledge.training}`,
    `Education ${knowledge.education.map((item) => `${item.institute} ${item.detail}`).join(' ')}`,
    `Contact ${knowledge.contact.email} ${knowledge.contact.linkedin} ${knowledge.contact.github}`
  ];

  const topScore = Math.max(...documents.map((doc) => scoreOverlap(tokens, doc)));

  if (topScore >= 2) {
    return {
      text: `I found relevant details in the portfolio. Try asking directly about projects, skills, certifications, education, or contact for a focused answer.`
    };
  }

  return {
    text: `I can help with: about profile, project details, skills list, certifications/training, education, and contact details. You can also ask: explain this project.`
  };
};

const addBotMessage = (message, sender = 'bot') => {
  if (!botMessages) {
    return;
  }

  const bubble = document.createElement('article');
  bubble.className = `bot-bubble ${sender === 'user' ? 'bot-bubble-user' : 'bot-bubble-bot'}`;
  bubble.textContent = message;
  botMessages.appendChild(bubble);
  botMessages.scrollTop = botMessages.scrollHeight;
};

if (portfolioBot && botFab && botPanel && botForm && botInput) {
  const knowledge = buildPortfolioKnowledge();
  const botContext = {
    activeProjectTitle: knowledge.projects[0] ? knowledge.projects[0].title : ''
  };

  const setBotOpenState = (open) => {
    portfolioBot.classList.toggle('is-open', open);
    botFab.setAttribute('aria-expanded', String(open));

    if (open) {
      botInput.focus();
    }
  };

  botFab.addEventListener('click', () => {
    const open = !portfolioBot.classList.contains('is-open');
    setBotOpenState(open);
  });

  if (botClose) {
    botClose.addEventListener('click', () => setBotOpenState(false));
  }

  projectCards.forEach((card) => {
    card.addEventListener('click', () => {
      const title = getText('h3', card);
      if (title) {
        botContext.activeProjectTitle = title;
      }
    });
  });

  botForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const question = botInput.value.trim();

    if (!question) {
      return;
    }

    addBotMessage(question, 'user');
    botInput.value = '';

    const answerPayload = getPortfolioAnswer(question, knowledge, botContext);
    if (answerPayload.context?.activeProjectTitle) {
      botContext.activeProjectTitle = answerPayload.context.activeProjectTitle;
    }

    window.setTimeout(() => addBotMessage(answerPayload.text, 'bot'), 160);
  });

  if (botQuickActions) {
    botQuickActions.querySelectorAll('.bot-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        botInput.value = chip.textContent.trim();
        botForm.requestSubmit();
      });
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && portfolioBot.classList.contains('is-open')) {
      setBotOpenState(false);
    }
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
