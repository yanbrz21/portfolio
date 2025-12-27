// Mouse Light Effect - Luz suave que segue o mouse
const mouseLight = document.getElementById('mouseLight');
let mouseLightX = 0;
let mouseLightY = 0;
let currentX = 0;
let currentY = 0;

// Atualizar posição do mouse
document.addEventListener('mousemove', (e) => {
  mouseLightX = e.clientX;
  mouseLightY = e.clientY;
  
  if (mouseLight && !mouseLight.classList.contains('active')) {
    mouseLight.classList.add('active');
  }
});

// Animação suave usando requestAnimationFrame
function animateMouseLight() {
  const speed = 0.15;
  
  currentX += (mouseLightX - currentX) * speed;
  currentY += (mouseLightY - currentY) * speed;
  
  if (mouseLight) {
    mouseLight.style.left = currentX + 'px';
    mouseLight.style.top = currentY + 'px';
  }
  
  requestAnimationFrame(animateMouseLight);
}

animateMouseLight();

document.addEventListener('mouseleave', () => {
  if (mouseLight) {
    mouseLight.classList.remove('active');
  }
});

document.addEventListener('mouseenter', () => {
  if (mouseLight) {
    mouseLight.classList.add('active');
  }
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

// CONFIGURAÇÕES
const AUTOPLAY_DURATION = 5;
const TRANSITION_DURATION = 500;

// IDs dos jogos do Roblox
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

// Elementos do DOM
const img = document.getElementById('projImg');
const title = document.getElementById('projTitle');
const meta = document.getElementById('projMeta');
const desc = document.getElementById('projDesc');
const visit = document.getElementById('projVisit');
const prev = document.getElementById('projPrev');
const next = document.getElementById('projNext');
const dots = document.getElementById('projDots');
const carouselMain = document.getElementById('carouselMain');
const autoplayProgressContainer = document.getElementById('autoplayProgressContainer');
const autoplayProgressBar = document.getElementById('autoplayProgressBar');

let projects = [];
let currentIndex = 0;
let isTransitioning = false;
let autoplayEnabled = true;
let progressInterval = null;
let autoplayTimeout = null;
let carouselHasBeenViewed = false;

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
      if (!isTransitioning) {
        goToSlide(i);
        disableAutoplay();
      }
    };
    dots.appendChild(dot);
  });
}

// Atualizar estado dos dots
function updateDots() {
  [...dots.children].forEach((dot, i) => {
    dot.classList.toggle('active', i === currentIndex);
  });
}

// Animação de transição suave
async function animateTransition() {
  isTransitioning = true;
  
  title.classList.add('fade-out');
  meta.classList.add('fade-out');
  desc.classList.add('fade-out');
  img.style.opacity = '0';
  img.style.transform = 'scale(0.95)';
  
  await new Promise(resolve => setTimeout(resolve, TRANSITION_DURATION));
  
  title.classList.remove('fade-out');
  meta.classList.remove('fade-out');
  desc.classList.remove('fade-out');
  img.style.opacity = '1';
  img.style.transform = 'scale(1)';
  
  isTransitioning = false;
}

// Renderizar projeto atual
async function render() {
  const p = projects[currentIndex];
  
  await animateTransition();
  
  img.src = p.image;
  img.onclick = () => window.open(p.url, '_blank');
  
  const maxTitleLength = 35;
  let projectTitle = p.name;
  if (projectTitle.length > maxTitleLength) {
    projectTitle = projectTitle.slice(0, maxTitleLength) + '…';
  }
  
  title.textContent = projectTitle;
  
  const playerCount = p.playing.toLocaleString();
  const visitCount = p.visits.toLocaleString();
  
  // Estatísticas com ênfase maior no CCU
  meta.innerHTML = `
    <div class="stat-block ccu-stat">
      <div class="stat-icon">👥</div>
      <div class="stat-content">
        <div class="stat-value">${playerCount}</div>
        <div class="stat-label">Concurrent Players</div>
      </div>
    </div>
    <div class="stat-block visits-stat">
      <div class="stat-icon">👀</div>
      <div class="stat-content">
        <div class="stat-value">${visitCount}</div>
        <div class="stat-label">Total Visits</div>
      </div>
    </div>
  `;
  
  desc.textContent = p.description || 'No description available';
  visit.href = p.url;
  
  updateDots();
}

// Ir para um slide específico
async function goToSlide(index) {
  if (isTransitioning) return;
  currentIndex = index;
  await render();
  if (autoplayEnabled) {
    startAutoplay();
  }
}

// Próximo slide
async function nextSlide() {
  if (isTransitioning) return;
  currentIndex = (currentIndex + 1) % projects.length;
  await render();
}

// Slide anterior
async function prevSlide() {
  if (isTransitioning) return;
  currentIndex = (currentIndex - 1 + projects.length) % projects.length;
  await render();
}

// Sistema de progresso do autoplay
function updateProgress() {
  let progress = 0;
  const incrementPerFrame = 100 / ((AUTOPLAY_DURATION * 1000) / 50);
  
  if (progressInterval) {
    clearInterval(progressInterval);
  }
  
  autoplayProgressBar.style.width = '0%';
  
  progressInterval = setInterval(() => {
    progress += incrementPerFrame;
    if (progress >= 100) {
      progress = 100;
      clearInterval(progressInterval);
    }
    autoplayProgressBar.style.width = progress + '%';
  }, 50);
}

// Iniciar autoplay
function startAutoplay() {
  if (autoplayTimeout) {
    clearTimeout(autoplayTimeout);
  }
  if (progressInterval) {
    clearInterval(progressInterval);
  }
  
  if (!autoplayEnabled) return;
  
  if (autoplayProgressContainer) {
    autoplayProgressContainer.classList.add('active');
  }
  
  updateProgress();
  
  autoplayTimeout = setTimeout(() => {
    if (autoplayEnabled && !isTransitioning) {
      nextSlide();
      startAutoplay();
    }
  }, AUTOPLAY_DURATION * 1000);
}

// Parar autoplay
function stopAutoplay() {
  if (autoplayTimeout) {
    clearTimeout(autoplayTimeout);
    autoplayTimeout = null;
  }
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  if (autoplayProgressContainer) {
    autoplayProgressContainer.classList.remove('active');
  }
  autoplayProgressBar.style.width = '0%';
}

// Desabilitar autoplay permanentemente
function disableAutoplay() {
  autoplayEnabled = false;
  stopAutoplay();
}

// Pausar autoplay ao hover
if (carouselMain) {
  carouselMain.addEventListener('mouseenter', () => {
    if (autoplayEnabled) {
      stopAutoplay();
    }
  });
  
  carouselMain.addEventListener('mouseleave', () => {
    if (autoplayEnabled && !isTransitioning) {
      startAutoplay();
    }
  });
}

// Navegação
if (prev) {
  prev.onclick = async () => {
    if (!isTransitioning) {
      await prevSlide();
      disableAutoplay();
    }
  };
}

if (next) {
  next.onclick = async () => {
    if (!isTransitioning) {
      await nextSlide();
      disableAutoplay();
    }
  };
}

// Keyboard navigation
document.addEventListener('keydown', async (e) => {
  if (e.key === 'ArrowLeft' && !isTransitioning) {
    await prevSlide();
    disableAutoplay();
  } else if (e.key === 'ArrowRight' && !isTransitioning) {
    await nextSlide();
    disableAutoplay();
  }
});

// IntersectionObserver para detectar quando o carrossel entra no viewport
function setupCarouselObserver() {
  if (!carouselMain || !('IntersectionObserver' in window)) return;
  
  const carouselObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !carouselHasBeenViewed) {
        carouselHasBeenViewed = true;
        currentIndex = 0;
        render().then(() => {
          if (autoplayEnabled) {
            startAutoplay();
          }
        });
      } else if (!entry.isIntersecting && autoplayEnabled) {
        stopAutoplay();
      } else if (entry.isIntersecting && carouselHasBeenViewed && autoplayEnabled) {
        startAutoplay();
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: '0px'
  });
  
  carouselObserver.observe(carouselMain);
}

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
  
  // Mapear e ORDENAR por CCU (concurrent players) - do maior para o menor
  projects = data
    .map(g => ({
      universeId: g.universeId,
      name: g.name,
      description: g.description,
      visits: g.visits,
      playing: g.playing,
      image: g.icon,
      url: g.rootPlaceId
        ? `https://www.roblox.com/games/${g.rootPlaceId}`
        : `https://www.roblox.com/games/${g.universeId}`
    }))
    .sort((a, b) => b.playing - a.playing); // Ordenar por CCU decrescente
  
  createDots();
  await render();
  
  setupCarouselObserver();
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
