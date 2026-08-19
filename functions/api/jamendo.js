import { errorResponse, fetchUpstream, hashDateString, secondsUntilNextUtcMidnight } from "./_utils.js";

const JAMENDO_TRACKS_URL = "https://api.jamendo.com/v3.0/tracks/";
const POOL_SIZE = 200;

function buildTracksUrl(clientId) {
  const params = new URLSearchParams();
  params.set("client_id", clientId);
  params.set("format", "json");
  params.set("limit", String(POOL_SIZE));
  params.set("order", "popularity_month");
  params.set("include", "musicinfo licenses");
  params.set("audioformat", "mp31");
  return `${JAMENDO_TRACKS_URL}?${params.toString()}`;
}

export async function onRequestGet(context) {
  if (!context.env.JAMENDO_CLIENT_ID) {
    return errorResponse("Server is misconfigured: missing JAMENDO_CLIENT_ID", 500);
  }

  try {
    const result = await fetchUpstream(buildTracksUrl(context.env.JAMENDO_CLIENT_ID));
    if (result.status !== 200) {
      return errorResponse("Unable to reach Jamendo right now.", 502);
    }

    const tracks = JSON.parse(result.body)?.results || [];
    if (tracks.length < 1) {
      return errorResponse("No song is available right now.", 502);
    }

    const todayUtc = new Date().toISOString().slice(0, 10);
    const index = hashDateString(todayUtc) % tracks.length;
    const track = tracks[index];

    return Response.json(
      {
        name: track.name,
        artist_name: track.artist_name,
        album_name: track.album_name,
        album_image: track.album_image,
        audio: track.audio,
        shareurl: track.shareurl,
        license_ccurl: track.license_ccurl,
      },
      { headers: { "Cache-Control": `public, max-age=${secondsUntilNextUtcMidnight()}` } }
    );
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return errorResponse("Jamendo service timed out. Please try again.", 504);
    }
    return errorResponse("Unable to fetch today's song right now.", 502);
  }
}
