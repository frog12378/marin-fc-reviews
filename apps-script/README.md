# Google Apps Script Setup

This is the backend for storing tournament reviews in Google Sheets.

## Setup Steps

### 1. Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it **"Marin FC Tournament Reviews"**
3. Rename the first tab to **"Reviews"**
4. Add these headers in Row 1:

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| ID | Timestamp | Reviewer | Tournament | Age Group | Gender | Level | Tournament Date | Field Rating | Competition Rating | Comments |

### 2. Get the Sheet ID

The Sheet ID is in the spreadsheet URL:
```
https://docs.google.com/spreadsheets/d/THIS_IS_THE_SHEET_ID/edit
```

### 3. Set Up Apps Script

1. In the spreadsheet, go to **Extensions > Apps Script**
2. Delete any default code
3. Copy the contents of `Code.gs` from this folder
4. Replace `YOUR_SHEET_ID_HERE` with your actual Sheet ID
5. Save (Ctrl+S)

### 4. Deploy as Web App

1. Click **Deploy > New deployment**
2. Click the gear icon and select **Web app**
3. Set:
   - **Description**: "Marin FC Reviews API"
   - **Execute as**: "Me"
   - **Who has access**: "Anyone"
4. Click **Deploy**
5. Authorize when prompted (click through the "not verified" warning - this is your own script)
6. Copy the **Web app URL**

### 5. Configure the Website

1. Open `js/config.js` in the website repo
2. Paste the Web app URL as the `APPS_SCRIPT_URL` value:
   ```javascript
   APPS_SCRIPT_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
   ```

### 6. Test

Submit a test review through the website and check that it appears in your Google Sheet.

## Updating the Script

When you update `Code.gs`:
1. Paste the new code in Apps Script editor
2. Go to **Deploy > Manage deployments**
3. Click the pencil icon on your deployment
4. Set **Version** to "New version"
5. Click **Deploy**

The URL stays the same when you update an existing deployment.

## Troubleshooting

- **"Script function not found"**: Make sure `doPost` and `doGet` are top-level functions
- **CORS errors**: The web app must be deployed with access set to "Anyone"
- **"Authorization required"**: Re-authorize the script after making changes
- **Empty reviews**: Check that the Sheet ID is correct and the "Reviews" tab exists
