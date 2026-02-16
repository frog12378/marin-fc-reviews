# Marin FC Tournament Reviews

A website for Marin FC club members to share feedback on youth soccer tournaments in California.

## Features

- **Tournament Listings** - Auto-populated from GotSoccer (CA tournaments) + manual additions
- **Submit Reviews** - Rate field conditions and competition quality (1-5 stars), add commentary
- **Browse Reviews** - Filter by tournament, age group, gender, and competition level
- **Password Protected** - Invite code required to access (share with club members only)
- **Mobile Friendly** - Designed for use at the fields on your phone

## Deploy in 3 Steps

### 1. Push to GitHub

Create a new repo called `marin-fc-reviews` and push this code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/marin-fc-reviews.git
git push -u origin main
```

### 2. Deploy on Netlify

1. Go to [netlify.com](https://netlify.com) and sign up (free) with your GitHub account
2. Click **"Add new site" > "Import an existing project"**
3. Select your `marin-fc-reviews` repository
4. Leave all settings as default and click **"Deploy site"**
5. Your site is live! (Netlify gives you a URL like `amazing-name-123.netlify.app`)

### 3. Enable Review Reading (optional but recommended)

To let club members see each other's reviews:

1. In Netlify dashboard, go to **User settings > Applications > Personal access tokens**
2. Click **"New access token"**, name it "Marin FC Reviews", click **Generate**
3. Copy the token
4. Go to your site's **Site settings > Environment variables**
5. Add: `NETLIFY_ACCESS_TOKEN` = (paste your token)
6. **Redeploy** the site (Deploys > Trigger deploy)

That's it! Reviews will now be visible to all club members.

### 4. Share with Club Members

Share the invite code (**GoMarinFC!**) and the website URL with your teams.

## How It Works

- **Submitting reviews**: Uses [Netlify Forms](https://docs.netlify.com/forms/setup/) - zero backend config, Netlify detects the form automatically
- **Reading reviews**: A small serverless function fetches submissions from Netlify's API
- **Tournament data**: JSON files in the `data/` folder, auto-updated weekly from GotSoccer
- **Authentication**: Invite code is SHA-256 hashed (not stored in plaintext)

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

## Viewing Submissions in Netlify

Even without the API token setup, you can always view submissions directly:
1. Go to your Netlify dashboard
2. Click your site > **Forms**
3. Click **"tournament-review"** to see all submissions

You'll also get email notifications for each new submission.

## Changing the Invite Code

1. Generate a new SHA-256 hash:
   ```bash
   echo -n "YourNewCode" | shasum -a 256
   ```
2. Update `CONFIG.INVITE_CODE_HASH` in `js/config.js`
3. Commit and push (Netlify auto-deploys)

## Tech Stack

- **Hosting & Forms**: [Netlify](https://netlify.com) (free tier: 100 form submissions/month)
- **Frontend**: Vanilla HTML/CSS/JS + [Pico CSS](https://picocss.com)
- **Serverless Function**: Netlify Functions (reads form submissions)
- **Tournament Scraping**: Node.js + cheerio via GitHub Actions
- **Auth**: Client-side SHA-256 hash comparison
