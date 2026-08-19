import { errorResponse, fetchUpstream, hashDateString, secondsUntilNextUtcMidnight } from "./_utils.js";

const ARTIC_SEARCH_URL = "https://api.artic.edu/api/v1/artworks/search";
const ARTIC_FIELDS = "id,title,artist_display,date_display,medium_display,credit_line,image_id";
const ARTIC_HEADERS = {
  "User-Agent": "SmallAppTools/1.0 (+https://smallapp.tools)",
  "AIC-User-Agent": "SmallAppTools (+https://smallapp.tools)",
};

// Elasticsearch (which backs the AIC API) refuses to page past this offset.
const MAX_RESULT_WINDOW = 9999;

function buildSearchUrl(page) {
  const params = new URLSearchParams();
  params.set("query[bool][must][0][term][is_public_domain]", "true");
  params.set("query[bool][must][1][exists][field]", "image_id");
  params.set("fields", ARTIC_FIELDS);
  params.set("limit", "1");
  params.set("page", String(page));
  return `${ARTIC_SEARCH_URL}?${params.toString()}`;
}

export async function onRequestGet() {
  try {
    const countResult = await fetchUpstream(buildSearchUrl(1), undefined, ARTIC_HEADERS);
    if (countResult.status !== 200) {
      return errorResponse("Unable to reach the Art Institute of Chicago right now.", 502);
    }
    const total = JSON.parse(countResult.body)?.pagination?.total || 0;
    if (total < 1) {
      return errorResponse("No artwork is available right now.", 502);
    }

    const poolSize = Math.min(total, MAX_RESULT_WINDOW);
    const todayUtc = new Date().toISOString().slice(0, 10);
    const index = hashDateString(todayUtc) % poolSize;

    const pickResult = await fetchUpstream(buildSearchUrl(index + 1), undefined, ARTIC_HEADERS);
    if (pickResult.status !== 200) {
      return errorResponse("Unable to reach the Art Institute of Chicago right now.", 502);
    }
    const artwork = JSON.parse(pickResult.body)?.data?.[0];
    if (!artwork || !artwork.image_id) {
      return errorResponse("No artwork is available right now.", 502);
    }

    return Response.json(
      {
        id: artwork.id,
        title: artwork.title,
        artist_display: artwork.artist_display,
        date_display: artwork.date_display,
        medium_display: artwork.medium_display,
        credit_line: artwork.credit_line,
        image_id: artwork.image_id,
      },
      { headers: { "Cache-Control": `public, max-age=${secondsUntilNextUtcMidnight()}` } }
    );
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return errorResponse("Art Institute of Chicago service timed out. Please try again.", 504);
    }
    return errorResponse("Unable to fetch today's artwork right now.", 502);
  }
}
