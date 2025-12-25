export class Report {
    constructor() {
        this.resultsList = document.getElementById('results-list');
        this.stats = {
            total: document.getElementById('total-variants'),
            notable: document.getElementById('notable-findings'),
            good: document.getElementById('positive-traits'),
            matched: document.getElementById('matched-snps')
        };

        this.matches = [];
        this.currentCategory = 'all';
        this.setupFilters();
    }

    setupFilters() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.renderMatches();
            });
        });

        document.getElementById('search-input').addEventListener('input', (e) => {
            this.filterText = e.target.value.toLowerCase();
            this.renderMatches();
        });

        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.sortType = e.target.value;
            this.renderMatches();
        });
    }

    render(matches, totalVariants, debugStats = null) {
        this.matches = matches;
        this.updateStats(totalVariants);
        this.renderMatches();
        if (debugStats) {
            this.renderDiagnostics(debugStats);
        }
    }

    renderDiagnostics(stats) {
        const container = document.createElement('div');
        container.className = 'debug-panel';
        container.innerHTML = `
            <details>
                <summary>📊 Analysis Diagnostics</summary>
                <div class="debug-grid">
                    <div class="debug-item"><span>Total Variants:</span> <strong>${stats.totalVariants.toLocaleString()}</strong></div>
                    <div class="debug-item"><span>RSID Lookups:</span> <strong>${stats.rsidLookups.toLocaleString()}</strong></div>
                    <div class="debug-item"><span>RSID Matches:</span> <strong style="color:var(--success-color)">${stats.rsidHits.toLocaleString()}</strong></div>
                    <div class="debug-item"><span>Coord Lookups:</span> <strong>${stats.coordLookups.toLocaleString()}</strong></div>
                    <div class="debug-item"><span>Coord Matches:</span> <strong style="color:var(--success-color)">${stats.coordHits.toLocaleString()}</strong></div>
                    <div class="debug-item"><span>Genotype Misses:</span> <strong style="color:var(--warning-color)">${stats.genotypeMisses.toLocaleString()}</strong></div>
                    <div class="debug-item"><span>Total Matches:</span> <strong>${stats.totalMatches.toLocaleString()}</strong></div>
                </div>
            </details>
        `;
        // Insert after results header
        const header = document.querySelector('.results-header');
        header.parentNode.insertBefore(container, header.nextSibling);
    }

    updateStats(totalVariants) {
        this.stats.total.textContent = totalVariants.toLocaleString();
        this.stats.matched.textContent = this.matches.length.toLocaleString();

        const notable = this.matches.filter(m => m.magnitude >= 2).length;
        this.stats.notable.textContent = notable;

        const good = this.matches.filter(m => m.repute === 'good').length;
        this.stats.good.textContent = good;
    }

    renderMatches() {
        this.resultsList.innerHTML = '';

        let filtered = this.matches;

        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(m => m.category === this.currentCategory);
        }

        if (this.filterText) {
            filtered = filtered.filter(m =>
                m.rsid.toLowerCase().includes(this.filterText) ||
                m.summary.toLowerCase().includes(this.filterText)
            );
        }

        // Sort results (non-mutating)
        filtered = [...filtered].sort((a, b) => {
            const getStr = (o) => (o || '').toString().toLowerCase();

            switch (this.sortType) {
                case 'magnitude-asc':
                    return a.magnitude - b.magnitude;

                case 'repute-bad':
                    // Priority: Bad > non-bad. Secondary: Magnitude desc.
                    if (a.repute === 'bad' && b.repute !== 'bad') return -1;
                    if (a.repute !== 'bad' && b.repute === 'bad') return 1;
                    return b.magnitude - a.magnitude;

                case 'repute-good':
                    // Priority: Good > non-good. Secondary: Magnitude desc.
                    if (a.repute === 'good' && b.repute !== 'good') return -1;
                    if (a.repute !== 'good' && b.repute === 'good') return 1;
                    return b.magnitude - a.magnitude;

                case 'magnitude-desc':
                default:
                    return b.magnitude - a.magnitude;
            }
        });

        if (filtered.length === 0) {
            this.resultsList.innerHTML = `
                <div class="empty-state">
                    <p>No matches found for this filter.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(match => {
            const card = document.createElement('div');
            card.className = `result-card repute-${match.repute}`;
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                    <h3>${match.rsid} <span style="font-weight: normal; font-size: 0.8em; opacity: 0.7">(${match.userGenotype})</span></h3>
                    <span class="magnitude-badge">Mag: ${match.magnitude}</span>
                </div>
                <p class="summary">${match.summary}</p>
                <div style="margin-top: 1rem; font-size: 0.8em; opacity: 0.6;">
                    <a href="https://www.snpedia.com/index.php/${match.rsid}" target="_blank">View on SNPedia</a>
                </div>
            `;
            this.resultsList.appendChild(card);
        });
    }
}
