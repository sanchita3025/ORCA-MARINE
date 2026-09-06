from __future__ import annotations

from datetime import datetime, timedelta, timezone
import math
import re
from typing import Any

import requests

INCOIS_PFZ_PAGE = "https://www.incois.gov.in/MarineFisheries/TextDataHome?mfid=1&request_locale=en"
INCOIS_PFZ_WEBGIS = "https://incois.gov.in/geoportal/MFASPFZ/index.html"
INCOIS_PFZ_MAP = "https://www.incois.gov.in/MarineFisheries/images/MFS/MFS_English.jpg"
BHUVAN_WMS = "https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms"

# NOAA CoastWatch ERDDAP. These are live remote-sensing products, not generated/demo data.
NOAA_ERDDAP = "https://coastwatch.noaa.gov/erddap/griddap"
NOAA_SST_DATASET = "noaacwLEOACSPOSSTL3SnrtCDaily"
NOAA_SST_VARIABLE = "sea_surface_temperature"
NOAA_CHL_DATASET = "noaacwNPPVIIRSchlaSectorYYDaily"
NOAA_CHL_VARIABLE = "chlor_a"

REQUEST_TIMEOUT = 20
SATELLITE_LOOKBACK_DAYS = 7
SATELLITE_MAX_AGE_DAYS = 5


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _iso_z(value: datetime) -> str:
    return value.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _clean_html(html: str) -> str:
    clean = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", clean).strip()


def _request_json(url: str) -> Any:
    response = requests.get(
        url,
        timeout=REQUEST_TIMEOUT,
        headers={"User-Agent": "ORCA-Marine-Ecosystem/1.0"},
    )
    response.raise_for_status()
    return response.json()


def _table_rows(payload: Any) -> list[dict[str, Any]]:
    """Convert ERDDAP JSON table output into ordinary row dictionaries."""
    if not isinstance(payload, dict):
        return []
    names = payload.get("table", {}).get("columnNames")
    rows = payload.get("table", {}).get("rows")
    if not isinstance(names, list) or not isinstance(rows, list):
        return []
    return [dict(zip(names, row)) for row in rows if isinstance(row, list)]


def _finite_number(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def _nearest_valid_row(rows: list[dict[str, Any]], latitude: float, longitude: float, variable: str) -> dict[str, Any] | None:
    candidates: list[tuple[float, dict[str, Any]]] = []
    for row in rows:
        value = _finite_number(row.get(variable))
        lat = _finite_number(row.get("latitude"))
        lon = _finite_number(row.get("longitude"))
        if value is None or lat is None or lon is None:
            continue
        distance = (lat - latitude) ** 2 + (lon - longitude) ** 2
        candidates.append((distance, row))
    if not candidates:
        return None
    return min(candidates, key=lambda item: item[0])[1]


def _satellite_point(
    dataset: str,
    variable: str,
    latitude: float,
    longitude: float,
    *,
    value_transform=None,
    unit: str,
    source_name: str,
    has_altitude: bool = False,
) -> dict[str, Any]:
    """Fetch the newest valid satellite observation in a small area around the point.

    The function never fabricates a value. If ERDDAP has no recent valid observation,
    the result is explicitly unavailable/stale.
    """
    now = _utc_now()
    start = now - timedelta(days=SATELLITE_LOOKBACK_DAYS)
    # Small bounding box keeps the response light while allowing ERDDAP to snap to its grid.
    lat0, lat1 = max(-90.0, latitude - 0.15), min(90.0, latitude + 0.15)
    lon0, lon1 = max(-180.0, longitude - 0.15), min(180.0, longitude + 0.15)

    altitude_part = "[(0.0)]" if has_altitude else ""
    query = (
        f"{variable}"
        f"[({_iso_z(start)}):({_iso_z(now)})]"
        f"{altitude_part}"
        f"[({lat0:.5f}):({lat1:.5f})]"
        f"[({lon0:.5f}):({lon1:.5f})]"
    )
    url = f"{NOAA_ERDDAP}/{dataset}.json?{query}"

    try:
        payload = _request_json(url)
        rows = _table_rows(payload)
    except (requests.RequestException, ValueError) as exc:
        return {
            "status": "unavailable",
            "available": False,
            "source": source_name,
            "dataset": dataset,
            "variable": variable,
            "latitude": latitude,
            "longitude": longitude,
            "unit": unit,
            "error": f"NOAA satellite request failed: {exc}",
            "source_url": f"{NOAA_ERDDAP}/{dataset}.html",
        }

    # ERDDAP may return multiple grid points and multiple times. Choose the newest
    # observation first, then the closest valid spatial cell.
    parsed: list[tuple[datetime, dict[str, Any]]] = []
    for row in rows:
        raw_time = row.get("time")
        try:
            observation_time = datetime.fromisoformat(str(raw_time).replace("Z", "+00:00"))
            if observation_time.tzinfo is None:
                observation_time = observation_time.replace(tzinfo=timezone.utc)
        except (TypeError, ValueError):
            continue
        if _finite_number(row.get(variable)) is not None:
            parsed.append((observation_time.astimezone(timezone.utc), row))

    if not parsed:
        return {
            "status": "unavailable",
            "available": False,
            "source": source_name,
            "dataset": dataset,
            "variable": variable,
            "latitude": latitude,
            "longitude": longitude,
            "unit": unit,
            "message": "No valid satellite observation was returned for this location in the recent satellite window.",
            "source_url": f"{NOAA_ERDDAP}/{dataset}.html",
        }

    newest_time = max(item[0] for item in parsed)
    newest_rows = [row for when, row in parsed if when == newest_time]
    row = _nearest_valid_row(newest_rows, latitude, longitude, variable)
    if row is None:
        return {
            "status": "unavailable",
            "available": False,
            "source": source_name,
            "dataset": dataset,
            "variable": variable,
            "latitude": latitude,
            "longitude": longitude,
            "unit": unit,
            "message": "Satellite data exists for the recent period, but no valid pixel covers this location.",
            "source_url": f"{NOAA_ERDDAP}/{dataset}.html",
        }

    value = _finite_number(row.get(variable))
    observed_lat = _finite_number(row.get("latitude"))
    observed_lon = _finite_number(row.get("longitude"))
    if value_transform:
        value = value_transform(value)

    age_days = (now - newest_time).total_seconds() / 86400.0
    status = "available" if age_days <= SATELLITE_MAX_AGE_DAYS else "stale"

    return {
        "status": status,
        "available": status == "available",
        "source": source_name,
        "dataset": dataset,
        "variable": variable,
        "value": round(value, 4) if value is not None else None,
        "unit": unit,
        "latitude": observed_lat,
        "longitude": observed_lon,
        "requested_latitude": latitude,
        "requested_longitude": longitude,
        "observation_time": _iso_z(newest_time),
        "age_days": round(age_days, 2),
        "source_url": f"{NOAA_ERDDAP}/{dataset}.html",
        "message": (
            "Recent satellite observation retrieved from NOAA CoastWatch ERDDAP."
            if status == "available"
            else "The latest satellite observation is older than ORCA's freshness limit and is not used as a current observation."
        ),
    }


def get_live_satellite(latitude: float, longitude: float) -> dict[str, Any]:
    """Retrieve real satellite SST and chlorophyll for the requested marine point."""
    sst = _satellite_point(
        NOAA_SST_DATASET,
        NOAA_SST_VARIABLE,
        latitude,
        longitude,
        unit="°C",
        source_name="NOAA CoastWatch ACSPO VIIRS satellite SST",
    )
    chlorophyll = _satellite_point(
        NOAA_CHL_DATASET,
        NOAA_CHL_VARIABLE,
        latitude,
        longitude,
        unit="mg/m³",
        source_name="NOAA CoastWatch VIIRS satellite chlorophyll-a",
        has_altitude=True,
    )

    values_available = sst.get("available") or chlorophyll.get("available")
    return {
        "status": "available" if values_available else "unavailable",
        "available": bool(values_available),
        "source": "NOAA CoastWatch satellite observations",
        "sst": sst,
        "chlorophyll": chlorophyll,
        "message": (
            "Real satellite observations were retrieved where recent valid pixels were available."
            if values_available
            else "No recent valid satellite pixel was available for this location. ORCA does not substitute model or demo values for missing satellite observations."
        ),
    }


def _extract_pfz_coordinates(raw_html: str) -> list[dict[str, Any]]:
    """Best-effort extraction of authoritative PFZ coordinates embedded in INCOIS HTML/JS."""
    points: list[dict[str, Any]] = []
    seen: set[tuple[float, float]] = set()
    pair_patterns = [
        re.compile(r"(?:latitude|lat)\s*[=:]\s*[\"']?(-?\d+(?:\.\d+)?)[\"']?\s*[,;]\s*(?:longitude|lng|lon)\s*[=:]\s*[\"']?(-?\d+(?:\.\d+)?)[\"']?", re.I),
        re.compile(r"(?:longitude|lng|lon)\s*[=:]\s*[\"']?(-?\d+(?:\.\d+)?)[\"']?\s*[,;]\s*(?:latitude|lat)\s*[=:]\s*[\"']?(-?\d+(?:\.\d+)?)[\"']?", re.I),
        re.compile(r"(?:lat(?:itude)?)[\"']?\s*:\s*(-?\d+(?:\.\d+)?).*?(?:lon(?:gitude)?|lng)[\"']?\s*:\s*(-?\d+(?:\.\d+)?)", re.I | re.S),
    ]
    for idx, pattern in enumerate(pair_patterns):
        for match in pattern.finditer(raw_html):
            a, b = float(match.group(1)), float(match.group(2))
            lat, lon = (b, a) if idx == 1 else (a, b)
            if -90 <= lat <= 90 and -180 <= lon <= 180:
                key = (round(lat, 6), round(lon, 6))
                if key not in seen:
                    seen.add(key); points.append({"latitude": lat, "longitude": lon})
    geo_pattern = re.compile(r"\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]")
    for match in geo_pattern.finditer(raw_html):
        lon, lat = float(match.group(1)), float(match.group(2))
        if 6 <= lon <= 100 and 0 <= lat <= 30:
            key = (round(lat, 6), round(lon, 6))
            if key not in seen:
                seen.add(key); points.append({"latitude": lat, "longitude": lon})
    return points


def get_live_pfz(latitude: float, longitude: float) -> dict[str, Any]:
    """Retrieve current official INCOIS PFZ advisory and extract embedded coordinates when exposed."""
    try:
        response = requests.get(INCOIS_PFZ_PAGE, timeout=REQUEST_TIMEOUT, headers={"User-Agent": "ORCA-Marine-Ecosystem/1.0"})
        response.raise_for_status(); html = response.text
    except requests.RequestException as exc:
        return {"status": "unavailable", "available": False, "latitude": latitude, "longitude": longitude, "source": "INCOIS PFZ Advisory", "source_url": INCOIS_PFZ_PAGE, "webgis_url": "https://incois.gov.in/MarineFisheries/PfzWebGis", "message": f"Live INCOIS PFZ advisory is unavailable: {exc}"}
    clean = _clean_html(html)
    dates = re.findall(r"\b\d{1,2}\s+[A-Z]{3}\s+\d{4}\b", clean.upper())
    forecast_date = dates[0] if dates else None; valid_upto = dates[1] if len(dates) > 1 else None
    coordinates = _extract_pfz_coordinates(html)
    nearby = []
    for point in coordinates:
        d2 = (point["latitude"] - latitude) ** 2 + (point["longitude"] - longitude) ** 2
        point = {**point, "distance_degrees": round(math.sqrt(d2), 5)}
        if d2 <= 25.0: nearby.append(point)
    selected = sorted(nearby or coordinates, key=lambda p: p.get("distance_degrees", 999999))[:50]
    return {
        "status": "available", "available": True, "latitude": latitude, "longitude": longitude,
        "source": "INCOIS PFZ Advisory", "source_url": INCOIS_PFZ_PAGE, "webgis_url": "https://incois.gov.in/MarineFisheries/PfzWebGis",
        "overview_map_url": INCOIS_PFZ_MAP, "forecast_date": forecast_date, "valid_upto": valid_upto,
        "pfz_coordinate_available": bool(selected), "pfz_points": selected,
        "coordinate_source": "INCOIS PFZ advisory page / embedded WebGIS data", "sst_layer": True, "chlorophyll_layer": True,
        "message": f"Official INCOIS PFZ advisory retrieved. {len(selected)} coordinate(s) were extracted from the published advisory data." if selected else "Official INCOIS PFZ advisory retrieved, but no machine-readable PFZ coordinate was exposed in the fetched page. ORCA does not fabricate a zone.",
        "retrieved_at": _iso_z(_utc_now()),
    }


def get_live_gis(latitude: float, longitude: float, marine: bool) -> dict[str, Any]:
    """Provide live Indian GIS-service provenance without fake restriction polygons."""
    return {
        "status": "available" if marine else "partial",
        "available": bool(marine),
        "source": "ISRO Bhuvan OGC services + ORCA spatial analysis",
        "bhuvan_wms": BHUVAN_WMS,
        "latitude": latitude,
        "longitude": longitude,
        "marine_point": marine,
        "restriction_layer_connected": False,
        "restricted": None,
        "details": (
            "Marine spatial context is checked using the selected coordinate and live marine data. "
            "ISRO Bhuvan OGC services are the Indian geospatial service provenance used by ORCA. "
            "No government restriction-zone result is claimed until an authoritative restriction layer is actually connected."
        ),
    }
