# Marin FC Tournament Reviews

A website for Marin FC club members to share feedback on youth soccer tournaments in California.

## Features

- **Tournament Listings** - Auto-populated from GotSoccer (CA tournaments) + manual additions
- **Submit Reviews** - Rate field conditions and competition quality (1-5 stars), add commentary
- **Browse Reviews** - Filter by tournament, age group, gender, and competition level
- **Password Protected** - Invite code required to access (share with club members only)
- **Mobile Friendly** - Designed for use at the fields on your phone

## Quick Start

### 1. Set Up Google Sheets Backend

Follow the instructions in [`apps-script/README.md`](apps-script/README.md) to:
1. Create a Google Sheet with the Reviews tab
2. Deploy the Apps Script as a web app
3. Copy the deployment URL

### 2. Configure the Site

Edit `js/config.js` and set your Apps Script URL:

```javascript
APPS_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_ID/exec',
```

### 3. Deploy to GitHub Pages

1. Push this repo to GitHub
2. Go to Settings > Pages
3. Source: Deploy from a branch
4. Branch: `main`, folder: `/ (root)`
5. Save

Your site will be live at `https://yourusername.github.io/marin-fc-reviews/`

### 4. Share with Club Members

Share the invite code (**GoMarinFC!**) and the website URL with your teams.

## Managing Tournaments

### Automatic (GotSoccer)

A GitHub Actions workflow runs every Sunday to scrape CA tournaments from GotSoccer. The data is saved to `data/tournaments.json` and committed automatically.

To trigger a manual scrape: Go to Actions > "Scrape GotSoccer Tournaments" > Run workflow.

### Manual Additions

Edit `data/manual-tournaments.json` to add tournaments not listed on GotSoccer:

```json
{
  "tournaments": [
    {
      "id": "manual-your-tournament-2026",
      "name": "Your Tournament Name",
      "startDate": "2026-05-01",
      "endDate": "2026-05-02",
      "location": "City, CA",
      "url": "",
      "source": "manual"
    }
  ]
}
```

## Changing the Invite Code

1. Generate a new SHA-256 hash of your desired code:
   ```bash
   echo -n "YourNewCode" | shasum -a 256
   ```
2. Update `CONFIG.INVITE_CODE_HASH` in `js/config.js` with the new hash
3. Commit and push

## Project Structure

```
├── index.html              # Main page (single-page app)
├── css/
│   ├── pico.min.css        # CSS framework
│   └── custom.css          # Custom styles
├── js/
│   ├── config.js           # Configuration (invite code hash, API URL)
│   ├── auth.js             # Authentication
│   ├── app.js              # App controller & routing
│   ├── tournaments.js      # Tournament data
│   ├── reviews.js          # Review form & display
│   ├── sheets-api.js       # Google Sheets API wrapper
│   └── utils.js            # Utilities
├── data/
│   ├── tournaments.json    # GotSoccer data (auto-updated)
│   └── manual-tournaments.json
├── scripts/
│   └── scrape-gotsoccer.js # Tournament scraper
├── apps-script/
│   ├── Code.gs             # Google Apps Script backend
│   └── README.md           # Setup instructions
└── .github/workflows/
    └── scrape-tournaments.yml
```

## Tech Stack

- **Hosting**: GitHub Pages (free)
- **Frontend**: Vanilla HTML/CSS/JS + Pico CSS
- **Backend**: Google Sheets + Apps Script (free)
- **Scraping**: Node.js + cheerio via GitHub Actions
- **Auth**: Client-side SHA-256 hash comparison
