// Custom Cursor
const cursor = document.getElementById('customCursor');
const cursorDot = document.getElementById('customCursorDot');

document.addEventListener('mousemove', (e) => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
  cursorDot.style.left = e.clientX + 'px';
  cursorDot.style.top = e.clientY + 'px';
});

document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.transform = 'scale(1.5)';
    cursor.style.borderColor = 'var(--red)';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.transform = 'scale(1)';
    cursor.style.borderColor = 'var(--red)';
  });
});

// Scroll Progress Bar
window.addEventListener('scroll', () => {
  const scrollProgress = document.getElementById('scrollProgress');
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrolled = (window.scrollY / scrollHeight) * 100;
  scrollProgress.style.width = scrolled + '%';
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Active nav link
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (window.scrollY >= sectionTop - 200) {
      current = section.getAttribute('id');
    }
  });
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href').slice(1) === current) {
      link.classList.add('active');
    }
  });
});

// Scroll Reveal Animation
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ======================
// PROJECTS CAROUSEL
// ======================

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

// Elementos do autoplay progress
const autoplayProgressContainer = document.getElementById('autoplayProgressContainer');
const autoplayProgressBar = document.getElementById('autoplayProgressBar');

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
  img.classList.remove('show');
  title.classList.remove('show');
  meta.classList.remove('show');
  desc.classList.remove('show');
  
  img.classList.add('loading-skeleton');
  
  setTimeout(() => {
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
  animate();
  
  img.src = p.image;
  img.onclick = () => window.open(p.url, '_blank');
  
  const maxTitleLength = 30;
  let projectTitle = p.name;
  if (projectTitle.length > maxTitleLength) {
    projectTitle = projectTitle.slice(0, maxTitleLength) + '…';
  }
  
  title.textContent = projectTitle;
  
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

// Autoplay do carrossel com barra de progresso
function startAutoplay() {
  // Mostrar a barra com animação
  if (autoplayProgressContainer) {
    autoplayProgressContainer.classList.add('active');
  }
  
  // Reset e iniciar animação da barra
  if (autoplayProgressBar) {
    autoplayProgressBar.style.animation = 'none';
    autoplayProgressBar.offsetHeight; // Trigger reflow
    autoplayProgressBar.classList.add('animating');
    autoplayProgressBar.style.animation = 'fillProgress 5s linear forwards';
  }
  
  autoplayInterval = setInterval(() => {
    index = (index + 1) % projects.length;
    render();
    
    // Reiniciar a animação da barra após trocar de projeto
    if (autoplayProgressBar) {
      autoplayProgressBar.style.animation = 'none';
      autoplayProgressBar.offsetHeight; // Trigger reflow
      autoplayProgressBar.style.animation = 'fillProgress 5s linear forwards';
    }
  }, 5000);
}

function stopAutoplay() {
  if (autoplayInterval) {
    clearInterval(autoplayInterval);
    autoplayInterval = null;
  }
  
  // Esconder a barra com animação
  if (autoplayProgressContainer) {
    autoplayProgressContainer.classList.remove('active');
  }
  
  // Parar a animação da barra
  if (autoplayProgressBar) {
    autoplayProgressBar.classList.remove('animating');
    autoplayProgressBar.style.animation = 'none';
    autoplayProgressBar.style.width = '0%';
  }
}

function resetAutoplay() {
  stopAutoplay();
  startAutoplay();
}

// Pausar autoplay ao hover
const carouselMain = document.getElementById('carouselMain');
if (carouselMain) {
  carouselMain.addEventListener('mouseenter', () => {
    stopAutoplay();
  });
  
  carouselMain.addEventListener('mouseleave', () => {
    startAutoplay();
  });
  
  // Mouse tracking for carousel
  carouselMain.addEventListener('mousemove', (e) => {
    const rect = carouselMain.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    carouselMain.style.setProperty('--mouse-x', x + '%');
    carouselMain.style.setProperty('--mouse-y', y + '%');
  });
}

// Navegação
if (prev) {
  prev.onclick = () => {
    index = (index - 1 + projects.length) % projects.length;
    render();
    resetAutoplay();
  };
}

if (next) {
  next.onclick = () => {
    index = (index + 1) % projects.length;
    render();
    resetAutoplay();
  };
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
    
    const avatarImg = document.getElementById('robloxAvatar');
    avatarImg.style.opacity = '0';
    avatarImg.src = user.avatarUrl;
    avatarImg.onload = () => {
      avatarImg.style.transition = 'opacity 0.5s ease';
      avatarImg.style.opacity = '1';
    };
    
    document.getElementById('robloxUsername').textContent = user.username;
    
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
  fetchRobloxUser('72538349');
  
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
  startAutoplay();
})();

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
