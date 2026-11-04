// ======================
// CONFIGURAÇÕES
// ======================

const ROBLOX_USER_ID = '72538349';

// IDs (universe) dos jogos do Roblox exibidos em "Games"
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

// Helper para criar elementos sem innerHTML (os dados vêm de terceiros)
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

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
// SHOWCASE (PLAYER + HOTBAR)
// ======================

const playerScreen = document.getElementById('playerScreen');
const playerMeta = document.getElementById('playerMeta');
const playerTitle = document.getElementById('playerTitle');
const playerText = document.getElementById('playerText');
const slots = [...document.querySelectorAll('.slot')];

function playIcon() {
  const span = el('span', 'play-button');
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>';
  return span;
}

// Começa a tocar o clipe do slot: iframe do YouTube ou vídeo local
function playSlot(slot) {
  const { youtube, video } = slot.dataset;

  if (youtube) {
    const iframe = el('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1&rel=0`;
    iframe.title = slot.dataset.title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    playerScreen.replaceChildren(iframe);
    return;
  }

  const media = el('video');
  media.src = video;
  media.poster = slot.dataset.poster;
  media.controls = true;
  media.playsInline = true;
  media.setAttribute('aria-label', slot.dataset.title);
  playerScreen.replaceChildren(media);
  media.play().catch(() => {});
}

// Seleciona um slot: atualiza a hotbar, o texto e mostra a capa com botão de play
function selectSlot(slot, autoplay = false) {
  const index = slots.indexOf(slot);

  slots.forEach(s => {
    const active = s === slot;
    s.classList.toggle('is-active', active);
    s.setAttribute('aria-pressed', String(active));
  });

  playerMeta.textContent = `Slot ${index + 1} of ${slots.length}, ${slot.dataset.meta}`;
  playerTitle.textContent = slot.dataset.title;
  playerText.textContent = slot.dataset.text;

  if (autoplay) {
    playSlot(slot);
    return;
  }

  const poster = el('button', 'player-poster');
  poster.type = 'button';
  poster.setAttribute('aria-label', `Play ${slot.dataset.title}`);
  const img = el('img');
  img.src = slot.dataset.poster;
  img.alt = '';
  poster.append(img, playIcon());
  poster.addEventListener('click', () => playSlot(slot));
  playerScreen.replaceChildren(poster);
}

if (slots.length) {
  slots.forEach(slot => slot.addEventListener('click', () => selectSlot(slot, true)));
  selectSlot(slots[0]);

  // Teclas 1 a 6 trocam o clipe, como a hotbar de armas
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setNavOpen(false);
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) return;
    const slot = slots[Number(e.key) - 1];
    if (slot && !slot.classList.contains('is-active')) selectSlot(slot);
  });
}

// ======================
// GAMES (JOGOS DO ROBLOX)
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

function stat(className, value, label) {
  const wrap = el('span', `game-stat ${className}`);
  wrap.append(el('b', null, value), label);
  return wrap;
}

// Criar a linha de um jogo na lista ranqueada
function createRow(game, index) {
  const row = el('li', 'game');
  const link = el('a');
  link.href = game.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  const thumb = el('span', 'game-thumb');
  if (game.image) {
    const img = el('img');
    img.src = game.image;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 320;
    img.height = 180;
    thumb.appendChild(img);
  }

  const title = el('span');
  title.append(el('span', 'game-name', game.name));
  if (game.creator) title.append(el('span', 'game-studio', game.creator));

  const playing = stat('is-playing', fullFormat.format(game.playing), 'playing');
  if (game.playing > 0) playing.classList.add('is-live');

  link.append(
    el('span', 'game-rank', index + 1),
    thumb,
    title,
    stat('is-visits', compactFormat.format(game.visits), 'visits'),
    stat('is-favorites', compactFormat.format(game.favorites), 'favorites'),
    playing
  );
  row.appendChild(link);
  return row;
}

// Números somados na frase acima da lista
function renderTotals(games) {
  const sum = (key) => games.reduce((total, g) => total + g[key], 0);

  document.getElementById('statVisits').textContent = compactFormat.format(sum('visits'));
  document.getElementById('statFavorites').textContent = compactFormat.format(sum('favorites'));
  document.getElementById('statPlaying').textContent = fullFormat.format(sum('playing'));
  document.getElementById('statGames').textContent = games.length;
}

function renderWorkError() {
  const empty = el('li', 'games-empty', "Couldn't load live game data right now. ");
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
  workGrid.replaceChildren(...games.map(createRow));
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
