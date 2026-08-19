// @ts-check
/**
 * Mock data + route interception for the Song of the Day card.
 *
 * The card talks to a Cloudflare Pages Function (/api/jamendo), which in turn
 * queries the Jamendo public API. This mock stands in for that response so
 * the E2E test is deterministic and needs no network access.
 */

const SONG = {
  name: 'Sunset Drive',
  artist_name: 'Ketsa',
  album_name: 'Vessels',
  album_image: 'https://usercontent.jamendo.com/covers/1234/1234/200x200.jpg',
  audio: 'https://prod-1.storage.jamendo.com/track/1234/mp32/',
  shareurl: 'https://www.jamendo.com/track/1234/sunset-drive',
  license_ccurl: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
};

/**
 * Install a route mock for the jamendo API endpoint on the given page.
 * @param {import('@playwright/test').Page} page
 */
async function mockJamendoApi(page) {
  await page.route('**/api/jamendo**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SONG) })
  );
}

module.exports = { SONG, mockJamendoApi };
