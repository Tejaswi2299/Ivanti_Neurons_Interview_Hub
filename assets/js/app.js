const DATA_FILES = {
  roles: 'data/roles.json',
  modules: 'data/modules.json',
  topics: 'data/topics.json',
  coding: 'data/coding.json',
  usecases: 'data/usecases.json',
  questions: 'data/questions.json',
  skills: 'data/skills.json',
  quiz: 'data/quiz.json'
};

const state = {
  roles: [],
  modules: [],
  topics: [],
  coding: [],
  usecases: [],
  questions: [],
  skills: [],
  quiz: [],
  bookmarks: JSON.parse(localStorage.getItem('ivanti_bookmarks') || '[]'),
  theme: localStorage.getItem('ivanti_theme') || 'light',
  quizIndex: 0,
  quizScore: 0,
  quizAnswered: false
};

const appMain = document.getElementById('app-main');
const pageTitle = document.getElementById('page-title');
const searchForm = document.getElementById('global-search-form');
const searchInput = document.getElementById('global-search-input');
const themeToggle = document.getElementById('theme-toggle');
const sidebar = document.getElementById('sidebar');
const navToggle = document.getElementById('mobile-nav-toggle');

function esc(value = '') {
  return String(value).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  localStorage.setItem('ivanti_theme', theme);
}
setTheme(state.theme);

themeToggle?.addEventListener('click', () => setTheme(state.theme === 'light' ? 'dark' : 'light'));
navToggle?.addEventListener('click', () => sidebar?.classList.toggle('open'));

async function loadData() {
  const entries = await Promise.all(
    Object.entries(DATA_FILES).map(async ([key, path]) => {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`Failed to load ${path}`);
      return [key, await res.json()];
    })
  );
  Object.assign(state, Object.fromEntries(entries));
}

function byId(collection, id) { return collection.find((item) => item.id === id); }
function findBySlug(collection, slug) { return collection.find((item) => item.slug === slug || item.id === slug); }
function moduleById(id) { return byId(state.modules, id); }
function topicById(id) { return byId(state.topics, id); }
function roleById(id) { return byId(state.roles, id); }
function skillById(id) { return byId(state.skills, id); }
function codingById(id) { return byId(state.coding, id); }
function useCaseById(id) { return byId(state.usecases, id); }
function questionById(id) { return byId(state.questions, id); }

function getRoute() {
  const hash = window.location.hash || '#/home';
  const normalized = hash.replace(/^#/, '');
  if (!normalized || normalized === '/') return '/home';
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function setActiveNav(route) {
  const root = route.split('/').length > 2 ? `/${route.split('/')[1]}` : route;
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    const href = link.getAttribute('href')?.replace(/^#/, '') || '';
    link.classList.toggle('active', href === root);
  });
}

function saveBookmarks() {
  localStorage.setItem('ivanti_bookmarks', JSON.stringify(state.bookmarks));
}
function isBookmarked(type, id) {
  return state.bookmarks.some((item) => item.key === `${type}:${id}`);
}
function toggleBookmark(type, id, title) {
  const key = `${type}:${id}`;
  const exists = state.bookmarks.find((item) => item.key === key);
  state.bookmarks = exists ? state.bookmarks.filter((item) => item.key !== key) : [{ key, type, id, title }, ...state.bookmarks];
  saveBookmarks();
  renderRoute();
}
function bookmarkButton(type, id, title) {
  return `<button class="ghost-btn" data-bookmark="1" data-type="${type}" data-id="${id}" data-title="${esc(title)}">${isBookmarked(type, id) ? 'Remove bookmark' : 'Save bookmark'}</button>`;
}

function render(title, html) {
  pageTitle.textContent = title;
  document.title = `${title} | Ivanti Neurons Interview Hub`;
  appMain.innerHTML = html;
  bindCommon();
}

function bindCommon() {
  document.querySelectorAll('[data-go-route]').forEach((btn) => btn.addEventListener('click', () => { window.location.hash = btn.dataset.goRoute; }));
  document.querySelectorAll('[data-bookmark]').forEach((btn) => btn.addEventListener('click', () => toggleBookmark(btn.dataset.type, btn.dataset.id, btn.dataset.title)));
  document.querySelectorAll('[data-back]').forEach((btn) => btn.addEventListener('click', () => history.back()));
  document.querySelectorAll('[data-inline-filter]').forEach((input) => {
    input.addEventListener('input', (event) => {
      const query = event.target.value.trim().toLowerCase();
      const target = document.getElementById(event.target.dataset.target);
      if (!target) return;
      target.querySelectorAll('[data-filterable]').forEach((item) => {
        item.classList.toggle('hidden', !item.textContent.toLowerCase().includes(query));
      });
    });
  });
}

function pageBack(fallback = '#/home') { return `<a class="page-back" href="${fallback}" data-back="1">← Back</a>`; }
function breadcrumbs(items) {
  return `<nav class="breadcrumbs">${items.map((item, index) => `${index ? '<span class="sep">/</span>' : ''}${item.href ? `<a href="${item.href}">${esc(item.label)}</a>` : `<span>${esc(item.label)}</span>`}`).join('')}</nav>`;
}
function tileLink(title, summary, route, meta = '', type = 'tile') {
  return `<a class="tile tile-link ${type}" href="${route}" data-filterable="1"><h3>${esc(title)}</h3><p>${esc(summary)}</p>${meta ? `<div class="tag-row">${meta}</div>` : ''}<div class="action-row" style="margin-top:12px;"><span class="chip-btn">Open path →</span></div></a>`;
}
function rowLink(title, summary, route) {
  return `<a class="row-link" href="${route}"><div class="row-copy"><strong>${esc(title)}</strong><span>${esc(summary)}</span></div><span class="row-arrow">→</span></a>`;
}
function answerCards(questionIds) {
  const questions = questionIds.map(questionById).filter(Boolean);
  if (!questions.length) return '<div class="answer-card"><strong>No tricky questions mapped yet.</strong><span>More questions can be added as the hub expands.</span></div>';
  return `<div class="answer-list">${questions.map((q) => `<div class="answer-card"><strong>${esc(q.text)}</strong><span>${esc(q.answer)}</span></div>`).join('')}</div>`;
}
function skillCards(skillIds) {
  const skills = skillIds.map(skillById).filter(Boolean);
  if (!skills.length) return '<div class="skill-card"><h4>No skill mapping yet</h4><p>More role-specific skill guidance can be added here.</p></div>';
  return `<div class="grid-2">${skills.map((skill) => `<article class="skill-card"><h4>${esc(skill.name)}</h4><p>${esc(skill.summary)}</p></article>`).join('')}</div>`;
}
function accordion(title, subtitle, content, open = false) {
  return `<details class="accordion" ${open ? 'open' : ''}><summary><span class="summary-left"><span><strong>${esc(title)}</strong><small>${esc(subtitle)}</small></span></span><span class="summary-caret">▾</span></summary><div class="accordion-panel">${content}</div></details>`;
}

function homePage() {
  const featuredRoles = state.roles.slice(0, 6);
  const featuredModules = state.modules.slice(0, 6);
  render('Ivanti Neurons Interview Hub', `
    <section class="hero-card">
      <div class="hero-split">
        <article class="hero-copy">
          <span class="section-kicker">Interview preparation hub</span>
          <h2>Prepare by role, module, topic, coding pattern, use case, and tricky interview question.</h2>
          <p>Use the role paths to understand what each Ivanti role focuses on, which modules to learn, which topics to prepare, what coding questions may come up, and which scenario-based questions are worth practicing.</p>
          <div class="action-row">
            <button class="primary-btn" data-go-route="#/roles">Prepare by role</button>
            <button class="secondary-btn" data-go-route="#/modules">Prepare by module</button>
            <button class="secondary-btn" data-go-route="#/topics">Open topic library</button>
          </div>
          <div class="tag-row" style="margin-top:14px;">
            <span class="tag">ITSM</span><span class="tag">UEM</span><span class="tag alt">MDM</span><span class="tag soft">ITAM</span><span class="tag">Discovery</span><span class="tag alt">Velocity</span>
          </div>
        </article>
        <article class="detail-card">
          <h3>How this hub works</h3>
          <ul class="clean-list">
            <li>Open a role to see the exact modules, topics, coding, use cases, skills, and tricky questions for that role.</li>
            <li>Open a module to see what the module does, what topics belong to it, and what scenarios or questions matter most.</li>
            <li>Open any topic to understand what it means, why it matters, what to prepare, and what related questions to practice.</li>
          </ul>
        </article>
      </div>
    </section>
    <section class="stats-grid">
      <article class="stat-card"><div class="stat-value">${state.roles.length}</div><div class="stat-label">Roles</div></article>
      <article class="stat-card"><div class="stat-value">${state.modules.length}</div><div class="stat-label">Modules</div></article>
      <article class="stat-card"><div class="stat-value">${state.topics.length}</div><div class="stat-label">Topics</div></article>
      <article class="stat-card"><div class="stat-value">${state.questions.length}</div><div class="stat-label">Questions</div></article>
    </section>
    <section class="card">
      <div class="section-header"><div><h2>Start by role</h2><p>Open the role path that matches the interview you are preparing for.</p></div></div>
      <div class="grid-3 home-route-grid">${featuredRoles.map((role) => tileLink(role.name, role.summary, `#/roles/${role.slug}`, `<span class="tag">${role.moduleIds.length} modules</span><span class="tag alt">${role.topicIds.length} topics</span>`, 'route-card')).join('')}</div>
    </section>
    <section class="card">
      <div class="section-header"><div><h2>Or jump by module</h2><p>Use modules when you want a product-area-first learning path.</p></div></div>
      <div class="grid-3">${featuredModules.map((module) => tileLink(module.name, module.summary, `#/modules/${module.slug}`, `<span class="tag">${module.topicIds.length} topics</span>`, 'route-card')).join('')}</div>
    </section>
  `);
}

function rolesPage() {
  render('Roles', `${pageBack('#/home')}
    <section class="card"><div class="section-header"><div><h2>Prepare by role</h2><p>Choose a role to open a dedicated preparation page with modules, topics, skills, coding, use cases, and tricky questions.</p></div></div><div class="inline-search"><input data-inline-filter="1" data-target="roles-grid" placeholder="Filter roles..." /></div></section>
    <section id="roles-grid" class="grid-3">${state.roles.map((role) => tileLink(role.name, role.summary, `#/roles/${role.slug}`, `<span class="tag">${role.category}</span><span class="tag alt">${role.moduleIds.length} modules</span>`)).join('')}</section>`);
}

function roleDetailPage(slug) {
  const role = findBySlug(state.roles, slug);
  if (!role) return notFound();
  const modules = role.moduleIds.map(moduleById).filter(Boolean);
  const topics = role.topicIds.map(topicById).filter(Boolean);
  const codingItems = role.codingIds.map(codingById).filter(Boolean);
  const useCases = role.useCaseIds.map(useCaseById).filter(Boolean);
  render(role.name, `${breadcrumbs([{ label: 'Roles', href: '#/roles' }, { label: role.name }])}${pageBack('#/roles')}
    <section class="detail-banner"><span class="section-kicker">${esc(role.category)}</span><h2>${esc(role.name)}</h2><p>${esc(role.summary)}</p><div class="detail-meta"><span class="tag">${role.moduleIds.length} modules</span><span class="tag alt">${role.topicIds.length} topics</span><span class="tag soft">${role.questionIds.length} questions</span></div><div class="action-row" style="margin-top:14px;">${bookmarkButton('role', role.id, role.name)}</div></section>
    <section class="details-stack">
      ${accordion('What this role mainly focuses on', 'Role overview', `<div class="quote-box">${esc(role.summary)}</div>`, true)}
      ${accordion('Skills to prepare', `${role.skillIds.length} mapped skills`, skillCards(role.skillIds))}
      ${accordion('Modules to prepare', `${modules.length} modules`, `<div class="list-stack">${modules.map((module) => rowLink(module.name, module.summary, `#/modules/${module.slug}`)).join('') || '<p>No modules mapped yet.</p>'}</div>`)}
      ${accordion('Topics to prepare', `${topics.length} topics`, `<div class="list-stack">${topics.map((topic) => rowLink(topic.name, topic.summary, `#/topics/${topic.slug}`)).join('') || '<p>No topics mapped yet.</p>'}</div>`)}
      ${accordion('Coding and technical questions', `${codingItems.length} items`, `<div class="list-stack">${codingItems.map((item) => rowLink(item.title, item.summary, `#/coding/${item.slug}`)).join('') || '<p>No coding items mapped yet.</p>'}</div>`)}
      ${accordion('Use case scenarios', `${useCases.length} scenarios`, `<div class="list-stack">${useCases.map((item) => rowLink(item.title, item.problem, `#/use-cases/${item.slug}`)).join('') || '<p>No use cases mapped yet.</p>'}</div>`)}
      ${accordion('Tricky questions to practice', `${role.questionIds.length} questions`, answerCards(role.questionIds))}
    </section>`);
}

function modulesPage() {
  render('Modules', `${pageBack('#/home')}
    <section class="card"><div class="section-header"><div><h2>Prepare by module</h2><p>Open a module to understand what it does, which topics belong to it, and what technical or scenario questions are relevant.</p></div></div><div class="inline-search"><input data-inline-filter="1" data-target="modules-grid" placeholder="Filter modules..." /></div></section>
    <section id="modules-grid" class="grid-3">${state.modules.map((module) => tileLink(module.name, module.summary, `#/modules/${module.slug}`, `<span class="tag">${module.family}</span><span class="tag alt">${module.topicIds.length} topics</span>`)).join('')}</section>`);
}

function moduleDetailPage(slug) {
  const module = findBySlug(state.modules, slug);
  if (!module) return notFound();
  const topics = module.topicIds.map(topicById).filter(Boolean);
  const codingItems = module.codingIds.map(codingById).filter(Boolean);
  const useCases = module.useCaseIds.map(useCaseById).filter(Boolean);
  const roles = module.roleIds.map(roleById).filter(Boolean);
  render(module.name, `${breadcrumbs([{ label: 'Modules', href: '#/modules' }, { label: module.name }])}${pageBack('#/modules')}
    <section class="detail-banner"><span class="section-kicker">${esc(module.family)}</span><h2>${esc(module.name)}</h2><p>${esc(module.summary)}</p><div class="detail-meta"><span class="tag">${topics.length} topics</span><span class="tag alt">${codingItems.length} coding items</span><span class="tag soft">${module.questionIds.length} tricky questions</span></div><div class="action-row" style="margin-top:14px;">${bookmarkButton('module', module.id, module.name)}</div></section>
    <section class="details-stack">
      ${accordion('What this module does', 'Definition', `<div class="quote-box">${esc(module.summary)}</div>`, true)}
      ${accordion('Topics you have to learn', `${topics.length} topics`, `<div class="list-stack">${topics.map((topic) => rowLink(topic.name, topic.summary, `#/topics/${topic.slug}`)).join('') || '<p>No topics mapped yet.</p>'}</div>`)}
      ${accordion('Coding and technical questions', `${codingItems.length} items`, `<div class="list-stack">${codingItems.map((item) => rowLink(item.title, item.summary, `#/coding/${item.slug}`)).join('') || '<p>No coding items mapped yet.</p>'}</div>`)}
      ${accordion('Use case scenarios', `${useCases.length} scenarios`, `<div class="list-stack">${useCases.map((item) => rowLink(item.title, item.problem, `#/use-cases/${item.slug}`)).join('') || '<p>No use cases mapped yet.</p>'}</div>`)}
      ${accordion('Tricky questions to learn', `${module.questionIds.length} questions`, answerCards(module.questionIds))}
      ${accordion('Related roles', `${roles.length} roles`, `<div class="list-stack">${roles.map((role) => rowLink(role.name, role.summary, `#/roles/${role.slug}`)).join('') || '<p>No related roles mapped yet.</p>'}</div>`)}
    </section>`);
}

function topicsPage() {
  const grouped = {};
  state.topics.forEach((topic) => {
    if (!grouped[topic.family]) grouped[topic.family] = [];
    grouped[topic.family].push(topic);
  });
  const familyLabels = {
    'itsm-foundation': 'ITSM foundation topics',
    'itsm-automation': 'ITSM automation topics',
    'itsm-process': 'ITSM process topics',
    'analytics': 'Analytics topics',
    'integration': 'Integration topics',
    'endpoint': 'Endpoint topics',
    'mobility': 'Mobility topics',
    'asset': 'Asset topics',
    'frontline': 'Frontline topics',
    'experience': 'Experience topics',
    'governance': 'Governance topics'
  };
  render('Topics', `${pageBack('#/home')}
    <section class="card"><div class="section-header"><div><h2>Topic library</h2><p>Open a topic to see what it means, why it matters, what to prepare, and which related questions, coding, and use cases to practice.</p></div></div><div class="inline-search"><input data-inline-filter="1" data-target="topics-groups" placeholder="Filter topics..." /></div></section>
    <section id="topics-groups" class="details-stack">${Object.entries(grouped).map(([family, topics]) => accordion(familyLabels[family] || family, `${topics.length} topics`, `<div class="list-stack">${topics.map((topic) => `<div data-filterable="1">${rowLink(topic.name, topic.summary, `#/topics/${topic.slug}`)}</div>`).join('')}</div>`, family === 'itsm-foundation')).join('')}</section>`);
}

function topicDetailPage(slug) {
  const topic = findBySlug(state.topics, slug);
  if (!topic) return notFound();
  const module = moduleById(topic.moduleId);
  const codingItems = topic.codingIds.map(codingById).filter(Boolean);
  const useCases = topic.useCaseIds.map(useCaseById).filter(Boolean);
  const relatedTopics = state.topics.filter((t) => t.moduleId === topic.moduleId && t.id !== topic.id).slice(0, 6);
  render(topic.name, `${breadcrumbs([{ label: 'Topics', href: '#/topics' }, { label: topic.name }])}${pageBack('#/topics')}
    <section class="detail-banner topic-header"><span class="section-kicker">${esc(module?.name || 'Topic')}</span><h2>${esc(topic.name)}</h2><p>${esc(topic.summary)}</p><div class="detail-meta"><span class="tag">${topic.questionIds.length} questions</span><span class="tag alt">${codingItems.length} coding items</span><span class="tag soft">${useCases.length} use cases</span></div><div class="action-row" style="margin-top:14px;">${bookmarkButton('topic', topic.id, topic.name)}</div></section>
    <section class="topic-sections">
      <article class="topic-panel"><h3>What this topic means</h3><div class="quote-box">${esc(topic.meaning)}</div></article>
      <article class="topic-panel"><h3>Why this topic matters</h3><p>${esc(topic.whyItMatters)}</p></article>
      <article class="topic-panel"><h3>What to prepare</h3><ul class="clean-list">${topic.prepare.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></article>
      <article class="topic-panel"><h3>Types, patterns, or angles to remember</h3><div class="tag-row">${(topic.types || []).length ? topic.types.map((type) => `<span class="tag">${esc(type)}</span>`).join('') : '<span class="tag">Core concept</span>'}</div></article>
      <article class="topic-panel"><h3>Related interview questions</h3>${answerCards(topic.questionIds)}</article>
      <article class="topic-panel"><h3>Related coding questions</h3><div class="list-stack">${codingItems.length ? codingItems.map((item) => rowLink(item.title, item.summary, `#/coding/${item.slug}`)).join('') : '<p>No coding items mapped yet.</p>'}</div></article>
      <article class="topic-panel"><h3>Related use case scenarios</h3><div class="list-stack">${useCases.length ? useCases.map((item) => rowLink(item.title, item.problem, `#/use-cases/${item.slug}`)).join('') : '<p>No use cases mapped yet.</p>'}</div></article>
      <article class="topic-panel"><h3>Related topics in the same module</h3><div class="list-stack">${relatedTopics.length ? relatedTopics.map((item) => rowLink(item.name, item.summary, `#/topics/${item.slug}`)).join('') : '<p>No related topics mapped yet.</p>'}</div></article>
    </section>`);
}

function codingPage() {
  render('Coding', `${pageBack('#/home')}
    <section class="card"><div class="section-header"><div><h2>Coding and technical discussion</h2><p>Open a coding item to see what technical angle it covers, what points to mention, and which related questions are connected to it.</p></div></div><div class="inline-search"><input data-inline-filter="1" data-target="coding-grid" placeholder="Filter coding items..." /></div></section>
    <section id="coding-grid" class="grid-2">${state.coding.map((item) => tileLink(item.title, item.summary, `#/coding/${item.slug}`, `<span class="tag">${esc(moduleById(item.moduleId)?.name || 'Technical')}</span>`)).join('')}</section>`);
}

function codingDetailPage(slug) {
  const item = findBySlug(state.coding, slug);
  if (!item) return notFound();
  const module = moduleById(item.moduleId);
  const relatedQuestions = item.questionIds.map(questionById).filter(Boolean);
  const relatedTopics = item.topicIds.map(topicById).filter(Boolean);
  render(item.title, `${breadcrumbs([{ label: 'Coding', href: '#/coding' }, { label: item.title }])}${pageBack('#/coding')}
    <section class="detail-banner"><span class="section-kicker">${esc(module?.name || 'Technical')}</span><h2>${esc(item.title)}</h2><p>${esc(item.summary)}</p><div class="detail-meta"><span class="tag">${relatedQuestions.length} related questions</span><span class="tag alt">${relatedTopics.length} topics</span></div><div class="action-row" style="margin-top:14px;">${bookmarkButton('coding', item.id, item.title)}</div></section>
    <section class="topic-sections">
      <article class="topic-panel"><h3>What to say in the interview</h3><ul class="clean-list">${item.bullets.map((bullet) => `<li>${esc(bullet)}</li>`).join('')}</ul></article>
      <article class="topic-panel"><h3>Related interview questions</h3>${relatedQuestions.length ? answerCards(item.questionIds) : '<p>No related questions mapped yet.</p>'}</article>
      <article class="topic-panel"><h3>Related topics</h3><div class="list-stack">${relatedTopics.length ? relatedTopics.map((topic) => rowLink(topic.name, topic.summary, `#/topics/${topic.slug}`)).join('') : '<p>No related topics mapped yet.</p>'}</div></article>
    </section>`);
}

function useCasesPage() {
  render('Use Cases', `${pageBack('#/home')}
    <section class="card"><div class="section-header"><div><h2>Use case scenarios</h2><p>Practice scenario-based answers with problem, approach, steps, and expected outcomes.</p></div></div><div class="inline-search"><input data-inline-filter="1" data-target="usecases-grid" placeholder="Filter use cases..." /></div></section>
    <section id="usecases-grid" class="grid-2">${state.usecases.map((item) => tileLink(item.title, item.problem, `#/use-cases/${item.slug}`, `<span class="tag">${esc(moduleById(item.moduleId)?.name || 'Scenario')}</span>`)).join('')}</section>`);
}

function useCaseDetailPage(slug) {
  const item = findBySlug(state.usecases, slug);
  if (!item) return notFound();
  const module = moduleById(item.moduleId);
  const relatedQuestions = item.questionIds.map(questionById).filter(Boolean);
  render(item.title, `${breadcrumbs([{ label: 'Use Cases', href: '#/use-cases' }, { label: item.title }])}${pageBack('#/use-cases')}
    <section class="detail-banner"><span class="section-kicker">${esc(module?.name || 'Use case')}</span><h2>${esc(item.title)}</h2><p><strong>Problem:</strong> ${esc(item.problem)}</p><p><strong>Approach:</strong> ${esc(item.approach)}</p><div class="action-row" style="margin-top:14px;">${bookmarkButton('usecase', item.id, item.title)}</div></section>
    <section class="topic-sections">
      <article class="topic-panel"><h3>Implementation steps</h3><ol class="clean-list">${item.steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol></article>
      <article class="topic-panel"><h3>Expected outcome</h3><div class="quote-box">${esc(item.outcome)}</div></article>
      <article class="topic-panel"><h3>Related tricky questions</h3>${relatedQuestions.length ? answerCards(item.questionIds) : '<p>No related questions mapped yet.</p>'}</article>
    </section>`);
}


function routeForBookmark(item) {
  const map = {
    role: state.roles,
    module: state.modules,
    topic: state.topics,
    coding: state.coding,
    usecase: state.usecases
  };
  const collection = map[item.type] || [];
  const found = collection.find((entry) => entry.id === item.id);
  if (!found) return '#/home';
  if (item.type === 'role') return `#/roles/${found.slug}`;
  if (item.type === 'module') return `#/modules/${found.slug}`;
  if (item.type === 'topic') return `#/topics/${found.slug}`;
  if (item.type === 'coding') return `#/coding/${found.slug}`;
  if (item.type === 'usecase') return `#/use-cases/${found.slug}`;
  return '#/home';
}

function bookmarksPage() {
  render('Bookmarks', `${pageBack('#/home')}<section class="card"><div class="section-header"><div><h2>Bookmarks</h2><p>Use bookmarks as your own revision queue while preparing for an interview.</p></div></div>${state.bookmarks.length ? `<div class="list-stack">${state.bookmarks.map((item) => `<article class="tile"><h3>${esc(item.title)}</h3><div class="action-row"><a class="chip-btn" href="${routeForBookmark(item)}">Open path →</a>${bookmarkButton(item.type, item.id, item.title)}</div></article>`).join('')}</div>` : `<div class="empty-state"><h3>No bookmarks yet</h3><p>Save roles, modules, topics, coding items, or use cases while you revise.</p></div>`}</section>`);
}

function quizPage() {
  const q = state.quiz[state.quizIndex];
  if (!q) {
    render('Quiz', `<section class="card empty-state"><h2>No quiz questions available</h2></section>`);
    return;
  }
  render('Quiz', `${pageBack('#/home')}<section class="card"><div class="section-header"><div><h2>Quiz</h2><p>Question ${state.quizIndex + 1} of ${state.quiz.length}</p></div><div class="tag-row"><span class="tag">Score: ${state.quizScore}</span><span class="tag alt">${esc(q.difficulty)}</span></div></div><h3>${esc(q.question)}</h3><div class="list-stack">${q.options.map((option, index) => `<button class="quiz-option" data-quiz-option="${index}">${esc(option)}</button>`).join('')}</div><div id="quiz-feedback" class="topic-panel hidden" style="margin-top:16px;"></div><div class="action-row" style="margin-top:16px;"><button id="next-question" class="primary-btn hidden">Next question</button><button id="reset-quiz" class="secondary-btn">Reset quiz</button></div></section>`);
  const feedback = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('next-question');
  const resetBtn = document.getElementById('reset-quiz');
  document.querySelectorAll('[data-quiz-option]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (state.quizAnswered) return;
      state.quizAnswered = true;
      const selected = Number(btn.dataset.quizOption);
      const correct = q.answerIndex;
      document.querySelectorAll('[data-quiz-option]').forEach((optionBtn, idx) => { if (idx === correct) optionBtn.classList.add('correct'); else if (idx === selected) optionBtn.classList.add('wrong'); });
      if (selected === correct) state.quizScore += 1;
      feedback.classList.remove('hidden');
      feedback.innerHTML = `<h3>${selected === correct ? 'Correct' : 'Not quite'}</h3><p>${esc(q.explanation)}</p>`;
      nextBtn.classList.remove('hidden');
    });
  });
  nextBtn?.addEventListener('click', () => { state.quizIndex = (state.quizIndex + 1) % state.quiz.length; state.quizAnswered = false; quizPage(); });
  resetBtn?.addEventListener('click', () => { state.quizIndex = 0; state.quizScore = 0; state.quizAnswered = false; quizPage(); });
}

function searchPage(query) {
  const q = query.toLowerCase();
  const pool = [
    ...state.roles.map((item) => ({ type: 'Role', title: item.name, summary: item.summary, route: `#/roles/${item.slug}`, body: JSON.stringify(item) })),
    ...state.modules.map((item) => ({ type: 'Module', title: item.name, summary: item.summary, route: `#/modules/${item.slug}`, body: JSON.stringify(item) })),
    ...state.topics.map((item) => ({ type: 'Topic', title: item.name, summary: item.summary, route: `#/topics/${item.slug}`, body: JSON.stringify(item) })),
    ...state.coding.map((item) => ({ type: 'Coding', title: item.title, summary: item.summary, route: `#/coding/${item.slug}`, body: JSON.stringify(item) })),
    ...state.usecases.map((item) => ({ type: 'Use case', title: item.title, summary: item.problem, route: `#/use-cases/${item.slug}`, body: JSON.stringify(item) })),
    ...state.questions.map((item) => ({ type: 'Question', title: item.text, summary: item.answer, route: '#/topics', body: JSON.stringify(item) }))
  ];
  const results = pool.filter((item) => item.body.toLowerCase().includes(q));
  render('Search', `${pageBack('#/home')}<section class="card"><div class="section-header"><div><h2>Search results</h2><p>${results.length} matches for <strong>${esc(query)}</strong></p></div></div>${results.length ? `<div class="list-stack">${results.map((item) => rowLink(`${item.type}: ${item.title}`, item.summary, item.route)).join('')}</div>` : `<div class="empty-state"><h3>No matches found</h3><p>Try broader terms like ITSM, discovery, enrollment, patch, workflow, or roles and permissions.</p></div>`}</section>`);
}

function notFound() {
  render('Page not found', `<section class="card not-found-state"><h2>Page not found</h2><p>The page you tried to open is not available.</p><div class="action-row" style="justify-content:center;"><button class="primary-btn" data-go-route="#/home">Go to home</button></div></section>`);
}

function renderRoute() {
  const route = getRoute();
  setActiveNav(route);
  const parts = route.split('/').filter(Boolean);
  if (route === '/home') return homePage();
  if (route === '/roles') return rolesPage();
  if (parts[0] === 'roles' && parts[1]) return roleDetailPage(parts[1]);
  if (route === '/modules') return modulesPage();
  if (parts[0] === 'modules' && parts[1]) return moduleDetailPage(parts[1]);
  if (route === '/topics') return topicsPage();
  if (parts[0] === 'topics' && parts[1]) return topicDetailPage(parts[1]);
  if (route === '/coding') return codingPage();
  if (parts[0] === 'coding' && parts[1]) return codingDetailPage(parts[1]);
  if (route === '/use-cases') return useCasesPage();
  if (parts[0] === 'use-cases' && parts[1]) return useCaseDetailPage(parts[1]);
  if (route === '/quiz') return quizPage();
  if (route === '/bookmarks') return bookmarksPage();
  return notFound();
}

searchForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;
  searchPage(query);
});
window.addEventListener('hashchange', () => { renderRoute(); sidebar?.classList.remove('open'); });
window.addEventListener('DOMContentLoaded', async () => {
  try {
    if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#') {
      window.location.hash = '#/home';
    }
    await loadData();
    renderRoute();
  } catch (error) {
    console.error(error);
    appMain.innerHTML = `<section class="card empty-state"><h2>Unable to load the hub</h2><p>One or more content files could not be loaded. Check that the project contents were uploaded correctly.</p><p class="footer-note">${esc(error.message)}</p></section>`;
  }
});
