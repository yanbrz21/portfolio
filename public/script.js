// Intersection Observer para animações de scroll
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
      entry.target.querySelectorAll('.fade').forEach((el, index) => {
        setTimeout(() => el.classList.add('show'), index * 100);
      });
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.scrollReveal').forEach(el => observer.observe(el));

// IDs dos jogos do Roblox
const universeIds = [
  "8606799872",
  "7640282930",
  "7089179560",
  "7364907416",
  "8894368318",
  "8837249061",
  "7335244026",
  "7559569212",
];

// Elementos do DOM
const img = document.getElementById('projImg');
const title = document.getElementById('projTitle');
const meta = document.getElementById('projMeta');
const desc = document.getElementById('projDesc');
const visit = document.getElementById('projVisit');
const prev = document.getElementById('projPrev');
const next = document.getElementById('projNext');
const dots = document.getElementById('projDots');

let projects = [];
let index = 0;
let autoplayInterval = null;

// Fetch com retry
async function fetchGame(id, retries = 3, delay = 300) {
  try {
    const res = await fetch(`/api/games?id=${id}`);
    const json = await res.json();
    if (!json?.data?.[0]) throw new Error('No data');
    return json.data[0];
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, delay));
      return fetchGame(id, retries - 1, delay);
    }
    return null;
  }
}

// Fetch todos os projetos em lotes
const batchSize = 3;
async function fetchProjects() {
  const results = [];
  for (let i = 0; i < universeIds.length; i += batchSize) {
    const batch = universeIds.slice(i, i + batchSize);
    const games = await Promise.all(batch.map(id => fetchGame(id)));
    results.push(...games.filter(g => g));
  }
  return results;
}

// Criar dots de navegação
function createDots() {
  dots.innerHTML = '';
  projects.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.onclick = () => {
      index = i;
      render();
      resetAutoplay();
    };
    dots.appendChild(dot);
  });
}

// Atualizar estado dos dots
function updateDots() {
  [...dots.children].forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}

// Animação de transição
function animate() {
  // Fade out
  img.classList.remove('show');
  title.classList.remove('show');
  meta.classList.remove('show');
  desc.classList.remove('show');
  
  // Adicionar classe de loading
  img.classList.add('loading-skeleton');
  
  setTimeout(() => {
    // Fade in
    img.classList.remove('loading-skeleton');
    img.classList.add('show');
    
    setTimeout(() => title.classList.add('show'), 100);
    setTimeout(() => meta.classList.add('show'), 200);
    setTimeout(() => desc.classList.add('show'), 300);
  }, 150);
}

// Renderizar projeto atual
function render() {
  const p = projects[index];
  
  // Animar transição
  animate();
  
  // Atualizar imagem
  img.src = p.image;
  img.onclick = () => window.open(p.url, '_blank');
  
  // Truncar título
  const maxTitleLength = 30;
  let projectTitle = p.name;
  if (projectTitle.length > maxTitleLength) {
    projectTitle = projectTitle.slice(0, maxTitleLength) + '…';
  }
  
  title.textContent = projectTitle;
  
  // Formatar estatísticas
  const playerCount = p.playing.toLocaleString();
  const visitCount = p.visits.toLocaleString();
  
  meta.innerHTML = `
    <span class="project-stat">👥 ${playerCount} players</span>
    <span class="project-stat">👀 ${visitCount} visits</span>
  `;
  
  desc.textContent = p.description || 'No description available';
  visit.href = p.url;
  
  updateDots();
}

// Navegação
prev.onclick = () => {
  index = (index - 1 + projects.length) % projects.length;
  render();
  resetAutoplay();
};

next.onclick = () => {
  index = (index + 1) % projects.length;
  render();
  resetAutoplay();
};

// Autoplay do carrossel
function startAutoplay() {
  autoplayInterval = setInterval(() => {
    index = (index + 1) % projects.length;
    render();
  }, 5000); // Muda a cada 5 segundos
}

function stopAutoplay() {
  if (autoplayInterval) {
    clearInterval(autoplayInterval);
    autoplayInterval = null;
  }
}

function resetAutoplay() {
  stopAutoplay();
  startAutoplay();
}

// Pausar autoplay ao hover
const carouselMain = document.getElementById('carouselMain');
if (carouselMain) {
  carouselMain.addEventListener('mouseenter', stopAutoplay);
  carouselMain.addEventListener('mouseleave', startAutoplay);
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    prev.click();
  } else if (e.key === 'ArrowRight') {
    next.click();
  }
});

// Fetch dados do usuário Roblox
async function fetchRobloxUser(id) {
  try {
    const res = await fetch(`/api/user?id=${id}`);
    const user = await res.json();
    
    if (!user || !user.id) return;
    
    // Atualizar avatar com animação
    const avatarImg = document.getElementById('robloxAvatar');
    avatarImg.style.opacity = '0';
    avatarImg.src = user.avatarUrl;
    avatarImg.onload = () => {
      avatarImg.style.transition = 'opacity 0.5s ease';
      avatarImg.style.opacity = '1';
    };
    
    // Atualizar informações
    document.getElementById('robloxUsername').textContent = user.username;
    
    // Atualizar todos os links do Roblox
    const profileUrl = `https://www.roblox.com/users/${user.id}/profile`;
    document.querySelectorAll('#robloxProfileLink, #robloxContactLink, #robloxSocialLink').forEach(link => {
      link.href = profileUrl;
    });
    
  } catch (err) {
    console.error('Failed to fetch Roblox user:', err);
  }
}

// Inicializar
(async () => {
  // Fetch usuário
  fetchRobloxUser('72538349');
  
  // Fetch projetos
  const data = await fetchProjects();
  
  if (!Array.isArray(data) || data.length === 0) {
    title.textContent = 'No projects found';
    desc.textContent = 'Unable to load projects at this time.';
    return;
  }
  
  projects = data.map(g => ({
    universeId: g.universeId,
    name: g.name,
    description: g.description,
    visits: g.visits,
    playing: g.playing,
    image: g.icon,
    url: g.rootPlaceId
      ? `https://www.roblox.com/games/${g.rootPlaceId}`
      : `https://www.roblox.com/games/${g.universeId}`
  }));
  
  createDots();
  render();
})();

// Adicionar animação de digitação ao título
function typeWriter(element, text, speed = 50) {
  let i = 0;
  element.textContent = '';
  
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  
  type();
}

// Animação de contagem nos números
function animateNumber(element, target, duration = 1000) {
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
}

// Iniciar animação quando os elementos aparecem
const statNumbers = document.querySelectorAll('.stat-number');
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = entry.target;
      const value = target.textContent.replace('+', '').replace('%', '');
      const suffix = target.textContent.includes('+') ? '+' : target.textContent.includes('%') ? '%' : '';
      
      animateNumber(target, parseInt(value), 1500);
      setTimeout(() => {
        target.textContent = value + suffix;
      }, 1500);
      
      statsObserver.unobserve(target);
    }
  });
}, { threshold: 0.5 });

statNumbers.forEach(el => statsObserver.observe(el));
