// Marin FC - Reviews API wrapper (Netlify Functions + Blobs)

const SheetsAPI = {
  async submitReview(reviewData) {
    const response = await fetch('/.netlify/functions/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Submission failed (${response.status})`);
    }

    return response.json();
  },

  async updateReview(reviewData) {
    // Same endpoint, POST with existing ID triggers update
    return this.submitReview(reviewData);
  },

  async deleteReview(id, reviewer) {
    const response = await fetch('/.netlify/functions/reviews', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, reviewer }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Delete failed (${response.status})`);
    }

    return response.json();
  },

  async getReviews() {
    try {
      const response = await fetch('/.netlify/functions/reviews');
      if (!response.ok) {
        console.warn('Could not fetch reviews:', response.status);
        return [];
      }
      const data = await response.json();
      return data.reviews || [];
    } catch (err) {
      console.warn('Reviews fetch failed (may be running locally):', err.message);
      return [];
    }
  }
};
