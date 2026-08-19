const DEFAULT_TIMEOUT_MS = 8000;

export function errorResponse(message, status = 500) {
    return new Response(JSON.stringify({ message }), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

export async function fetchUpstream(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const response = await fetch(url, {
        cf: { cacheTtl: 300 },
        signal: AbortSignal.timeout(timeoutMs),
    });
    const body = await response.text();
    return { status: response.status, body };
}
