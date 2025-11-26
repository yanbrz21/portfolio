const observer = new IntersectionObserver(e => {
    e.forEach(x => {
        if (x.isIntersecting) {
            x.target.classList.add('show');
            x.target.querySelectorAll('.fade').forEach((a, i) => {
                setTimeout(() => a.classList.add('show'), i * 80);
            });
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll('.scrollReveal').forEach(x => observer.observe(x));

const universeIds = [
    "8606799872",
    "7640282930",
    "7089179560",
    "7364907416",
    "8894368318",
    "8837249061",
    "7335244026",
    "2373810769",
];

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


function createDots() {
    dots.innerHTML = '';
    projects.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = 'dot';
        d.onclick = () => {
            index = i;
            render();
        };
        dots.appendChild(d);
    });
}

function updateDots() {
    [...dots.children].forEach((d, i) => {
        d.classList.toggle('active', i === index);
    });
}

function animate() {
    img.classList.remove('show');
    title.classList.remove('show');
    meta.classList.remove('show');
    desc.classList.remove('show');
    setTimeout(() => {
        img.classList.add('show');
        title.classList.add('show');
        meta.classList.add('show');
        desc.classList.add('show');
    }, 50);
}

function render() {
    const p = projects[index];
    img.src = p.image;
    img.onclick = () => window.open(p.url, '_blank');

    // truncar título a 25 caracteres
    const maxTitleLength = 25;
    let projectTitle = p.name;
    if (projectTitle.length > maxTitleLength) {
        projectTitle = projectTitle.slice(0, maxTitleLength) + '…';
    }
    title.textContent = projectTitle;

    meta.textContent = `${p.playing} players • ${p.visits.toLocaleString()} visits`;

    // truncar descrição a 3 linhas continua via CSS
    desc.textContent = p.description;

    visit.href = p.url;
    updateDots();
    animate();
}


prev.onclick = () => {
    index = (index - 1 + projects.length) % projects.length;
    render();
};

next.onclick = () => {
    index = (index + 1) % projects.length;
    render();
};

async function fetchRobloxUser(id) {
  try {
    const res = await fetch(`/api/user?id=${id}`);
    const user = await res.json();
    if (!user || !user.id) return;

    const avatarImg = document.getElementById('robloxAvatar');
    avatarImg.src = user.avatarUrl;
    document.getElementById('robloxDisplayName').textContent = user.displayName;
    document.getElementById('robloxUsername').textContent = user.username;
    document.getElementById('robloxFollowers').textContent = user.followers.toLocaleString();
    document.getElementById('robloxFriends').textContent = user.friends.toLocaleString();
    document.getElementById('robloxBio').textContent = user.description || 'No bio available';
    document.getElementById('robloxProfileLink').href = `https://www.roblox.com/users/${user.id}/profile`;
  } catch (err) {
    console.error('Failed to fetch Roblox user:', err);
  }
}

fetchRobloxUser('72538349');


(async () => {
    const data = await fetchProjects();
    if (!Array.isArray(data) || data.length === 0) return;

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


