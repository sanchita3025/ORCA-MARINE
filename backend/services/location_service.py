import requests


def get_location_coordinates(location):

    if not isinstance(location, str) or not location.strip():
        return {
            "status": "error",
            "message": "Invalid location."
        }

    url = "https://geocoding-api.open-meteo.com/v1/search"

    params = {
        "name": location,
        "count": 1,
        "language": "en",
        "format": "json"
    }

    try:
        response = requests.get(
            url,
            params=params,
            timeout=10
        )

        if response.status_code != 200:
            raise Exception(
                f"Geocoding API failed: HTTP {response.status_code}"
            )

        data = response.json()

        if "results" not in data or not data["results"]:
            return {
                "status": "error",
                "message": "Location not found."
            }

        result = data["results"][0]

        return {
            "status": "available",
            "location": result["name"],
            "latitude": result["latitude"],
            "longitude": result["longitude"],
            "country": result.get("country"),
            "admin1": result.get("admin1"),
            "source": "Open-Meteo Geocoding API"
        }

    except Exception as e:

        print("LOCATION ERROR:", e)

        return {
            "status": "error",
            "message": "Unable to fetch location coordinates."
        }


# Testing
if __name__ == "__main__":

    result = get_location_coordinates("Puri")

    print(result)