import { errorResponse, fetchUpstream } from "../_utils.js";

const OPENWEATHER_BASE = "https://api.openweathermap.org";

export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const q = searchParams.get("q");

  if (!q) {
    return errorResponse("q is required", 400);
  }

  if (!context.env.OPENWEATHER_API_KEY) {
    return errorResponse("Server is misconfigured: missing OPENWEATHER_API_KEY", 500);
  }

  const params = new URLSearchParams({ q, appid: context.env.OPENWEATHER_API_KEY });
  const url = `${OPENWEATHER_BASE}/geo/1.0/direct?${params.toString()}`;

  try {
    const { status, body } = await fetchUpstream(url);
    const headers = { "Content-Type": "application/json" };
    if (status === 200) headers["Cache-Control"] = "public, max-age=3600";
    return new Response(body, { status, headers });
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return errorResponse("Location search timed out. Please try again.", 504);
    }
    return errorResponse("Unable to reach location service right now.", 502);
  }
}
