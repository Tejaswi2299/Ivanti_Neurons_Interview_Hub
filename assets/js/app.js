
const DATA_FILES = {
  roles: 'data/roles.json',
  modules: 'data/modules.json',
  topics: 'data/topics.json',
  coding: 'data/coding.json',
  usecases: 'data/usecases.json',
  tricky: 'data/tricky.json',
  quiz: 'data/quiz.json'
};

const state = {
  roles: [], modules: [], topics: [], coding: [], usecases: [], tricky: [], quiz: [],
  lookups: {},
  theme: localStorage.getItem('ivanti_theme') || 'light',
  bookmarks: JSON.parse(localStorage.getItem('ivanti_bookmarks') || '[]'),
  quizSession: null
};

const app = document.getElementById('app-main');
const titleNode = document.getElementById('page-title');
const searchForm = document.getElementById('global-search-form');
const searchInput = document.getElementById('global-search-input');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const themeToggle = document.getElementById('theme-toggle');

function esc(v=''){ return String(v).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
function slug(v=''){ return String(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function setTheme(theme){ document.documentElement.setAttribute('data-theme', theme); state.theme = theme; localStorage.setItem('ivanti_theme', theme); }
setTheme(state.theme);
themeToggle?.addEventListener('click',()=> setTheme(state.theme === 'light' ? 'dark' : 'light'));
sidebarToggle?.addEventListener('click',()=> sidebar.classList.toggle('open'));

function saveBookmarks(){ localStorage.setItem('ivanti_bookmarks', JSON.stringify(state.bookmarks)); }
function isBookmarked(type,id){ return state.bookmarks.some(x => x.key === `${type}:${id}`); }
function toggleBookmark(type,id,title){
  const key = `${type}:${id}`;
  const existing = state.bookmarks.find(x => x.key === key);
  state.bookmarks = existing ? state.bookmarks.filter(x => x.key !== key) : [{key, type, id, title}, ...state.bookmarks];
  saveBookmarks();
  renderRoute();
}

async function loadData(){
  const entries = await Promise.all(Object.entries(DATA_FILES).map(async ([key,path])=>{
    const res = await fetch(path);
    if(!res.ok) throw new Error(`Failed to load ${path}`);
    return [key, await res.json()];
  }));
  Object.assign(state, Object.fromEntries(entries));
  state.lookups.roles = Object.fromEntries(state.roles.map(x=>[x.id,x]));
  state.lookups.modules = Object.fromEntries(state.modules.map(x=>[x.id,x]));
  state.lookups.topics = Object.fromEntries(state.topics.map(x=>[x.id,x]));
  state.lookups.coding = Object.fromEntries(state.coding.map(x=>[x.id,x]));
  state.lookups.usecases = Object.fromEntries(state.usecases.map(x=>[x.id,x]));
  state.lookups.tricky = Object.fromEntries(state.tricky.map(x=>[x.id,x]));
}

function ensureGA(){
  if(!window.IVANTI_GA_ID || window.__ivantiGA) return;
  window.__ivantiGA = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${window.IVANTI_GA_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', window.IVANTI_GA_ID);
}
ensureGA();

function routeInfo(){
  const hash = window.location.hash || '#/home';
  const path = hash.replace(/^#/, '') || '/home';
  const [pathname, queryString=''] = path.split('?');
  const query = Object.fromEntries(new URLSearchParams(queryString).entries());
  const segments = pathname.split('/').filter(Boolean);
  return { pathname, query, segments };
}

function setTitle(title){
  titleNode.textContent = title;
  document.title = `${title} | Ivanti Neurons Interview Hub`;
}
function setActiveNav(pathname){
  document.querySelectorAll('[data-nav]').forEach(a=>{
    const href = a.getAttribute('href').replace(/^#/, '');
    const active = href === '/home' ? pathname === '/home' || pathname === '/' : pathname.startsWith(href);
    a.classList.toggle('active', active);
  });
}
function go(path){ window.location.hash = path; }

function itemByCollection(type, id){
  const map = {role:'roles',module:'modules',topic:'topics',coding:'coding',usecase:'usecases',tricky:'tricky'};
  return state.lookups[map[type]]?.[id];
}
function bookmarkBtn(type,id,title){
  const active = isBookmarked(type,id);
  return `<button class="bookmark ${active?'active':''}" data-bookmark="${esc(type)}|${esc(id)}|${esc(title)}">${active?'Saved ★':'Save ★'}</button>`;
}
function backButton(fallback){ return `<button class="button-secondary" data-go="${fallback}">← Back</button>`; }
function footerNav(collection, id, basePath){
  const idx = collection.findIndex(x=>x.id===id);
  const prev = idx>0 ? collection[idx-1] : null;
  const next = idx>=0 && idx<collection.length-1 ? collection[idx+1] : null;
  return `<div class="footer-nav">
    <div>${prev ? `<button class="button-secondary" data-go="${basePath}/${prev.id}">← Previous</button>` : ''}</div>
    <div>${next ? `<button class="button-primary" data-go="${basePath}/${next.id}">Next →</button>` : ''}</div>
  </div>`;
}

function chips(ids, lookupName, routeBase){
  return ids.map(id=>{
    const item = state.lookups[lookupName][id];
    return item ? `<button class="chip-btn" data-go="${routeBase}/${item.id}">${esc(item.name || item.title)}</button>` : '';
  }).join('');
}
function topicCard(t){
  const m = state.lookups.modules[t.moduleId];
  return `<a class="card-link" href="#/topics/${t.id}">
    <div class="list-row">
      <div>
        <div class="small">${esc(m?.name || 'Topic')}</div>
        <h3>${esc(t.name)}</h3>
        <div class="small">${esc(t.summary)}</div>
      </div>
      <div class="chev">›</div>
    </div>
  </a>`;
}
function roleCard(r){
  return `<a class="card-link" href="#/roles/${r.id}">
    <div class="list-row">
      <div>
        <div class="small">${esc(r.group)}</div>
        <h3>${esc(r.name)}</h3>
        <div class="small">${esc(r.summary)}</div>
      </div>
      <div class="chev">›</div>
    </div>
  </a>`;
}
function moduleCard(m){
  return `<a class="card-link" href="#/modules/${m.id}">
    <div class="list-row">
      <div>
        <div class="small">${esc(m.family)}</div>
        <h3>${esc(m.name)}</h3>
        <div class="small">${esc(m.summary)}</div>
      </div>
      <div class="chev">›</div>
    </div>
  </a>`;
}
function codingRow(id){
  const c = state.lookups.coding[id];
  return c ? `<a class="subitem" href="#/coding/${c.id}">
      <div>
        <strong>${esc(c.title)}</strong>
        <div class="submeta">${esc(c.summary)}</div>
      </div>
      <span class="label">Coding</span>
    </a>` : '';
}
function usecaseRow(id){
  const u = state.lookups.usecases[id];
  return u ? `<a class="subitem" href="#/use-cases/${u.id}">
      <div>
        <strong>${esc(u.title)}</strong>
        <div class="submeta">${esc(u.problem)}</div>
      </div>
      <span class="label alt">Use case</span>
    </a>` : '';
}
function trickyRow(id){
  const t = state.lookups.tricky[id];
  return t ? `<details class="accordion"><summary>${esc(t.title)} <span class="label warn">Tricky</span></summary>
      <div class="accordion-body"><p>${esc(t.summary)}</p><div class="result-box">${esc(t.answer)}</div></div>
    </details>` : '';
}
function topicAccordion(ids){
  return ids.map(id=>{
    const t = state.lookups.topics[id];
    if(!t) return '';
    return `<details class="accordion">
      <summary>${esc(t.name)} <span class="small">${esc(state.lookups.modules[t.moduleId]?.name || '')}</span></summary>
      <div class="accordion-body">
        <p>${esc(t.summary)}</p>
        <div class="action-row"><button class="button-secondary" data-go="#/topics/${t.id}">Open topic</button></div>
      </div>
    </details>`;
  }).join('');
}

function homePage(){
  setTitle('Ivanti Neurons Interview Hub');
  const featuredRoles = state.roles.slice(0,6).map(roleCard).join('');
  const featuredModules = state.modules.slice(0,8).map(moduleCard).join('');
  return `
    <section class="panel hero">
      <div class="hero-copy">
        <div class="eyebrow">Role-driven preparation</div>
        <h2>Prepare for Ivanti Neurons interviews by role, module, and topic — with coding, use cases, tricky questions, and quiz practice in one place.</h2>
        <p>This platform is designed for people preparing for Ivanti roles across ITSM, UEM, MDM, ITAM, Discovery, GRC, Workspace, iPaaS, and Velocity.</p>
        <div class="action-row">
          <button class="button-primary" data-go="#/roles">Start with roles</button>
          <button class="button-secondary" data-go="#/modules">Explore modules</button>
          <button class="button-secondary" data-go="#/quiz">Open quiz</button>
        </div>
        <div class="tag-row" style="margin-top:14px">
          <span class="tag">ITSM</span><span class="tag">UEM</span><span class="tag">MDM</span><span class="tag">ITAM</span><span class="tag">Discovery</span><span class="tag">GRC</span><span class="tag">Workspace</span><span class="tag">iPaaS</span><span class="tag">Velocity</span>
        </div>
      </div>
      <div class="panel">
        <div class="section-head"><div><h3>Coverage</h3><p>Current public build coverage.</p></div></div>
        <div class="stats-grid">
          <div class="stat"><div class="stat-value">${state.roles.length}</div><div class="stat-label">Roles</div></div>
          <div class="stat"><div class="stat-value">${state.modules.length}</div><div class="stat-label">Modules</div></div>
          <div class="stat"><div class="stat-value">${state.topics.length}</div><div class="stat-label">Topics</div></div>
          <div class="stat"><div class="stat-value">${state.coding.length + state.usecases.length + state.tricky.length}</div><div class="stat-label">Practice items</div></div>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="section-head"><div><h3>Featured role paths</h3><p>Open a role to see what it focuses on, what to learn, and how to prepare.</p></div></div>
      <div class="cards-3">${featuredRoles}</div>
    </section>

    <section class="panel">
      <div class="section-head"><div><h3>Core Ivanti product areas</h3><p>Official product families and adjacent interview prep paths.</p></div></div>
      <div class="cards-4">${featuredModules}</div>
    </section>
  `;
}

function listPage(kind, heading, desc, collection, cardRenderer){
  setTitle(heading);
  const q = (searchInput.value || '').trim().toLowerCase();
  const filtered = !q ? collection : collection.filter(x => JSON.stringify(x).toLowerCase().includes(q));
  return `
    <section class="panel">
      <div class="section-head"><div><h2>${esc(heading)}</h2><p>${esc(desc)}</p></div></div>
      <input class="filter-input" id="page-filter" type="search" placeholder="Filter this page..." value="${esc(searchInput.value || '')}" />
    </section>
    <section class="${kind === 'roles' || kind === 'modules' || kind === 'topics' ? 'cards-3' : 'cards-2'}">
      ${filtered.map(cardRenderer).join('') || `<section class="panel empty">No matching items.</section>`}
    </section>
  `;
}

function roleDetail(id){
  const r = state.lookups.roles[id];
  if(!r) return notFound();
  setTitle(r.name);
  const modules = r.moduleIds.map(mid=>state.lookups.modules[mid]).filter(Boolean);
  const topics = r.topicIds.map(tid=>state.lookups.topics[tid]).filter(Boolean);
  const codingIds = r.codingIds || [];
  const useCaseIds = r.useCaseIds || [];
  const trickyIds = r.trickyIds || [];
  return `
    <div class="breadcrumbs"><a href="#/roles">Roles</a> / <span>${esc(r.name)}</span></div>
    <div class="backbar">${backButton('#/roles')}</div>
    <section class="panel">
      <div class="topic-bar">
        <div>
          <div class="eyebrow">${esc(r.group)}</div>
          <h2>${esc(r.name)}</h2>
          <p class="muted">${esc(r.summary)}</p>
          <div class="tag-row">${r.skills.map(s=>`<span class="tag">${esc(s)}</span>`).join('')}</div>
        </div>
        <div class="action-row">${bookmarkBtn('role', r.id, r.name)}</div>
      </div>
    </section>

    <section class="panel">
      <div class="section-head"><div><h3>What this role focuses on</h3><p>Use this page as your guided path.</p></div></div>
      <div class="detail-grid">
        <div class="info-card"><h4>Primary modules</h4><div class="tag-row">${modules.map(m=>`<button class="chip-btn" data-go="#/modules/${m.id}">${esc(m.name)}</button>`).join('')}</div></div>
        <div class="info-card"><h4>Skills to prepare</h4><ul>${r.skills.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></div>
      </div>
    </section>

    <section class="panel">
      <div class="section-head"><div><h3>Topics to prepare</h3><p>Open any topic to get definition, patterns, coding, use cases, and tricky questions.</p></div></div>
      <div class="accordion-group">${topicAccordion(r.topicIds)}</div>
    </section>

    <section class="panel">
      <div class="section-head"><div><h3>Coding questions</h3><p>Technical discussion areas linked to this role.</p></div></div>
      <div class="accordion-group">
        <details class="accordion" open>
          <summary>Coding and technical discussion <span class="label">${codingIds.length} items</span></summary>
          <div class="accordion-body"><div class="sublist">${codingIds.map(codingRow).join('') || '<div class="empty">No coding items mapped yet.</div>'}</div></div>
        </details>
      </div>
    </section>

    <section class="panel">
      <div class="section-head"><div><h3>Use case scenarios</h3><p>Implementation-style answers you can use in interviews.</p></div></div>
      <div class="accordion-group">
        <details class="accordion" open>
          <summary>Use cases <span class="label alt">${useCaseIds.length} items</span></summary>
          <div class="accordion-body"><div class="sublist">${useCaseIds.map(usecaseRow).join('') || '<div class="empty">No use cases mapped yet.</div>'}</div></div>
        </details>
      </div>
    </section>

    <section class="panel">
      <div class="section-head"><div><h3>Tricky questions</h3><p>Differences and interview traps often asked around this role.</p></div></div>
      <div class="accordion-group">${trickyIds.map(trickyRow).join('') || '<div class="empty">No tricky questions mapped yet.</div>'}</div>
    </section>

    ${footerNav(state.roles, r.id, '#/roles')}
  `;
}

function moduleDetail(id){
  const m = state.lookups.modules[id];
  if(!m) return notFound();
  setTitle(m.name);
  const roles = state.roles.filter(r => (r.moduleIds||[]).includes(m.id));
  return `
    <div class="breadcrumbs"><a href="#/modules">Modules</a> / <span>${esc(m.name)}</span></div>
    <div class="backbar">${backButton('#/modules')}</div>
    <section class="panel">
      <div class="topic-bar">
        <div>
          <div class="eyebrow">${esc(m.family)}</div>
          <h2>${esc(m.name)}</h2>
          <p class="muted">${esc(m.summary)}</p>
        </div>
        <div class="topic-kpis">
          <span class="kpi-chip">${m.topicIds.length} topics</span>
          <span class="kpi-chip">${m.codingIds.length} coding</span>
          <span class="kpi-chip">${m.useCaseIds.length} use cases</span>
          <span class="kpi-chip">${m.trickyIds.length} tricky</span>
        </div>
      </div>
      <div class="action-row" style="margin-top:14px">${bookmarkBtn('module', m.id, m.name)}</div>
    </section>

    <section class="panel split-grid">
      <div class="info-card">
        <h4>What this module does</h4>
        <p>${esc(m.whyItMatters)}</p>
      </div>
      <div class="info-card">
        <h4>Roles that should prepare this module</h4>
        <div class="tag-row">${roles.map(r=>`<button class="chip-btn" data-go="#/roles/${r.id}">${esc(r.name)}</button>`).join('') || '<span class="muted">No roles mapped.</span>'}</div>
      </div>
    </section>

    <section class="panel">
      <div class="section-head"><div><h3>Topics to learn</h3><p>Open each topic for a deeper interview-prep page.</p></div></div>
      <div class="cards-3">${m.topicIds.map(id=>topicCard(state.lookups.topics[id])).join('')}</div>
    </section>

    <section class="panel detail-grid">
      <div>
        <div class="section-head"><div><h3>Coding questions</h3></div></div>
        <div class="accordion-group"><details class="accordion" open><summary>Module-linked coding <span class="label">${m.codingIds.length}</span></summary><div class="accordion-body"><div class="sublist">${m.codingIds.map(codingRow).join('') || '<div class="empty">No coding items.</div>'}</div></div></details></div>
      </div>
      <div>
        <div class="section-head"><div><h3>Use case scenarios</h3></div></div>
        <div class="accordion-group"><details class="accordion" open><summary>Module-linked use cases <span class="label alt">${m.useCaseIds.length}</span></summary><div class="accordion-body"><div class="sublist">${m.useCaseIds.map(usecaseRow).join('') || '<div class="empty">No use cases.</div>'}</div></div></details></div>
      </div>
    </section>

    <section class="panel">
      <div class="section-head"><div><h3>Tricky questions</h3></div></div>
      <div class="accordion-group">${m.trickyIds.map(trickyRow).join('') || '<div class="empty">No tricky items.</div>'}</div>
    </section>

    ${footerNav(state.modules, m.id, '#/modules')}
  `;
}

function topicDetail(id){
  const t = state.lookups.topics[id];
  if(!t) return notFound();
  const module = state.lookups.modules[t.moduleId];
  setTitle(t.name);
  const relatedTopics = state.topics.filter(x => x.moduleId === t.moduleId && x.id !== t.id).slice(0,6);
  return `
    <div class="breadcrumbs"><a href="#/topics">Topics</a> / <a href="#/modules/${module.id}">${esc(module.name)}</a> / <span>${esc(t.name)}</span></div>
    <div class="backbar">${backButton('#/topics')}</div>

    <section class="panel">
      <div class="topic-bar">
        <div>
          <div class="eyebrow">Topic explanation</div>
          <h2>${esc(t.name)}</h2>
          <p class="muted">${esc(module.name)}</p>
        </div>
        <div class="topic-kpis">
          <span class="kpi-chip">${t.questions.length} interview questions</span>
          <span class="kpi-chip">${t.codingIds.length} coding</span>
          <span class="kpi-chip">${t.useCaseIds.length} use cases</span>
          <span class="kpi-chip">${t.trickyIds.length} tricky</span>
        </div>
      </div>
    </section>

    <section class="topic-top-grid">
      <div class="info-card">
        <h4>Definition</h4>
        <p>${esc(t.definition)}</p>
      </div>
      <div class="info-card">
        <h4>Why it matters</h4>
        <p>${esc(t.whyItMatters)}</p>
      </div>
    </section>

    <section class="detail-grid">
      <div class="info-card">
        <h4>Types / patterns</h4>
        <ul>${t.types.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
      </div>
      <div class="info-card">
        <h4>Interview questions to prepare</h4>
        <ul>${t.questions.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
      </div>
    </section>

    <section class="detail-grid">
      <div class="info-card">
        <h4>Related coding questions</h4>
        <div class="sublist">${t.codingIds.map(codingRow).join('') || '<div class="empty">No coding linked.</div>'}</div>
      </div>
      <div class="info-card">
        <h4>Related use case scenarios</h4>
        <div class="sublist">${t.useCaseIds.map(usecaseRow).join('') || '<div class="empty">No use cases linked.</div>'}</div>
      </div>
    </section>

    <section class="panel">
      <div class="section-head"><div><h3>Tricky questions</h3></div><div>${bookmarkBtn('topic', t.id, t.name)}</div></div>
      <div class="accordion-group">${t.trickyIds.map(trickyRow).join('') || '<div class="empty">No tricky items.</div>'}</div>
    </section>

    <section class="panel">
      <div class="section-head"><div><h3>Related topics</h3><p>Continue deeper in the same module.</p></div></div>
      <div class="cards-3">${relatedTopics.map(topicCard).join('') || '<div class="empty">No related topics.</div>'}</div>
    </section>

    ${footerNav(state.topics, t.id, '#/topics')}
  `;
}

function codingPage(){
  setTitle('Coding');
  return `
    <section class="panel">
      <div class="section-head"><div><h2>Coding questions</h2><p>Use these to explain technical patterns, automation logic, and integration thinking in interviews.</p></div></div>
    </section>
    <section class="cards-2">
      ${state.coding.map(c=>`<a class="card-link" href="#/coding/${c.id}"><div class="small">${esc(c.area)}</div><h3>${esc(c.title)}</h3><div class="small">${esc(c.summary)}</div></a>`).join('')}
    </section>
  `;
}
function codingDetail(id){
  const c = state.lookups.coding[id];
  if(!c) return notFound();
  const topic = state.lookups.topics[c.topicId];
  const module = state.lookups.modules[c.moduleId];
  setTitle(c.title);
  return `
    <div class="breadcrumbs"><a href="#/coding">Coding</a> / <span>${esc(c.title)}</span></div>
    <div class="backbar">${backButton('#/coding')}</div>
    <section class="split-grid">
      <div class="panel">
        <h2>${esc(c.title)}</h2>
        <p class="muted">${esc(c.summary)}</p>
        <div class="action-row"><span class="label">Coding</span><span class="label warn">${esc(c.difficulty)}</span></div>

        <div class="info-card" style="margin-top:16px">
          <h4>Technical questions to prepare</h4>
          <ul>${c.questions.map(q=>`<li>${esc(q)}</li>`).join('')}</ul>
        </div>

        <div class="info-card" style="margin-top:16px">
          <h4>Interview-ready pattern</h4>
          <div class="codebox">${esc(c.codeSnippet || 'Explain the structure, validation, logging, and safe execution path.')}</div>
        </div>
      </div>

      <div class="panel">
        <h3>Metadata</h3>
        <div class="meta-stack">
          <div><div class="eyebrow">Module</div><button class="chip-btn" data-go="#/modules/${module.id}">${esc(module.name)}</button></div>
          <div><div class="eyebrow">Topic</div><button class="chip-btn" data-go="#/topics/${topic.id}">${esc(topic.name)}</button></div>
          <div><div class="eyebrow">Bookmark</div>${bookmarkBtn('coding', c.id, c.title)}</div>
        </div>
      </div>
    </section>
    ${footerNav(state.coding, c.id, '#/coding')}
  `;
}

function useCasePage(){
  setTitle('Use Cases');
  return `
    <section class="panel">
      <div class="section-head"><div><h2>Use case scenarios</h2><p>Scenario-driven prep so you can answer implementation questions in a structured way.</p></div></div>
    </section>
    <section class="cards-2">
      ${state.usecases.map(u=>`<a class="card-link" href="#/use-cases/${u.id}"><div class="small">${esc(state.lookups.modules[u.moduleId]?.name || 'Use case')}</div><h3>${esc(u.title)}</h3><div class="small">${esc(u.problem)}</div></a>`).join('')}
    </section>
  `;
}
function useCaseDetail(id){
  const u = state.lookups.usecases[id];
  if(!u) return notFound();
  const module = state.lookups.modules[u.moduleId];
  setTitle(u.title);
  return `
    <div class="breadcrumbs"><a href="#/use-cases">Use Cases</a> / <span>${esc(u.title)}</span></div>
    <div class="backbar">${backButton('#/use-cases')}</div>
    <section class="split-grid">
      <div class="panel">
        <h2>${esc(u.title)}</h2>
        <div class="action-row"><span class="label alt">Use case</span><span class="label warn">${esc(u.difficulty)}</span></div>
        <div class="info-card" style="margin-top:16px"><h4>Problem</h4><p>${esc(u.problem)}</p></div>
        <div class="info-card" style="margin-top:16px"><h4>Approach</h4><p>${esc(u.approach)}</p></div>
        <div class="info-card" style="margin-top:16px"><h4>Outcome</h4><p>${esc(u.outcome)}</p></div>
      </div>
      <div class="panel">
        <h3>Metadata</h3>
        <div class="meta-stack">
          <div><div class="eyebrow">Module</div><button class="chip-btn" data-go="#/modules/${module.id}">${esc(module.name)}</button></div>
          <div><div class="eyebrow">Related topics</div><div class="tag-row">${u.topicIds.map(id=>`<button class="chip-btn" data-go="#/topics/${id}">${esc(state.lookups.topics[id]?.name || id)}</button>`).join('')}</div></div>
          <div><div class="eyebrow">Bookmark</div>${bookmarkBtn('usecase', u.id, u.title)}</div>
        </div>
      </div>
    </section>
    ${footerNav(state.usecases, u.id, '#/use-cases')}
  `;
}

function bookmarksPage(){
  setTitle('Bookmarks');
  const items = state.bookmarks.map(b=>{
    const typeMap = {role:'roles',module:'modules',topic:'topics',coding:'coding',usecase:'usecases'};
    const item = state.lookups[typeMap[b.type]]?.[b.id];
    if(!item) return null;
    const href = b.type === 'usecase' ? `#/use-cases/${item.id}` : `#/${b.type === 'role' ? 'roles' : b.type === 'module' ? 'modules' : b.type}/${item.id}`;
    return { title: item.name || item.title, href, type: b.type };
  }).filter(Boolean);
  return `
    <section class="panel">
      <div class="section-head"><div><h2>Bookmarks</h2><p>Your saved role, module, topic, coding, and use case pages.</p></div></div>
    </section>
    <section class="cards-2">
      ${items.length ? items.map(x=>`<a class="card-link" href="${x.href}"><div class="small">${esc(x.type)}</div><h3>${esc(x.title)}</h3></a>`).join('') : '<section class="panel empty">No bookmarks yet.</section>'}
    </section>
  `;
}

function quizSetup(){
  setTitle('Quiz');
  return `
    <section class="panel">
      <div class="section-head"><div><h2>Quiz</h2><p>Use quiz mode for recall practice. You can move next/previous or exit anytime.</p></div></div>
      <div class="action-row">
        <button class="button-primary" id="start-quiz">Start quiz</button>
      </div>
    </section>
  `;
}
function startQuiz(){
  state.quizSession = { index: 0, answers: {}, submitted: false };
  renderRoute();
}
function quizRunner(){
  const s = state.quizSession;
  if(!s) return quizSetup();
  if(s.submitted) return quizResults();
  const q = state.quiz[s.index];
  return `
    <section class="panel quiz-shell">
      <div class="quiz-progress"><span>Question ${s.index+1} of ${state.quiz.length}</span><span>Exit anytime</span></div>
      <h2>${esc(q.question)}</h2>
      <div class="quiz-choices">
        ${q.choices.map((c,i)=>`<button class="quiz-choice ${s.answers[s.index]===i?'selected':''}" data-answer="${i}">${esc(c)}</button>`).join('')}
      </div>
      <div class="backbar">
        <div class="action-row">
          <button class="button-secondary" data-quiz="prev">Previous</button>
          <button class="button-secondary" data-quiz="exit">Exit</button>
        </div>
        <div class="action-row">
          ${s.index === state.quiz.length-1 ? `<button class="button-primary" data-quiz="submit">Submit quiz</button>` : `<button class="button-primary" data-quiz="next">Next</button>`}
        </div>
      </div>
    </section>
  `;
}
function quizResults(){
  const s = state.quizSession;
  let correct = 0;
  state.quiz.forEach((q, i)=>{ if(s.answers[i] === q.answerIndex) correct += 1; });
  return `
    <section class="panel">
      <div class="section-head"><div><h2>Quiz results</h2><p>You scored ${correct} out of ${state.quiz.length}.</p></div></div>
      <div class="stats-grid">
        <div class="stat"><div class="stat-value">${correct}</div><div class="stat-label">Correct</div></div>
        <div class="stat"><div class="stat-value">${state.quiz.length-correct}</div><div class="stat-label">Incorrect</div></div>
        <div class="stat"><div class="stat-value">${Math.round((correct/state.quiz.length)*100)}%</div><div class="stat-label">Score</div></div>
        <div class="stat"><div class="stat-value">${state.quiz.length}</div><div class="stat-label">Total</div></div>
      </div>
      <div class="action-row" style="margin-top:16px">
        <button class="button-secondary" data-quiz="restart">Restart</button>
        <button class="button-primary" data-quiz="exit">Exit quiz</button>
      </div>
    </section>
    <section class="cards-2">
      ${state.quiz.map((q,i)=>`<section class="search-item">
        <div class="list-row"><strong>${esc(q.question)}</strong><span class="label ${s.answers[i]===q.answerIndex?'alt':'warn'}">${s.answers[i]===q.answerIndex?'Correct':'Review'}</span></div>
        <p class="muted"><strong>Correct answer:</strong> ${esc(q.choices[q.answerIndex])}</p>
        <p class="muted">${esc(q.explanation)}</p>
      </section>`).join('')}
    </section>
  `;
}
function searchPage(query){
  setTitle('Search results');
  const q = query.toLowerCase();
  const items = [];
  state.roles.forEach(r=>items.push({type:'Role', title:r.name, text:JSON.stringify(r), href:`#/roles/${r.id}`, summary:r.summary}));
  state.modules.forEach(m=>items.push({type:'Module', title:m.name, text:JSON.stringify(m), href:`#/modules/${m.id}`, summary:m.summary}));
  state.topics.forEach(t=>items.push({type:'Topic', title:t.name, text:JSON.stringify(t), href:`#/topics/${t.id}`, summary:t.summary}));
  state.coding.forEach(c=>items.push({type:'Coding', title:c.title, text:JSON.stringify(c), href:`#/coding/${c.id}`, summary:c.summary}));
  state.usecases.forEach(u=>items.push({type:'Use case', title:u.title, text:JSON.stringify(u), href:`#/use-cases/${u.id}`, summary:u.problem}));
  state.tricky.forEach(t=>items.push({type:'Tricky', title:t.title, text:JSON.stringify(t), href:`#/topics/${t.topicId}`, summary:t.summary}));
  const results = items.filter(x=>x.text.toLowerCase().includes(q));
  return `
    <section class="panel">
      <div class="section-head"><div><h2>Search results</h2><p>${results.length} matches for "${esc(query)}"</p></div></div>
    </section>
    <section class="cards-2">
      ${results.length ? results.map(r=>`<a class="search-item" href="${r.href}"><div class="small">${esc(r.type)}</div><h3>${esc(r.title)}</h3><div class="small">${esc(r.summary)}</div></a>`).join('') : '<section class="panel empty">No matching items found.</section>'}
    </section>
  `;
}

function notFound(){
  setTitle('Not found');
  return `<section class="panel empty"><h2>Page not found</h2><p>The route you opened is not available.</p><div class="action-row"><button class="button-primary" data-go="#/home">Go home</button></div></section>`;
}

function renderRoute(){
  const route = routeInfo();
  setActiveNav(route.pathname);
  const [root, id] = route.segments;
  searchInput.value = route.query.q || '';
  let html = '';
  if(!root || root === 'home') html = homePage();
  else if(root === 'roles' && !id) html = listPage('roles','Roles','Choose a role path and open the related prep journey.',state.roles,roleCard);
  else if(root === 'roles' && id) html = roleDetail(id);
  else if(root === 'modules' && !id) html = listPage('modules','Modules','Browse product areas and open their linked prep pages.',state.modules,moduleCard);
  else if(root === 'modules' && id) html = moduleDetail(id);
  else if(root === 'topics' && !id) html = listPage('topics','Topics','Open a topic page to study definition, patterns, coding, use cases, and tricky questions.',state.topics,topicCard);
  else if(root === 'topics' && id) html = topicDetail(id);
  else if(root === 'coding' && !id) html = codingPage();
  else if(root === 'coding' && id) html = codingDetail(id);
  else if(root === 'use-cases' && !id) html = useCasePage();
  else if(root === 'use-cases' && id) html = useCaseDetail(id);
  else if(root === 'quiz') html = state.quizSession ? quizRunner() : quizSetup();
  else if(root === 'bookmarks') html = bookmarksPage();
  else if(root === 'search') html = searchPage(route.query.q || '');
  else html = notFound();
  app.innerHTML = html;
  bindPage();
  window.scrollTo({top:0, behavior:'auto'});
}

function bindPage(){
  app.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click', ()=> go(btn.dataset.go)));
  app.querySelectorAll('[data-bookmark]').forEach(btn=>btn.addEventListener('click', ()=>{
    const [type,id,title] = btn.dataset.bookmark.split('|');
    toggleBookmark(type,id,title);
  }));
  app.querySelector('#page-filter')?.addEventListener('input', (e)=>{
    searchInput.value = e.target.value;
    renderRoute();
  });
  app.querySelector('#start-quiz')?.addEventListener('click', startQuiz);
  app.querySelectorAll('[data-answer]').forEach(btn=>btn.addEventListener('click', ()=>{
    const idx = Number(btn.dataset.answer);
    state.quizSession.answers[state.quizSession.index] = idx;
    renderRoute();
  }));
  app.querySelectorAll('[data-quiz]').forEach(btn=>btn.addEventListener('click', ()=>{
    const action = btn.dataset.quiz;
    if(action === 'prev') state.quizSession.index = Math.max(0, state.quizSession.index - 1);
    if(action === 'next') state.quizSession.index = Math.min(state.quiz.length - 1, state.quizSession.index + 1);
    if(action === 'submit') state.quizSession.submitted = true;
    if(action === 'restart') state.quizSession = { index:0, answers:{}, submitted:false };
    if(action === 'exit') state.quizSession = null;
    renderRoute();
  }));
}

searchForm?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const q = searchInput.value.trim();
  if(q) go(`#/search?q=${encodeURIComponent(q)}`);
});
window.addEventListener('hashchange', ()=>{ renderRoute(); sidebar.classList.remove('open'); });

(async function init(){
  try{
    await loadData();
    if(!window.location.hash) go('#/home');
    else renderRoute();
  }catch(err){
    app.innerHTML = `<section class="panel"><h2>Unable to load</h2><p>${esc(err.message)}</p></section>`;
  }
})();
