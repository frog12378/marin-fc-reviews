// Netlify Function: Fetch form submissions and return as JSON
// This uses the Netlify API to read back submissions from the "tournament-review" form.
// The NETLIFY_ACCESS_TOKEN env var is set automatically when using Netlify's built-in
// form handling, OR you can set it manually in Site Settings > Environment Variables.

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // Netlify injects SITE_ID automatically in functions
    const siteId = process.env.SITE_ID;
    const token = process.env.NETLIFY_ACCESS_TOKEN;

    if (!token) {
      // No token means we can't read submissions via API
      // Return empty - the site still works for submitting
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          reviews: [],
          message: 'NETLIFY_ACCESS_TOKEN not configured. See README for setup.'
        }),
      };
    }

    // Fetch form ID first
    const formsResp = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/forms`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!formsResp.ok) {
      throw new Error(`Forms API error: ${formsResp.status}`);
    }

    const forms = await formsResp.json();
    const reviewForm = forms.find(f => f.name === 'tournament-review');

    if (!reviewForm) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ reviews: [] }),
      };
    }

    // Fetch all submissions for this form (paginated, up to 100)
    const subsResp = await fetch(
      `https://api.netlify.com/api/v1/forms/${reviewForm.id}/submissions?per_page=100`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!subsResp.ok) {
      throw new Error(`Submissions API error: ${subsResp.status}`);
    }

    const submissions = await subsResp.json();

    // Map Netlify submissions to review format
    const reviews = submissions.map(sub => ({
      'ID': sub.id,
      'Timestamp': sub.created_at,
      'Reviewer': sub.data.reviewer || 'Anonymous',
      'Tournament': sub.data.tournament || '',
      'Age Group': sub.data.ageGroup || '',
      'Gender': sub.data.gender || '',
      'Level': sub.data.level || '',
      'Tournament Date': sub.data.tournamentDate || '',
      'Field Rating': Number(sub.data.fieldRating) || 0,
      'Competition Rating': Number(sub.data.competitionRating) || 0,
      'Comments': sub.data.comments || '',
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reviews }),
    };
  } catch (err) {
    console.error('get-reviews error:', err);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reviews: [], error: err.message }),
    };
  }
};
