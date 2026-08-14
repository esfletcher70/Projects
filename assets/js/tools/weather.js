/* ============================================
   AppHub Weather Dashboard (tool module)
   ============================================ */

import { showError, hideError, qs } from '../common.js';

export function mount(container, options = {}) {
    const mode = options.mode || 'card';
    const forecastDays = mode === 'card' ? 3 : 7;
    const showLocationButton = mode === 'standalone';

    container.innerHTML = `
        <div id="error" class="error"></div>
        <div class="tool-section">
            <div class="weather-search" data-search>
                <input type="text" id="searchInput" data-search-input placeholder="Search city/state, example: Los Angeles, CA" aria-label="Search city or state">
                <button class="tool-btn primary" id="searchBtn" data-search-btn>Search</button>
            </div>
            ${showLocationButton ? `
            <div class="button-group" style="margin-bottom: 12px;">
                <button class="tool-btn secondary" id="locationBtn" data-location-btn>Use My Location</button>
            </div>` : ''}
            <div id="loading" style="display: none; margin-bottom: 12px;">Loading weather...</div>
            <div id="weatherContent" data-weather-content></div>
        </div>
    `;

    const searchInput = qs(container, '#searchInput');
    const weatherContent = qs(container, '#weatherContent');
    const loadingDiv = qs(container, '#loading');

    function getWeatherIconUrl(iconCode) {
        return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    }

    function formatTime(unixTime, offsetSeconds) {
        if (!unixTime) return '--';
        return new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'UTC'
        }).format(new Date((unixTime + (offsetSeconds || 0)) * 1000));
    }

    function formatDay(unixTime, offsetSeconds) {
        return new Intl.DateTimeFormat(undefined, {
            weekday: 'short',
            timeZone: 'UTC'
        }).format(new Date((unixTime + (offsetSeconds || 0)) * 1000));
    }

    function setLoading(isLoading) {
        loadingDiv.style.display = isLoading ? 'block' : 'none';
    }

    async function loadWeather(lat, lon, searchedLocationName = '') {
        try {
            setLoading(true);
            hideError(container);

            const weatherResponse = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
            const weatherData = await weatherResponse.json();

            if (!weatherResponse.ok) {
                throw new Error(weatherData?.message || 'Unable to retrieve weather data.');
            }

            let locationName = searchedLocationName;
            if (!locationName) {
                const geoResponse = await fetch(`/api/geo/reverse?lat=${lat}&lon=${lon}&limit=1`);
                const geoData = await geoResponse.json();
                if (geoData?.length) {
                    const city = geoData[0].name || '';
                    const state = geoData[0].state || '';
                    const country = geoData[0].country || '';
                    locationName = [city, state || country].filter(Boolean).join(', ');
                } else {
                    locationName = 'Current Location';
                }
            }

            renderWeather(weatherData, locationName);
        } catch (err) {
            showError(err.message || 'Failed to retrieve weather data.', container);
        } finally {
            setLoading(false);
        }
    }

    function loadWeatherFromCurrentLocation() {
        if (!navigator.geolocation) {
            showError('Geolocation is not supported by this browser. Use the search box instead.', container);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                loadWeather(position.coords.latitude, position.coords.longitude);
            },
            () => {
                showError('Unable to determine your location. Use the search box to enter a city and state.', container);
            }
        );
    }

    async function handleSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            showError('Enter a city and state, such as Los Angeles, CA.', container);
            return;
        }

        try {
            setLoading(true);
            hideError(container);

            const geoResponse = await fetch(`/api/geo/direct?q=${encodeURIComponent(query)}&limit=1`);
            const geoData = await geoResponse.json();

            if (!geoResponse.ok) {
                throw new Error(geoData?.message || 'Unable to search for that location.');
            }
            if (!geoData?.length) {
                throw new Error('Location not found. Try a format like City, State.');
            }

            const location = geoData[0];
            const displayName = [location.name, location.state || location.country].filter(Boolean).join(', ');
            await loadWeather(location.lat, location.lon, displayName);
        } catch (err) {
            showError(err.message || 'Search failed. Please try another city and state.', container);
        } finally {
            setLoading(false);
        }
    }

    function renderWeather(weather, locationName) {
        const current = weather.current;
        const description = current.weather?.[0]?.description || 'Current weather';
        const icon = current.weather?.[0]?.icon;
        const forecast = (weather.daily || []).slice(0, forecastDays);

        weatherContent.innerHTML = `
            <div class="weather-current">
                <div>
                    <h2 class="location" id="locationName">${locationName}</h2>
                    <div class="description">${description}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="temp" id="currentTemp">${Math.round(current.temp)}°F</div>
                    ${icon ? `<img src="${getWeatherIconUrl(icon)}" alt="${description}">` : ''}
                </div>
            </div>
            <div class="weather-details">
                <div class="weather-detail">
                    <div class="label">Feels Like</div>
                    <div class="value" id="feelsLike">${Math.round(current.feels_like)}°F</div>
                </div>
                <div class="weather-detail">
                    <div class="label">Humidity</div>
                    <div class="value" id="humidity">${current.humidity}%</div>
                </div>
                <div class="weather-detail">
                    <div class="label">Sunrise</div>
                    <div class="value">${formatTime(current.sunrise, weather.timezone_offset)}</div>
                </div>
                <div class="weather-detail">
                    <div class="label">Sunset</div>
                    <div class="value">${formatTime(current.sunset, weather.timezone_offset)}</div>
                </div>
            </div>
            <h3 id="forecastTitle">${forecast.length}-Day Forecast</h3>
            <div class="weather-forecast" id="forecastGrid">
                ${forecast.map((day) => {
                    const dayIcon = day.weather?.[0]?.icon;
                    const dayDescription = day.weather?.[0]?.description || day.weather?.[0]?.main || 'Forecast';
                    return `
                        <div class="day">
                            <div class="label">${formatDay(day.dt, weather.timezone_offset)}</div>
                            ${dayIcon ? `<img src="${getWeatherIconUrl(dayIcon)}" alt="${dayDescription}">` : ''}
                            <div class="temp">${Math.round(day.temp.max)}° / ${Math.round(day.temp.min)}°</div>
                            <div class="desc">${dayDescription}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function onClick(e) {
        if (e.target.closest('[data-search-btn]')) {
            handleSearch();
            return;
        }
        if (e.target.closest('[data-location-btn]')) {
            loadWeatherFromCurrentLocation();
        }
    }

    function onKeypress(e) {
        if (e.key === 'Enter' && e.target === searchInput) {
            handleSearch();
        }
    }

    container.addEventListener('click', onClick);
    searchInput.addEventListener('keypress', onKeypress);

    if (mode === 'standalone') {
        loadWeatherFromCurrentLocation();
    }

    return function unmount() {
        container.removeEventListener('click', onClick);
        searchInput.removeEventListener('keypress', onKeypress);
    };
}
