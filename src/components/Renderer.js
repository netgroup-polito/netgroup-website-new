export function renderHome(data, container) {
    let html = `
        <div class="fade-in">
            <h2 class="hero-title">${data.title}</h2>
            <p class="hero-desc">${data.description}</p>
            <div class="grid-layout">
    `;

    data.directions.forEach(dir => {
        html += `
            <div class="glass-card">
                <h3 class="card-title">${dir.title}</h3>
                <ul class="card-list">
                    ${dir.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;
    container.innerHTML = html;
}

export function renderPeople(data, container) {
    let html = `<div class="fade-in">`;
    
    data.categories.forEach(category => {
        if (category.collapsible) {
            html += `
                <details class="collapsible-section">
                    <summary style="outline: none; cursor: pointer; list-style: none;"><h2 class="section-title collapsible-title" style="display: flex; justify-content: space-between; align-items: center; transition: color 0.3s ease;">${category.title} <span class="toggle-icon" style="font-size: 1.2rem; transition: transform 0.3s ease;">▼</span></h2></summary>
                    <div class="glass-card" style="margin-bottom: 2rem;">
            `;
        } else {
            html += `
                <h2 class="section-title">${category.title}</h2>
                <div class="glass-card" style="margin-bottom: 2rem;">
            `;
        }
        
        category.people.forEach(person => {
            let linksHtml = '';
            if (person.links) {
                linksHtml = person.links.map(link => `<a href="${link.url}" target="_blank">${link.text}</a>`).join('');
            }
            
            html += `
                <div class="person-item">
                    <div>
                        <span class="person-name">${person.name}</span>
                        ${linksHtml ? `<span class="person-links">${linksHtml}</span>` : ''}
                    </div>
                    ${person.email ? `<a href="mailto:${person.email}" class="person-email">${person.email}</a>` : ''}
                </div>
            `;
        });
        
        if (category.collapsible) {
            html += `</div></details>`;
        } else {
            html += `</div>`;
        }
    });

    html += `</div>`;
    container.innerHTML = html;
}

export function renderResearch(data, container) {
    let html = `
        <div class="fade-in">
            <h2 class="hero-title">${data.title}</h2>
            <p class="hero-desc">${data.description}</p>
            <div class="glass-card">
                <ul class="card-list" style="font-size: 1.1rem;">
    `;

    data.topics.forEach(topic => {
        html += `
            <li style="margin-bottom: 1rem;">
                <strong>${topic.name}</strong> 
                <span style="color: #8b949e; display: block; font-size: 0.95rem;">Reference: ${topic.reference}</span>
            </li>
        `;
    });

    html += `
                </ul>
            </div>
        </div>
    `;
    container.innerHTML = html;
}

export function renderProjects(data, container) {
    let html = `
        <div class="fade-in">
            <h2 class="hero-title">${data.title}</h2>
    `;

    data.categories.forEach(category => {
        html += `
            <h2 class="section-title">${category.title}</h2>
            <div class="grid-layout" style="margin-bottom: 3rem;">
        `;
        
        if (category.items && category.items.length > 0) {
            category.items.forEach(item => {
                html += `
                    <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start;">
                        <h3 class="card-title">${item.name}</h3>
                        <a href="${item.url}" target="_blank" class="custom-link">Visit Project &rarr;</a>
                    </div>
                `;
            });
        } else {
            html += `<p style="color: var(--text-color); font-style: italic; margin-bottom: 1rem;">No current projects in this category.</p>`;
        }
        
        html += `</div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
}

export function renderPublications(data, container) {
    let html = `
        <div class="fade-in">
            <h2 class="hero-title">${data.title}</h2>
            <p class="hero-desc">${data.description}</p>
    `;

    const uniqueOwners = [...new Set(data.papers.flatMap(p => p.owners || []))].sort();

    html += `
        <div class="filter-bar" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 2rem;">
            <button class="filter-btn active" data-filter="all">All</button>
            ${uniqueOwners.map(owner => `<button class="filter-btn" data-filter="${owner}">${owner}</button>`).join('')}
        </div>
    `;

    html += `
        <div class="metrics-container glass-card fade-in" style="margin-bottom: 2rem; display: flex; flex-direction: column; align-items: center;">
            <h3 style="font-size: 1.5rem; color: var(--heading-color); margin-bottom: 0.5rem;" id="total-pubs-count">
                ...
            </h3>
            <div style="width: 100%; max-width: 600px; margin-top: 1rem;">
                <canvas id="pubsChart"></canvas>
            </div>
        </div>
    `;

    html += `<div class="grid-layout publications-grid" id="publications-container" style="margin-bottom: 2rem;"></div>`;
    
    html += `
        <div style="text-align: center; margin-bottom: 3rem;">
            <button id="load-more-btn" class="custom-link" style="border: none; cursor: pointer; font-size: 1.1rem; padding: 0.75rem 1.5rem;">Load More</button>
        </div>
    </div>`;

    container.innerHTML = html;

    const papers = data.papers;
    let currentFilter = 'all';
    let currentIndex = 0;
    const PAGE_SIZE = 20;

    const pubContainer = document.getElementById('publications-container');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let chartInstance = null;
    
    function updateMetrics(filteredPapers) {
        const countEl = document.getElementById('total-pubs-count');
        if (countEl) countEl.innerText = 'Total Publications: ' + filteredPapers.length;
        
        const yearCounts = {};
        filteredPapers.forEach(p => {
            const y = p.year || 'Unknown';
            yearCounts[y] = (yearCounts[y] || 0) + 1;
        });

        const labels = Object.keys(yearCounts).filter(y => y !== 'Unknown').sort();
        const dataVals = labels.map(y => yearCounts[y]);

        const draw = () => {
            const canvas = document.getElementById('pubsChart');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            
            if (chartInstance) {
                chartInstance.destroy();
            }
            
            if (typeof Chart === 'undefined') {
                setTimeout(draw, 100);
                return;
            }

            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Publications per Year',
                        data: dataVals,
                        backgroundColor: 'rgba(16, 185, 129, 0.6)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            ticks: { precision: 0 } 
                        }
                    }
                }
            });
        };

        if (typeof Chart === 'undefined' && !document.getElementById('chartjs-script')) {
            const script = document.createElement('script');
            script.id = 'chartjs-script';
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = draw;
            document.head.appendChild(script);
        } else {
            draw();
        }
    }

    function renderPapersChunk(isNewFilter = false) {
        const filteredPapers = currentFilter === 'all' ? papers : papers.filter(p => p.owners && p.owners.includes(currentFilter));
        
        if (isNewFilter) {
            updateMetrics(filteredPapers);
        }
        
        const nextBatch = filteredPapers.slice(currentIndex, currentIndex + PAGE_SIZE);
        
        let chunkHtml = '';
        nextBatch.forEach(p => {
            chunkHtml += `
                <div class="glass-card publication-card fade-in" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <h3 class="card-title" style="font-size: 1.2rem; margin-bottom: 0.5rem;">${p.title}</h3>
                        <p style="font-size: 0.95rem; color: #666; margin-bottom: 0.5rem;"><strong>Authors:</strong> ${p.authors}</p>
                        <p style="font-size: 0.95rem; color: #666;"><strong>Venue:</strong> ${p.venue}</p>
                        ${p.year ? `<p style="font-size: 0.95rem; color: #666;"><strong>Year:</strong> ${p.year}</p>` : ''}
                    </div>
                    <a href="${p.link}" target="_blank" class="custom-link" style="align-self: flex-start; margin-top: 1rem;">View on Scholar &rarr;</a>
                </div>
            `;
        });
        
        pubContainer.insertAdjacentHTML('beforeend', chunkHtml);
        currentIndex += PAGE_SIZE;

        if (currentIndex >= filteredPapers.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'inline-block';
        }
    }

    renderPapersChunk(true);

    loadMoreBtn.addEventListener('click', () => {
        renderPapersChunk(false);
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            currentFilter = e.target.getAttribute('data-filter');
            currentIndex = 0;
            pubContainer.innerHTML = '';
            
            renderPapersChunk(true);
        });
    });
}
