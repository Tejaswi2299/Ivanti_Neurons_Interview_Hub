
const routes = ['home','roles','modules','topics','coding','use-cases','quiz','bookmarks'];
const appMain = document.getElementById('app-main');
const pageTitle = document.getElementById('page-title');
const searchForm = document.getElementById('global-search-form');
const searchInput = document.getElementById('global-search-input');
const mobileNavToggle = document.getElementById('mobile-nav-toggle');
const sidebar = document.getElementById('sidebar');

const state = {
  data: null,
  bookmarks: new Set(JSON.parse(localStorage.getItem('ivantiHubBookmarks') || '[]')),
  quizAnswers: {},
  quizSubmitted: false,
};

const safeTrack = (eventName, params = {}) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
};

const saveBookmarks = () => localStorage.setItem('ivantiHubBookmarks', JSON.stringify([...state.bookmarks]));

const slugify = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const detailLink = (section, id) => `#/${section}/${id}`;

function bookmarkButton(id, label) {
  const active = state.bookmarks.has(id);
  return `<button class="secondary-button bookmark-toggle" data-bookmark-id="${id}">${active ? '★ Saved' : '☆ Save'} ${label ? '' : ''}</button>`;
}

function metricTile(label, value, note) {
  return `<article class="stat-tile"><span class="stat-label">${label}</span><strong class="stat-value">${value}</strong><span class="stat-note">${note}</span></article>`;
}

function cardActionLinks(type, id) {
  return `<div class="card-actions"><a class="primary-button" href="${detailLink(type, id)}">Open</a>${bookmarkButton(id)}</div>`;
}

function renderHome() {
  const { meta, roles, modules, topics, coding, useCases, quiz } = state.data;
  pageTitle.textContent = 'Ivanti Neurons Interview Hub';
  appMain.innerHTML = `
    <section class="hero-card">
      <div class="hero-layout">
        <div>
          <span class="badge">Enterprise interview platform</span>
          <h2 class="hero-title">Prepare for the complete Ivanti ecosystem.</h2>
          <p class="hero-copy">This hub is designed for candidates who want more than scattered notes. Learn by role, product line, technical topic, implementation pattern, scripting workflow, real-world scenario and assessment track.</p>
          <div class="hero-actions">
            <a class="primary-button" href="#/roles">Explore roles</a>
            <a class="secondary-button" href="#/modules">Browse modules</a>
            <a class="secondary-button" href="#/quiz">Start quiz</a>
          </div>
          <div class="hero-metrics">
            ${metricTile('Coverage', meta.coverageStatement, 'Built to span Neurons platform, ITSM, UEM, MDM, Endpoint Manager, Velocity, security, integrations and automation.')}
            ${metricTile('Practice assets', `${roles.length + modules.length + topics.length + useCases.length}+`, 'Role guides, module maps, topics, coding patterns and use cases in one place.')}
            ${metricTile('Interview style', 'Scenario-first', 'Balanced mix of fundamentals, admin depth, implementation judgement and troubleshooting.')}
          </div>
        </div>
        <aside class="hero-panel">
          <span class="section-kicker">What this hub covers</span>
          <h3>${meta.promise}</h3>
          <ul class="check-list">
            <li>Role-based preparation tracks for admins, developers, engineers, consultants and architects.</li>
            <li>Module coverage across Neurons platform, service management, endpoint, mobile and operational tools.</li>
            <li>Topic banks for workflows, automation, forms, APIs, policies, enrollment, patching and governance.</li>
            <li>Scenario-driven use cases that mirror how Ivanti projects are discussed in real interviews.</li>
            <li>Quiz mode and bookmarks for quick revision sessions before interviews.</li>
          </ul>
        </aside>
      </div>
    </section>

    <section>
      <div class="section-header">
        <div>
          <span class="section-kicker">Platform paths</span>
          <h2>Choose how you want to prepare</h2>
          <p>Start with a role if you want a guided path. Start with modules if you want breadth. Start with topics if you want deep technical revision.</p>
        </div>
      </div>
      <div class="card-grid">
        <article class="card"><span class="badge">Roles</span><h3>Prepare by job target</h3><p>Identify what a hiring manager expects from an ITSM admin, MDM engineer, endpoint specialist, architect or automation consultant.</p><div class="card-actions"><a class="primary-button" href="#/roles">Open roles</a></div></article>
        <article class="card"><span class="badge">Modules</span><h3>Prepare by product family</h3><p>Map each capability area across Neurons platform, service management, security, endpoint and supply chain workflows.</p><div class="card-actions"><a class="primary-button" href="#/modules">Open modules</a></div></article>
        <article class="card"><span class="badge">Topics</span><h3>Prepare by technical depth</h3><p>Revise the building blocks that usually appear in interviews: automation, APIs, policies, RBAC, forms, patching, compliance and integrations.</p><div class="card-actions"><a class="primary-button" href="#/topics">Open topics</a></div></article>
        <article class="card"><span class="badge">Use cases</span><h3>Prepare like an implementer</h3><p>Walk through automation designs, service workflows, endpoint rollouts, patch scenarios and mobile operations improvements.</p><div class="card-actions"><a class="primary-button" href="#/use-cases">Open use cases</a></div></article>
      </div>
    </section>

    <section>
      <div class="section-header">
        <div>
          <span class="section-kicker">Featured module families</span>
          <h2>Interview coverage across the Ivanti landscape</h2>
        </div>
      </div>
      <div class="module-pill-grid">
        ${modules.slice(0, 8).map(module => `<article class="card"><span class="badge">${module.family}</span><h3>${module.name}</h3><p>${module.summary}</p><div class="card-actions"><a class="primary-button" href="${detailLink('modules', module.id)}">Review</a>${bookmarkButton(module.id)}</div></article>`).join('')}
      </div>
    </section>

    <section class="card">
      <div class="section-header">
        <div>
          <span class="section-kicker">About the platform</span>
          <h2>Why this hub exists</h2>
        </div>
      </div>
      <p>${meta.about}</p>
      <p class="footer-note">Note: add your Google Analytics ID in <code>window.IVANTI_GA_ID</code> inside <code>index.html</code> after deployment if you want site traffic tracking.</p>
    </section>
  `;
}

function renderCollection(type, title, intro, items, renderer) {
  pageTitle.textContent = title;
  appMain.innerHTML = `
    <section class="card">
      <div class="section-header">
        <div>
          <span class="section-kicker">${title}</span>
          <h2>${title}</h2>
          <p>${intro}</p>
        </div>
      </div>
    </section>
    <section class="${type === 'topics' ? 'topic-grid' : type === 'use-cases' || type === 'coding' || type === 'bookmarks' ? 'use-case-grid' : type === 'roles' ? 'role-grid' : 'card-grid'}">
      ${items.map(renderer).join('')}
    </section>
  `;
}

function renderRoles() {
  renderCollection('roles', 'Ivanti roles', 'Use these role paths to align your preparation with what employers usually probe: administration depth, implementation thinking, governance, integrations, troubleshooting and business impact.', state.data.roles, role => `
    <article class="card">
      <div class="meta-row"><span class="badge">${role.track}</span><span class="badge">${role.level}</span></div>
      <h3>${role.name}</h3>
      <p>${role.summary}</p>
      <div class="chips">${role.focusAreas.slice(0,4).map(item => `<span>${item}</span>`).join('')}</div>
      ${cardActionLinks('roles', role.id)}
    </article>
  `);
}

function renderModules() {
  renderCollection('modules', 'Ivanti modules', 'Review the ecosystem by product family so you can answer broad architecture questions and still dive into specific platform mechanics.', state.data.modules, module => `
    <article class="card">
      <div class="meta-row"><span class="badge">${module.family}</span><span class="badge">${module.interviewWeight}</span></div>
      <h3>${module.name}</h3>
      <p>${module.summary}</p>
      <div class="chips">${module.keyCapabilities.slice(0,4).map(item => `<span>${item}</span>`).join('')}</div>
      ${cardActionLinks('modules', module.id)}
    </article>
  `);
}

function renderTopics() {
  renderCollection('topics', 'Ivanti topics', 'This section helps you revise the recurring technical themes that appear across multiple Ivanti products and implementation conversations.', state.data.topics, topic => `
    <article class="card">
      <div class="meta-row"><span class="badge">${topic.category}</span><span class="badge">${topic.difficulty}</span></div>
      <h3>${topic.name}</h3>
      <p>${topic.summary}</p>
      <div class="chips">${topic.interviewAngles.slice(0,4).map(item => `<span>${item}</span>`).join('')}</div>
      ${cardActionLinks('topics', topic.id)}
    </article>
  `);
}

function renderCoding() {
  renderCollection('coding', 'Scripting and integration patterns', 'Ivanti interviews often include automation logic, APIs, validation rules, templates and integration thinking. Use this section to review patterns and scenarios, not just syntax.', state.data.coding, item => `
    <article class="card">
      <div class="meta-row"><span class="badge">${item.type}</span><span class="badge">${item.product}</span></div>
      <h3>${item.name}</h3>
      <p>${item.summary}</p>
      <div class="chips">${item.keyMoves.map(move => `<span>${move}</span>`).join('')}</div>
      ${cardActionLinks('coding', item.id)}
    </article>
  `);
}

function renderUseCases() {
  renderCollection('use-cases', 'Real-world use cases', 'These use cases are designed to sound like project discussions. Practice them until you can explain the problem, configuration approach, risks and expected outcome clearly.', state.data.useCases, item => `
    <article class="card">
      <div class="meta-row"><span class="badge">${item.domain}</span><span class="badge">${item.complexity}</span></div>
      <h3>${item.name}</h3>
      <p>${item.problem}</p>
      <div class="chips">${item.skillsValidated.slice(0,4).map(skill => `<span>${skill}</span>`).join('')}</div>
      ${cardActionLinks('use-cases', item.id)}
    </article>
  `);
}

function renderBookmarks() {
  const bookmarkIds = [...state.bookmarks];
  const allItems = [
    ...state.data.roles.map(item => ({...item, type: 'roles'})),
    ...state.data.modules.map(item => ({...item, type: 'modules'})),
    ...state.data.topics.map(item => ({...item, type: 'topics'})),
    ...state.data.coding.map(item => ({...item, type: 'coding'})),
    ...state.data.useCases.map(item => ({...item, type: 'use-cases'})),
  ];
  const items = allItems.filter(item => bookmarkIds.includes(item.id));
  pageTitle.textContent = 'Bookmarks';
  if (!items.length) {
    appMain.innerHTML = `<section class="bookmark-empty"><h2>No saved items yet</h2><p>Use the save button on any role, module, topic, coding pattern or use case to build your own revision list.</p></section>`;
    return;
  }
  appMain.innerHTML = `<section class="bookmark-grid">${items.map(item => `
    <article class="card">
      <div class="meta-row"><span class="badge">Saved</span><span class="badge">${item.type}</span></div>
      <h3>${item.name}</h3>
      <p>${item.summary || item.problem}</p>
      <div class="card-actions"><a class="primary-button" href="${detailLink(item.type, item.id)}">Open</a>${bookmarkButton(item.id)}</div>
    </article>
  `).join('')}</section>`;
}

function renderQuiz() {
  const questions = state.data.quiz;
  const answeredCount = Object.keys(state.quizAnswers).length;
  const score = questions.reduce((sum, q) => sum + (state.quizAnswers[q.id] === q.correctIndex ? 1 : 0), 0);
  const progress = Math.round((answeredCount / questions.length) * 100);
  pageTitle.textContent = 'Quiz';
  appMain.innerHTML = `
    <section class="quiz-shell">
      <div class="quiz-toolbar">
        <div>
          <span class="section-kicker">Assessment mode</span>
          <h2 style="margin: 8px 0 6px;">Ivanti interview readiness quiz</h2>
          <p class="muted">Mix of platform, service management, endpoint, MDM, Velocity, security and integration questions.</p>
        </div>
        <div style="min-width: 260px; width: min(340px, 100%);">
          <div class="progress-bar"><span style="width:${progress}%"></span></div>
          <p class="muted" style="margin:10px 0 0;">Answered ${answeredCount}/${questions.length} · Score ${score}/${questions.length}</p>
        </div>
      </div>
      ${questions.map((question, index) => {
        const selected = state.quizAnswers[question.id];
        const showFeedback = selected !== undefined;
        return `
          <article class="quiz-question">
            <div class="meta-row"><span class="badge">Question ${index + 1}</span><span class="badge">${question.level}</span><span class="badge">${question.domain}</span></div>
            <h3>${question.question}</h3>
            <div class="answers">
              ${question.options.map((option, optionIndex) => {
                const classes = ['answer-button'];
                if (showFeedback && optionIndex === question.correctIndex) classes.push('correct');
                if (showFeedback && selected === optionIndex && optionIndex !== question.correctIndex) classes.push('incorrect');
                return `<button class="${classes.join(' ')}" data-question-id="${question.id}" data-option-index="${optionIndex}">${option}</button>`;
              }).join('')}
            </div>
            ${showFeedback ? `<div class="answer-explanation"><strong>Why:</strong> ${question.explanation}</div>` : ''}
          </article>
        `;
      }).join('')}
      <div class="card-actions"><button class="secondary-button" id="reset-quiz">Reset quiz</button></div>
    </section>
  `;
}

function renderDetail(section, id) {
  const map = {
    roles: state.data.roles,
    modules: state.data.modules,
    topics: state.data.topics,
    coding: state.data.coding,
    'use-cases': state.data.useCases,
  };
  const item = (map[section] || []).find(entry => entry.id === id);
  if (!item) {
    appMain.innerHTML = `<section class="empty-state"><h2>Not found</h2><p>The item you requested does not exist.</p></section>`;
    return;
  }
  pageTitle.textContent = item.name;

  const blocks = [];
  if (item.focusAreas) blocks.push(detailListBlock('What this role owns', item.focusAreas));
  if (item.mustKnow) blocks.push(detailListBlock('Must-know interview themes', item.mustKnow));
  if (item.scenarios) blocks.push(detailListBlock('Scenario prompts to practice', item.scenarios));
  if (item.keyCapabilities) blocks.push(detailListBlock('Key capabilities', item.keyCapabilities));
  if (item.interviewThemes) blocks.push(detailListBlock('Interview themes', item.interviewThemes));
  if (item.coreTopics) blocks.push(detailListBlock('Core topics', item.coreTopics));
  if (item.interviewAngles) blocks.push(detailListBlock('How interviewers probe it', item.interviewAngles));
  if (item.reviewChecklist) blocks.push(detailListBlock('Review checklist', item.reviewChecklist));
  if (item.keyMoves) blocks.push(detailListBlock('Key moves', item.keyMoves));
  if (item.commonQuestions) blocks.push(detailListBlock('Likely questions', item.commonQuestions));
  if (item.approach) blocks.push(detailListBlock('Implementation approach', item.approach));
  if (item.skillsValidated) blocks.push(detailListBlock('What this validates', item.skillsValidated));

  const rightCol = [];
  if (item.family) rightCol.push(`<span class="badge">${item.family}</span>`);
  if (item.track) rightCol.push(`<span class="badge">${item.track}</span>`);
  if (item.level) rightCol.push(`<span class="badge">${item.level}</span>`);
  if (item.difficulty) rightCol.push(`<span class="badge">${item.difficulty}</span>`);
  if (item.type) rightCol.push(`<span class="badge">${item.type}</span>`);
  if (item.domain) rightCol.push(`<span class="badge">${item.domain}</span>`);
  if (item.complexity) rightCol.push(`<span class="badge">${item.complexity}</span>`);
  if (item.interviewWeight) rightCol.push(`<span class="badge">${item.interviewWeight}</span>`);

  appMain.innerHTML = `
    <section class="detail-shell">
      <div class="detail-top">
        <div>
          <div class="detail-meta">${rightCol.join('')}</div>
          <h2 class="detail-title">${item.name}</h2>
          <p class="detail-copy">${item.summary || item.problem}</p>
          <div class="card-actions">
            <button class="secondary-button back-button">← Back</button>
            ${bookmarkButton(item.id)}
          </div>
        </div>
        <div class="detail-block">
          <h3>How to use this page</h3>
          <p class="detail-copy">Practice this content in your own words. For each section, be ready to explain what the capability does, where it fits, how you would configure it, how you would test it and what could go wrong in production.</p>
          ${item.products ? `<div class="chips">${item.products.map(product => `<span>${product}</span>`).join('')}</div>` : ''}
        </div>
      </div>
      <div class="detail-grid">${blocks.join('')}</div>
    </section>
  `;
}

function detailListBlock(title, items) {
  return `<section class="detail-block"><h3>${title}</h3><ul class="topic-list">${items.map(item => `<li>${item}</li>`).join('')}</ul></section>`;
}

function renderSearch(term) {
  const normalized = term.trim().toLowerCase();
  pageTitle.textContent = `Search: ${term}`;
  if (!normalized) {
    location.hash = '#/home';
    return;
  }
  const dataSets = [
    ['roles', state.data.roles],
    ['modules', state.data.modules],
    ['topics', state.data.topics],
    ['coding', state.data.coding],
    ['use-cases', state.data.useCases],
  ];
  const results = [];
  dataSets.forEach(([type, items]) => {
    items.forEach(item => {
      const haystack = JSON.stringify(item).toLowerCase();
      if (haystack.includes(normalized)) results.push({ type, item });
    });
  });
  appMain.innerHTML = `
    <section class="card">
      <div class="section-header"><div><span class="section-kicker">Search</span><h2>Results for “${term}”</h2><p>${results.length ? 'Open an item below to continue your revision path.' : 'No exact matches found. Try a product name, concept, role, feature or scenario.'}</p></div></div>
    </section>
    <section class="search-results">
      ${results.map(result => `<article class="search-result"><span class="badge">${result.type}</span><h3>${result.item.name}</h3><p>${result.item.summary || result.item.problem}</p><div class="card-actions"><a class="primary-button" href="${detailLink(result.type, result.item.id)}">Open</a>${bookmarkButton(result.item.id)}</div></article>`).join('') || '<div class="empty-state">No results found.</div>'}
    </section>
  `;
}

function toggleBookmark(id) {
  if (state.bookmarks.has(id)) state.bookmarks.delete(id);
  else state.bookmarks.add(id);
  saveBookmarks();
  safeTrack('bookmark_toggle', { item_id: id, saved: state.bookmarks.has(id) });
  router();
}

function router() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [section = 'home', id] = hash.split('/');
  document.querySelectorAll('[data-nav-link]').forEach(link => {
    const target = link.getAttribute('href').replace(/^#\//, '');
    link.classList.toggle('active', target === section || (!hash && target === 'home'));
  });
  sidebar.classList.remove('open');
  if (section === 'search') return renderSearch(decodeURIComponent(id || ''));
  if (id) return renderDetail(section, id);
  switch (section) {
    case 'home': return renderHome();
    case 'roles': return renderRoles();
    case 'modules': return renderModules();
    case 'topics': return renderTopics();
    case 'coding': return renderCoding();
    case 'use-cases': return renderUseCases();
    case 'quiz': return renderQuiz();
    case 'bookmarks': return renderBookmarks();
    default:
      appMain.innerHTML = '<section class="empty-state"><h2>Page not found</h2><p>Use the navigation to continue.</p></section>';
  }
}

appMain.addEventListener('click', event => {
  const bookmarkToggle = event.target.closest('.bookmark-toggle');
  if (bookmarkToggle) {
    toggleBookmark(bookmarkToggle.dataset.bookmarkId);
    return;
  }
  const answerButton = event.target.closest('.answer-button');
  if (answerButton) {
    state.quizAnswers[answerButton.dataset.questionId] = Number(answerButton.dataset.optionIndex);
    safeTrack('quiz_answered', { question_id: answerButton.dataset.questionId });
    renderQuiz();
    return;
  }
  if (event.target.closest('#reset-quiz')) {
    state.quizAnswers = {};
    safeTrack('quiz_reset');
    renderQuiz();
    return;
  }
  if (event.target.closest('.back-button')) {
    history.back();
  }
});

searchForm.addEventListener('submit', event => {
  event.preventDefault();
  const term = searchInput.value.trim();
  if (!term) return;
  safeTrack('search', { search_term: term });
  location.hash = `#/search/${encodeURIComponent(term)}`;
});

mobileNavToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
window.addEventListener('hashchange', router);

async function init() {
  try {
    const responses = await Promise.all([
      fetch('data/meta.json'),
      fetch('data/roles.json'),
      fetch('data/modules.json'),
      fetch('data/topics.json'),
      fetch('data/coding.json'),
      fetch('data/usecases.json'),
      fetch('data/quiz.json')
    ]);
    const [meta, roles, modules, topics, coding, useCases, quiz] = await Promise.all(responses.map(res => res.json()));
    state.data = { meta, roles, modules, topics, coding, useCases, quiz };
    router();
  } catch (error) {
    console.error(error);
    appMain.innerHTML = `<section class="empty-state"><h2>Unable to load the hub</h2><p>Check that all JSON files are present and the project is opened through a local server or GitHub Pages deployment.</p></section>`;
  }
}

init();
