const { chromium } = require('playwright');

async function scrapeInmate(name) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // 1️⃣ Go to search page
    await page.goto(
      'https://inmate-search.cobbsheriff.org/enter_name.shtm',
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );

    // 2️⃣ Fill inmate name
    await page.fill('input[name="inmate_name"]', name);

    // 3️⃣ Select Inquiry
    await page.selectOption('select[name="qry"]', {
      label: 'Inquiry'
    });

    await page.waitForTimeout(500);

    // 4️⃣ Click Search
    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 })
    ]);

    // 5️⃣ Click "Last Known Booking"
    await Promise.all([
      page.click('input[value="Last Known Booking"]'),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 })
    ]);

    // 6️⃣ Scrape detail page
    const bookingData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr'));
      const data = {};

      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 2) {
          const key = cells[0].innerText.trim();
          const value = cells[1].innerText.trim();
          if (key && value) {
            data[key] = value;
          }
        }
      });

      return data;
    });

    await browser.close();

    return {
      found: true,
      data: bookingData
    };

  } catch (error) {
    await browser.close();
    return {
      found: false,
      error: error.message
    };
  }
}

module.exports = { scrapeInmate };
