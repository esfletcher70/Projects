// @ts-check
const { test, expect } = require('@playwright/test');
const { mockWeatherApi, WEATHER } = require('./helpers/mockWeather');

test.describe('Weather dashboard', () => {
  test('searching a city renders current conditions and forecast', async ({ page }) => {
    await mockWeatherApi(page);
    await page.goto('/Weather.html');

    // Search box is present.
    const searchInput = page.getByPlaceholder(/Search city, state, or country/);
    await expect(searchInput).toBeVisible();

    // Perform a search.
    await searchInput.fill('Los Angeles, CA');
    await page.getByRole('button', { name: 'Search' }).click();

    // Location name from the geocoding mock.
    await expect(page.getByRole('heading', { name: 'Los Angeles, California' })).toBeVisible();

    // Current conditions (the description also appears in the forecast, so target the first).
    await expect(page.getByText('clear sky').first()).toBeVisible();
    await expect(page.getByText(`${Math.round(WEATHER.current.temp)}°F`).first()).toBeVisible();
    await expect(page.getByText(`${WEATHER.current.humidity}%`)).toBeVisible();

    // Forecast section.
    await expect(page.getByText(`${WEATHER.daily.length}-Day Forecast`)).toBeVisible();
  });

  test('shows an error for an empty search', async ({ page }) => {
    await mockWeatherApi(page);
    await page.goto('/Weather.html');

    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByText(/Enter a city, state, or country/)).toBeVisible();
  });

  test('shows an error when the location is not found', async ({ page }) => {
    await page.route('**/api/geo/direct**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.route('**/api/geo/reverse**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.route('**/api/weather**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );

    await page.goto('/Weather.html');
    await page.getByPlaceholder(/Search city, state, or country/).fill('Nowhere, XX');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByText(/Location not found/)).toBeVisible();
  });
});
