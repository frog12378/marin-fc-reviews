/**
 * Marin FC Tournament Reviews - Google Apps Script Backend
 *
 * SETUP:
 * 1. Create a Google Sheet with a tab named "Reviews"
 * 2. Add headers in row 1: ID | Timestamp | Reviewer | Tournament | Age Group | Gender | Level | Tournament Date | Field Rating | Competition Rating | Comments
 * 3. Open Extensions > Apps Script
 * 4. Paste this code, replacing the default Code.gs
 * 5. Update SHEET_ID below with your spreadsheet ID (from the URL)
 * 6. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. Copy the deployment URL into js/config.js APPS_SCRIPT_URL
 */

// ============ CONFIGURATION ============
const SHEET_ID = 'YOUR_SHEET_ID_HERE'; // Replace with your Google Sheet ID
const REVIEW_SHEET = 'Reviews';

// ============ HANDLERS ============

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Validate required fields
    const required = ['tournament', 'ageGroup', 'gender', 'level', 'fieldRating', 'competitionRating', 'reviewer'];
    for (const field of required) {
      if (!data[field]) {
        return jsonResponse({ status: 'error', message: 'Missing required field: ' + field });
      }
    }

    // Validate ratings are 1-5
    const fieldRating = Number(data.fieldRating);
    const compRating = Number(data.competitionRating);
    if (fieldRating < 1 || fieldRating > 5 || compRating < 1 || compRating > 5) {
      return jsonResponse({ status: 'error', message: 'Ratings must be between 1 and 5' });
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(REVIEW_SHEET);
    const id = Utilities.getUuid();
    const timestamp = new Date().toISOString();

    sheet.appendRow([
      id,
      timestamp,
      sanitize(data.reviewer),
      sanitize(data.tournament),
      sanitize(data.ageGroup),
      sanitize(data.gender),
      sanitize(data.level),
      sanitize(data.tournamentDate || ''),
      fieldRating,
      compRating,
      sanitize(data.comments || '')
    ]);

    return jsonResponse({ status: 'success', id: id });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'getReviews';

    if (action === 'getReviews') {
      return getReviews();
    }

    return jsonResponse({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

// ============ HELPERS ============

function getReviews() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(REVIEW_SHEET);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return jsonResponse({ status: 'success', reviews: [] });
  }

  const headers = data[0];
  const reviews = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx];
    });
    reviews.push(obj);
  }

  return jsonResponse({ status: 'success', reviews: reviews });
}

function sanitize(val) {
  if (typeof val !== 'string') return val;
  val = val.trim();
  // Prevent formula injection: prepend apostrophe if starts with =, +, -, @, tab, or carriage return
  if (/^[=+\-@\t\r]/.test(val)) {
    val = "'" + val;
  }
  return val;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
