const express = require('express');
const { scrapeInmate } = require('./src/scraper');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Cobb Inmate Scraper is running');
});

app.post('/scrape', async (req, res) => {
  try {
    const token = req.headers['x-auth-token'];

    if (token !== process.env.SCRAPER_AUTH_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, mode } = req.body;

    if (!name || !mode) {
      return res.status(400).json({ error: 'Missing name or mode' });
    }

    const result = await scrapeInmate(name, mode);
    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
