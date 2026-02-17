// Marin FC - Review submission and display

const Reviews = {
  _reviews: [],
  _reviewsByTournament: {},

  async loadReviews() {
    try {
      this._reviews = await SheetsAPI.getReviews();
      this._groupByTournament();
      return this._reviews;
    } catch (err) {
      console.error('Failed to load reviews:', err);
      this._reviews = [];
      return [];
    }
  },

  _groupByTournament() {
    this._reviewsByTournament = {};
    for (const r of this._reviews) {
      const name = r['Tournament'] || r.tournament || '';
      if (!this._reviewsByTournament[name]) {
        this._reviewsByTournament[name] = [];
      }
      this._reviewsByTournament[name].push(r);
    }
  },

  // --- Submit Form ---

  initForm() {
    const form = document.getElementById('review-form');
    const tournamentSelect = document.getElementById('review-tournament');
    const otherTournament = document.getElementById('other-tournament-group');
    const submitBtn = document.getElementById('submit-review-btn');

    // Show/hide "other" field
    tournamentSelect.addEventListener('change', () => {
      otherTournament.hidden = tournamentSelect.value !== '__other__';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit(form, submitBtn);
    });
  },

  async handleSubmit(form, submitBtn) {
    // Gather form data
    const tournament = form.querySelector('#review-tournament').value;
    const otherName = form.querySelector('#other-tournament-name')?.value.trim();
    const ageGroup = form.querySelector('#review-age').value;
    const gender = form.querySelector('input[name="gender"]:checked')?.value;
    const level = form.querySelector('#review-level').value;
    const tournamentDate = form.querySelector('#review-date').value;
    const fieldType = form.querySelector('input[name="fieldType"]:checked')?.value;
    const fieldRating = form.querySelector('input[name="fieldRating"]:checked')?.value;
    const competitionRating = form.querySelector('input[name="competitionRating"]:checked')?.value;
    const comments = form.querySelector('#review-comments').value.trim();

    // Validation
    const tournamentName = tournament === '__other__' ? otherName : tournament;
    if (!tournamentName) {
      Utils.showToast('Please select a tournament.', 'error');
      return;
    }
    if (!ageGroup) {
      Utils.showToast('Please select an age group.', 'error');
      return;
    }
    if (!gender) {
      Utils.showToast('Please select Boys or Girls.', 'error');
      return;
    }
    if (!level) {
      Utils.showToast('Please select a competition level.', 'error');
      return;
    }
    if (!fieldType) {
      Utils.showToast('Please select the field surface (Grass or Turf).', 'error');
      return;
    }
    if (!fieldRating || !competitionRating) {
      Utils.showToast('Please rate both field conditions and competition quality.', 'error');
      return;
    }

    const reviewData = {
      tournament: tournamentName,
      ageGroup,
      gender,
      level,
      tournamentDate: tournamentDate || '',
      fieldType,
      fieldRating: Number(fieldRating),
      competitionRating: Number(competitionRating),
      comments,
      reviewer: Auth.getUser(),
    };

    // Submit
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
    submitBtn.textContent = 'Submitting...';

    try {
      await SheetsAPI.submitReview(reviewData);
      Utils.showToast('Review submitted! Thanks for your feedback.');
      form.reset();
      document.getElementById('other-tournament-group').hidden = true;
      // Refresh reviews
      await this.loadReviews();
    } catch (err) {
      Utils.showToast(err.message || 'Failed to submit. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
      submitBtn.textContent = 'Submit Review';
    }
  },

  // --- Star Rating Widget ---

  createStarWidget(name, label) {
    return `
      <fieldset class="star-rating">
        <legend>${label}</legend>
        <div class="stars">
          ${[5,4,3,2,1].map(v => `
            <input type="radio" name="${name}" value="${v}" id="${name}-${v}">
            <label for="${name}-${v}" title="${v} star${v > 1 ? 's' : ''}">\u2605</label>
          `).join('')}
        </div>
      </fieldset>`;
  },

  // --- Review Display ---

  renderReviews(container, reviews) {
    if (!reviews.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">\uD83D\uDCDD</div>
          <p>No reviews yet. Be the first to share your tournament experience!</p>
        </div>`;
      return;
    }

    // Sort by most recent first
    const sorted = [...reviews].sort(
      (a, b) => new Date(b.Timestamp || 0) - new Date(a.Timestamp || 0)
    );

    container.innerHTML = sorted.map(r => {
      const tournament = r['Tournament'] || r.tournament || 'Unknown';
      const ageGroup = r['Age Group'] || r.ageGroup || '';
      const gender = r['Gender'] || r.gender || '';
      const level = r['Level'] || r.level || '';
      const fieldType = r['Field Type'] || r.fieldType || '';
      const fieldRating = r['Field Rating'] || r.fieldRating || 0;
      const compRating = r['Competition Rating'] || r.competitionRating || 0;
      const comments = r['Comments'] || r.comments || '';
      const reviewer = r['Reviewer'] || r.reviewer || 'Anonymous';
      const timestamp = r['Timestamp'] || r.timestamp || '';
      const tournamentDate = r['Tournament Date'] || r.tournamentDate || '';

      return `
        <div class="review-card">
          <h4>${Utils.escapeHtml(tournament)}</h4>
          <div class="review-meta">
            <span>${Utils.escapeHtml(ageGroup)}</span>
            <span>${Utils.escapeHtml(gender)}</span>
            <span>${Utils.escapeHtml(level)}</span>
            ${fieldType ? `<span>${Utils.escapeHtml(fieldType)}</span>` : ''}
            ${tournamentDate ? `<span>${Utils.formatDate(tournamentDate)}</span>` : ''}
          </div>
          <div class="review-ratings">
            <div>
              <span class="rating-label">Fields:</span>
              ${Utils.renderStars(fieldRating)} ${Number(fieldRating).toFixed(0)}/5
            </div>
            <div>
              <span class="rating-label">Competition:</span>
              ${Utils.renderStars(compRating)} ${Number(compRating).toFixed(0)}/5
            </div>
          </div>
          ${comments ? `<div class="review-comments">${Utils.escapeHtml(comments)}</div>` : ''}
          <div class="review-footer">
            ${Utils.escapeHtml(reviewer)} ${timestamp ? `&middot; ${Utils.timeAgo(timestamp)}` : ''}
          </div>
        </div>`;
    }).join('');
  },

  applyFilters() {
    const tournament = document.getElementById('filter-tournament')?.value || '';
    const ageGroup = document.getElementById('filter-age')?.value || '';
    const gender = document.getElementById('filter-gender')?.value || '';
    const level = document.getElementById('filter-level')?.value || '';

    let filtered = [...this._reviews];

    if (tournament) {
      filtered = filtered.filter(r => (r['Tournament'] || r.tournament) === tournament);
    }
    if (ageGroup) {
      filtered = filtered.filter(r => (r['Age Group'] || r.ageGroup) === ageGroup);
    }
    if (gender) {
      filtered = filtered.filter(r => (r['Gender'] || r.gender) === gender);
    }
    if (level) {
      filtered = filtered.filter(r => (r['Level'] || r.level) === level);
    }

    // Update aggregates
    this.renderAggregates(document.getElementById('review-aggregates'), filtered);
    this.renderReviews(document.getElementById('review-list'), filtered);
  },

  renderAggregates(container, reviews) {
    if (!reviews.length) {
      container.innerHTML = '';
      return;
    }

    const avgField = Utils.avgRating(reviews, 'Field Rating');
    const avgComp = Utils.avgRating(reviews, 'Competition Rating');
    const uniqueTournaments = new Set(reviews.map(r => r['Tournament'] || r.tournament)).size;

    container.innerHTML = `
      <div class="aggregate-bar">
        <div class="stat">
          <div class="stat-value">${reviews.length}</div>
          <div class="stat-label">Total Reviews</div>
        </div>
        <div class="stat">
          <div class="stat-value">${uniqueTournaments}</div>
          <div class="stat-label">Tournaments</div>
        </div>
        <div class="stat">
          <div class="stat-value">${avgField}</div>
          <div class="stat-label">Avg Field Rating</div>
        </div>
        <div class="stat">
          <div class="stat-value">${avgComp}</div>
          <div class="stat-label">Avg Competition</div>
        </div>
      </div>`;
  },

  populateFilterOptions() {
    // Tournament filter
    const filterTournament = document.getElementById('filter-tournament');
    if (filterTournament) {
      const tournaments = [...new Set(this._reviews.map(r => r['Tournament'] || r.tournament))].sort();
      filterTournament.innerHTML = '<option value="">All Tournaments</option>';
      tournaments.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        filterTournament.appendChild(opt);
      });
    }

    // Bind filter change events
    ['filter-tournament', 'filter-age', 'filter-gender', 'filter-level'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => this.applyFilters());
    });
  },

  initDisplay() {
    this.populateFilterOptions();
    this.applyFilters();
  }
};
