import { renderHome, renderPeople, renderResearch, renderProjects, renderPublications } from './Renderer.js';

const routes = {
    'home': {
        dataUrl: 'data/home.json',
        extraUrls: ['data/people.json', 'data/projects.json', 'data/publications.json'],
        renderer: renderHome
    },
    'people': { dataUrl: 'data/people.json', renderer: renderPeople },
    'research': { dataUrl: 'data/research.json', renderer: renderResearch },
    'projects': { dataUrl: 'data/projects.json', renderer: renderProjects },
    'publications': { dataUrl: 'data/publications.json', renderer: renderPublications },
};

async function loadRoute() {
    let hash = window.location.hash.substring(1);
    if (!hash || !routes[hash]) {
        hash = 'home';
        window.location.hash = '#home';
    }

    // Update active nav link
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === `#${hash}`) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    const appContent = document.getElementById('app-content');
    appContent.innerHTML = '<div class="loading-state">Loading...</div>';

    try {
        const route = routes[hash];
        const urls = [route.dataUrl, ...(route.extraUrls || [])];
        const responses = await Promise.all(urls.map(u => fetch(u)));
        for (const r of responses) { if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`); }
        const [data, ...extras] = await Promise.all(responses.map(r => r.json()));

        route.renderer(data, appContent, ...extras);

    } catch (error) {
        console.error("Failed to load content: ", error);
        appContent.innerHTML = `<div class="error">Failed to load content. Please try again later.</div>`;
    }
}

export function initRouter() {
    window.addEventListener('hashchange', loadRoute);
    loadRoute(); // Load initial route
}
