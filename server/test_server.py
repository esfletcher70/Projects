"""Unit tests for server.py using only the standard library.

Run from the project root:
    python3 -m unittest discover -s server -p "test_*.py"
"""

import io
import json
import os
import sys
import unittest
from unittest import mock

# server.py exits if no API key is present, so provide one before importing.
os.environ["OPENWEATHER_API_KEY"] = "test-key"

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import server  # noqa: E402


class FakeHandler:
    """Minimal stand-in for BaseHTTPRequestHandler used by serve_static."""

    def __init__(self):
        self.status = None
        self.headers = {}
        self.wfile = io.BytesIO()

    def send_response(self, code):
        self.status = code

    def send_header(self, name, value):
        self.headers[name] = value

    def end_headers(self):
        pass

    def send_error(self, code, message=None):
        self.status = code


class LoadApiKeyTests(unittest.TestCase):
    def test_uses_environment_variable(self):
        with mock.patch.dict(os.environ, {"OPENWEATHER_API_KEY": "env-key"}, clear=False):
            self.assertEqual(server.load_api_key(), "env-key")

    def test_reads_from_env_file(self):
        content = "# comment\nOPENWEATHER_API_KEY=file-key\n"
        with mock.patch.dict(os.environ, {}, clear=True):
            with mock.patch.object(server.os.path, "exists", return_value=True):
                with mock.patch("builtins.open", mock.mock_open(read_data=content)):
                    self.assertEqual(server.load_api_key(), "file-key")


class ServeStaticTests(unittest.TestCase):
    def test_root_serves_index(self):
        handler = FakeHandler()
        server.serve_static(handler, "/")
        self.assertEqual(handler.status, 200)
        self.assertIn(b"<!DOCTYPE html>", handler.wfile.getvalue())

    def test_missing_file_returns_404(self):
        handler = FakeHandler()
        server.serve_static(handler, "/does-not-exist.html")
        self.assertEqual(handler.status, 404)

    def test_path_traversal_is_blocked(self):
        handler = FakeHandler()
        server.serve_static(handler, "/../server/.env")
        self.assertEqual(handler.status, 403)


class ProxyRequestTests(unittest.TestCase):
    def test_injects_appid_and_units(self):
        captured = {}

        class FakeResp:
            status = 200
            headers = {"Content-Type": "application/json"}

            def read(self):
                return b"{}"

            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

        def fake_urlopen(url, timeout=15):
            captured["url"] = url
            return FakeResp()

        with mock.patch("urllib.request.urlopen", side_effect=fake_urlopen):
            status, ctype, body = server.proxy_request("/data/3.0/onecall", {"lat": "1", "lon": "2"})

        self.assertEqual(status, 200)
        self.assertIn("appid=test-key", captured["url"])
        self.assertIn("units=imperial", captured["url"])
        self.assertIn("lat=1", captured["url"])

    def test_http_error_is_forwarded(self):
        import urllib.error

        def raise_http_error(*args, **kwargs):
            raise urllib.error.HTTPError(
                "https://api.openweathermap.org", 401, "Unauthorized", {}, io.BytesIO(b"{}")
            )

        with mock.patch("urllib.request.urlopen", side_effect=raise_http_error):
            status, ctype, body = server.proxy_request("/data/3.0/onecall", {})

        self.assertEqual(status, 401)


class BuildDailyForecastTests(unittest.TestCase):
    def test_groups_by_local_calendar_day_and_picks_noon_entry(self):
        # tz_offset -25200 = UTC-7. Local day A has one entry (14:00 local).
        # Local day B has three entries at 08:00, 11:00, and 19:00 local -
        # the 11:00 one is closest to local noon and should be the representative.
        forecast_list = [
            {"dt": 1786827600, "main": {"temp": 70}, "weather": [{"icon": "01n"}]},  # day A, 14:00 local
            {"dt": 1786892400, "main": {"temp": 60}, "weather": [{"icon": "01n"}]},  # day B, 08:00 local
            {"dt": 1786903200, "main": {"temp": 90}, "weather": [{"icon": "01d"}]},  # day B, 11:00 local
            {"dt": 1786932000, "main": {"temp": 65}, "weather": [{"icon": "01n"}]},  # day B, 19:00 local
        ]

        daily = server.build_daily_forecast(forecast_list, -25200)

        self.assertEqual(len(daily), 2)
        self.assertEqual(daily[0]["temp"], {"max": 70, "min": 70})
        self.assertEqual(daily[1]["temp"], {"max": 90, "min": 60})
        self.assertEqual(daily[1]["dt"], 1786903200)
        self.assertEqual(daily[1]["weather"], [{"icon": "01d"}])


class BuildWeatherResponseTests(unittest.TestCase):
    def test_combines_current_and_forecast(self):
        current_body = json.dumps({
            "main": {"temp": 75.5, "feels_like": 76.2, "humidity": 72},
            "sys": {"sunrise": 100, "sunset": 200},
            "weather": [{"icon": "03d", "description": "scattered clouds"}],
        }).encode("utf-8")
        forecast_body = json.dumps({
            "city": {"timezone": -25200},
            "list": [{"dt": 1786780800, "main": {"temp": 70}, "weather": [{"icon": "01n"}]}],
        }).encode("utf-8")

        responses = [(200, "application/json", current_body), (200, "application/json", forecast_body)]

        def fake_proxy_request(path, query):
            return responses.pop(0)

        with mock.patch.object(server, "proxy_request", side_effect=fake_proxy_request):
            status, ctype, body = server.build_weather_response({"lat": "34", "lon": "-118"})

        self.assertEqual(status, 200)
        payload = json.loads(body)
        self.assertEqual(payload["current"]["temp"], 75.5)
        self.assertEqual(payload["timezone_offset"], -25200)
        self.assertEqual(len(payload["daily"]), 1)

    def test_missing_coordinates_returns_400(self):
        status, ctype, body = server.build_weather_response({})
        self.assertEqual(status, 400)

    def test_upstream_current_error_is_forwarded(self):
        with mock.patch.object(server, "proxy_request", return_value=(401, "application/json", b"{}")):
            status, ctype, body = server.build_weather_response({"lat": "34", "lon": "-118"})
        self.assertEqual(status, 401)


if __name__ == "__main__":
    unittest.main()
