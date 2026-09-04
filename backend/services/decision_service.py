def make_final_decision(risk_assessment, weather, ocean):

    risk_level = risk_assessment.get("risk_level", "Unknown")
    risk_score = risk_assessment.get("risk_score")
    risk_factors = risk_assessment.get("risk_factors", [])

    temperature = weather.get("temperature")
    precipitation = weather.get("precipitation")
    condition = weather.get("condition")

    wave_height = ocean.get("wave_height")
    wind_speed = weather.get("wind_speed")

    # Insufficient data
    if risk_level == "Unknown":
        return {
            "decision": "UNKNOWN",
            "severity": "Unknown",
            "message": "Unable to make a reliable marine decision because required data is unavailable.",
            "reason": "Insufficient weather or ocean data."
        }

    # Final decision
    if risk_level == "Low":
        decision = "SAFE"
        severity = "Low"
        message = (
            "Marine conditions are generally favorable. "
            "Normal marine activities may proceed with standard precautions."
        )

    elif risk_level == "Medium":
        decision = "CAUTION"
        severity = "Medium"
        message = (
            "Marine conditions are moderate. "
            "Caution is advised, especially for small vessels and routine marine activities."
        )

    else:
        decision = "AVOID"
        severity = "High"
        message = (
            "Marine conditions indicate elevated risk. "
            "Marine activities should be avoided or postponed until conditions improve."
        )

    return {
        "decision": decision,
        "severity": severity,
        "risk_score": risk_score,
        "message": message,
        "conditions": {
            "temperature": temperature,
            "wind_speed": wind_speed,
            "wave_height": wave_height,
            "precipitation": precipitation,
            "weather_condition": condition
        },
        "risk_factors": risk_factors
    }