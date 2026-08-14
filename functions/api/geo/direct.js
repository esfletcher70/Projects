const OPENWEATHER_BASE = "https://api.openweathermap.org";

export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const q = searchParams.get("q");

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("appid", context.env.OPENWEATHER_API_KEY);

  const url = `${OPENWEATHER_BASE}/geo/1.0/direct?${params.toString()}`;
  const response = await fetch(url, { cf: { cacheTtl: 300 } });
  const body = await response.text();

  return new Response(body, { status: response.status, headers: { "Content-Type": "application/json" } });
}
