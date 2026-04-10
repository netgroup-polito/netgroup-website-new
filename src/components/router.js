import { renderHome, renderPeople, renderResearch, renderProjects, renderPublications } from './Renderer.js';

const routes = {
    'home': { dataUrl: 'data/home.json', renderer: renderHome },
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
        const response = await fetch(route.dataUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        // Execute the renderer corresponding to the route
        route.renderer(data, appContent);
        
    } catch (error) {
        console.error("Failed to load content: ", error);
        appContent.innerHTML = `<div class="error">Failed to load content. Please try again later.</div>`;
    }
}

export function initRouter() {
    window.addEventListener('hashchange', loadRoute);
    loadRoute(); // Load initial route
}
