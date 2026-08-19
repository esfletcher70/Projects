// @ts-check
const { test, expect } = require('@playwright/test');
const { mockJamendoApi, SONG } = require('./helpers/mockJamendo');

test.describe('Song of the Day', () => {
  test('shows today\'s song with title, artist, and album', async ({ page }) => {
    await mockJamendoApi(page);
    await page.goto('/Song-of-the-Day.html');

    await expect(page.getByText(SONG.name)).toBeVisible();
    await expect(page.getByText(SONG.artist_name)).toBeVisible();
    await expect(page.getByText(SONG.album_name)).toBeVisible();

    const audio = page.locator('.song-audio');
    await expect(audio).toHaveAttribute('src', SONG.audio);

    const link = page.getByRole('link', { name: /View on Jamendo/ });
    await expect(link).toHaveAttribute('href', SONG.shareurl);
  });

  test('shows an error message when the song fails to load', async ({ page }) => {
    await page.route('**/api/jamendo**', (route) =>
      route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ message: 'Unable to reach Jamendo right now.' }) })
    );
    await page.goto('/Song-of-the-Day.html');

    await expect(page.getByText(/Unable to reach Jamendo/)).toBeVisible();
  });

  test('works embedded in its homepage card', async ({ page }) => {
    await mockJamendoApi(page);
    await page.goto('/');

    const card = page.locator('.card', { hasText: 'Song of the Day' });
    await card.getByRole('button', { name: "Play Today's Song" }).click();

    await expect(card).toHaveClass(/active/);
    await expect(card.getByText(SONG.name)).toBeVisible();
  });
});
