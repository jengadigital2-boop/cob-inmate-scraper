# Cobb County Inmate Scraper

Playwright-based scraper deployed on Railway.

## Setup

1. Clone repo
2. Run:
   npm install
3. Create .env file
4. Start:
   npm start

## API

POST /scrape

Headers:
x-auth-token: your_token

Body:
{
  "name": "Rankin Shawn",
  "mode": "Inquiry"
}
