#!/usr/bin/env python3
"""
AppHub server: serves the static pages and proxies OpenWeather API calls
so the API key never reaches the browser.

Run:
    cd server
    python3 server.py            # reads OPENWEATHER_API_KEY from .env
    OPENWEATHER_API_KEY=... python3 server.py   # or from the environment

Endpoints:
    GET /api/weather?lat=..&lon=..        -> OpenWeather OneCall 3.0
    GET /api/geo/reverse?lat=..&lon=..    -> OpenWeather reverse geocoding
    GET /api/geo/direct?q=..              -> OpenWeather direct geocoding
    everything else                       -> static files from the project root
"""

import json
import os
import sys
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Project root is one level above this file (server/ -> Projects/)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8000"))

OPENWEATHER_BASE = "https://api.openweathermap.org"
UNITS = "imperial"

# ---------------------------------------------------------------------------
# API key loading: environment variable first, then .env file
# ---------------------------------------------------------------------------

def load_api_key():
    key = os.environ.get("OPENWEATHER_API_KEY", "").strip()
    if key:
        return key

    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    name, _, value = line.partition("=")
                    if name.strip() == "OPENWEATHER_API_KEY":
                        return value.strip().strip('"').strip("'")
    return ""


API_KEY = load_api_key()

if not API_KEY:
    print("ERROR: OPENWEATHER_API_KEY not found. Set it in server/.env or as an environment variable.")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Proxy helpers
# ---------------------------------------------------------------------------

def proxy_request(path, query):
    """Forward a request to OpenWeather, injecting the API key server-side."""
    params = dict(query)
    params["appid"] = API_KEY
    params["units"] = UNITS

    url = OPENWEATHER_BASE + path + "?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            body = resp.read()
            return resp.status, resp.headers.get("Content-Type", "application/json"), body
    except urllib.error.HTTPError as e:
        return e.code, "application/json", e.read()
    except Exception as e:
        return 502, "application/json", json.dumps({"message": str(e)}).encode("utf-8")


# ---------------------------------------------------------------------------
# Static file serving
# ---------------------------------------------------------------------------

CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".txt": "text/plain; charset=utf-8",
}


def serve_static(handler, path):
    # Map "/" to Index.html
    if path == "/" or path == "":
        path = "/Index.html"

    # Prevent path traversal
    rel = path.lstrip("/")
    full = os.path.normpath(os.path.join(PROJECT_ROOT, rel))
    if not full.startswith(PROJECT_ROOT):
        handler.send_error(403, "Forbidden")
        return

    if os.path.isdir(full):
        full = os.path.join(full, "Index.html")

    if not os.path.isfile(full):
        handler.send_error(404, "Not Found")
        return

    ext = os.path.splitext(full)[1].lower()
    ctype = CONTENT_TYPES.get(ext, "application/octet-stream")

    with open(full, "rb") as f:
        body = f.read()

    handler.send_response(200)
    handler.send_header("Content-Type", ctype)
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


# ---------------------------------------------------------------------------
# Request handler
# ---------------------------------------------------------------------------

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # Flatten single-value query params
        flat = {k: v[0] for k, v in query.items()}

        if path == "/api/weather":
            status, ctype, body = proxy_request("/data/3.0/onecall", flat)
        elif path == "/api/geo/reverse":
            status, ctype, body = proxy_request("/geo/1.0/reverse", flat)
        elif path == "/api/geo/direct":
            status, ctype, body = proxy_request("/geo/1.0/direct", flat)
        else:
            serve_static(self, path)
            return

        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))


# ---------------------------------------------------------------------------

if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"AppHub server running at http://localhost:{PORT}")
    print(f"Serving static files from: {PROJECT_ROOT}")
    print("API key loaded:", "yes" if API_KEY else "no")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.server_close()
