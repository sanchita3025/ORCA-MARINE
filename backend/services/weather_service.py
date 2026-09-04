import requests
import json
import os
from datetime import datetime, timezone


# 1. Check latitude and longitude
def validate_coordinates(lat, lon):

    if not isinstance(lat, (int, float)):
        return False

    if not isinstance(lon, (int, float)):
        return False

    if lat < -90 or lat > 90:
        return False

    if lon < -180 or lon > 180:
        return False

    return True


# 2. Convert weather code into readable condition
def get_weather_condition(code):

    conditions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        61: "Light rain",
        63: "Moderate rain",
        65: "Heavy rain",
        71: "Light snow",
        73: "Moderate snow",
        75: "Heavy snow",
        80: "Light rain showers",
        81: "Moderate rain showers",
        82: "Heavy rain showers",
        95: "Thunderstorm",
        96: "Thunderstorm with hail",
        99: "Thunderstorm with heavy hail"
    }

    return conditions.get(
        code,
        "Unknown weather condition"
    )


# 3. Load backup data
def get_fallback_weather():

    fallback_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "data",
        "fallback_data.json"
    )

    with open(fallback_path, "r") as file:
        fallback = json.load(file)

    return fallback["weather"]


# 4. Validate requested date/time
def validate_requested_datetime(requested_datetime):

    try:

        requested = datetime.strptime(
            requested_datetime,
            "%Y-%m-%dT%H:%M"
        )

    except ValueError:

        return {
            "status": "error",
            "message": (
                "Invalid date and time format. "
                "Use YYYY-MM-DDTHH:MM."
            )
        }

    # Current time
    current_time = datetime.now(timezone.utc).replace(
        tzinfo=None,
        second=0,
        microsecond=0
    )

    # -------------------------------------------------
    # FUTURE / CURRENT / PAST
    # -------------------------------------------------
    #
    # We do NOT reject past requests here.
    # Open-Meteo will decide whether the requested
    # time is actually available.
    #
    # This allows today's earlier hours to be shown.
    #

    return {
        "status": "valid"
    }

# 5. Find nearest available hourly timestamp
def find_nearest_hour(requested_datetime, available_times):

    requested = datetime.strptime(
        requested_datetime,
        "%Y-%m-%dT%H:%M"
    )

    nearest_time = None
    smallest_difference = None

    for time_string in available_times:

        try:

            available = datetime.strptime(
                time_string,
                "%Y-%m-%dT%H:%M"
            )

        except ValueError:

            continue

        difference = abs(
            (available - requested).total_seconds()
        )

        if (
            smallest_difference is None
            or difference < smallest_difference
        ):

            smallest_difference = difference
            nearest_time = time_string

    # Do not use a point more than 30 minutes away.
    # This avoids mapping a request to an unreasonable hour.
    if (
        nearest_time is None
        or smallest_difference > 30 * 60
    ):

        return None

    return nearest_time


# 6. Get weather data
def get_weather_data(lat, lon, requested_datetime):

    # Validate coordinates
    if not validate_coordinates(lat, lon):

        return {
            "status": "error",
            "message": "Invalid latitude or longitude"
        }

    # Validate requested date/time
    date_validation = validate_requested_datetime(
        requested_datetime
    )

    if date_validation["status"] != "valid":

        return date_validation

    url = "https://api.open-meteo.com/v1/forecast"

    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": (
            "temperature_2m,"
            "wind_speed_10m,"
            "wind_direction_10m,"
            "precipitation,"
            "weather_code"
        ),
        "timezone": "auto",
        "past_days": 1,
        "forecast_days": 8
    }

    try:

        response = requests.get(
            url,
            params=params,
            timeout=30
        )

        # Check API response
        if response.status_code != 200:

            raise Exception(
                f"Weather API failed: HTTP {response.status_code}"
            )

        data = response.json()

        if "hourly" not in data:

            raise Exception(
                "Hourly weather data unavailable"
            )

        available_times = data["hourly"]["time"]

        # Find nearest available hour
        selected_time = find_nearest_hour(
            requested_datetime,
            available_times
        )

        # Requested time is outside available range
        if selected_time is None:

            return {
                "status": "unavailable",
                "message": (
                    "Requested date and time are outside "
                    "the available weather forecast range."
                ),
                "source": "Open-Meteo",
                "timestamp": requested_datetime
            }

        index = available_times.index(
            selected_time
        )

        weather_code = data["hourly"]["weather_code"][index]

        weather = {
            "status": "available",
            "temperature": data["hourly"]["temperature_2m"][index],
            "wind_speed": data["hourly"]["wind_speed_10m"][index],
            "wind_direction": data["hourly"]["wind_direction_10m"][index],
            "precipitation": data["hourly"]["precipitation"][index],
            "condition": get_weather_condition(
                weather_code
            ),
            "source": "Open-Meteo",
            "timestamp": selected_time,
            "requested_timestamp": requested_datetime
        }

        # Inform user when nearest hour was used
        if selected_time != requested_datetime:

            weather["time_note"] = (
                f"Requested time {requested_datetime} "
                f"was mapped to nearest available time "
                f"{selected_time}."
            )

        return weather

    except Exception as e:

        print("WEATHER ERROR:", e)

        # Genuine API/network failure → fallback
        fallback_weather = get_fallback_weather()

        return {
            "status": "fallback",
            "temperature": fallback_weather["temperature"],
            "wind_speed": fallback_weather["wind_speed"],
            "wind_direction": fallback_weather["wind_direction"],
            "precipitation": fallback_weather["precipitation"],
            "condition": fallback_weather["condition"],
            "source": "Demo fallback data",
            "timestamp": requested_datetime,
            "requested_timestamp": requested_datetime,
            "warning": "Live weather data unavailable"
        }


# 7. Testing
if __name__ == "__main__":

    result = get_weather_data(
        20.31,
        86.61,
        "2026-08-30T20:30"
    )

    print(result)

