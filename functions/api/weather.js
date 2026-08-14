const OPENWEATHER_BASE = "https://api.openweathermap.org";
const UNITS = "imperial";

async function proxyRequest(path, query, env) {
  const params = new URLSearchParams(query);
  params.set("appid", env.OPENWEATHER_API_KEY);
  params.set("units", UNITS);

  const url = `${OPENWEATHER_BASE}${path}?${params.toString()}`;
  const response = await fetch(url, { cf: { cacheTtl: 300 } });
  const body = await response.text();
  return { status: response.status, body };
}

function buildDailyForecast(forecastList, tzOffset) {
  const days = {};
  for (const entry of forecastList) {
    const localDt = entry.dt + tzOffset;
    const dayKey = Math.floor(localDt / 86400);
    if (!days[dayKey]) days[dayKey] = [];
    days[dayKey].push(entry);
  }

  const daily = [];
  for (const dayKey of Object.keys(days).sort((a, b) => a - b)) {
    const entries = days[dayKey];
    const temps = entries.map((e) => e.main.temp);
    const noonTarget = Number(dayKey) * 86400 + 12 * 3600;
    const representative = entries.reduce((closest, entry) => {
      const diff = Math.abs(entry.dt + tzOffset - noonTarget);
      return diff < closest.diff ? { entry, diff } : closest;
    }, { entry: entries[0], diff: Infinity }).entry;

    daily.push({
      dt: representative.dt,
      temp: { max: Math.max(...temps), min: Math.min(...temps) },
      weather: representative.weather || [],
    });
  }
  return daily;
}

export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return new Response(JSON.stringify({ message: "lat and lon are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const query = { lat, lon };
  const current = await proxyRequest("/data/2.5/weather", query, context.env);
  if (current.status !== 200) {
    return new Response(current.body, { status: current.status, headers: { "Content-Type": "application/json" } });
  }

  const forecast = await proxyRequest("/data/2.5/forecast", query, context.env);
  if (forecast.status !== 200) {
    return new Response(forecast.body, { status: forecast.status, headers: { "Content-Type": "application/json" } });
  }

  const currentData = JSON.parse(current.body);
  const forecastData = JSON.parse(forecast.body);
  const tzOffset = forecastData.city?.timezone || 0;

  const combined = {
    current: {
      temp: currentData.main?.temp,
      feels_like: currentData.main?.feels_like,
      humidity: currentData.main?.humidity,
      sunrise: currentData.sys?.sunrise,
      sunset: currentData.sys?.sunset,
      weather: currentData.weather || [],
    },
    daily: buildDailyForecast(forecastData.list || [], tzOffset),
    timezone_offset: tzOffset,
  };

  return Response.json(combined, { headers: { "Cache-Control": "no-store" } });
}
