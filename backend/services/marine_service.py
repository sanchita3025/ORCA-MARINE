from datetime import datetime
from zoneinfo import ZoneInfo

from .weather_service import get_weather_data
from .ocean_service import get_ocean_data
from .location_service import get_location_coordinates
from .reasoning_service import generate_marine_advice
from .decision_service import make_final_decision


# ============================================================
# TIME / FRESHNESS
# ============================================================

def get_freshness(requested_time, weather, ocean):
    """
    Determine whether requested marine data is past, live, or forecast.
    Also returns the time difference in a user-friendly format.
    """

    current_time = datetime.now(
        ZoneInfo("Asia/Kolkata")
    )

    try:
        requested_datetime = datetime.strptime(
            requested_time,
            "%Y-%m-%dT%H:%M"
        )

        current_naive = current_time.replace(
            tzinfo=None,
            second=0,
            microsecond=0
        )

        # ----------------------------------------------------
        # Calculate difference using USER REQUESTED TIME
        # ----------------------------------------------------

        difference_minutes = (
            requested_datetime - current_naive
        ).total_seconds() / 60

        # ----------------------------------------------------
        # Freshness classification
        # ----------------------------------------------------

        if abs(difference_minutes) <= 30:
            freshness = "live"

        elif difference_minutes > 30:
            freshness = "forecast"

        elif difference_minutes >= -24 * 60:
            freshness = "past"

        else:
            freshness = "unavailable"

        # ----------------------------------------------------
        # User-friendly time difference
        # ----------------------------------------------------

        absolute_minutes = abs(difference_minutes)

        total_minutes = int(absolute_minutes)
        days = total_minutes // (24 * 60)

        remaining_minutes = total_minutes % (24 * 60)
        hours = remaining_minutes // 60
        minutes = remaining_minutes % 60

        if days > 0:
            time_difference = (
                f"{days} day(s) "
                f"{hours} hour(s) "
                f"{minutes} minute(s)"
            )

        elif hours > 0:
            time_difference = (
                f"{hours} hour(s) "
                f"{minutes} minute(s)"
            )

        else:
            time_difference = (
                f"{minutes} minute(s)"
            )

        if difference_minutes > 0:
            time_difference += " ahead"

        elif difference_minutes < 0:
            time_difference += " ago"

        else:
            time_difference = "Current time"

        return {
            "freshness": freshness,
            "time_difference": time_difference,
            "time_difference_minutes": round(
                difference_minutes
            ),
            "checked_at": current_time.isoformat()
        }

    except (ValueError, TypeError):
        return {
            "freshness": "unknown",
            "time_difference": "Unknown",
            "time_difference_minutes": None,
            "checked_at": current_time.isoformat()
        }


# ============================================================
# MARINE SUMMARY
# ============================================================

def get_marine_summary(weather, ocean):
    """
    Generate a simple summary of wind and wave conditions.
    """

    wind_speed = weather.get("wind_speed")
    wave_height = ocean.get("wave_height")

    if wind_speed is None or wave_height is None:
        return {
            "wind": "Unknown",
            "waves": "Unknown",
            "overall": "Insufficient data"
        }

    # Wind classification
    if wind_speed < 10:
        wind_label = "Calm"

    elif wind_speed <= 20:
        wind_label = "Moderate"

    else:
        wind_label = "Strong"

    # Wave classification
    if wave_height < 1:
        wave_label = "Low"

    elif wave_height <= 2:
        wave_label = "Moderate"

    else:
        wave_label = "High"

    # Overall classification
    if wind_label == "Strong" or wave_label == "High":
        overall = "Rough conditions"

    elif wind_label == "Moderate" or wave_label == "Moderate":
        overall = "Moderate conditions"

    else:
        overall = "Calm conditions"

    return {
        "wind": wind_label,
        "waves": wave_label,
        "overall": overall
    }


# ============================================================
# MARINE RISK ASSESSMENT
# ============================================================

def get_marine_risk(weather, ocean):
    """
    Calculate marine risk using weather and ocean parameters.
    """

    risk_factors = []

    wind_speed = weather.get("wind_speed")
    precipitation = weather.get("precipitation")
    wave_height = ocean.get("wave_height")
    current_speed = ocean.get("current_speed")
    wave_period = ocean.get("wave_period")
    condition = weather.get("condition")

    # Required data validation
    if any(
        value is None
        for value in [
            wind_speed,
            precipitation,
            wave_height,
            current_speed,
            wave_period
        ]
    ):
        return {
            "risk_level": "Unknown",
            "risk_score": None,
            "risk_factors": [],
            "message": "Insufficient data for risk assessment."
        }

    score = 0

    # --------------------------------------------------------
    # 1. WIND RISK
    # --------------------------------------------------------

    if wind_speed < 10:
        score += 0

        risk_factors.append(
            f"Low wind speed ({wind_speed} km/h)"
        )

    elif wind_speed <= 20:
        score += 1

        risk_factors.append(
            f"Moderate wind speed ({wind_speed} km/h)"
        )

    elif wind_speed <= 30:
        score += 2

        risk_factors.append(
            f"Strong wind speed ({wind_speed} km/h)"
        )

    else:
        score += 3

        risk_factors.append(
            f"Very strong wind speed ({wind_speed} km/h)"
        )

    # --------------------------------------------------------
    # 2. WAVE HEIGHT RISK
    # --------------------------------------------------------

    if wave_height < 1:
        score += 0

        risk_factors.append(
            f"Low wave height ({wave_height} m)"
        )

    elif wave_height <= 2:
        score += 1

        risk_factors.append(
            f"Moderate wave height ({wave_height} m)"
        )

    elif wave_height <= 3:
        score += 2

        risk_factors.append(
            f"High wave height ({wave_height} m)"
        )

    else:
        score += 3

        risk_factors.append(
            f"Very high wave height ({wave_height} m)"
        )

    # --------------------------------------------------------
    # 3. PRECIPITATION RISK
    # --------------------------------------------------------

    if precipitation == 0:

        risk_factors.append(
            "No significant precipitation"
        )

    elif precipitation <= 5:

        risk_factors.append(
            f"Light precipitation ({precipitation} mm)"
        )

    else:

        score += 1

        risk_factors.append(
            f"Heavy precipitation ({precipitation} mm)"
        )

    # --------------------------------------------------------
    # 4. OCEAN CURRENT RISK
    # --------------------------------------------------------

    if current_speed < 1:

        risk_factors.append(
            f"Low ocean current ({current_speed} m/s)"
        )

    elif current_speed <= 2:

        score += 1

        risk_factors.append(
            f"Moderate ocean current ({current_speed} m/s)"
        )

    else:

        score += 2

        risk_factors.append(
            f"Strong ocean current ({current_speed} m/s)"
        )

    # --------------------------------------------------------
    # 5. WAVE PERIOD RISK
    # --------------------------------------------------------

    if wave_period < 6:

        score += 1

        risk_factors.append(
            f"Short wave period ({wave_period} s) - "
            "choppy conditions possible"
        )

    elif wave_period <= 10:

        risk_factors.append(
            f"Moderate wave period ({wave_period} s)"
        )

    else:

        risk_factors.append(
            f"Long wave period ({wave_period} s)"
        )

    # --------------------------------------------------------
    # 6. THUNDERSTORM RISK
    # --------------------------------------------------------

    if condition and "Thunderstorm" in condition:

        score += 1

        risk_factors.append(
            "Thunderstorm conditions detected"
        )

    # --------------------------------------------------------
    # FINAL RISK LEVEL
    # --------------------------------------------------------

    if score <= 3:
        risk_level = "Low"

    elif score <= 6:
        risk_level = "Medium"

    else:
        risk_level = "High"

    # --------------------------------------------------------
    # RECOMMENDATION
    # --------------------------------------------------------

    if risk_level == "Low":

        recommendation = (
            "Conditions are generally suitable for normal "
            "marine activities with standard precautions."
        )

    elif risk_level == "Medium":

        recommendation = (
            "Moderate marine risk detected. "
            "Caution is advised, especially for small vessels. "
            "Monitor conditions before proceeding."
        )

    else:

        recommendation = (
            "High marine risk detected. "
            "Marine activities should be avoided or postponed "
            "until conditions improve."
        )

    return {
        "risk_level": risk_level,
        "risk_score": score,
        "risk_factors": risk_factors,
        "recommendation": recommendation,
        "message": (
            "Risk assessment based on wind, wave height, "
            "precipitation, ocean current, wave period "
            "and severe weather conditions."
        )
    }


# ============================================================
# DATA QUALITY
# ============================================================

def get_data_quality(weather, ocean, freshness):
    """
    Determine whether weather and ocean data are live,
    forecast, historical, fallback, or unavailable.
    """

    freshness_type = freshness["freshness"]

    # Weather quality
    if weather["status"] == "fallback":
        weather_quality = "fallback"

    elif weather["status"] == "available":

        if freshness_type == "forecast":
            weather_quality = "forecast"

        elif freshness_type == "past":
            weather_quality = "historical"

        else:
            weather_quality = "live"

    else:
        weather_quality = "unavailable"

    # Ocean quality
    if ocean["status"] == "fallback":
        ocean_quality = "fallback"

    elif ocean["status"] == "available":

        if freshness_type == "forecast":
            ocean_quality = "forecast"

        elif freshness_type == "past":
            ocean_quality = "historical"

        else:
            ocean_quality = "live"

    else:
        ocean_quality = "unavailable"

    # Overall quality
    if (
        weather_quality == "forecast"
        and ocean_quality == "forecast"
    ):
        overall_quality = "forecast"

    elif (
        weather_quality == "historical"
        and ocean_quality == "historical"
    ):
        overall_quality = "historical"

    elif (
        weather_quality == "live"
        and ocean_quality == "live"
    ):
        overall_quality = "live"

    elif (
        weather_quality == "unavailable"
        or ocean_quality == "unavailable"
    ):
        overall_quality = "unavailable"

    else:
        overall_quality = "partial"

    return {
        "weather": weather_quality,
        "ocean": ocean_quality,
        "overall": overall_quality
    }


# ============================================================
# OVERALL STATUS
# ============================================================

def get_overall_status(weather, ocean):
    """
    Determine overall API/data availability status.
    """

    if (
        weather["status"] == "available"
        and ocean["status"] == "available"
    ):
        return "available"

    if (
        weather["status"] == "past"
        or ocean["status"] == "past"
    ):
        return "past"

    if (
        weather["status"] == "unavailable"
        or ocean["status"] == "unavailable"
    ):
        return "unavailable"

    return "partial"


# ============================================================
# MAIN MARINE CONDITIONS FUNCTION
# ============================================================

def get_marine_conditions(lat, lon, requested_time):
    """
    Combine weather, ocean, freshness, risk,
    reasoning and final decision into one response.
    """

    # --------------------------------------------------------
    # Coordinate validation
    # --------------------------------------------------------

    if not isinstance(lat, (int, float)) or not -90 <= lat <= 90:
        return {
            "status": "error",
            "message": (
                "Invalid latitude. Must be between -90 and 90."
            )
        }

    if not isinstance(lon, (int, float)) or not -180 <= lon <= 180:
        return {
            "status": "error",
            "message": (
                "Invalid longitude. Must be between -180 and 180."
            )
        }

    # --------------------------------------------------------
    # Requested time validation
    # --------------------------------------------------------

    if not isinstance(requested_time, str) or not requested_time:
        return {
            "status": "error",
            "message": "Invalid requested_time."
        }

    # --------------------------------------------------------
    # Fetch weather and ocean data
    # --------------------------------------------------------

    weather = get_weather_data(
        lat,
        lon,
        requested_time
    )

    ocean = get_ocean_data(
        lat,
        lon,
        requested_time
    )

    # --------------------------------------------------------
    # Land location validation
    # --------------------------------------------------------

    if ocean.get("status") == "land":

        return {
            "status": "error",
            "message": ocean.get(
                "message",
                "Selected location is not a valid marine location."
            ),
            "reason": (
                "Marine data is not available for land locations."
            )
        }

    # --------------------------------------------------------
    # Freshness
    # --------------------------------------------------------

    freshness_info = get_freshness(
        requested_time,
        weather,
        ocean
    )

    # --------------------------------------------------------
    # Handle unavailable data
    # --------------------------------------------------------

    if freshness_info["freshness"] == "unavailable":

        current_time = datetime.now(
            ZoneInfo("Asia/Kolkata")
        ).replace(
            tzinfo=None,
            second=0,
            microsecond=0
        )

        requested_datetime = datetime.strptime(
            requested_time,
            "%Y-%m-%dT%H:%M"
        )

        difference_minutes = (
            requested_datetime - current_time
        ).total_seconds() / 60

        # More than 24 hours in the past
        if difference_minutes < -1440:

            message = (
                "Requested time is older than the "
                "available 24-hour historical range."
            )

        # Future/outside forecast range
        elif difference_minutes > 0:

            message = (
                "Requested date and time are outside "
                "the available forecast range."
            )

        # Any other unavailable API case
        else:

            message = (
                "Requested date and time are outside "
                "the available data range."
            )

        return {
            "status": "unavailable",

            "weather": {
                "status": "unavailable",
                "message": message
            },

            "ocean": {
                "status": "unavailable",
                "message": message
            },

            "data_quality": {
                "weather": "unavailable",
                "ocean": "unavailable",
                "overall": "unavailable"
            },

            "freshness": "unavailable"
        }

    # --------------------------------------------------------
    # Data quality
    # --------------------------------------------------------

    data_quality = get_data_quality(
        weather,
        ocean,
        freshness_info
    )

    # --------------------------------------------------------
    # Marine summary
    # --------------------------------------------------------

    summary = get_marine_summary(
        weather,
        ocean
    )

    # --------------------------------------------------------
    # Risk assessment
    # --------------------------------------------------------

    risk = get_marine_risk(
        weather,
        ocean
    )

    # --------------------------------------------------------
    # Marine advice
    # --------------------------------------------------------

    advice = generate_marine_advice(
        summary,
        risk,
        weather,
        ocean
    )

    # --------------------------------------------------------
    # Final decision
    # --------------------------------------------------------

    decision = make_final_decision(
        risk,
        weather,
        ocean
    )

    # --------------------------------------------------------
    # Overall status
    # --------------------------------------------------------

    overall_status = get_overall_status(
        weather,
        ocean
    )

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {
        "status": overall_status,

        "weather": weather,

        "ocean": ocean,

        "data_quality": data_quality,

        "summary": summary,

        "risk_assessment": risk,

        "marine_advice": advice,

        "final_decision": decision,

        "source": (
            "Open-Meteo Weather + Marine API"
        ),

        "timestamp": requested_time,

        "freshness": freshness_info["freshness"],

        "time_difference": (
            freshness_info["time_difference"]
        ),

        "time_difference_minutes": (
            freshness_info["time_difference_minutes"]
        ),

        "checked_at": freshness_info["checked_at"]
    }


# ============================================================
# TESTING
# ============================================================

if __name__ == "__main__":

    location = input(
        "Enter location: "
    ).strip()

    date = input(
        "Enter date (YYYY-MM-DD): "
    ).strip()

    time = input(
        "Enter time (HH:MM): "
    ).strip()

    # --------------------------------------------------------
    # Location validation
    # --------------------------------------------------------

    if not location:

        print({
            "status": "error",
            "message": "Location cannot be empty."
        })

    else:

        # ----------------------------------------------------
        # Date/time validation
        # ----------------------------------------------------

        try:

            requested_datetime = datetime.strptime(
                f"{date} {time}",
                "%Y-%m-%d %H:%M"
            )

        except ValueError:

            print({
                "status": "error",
                "message": (
                    "Invalid date or time. "
                    "Use YYYY-MM-DD and HH:MM."
                )
            })

        else:

            requested_time = (
                requested_datetime.strftime(
                    "%Y-%m-%dT%H:%M"
                )
            )

            # ------------------------------------------------
            # Location → coordinates
            # ------------------------------------------------

            location_data = get_location_coordinates(
                location
            )

            if location_data["status"] != "available":

                print(location_data)

            else:

                lat = location_data["latitude"]
                lon = location_data["longitude"]

                # --------------------------------------------
                # Get marine conditions
                # --------------------------------------------

                result = get_marine_conditions(
                    lat,
                    lon,
                    requested_time
                )

                print(result)
