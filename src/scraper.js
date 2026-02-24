const { chromium } = require('playwright');

const BASE_URL =
  'http://inmate-search.cobbsheriff.org/enter_name.shtm';

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
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    await page.fill('input[name="inmate_name"]', name);

    await page.selectOption('select[name="qry"]', {
      label: mode
    });

    await Promise.all([
      page.waitForNavigation(),
      page.click('input[type="submit"], input[value="Search"]')
    ]);

    const summaryData = await page.$$eval('table tr', rows => {
      const data = [];

      rows.slice(1).forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length < 7) return;

        data.push({
          name: cols[1]?.innerText.trim(),
          dob: cols[2]?.innerText.trim(),
          race: cols[3]?.innerText.trim(),
          sex: cols[4]?.innerText.trim(),
          location: cols[5]?.innerText.trim(),
          soid: cols[6]?.innerText.trim(),
          daysInCustody: cols[7]?.innerText.trim()
        });
      });

      return data;
    });

    if (!summaryData.length) {
      await browser.close();
      return { found: false };
    }

    const bookingButton = await page.$(
      'input[value="Last Known Booking"]'
    );

    if (!bookingButton) {
      await browser.close();
      return {
        found: true,
        summary: summaryData,
        gotDetailPage: false
      };
    }

    await Promise.all([
      page.waitForNavigation(),
      bookingButton.click()
    ]);

    const detailRows = await page.$$eval('table tr', rows =>
      rows.map(row =>
        Array.from(row.querySelectorAll('td')).map(td =>
          td.innerText.trim()
        )
      ).filter(r => r.length > 0)
    );

    await browser.close();

    return {
      found: true,
      summary: summaryData,
      gotDetailPage: true,
      pageData: {
        allRows: detailRows
      },
      scrapedAt: new Date().toISOString()
    };

  } catch (err) {
    await browser.close();
    return {
      error: true,
      message: err.message
    };
  }
}

module.exports = { scrapeInmate };
