const DEFAULT_TIMEOUT_MS = 8000;

export function hashDateString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return hash;
}

export function secondsUntilNextUtcMidnight() {
    const now = new Date();
    const nextMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    return Math.max(60, Math.floor((nextMidnight - now.getTime()) / 1000));
}

export function errorResponse(message, status = 500) {
    return new Response(JSON.stringify({ message }), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

export async function fetchUpstream(url, timeoutMs = DEFAULT_TIMEOUT_MS, headers = {}) {
    const response = await fetch(url, {
        cf: { cacheTtl: 300 },
        signal: AbortSignal.timeout(timeoutMs),
        headers,
    });
    const body = await response.text();
    return { status: response.status, body };
}
