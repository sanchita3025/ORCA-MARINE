import os
import math
import xarray as xr


# ============================================================
# PATH
# ============================================================

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)

PFZ_FILE = os.path.join(
    BASE_DIR,
    "data",
    "satellite",
    "current_pfz_suitability_2026-07-31.nc"
)


# ============================================================
# LOAD PFZ DATA
# ============================================================

def load_pfz_data():
    """
    Load current PFZ satellite dataset.
    """

    if not os.path.exists(PFZ_FILE):
        raise FileNotFoundError(
            f"Current PFZ file not found: {PFZ_FILE}"
        )

    return xr.open_dataset(PFZ_FILE)


# ============================================================
# COMPLETE PFZ GRID
# ============================================================

def get_pfz_data():
    """
    Return complete PFZ suitability grid.
    """

    ds = load_pfz_data()

    try:

        pfz = ds["pfz_suitability"]

        return {
            "date": str(ds.time.values[0])[:10],

            "source": (
                "NOAA SST + Satellite Chlorophyll"
            ),

            "latitude": (
                ds.latitude.values.tolist()
            ),

            "longitude": (
                ds.longitude.values.tolist()
            ),

            "pfz_suitability": (
                pfz.values.tolist()
            )
        }

    finally:

        ds.close()


# ============================================================
# PFZ HOTSPOTS
# ============================================================

def get_pfz_hotspots():
    """
    Return globally high-suitability PFZ points.

    Used mainly for visualization.
    """

    ds = load_pfz_data()

    try:

        pfz = ds["pfz_suitability"]

        daily = pfz.isel(time=0)

        threshold = float(
            daily.quantile(0.90)
        )

        selected = daily.where(
            daily >= threshold
        )

        points = selected.stack(
            location=("latitude", "longitude")
        ).dropna("location")

        points = points.sortby(
            points,
            ascending=False
        )

        hotspots = []

        for i in range(
            min(100, len(points))
        ):

            location = points.isel(
                location=i
            )

            hotspots.append({

                "date": str(
                    ds.time.values[0]
                )[:10],

                "latitude": round(
                    float(location.latitude),
                    6
                ),

                "longitude": round(
                    float(location.longitude),
                    6
                ),

                "suitability": round(
                    float(location.values),
                    4
                )

            })

        return {

            "date": str(
                ds.time.values[0]
            )[:10],

            "source": (
                "NOAA SST + Satellite Chlorophyll"
            ),

            "threshold": round(
                threshold,
                4
            ),

            "total_hotspots": len(
                hotspots
            ),

            "hotspots": hotspots

        }

    finally:

        ds.close()


# ============================================================
# HAVERSINE DISTANCE
# ============================================================

def calculate_distance_km(
    latitude1,
    longitude1,
    latitude2,
    longitude2
):
    """
    Calculate geographic distance using Haversine formula.
    """

    earth_radius_km = 6371.0

    lat1 = math.radians(
        latitude1
    )

    lat2 = math.radians(
        latitude2
    )

    delta_lat = math.radians(
        latitude2 - latitude1
    )

    delta_lon = math.radians(
        longitude2 - longitude1
    )

    a = (
        math.sin(
            delta_lat / 2
        ) ** 2
        +
        math.cos(lat1)
        *
        math.cos(lat2)
        *
        math.sin(
            delta_lon / 2
        ) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )

    return (
        earth_radius_km * c
    )


# ============================================================
# NEAREST PFZ
# ============================================================

def get_nearest_pfz(
    latitude,
    longitude
):
    """
    Find the nearest suitable PFZ directly from
    the COMPLETE satellite grid.

    This is different from searching only the
    top global hotspots.
    """

    # --------------------------------------------------------
    # Maximum acceptable PFZ distance
    # --------------------------------------------------------

    MAX_PFZ_DISTANCE_KM = 200


    # --------------------------------------------------------
    # Coordinate validation
    # --------------------------------------------------------

    if not isinstance(
        latitude,
        (int, float)
    ):

        raise ValueError(
            "Latitude must be numeric."
        )


    if not isinstance(
        longitude,
        (int, float)
    ):

        raise ValueError(
            "Longitude must be numeric."
        )


    if not -90 <= latitude <= 90:

        raise ValueError(
            "Latitude must be between -90 and 90."
        )


    if not -180 <= longitude <= 180:

        raise ValueError(
            "Longitude must be between -180 and 180."
        )


    # --------------------------------------------------------
    # Load dataset
    # --------------------------------------------------------

    ds = load_pfz_data()

    try:

        daily = ds[
            "pfz_suitability"
        ].isel(time=0)


        # ----------------------------------------------------
        # PFZ threshold
        # ----------------------------------------------------

        threshold = float(
            daily.quantile(0.75)
        )


        # ----------------------------------------------------
        # Search COMPLETE GRID
        # ----------------------------------------------------

        best_point = None

        best_distance = float(
            "inf"
        )


        latitudes = (
            ds.latitude.values
        )

        longitudes = (
            ds.longitude.values
        )


        values = (
            daily.values
        )


        # ----------------------------------------------------
        # Iterate through every grid point
        # ----------------------------------------------------

        for i, grid_lat in enumerate(
            latitudes
        ):

            for j, grid_lon in enumerate(
                longitudes
            ):

                suitability = values[
                    i,
                    j
                ]


                # --------------------------------------------
                # Skip invalid values
                # --------------------------------------------

                if suitability is None:

                    continue


                try:

                    suitability = float(
                        suitability
                    )

                except (
                    ValueError,
                    TypeError
                ):

                    continue


                if math.isnan(
                    suitability
                ):

                    continue


                # --------------------------------------------
                # Only consider suitable PFZ points
                # --------------------------------------------

                if suitability < threshold:

                    continue


                # --------------------------------------------
                # Distance from user
                # --------------------------------------------

                distance = calculate_distance_km(
                    latitude,
                    longitude,
                    float(grid_lat),
                    float(grid_lon)
                )


                # --------------------------------------------
                # Keep nearest suitable point
                # --------------------------------------------

                if distance < best_distance:

                    best_distance = distance

                    best_point = {

                        "latitude": round(
                            float(grid_lat),
                            6
                        ),

                        "longitude": round(
                            float(grid_lon),
                            6
                        ),

                        "suitability": round(
                            suitability,
                            4
                        )

                    }


        # ----------------------------------------------------
        # No suitable point found
        # ----------------------------------------------------

        if best_point is None:

            return {

                "status": "available",

                "message": (
                    "No suitable PFZ point found "
                    "in the satellite dataset."
                ),

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

                "nearest_pfz": None

            }


        # ----------------------------------------------------
        # PFZ outside acceptable range
        # ----------------------------------------------------

        if best_distance > MAX_PFZ_DISTANCE_KM:

            return {

                "status": "available",

                "message": (
                    "No nearby PFZ hotspot found "
                    f"within {MAX_PFZ_DISTANCE_KM} km."
                ),

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

                "nearest_pfz": None,

                "nearest_known_hotspot_distance_km": round(
                    best_distance,
                    2
                )

            }


        # ----------------------------------------------------
        # Suitability level
        # ----------------------------------------------------

        suitability = (
            best_point["suitability"]
        )


        if suitability >= 0.70:

            suitability_level = "High"

        elif suitability >= 0.50:

            suitability_level = "Moderate"

        else:

            suitability_level = "Low"


        # ----------------------------------------------------
        # Final PFZ
        # ----------------------------------------------------

        best_point.update({

            "date": str(
                ds.time.values[0]
            )[:10],

            "suitability_level": (
                suitability_level
            ),

            "distance_km": round(
                best_distance,
                2
            )

        })


        return {

            "status": "available",

            "message": (
                "Nearest suitable PFZ found "
                "from the complete satellite grid."
            ),

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

            "threshold": round(
                threshold,
                4
            ),

            "nearest_pfz": best_point

        }


    finally:

        ds.close()