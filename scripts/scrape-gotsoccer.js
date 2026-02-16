#!/usr/bin/env node

/**
 * GotSoccer Tournament Scraper
 *
 * Fetches California tournament listings from GotSoccer and outputs tournaments.json.
 * Designed to run in GitHub Actions on a weekly schedule.
 *
 * Usage: node scripts/scrape-gotsoccer.js
 */

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://home.gotsoccer.com/events.aspx';
const STATE = 'CA';
const MAX_PAGES = 10;

// Generate first-of-month dates for the next 6 months
function getDateParams() {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    dates.push(`${d.getMonth() + 1}/1/${d.getFullYear()}`);
  }
  return dates;
}

async function fetchPage(dateParam, page) {
  const url = `${BASE_URL}?type=Tournament&search=&state=${STATE}&date=${encodeURIComponent(dateParam)}&age=&featured=&Page=${page}`;
  console.log(`Fetching: ${url}`);

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} fetching ${url}`);
  }
  return resp.text();
}

function parseTournaments(html) {
  const $ = cheerio.load(html);
  const tournaments = [];

  // GotSoccer lists events in a table or card-like structure
  // Each event has a link, date info, and location
  $('table.gray-striped-table tbody tr, .event-listing .event-item, table tr').each((_, el) => {
    const $el = $(el);
    const cells = $el.find('td');

    if (cells.length >= 3) {
      // Try to extract tournament info from table rows
      const nameLink = cells.eq(0).find('a').first();
      const name = nameLink.text().trim() || cells.eq(0).text().trim();
      const href = nameLink.attr('href') || '';
      const dateText = cells.eq(1).text().trim();
      const locationText = cells.eq(2).text().trim();

      if (name && name !== 'Event' && !name.includes('No events found')) {
        const dates = parseDateRange(dateText);
        tournaments.push({
          name,
          startDate: dates.start,
          endDate: dates.end,
          location: locationText,
          url: href.startsWith('http') ? href : (href ? `https://home.gotsoccer.com${href}` : ''),
          source: 'gotsoccer',
        });
      }
    }
  });

  // Alternative: try anchor-based parsing if table parsing got nothing
  if (tournaments.length === 0) {
    $('a[href*="events"]').each((_, el) => {
      const $a = $(el);
      const name = $a.text().trim();
      const href = $a.attr('href') || '';

      // Skip navigation links
      if (!name || name.length < 4 || name === 'Events' || name.includes('Page')) return;

      const parent = $a.closest('tr, .event-item, div');
      const fullText = parent.text();

      // Try to find date pattern near the name
      const dateMatch = fullText.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s*[-–]\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
      const locationMatch = fullText.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*CA/);

      if (name.length > 3) {
        tournaments.push({
          name,
          startDate: dateMatch ? formatDateToISO(dateMatch[1]) : '',
          endDate: dateMatch ? formatDateToISO(dateMatch[2]) : '',
          location: locationMatch ? `${locationMatch[0]}` : '',
          url: href.startsWith('http') ? href : (href ? `https://home.gotsoccer.com${href}` : ''),
          source: 'gotsoccer',
        });
      }
    });
  }

  return tournaments;
}

function parseDateRange(text) {
  // Handle formats like "4/4/2026 - 4/5/2026" or "Apr 4-5, 2026"
  const rangeMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s*[-–]\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (rangeMatch) {
    return {
      start: formatDateToISO(rangeMatch[1]),
      end: formatDateToISO(rangeMatch[2]),
    };
  }

  const singleMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (singleMatch) {
    return {
      start: formatDateToISO(singleMatch[1]),
      end: formatDateToISO(singleMatch[1]),
    };
  }

  return { start: '', end: '' };
}

function formatDateToISO(mmddyyyy) {
  const parts = mmddyyyy.split('/');
  if (parts.length !== 3) return '';
  const [m, d, y] = parts;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function generateId(tournament) {
  const slug = tournament.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `gotsoccer-${slug}-${tournament.startDate}`;
}

async function scrapeAll() {
  const allTournaments = new Map();
  const dateParams = getDateParams();

  for (const dateParam of dateParams) {
    for (let page = 1; page <= MAX_PAGES; page++) {
      try {
        const html = await fetchPage(dateParam, page);
        const tournaments = parseTournaments(html);

        if (tournaments.length === 0) {
          console.log(`  No results on page ${page}, moving to next date range`);
          break;
        }

        for (const t of tournaments) {
          const key = `${t.name.toLowerCase()}-${t.startDate}`;
          if (!allTournaments.has(key)) {
            t.id = generateId(t);
            allTournaments.set(key, t);
          }
        }

        console.log(`  Found ${tournaments.length} tournaments on page ${page}`);

        // Small delay to be polite
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`  Error fetching page ${page} for ${dateParam}: ${err.message}`);
        break;
      }
    }
  }

  return Array.from(allTournaments.values()).sort(
    (a, b) => (a.startDate || '').localeCompare(b.startDate || '')
  );
}

async function main() {
  console.log('Starting GotSoccer scrape for California tournaments...\n');

  const tournaments = await scrapeAll();

  const output = {
    lastUpdated: new Date().toISOString(),
    source: 'GotSoccer (home.gotsoccer.com)',
    state: STATE,
    count: tournaments.length,
    tournaments,
  };

  const outPath = path.join(__dirname, '..', 'data', 'tournaments.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`\nDone! Wrote ${tournaments.length} tournaments to ${outPath}`);
}

main().catch(err => {
  console.error('Scraper failed:', err);
  process.exit(1);
});
