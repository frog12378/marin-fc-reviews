// Marin FC - Tournament data loading and display

const Tournaments = {
  data: [],

  async load() {
    const [scraped, manual] = await Promise.all([
      this.fetchJSON('data/tournaments.json').catch(() => ({ tournaments: [] })),
      this.fetchJSON('data/manual-tournaments.json').catch(() => ({ tournaments: [] })),
    ]);

    // Merge and deduplicate (prefer scraped data, add manual entries)
    const byKey = new Map();

    for (const t of (scraped.tournaments || [])) {
      const key = `${t.name.toLowerCase()}-${t.startDate}`;
      byKey.set(key, t);
    }

    for (const t of (manual.tournaments || [])) {
      const key = `${t.name.toLowerCase()}-${t.startDate}`;
      if (!byKey.has(key)) {
        byKey.set(key, t);
      }
    }

    this.data = Array.from(byKey.values()).sort(
      (a, b) => new Date(a.startDate) - new Date(b.startDate)
    );

    return this.data;
  },

  async fetchJSON(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to fetch ${url}`);
    return resp.json();
  },

  getAll() {
    return this.data;
  },

  getUpcoming() {
    const now = new Date();
    now.setDate(now.getDate() - 7); // include recent past week
    return this.data.filter(t => new Date(t.endDate || t.startDate) >= now);
  },

  search(query) {
    const q = query.toLowerCase();
    return this.data.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.location || '').toLowerCase().includes(q)
    );
  },

  renderList(container, tournaments, reviewsByTournament = {}) {
    if (!tournaments.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">\u26BD</div>
          <p>No tournaments found.</p>
        </div>`;
      return;
    }

    container.innerHTML = tournaments.map(t => {
      const reviews = reviewsByTournament[t.name] || [];
      const avgField = reviews.length ? Utils.avgRating(reviews, 'Field Rating') : null;
      const avgComp = reviews.length ? Utils.avgRating(reviews, 'Competition Rating') : null;
      const reviewCount = reviews.length;

      return `
        <div class="tournament-card">
          <div>
            <h4>${Utils.escapeHtml(t.name)}</h4>
            <div class="tournament-details">
              ${Utils.formatDateRange(t.startDate, t.endDate)}
              ${t.location ? ` &middot; ${Utils.escapeHtml(t.location)}` : ''}
              ${t.source === 'manual' ? ' &middot; <em>Manual</em>' : ''}
            </div>
          </div>
          <div class="tournament-avg">
            ${reviewCount > 0 ? `
              <div>Fields: ${Utils.renderStars(avgField)} ${avgField}</div>
              <div>Competition: ${Utils.renderStars(avgComp)} ${avgComp}</div>
              <div style="font-size:0.8rem;color:var(--pico-muted-color)">${reviewCount} review${reviewCount !== 1 ? 's' : ''}</div>
            ` : '<span style="color:var(--pico-muted-color)">No reviews yet</span>'}
          </div>
        </div>`;
    }).join('');
  },

  populateSelect(selectEl) {
    selectEl.innerHTML = '<option value="">Select a tournament...</option>';

    // Show all tournaments, most recent first for the selector
    const sorted = [...this.data].sort(
      (a, b) => new Date(b.startDate) - new Date(a.startDate)
    );

    for (const t of sorted) {
      const opt = document.createElement('option');
      opt.value = t.name;
      opt.textContent = `${t.name} (${Utils.formatDateRange(t.startDate, t.endDate)})`;
      opt.dataset.startDate = t.startDate;
      opt.dataset.endDate = t.endDate || t.startDate;
      opt.dataset.location = t.location || '';
      selectEl.appendChild(opt);
    }

    // Add "Other" option
    const other = document.createElement('option');
    other.value = '__other__';
    other.textContent = '-- Other (not listed) --';
    selectEl.appendChild(other);
  },

  init() {
    const searchInput = document.getElementById('tournament-search');
    const listContainer = document.getElementById('tournament-list');

    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce(() => {
        const query = searchInput.value.trim();
        const filtered = query ? this.search(query) : this.getAll();
        this.renderList(listContainer, filtered, Reviews._reviewsByTournament || {});
      }));
    }
  }
};
