// Marin FC - Main app controller

const App = {
  views: ['login', 'tournaments', 'submit', 'reviews'],

  async init() {
    Auth.init();

    if (Auth.isLoggedIn()) {
      this.showApp();
    } else {
      this.showView('login');
    }
  },

  async showApp() {
    document.getElementById('view-login').hidden = true;
    document.getElementById('app-shell').hidden = false;

    // Update user bar
    document.getElementById('current-user').textContent = Auth.getUser();
    document.getElementById('logout-btn').addEventListener('click', () => {
      Auth.logout();
      location.reload();
    });

    // Set up nav
    document.querySelectorAll('nav.app-nav a').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const view = a.dataset.view;
        location.hash = view;
      });
    });

    // Load data
    await this.loadData();

    // Set up hash routing
    window.addEventListener('hashchange', () => this.route());
    this.route();
  },

  async loadData() {
    const overlay = document.getElementById('loading-overlay');

    try {
      // Load tournaments and reviews in parallel
      await Promise.all([
        Tournaments.load(),
        Reviews.loadReviews(),
      ]);

      // Hide loading overlay
      overlay.hidden = true;

      // Initialize components
      Tournaments.init();
      Tournaments.populateSelect(document.getElementById('review-tournament'));
      Reviews.initForm();

      // Render initial views
      this.renderTournaments();
      Reviews.initDisplay();
    } catch (err) {
      overlay.innerHTML = `<div class="empty-state"><p>Failed to load data. Please refresh the page.</p><p style="font-size:0.85rem;color:var(--pico-muted-color)">${Utils.escapeHtml(err.message)}</p></div>`;
    }
  },

  route() {
    const hash = location.hash.slice(1) || 'tournaments';
    if (this.views.includes(hash) && hash !== 'login') {
      this.showView(hash);
    } else {
      this.showView('tournaments');
    }
  },

  showView(viewId) {
    // Toggle views
    this.views.forEach(v => {
      const el = document.getElementById('view-' + v);
      if (el) el.hidden = (v !== viewId);
    });

    // Update nav active state
    document.querySelectorAll('nav.app-nav a').forEach(a => {
      a.classList.toggle('active', a.dataset.view === viewId);
    });

    // Refresh data on view switch
    if (viewId === 'tournaments') {
      this.renderTournaments();
    } else if (viewId === 'reviews') {
      Reviews.initDisplay();
    }
  },

  renderTournaments() {
    const container = document.getElementById('tournament-list');
    if (container) {
      Tournaments.renderList(container, Tournaments.getAll(), Reviews._reviewsByTournament);
    }
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
