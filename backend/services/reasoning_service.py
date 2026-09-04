def generate_marine_advice(summary, risk, weather, ocean):

    # Check if risk assessment is unavailable
    if risk.get("risk_level") == "Unknown":

        return {
            "status": "insufficient_data",
            "advice": (
                "Unable to provide marine advice because "
                "required weather or ocean data is unavailable."
            )
        }

    risk_level = risk.get("risk_level")
    risk_score = risk.get("risk_score")

    wind_speed = weather.get("wind_speed")
    precipitation = weather.get("precipitation")
    condition = weather.get("condition")

    wave_height = ocean.get("wave_height")
    wave_period = ocean.get("wave_period")
    current_speed = ocean.get("current_speed")

    explanations = []

    # -----------------------------
    # Wind explanation
    # -----------------------------

    if wind_speed is not None:

        if wind_speed < 10:
            explanations.append(
                f"Wind is relatively calm at {wind_speed} km/h."
            )

        elif wind_speed <= 20:
            explanations.append(
                f"Wind is moderate at {wind_speed} km/h."
            )

        elif wind_speed <= 30:
            explanations.append(
                f"Strong wind of {wind_speed} km/h may affect "
                "marine operations."
            )

        else:
            explanations.append(
                f"Very strong wind of {wind_speed} km/h "
                "significantly increases marine risk."
            )


    # -----------------------------
    # Wave explanation
    # -----------------------------

    if wave_height is not None:

        if wave_height < 1:
            explanations.append(
                f"Wave height is low at {wave_height} m."
            )

        elif wave_height <= 2:
            explanations.append(
                f"Wave height is moderate at {wave_height} m."
            )

        elif wave_height <= 3:
            explanations.append(
                f"Wave height is high at {wave_height} m "
                "and may affect small vessels."
            )

        else:
            explanations.append(
                f"Wave height is very high at {wave_height} m "
                "and may create hazardous marine conditions."
            )


    # -----------------------------
    # Ocean current explanation
    # -----------------------------

    if current_speed is not None:

        if current_speed < 1:
            explanations.append(
                f"Ocean current is relatively calm at "
                f"{current_speed} m/s."
            )

        elif current_speed <= 2:
            explanations.append(
                f"Ocean current is moderate at "
                f"{current_speed} m/s."
            )

        else:
            explanations.append(
                f"Strong ocean current of {current_speed} m/s "
                "may make navigation more difficult."
            )


    # -----------------------------
    # Wave period explanation
    # -----------------------------

    if wave_period is not None:

        if wave_period < 6:
            explanations.append(
                f"Short wave period ({wave_period} s) may "
                "produce choppy sea conditions."
            )

        elif wave_period <= 10:
            explanations.append(
                f"Wave period is moderate at {wave_period} s."
            )

        else:
            explanations.append(
                f"Long wave period of {wave_period} s indicates "
                "more widely spaced waves."
            )


    # -----------------------------
    # Precipitation explanation
    # -----------------------------

    if precipitation is not None:

        if precipitation == 0:
            explanations.append(
                "No significant precipitation is expected."
            )

        elif precipitation <= 5:
            explanations.append(
                f"Light precipitation of {precipitation} mm "
                "is present."
            )

        else:
            explanations.append(
                f"Heavy precipitation of {precipitation} mm "
                "may reduce visibility and affect operations."
            )


    # -----------------------------
    # Severe weather explanation
    # -----------------------------

    if condition:

        if "Thunderstorm" in condition:

            explanations.append(
                "Thunderstorm conditions are present and "
                "require additional caution."
            )

        elif "Heavy rain" in condition:

            explanations.append(
                "Heavy rain may reduce visibility "
                "and affect marine operations."
            )


    # -----------------------------
    # Overall explanation
    # -----------------------------

    if risk_level == "Low":

        overall_explanation = (
            f"Overall marine risk is LOW with a risk score "
            f"of {risk_score}. "
            "The available conditions are generally favorable "
            "for normal marine activities."
        )

    elif risk_level == "Medium":

        overall_explanation = (
            f"Overall marine risk is MEDIUM with a risk score "
            f"of {risk_score}. "
            "Some weather or ocean conditions require caution, "
            "especially for small vessels."
        )

    else:

        overall_explanation = (
            f"Overall marine risk is HIGH with a risk score "
            f"of {risk_score}. "
            "Multiple environmental factors indicate potentially "
            "unsafe marine conditions."
        )


    # -----------------------------
    # Final advice
    # -----------------------------

    if risk_level == "Low":

        advice = (
            "Marine conditions are generally favorable. "
            "Normal activities may proceed with standard safety precautions."
        )

    elif risk_level == "Medium":

        advice = (
            "Exercise caution during marine activities. "
            "Small vessels should monitor changing conditions carefully."
        )

    else:

        advice = (
            "Marine activities should be avoided or postponed "
            "if possible until conditions improve."
        )


    return {
        "status": "available",
        "risk_level": risk_level,
        "risk_score": risk_score,
        "explanation": overall_explanation,
        "factors": explanations,
        "advice": advice
    }