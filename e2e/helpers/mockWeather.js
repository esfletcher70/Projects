// @ts-check
/**
 * Mock data + route interception for the Weather dashboard.
 *
 * The weather page talks to Cloudflare Pages Functions (/api/geo/direct,
 * /api/geo/reverse, /api/weather). These mocks stand in for the upstream
 * OpenWeather responses so the E2E test is deterministic and needs no
 * network access or real API key.
 */

const GEO_DIRECT = [
  {
    name: 'Los Angeles',
    state: 'California',
    country: 'US',
    lat: 34.0522,
    lon: -118.2437,
  },
];

const WEATHER = {
  current: {
    temp: 75.5,
    feels_like: 76.2,
    humidity: 72,
    sunrise: 1786827600,
    sunset: 1786874400,
    weather: [{ icon: '01d', description: 'clear sky' }],
  },
  daily: [
    { dt: 1786827600, temp: { max: 80, min: 60 }, weather: [{ icon: '01d', description: 'clear sky' }] },
    { dt: 1786914000, temp: { max: 78, min: 58 }, weather: [{ icon: '02d', description: 'few clouds' }] },
    { dt: 1787000400, temp: { max: 82, min: 62 }, weather: [{ icon: '03d', description: 'scattered clouds' }] },
  ],
  timezone_offset: -25200,
};

/**
 * Install route mocks for the weather API endpoints on the given page.
 * @param {import('@playwright/test').Page} page
 */
async function mockWeatherApi(page) {
  await page.route('**/api/geo/direct**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(GEO_DIRECT) })
  );
  await page.route('**/api/geo/reverse**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(GEO_DIRECT) })
  );
  await page.route('**/api/weather**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WEATHER) })
  );
}

module.exports = { GEO_DIRECT, WEATHER, mockWeatherApi };
