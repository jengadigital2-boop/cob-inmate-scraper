require('dotenv').config();
const express = require('express');
const { scrapeInmate } = require('./src/scraper');

const app = express();
app.use(express.json());

app.post('/scrape', async (req, res) => {
  const token = req.headers['x-auth-token'];

  if (!token || token !== process.env.SCRAPER_AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name, mode } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const result = await scrapeInmate(name, mode || 'Inquiry');
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: true,
      message: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
