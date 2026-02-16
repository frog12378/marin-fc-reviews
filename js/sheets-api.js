// Marin FC - Google Sheets API (via Apps Script)

const SheetsAPI = {
  async submitReview(reviewData) {
    if (!CONFIG.APPS_SCRIPT_URL) {
      throw new Error('Apps Script URL not configured. See README for setup instructions.');
    }

    const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(reviewData),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to submit review');
    }

    return result;
  },

  async getReviews() {
    if (!CONFIG.APPS_SCRIPT_URL) {
      // Return empty for demo/dev mode when no backend configured
      return [];
    }

    const url = `${CONFIG.APPS_SCRIPT_URL}?action=getReviews`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to fetch reviews');
    }

    return result.reviews || [];
  },

  async getManualTournaments() {
    if (!CONFIG.APPS_SCRIPT_URL) return [];

    const url = `${CONFIG.APPS_SCRIPT_URL}?action=getManualTournaments`;
    const response = await fetch(url);

    if (!response.ok) return [];

    const result = await response.json();
    return result.tournaments || [];
  }
};
