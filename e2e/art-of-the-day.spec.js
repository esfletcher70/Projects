// @ts-check
const { test, expect } = require('@playwright/test');
const { mockArticApi, ARTWORK } = require('./helpers/mockArtic');

test.describe('Art Piece of the Day', () => {
  test('shows today\'s artwork with title, artist, and credit line', async ({ page }) => {
    await mockArticApi(page);
    await page.goto('/Art-Piece-of-the-Day.html');

    await expect(page.getByText(ARTWORK.title)).toBeVisible();
    await expect(page.getByText(ARTWORK.artist_display)).toBeVisible();
    await expect(page.getByText(ARTWORK.credit_line)).toBeVisible();

    const image = page.locator('.art-image');
    await expect(image).toHaveAttribute('src', new RegExp(ARTWORK.image_id));

    const link = page.getByRole('link', { name: /View on artic.edu/ });
    await expect(link).toHaveAttribute('href', `https://www.artic.edu/artworks/${ARTWORK.id}`);
  });

  test('shows an error message when the artwork fails to load', async ({ page }) => {
    await page.route('**/api/artic**', (route) =>
      route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ message: 'Unable to reach the Art Institute of Chicago right now.' }) })
    );
    await page.goto('/Art-Piece-of-the-Day.html');

    await expect(page.getByText(/Unable to reach the Art Institute of Chicago/)).toBeVisible();
  });

  test('works embedded in its homepage card', async ({ page }) => {
    await mockArticApi(page);
    await page.goto('/');

    const card = page.locator('.card', { hasText: 'Art Piece of the Day' });
    await card.getByRole('button', { name: "See Today's Art" }).click();

    await expect(card).toHaveClass(/active/);
    await expect(card.getByText(ARTWORK.title)).toBeVisible();
  });
});
