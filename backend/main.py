from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
import math

from services.marine_service import get_marine_conditions
from services.location_service import get_location_coordinates
from services.pfz_service import (
    get_pfz_data,
    get_pfz_hotspots,
    get_nearest_pfz
)


# ==================================================
# FASTAPI APPLICATION
# ==================================================

app = FastAPI(
    title="ORCA Marine Intelligence API",
    description="Marine weather, ocean conditions and risk assessment API",
    version="1.0.0"
)


# ==================================================
# CORS CONFIGURATION
# ==================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://orca-marine-ecosystem.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================================================
# HOME
# ==================================================

@app.get("/")
def home():

    return {
        "status": "online",
        "message": "ORCA Marine Intelligence API is running"
    }


# ==================================================
# REQUEST MODEL
# ==================================================

class MarineRequest(BaseModel):

    location: str
    date: str
    time: str
    latitude: float | None = None
    longitude: float | None = None


# ==================================================
# MARINE CONDITIONS
# ==================================================

@app.post("/marine-conditions")
def marine_conditions(
    request: MarineRequest
):

    # ------------------------------------------
    # Validate location
    # ------------------------------------------

    if not request.location.strip():

        return {
            "status": "error",
            "message": "Location cannot be empty."
        }


    # ------------------------------------------
    # Validate date and time
    # ------------------------------------------

    try:

        parsed_datetime = datetime.strptime(
            f"{request.date} {request.time}",
            "%Y-%m-%d %I:%M %p"
        )

    except ValueError:

        return {
            "status": "error",
            "message": (
                "Invalid date or time. "
                "Use YYYY-MM-DD and HH:MM AM/PM format."
            )
        }


    requested_time = parsed_datetime.strftime(
        "%Y-%m-%dT%H:%M"
    )


    # ------------------------------------------
    # Location → Coordinates
    # ------------------------------------------

    # Frontend ke exact coordinates available hain to
    # unhi coordinates ko use karo.
    if (
        request.latitude is not None
        and request.longitude is not None
    ):
        latitude = request.latitude
        longitude = request.longitude

    else:
        # Agar coordinates nahi aaye to existing
        # location-name geocoding fallback use hoga.
        location_result = get_location_coordinates(
            request.location
        )

        if location_result["status"] != "available":
            return location_result

        latitude = location_result["latitude"]
        longitude = location_result["longitude"]


    # Basic coordinate validation
    if not -90 <= latitude <= 90:
        return {
            "status": "error",
            "message": "Latitude must be between -90 and 90."
        }

    if not -180 <= longitude <= 180:
        return {
            "status": "error",
            "message": "Longitude must be between -180 and 180."
        }
    # ------------------------------------------
    # Marine conditions
    # ------------------------------------------

    result = get_marine_conditions(
        latitude,
        longitude,
        requested_time
    )

    return result


# ==================================================
# PFZ / SATELLITE ENDPOINT
# ==================================================

@app.get("/pfz")
def pfz():

    try:

        data = get_pfz_data()

        return {
            "status": "success",
            "data": data
        }

    except Exception as e:

        return {
            "status": "error",
            "message": str(e)
        }


# ==================================================
# PFZ HOTSPOTS
# ==================================================

@app.get("/pfz/hotspots")
def pfz_hotspots():

    try:

        data = get_pfz_hotspots()

        return {
            "status": "success",
            "data": data
        }

    except Exception as e:

        return {
            "status": "error",
            "message": str(e)
        }


# ==================================================
# NEAREST PFZ
# ==================================================

@app.get("/pfz/nearest")
def nearest_pfz(
    latitude: float,
    longitude: float
):

    try:

        return get_nearest_pfz(
            latitude,
            longitude
        )

    except ValueError as e:

        return {
            "status": "error",
            "message": str(e)
        }

    except Exception as e:

        return {
            "status": "error",
            "message": str(e)
        }


# ==================================================
# MEMBER 3 - RESTRICTED MARINE ZONES
# ==================================================
#
# These are the same zones currently present in
# frontend/src/data/restricted_zones.geojson
#
# Coordinates are stored as:
# [longitude, latitude]
#
# ==================================================

RESTRICTED_ZONES = [

    {
        "name": "Demo Restricted Area 1",

        "status": "NOT RECOMMENDED",

        "reason": (
            "Demo restricted zone for ORCA prototype"
        ),

        "polygon": [
            [85.82, 19.84],
            [85.86, 19.84],
            [85.86, 19.88],
            [85.82, 19.88],
            [85.82, 19.84]
        ]
    },

    {
        "name": "Demo Restricted Area 2",

        "status": "NOT RECOMMENDED",

        "reason": (
            "Demo restricted zone for ORCA prototype"
        ),

        "polygon": [
            [86.55, 20.30],
            [86.60, 20.30],
            [86.60, 20.35],
            [86.55, 20.35],
            [86.55, 20.30]
        ]
    }

]


# ==================================================
# MEMBER 3 - POINT IN POLYGON
# ==================================================

def point_in_polygon(
    latitude,
    longitude,
    polygon
):
    """
    Check whether a latitude/longitude point
    lies inside a polygon using ray casting.

    Polygon coordinates use:
    [longitude, latitude]
    """

    x = longitude
    y = latitude

    inside = False

    number_of_points = len(polygon)

    if number_of_points < 3:

        return False


    j = number_of_points - 1


    for i in range(number_of_points):

        xi = polygon[i][0]
        yi = polygon[i][1]

        xj = polygon[j][0]
        yj = polygon[j][1]


        if (
            (yi > y) != (yj > y)
            and
            (
                x
                <
                (
                    (xj - xi)
                    *
                    (y - yi)
                    /
                    (yj - yi)
                )
                + xi
            )
        ):

            inside = not inside


        j = i


    return inside


# ==================================================
# MEMBER 3 - RESTRICTED ZONE CHECK
# ==================================================

def check_restricted_zone(
    latitude,
    longitude
):
    """
    Check whether the selected user location
    falls inside any restricted marine zone.
    """

    # ------------------------------------------
    # Coordinate validation
    # ------------------------------------------

    if not isinstance(
        latitude,
        (int, float)
    ):

        return {
            "restricted": False,
            "zone": None,
            "status": "UNKNOWN",
            "reason": "Invalid latitude."
        }


    if not isinstance(
        longitude,
        (int, float)
    ):

        return {
            "restricted": False,
            "zone": None,
            "status": "UNKNOWN",
            "reason": "Invalid longitude."
        }


    # ------------------------------------------
    # Check every restricted zone
    # ------------------------------------------

    for zone in RESTRICTED_ZONES:

        polygon = zone["polygon"]


        if point_in_polygon(
            latitude,
            longitude,
            polygon
        ):

            return {

                "restricted": True,

                "zone": zone["name"],

                "status": zone["status"],

                "reason": zone["reason"]

            }


    # ------------------------------------------
    # Location is clear
    # ------------------------------------------

    return {

        "restricted": False,

        "zone": None,

        "status": "CLEAR",

        "reason": None

    }


# ==================================================
# GIS HELPER FUNCTIONS
# ==================================================

def calculate_bearing(
    lat1,
    lon1,
    lat2,
    lon2
):
    """
    Calculate bearing from first coordinate
    to second coordinate.
    """

    lat1_rad = math.radians(lat1)

    lat2_rad = math.radians(lat2)

    delta_lon = math.radians(
        lon2 - lon1
    )

    x = (
        math.sin(delta_lon)
        * math.cos(lat2_rad)
    )

    y = (
        math.cos(lat1_rad)
        * math.sin(lat2_rad)
        -
        math.sin(lat1_rad)
        * math.cos(lat2_rad)
        * math.cos(delta_lon)
    )

    bearing = math.degrees(
        math.atan2(x, y)
    )

    return round(
        (bearing + 360) % 360,
        2
    )


def bearing_to_direction(
    bearing
):
    """
    Convert bearing into compass direction.
    """

    directions = [
        "North",
        "North-East",
        "East",
        "South-East",
        "South",
        "South-West",
        "West",
        "North-West"
    ]

    index = int(
        (bearing + 22.5) / 45
    ) % 8

    return directions[index]


def calculate_distance_km(
    lat1,
    lon1,
    lat2,
    lon2
):
    """
    Calculate distance using Haversine formula.
    """

    earth_radius = 6371.0

    lat1_rad = math.radians(lat1)

    lat2_rad = math.radians(lat2)

    delta_lat = math.radians(
        lat2 - lat1
    )

    delta_lon = math.radians(
        lon2 - lon1
    )

    a = (
        math.sin(delta_lat / 2) ** 2
        +
        math.cos(lat1_rad)
        *
        math.cos(lat2_rad)
        *
        math.sin(delta_lon / 2) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )

    return round(
        earth_radius * c,
        2
    )


# ==================================================
# DYNAMIC RISK RADIUS
# ==================================================

def get_dynamic_risk_radius(
    risk_level,
    risk_score
):
    """
    Generate a dynamic GIS risk-zone radius
    based on actual marine risk.

    Higher risk = larger visual warning zone.
    """

    if risk_level == "High":

        return {
            "radius_km": 50,
            "severity": "High"
        }

    elif risk_level == "Medium":

        return {
            "radius_km": 30,
            "severity": "Medium"
        }

    elif risk_level == "Low":

        return {
            "radius_km": 15,
            "severity": "Low"
        }

    else:

        return {
            "radius_km": 10,
            "severity": "Unknown"
        }


# ==================================================
# DYNAMIC GIS DATA
# ==================================================

@app.get("/gis-data")
def gis_data(
    latitude: float,
    longitude: float,
    date: str = None,
    time: str = None
):

    # ------------------------------------------
    # Coordinate validation
    # ------------------------------------------

    if not -90 <= latitude <= 90:

        return {
            "status": "error",
            "message": (
                "Latitude must be between -90 and 90."
            )
        }


    if not -180 <= longitude <= 180:

        return {
            "status": "error",
            "message": (
                "Longitude must be between -180 and 180."
            )
        }


    # ==================================================
    # REQUESTED TIME
    # ==================================================

    requested_time = None

    if date and time:

        try:

            parsed_datetime = datetime.strptime(
                f"{date} {time}",
                "%Y-%m-%d %I:%M %p"
            )

            requested_time = parsed_datetime.strftime(
                "%Y-%m-%dT%H:%M"
            )

        except ValueError:

            return {
                "status": "error",
                "message": (
                    "Invalid date/time. "
                    "Use YYYY-MM-DD and HH:MM AM/PM."
                )
            }


    # ==================================================
    # IF DATE/TIME NOT PROVIDED
    # USE CURRENT TIME
    # ==================================================

    if requested_time is None:

        requested_time = datetime.now().strftime(
            "%Y-%m-%dT%H:%M"
        )


    # ==================================================
    # GET ACTUAL MARINE CONDITIONS
    # ==================================================

    try:

        marine_result = get_marine_conditions(
            latitude,
            longitude,
            requested_time
        )

    except Exception as e:

        marine_result = {
            "status": "error",
            "message": str(e)
        }


    # ==================================================
    # EXTRACT MARINE RISK
    # ==================================================

    risk_level = "Unknown"

    risk_score = None

    risk_factors = []


    risk_assessment = marine_result.get(
        "risk_assessment"
    )


    if risk_assessment:

        risk_level = risk_assessment.get(
            "risk_level",
            "Unknown"
        )

        risk_score = risk_assessment.get(
            "risk_score"
        )

        risk_factors = risk_assessment.get(
            "risk_factors",
            []
        )


    # ==================================================
    # MEMBER 3 - RESTRICTED ZONE
    # ==================================================

    restricted_zone = check_restricted_zone(
        latitude,
        longitude
    )


    # ==================================================
    # DYNAMIC RISK ZONE
    # ==================================================

    dynamic_risk = get_dynamic_risk_radius(
        risk_level,
        risk_score
    )


    risk_radius_km = dynamic_risk[
        "radius_km"
    ]


    risk_zone = {

        "center": {

            "latitude": round(
                latitude,
                6
            ),

            "longitude": round(
                longitude,
                6
            )

        },

        "radius_km": risk_radius_km,

        "risk_level": risk_level,

        "risk_score": risk_score,

        "severity": dynamic_risk[
            "severity"
        ],

        "type": "Dynamic Marine Risk Assessment",

        "risk_factors": risk_factors

    }


    # ==================================================
    # FIND NEAREST PFZ
    # ==================================================

    try:

        pfz_result = get_nearest_pfz(
            latitude,
            longitude
        )

    except Exception as e:

        pfz_result = {
            "status": "error",
            "message": str(e)
        }


    nearest_pfz = pfz_result.get(
        "nearest_pfz"
    )


    # ==================================================
    # DEFAULT GIS VALUES
    # ==================================================

    pfz_data = None

    route = None

    direction = {

        "bearing": None,

        "compass": None

    }


    # ==================================================
    # DYNAMIC PFZ + ROUTE
    # ==================================================

    if nearest_pfz:

        pfz_latitude = nearest_pfz.get(
            "latitude"
        )

        pfz_longitude = nearest_pfz.get(
            "longitude"
        )

        pfz_distance = nearest_pfz.get(
            "distance_km"
        )


        # ------------------------------------------
        # Calculate bearing
        # ------------------------------------------

        bearing = calculate_bearing(
            latitude,
            longitude,
            pfz_latitude,
            pfz_longitude
        )


        compass_direction = bearing_to_direction(
            bearing
        )


        # ------------------------------------------
        # PFZ information
        # ------------------------------------------

        pfz_data = {

            "latitude": pfz_latitude,

            "longitude": pfz_longitude,

            "suitability": nearest_pfz.get(
                "suitability"
            ),

            "suitability_level": nearest_pfz.get(
                "suitability_level"
            ),

            "distance_km": pfz_distance,

            "source": "NOAA SST + Satellite Chlorophyll"

        }


        # ------------------------------------------
        # Dynamic route
        # ------------------------------------------

        route = {

            "start": {

                "latitude": round(
                    latitude,
                    6
                ),

                "longitude": round(
                    longitude,
                    6
                )

            },

            "end": {

                "latitude": round(
                    pfz_latitude,
                    6
                ),

                "longitude": round(
                    pfz_longitude,
                    6
                )

            },

            "distance_km": pfz_distance,

            "bearing": bearing,

            "direction": compass_direction,

            "type": "User Location → Nearest PFZ"

        }


        direction = {

            "bearing": bearing,

            "compass": compass_direction

        }


    # ==================================================
    # NO PFZ FOUND
    # ==================================================

    else:

        route = {

            "start": {

                "latitude": round(
                    latitude,
                    6
                ),

                "longitude": round(
                    longitude,
                    6
                )

            },

            "end": None,

            "distance_km": None,

            "bearing": None,

            "direction": None,

            "type": "No nearby PFZ available"

        }


    # ==================================================
    # FINAL GIS RESPONSE
    # ==================================================

    return {

        "status": "success",

        "user_location": {

            "latitude": round(
                latitude,
                6
            ),

            "longitude": round(
                longitude,
                6
            )

        },

        "requested_datetime": requested_time,

        "marine_risk": {

            "level": risk_level,

            "score": risk_score,

            "factors": risk_factors

        },

        "restricted_zone": restricted_zone,

        "pfz": pfz_data,

        "route": route,

        "risk_zone": risk_zone,

        "direction": direction

    }


# ==================================================
# ORCA ANALYSIS REQUEST MODEL
# ==================================================

class ORCAAnalysisRequest(BaseModel):
    location: str
    date: str
    time: str

    # Frontend se exact selected coordinates receive karenge.
    # Optional rakhe hain taaki purane API requests bhi kaam karein.
    latitude: float | None = None
    longitude: float | None = None

# ==================================================
# ORCA LOCATION PARSER
# ==================================================

def parse_orca_location(location_input):
    """
    Accept both:
    1. Place name: "puri"
    2. GPS coordinates: "20.320522, 86.573477"

    Returns a location result in the same structure
    expected by the ORCA analysis endpoint.
    """

    value = location_input.strip()

    # ------------------------------------------
    # Try GPS coordinate format first
    # ------------------------------------------

    parts = value.split(",")

    if len(parts) == 2:

        try:

            latitude = float(parts[0].strip())
            longitude = float(parts[1].strip())

            # Validate latitude
            if not -90 <= latitude <= 90:

                return {
                    "status": "error",
                    "message": (
                        "Latitude must be between -90 and 90."
                    )
                }

            # Validate longitude
            if not -180 <= longitude <= 180:

                return {
                    "status": "error",
                    "message": (
                        "Longitude must be between -180 and 180."
                    )
                }

            return {

                "status": "available",

                "name": "GPS Coordinates",

                "latitude": latitude,

                "longitude": longitude

            }

        except ValueError:
            # Not coordinates → treat as place name
            pass

    # ------------------------------------------
    # Otherwise treat input as place name
    # ------------------------------------------

    return get_location_coordinates(value)


# ==================================================
# ORCA COMPLETE ANALYSIS
# ==================================================

@app.post("/orca-analysis")
def orca_analysis(
    request: ORCAAnalysisRequest
):

    # ------------------------------------------
    # Validate location
    # ------------------------------------------

    if not request.location.strip():

        return {
            "status": "error",
            "message": "Location cannot be empty."
        }


    # ------------------------------------------
    # Validate date/time
    # ------------------------------------------

    try:

        parsed_datetime = datetime.strptime(
            f"{request.date} {request.time}",
            "%Y-%m-%d %I:%M %p"
        )

    except ValueError:

        return {
            "status": "error",
            "message": (
                "Invalid date or time. "
                "Use YYYY-MM-DD and HH:MM AM/PM format."
            )
        }


    requested_time = parsed_datetime.strftime(
        "%Y-%m-%dT%H:%M"
    )


    # ------------------------------------------
    # Location → Coordinates
    # Supports place names + GPS coordinates
    # ------------------------------------------

    if request.latitude is not None and request.longitude is not None:
        latitude = request.latitude
        longitude = request.longitude
    else:
        location_result = parse_orca_location(request.location)

        if location_result["status"] != "available":
            return location_result

        latitude = location_result["latitude"]
        longitude = location_result["longitude"]

    if not -90 <= latitude <= 90:
        return {
            "status": "error",
            "message": "Latitude must be between -90 and 90."
        }

    if not -180 <= longitude <= 180:
        return {
            "status": "error",
            "message": "Longitude must be between -180 and 180."
        }


    # ==================================================
    # MEMBER 3 - RESTRICTED ZONE CHECK
    # ==================================================

    restricted_zone = check_restricted_zone(
        latitude,
        longitude
    )


    # ------------------------------------------
    # Marine conditions
    # ------------------------------------------

    try:
        marine_result = get_marine_conditions(
            latitude,
            longitude,
            requested_time
        )
    except Exception as e:
        marine_result = {
            "status": "error",
            "message": str(e),
            "risk_assessment": {
                "risk_level": "Unknown",
                "risk_score": None,
                "risk_factors": []
            }
        }


    # ------------------------------------------
    # Nearest PFZ
    # ------------------------------------------

    try:

        pfz_result = get_nearest_pfz(
            latitude,
            longitude
        )

    except Exception as e:

        pfz_result = {
            "status": "error",
            "message": str(e)
        }


    # ------------------------------------------
    # Marine risk
    # ------------------------------------------

    marine_risk = "Unknown"

    marine_risk_score = None


    if marine_result.get(
        "risk_assessment"
    ):

        marine_risk = marine_result[
            "risk_assessment"
        ].get(
            "risk_level",
            "Unknown"
        )

        marine_risk_score = marine_result[
            "risk_assessment"
        ].get(
            "risk_score"
        )


    # ------------------------------------------
    # Fishing zone
    # ------------------------------------------

    nearest_pfz = pfz_result.get(
        "nearest_pfz"
    )


    if nearest_pfz:

        suitability = nearest_pfz.get(
            "suitability"
        )

        suitability_level = nearest_pfz.get(
            "suitability_level",
            "Unknown"
        )

        distance_km = nearest_pfz.get(
            "distance_km"
        )

        fishing_status = "AVAILABLE"


    else:

        suitability = None

        suitability_level = "None"

        distance_km = pfz_result.get(
            "nearest_known_hotspot_distance_km"
        )

        fishing_status = "NOT_AVAILABLE"


    # ==================================================
    # FINAL RECOMMENDATION
    # ==================================================
    #
    # Priority:
    #
    # 1. Restricted Zone → AVOID
    # 2. High Marine Risk → AVOID
    # 3. Medium Risk → CAUTION
    # 4. Low Risk + Good PFZ → FAVORABLE
    #
    # ==================================================

    if restricted_zone["restricted"]:

        final_decision = "AVOID"

        severity = "High"

        recommendation = (
            "The selected location falls within "
            "a restricted marine zone. Fishing activity "
            "is not recommended in this area."
        )


    elif marine_risk == "High":

        final_decision = "AVOID"

        severity = "High"

        recommendation = (
            "Marine conditions are high risk. "
            "Fishing activity is not recommended."
        )


    elif marine_risk in [
        "Medium",
        "Moderate"
    ]:

        final_decision = "CAUTION"

        severity = "Medium"


        if fishing_status == "AVAILABLE":

            recommendation = (
                "A fishing zone is available, but "
                "marine conditions require caution."
            )

        else:

            recommendation = (
                "Marine conditions require caution "
                "and no nearby suitable fishing zone "
                "was identified."
            )


    elif marine_risk == "Low":

        if (
            fishing_status == "AVAILABLE"
            and
            suitability_level in [
                "High",
                "Moderate"
            ]
        ):

            final_decision = "FAVORABLE"

            severity = "Low"

            recommendation = (
                "Marine conditions are favorable and "
                "a nearby suitable fishing zone has "
                "been identified."
            )


        elif fishing_status == "AVAILABLE":

            final_decision = "CAUTION"

            severity = "Low"

            recommendation = (
                "Marine conditions are favorable, "
                "but the nearby fishing-zone suitability "
                "is low."
            )


        else:

            final_decision = "NO_NEARBY_PFZ"

            severity = "Low"

            recommendation = (
                "Marine conditions are favorable, "
                "but no nearby suitable fishing zone "
                "was identified."
            )


    else:

        final_decision = "INSUFFICIENT_DATA"

        severity = "Unknown"

        recommendation = (
            "There is not enough reliable data to "
            "make a final marine recommendation."
        )


    # ==================================================
    # FINAL ORCA RESPONSE
    # ==================================================

    return {

        "status": "success",

        "location": {

            "name": request.location or "Selected marine location",

            "latitude": latitude,

            "longitude": longitude

        },

        "requested_datetime": requested_time,

        "marine_conditions": marine_result,

        "fishing_zone": pfz_result,

        # ------------------------------------------
        # MEMBER 3 DATA
        # ------------------------------------------

        "restricted_zone": restricted_zone,

        # ------------------------------------------
        # FINAL ORCA DECISION
        # ------------------------------------------

        "orca_recommendation": {

            "decision": final_decision,

            "severity": severity,

            "marine_risk": marine_risk,

            "marine_risk_score": marine_risk_score,

            "fishing_zone_status": fishing_status,

            "pfz_suitability": suitability,

            "pfz_suitability_level": suitability_level,

            "pfz_distance_km": distance_km,

            "restricted_zone_status": (
                "RESTRICTED"
                if restricted_zone["restricted"]
                else "CLEAR"
            ),

            "recommendation": recommendation

        }

    }
