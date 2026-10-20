// ======================
// CONFIGURAÇÕES
// ======================

const ROBLOX_USER_ID = '72538349';

// IDs (universe) dos jogos do Roblox exibidos em "Work"
const universeIds = [
  "9277195104",
  "8606799872",
  "7640282930",
  "7089179560",
  "7364907416",
  "8894368318",
  "8837249061",
  "7335244026",
  "7559569212",
];

// ======================
// HEADER E NAVEGAÇÃO
// ======================

const siteHeader = document.getElementById('siteHeader');
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelectorAll('.nav-link');

// Fundo do header aparece depois de rolar um pouco
function updateHeader() {
  siteHeader.classList.toggle('scrolled', window.scrollY > 8);
}

window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

// Menu mobile
function setNavOpen(open) {
  siteHeader.classList.toggle('nav-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
}

navToggle.addEventListener('click', () => {
  setNavOpen(!siteHeader.classList.contains('nav-open'));
});

navLinks.forEach(link => link.addEventListener('click', () => setNavOpen(false)));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setNavOpen(false);
});

// Link ativo conforme a seção visível
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
    });
  });
}, {
  rootMargin: '-40% 0px -55% 0px'
});

document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));

// ======================
// SCROLL REVEAL
// ======================

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -40px 0px'
});

document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

// ======================
// WORK (JOGOS DO ROBLOX)
// ======================

const workGrid = document.getElementById('workGrid');

const compactFormat = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const fullFormat = new Intl.NumberFormat('en');

// Remove tags tipo "[UPD]" e emojis do nome do jogo
function cleanName(name) {
  const cleaned = String(name || '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || name;
}

// Helper para criar elementos sem innerHTML (os dados vêm de terceiros)
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function arrowIcon() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'arrow');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M4.5 11.5l7-7M5.5 4.5h6v6');
  svg.appendChild(path);
  return svg;
}

// Fetch de todos os jogos em uma única chamada, com retry
async function fetchGames(retries = 2, delay = 400) {
  try {
    const res = await fetch(`/api/games?id=${universeIds.join(',')}`);
    const json = await res.json();
    if (!Array.isArray(json?.data) || json.data.length === 0) throw new Error('No data');
    return json.data;
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, delay));
      return fetchGames(retries - 1, delay * 2);
    }
    return [];
  }
}

function stat(label, value) {
  const wrap = el('div');
  wrap.append(el('dt', null, label), el('dd', null, value));
  return wrap;
}

// Criar o card de um jogo
function createCard(game, index) {
  const card = el('a', 'work-card');
  card.href = game.url;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';
  card.style.setProperty('--i', index);

  const thumb = el('div', 'work-thumb');
  if (game.image) {
    const img = el('img');
    img.src = game.image;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 768;
    img.height = 432;
    thumb.appendChild(img);
  } else {
    thumb.appendChild(el('span', 'work-initial', game.name.charAt(0)));
  }

  if (game.playing > 0) {
    const live = el('span', 'work-live');
    live.append(el('span', 'dot'), `${fullFormat.format(game.playing)} playing`);
    thumb.appendChild(live);
  }

  const body = el('div', 'work-body');
  const head = el('div', 'work-head');
  head.append(el('h3', 'work-name', game.name), arrowIcon());
  body.appendChild(head);

  if (game.creator) {
    body.appendChild(el('p', 'work-studio', game.creator));
  }

  const stats = el('dl', 'work-stats');
  stats.append(
    stat('Visits', compactFormat.format(game.visits)),
    stat('Favorites', compactFormat.format(game.favorites))
  );
  body.appendChild(stats);

  card.append(thumb, body);
  return card;
}

// Métricas somadas no hero
function renderTotals(games) {
  const sum = (key) => games.reduce((total, g) => total + g[key], 0);

  document.getElementById('statVisits').textContent = compactFormat.format(sum('visits'));
  document.getElementById('statFavorites').textContent = compactFormat.format(sum('favorites'));
  document.getElementById('statPlaying').textContent = fullFormat.format(sum('playing'));
  document.getElementById('statGames').textContent = games.length;
}

function renderWorkError() {
  const empty = el('p', 'work-empty', "Couldn't load live game data right now. ");
  const link = el('a', null, 'See my games on Roblox');
  link.href = `https://www.roblox.com/users/${ROBLOX_USER_ID}/profile`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  empty.append(link, '.');
  workGrid.replaceChildren(empty);
}

async function initWork() {
  const data = await fetchGames();

  if (data.length === 0) {
    renderWorkError();
    return;
  }

  // Mapear e ORDENAR por visitas - do maior para o menor
  const games = data
    .map(g => ({
      name: cleanName(g.name),
      creator: g.creator,
      visits: g.visits || 0,
      favorites: g.favorites || 0,
      playing: g.playing || 0,
      image: g.thumbnail || g.icon,
      url: `https://www.roblox.com/games/${g.rootPlaceId || g.universeId}`
    }))
    .sort((a, b) => b.visits - a.visits);

  renderTotals(games);
  workGrid.replaceChildren(...games.map(createCard));
}

// ======================
// PERFIL DO ROBLOX
// ======================

async function fetchRobloxUser(id) {
  try {
    const res = await fetch(`/api/user?id=${id}`);
    const user = await res.json();

    if (!user || !user.id) return;

    if (user.avatarUrl) {
      const avatarImg = document.getElementById('robloxAvatar');
      avatarImg.onload = () => { avatarImg.hidden = false; };
      avatarImg.src = user.avatarUrl;
    }

    if (user.username) {
      document.getElementById('robloxUsername').textContent = user.username;
    }

    const profileUrl = `https://www.roblox.com/users/${user.id}/profile`;
    document.querySelectorAll('[data-roblox-link]').forEach(link => {
      link.href = profileUrl;
    });
  } catch (err) {
    console.error('Failed to fetch Roblox user:', err);
  }
}

// ======================
// INICIALIZAR
// ======================

document.getElementById('year').textContent = new Date().getFullYear();

fetchRobloxUser(ROBLOX_USER_ID);
initWork();
