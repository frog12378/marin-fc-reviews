// Marin FC - Netlify Forms API wrapper
// Submissions: Netlify Forms (zero config - just HTML attributes)
// Reading back: Netlify Function that calls the Netlify submissions API

const SheetsAPI = {
  async submitReview(reviewData) {
    // Submit via URL-encoded POST to Netlify Forms
    const formData = new URLSearchParams();
    formData.append('form-name', 'tournament-review');

    for (const [key, value] of Object.entries(reviewData)) {
      formData.append(key, String(value));
    }

    const response = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`Submission failed (${response.status}). Please try again.`);
    }

    return { status: 'success' };
  },

  async getReviews() {
    try {
      const response = await fetch('/.netlify/functions/get-reviews');
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
