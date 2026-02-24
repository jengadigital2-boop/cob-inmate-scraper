const { chromium } = require('playwright');

const BASE_URL = 'http://inmate-search.cobbsheriff.org/enter_name.shtm';

async function scrapeInmate(name, mode) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    // 🔹 Load search page
    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // 🔹 DEBUG: capture page HTML immediately
    const initialHtml = await page.content();

    if (!initialHtml || initialHtml.length < 500) {
      return {
        found: false,
        error: 'Page appears blocked or empty',
        debugHtmlLength: initialHtml?.length || 0,
        debugSnippet: initialHtml?.slice(0, 500)
      };
    }

    // 🔹 Fill search form
    await page.fill('input[name="inmate_name"]', name);
    await page.selectOption('select[name="qry"]', mode);

    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 })
    ]);

    // 🔹 DEBUG: capture results page
    const resultsHtml = await page.content();

    if (resultsHtml.length < 500) {
      return {
        found: false,
        error: 'Results page blocked or empty',
        debugHtmlLength: resultsHtml.length,
        debugSnippet: resultsHtml.slice(0, 500)
      };
    }

    // 🔹 Check if inmate exists
    const hasResults = await page.$('table');

    if (!hasResults) {
      return {
        found: false,
        message: 'No inmate found',
        debugHtmlLength: resultsHtml.length,
        debugSnippet: resultsHtml.slice(0, 500)
      };
    }

    // 🔹 Extract raw table rows
    const allRows = await page.$$eval('table tr', rows =>
      rows.map(row =>
        Array.from(row.querySelectorAll('td')).map(td =>
          td.innerText.trim()
        )
      )
    );

    return {
      found: true,
      gotDetailPage: false,
      pageData: { allRows },
      name,
      scrapedAt: new Date().toISOString()
    };

  } catch (err) {
    return {
      found: false,
      error: err.message
    };
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeInmate };
