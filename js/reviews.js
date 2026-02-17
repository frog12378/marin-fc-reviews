// Marin FC - Review submission and display

const Reviews = {
  _reviews: [],
  _reviewsByTournament: {},
  _editingReview: null, // Track which review is being edited

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
    const cancelBtn = document.getElementById('cancel-edit-btn');

    // Show/hide "other" field
    tournamentSelect.addEventListener('change', () => {
      otherTournament.hidden = tournamentSelect.value !== '__other__';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit(form, submitBtn);
    });

    // Cancel edit button
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.cancelEdit());
    }
  },

  // --- Edit Mode ---

  startEdit(review) {
    this._editingReview = review;
    const form = document.getElementById('review-form');

    // Update form title and button
    document.getElementById('form-title').textContent = 'Edit Review';
    document.getElementById('submit-review-btn').textContent = 'Update Review';
    document.getElementById('cancel-edit-btn').hidden = false;

    // Pre-populate fields
    const tournament = review.tournament || review['Tournament'] || '';
    const tournamentSelect = form.querySelector('#review-tournament');

    // Check if tournament is in the dropdown
    const options = Array.from(tournamentSelect.options).map(o => o.value);
    if (options.includes(tournament)) {
      tournamentSelect.value = tournament;
      document.getElementById('other-tournament-group').hidden = true;
    } else {
      tournamentSelect.value = '__other__';
      document.getElementById('other-tournament-group').hidden = false;
      form.querySelector('#other-tournament-name').value = tournament;
    }

    form.querySelector('#review-age').value = review.ageGroup || review['Age Group'] || '';
    form.querySelector('#review-level').value = review.level || review['Level'] || '';
    form.querySelector('#review-date').value = review.tournamentDate || review['Tournament Date'] || '';
    form.querySelector('#review-comments').value = review.comments || review['Comments'] || '';

    // Set radio buttons
    const gender = review.gender || review['Gender'] || '';
    const genderRadio = form.querySelector(`input[name="gender"][value="${gender}"]`);
    if (genderRadio) genderRadio.checked = true;

    const fieldType = review.fieldType || review['Field Type'] || '';
    const fieldTypeRadio = form.querySelector(`input[name="fieldType"][value="${fieldType}"]`);
    if (fieldTypeRadio) fieldTypeRadio.checked = true;

    const fieldRating = review.fieldRating || review['Field Rating'] || '';
    const fieldRatingRadio = form.querySelector(`input[name="fieldRating"][value="${fieldRating}"]`);
    if (fieldRatingRadio) fieldRatingRadio.checked = true;

    const compRating = review.competitionRating || review['Competition Rating'] || '';
    const compRatingRadio = form.querySelector(`input[name="competitionRating"][value="${compRating}"]`);
    if (compRatingRadio) compRatingRadio.checked = true;

    // Navigate to submit view
    location.hash = 'submit';
    window.scrollTo(0, 0);
  },

  cancelEdit() {
    this._editingReview = null;
    const form = document.getElementById('review-form');
    form.reset();
    document.getElementById('form-title').textContent = 'Submit a Review';
    document.getElementById('submit-review-btn').textContent = 'Submit Review';
    document.getElementById('cancel-edit-btn').hidden = true;
    document.getElementById('other-tournament-group').hidden = true;
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

    // If editing, include the existing review's ID and timestamp
    if (this._editingReview) {
      reviewData.id = this._editingReview.id || this._editingReview['ID'];
      reviewData.timestamp = this._editingReview.timestamp || this._editingReview['Timestamp'];
    }

    // Submit
    const isEditing = !!this._editingReview;
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
    submitBtn.textContent = isEditing ? 'Updating...' : 'Submitting...';

    try {
      if (isEditing) {
        await SheetsAPI.updateReview(reviewData);
        Utils.showToast('Review updated!');
      } else {
        await SheetsAPI.submitReview(reviewData);
        Utils.showToast('Review submitted! Thanks for your feedback.');
      }

      // Reset form and edit state
      this._editingReview = null;
      form.reset();
      document.getElementById('other-tournament-group').hidden = true;
      document.getElementById('form-title').textContent = 'Submit a Review';
      document.getElementById('cancel-edit-btn').hidden = true;

      // Refresh reviews
      await this.loadReviews();
      Reviews.initDisplay();

      // Navigate to reviews view
      location.hash = 'reviews';
    } catch (err) {
      Utils.showToast(err.message || 'Failed to submit. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
      submitBtn.textContent = isEditing ? 'Update Review' : 'Submit Review';
    }
  },

  // --- Delete Review ---

  async deleteReview(review) {
    const id = review.id || review['ID'];
    const reviewer = review.reviewer || review['Reviewer'];

    if (!confirm('Are you sure you want to delete this review? This cannot be undone.')) {
      return;
    }

    try {
      await SheetsAPI.deleteReview(id, reviewer);
      Utils.showToast('Review deleted.');
      await this.loadReviews();
      Reviews.initDisplay();
    } catch (err) {
      Utils.showToast(err.message || 'Failed to delete review.', 'error');
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

    const currentUser = Auth.getUser();

    // Sort by most recent first
    const sorted = [...reviews].sort(
      (a, b) => new Date(b.timestamp || b.Timestamp || 0) - new Date(a.timestamp || a.Timestamp || 0)
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
      const reviewId = r['ID'] || r.id || '';

      const isOwner = currentUser && reviewer === currentUser;

      return `
        <div class="review-card" data-review-id="${Utils.escapeHtml(reviewId)}">
          <div class="review-card-header">
            <h4>${Utils.escapeHtml(tournament)}</h4>
            ${isOwner ? `
              <div class="review-actions">
                <button class="review-edit-btn" data-id="${Utils.escapeHtml(reviewId)}" title="Edit review">&#9998; Edit</button>
                <button class="review-delete-btn" data-id="${Utils.escapeHtml(reviewId)}" title="Delete review">&#128465; Delete</button>
              </div>
            ` : ''}
          </div>
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

    // Bind edit/delete button events
    container.querySelectorAll('.review-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const review = this._reviews.find(r => (r.id || r['ID']) === id);
        if (review) this.startEdit(review);
      });
    });

    container.querySelectorAll('.review-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const review = this._reviews.find(r => (r.id || r['ID']) === id);
        if (review) this.deleteReview(review);
      });
    });
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
