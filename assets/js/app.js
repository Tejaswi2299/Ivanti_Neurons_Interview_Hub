
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

function announcePage(message){
  let node = document.getElementById('sr-announcer');
  if(!node){
    node = document.createElement('div');
    node.id = 'sr-announcer';
    node.setAttribute('aria-live','polite');
    node.setAttribute('aria-atomic','true');
    node.className = 'hidden';
    document.body.appendChild(node);
  }
  node.textContent = message;
}

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
  titleNode.textContent = title; announcePage(title);
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

function priorityTone(priority=''){ const p=(priority||'').toLowerCase(); return p === 'core' ? 'core' : p === 'advanced' ? 'advanced' : 'important'; }
function priorityChip(priority='Important'){ return `<span class="priority-chip ${priorityTone(priority)}">${esc(priority)}</span>`; }
function detailSubnav(items){ return `<nav class="detail-subnav">${items.map(item=>`<a href="#${item.id}">${esc(item.label)}</a>`).join('')}</nav>`; }
function questionCluster(data){
  if(!data) return '';
  const direct = Array.isArray(data) ? data : (data.direct || []);
  const followUp = Array.isArray(data) ? [] : (data.followUp || []);
  const trap = Array.isArray(data) ? [] : (data.trapQuestions || []);
  return `<div class="detail-grid compact-grid question-cluster">
    <div class="info-card"><h4>Direct questions</h4>${renderBulletList(direct, 'No direct questions listed yet.')}</div>
    <div class="info-card"><h4>Follow-up questions</h4>${renderBulletList(followUp, 'No follow-up questions listed yet.')}</div>
    <div class="info-card"><h4>Trap questions</h4>${renderBulletList(trap, 'No trap questions listed yet.')}</div>
  </div>`;
}
function answerFrameworkCard(title, steps){ return `<div class="info-card"><h4>${esc(title)}</h4>${renderBulletList(steps, 'No framework available yet.')}</div>`; }
function expandSearchTerms(query=''){
  const q = query.toLowerCase().trim();
  const map = {
    'rbac':'roles permissions role-based access roles and permissions',
    'api auth':'authentication patterns auth token oauth api key',
    'asset sync':'reconciliation normalization inventory and discovery data mapping',
    'saved search':'saved searches reporting dashboards',
    'patching':'patch management patch rings rollout',
    'mobile app':'app deployment mobile app distribution',
    'workspace':'workspace actions analyst 360 shift-left',
    'ipaas':'ivanti neurons ipaas integrations connectors',
    'byod':'ownership models enrollment compliance rules'
  };
  let expanded = q;
  Object.entries(map).forEach(([key,val])=>{ if(q.includes(key)) expanded += ' ' + val; });
  return expanded.trim();
}
function collectQuizItems(filters={}){
  return state.quiz.filter(item=>{
    if(filters.roleId && !(item.roleIds || []).includes(filters.roleId)) return false;
    if(filters.moduleId && !(item.moduleIds || []).includes(filters.moduleId)) return false;
    if(filters.topicId && !(item.topicIds || []).includes(filters.topicId)) return false;
    if(filters.difficulty && item.difficulty !== filters.difficulty) return false;
    return true;
  });
}
function footerNav(collection, id, basePath){
  const idx = collection.findIndex(x=>x.id===id);
  const prev = idx>0 ? collection[idx-1] : null;
  const next = idx>=0 && idx<collection.length-1 ? collection[idx+1] : null;
  return `<div class="footer-nav">
    <div>${prev ? `<button class="button-secondary" data-go="${basePath}/${prev.id}">← Previous</button>` : ''}</div>
    <div>${next ? `<button class="button-primary" data-go="${basePath}/${next.id}">Next →</button>` : ''}</div>
  </div>`;
}


function renderBulletList(items, empty='No additional guidance available yet.'){
  return items && items.length ? `<ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : `<p class="muted">${esc(empty)}</p>`;
}
function renderTagButtons(items, routeBase){
  return items && items.length ? `<div class="tag-row">${items.map(item=>`<button class="chip-btn" data-go="${routeBase}/${item.id}">${esc(item.name || item.title)}</button>`).join('')}</div>` : '<div class="empty">No linked items yet.</div>';
}

function chips(ids, lookupName, routeBase){
  return ids.map(id=>{
    const item = state.lookups[lookupName][id];
    return item ? `<button class="chip-btn" data-go="${routeBase}/${item.id}">${esc(item.name || item.title)}</button>` : '';
  }).join('');
}
function topicCard(t){
  const m = state.lookups.modules[t.moduleId];
  return `<a class="entity-card compact" href="#/topics/${t.id}">
    <div class="entity-card-top">
      <span class="entity-badge">${esc(m?.name || 'Topic')}</span>
      <div class="entity-top-actions">${priorityChip(t.priority)}<span class="entity-arrow">Open topic →</span></div>
    </div>
    <div class="entity-card-body">
      <h3>${esc(t.name)}</h3>
      <p>${esc(t.summary)}</p>
    </div>
    <div class="entity-metrics">
      <span>${(t.questions || []).length} questions</span>
      <span>${(t.codingIds || []).length} coding</span>
      <span>${(t.trickyIds || []).length} tricky</span>
    </div>
  </a>`;
}
function roleCard(r){
  const moduleCount = (r.moduleIds || []).length;
  const topicCount = (r.topicIds || []).length;
  const useCaseCount = (r.useCaseIds || []).length;
  return `<a class="entity-card" href="#/roles/${r.id}">
    <div class="entity-card-top">
      <span class="entity-badge">${esc(r.group)}</span>
      <div class="entity-top-actions">${priorityChip(r.priority)}<span class="entity-arrow">Open path →</span></div>
    </div>
    <div class="entity-card-body">
      <h3>${esc(r.name)}</h3>
      <p>${esc(r.summary)}</p>
    </div>
    <div class="entity-metrics">
      <span>${moduleCount} modules</span>
      <span>${topicCount} topics</span>
      <span>${useCaseCount} use cases</span>
    </div>
  </a>`;
}
function moduleCard(m){
  const topicCount = (m.topicIds || []).length;
  const codingCount = (m.codingIds || []).length;
  return `<a class="entity-card" href="#/modules/${m.id}">
    <div class="entity-card-top">
      <span class="entity-badge">${esc(m.family)}</span>
      <div class="entity-top-actions">${priorityChip(m.priority)}<span class="entity-arrow">Open module →</span></div>
    </div>
    <div class="entity-card-body">
      <h3>${esc(m.name)}</h3>
      <p>${esc(m.summary)}</p>
    </div>
    <div class="entity-metrics">
      <span>${topicCount} topics</span>
      <span>${codingCount} coding</span>
      <span>${(m.useCaseIds || []).length} use cases</span>
    </div>
  </a>`;
}
function codingRow(id){
  const c = state.lookups.coding[id];
  return c ? `<a class="subitem" href="#/coding/${c.id}">
      <div class="subitem-copy">
        <strong>${esc(c.title)}</strong>
        <div class="submeta">${esc(c.summary)}</div>
      </div>
      <span class="label">Coding</span>
    </a>` : '';
}
function usecaseRow(id){
  const u = state.lookups.usecases[id];
  return u ? `<a class="subitem" href="#/use-cases/${u.id}">
      <div class="subitem-copy">
        <strong>${esc(u.title)}</strong>
        <div class="submeta">${esc(u.problem)}</div>
      </div>
      <span class="label alt">Use case</span>
    </a>` : '';
}
function trickyRow(id){
  const t = state.lookups.tricky[id];
  return t ? `<details class="accordion tricky-accordion">
      <summary>
        <div class="accordion-title-wrap">
          <strong>${esc(t.title)}</strong>
          <span class="small">Interview trap</span>
        </div>
        <span class="label warn">Tricky</span>
      </summary>
      <div class="accordion-body rich-accordion-body">
        <p>${esc(t.summary)}</p>
        <div class="result-box">${esc(t.answer)}</div>
        <div class="detail-grid compact-grid" style="margin-top:14px">
          <div class="info-card">
            <h4>Why people confuse this</h4>
            <p>${esc(t.whyPeopleConfuseThis || 'Understand where the overlap creates confusion.')}</p>
          </div>
          <div class="info-card">
            <h4>How to answer clearly</h4>
            <p>${esc(t.howToAnswerClearly || 'Define both sides, name the difference, then give a practical example.')}</p>
          </div>
        </div>
        <div class="detail-grid compact-grid" style="margin-top:14px">
          <div class="info-card">
            <h4>Example framing</h4>
            <p>${esc(t.example || 'Use one concrete scenario to explain the distinction.')}</p>
          </div>
          <div class="info-card">
            <h4>Watch out</h4>
            <p>${esc(t.watchOut || 'Avoid answering too generically.')}</p>
          </div>
        </div>
      </div>
    </details>` : '';
}
function topicAccordion(ids){
  return ids.map(id=>{
    const t = state.lookups.topics[id];
    if(!t) return '';
    const moduleName = state.lookups.modules[t.moduleId]?.name || '';
    return `<details class="accordion">
      <summary>
        <div class="accordion-title-wrap">
          <strong>${esc(t.name)}</strong>
          <span class="small">${esc(moduleName)}</span>
        </div>
        <span class="accordion-action">Open</span>
      </summary>
      <div class="accordion-body rich-accordion-body">
        <p>${esc(t.definition || t.summary)}</p>
        <div class="tag-row">
          <span class="tag">${(t.questions || []).length} interview questions</span>
          <span class="tag">${(t.codingIds || []).length} coding</span>
          <span class="tag">${(t.useCaseIds || []).length} use cases</span>
          <span class="tag">${(t.trickyIds || []).length} tricky</span>
        </div>
        <div class="info-card" style="margin-top:14px">
          <h4>Why it matters</h4>
          <p>${esc(t.whyItMatters || t.summary)}</p>
        </div>
        <div class="action-row">
          <button class="button-secondary" data-go="#/topics/${t.id}">Open topic</button>
        </div>
      </div>
    </details>`;
  }).join('');
}
function homePage(){
  setTitle('Ivanti Neurons Interview Hub');
  const featuredRoles = state.roles.slice(0,6).map(roleCard).join('');
  const featuredModules = state.modules.slice(0,6).map(moduleCard).join('');
  const bookmarksCount = state.bookmarks.length;
  return `
    <section class="hero-shell">
      <section class="hero-panel">
        <div class="hero-copy">
          <div class="eyebrow">Enterprise interview preparation platform</div>
          <h2>Prepare for Ivanti Neurons interviews by role, module, and topic — then move into coding, use cases, and tricky questions without leaving the same learning path.</h2>
          <p>This hub is built for real preparation: choose a target role, open the mapped modules, drill into topics, and practice the technical and scenario questions interviewers usually explore.</p>
          <div class="action-row">
            <button class="button-primary" data-go="#/roles">Start with roles</button>
            <button class="button-secondary" data-go="#/modules">Browse modules</button>
            <button class="button-secondary" data-go="#/quiz">Take a quiz</button>
          </div>
          <div class="tag-row" style="margin-top:16px">
            <span class="tag">ITSM</span><span class="tag">UEM</span><span class="tag">MDM</span><span class="tag">ITAM</span><span class="tag">Discovery</span><span class="tag">GRC</span><span class="tag">Workspace</span><span class="tag">iPaaS</span><span class="tag">Velocity</span>
          </div>
        </div>
        <aside class="hero-rail">
          <div class="metric-card">
            <span class="metric-label">Roles</span>
            <strong>${state.roles.length}</strong>
            <p>Role-based learning paths</p>
          </div>
          <div class="metric-card">
            <span class="metric-label">Modules</span>
            <strong>${state.modules.length}</strong>
            <p>Product and capability coverage</p>
          </div>
          <div class="metric-card">
            <span class="metric-label">Topics</span>
            <strong>${state.topics.length}</strong>
            <p>Interview-specific explanations</p>
          </div>
          <div class="metric-card">
            <span class="metric-label">Saved</span>
            <strong>${bookmarksCount}</strong>
            <p>Your current bookmark queue</p>
          </div>
        </aside>
      </section>

      <section class="panel section-panel">
        <div class="section-head">
          <div>
            <h3>How to use the platform</h3>
            <p>Start from a role if you want guided preparation, or jump straight into a module if you already know your focus area.</p>
          </div>
        </div>
        <div class="journey-grid">
          <div class="journey-step"><strong>1</strong><span>Choose a role</span></div>
          <div class="journey-step"><strong>2</strong><span>Open the mapped modules</span></div>
          <div class="journey-step"><strong>3</strong><span>Learn the topics</span></div>
          <div class="journey-step"><strong>4</strong><span>Practice coding and use cases</span></div>
          <div class="journey-step"><strong>5</strong><span>Review tricky questions and quiz</span></div>
        </div>
      </section>
    </section>

    <section class="panel section-panel">
      <div class="section-head">
        <div><h3>Featured role paths</h3><p>Open a role path to see the modules, topics, coding questions, use cases, and tricky areas that matter most.</p></div>
      </div>
      <div class="cards-3">${featuredRoles}</div>
    </section>

    <section class="panel section-panel">
      <div class="section-head">
        <div><h3>Explore by module</h3><p>Use module pages if you want product-oriented preparation.</p></div>
      </div>
      <div class="cards-3">${featuredModules}</div>
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
  const codingIds = r.codingIds || [];
  const useCaseIds = r.useCaseIds || [];
  const trickyIds = r.trickyIds || [];
  return `
    <div class="breadcrumbs"><a href="#/roles">Roles</a> / <span>${esc(r.name)}</span></div>
    <div class="backbar">${backButton('#/roles')}</div>
    ${detailSubnav([{id:'role-overview',label:'Overview'},{id:'role-topics',label:'Topics'},{id:'role-coding',label:'Coding'},{id:'role-usecases',label:'Use Cases'},{id:'role-tricky',label:'Tricky'}])}
    <section class="panel" id="role-overview">
      <div class="topic-bar">
        <div>
          <div class="eyebrow">${esc(r.group)}</div>
          <h2>${esc(r.name)}</h2>
          <p class="muted">${esc(r.summary)}</p>
          <div class="tag-row">${priorityChip(r.priority)}${r.skills.map(s=>`<span class="tag">${esc(s)}</span>`).join('')}</div>
        </div>
        <div class="action-row">${bookmarkBtn('role', r.id, r.name)}</div>
      </div>
    </section>
    <section class="panel">
      <div class="section-head"><div><h3>What this role focuses on</h3><p>Use this page as your guided path.</p></div></div>
      <div class="detail-grid compact-grid">
        <div class="info-card"><h4>Primary modules</h4><div class="tag-row">${modules.map(m=>`<button class="chip-btn" data-go="#/modules/${m.id}">${esc(m.name)}</button>`).join('')}</div></div>
        <div class="info-card"><h4>Recommended study order</h4>${renderBulletList(r.studyOrder, 'Start with the core modules and interview questions first.')}</div>
      </div>
      <div class="detail-grid compact-grid" style="margin-top:16px">
        ${answerFrameworkCard('How to answer role questions', r.answerFramework)}
        <div class="info-card"><h4>What interviewers usually ask</h4>${renderBulletList(r.whatInterviewersUsuallyAsk, 'No commonly asked prompts listed yet.')}</div>
      </div>
    </section>
    <section class="panel" id="role-topics">
      <div class="section-head"><div><h3>Topics to prepare</h3><p>Open any topic to get definition, patterns, coding, use cases, and tricky questions.</p></div></div>
      <div class="accordion-group">${topicAccordion(r.topicIds)}</div>
    </section>
    <section class="panel" id="role-coding">
      <div class="section-head"><div><h3>Coding questions</h3><p>Technical discussion areas linked to this role.</p></div></div>
      <div class="accordion-group"><details class="accordion" open><summary>Coding and technical discussion <span class="label">${codingIds.length} items</span></summary><div class="accordion-body"><div class="sublist">${codingIds.map(codingRow).join('') || '<div class="empty">No coding items mapped yet.</div>'}</div></div></details></div>
    </section>
    <section class="panel" id="role-usecases">
      <div class="section-head"><div><h3>Use case scenarios</h3><p>Implementation-style answers you can use in interviews.</p></div></div>
      <div class="accordion-group"><details class="accordion" open><summary>Use cases <span class="label alt">${useCaseIds.length} items</span></summary><div class="accordion-body"><div class="sublist">${useCaseIds.map(usecaseRow).join('') || '<div class="empty">No use cases mapped yet.</div>'}</div></div></details></div>
    </section>
    <section class="panel" id="role-tricky">
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
    ${detailSubnav([{id:'module-overview',label:'Overview'},{id:'module-topics',label:'Topics'},{id:'module-coding',label:'Coding'},{id:'module-usecases',label:'Use Cases'},{id:'module-tricky',label:'Tricky'}])}
    <section class="panel hero-mini" id="module-overview">
      <div class="topic-bar">
        <div>
          <div class="eyebrow">${esc(m.family)}</div>
          <h2>${esc(m.name)}</h2>
          <p class="muted">${esc(m.summary)}</p>
        </div>
        <div class="topic-kpis">${priorityChip(m.priority)}<span class="kpi-chip">${m.topicIds.length} topics</span><span class="kpi-chip">${m.codingIds.length} coding</span><span class="kpi-chip">${m.useCaseIds.length} use cases</span><span class="kpi-chip">${m.trickyIds.length} tricky</span></div>
      </div>
      <div class="action-row" style="margin-top:14px">${bookmarkBtn('module', m.id, m.name)}</div>
    </section>
    <section class="panel split-grid section-panel">
      <div class="info-card"><h4>What this module does</h4><p>${esc(m.whyItMatters)}</p></div>
      <div class="info-card"><h4>Roles that should prepare this module</h4><div class="tag-row">${roles.map(r=>`<button class="chip-btn" data-go="#/roles/${r.id}">${esc(r.name)}</button>`).join('') || '<span class="muted">No roles mapped.</span>'}</div></div>
    </section>
    <section class="panel section-panel"><div class="detail-grid compact-grid">${answerFrameworkCard('How to answer module questions', m.answerFramework)}<div class="info-card"><h4>What interviewers usually ask</h4>${renderBulletList(m.whatInterviewersUsuallyAsk, 'No commonly asked prompts listed yet.')}</div></div></section>
    <section class="panel section-panel" id="module-topics"><div class="section-head"><div><h3>Topics to learn</h3><p>Open a topic for definitions, interview questions, coding, use cases, and tricky areas.</p></div></div><div class="accordion-group">${topicAccordion(m.topicIds)}</div></section>
    <section class="detail-grid" id="module-coding">
      <section class="panel section-panel"><div class="section-head"><div><h3>Coding questions</h3><p>Technical discussions connected to this module.</p></div></div><div class="sublist">${m.codingIds.map(codingRow).join('') || '<div class="empty">No coding items.</div>'}</div></section>
      <section class="panel section-panel" id="module-usecases"><div class="section-head"><div><h3>Use case scenarios</h3><p>Implementation stories and scenario answers linked to this module.</p></div></div><div class="sublist">${m.useCaseIds.map(usecaseRow).join('') || '<div class="empty">No use cases.</div>'}</div></section>
    </section>
    <section class="panel section-panel" id="module-tricky"><div class="section-head"><div><h3>Tricky questions</h3><p>Differences and traps often asked in interviews.</p></div></div><div class="accordion-group">${m.trickyIds.map(trickyRow).join('') || '<div class="empty">No tricky items.</div>'}</div></section>
    ${footerNav(state.modules, m.id, '#/modules')}
  `;
}
function topicDetail(id){
  const t = state.lookups.topics[id];
  if(!t) return notFound();
  const module = state.lookups.modules[t.moduleId];
  setTitle(t.name);
  const relatedTopics = state.topics.filter(x => x.moduleId === t.moduleId && x.id !== t.id).slice(0,6);
  const relatedRoles = state.roles.filter(r => (r.topicIds || []).includes(t.id));
  return `
    <div class="breadcrumbs"><a href="#/topics">Topics</a> / <a href="#/modules/${module.id}">${esc(module.name)}</a> / <span>${esc(t.name)}</span></div>
    <div class="backbar">${backButton('#/topics')}</div>
    ${detailSubnav([{id:'topic-overview',label:'Overview'},{id:'topic-questions',label:'Questions'},{id:'topic-coding',label:'Coding'},{id:'topic-usecases',label:'Use Cases'},{id:'topic-tricky',label:'Tricky'}])}
    <section class="panel hero-mini" id="topic-overview">
      <div class="topic-bar">
        <div>
          <div class="eyebrow">Topic explanation</div>
          <h2>${esc(t.name)}</h2>
          <p class="muted">${esc(module.name)}</p>
        </div>
        <div class="topic-kpis">${priorityChip(t.priority)}<span class="kpi-chip">${t.questions.length} interview questions</span><span class="kpi-chip">${t.codingIds.length} coding</span><span class="kpi-chip">${t.useCaseIds.length} use cases</span><span class="kpi-chip">${t.trickyIds.length} tricky</span></div>
      </div>
      <div class="action-row" style="margin-top:14px">${bookmarkBtn('topic', t.id, t.name)}</div>
    </section>
    <section class="detail-grid">
      <div class="panel section-panel"><div class="section-head"><div><h3>Definition</h3></div></div><p>${esc(t.definition)}</p></div>
      <div class="panel section-panel"><div class="section-head"><div><h3>Why it matters in interviews</h3></div></div><p>${esc(t.whyItMatters)}</p></div>
    </section>
    <section class="detail-grid compact-grid">
      <div class="panel section-panel"><div class="section-head"><div><h3>Interview context</h3></div></div><p>${esc(t.interviewContext || 'Understand how interviewers use this topic to test your practical understanding.')}</p></div>
      <div class="panel section-panel"><div class="section-head"><div><h3>Related roles</h3></div></div>${t.relatedRoleNames?.length ? `<div class="tag-row">${t.relatedRoleNames.map(name=>`<span class="tag">${esc(name)}</span>`).join('')}</div>` : renderTagButtons(relatedRoles, '#/roles')}</div>
    </section>
    <section class="detail-grid" id="topic-questions">
      <div class="panel section-panel"><div class="section-head"><div><h3>Types and patterns</h3></div></div>${renderBulletList(t.types, 'No types listed yet.')}</div>
      <div class="panel section-panel"><div class="section-head"><div><h3>Interview questions to prepare</h3></div></div>${renderBulletList(t.questions, 'No interview questions listed yet.')}</div>
    </section>
    <section class="panel section-panel">${questionCluster(t.whatInterviewersUsuallyAsk)}</section>
    <section class="detail-grid compact-grid">${answerFrameworkCard('How to answer topic questions', t.answerFramework)}<div class="info-card"><h4>What good answers should show</h4>${renderBulletList(t.whatGoodAnswersShow, 'No answer guidance available yet.')}</div></section>
    <section class="detail-grid compact-grid"><div class="info-card"><h4>Common mistakes to avoid</h4>${renderBulletList(t.commonMistakes, 'No common mistakes listed yet.')}</div><div class="info-card"><h4>Prep checklist</h4>${renderBulletList(t.prepChecklist, 'No checklist items listed yet.')}</div></section>
    <section class="detail-grid" id="topic-coding"><section class="panel section-panel"><div class="section-head"><div><h3>Related coding questions</h3><p>Open the linked technical areas to prepare code-oriented discussion points.</p></div></div><div class="sublist">${t.codingIds.map(codingRow).join('') || '<div class="empty">No coding linked.</div>'}</div></section><section class="panel section-panel" id="topic-usecases"><div class="section-head"><div><h3>Related use case scenarios</h3><p>Practice realistic implementation answers linked to this topic.</p></div></div><div class="sublist">${t.useCaseIds.map(usecaseRow).join('') || '<div class="empty">No use cases linked.</div>'}</div></section></section>
    <section class="panel section-panel" id="topic-tricky"><div class="section-head"><div><h3>Tricky questions</h3><p>These are the distinctions that usually catch candidates out.</p></div></div><div class="accordion-group">${t.trickyIds.map(trickyRow).join('') || '<div class="empty">No tricky items.</div>'}</div></section>
    <section class="panel section-panel"><div class="section-head"><div><h3>Related topics</h3><p>Stay in the same module and continue the learning path.</p></div></div><div class="cards-3">${relatedTopics.map(topicCard).join('') || '<div class="empty">No related topics.</div>'}</div></section>
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
          ${renderBulletList(c.questions, 'No technical questions listed yet.')}
        </div>

        <div class="detail-grid compact-grid" style="margin-top:16px">
          <div class="info-card">
            <h4>What the interviewer is testing</h4>
            <p>${esc(c.interviewerIsTesting || 'Technical understanding, implementation thinking, and communication clarity.')}</p>
          </div>
          <div class="info-card">
            <h4>When to use this</h4>
            <p>${esc(c.whenToUse || 'Use this when the interview moves from concept to implementation detail.')}</p>
          </div>
        </div>

        <div class="info-card" style="margin-top:16px">
          <h4>Implementation steps</h4>
          ${renderBulletList(c.implementationSteps, 'No implementation steps listed yet.')}
        </div>

        <div class="info-card" style="margin-top:16px">
          <h4>Interview-ready pattern</h4>
          <div class="codebox">${esc(c.codeSnippet || 'Explain the structure, validation, logging, and safe execution path.')}</div>
        </div>

        <div class="detail-grid compact-grid" style="margin-top:16px">
          <div class="info-card">
            <h4>Common mistakes</h4>
            ${renderBulletList(c.commonMistakes, 'No common mistakes listed yet.')}
          </div>
          <div class="info-card">
            <h4>Expected outcome</h4>
            <p>${esc(c.expectedOutcome || 'Explain the expected business and operational result clearly.')}</p>
          </div>
        </div>

        <div class="detail-grid compact-grid" style="margin-top:16px">
          <div class="info-card">
            <h4>Verbal answer framework</h4>
            ${renderBulletList(c.verbalAnswerFramework, 'No verbal framework listed yet.')}
          </div>
          <div class="info-card">
            <h4>Follow-up questions to expect</h4>
            ${renderBulletList(c.followUpQuestions, 'No follow-up questions listed yet.')}
          </div>
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

        <div class="detail-grid compact-grid" style="margin-top:16px">
          <div class="info-card">
            <h4>What the interviewer is testing</h4>
            <p>${esc(u.interviewerIsTesting || 'Practical design thinking, sequencing, validation, and business outcome awareness.')}</p>
          </div>
          <div class="info-card">
            <h4>How to answer in interview</h4>
            <p>${esc(u.howToAnswerInInterview || 'Frame the answer as problem, capability, flow, validation, and outcome.')}</p>
          </div>
        </div>

        <div class="info-card" style="margin-top:16px">
          <h4>Implementation steps</h4>
          ${renderBulletList(u.implementationSteps, 'No implementation steps listed yet.')}
        </div>

        <div class="detail-grid compact-grid" style="margin-top:16px">
          <div class="info-card">
            <h4>Validation checklist</h4>
            ${renderBulletList(u.validationChecklist, 'No validation checklist listed yet.')}
          </div>
          <div class="info-card">
            <h4>Common pitfalls</h4>
            ${renderBulletList(u.commonPitfalls, 'No pitfalls listed yet.')}
          </div>
        </div>
      </div>
      <div class="panel">
        <h3>Metadata</h3>
        <div class="meta-stack">
          <div><div class="eyebrow">Module</div><button class="chip-btn" data-go="#/modules/${module.id}">${esc(module.name)}</button></div>
          <div><div class="eyebrow">Related topics</div><div class="tag-row">${u.topicIds.map(id=>`<button class="chip-btn" data-go="#/topics/${id}">${esc(state.lookups.topics[id]?.name || id)}</button>`).join('')}</div></div>
          <div><div class="eyebrow">Bookmark</div>${bookmarkBtn('usecase', u.id, u.title)}</div>
          <div><div class="eyebrow">Topic names</div><div class="tag-row">${(u.relatedTopicNames || []).map(name=>`<span class="tag">${esc(name)}</span>`).join('')}</div></div>
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
  const roleOptions = state.roles.map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('');
  const moduleOptions = state.modules.map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join('');
  const topicOptions = state.topics.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('');
  return `
    <section class="panel">
      <div class="section-head"><div><h2>Quiz</h2><p>Use quiz mode for recall practice. Filter by role, module, topic, or difficulty, then review only the questions you missed.</p></div></div>
      <form id="quiz-setup-form" class="quiz-meta-form">
        <select name="roleId"><option value="">All roles</option>${roleOptions}</select>
        <select name="moduleId"><option value="">All modules</option>${moduleOptions}</select>
        <select name="topicId"><option value="">All topics</option>${topicOptions}</select>
        <select name="difficulty"><option value="">All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
        <select name="count"><option value="10">10 questions</option><option value="15">15 questions</option><option value="20">20 questions</option></select>
        <button class="button-primary" type="submit">Start quiz</button>
      </form>
    </section>
  `;
}
function startQuiz(filters={}){
  const pool = collectQuizItems(filters);
  const count = Math.min(Number(filters.count || 10), pool.length || 0);
  const items = (count ? pool.slice(0, count) : pool);
  state.quizSession = { index: 0, answers: {}, submitted: false, items, filters, resultsFilter: 'all' };
  renderRoute();
}
function quizRunner(){
  const s = state.quizSession;
  if(!s) return quizSetup();
  if(s.submitted) return quizResults();
  const q = s.items[s.index];
  if(!q) return `<section class="panel empty"><h2>No quiz questions match this filter.</h2><p>Choose broader filters and try again.</p><div class="action-row"><button class="button-primary" data-quiz="exit">Back to setup</button></div></section>`;
  return `
    <section class="panel quiz-shell">
      <div class="quiz-progress"><span>Question ${s.index+1} of ${s.items.length}</span><span>Exit anytime</span></div>
      <div class="tag-row" style="margin-bottom:12px">${q.difficulty ? `<span class="tag">${esc(q.difficulty)}</span>`:''}${(q.roleIds||[]).slice(0,1).map(id=>state.lookups.roles[id]).filter(Boolean).map(r=>`<span class="tag">${esc(r.name)}</span>`).join('')}${(q.moduleIds||[]).slice(0,1).map(id=>state.lookups.modules[id]).filter(Boolean).map(m=>`<span class="tag">${esc(m.name)}</span>`).join('')}</div>
      <h2>${esc(q.question)}</h2>
      <div class="quiz-choices">
        ${q.choices.map((c,i)=>`<button class="quiz-choice ${s.answers[s.index]===i?'selected':''}" data-answer="${i}">${esc(c)}</button>`).join('')}
      </div>
      <div class="backbar">
        <div class="action-row"><button class="button-secondary" data-quiz="prev">Previous</button><button class="button-secondary" data-quiz="exit">Exit</button></div>
        <div class="action-row">${s.index === s.items.length-1 ? `<button class="button-primary" data-quiz="submit">Submit quiz</button>` : `<button class="button-primary" data-quiz="next">Next</button>`}</div>
      </div>
    </section>
  `;
}
function quizResults(){
  const s = state.quizSession;
  let correct = 0;
  s.items.forEach((q, i)=>{ if(s.answers[i] === q.answerIndex) correct += 1; });
  const allResults = s.items.map((q,i)=>({q, correct: s.answers[i]===q.answerIndex, answer: s.answers[i]}));
  const shown = s.resultsFilter === 'wrong' ? allResults.filter(x=>!x.correct) : allResults;
  return `
    <section class="panel">
      <div class="section-head"><div><h2>Quiz results</h2><p>You scored ${correct} out of ${s.items.length}.</p></div></div>
      <div class="stats-grid"><div class="stat"><div class="stat-value">${correct}</div><div class="stat-label">Correct</div></div><div class="stat"><div class="stat-value">${s.items.length-correct}</div><div class="stat-label">Incorrect</div></div><div class="stat"><div class="stat-value">${Math.round((correct/Math.max(1,s.items.length))*100)}%</div><div class="stat-label">Score</div></div><div class="stat"><div class="stat-value">${s.items.length}</div><div class="stat-label">Total</div></div></div>
      <div class="action-row quiz-review-controls" style="margin-top:16px"><button class="button-secondary" data-quiz="show-all">Show all</button><button class="button-secondary" data-quiz="show-wrong">Review wrong answers only</button><button class="button-secondary" data-quiz="bookmark-wrong-topics">Bookmark related topics</button><button class="button-secondary" data-quiz="restart">Restart</button><button class="button-primary" data-quiz="exit">Exit quiz</button></div>
    </section>
    <section class="cards-2">${shown.length ? shown.map(({q,correct,answer})=>`<section class="search-item"><div class="list-row"><strong>${esc(q.question)}</strong><span class="label ${correct?'alt':'warn'}">${correct?'Correct':'Review'}</span></div><p class="muted"><strong>Correct answer:</strong> ${esc(q.choices[q.answerIndex])}</p><p class="muted">${esc(q.explanation)}</p>${(q.topicIds||[]).length ? `<div class="tag-row">${q.topicIds.map(tid=>state.lookups.topics[tid]).filter(Boolean).map(t=>`<button class="chip-btn" data-go="#/topics/${t.id}">${esc(t.name)}</button>`).join('')}</div>`:''}</section>`).join('') : '<section class="panel empty">No incorrect answers to review.</section>'}</section>
  `;
}
function searchPage(query){
  setTitle('Search results');
  const q = expandSearchTerms(query);
  const items = [];
  state.roles.forEach(r=>items.push({type:'Role', title:r.name, text:JSON.stringify(r), href:`#/roles/${r.id}`, summary:r.summary}));
  state.modules.forEach(m=>items.push({type:'Module', title:m.name, text:JSON.stringify(m), href:`#/modules/${m.id}`, summary:m.summary}));
  state.topics.forEach(t=>items.push({type:'Topic', title:t.name, text:JSON.stringify(t), href:`#/topics/${t.id}`, summary:t.summary}));
  state.coding.forEach(c=>items.push({type:'Coding', title:c.title, text:JSON.stringify(c), href:`#/coding/${c.id}`, summary:c.summary}));
  state.usecases.forEach(u=>items.push({type:'Use case', title:u.title, text:JSON.stringify(u), href:`#/use-cases/${u.id}`, summary:u.problem}));
  state.tricky.forEach(t=>items.push({type:'Tricky', title:t.title, text:JSON.stringify(t), href:`#/topics/${t.topicId}`, summary:t.summary}));
  const results = items.filter(x=>x.text.toLowerCase().includes(q));
  return `
    <section class="panel section-panel">
      <div class="section-head"><div><h2>Search results</h2><p>${results.length} matches for "${esc(query)}"</p></div></div>
    </section>
    <section class="cards-2">
      ${results.length ? results.map(r=>`<a class="entity-card search-card" href="${r.href}">
        <div class="entity-card-top"><span class="entity-badge">${esc(r.type)}</span><span class="entity-arrow">Open →</span></div>
        <div class="entity-card-body"><h3>${esc(r.title)}</h3><p>${esc(r.summary)}</p></div>
      </a>`).join('') : '<section class="panel empty">No matching items found.</section>'}
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
  app.querySelector('#quiz-setup-form')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    startQuiz(Object.fromEntries(fd.entries()));
  });
  app.querySelectorAll('[data-answer]').forEach(btn=>btn.addEventListener('click', ()=>{
    const idx = Number(btn.dataset.answer);
    state.quizSession.answers[state.quizSession.index] = idx;
    renderRoute();
  }));
  app.querySelectorAll('[data-quiz]').forEach(btn=>btn.addEventListener('click', ()=>{
    const action = btn.dataset.quiz;
    const itemsLen = state.quizSession?.items?.length || 0;
    if(action === 'prev' && state.quizSession) state.quizSession.index = Math.max(0, state.quizSession.index - 1);
    if(action === 'next' && state.quizSession) state.quizSession.index = Math.min(itemsLen - 1, state.quizSession.index + 1);
    if(action === 'submit' && state.quizSession) state.quizSession.submitted = true;
    if(action === 'restart') state.quizSession = null;
    if(action === 'show-all' && state.quizSession) state.quizSession.resultsFilter = 'all';
    if(action === 'show-wrong' && state.quizSession) state.quizSession.resultsFilter = 'wrong';
    if(action === 'bookmark-wrong-topics' && state.quizSession) {
      const wrong = state.quizSession.items.filter((q,i)=>state.quizSession.answers[i] !== q.answerIndex);
      wrong.forEach(q=> (q.topicIds || []).forEach(tid=>{ const t = state.lookups.topics[tid]; if(t && !isBookmarked('topic', t.id)) state.bookmarks.unshift({key:`topic:${t.id}`, type:'topic', id:t.id, title:t.name}); }));
      saveBookmarks();
    }
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


document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape' && sidebar?.classList.contains('open')) {
    sidebar.classList.remove('open');
  }
});
