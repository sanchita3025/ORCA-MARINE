import requests
import json
import os
from datetime import datetime


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


# 2. Load backup ocean data
def get_fallback_ocean():

    fallback_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "data",
        "fallback_data.json"
    )

    with open(fallback_path, "r") as file:
        fallback = json.load(file)

    return fallback["ocean"]


# 3. Validate requested date/time
def validate_requested_datetime(requested_datetime):

    try:

        datetime.strptime(
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

    # Do not reject past requests here.
    # Open-Meteo will determine whether the
    # requested time is actually available.

    return {
        "status": "valid"
    }


# 4. Find nearest available hourly timestamp
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

    # Do not use a point more than 30 minutes away
    if (
        nearest_time is None
        or smallest_difference > 30 * 60
    ):

        return None

    return nearest_time


# 5. Get ocean data
def get_ocean_data(lat, lon, requested_datetime):

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

    # Open-Meteo Marine API
    url = "https://marine-api.open-meteo.com/v1/marine"

    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": (
            "wave_height,"
            "wave_period,"
            "ocean_current_velocity,"
            "sea_surface_temperature"
        ),
        "timezone": "auto",
        "cell_selection": "sea",
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
                f"Ocean API failed: HTTP {response.status_code}"
            )

        data = response.json()

        if "hourly" not in data:

            raise Exception(
                "Hourly ocean data unavailable"
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
                    "the available ocean forecast range."
                ),
                "source": "Open-Meteo Marine API",
                "timestamp": requested_datetime
            }

        index = available_times.index(
            selected_time
        )

        # Get marine values
        wave_height = data["hourly"]["wave_height"][index]
        wave_period = data["hourly"]["wave_period"][index]
        current_speed = data["hourly"]["ocean_current_velocity"][index]
        sst = data["hourly"]["sea_surface_temperature"][index]

        # ------------------------------------------------
        # LAND / NON-MARINE LOCATION CHECK
        # ------------------------------------------------
        if (
            wave_height is None
            and wave_period is None
            and current_speed is None
            and sst is None
        ):

            return {
                "status": "land",
                "message": (
                    "Selected location is not a valid marine "
                    "location. Please select a sea or coastal location."
                ),
                "source": "Open-Meteo Marine API",
                "timestamp": requested_datetime,
                "requested_timestamp": requested_datetime
            }

        # ------------------------------------------------
        # PARTIAL MARINE DATA CHECK
        # ------------------------------------------------
        if (
            wave_height is None
            or wave_period is None
            or current_speed is None
            or sst is None
        ):

            return {
                "status": "unavailable",
                "message": (
                    "Required marine data is unavailable "
                    "for the selected location and time."
                ),
                "source": "Open-Meteo Marine API",
                "timestamp": requested_datetime,
                "requested_timestamp": requested_datetime
            }

        ocean = {
            "status": "available",
            "wave_height": wave_height,
            "wave_period": wave_period,
            "current_speed": current_speed,
            "sst": sst,
            "source": "Open-Meteo Marine API",
            "timestamp": selected_time,
            "requested_timestamp": requested_datetime
        }

        # Inform user when nearest hour was used
        if selected_time != requested_datetime:

            ocean["time_note"] = (
                f"Requested time {requested_datetime} "
                f"was mapped to nearest available time "
                f"{selected_time}."
            )

        return ocean

    except Exception as e:

        print("OCEAN ERROR:", e)

        # Genuine API/network failure → fallback
        fallback_ocean = get_fallback_ocean()

        return {
            "status": "fallback",
            "wave_height": fallback_ocean["wave_height"],
            "wave_period": fallback_ocean["wave_period"],
            "current_speed": fallback_ocean["current_speed"],
            "sst": fallback_ocean["sst"],
            "source": "Demo fallback data",
            "timestamp": requested_datetime,
            "requested_timestamp": requested_datetime,
            "warning": "Live ocean data unavailable"
        }


# 6. Testing
if __name__ == "__main__":

    result = get_ocean_data(
        20.31,
        86.61,
        "2026-08-30T20:30"
    )

    print(result)

