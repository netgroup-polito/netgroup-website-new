export function renderHome(data, container, peopleData, projectsData, publicationsData) {
    // ── Compute stats dynamically ──────────────────────────────────────────────
    const totalPublications = publicationsData ? publicationsData.papers.length : 0;

    const totalProjects = projectsData
        ? projectsData.categories.reduce((s, c) => s + (c.items ? c.items.length : 0), 0)
        : 0;

    let currentPeople = 0, pastPeople = 0;
    if (peopleData) {
        peopleData.categories.forEach(cat => {
            if (cat.collapsible) {
                pastPeople += cat.people.length;
            } else {
                currentPeople += cat.people.length;
            }
        });
    }

    // ── HTML ───────────────────────────────────────────────────────────────────
    container.innerHTML = `
        <div class="fade-in home-page">

            <!-- Hero -->
            <section class="home-hero">
                <div class="home-hero-text">
                    <h1 class="home-hero-title">NetGroup</h1>
                    <p class="home-hero-sub">Computer Networks Research Group<br>
                        <span style="font-weight: 400; opacity: 0.75;">Politecnico di Torino · Turin, Italy</span>
                    </p>
                    <p class="home-hero-desc">${data.description}</p>
                    <div class="home-hero-actions">
                        <a href="#research" class="hero-btn hero-btn-primary">Our Research</a>
                        <a href="#people" class="hero-btn hero-btn-secondary">Meet the Team</a>
                    </div>
                </div>
                <div class="home-hero-badge">
                    <div class="campus-badge glass-card">
                        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🏛️</div>
                        <div style="font-weight: 700; font-size: 1rem; color: var(--heading-color);">Politecnico di Torino</div>
                        <div style="font-size: 0.85rem; color: #888; margin-top: 0.2rem;">Corso Castelfidardo, 34/D</div>
                        <div style="font-size: 0.85rem; color: #888;">10129 Turin, Italy</div>
                        <a href="https://maps.app.goo.gl/wFJbU6cmt2QyoEUh8" target="_blank"
                           class="custom-link" style="margin-top: 0.8rem; font-size: 0.85rem;">View on Maps →</a>
                    </div>
                </div>
            </section>

            <!-- Animated Counters -->
            <section class="home-counters">
                <div class="counter-card glass-card">
                    <span class="counter-value" data-target="${totalPublications}">0</span>
                    <span class="counter-label">Publications</span>
                </div>
                <div class="counter-card glass-card">
                    <span class="counter-value" data-target="${totalProjects}">0</span>
                    <span class="counter-label">Research Projects</span>
                </div>
                <div class="counter-card glass-card">
                    <span class="counter-value" data-target="${currentPeople}">0</span>
                    <span class="counter-label">Team Members</span>
                </div>
                <div class="counter-card glass-card">
                    <span class="counter-value" data-target="${currentPeople + pastPeople}">0</span>
                    <span class="counter-label">Total Contributors</span>
                    <span class="counter-sublabel">incl. past collaborators</span>
                </div>
            </section>

            <!-- Research Highlights -->
            <section class="home-directions">
                <h2 class="section-title" style="margin-bottom: 1.5rem;">Research Highlights</h2>
                <div class="grid-layout">
                    ${data.directions.map(dir => `
                        <div class="glass-card direction-card">
                            <h3 class="card-title direction-title">${dir.title}</h3>
                            <ul class="card-list direction-list">
                                ${dir.items.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </section>

        </div>
    `;

    // ── Animated counters ──────────────────────────────────────────────────────
    const counters = container.querySelectorAll('.counter-value');
    const duration = 1800;

    const animateCounter = (el) => {
        const target = parseInt(el.dataset.target, 10);
        const start = performance.now();
        const step = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out quad
            const eased = 1 - (1 - progress) * (1 - progress);
            el.textContent = Math.floor(eased * target).toLocaleString();
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    // Trigger when counters scroll into view
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    counters.forEach(c => observer.observe(c));
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

            const photoSrc = person.photo || 'assets/placeholder.png';
            html += `
                <div class="person-item">
                    <div class="person-left">
                        <img src="${photoSrc}" alt="${person.name}" class="person-avatar" onerror="this.src='assets/placeholder.png'">
                        <div class="person-info">
                            <div class="person-name-row">
                                <span class="person-name">${person.name}</span>
                                ${person.role ? `<span class="person-role">${person.role}</span>` : ''}
                            </div>
                            ${linksHtml ? `<div class="person-links">${linksHtml}</div>` : ''}
                        </div>
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
            <div class="research-list">
    `;

    data.topics.forEach((topic, i) => {
        const hasDetails = topic.description || (topic.links && topic.links.length > 0);
        const linksHtml = (topic.links && topic.links.length > 0)
            ? `<div class="research-links">${topic.links.map(l => `<a href="${l.url}" target="_blank" class="custom-link" style="margin-top: 0; padding: 0.3rem 0.8rem; font-size: 0.88rem;">${l.text} &rarr;</a>`).join('')}</div>`
            : '';

        html += `
            <details class="research-item glass-card" id="research-topic-${i}">
                <summary class="research-summary">
                    <div class="research-header">
                        <span class="research-name">${topic.name}</span>
                        <span class="research-ref">Reference: ${topic.reference}</span>
                    </div>
                    ${hasDetails ? `<span class="research-chevron">▸</span>` : ''}
                </summary>
                ${hasDetails ? `
                <div class="research-body">
                    ${topic.description ? `<p class="research-desc">${topic.description}</p>` : ''}
                    ${linksHtml}
                </div>` : ''}
            </details>
        `;
    });

    html += `
            </div>
        </div>
    `;
    container.innerHTML = html;

    // Rotate chevron on open/close
    container.querySelectorAll('details.research-item').forEach(det => {
        det.addEventListener('toggle', () => {
            const chevron = det.querySelector('.research-chevron');
            if (chevron) chevron.style.transform = det.open ? 'rotate(90deg)' : 'rotate(0deg)';
        });
    });
}


export function renderProjects(data, container) {
    let html = `
        <div class="fade-in">
            <h2 class="hero-title">${data.title}</h2>
    `;

    data.categories.forEach(category => {
        const isEU = category.funding === 'eu';
        const badgeClass = isEU ? 'badge-eu' : 'badge-national';
        const badgeLabel = isEU ? '🇪🇺 EU Funded' : '🇮🇹 National / Structural';

        html += `
            <div class="project-section-header">
                <h2 class="section-title" style="border-bottom: none; margin-bottom: 0.25rem;">${category.title}</h2>
                <span class="funding-badge ${badgeClass}">${badgeLabel}</span>
            </div>
            <div class="grid-layout project-grid" style="margin-bottom: 3rem;">
        `;

        if (category.items && category.items.length > 0) {
            // Sort by year descending (take the start year of the range)
            const sorted = [...category.items].sort((a, b) => {
                const ya = parseInt((a.year || '0').split('–')[0]);
                const yb = parseInt((b.year || '0').split('–')[0]);
                return yb - ya;
            });

            sorted.forEach(item => {
                const logoHtml = item.logo
                    ? `<img src="${item.logo}" alt="${item.name} logo" class="project-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                       <div class="project-logo-fallback" style="display:none;">${item.name}</div>`
                    : `<div class="project-logo-fallback">${item.name}</div>`;

                const linkHtml = item.url
                    ? `<a href="${item.url}" target="_blank" class="custom-link" style="align-self: flex-start;">Visit Project &rarr;</a>`
                    : `<span style="color: #999; font-size: 0.9rem; font-style: italic;">No public website</span>`;

                html += `
                    <div class="glass-card project-card">
                        <div class="project-card-header">
                            <div class="project-logo-wrap">
                                ${logoHtml}
                            </div>
                            <div class="project-meta">
                                <h3 class="card-title project-name">${item.name}</h3>
                                ${item.fullName ? `<p class="project-fullname">${item.fullName}</p>` : ''}
                                ${item.year ? `<span class="project-year-badge">${item.year}</span>` : ''}
                            </div>
                        </div>
                        ${item.description ? `<p class="project-desc">${item.description}</p>` : ''}
                        <div style="margin-top: auto; padding-top: 1rem;">
                            ${linkHtml}
                        </div>
                    </div>
                `;
            });
        } else {
            html += `<p style="color: var(--text-color); font-style: italic;">No current projects in this category.</p>`;
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
        let lastYear = pubContainer.dataset.lastYear || null;
        nextBatch.forEach(p => {
            const thisYear = p.year || '';
            if (thisYear && thisYear !== lastYear) {
                chunkHtml += `
                    <div class="year-divider" style="grid-column: 1 / -1;">
                        <span class="year-divider-label">${thisYear}</span>
                    </div>
                `;
                lastYear = thisYear;
            }
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
        pubContainer.dataset.lastYear = lastYear || '';
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
            pubContainer.dataset.lastYear = '';

            renderPapersChunk(true);
        });
    });
}

export function renderTeaching(data, container) {
    let html = `
        <div class="fade-in">
            <h2 class="hero-title">${data.title}</h2>
            <p class="hero-desc">${data.description}</p>
            <div class="grid-layout teaching-grid" style="margin-bottom: 2rem;">
    `;

    data.courses.forEach(course => {
        let instructorsHtml = '';
        if (course.instructors && course.instructors.length > 0) {
            instructorsHtml = course.instructors.map(inst => 
                `<a href="${inst.link}" target="_blank" class="teaching-instructor-link">${inst.name}</a>`
            ).join(', ');
            instructorsHtml = `<p style="font-size: 0.95rem; color: #666; margin-bottom: 0.5rem;"><strong>Instructors:</strong> ${instructorsHtml}</p>`;
        }

        html += `
            <div class="glass-card teaching-card" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; gap: 1rem;">
                        <h3 class="card-title" style="font-size: 1.3rem; margin-bottom: 0;">${course.name}</h3>
                        <span class="project-year-badge" style="white-space: nowrap;">${course.code}</span>
                    </div>
                    ${instructorsHtml}
                </div>
                <a href="${course.link}" target="_blank" class="custom-link" style="align-self: flex-start; margin-top: 1rem;">Course Details &rarr;</a>
            </div>
        `;
    });

    html += `
            </div>
            <div style="text-align: center; margin-bottom: 3rem;">
                <p style="color: var(--text-color); font-size: 0.95rem;">
                    Can't find what you are looking for? <a href="${data.sourceUrl}" target="_blank" style="color: var(--accent-color); font-weight: 600;">Check the original page</a>.
                </p>
            </div>
        </div>
    `;

    container.innerHTML = html;
}
