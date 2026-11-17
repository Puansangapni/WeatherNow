const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const statusText = document.getElementById("status");
const weatherContent = document.getElementById("weatherContent");

const weatherDescriptions = {
    0: ["Clear Sky", "☀️"],
    1: ["Mainly Clear", "🌤️"],
    2: ["Partly Cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Fog", "🌫️"],
    48: ["Depositing Rime Fog", "🌫️"],
    51: ["Light Drizzle", "🌦️"],
    53: ["Moderate Drizzle", "🌦️"],
    55: ["Dense Drizzle", "🌧️"],
    61: ["Slight Rain", "🌧️"],
    63: ["Moderate Rain", "🌧️"],
    65: ["Heavy Rain", "🌧️"],
    71: ["Slight Snow", "🌨️"],
    73: ["Moderate Snow", "🌨️"],
    75: ["Heavy Snow", "❄️"],
    80: ["Rain Showers", "🌦️"],
    81: ["Moderate Showers", "🌧️"],
    82: ["Violent Showers", "⛈️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm with Hail", "⛈️"],
    99: ["Heavy Thunderstorm with Hail", "⛈️"]
};

function getWeatherInfo(code) {
    return weatherDescriptions[code] || ["Unknown Weather", "🌡️"];
}

// Search city
async function searchCity(city) {
    if (!city.trim()) {
        statusText.textContent = "Please enter a city name.";
        return;
    }

    statusText.textContent = "Loading weather data...";
    weatherContent.hidden = true;
    searchBtn.disabled = true;

    try {
        const geoURL = new URL(
            "https://geocoding-api.open-meteo.com/v1/search"
        );

        geoURL.search = new URLSearchParams({
            name: city,
            count: 1,
            language: "en",
            format: "json"
        });

        const geoResponse = await fetch(geoURL);

        if (!geoResponse.ok) {
            throw new Error("Unable to search city.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found. Try another city.");
        }

        const location = geoData.results[0];

        await getWeather(
            location.latitude,
            location.longitude,
            location.name,
            location.country
        );

    } catch (error) {
        statusText.textContent = error.message;
    } finally {
        searchBtn.disabled = false;
    }
}

// Fetch weather
async function getWeather(lat, lon, city, country) {

    const weatherURL = new URL(
        "https://api.open-meteo.com/v1/forecast"
    );

    weatherURL.search = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "weather_code",
            "wind_speed_10m"
        ].join(","),
        daily: [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min"
        ].join(","),
        forecast_days: 7,
        timezone: "auto"
    });

    try {
        const response = await fetch(weatherURL);

        if (!response.ok) {
            throw new Error("Unable to retrieve weather data.");
        }

        const data = await response.json();

        displayWeather(data, city, country);

        statusText.textContent = "";

    } catch (error) {
        throw error;
    }
}

// Display current weather
function displayWeather(data, city, country) {

    const current = data.current;
    const info = getWeatherInfo(current.weather_code);

    document.getElementById("cityName").textContent =
        `${city}, ${country}`;

    document.getElementById("date").textContent =
        new Date(current.time).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

    document.getElementById("weatherDescription").textContent =
        info[0];

    document.getElementById("weatherIcon").textContent =
        info[1];

    document.getElementById("temperature").textContent =
        `${Math.round(current.temperature_2m)}°C`;

    document.getElementById("feelsLike").textContent =
        `${Math.round(current.apparent_temperature)}°C`;

    document.getElementById("humidity").textContent =
        `${current.relative_humidity_2m}%`;

    document.getElementById("windSpeed").textContent =
        `${current.wind_speed_10m} km/h`;

    displayForecast(data.daily);

    weatherContent.hidden = false;
}

// Display 7-day forecast
function displayForecast(daily) {

    const forecastContainer =
        document.getElementById("forecast");

    forecastContainer.innerHTML = "";

    daily.time.forEach((date, index) => {

        const info = getWeatherInfo(
            daily.weather_code[index]
        );

        const day = new Date(date + "T12:00:00")
            .toLocaleDateString("en-US", {
                weekday: "short"
            });

        const card = document.createElement("div");
        card.className = "forecast-card";

        const dayText = document.createElement("p");
        dayText.textContent = day;

        const icon = document.createElement("div");
        icon.className = "icon";
        icon.textContent = info[1];

        const description = document.createElement("p");
        description.textContent = info[0];

        const maxTemp = document.createElement("p");
        maxTemp.className = "max-temp";
        maxTemp.textContent =
            `${Math.round(daily.temperature_2m_max[index])}°C`;

        const minTemp = document.createElement("p");
        minTemp.className = "min-temp";
        minTemp.textContent =
            `${Math.round(daily.temperature_2m_min[index])}°C`;

        card.append(
            dayText,
            icon,
            description,
            maxTemp,
            minTemp
        );

        forecastContainer.appendChild(card);
    });
}

// Search button
searchBtn.addEventListener("click", () => {
    searchCity(cityInput.value);
});

// Enter key
cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        searchCity(cityInput.value);
    }
});

// Default city
searchCity("Jakarta");