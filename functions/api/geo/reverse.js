const OPENWEATHER_BASE = "https://api.openweathermap.org";

export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  const params = new URLSearchParams();
  if (lat) params.set("lat", lat);
  if (lon) params.set("lon", lon);
  params.set("appid", context.env.OPENWEATHER_API_KEY);

  const url = `${OPENWEATHER_BASE}/geo/1.0/reverse?${params.toString()}`;
  const response = await fetch(url, { cf: { cacheTtl: 300 } });
  const body = await response.text();

  return new Response(body, { status: response.status, headers: { "Content-Type": "application/json" } });
}
