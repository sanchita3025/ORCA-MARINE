# backend/services/coastal_service.py

from __future__ import annotations

import math
from typing import Any


# Approximate Indian coastal operating areas used only for spatial context.
# These are not official maritime boundaries or navigation zones.
COASTAL_AREAS = [
    {
        "name": "Odisha Coast",
        "lat_min": 17.8,
        "lat_max": 21.0,
        "lon_min": 84.5,
        "lon_max": 87.8,
    },
    {
        "name": "Andhra Pradesh Coast",
        "lat_min": 13.0,
        "lat_max": 18.0,
        "lon_min": 81.0,
        "lon_max": 84.8,
    },
    {
        "name": "Tamil Nadu Coast",
        "lat_min": 8.0,
        "lat_max": 13.5,
        "lon_min": 77.0,
        "lon_max": 80.6,
    },
    {
        "name": "West Bengal Coast",
        "lat_min": 21.0,
        "lat_max": 22.2,
        "lon_min": 87.5,
        "lon_max": 89.0,
    },
]


def _to_float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _distance_km(
    latitude_1: float,
    longitude_1: float,
    latitude_2: float,
    longitude_2: float,
) -> float:
    """
    Haversine distance between two coordinates.
    """

    earth_radius_km = 6371.0

    lat1 = math.radians(latitude_1)
    lat2 = math.radians(latitude_2)

    delta_lat = math.radians(latitude_2 - latitude_1)
    delta_lon = math.radians(longitude_2 - longitude_1)

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(delta_lon / 2) ** 2
    )

    return earth_radius_km * 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(max(0.0, 1 - a)),
    )


def get_coastal_area(
    latitude: float,
    longitude: float,
) -> dict[str, Any]:
    """
    Return the broad Indian coastal area containing the coordinate.

    This is contextual information only and must not be interpreted as an
    official maritime boundary.
    """

    lat = _to_float(latitude)
    lon = _to_float(longitude)

    if lat is None or lon is None:
        return {
            "status": "unavailable",
            "is_coastal_area": False,
            "name": None,
        }

    for area in COASTAL_AREAS:
        if (
            area["lat_min"] <= lat <= area["lat_max"]
            and area["lon_min"] <= lon <= area["lon_max"]
        ):
            return {
                "status": "available",
                "is_coastal_area": True,
                "name": area["name"],
            }

    return {
        "status": "available",
        "is_coastal_area": False,
        "name": None,
    }


def is_near_indian_coast(
    latitude: float,
    longitude: float,
    tolerance_degrees: float = 1.0,
) -> bool:
    """
    Broad geographic check for whether a point is near the configured
    Indian coastal operating areas.

    This is not an official coastline or maritime-zone test.
    """

    lat = _to_float(latitude)
    lon = _to_float(longitude)

    if lat is None or lon is None:
        return False

    for area in COASTAL_AREAS:
        if (
            area["lat_min"] - tolerance_degrees
            <= lat
            <= area["lat_max"] + tolerance_degrees
            and area["lon_min"] - tolerance_degrees
            <= lon
            <= area["lon_max"] + tolerance_degrees
        ):
            return True

    return False


def build_coastal_context(
    latitude: float,
    longitude: float,
) -> dict[str, Any]:
    """
    Build a small spatial context object for the ORCA decision pipeline.
    """

    area = get_coastal_area(latitude, longitude)

    return {
        "status": area.get("status", "unavailable"),
        "latitude": latitude,
        "longitude": longitude,
        "coastal_area": area.get("name"),
        "is_coastal_area": area.get("is_coastal_area", False),
        "is_near_indian_coast": is_near_indian_coast(
            latitude,
            longitude,
        ),
        "official_boundary": False,
        "note": (
            "Coastal classification is approximate spatial context and "
            "is not an official maritime boundary."
        ),
    }


def calculate_distance(
    latitude_1: float,
    longitude_1: float,
    latitude_2: float,
    longitude_2: float,
) -> float | None:
    """
    Calculate distance between two valid coordinates in kilometres.
    """

    lat1 = _to_float(latitude_1)
    lon1 = _to_float(longitude_1)
    lat2 = _to_float(latitude_2)
    lon2 = _to_float(longitude_2)

    if None in (lat1, lon1, lat2, lon2):
        return None

    if not (-90 <= lat1 <= 90 and -90 <= lat2 <= 90):
        return None

    if not (-180 <= lon1 <= 180 and -180 <= lon2 <= 180):
        return None

    return round(
        _distance_km(lat1, lon1, lat2, lon2),
        2,
    )


def check_restricted_zone(
    latitude: float,
    longitude: float,
    restricted_zones: list[dict] | None = None,
) -> dict[str, Any]:
    """
    Check supplied GIS restricted-zone polygons/boxes.

    No restricted zones are invented. If no GIS dataset is supplied,
    the result is explicitly marked unavailable.
    """

    if not restricted_zones:
        return {
            "status": "unavailable",
            "inside_restricted_zone": None,
            "zone": None,
            "message": (
                "No restricted-zone GIS dataset is currently available."
            ),
        }

    lat = _to_float(latitude)
    lon = _to_float(longitude)

    if lat is None or lon is None:
        return {
            "status": "unavailable",
            "inside_restricted_zone": None,
            "zone": None,
            "message": "Invalid coordinates.",
        }

    for zone in restricted_zones:
        try:
            min_lat = float(zone["min_lat"])
            max_lat = float(zone["max_lat"])
            min_lon = float(zone["min_lon"])
            max_lon = float(zone["max_lon"])
        except (KeyError, TypeError, ValueError):
            continue

        if (
            min_lat <= lat <= max_lat
            and min_lon <= lon <= max_lon
        ):
            return {
                "status": "available",
                "inside_restricted_zone": True,
                "zone": zone.get("name", "Restricted zone"),
                "message": "Coordinate falls inside a supplied restricted zone.",
            }

    return {
        "status": "available",
        "inside_restricted_zone": False,
        "zone": None,
        "message": "Coordinate is outside the supplied restricted zones.",
    }


def build_spatial_summary(
    latitude: float,
    longitude: float,
    restricted_zones: list[dict] | None = None,
) -> dict[str, Any]:
    """
    Combine coastal context and supplied GIS zone information.
    """

    coastal = build_coastal_context(latitude, longitude)

    restricted = check_restricted_zone(
        latitude,
        longitude,
        restricted_zones,
    )

    return {
        "status": (
            "available"
            if coastal["status"] == "available"
            or restricted["status"] == "available"
            else "unavailable"
        ),
        "coastal": coastal,
        "restricted_zone": restricted,
    }