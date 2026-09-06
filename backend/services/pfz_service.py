# backend/services/pfz_service.py

from __future__ import annotations

from pathlib import Path
from typing import Any

import math


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"


def _to_float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _find_pfz_files() -> list[Path]:
    """
    Find PFZ / satellite datasets available in the backend data directory.

    No dataset is created automatically. If no real dataset exists, the
    service reports PFZ as unavailable.
    """

    if not DATA_DIR.exists():
        return []

    patterns = (
        "*.nc",
        "*.netcdf",
        "*.geojson",
        "*.json",
    )

    files: list[Path] = []

    for pattern in patterns:
        files.extend(DATA_DIR.rglob(pattern))

    return sorted(
        set(files),
        key=lambda path: str(path).lower(),
    )


def _find_netcdf_files() -> list[Path]:
    return [
        path
        for path in _find_pfz_files()
        if path.suffix.lower() in {".nc", ".netcdf"}
    ]


def _find_variable(dataset: Any, names: list[str]) -> str | None:
    """
    Find the first matching variable in an xarray dataset.
    """

    variables = set(dataset.data_vars.keys())

    for name in names:
        if name in variables:
            return name

    lowered = {
        str(variable).lower(): variable
        for variable in variables
    }

    for name in names:
        if name.lower() in lowered:
            return lowered[name.lower()]

    for variable in variables:
        variable_lower = str(variable).lower()

        for name in names:
            if name.lower() in variable_lower:
                return variable

    return None


def _find_coordinate(
    dataset: Any,
    candidates: list[str],
) -> str | None:
    """
    Find latitude/longitude coordinate names.
    """

    all_names = list(dataset.coords.keys()) + list(dataset.variables.keys())

    for candidate in candidates:
        for name in all_names:
            if str(name).lower() == candidate.lower():
                return str(name)

    for name in all_names:
        lowered = str(name).lower()

        if any(
            token in lowered
            for token in candidates
        ):
            return str(name)

    return None


def _nearest_index(
    values: Any,
    target: float,
) -> int | None:
    try:
        values_list = values.values.tolist()
    except AttributeError:
        try:
            values_list = list(values)
        except TypeError:
            return None

    if not values_list:
        return None

    # Handle one-dimensional coordinates.
    if values_list and isinstance(
        values_list[0],
        (list, tuple),
    ):
        return None

    best_index = None
    best_distance = None

    for index, value in enumerate(values_list):
        numeric = _to_float(value)

        if numeric is None:
            continue

        distance = abs(numeric - target)

        if best_distance is None or distance < best_distance:
            best_distance = distance
            best_index = index

    return best_index


def _extract_nearest_value(
    dataset: Any,
    variable_name: str,
    latitude_name: str,
    longitude_name: str,
    latitude: float,
    longitude: float,
) -> float | None:
    """
    Extract a nearest-grid-cell value from a regular lat/lon dataset.
    """

    variable = dataset[variable_name]

    lat_values = dataset[latitude_name]
    lon_values = dataset[longitude_name]

    lat_index = _nearest_index(
        lat_values,
        latitude,
    )

    lon_index = _nearest_index(
        lon_values,
        longitude,
    )

    if lat_index is None or lon_index is None:
        return None

    try:
        dimensions = list(variable.dims)

        indexers = {}

        for dimension in dimensions:
            lowered = str(dimension).lower()

            if dimension == latitude_name or "lat" in lowered:
                indexers[dimension] = lat_index

            elif dimension == longitude_name or "lon" in lowered:
                indexers[dimension] = lon_index

            elif (
                "time" in lowered
                or "date" in lowered
            ):
                indexers[dimension] = 0

        selected = variable.isel(indexers)

        value = selected.values

        while hasattr(value, "shape") and getattr(value, "shape", ()):
            try:
                value = value.flat[0]
            except Exception:
                break

        return _to_float(value)

    except Exception:
        return None


def _read_netcdf(
    path: Path,
    latitude: float,
    longitude: float,
) -> dict | None:
    """
    Read a real PFZ NetCDF dataset using xarray.
    """

    try:
        import xarray as xr
    except ImportError:
        return {
            "status": "unavailable",
            "message": (
                "xarray is not installed, so the PFZ NetCDF dataset "
                "cannot be read."
            ),
        }

    try:
        dataset = xr.open_dataset(path)

    except Exception as error:
        return {
            "status": "unavailable",
            "message": f"PFZ dataset could not be opened: {error}",
        }

    try:
        latitude_name = _find_coordinate(
            dataset,
            [
                "latitude",
                "lat",
                "y",
            ],
        )

        longitude_name = _find_coordinate(
            dataset,
            [
                "longitude",
                "lon",
                "x",
            ],
        )

        if latitude_name is None or longitude_name is None:
            return {
                "status": "unavailable",
                "message": (
                    "PFZ dataset does not contain identifiable "
                    "latitude/longitude coordinates."
                ),
            }

        variable_name = _find_variable(
            dataset,
            [
                "pfz_suitability",
                "pfz_suitability_score",
                "suitability",
                "fishing_suitability",
                "fish_suitability",
                "chlorophyll",
                "chlor_a",
                "chl",
            ],
        )

        if variable_name is None:
            return {
                "status": "unavailable",
                "message": (
                    "No recognised PFZ/suitability variable was found "
                    "in the dataset."
                ),
            }

        value = _extract_nearest_value(
            dataset,
            variable_name,
            latitude_name,
            longitude_name,
            latitude,
            longitude,
        )

        if value is None or not math.isfinite(value):
            return {
                "status": "unavailable",
                "message": (
                    "The PFZ dataset contains no usable value near "
                    "the selected coordinate."
                ),
            }

        return {
            "status": "available",
            "latitude": latitude,
            "longitude": longitude,
            "value": value,
            "variable": variable_name,
            "dataset": path.name,
            "source": "PFZ satellite dataset",
        }

    finally:
        try:
            dataset.close()
        except Exception:
            pass


def get_pfz_data(
    latitude: float,
    longitude: float,
) -> dict:
    """
    Return PFZ information from a real local satellite/PFZ dataset.

    If no dataset exists, this function explicitly reports unavailable.
    It never fabricates PFZ suitability.
    """

    lat = _to_float(latitude)
    lon = _to_float(longitude)

    if lat is None or lon is None:
        return {
            "status": "unavailable",
            "suitability": None,
            "message": "Invalid latitude or longitude.",
            "source": "PFZ satellite dataset",
        }

    if not (-90 <= lat <= 90):
        return {
            "status": "unavailable",
            "suitability": None,
            "message": "Latitude is outside the valid range.",
            "source": "PFZ satellite dataset",
        }

    if not (-180 <= lon <= 180):
        return {
            "status": "unavailable",
            "suitability": None,
            "message": "Longitude is outside the valid range.",
            "source": "PFZ satellite dataset",
        }

    netcdf_files = _find_netcdf_files()

    if not netcdf_files:
        return {
            "status": "unavailable",
            "suitability": None,
            "latitude": lat,
            "longitude": lon,
            "message": (
                "No PFZ NetCDF dataset is currently available. "
                "ORCA will not invent PFZ information."
            ),
            "source": "PFZ satellite dataset",
        }

    for dataset_path in netcdf_files:
        result = _read_netcdf(
            dataset_path,
            lat,
            lon,
        )

        if not result:
            continue

        if result.get("status") == "available":
            raw_value = result.get("value")

            return {
                "status": "available",
                "latitude": lat,
                "longitude": lon,
                "suitability": raw_value,
                "raw_value": raw_value,
                "variable": result.get("variable"),
                "dataset": result.get("dataset"),
                "source": "PFZ satellite dataset",
                "message": (
                    "PFZ information was read from the available "
                    "satellite/PFZ dataset."
                ),
            }

    return {
        "status": "unavailable",
        "suitability": None,
        "latitude": lat,
        "longitude": lon,
        "message": (
            "A PFZ dataset exists, but no usable PFZ value could be "
            "read near the selected coordinate."
        ),
        "source": "PFZ satellite dataset",
    }


def get_pfz_status(
    latitude: float,
    longitude: float,
) -> dict:
    """
    Lightweight PFZ status wrapper for the Evidence/Agent UI.
    """

    data = get_pfz_data(
        latitude,
        longitude,
    )

    if data.get("status") != "available":
        return {
            "status": "unavailable",
            "available": False,
            "source": data.get(
                "source",
                "PFZ satellite dataset",
            ),
            "message": data.get(
                "message",
                "PFZ information is unavailable.",
            ),
        }

    return {
        "status": "available",
        "available": True,
        "source": data.get(
            "source",
            "PFZ satellite dataset",
        ),
        "suitability": data.get("suitability"),
        "dataset": data.get("dataset"),
        "variable": data.get("variable"),
        "message": data.get(
            "message",
            "PFZ information is available.",
        ),
    }