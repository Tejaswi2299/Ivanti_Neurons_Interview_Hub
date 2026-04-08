
const DATA_FILES = {
  roles: 'data/roles.json',
  modules: 'data/modules.json',
  topics: 'data/topics.json',
  coding: 'data/coding.json',
  useCases: 'data/usecases.json',
  quiz: 'data/quiz.json'
};

const state = {
  data: {},
  bookmarks: JSON.parse(localStorage.getItem('ivanti_bookmarks') || '[]'),
  quizIndex: 0,
  quizScore: 0,
  quizAnswered: false,
  quizSelections: [],
  theme: localStorage.getItem('ivanti_theme') || 'light'
};

const appMain = document.getElementById('app-main');
const pageTitle = document.getElementById('page-title');
const searchForm = document.getElementById('global-search-form');
const searchInput = document.getElementById('global-search-input');
const themeToggle = document.getElementById('theme-toggle');
const sidebar = document.getElementById('sidebar');
const navToggle = document.getElementById('mobile-nav-toggle');

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  localStorage.setItem('ivanti_theme', theme);
}

setTheme(state.theme);

themeToggle?.addEventListener('click', () => {
  setTheme(state.theme === 'light' ? 'dark' : 'light');
});

navToggle?.addEventListener('click', () => {
  sidebar?.classList.toggle('open');
});

function escapeHtml(str = '') {
  return String(str).replace(/[&<>\"]/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
}

async function loadData() {
  const entries = await Promise.all(
    Object.entries(DATA_FILES).map(async ([key, path]) => {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`Failed to load ${path}`);
      return [key, await res.json()];
    })
  );
  state.data = Object.fromEntries(entries);
}

function getRoute() {
  const hash = window.location.hash || '#/home';
  const normalized = hash.replace(/^#/, '');
  if (!normalized || normalized === '/') return '/home';
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function setActiveNav(route) {
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    const href = link.getAttribute('href')?.replace(/^#/, '') || '';
    link.classList.toggle('active', href === route);
  });
}

function saveBookmarks() {
  localStorage.setItem('ivanti_bookmarks', JSON.stringify(state.bookmarks));
}

function toggleBookmark(type, id, title) {
  const key = `${type}:${id}`;
  const exists = state.bookmarks.find((x) => x.key === key);
  if (exists) {
    state.bookmarks = state.bookmarks.filter((x) => x.key !== key);
  } else {
    state.bookmarks.unshift({ key, type, id, title });
  }
  saveBookmarks();
  renderRoute();
}

function isBookmarked(type, id) {
  return state.bookmarks.some((x) => x.key === `${type}:${id}`);
}

function renderLayout(title, content) {
  pageTitle.textContent = title;
  appMain.innerHTML = content;
  document.querySelectorAll('[data-bookmark]').forEach((btn) => {
    btn.addEventListener('click', () => {
      toggleBookmark(btn.dataset.type, btn.dataset.id, btn.dataset.title);
    });
  });
  document.querySelectorAll('[data-go-route]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.hash = btn.dataset.goRoute;
    });
  });
  document.querySelectorAll('[data-back]').forEach((btn) => {
    btn.addEventListener('click', () => history.back());
  });
  document.querySelectorAll('[data-inline-filter]').forEach((input) => {
    input.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      const target = document.getElementById(e.target.dataset.target);
      target.querySelectorAll('[data-filterable]').forEach((item) => {
        item.classList.toggle('hidden', !item.textContent.toLowerCase().includes(query));
      });
    });
  });
}

function bookmarkButton(type, id, title) {
  const saved = isBookmarked(type, id);
  return `<button class="secondary-btn" data-bookmark="1" data-type="${type}" data-id="${id}" data-title="${escapeHtml(title)}">${saved ? 'Remove bookmark' : 'Save bookmark'}</button>`;
}

function backRow() {
  return `<div class="page-actions"><button class="secondary-btn" data-back="1">← Back</button></div>`;
}

function renderHome() {
  const roles = state.data.roles || [];
  const modules = state.data.modules || [];
  const topics = state.data.topics || [];
  const useCases = state.data.useCases || [];
  const quiz = state.data.quiz || [];
  renderLayout('Ivanti Neurons Interview Hub', `
    <section class="hero-card">
      <div class="hero-grid">
        <div>
          <span class="meta-kicker">Structured preparation platform</span>
          <h2>Prepare across the full Ivanti ecosystem with one hub.</h2>
          <p>Explore interview preparation by role, by module, by topic, through real-world use cases, coding patterns, and quiz-based revision.</p>
          <div class="page-actions">
            <button class="primary-btn" data-go-route="#/roles">Explore roles</button>
            <button class="secondary-btn" data-go-route="#/modules">Browse modules</button>
          </div>
          <div class="tag-row">
            <span class="tag">ITSM</span>
            <span class="tag">UEM</span>
            <span class="tag">MDM</span>
            <span class="tag">Endpoint Manager</span>
            <span class="tag">Velocity</span>
            <span class="tag">Integrations</span>
          </div>
        </div>
        <div class="card">
          <div class="section-heading">
            <div>
              <h3>How to use this hub</h3>
              <p>Move from overview to depth without losing context.</p>
            </div>
          </div>
          <ol class="question-list">
            <li>Start with roles to understand expectations for each Ivanti position.</li>
            <li>Use modules to study product areas like ITSM, UEM, MDM, Velocity, and automation.</li>
            <li>Use topics and coding pages for implementation-level preparation.</li>
            <li>Practice real scenarios in use cases, then validate yourself with quizzes.</li>
          </ol>
        </div>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card"><div class="stat-value">${roles.length}</div><div class="stat-label">Roles</div></article>
      <article class="stat-card"><div class="stat-value">${modules.length}</div><div class="stat-label">Modules</div></article>
      <article class="stat-card"><div class="stat-value">${topics.length}</div><div class="stat-label">Topics</div></article>
      <article class="stat-card"><div class="stat-value">${useCases.length}</div><div class="stat-label">Use cases</div></article>
    </section>

    <section class="grid-3">
      ${(roles.slice(0,3)).map(role => `
        <article class="role-card">
          <span class="meta-kicker">Featured role</span>
          <h3>${escapeHtml(role.name)}</h3>
          <p>${escapeHtml(role.summary)}</p>
          <div class="tag-row">${role.focus.slice(0,4).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
        </article>
      `).join('')}
    </section>

    <section class="card">
      <div class="section-heading">
        <div>
          <h3>Popular study paths</h3>
          <p>Use these grouped flows when you want focused preparation.</p>
        </div>
      </div>
      <div class="grid-3">
        <article class="mini-card">
          <h4>Admin path</h4>
          <p>Roles → Modules → Topics → Use Cases → Quiz</p>
        </article>
        <article class="mini-card">
          <h4>Developer path</h4>
          <p>Roles → Coding → Topics → Integrations → Use Cases</p>
        </article>
        <article class="mini-card">
          <h4>Consultant path</h4>
          <p>Modules → Role fit → Scenarios → Architecture questions → Quiz</p>
        </article>
      </div>
    </section>

    <section class="card">
      <div class="section-heading">
        <div>
          <h3>Quick access</h3>
          <p>Jump directly into the area you want.</p>
        </div>
      </div>
      <div class="page-actions">
        <button class="primary-btn" data-go-route="#/roles">Roles</button>
        <button class="secondary-btn" data-go-route="#/modules">Modules</button>
        <button class="secondary-btn" data-go-route="#/topics">Topics</button>
        <button class="secondary-btn" data-go-route="#/coding">Coding</button>
        <button class="secondary-btn" data-go-route="#/use-cases">Use Cases</button>
        <button class="secondary-btn" data-go-route="#/quiz">Quiz</button>
      </div>
      <p class="footer-note">Quiz bank size: ${quiz.length} questions.</p>
    </section>
  `);
}

function renderRoles() {
  const items = state.data.roles || [];
  renderLayout('Roles', `
    ${backRow()}
    <section class="card">
      <div class="section-heading">
        <div><h2>Ivanti roles</h2><p>Understand responsibilities, tools, priorities, and the types of questions each role can face.</p></div>
      </div>
      <div class="inline-search">
        <input data-inline-filter="1" data-target="roles-grid" placeholder="Filter roles..." />
      </div>
    </section>
    <section id="roles-grid" class="grid-2">
      ${items.map(item => `
        <article class="role-card" data-filterable="1">
          <span class="meta-kicker">${escapeHtml(item.category)}</span>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.summary)}</p>
          <h4>Core responsibilities</h4>
          <ul class="bullet-list">${item.responsibilities.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
          <h4>Common interview focus</h4>
          <ul class="bullet-list">${item.focus.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
          <div class="page-actions">${bookmarkButton('role', item.id, item.name)}</div>
        </article>
      `).join('')}
    </section>
  `);
}

function renderModules() {
  const items = state.data.modules || [];
  renderLayout('Modules', `
    ${backRow()}
    <section class="card">
      <div class="section-heading">
        <div><h2>Ivanti modules and product areas</h2><p>Study the ecosystem product by product and understand what interviewers expect in each area.</p></div>
      </div>
      <div class="inline-search">
        <input data-inline-filter="1" data-target="modules-grid" placeholder="Filter modules..." />
      </div>
    </section>
    <section id="modules-grid" class="grid-2">
      ${items.map(item => `
        <article class="module-card" data-filterable="1">
          <span class="meta-kicker">${escapeHtml(item.family)}</span>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.summary)}</p>
          <h4>What to know</h4>
          <ul class="bullet-list">${item.mustKnow.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
          <h4>Typical scenarios</h4>
          <ul class="bullet-list">${item.scenarios.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
          <div class="page-actions">${bookmarkButton('module', item.id, item.name)}</div>
        </article>
      `).join('')}
    </section>
  `);
}

function renderTopics() {
  const items = state.data.topics || [];
  renderLayout('Topics', `
    ${backRow()}
    <section class="card">
      <div class="section-heading">
        <div><h2>Topics</h2><p>Use this section for feature-level study and concept revision.</p></div>
      </div>
      <div class="inline-search">
        <input data-inline-filter="1" data-target="topics-grid" placeholder="Filter topics..." />
      </div>
    </section>
    <section id="topics-grid" class="grid-2">
      ${items.map(item => `
        <article class="topic-card" data-filterable="1">
          <span class="meta-kicker">${escapeHtml(item.module)}</span>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.summary)}</p>
          <h4>Key points</h4>
          <ul class="bullet-list">${item.keyPoints.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
          <h4>Interview questions</h4>
          <ul class="bullet-list">${item.questions.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
          <div class="page-actions">${bookmarkButton('topic', item.id, item.name)}</div>
        </article>
      `).join('')}
    </section>
  `);
}

function renderCoding() {
  const items = state.data.coding || [];
  renderLayout('Coding', `
    ${backRow()}
    <section class="card">
      <div class="section-heading">
        <div><h2>Coding and technical implementation</h2><p>Review scripting, APIs, integration patterns, automation logic, and implementation talking points.</p></div>
      </div>
      <div class="inline-search">
        <input data-inline-filter="1" data-target="coding-grid" placeholder="Filter coding topics..." />
      </div>
    </section>
    <section id="coding-grid" class="grid-2">
      ${items.map(item => `
        <article class="topic-card" data-filterable="1">
          <span class="meta-kicker">${escapeHtml(item.area)}</span>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.summary)}</p>
          <h4>What to mention in interviews</h4>
          <ul class="bullet-list">${item.talkingPoints.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
          <h4>Example prompts</h4>
          <ul class="bullet-list">${item.prompts.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
          <div class="page-actions">${bookmarkButton('coding', item.id, item.name)}</div>
        </article>
      `).join('')}
    </section>
  `);
}

function renderUseCases() {
  const items = state.data.useCases || [];
  renderLayout('Use Cases', `
    ${backRow()}
    <section class="card">
      <div class="section-heading">
        <div><h2>Use cases</h2><p>Practice implementation thinking with realistic Ivanti scenarios.</p></div>
      </div>
      <div class="inline-search">
        <input data-inline-filter="1" data-target="usecases-grid" placeholder="Filter use cases..." />
      </div>
    </section>
    <section id="usecases-grid" class="grid-2">
      ${items.map(item => `
        <article class="use-case-card" data-filterable="1">
          <span class="meta-kicker">${escapeHtml(item.module)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p><strong>Problem:</strong> ${escapeHtml(item.problem)}</p>
          <p><strong>Approach:</strong> ${escapeHtml(item.approach)}</p>
          <h4>Implementation outline</h4>
          <ul class="bullet-list">${item.steps.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
          <p><strong>Outcome:</strong> ${escapeHtml(item.outcome)}</p>
          <div class="page-actions">${bookmarkButton('usecase', item.id, item.title)}</div>
        </article>
      `).join('')}
    </section>
  `);
}

function renderQuiz() {
  const quiz = state.data.quiz || [];
  if (!quiz.length) {
    renderLayout('Quiz', `<section class="card empty-state"><h2>No quiz questions available</h2></section>`);
    return;
  }
  if (state.quizIndex >= quiz.length) state.quizIndex = 0;
  const q = quiz[state.quizIndex];
  renderLayout('Quiz', `
    ${backRow()}
    <section class="quiz-card">
      <div class="section-heading">
        <div>
          <h2>Quiz</h2>
          <p>Question ${state.quizIndex + 1} of ${quiz.length}</p>
        </div>
        <div class="tag-row">
          <span class="tag">Score: ${state.quizScore}</span>
          <span class="tag">${escapeHtml(q.level)}</span>
        </div>
      </div>
      <h3>${escapeHtml(q.question)}</h3>
      <div class="quiz-options">
        ${q.options.map((opt, index) => `<button class="quiz-option" data-quiz-option="${index}">${escapeHtml(opt)}</button>`).join('')}
      </div>
      <div id="quiz-feedback" class="result-card hidden"></div>
      <div class="page-actions" style="margin-top:16px;">
        <button id="next-question" class="primary-btn hidden">Next question</button>
        <button id="reset-quiz" class="secondary-btn">Reset quiz</button>
      </div>
    </section>
  `);

  const feedback = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('next-question');
  const resetBtn = document.getElementById('reset-quiz');

  document.querySelectorAll('[data-quiz-option]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (state.quizAnswered) return;
      state.quizAnswered = true;
      const selected = Number(btn.dataset.quizOption);
      const correct = q.answerIndex;
      document.querySelectorAll('[data-quiz-option]').forEach((optionBtn, idx) => {
        optionBtn.classList.add(idx === correct ? 'correct' : idx === selected ? 'wrong' : '');
      });
      if (selected === correct) state.quizScore += 1;
      feedback.classList.remove('hidden');
      feedback.innerHTML = `
        <h4>${selected === correct ? 'Correct' : 'Not quite'}</h4>
        <p>${escapeHtml(q.explanation)}</p>
      `;
      nextBtn.classList.remove('hidden');
    });
  });

  nextBtn?.addEventListener('click', () => {
    state.quizIndex = (state.quizIndex + 1) % quiz.length;
    state.quizAnswered = false;
    renderQuiz();
  });

  resetBtn?.addEventListener('click', () => {
    state.quizIndex = 0;
    state.quizScore = 0;
    state.quizAnswered = false;
    renderQuiz();
  });
}

function renderBookmarks() {
  renderLayout('Bookmarks', `
    ${backRow()}
    <section class="card">
      <div class="section-heading">
        <div><h2>Bookmarks</h2><p>Keep track of the items you want to revisit.</p></div>
      </div>
      ${state.bookmarks.length ? `
        <div class="card-list">
          ${state.bookmarks.map(item => `
            <article class="list-item">
              <span class="meta-kicker">${escapeHtml(item.type)}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p class="muted">Saved for later review.</p>
              <div class="page-actions">
                <button class="secondary-btn" data-bookmark="1" data-type="${item.type}" data-id="${item.id}" data-title="${escapeHtml(item.title)}">Remove bookmark</button>
              </div>
            </article>
          `).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <h3>No bookmarks yet</h3>
          <p>Use the save buttons across roles, modules, topics, coding, and use cases.</p>
        </div>
      `}
    </section>
  `);
}

function renderSearchResults(query) {
  const lower = query.toLowerCase();
  const groups = [
    ['Roles', 'role', state.data.roles || [], 'name'],
    ['Modules', 'module', state.data.modules || [], 'name'],
    ['Topics', 'topic', state.data.topics || [], 'name'],
    ['Coding', 'coding', state.data.coding || [], 'name'],
    ['Use Cases', 'usecase', state.data.useCases || [], 'title']
  ];

  const results = groups.flatMap(([label, type, items, field]) =>
    items
      .filter(item => JSON.stringify(item).toLowerCase().includes(lower))
      .map(item => ({ label, type, id: item.id, title: item[field], summary: item.summary || item.problem || '' }))
  );

  renderLayout('Search results', `
    ${backRow()}
    <section class="card">
      <div class="section-heading">
        <div><h2>Search results</h2><p>${results.length} matches for <code class="inline-code">${escapeHtml(query)}</code></p></div>
      </div>
      ${results.length ? `
        <div class="card-list">
          ${results.map(item => `
            <article class="list-item">
              <span class="meta-kicker">${escapeHtml(item.label)}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.summary)}</p>
              <div class="page-actions">${bookmarkButton(item.type, item.id, item.title)}</div>
            </article>
          `).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <h3>No matches found</h3>
          <p>Try searching with module names, role names, product names, or keywords like API, policy, workflow, patching, or integration.</p>
        </div>
      `}
    </section>
  `);
}

function renderNotFound() {
  renderLayout('Page not found', `
    <section class="card not-found">
      <h2>Page not found</h2>
      <p>The page you tried to open is not available.</p>
      <div class="page-actions" style="justify-content:center;">
        <button class="primary-btn" data-go-route="#/home">Go to home</button>
      </div>
    </section>
  `);
}

function renderRoute() {
  const route = getRoute();
  setActiveNav(route);

  switch (route) {
    case '/home': return renderHome();
    case '/roles': return renderRoles();
    case '/modules': return renderModules();
    case '/topics': return renderTopics();
    case '/coding': return renderCoding();
    case '/use-cases': return renderUseCases();
    case '/quiz': return renderQuiz();
    case '/bookmarks': return renderBookmarks();
    default: return renderNotFound();
  }
}

searchForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;
  renderSearchResults(query);
});

window.addEventListener('hashchange', () => {
  renderRoute();
  sidebar?.classList.remove('open');
});

window.addEventListener('DOMContentLoaded', async () => {
  try {
    if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#') {
      window.location.hash = '#/home';
    }
    await loadData();
    renderRoute();
  } catch (error) {
    appMain.innerHTML = `
      <section class="card empty-state">
        <h2>Unable to load the hub</h2>
        <p>One or more content files could not be loaded. Check that the data and assets folders were uploaded correctly.</p>
        <p class="footer-note">${escapeHtml(error.message)}</p>
      </section>
    `;
  }
});
