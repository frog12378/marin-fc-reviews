// Netlify Function: CRUD operations for reviews using Netlify Blobs
// POST   = create or update a review
// GET    = list all reviews
// DELETE = delete a review by ID

const { getStore } = require("@netlify/blobs");

const STORE_NAME = "reviews";

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const store = getStore(STORE_NAME);

  try {
    // --- GET: List all reviews ---
    if (event.httpMethod === "GET") {
      const { blobs } = await store.list();
      const reviews = [];

      for (const blob of blobs) {
        try {
          const data = await store.get(blob.key, { type: "json" });
          if (data) reviews.push(data);
        } catch (e) {
          console.warn("Skipping bad blob:", blob.key, e.message);
        }
      }

      // Sort newest first
      reviews.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ reviews }),
      };
    }

    // --- POST: Create or update a review ---
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body);

      // Validate required fields
      const required = ["tournament", "ageGroup", "gender", "level", "fieldRating", "competitionRating", "reviewer"];
      for (const field of required) {
        if (!data[field]) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: `Missing required field: ${field}` }),
          };
        }
      }

      // Use existing ID for updates, generate new one for creates
      const id = data.id || `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const timestamp = data.timestamp || new Date().toISOString();

      const review = {
        id,
        timestamp,
        reviewer: data.reviewer,
        tournament: data.tournament,
        ageGroup: data.ageGroup,
        gender: data.gender,
        level: data.level,
        tournamentDate: data.tournamentDate || "",
        fieldType: data.fieldType || "",
        fieldRating: Number(data.fieldRating),
        competitionRating: Number(data.competitionRating),
        comments: data.comments || "",
      };

      await store.setJSON(id, review);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: "success", review }),
      };
    }

    // --- DELETE: Remove a review by ID ---
    if (event.httpMethod === "DELETE") {
      const { id, reviewer } = JSON.parse(event.body);

      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Missing review ID" }),
        };
      }

      // Verify ownership - only the reviewer can delete their own review
      const existing = await store.get(id, { type: "json" });
      if (!existing) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Review not found" }),
        };
      }

      if (existing.reviewer !== reviewer) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: "You can only delete your own reviews" }),
        };
      }

      await store.delete(id);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: "success" }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (err) {
    console.error("reviews function error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
