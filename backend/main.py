# backend/main.py

from __future__ import annotations

from datetime import datetime
import math
from pathlib import Path
from typing import Any

import requests

try:
    from global_land_mask import globe
except Exception:
    globe = None

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from services.coastal_service import (
    build_coastal_context,
    build_spatial_summary,
)
from services.decision_service import (
    build_decision,
    build_unavailable_decision,
)
from services.location_service import (
    get_location,
    search_location,
)
from services.marine_service import (
    get_marine_data,
    normalize_risk_score,
)
from services.ocean_service import (
    get_ocean_data,
    get_ocean_outlook,
)
from services.pfz_service import (
    get_pfz_data,
)
from services.reasoning_service import (
    build_human_summary,
    build_reasoning,
    get_source_summary,
)
from services.weather_service import (
    get_weather_data,
    get_weather_outlook,
)
from services.live_sources import (
    get_live_pfz,
    get_live_gis,
    get_live_satellite,
)


app = FastAPI(
    title="ORCA Marine Ecosystem API",
    version="1.0.0",
    description=(
        "Marine ecosystem decision-support backend using live weather "
        "and ocean data where available."
    ),
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


BASE_DIR = Path(__file__).resolve().parent


def _parse_datetime(
    value: Any,
) -> datetime | None:
    if isinstance(value, datetime):
        return value

    if not value:
        return None

    text = str(value).strip()

    try:
        return datetime.fromisoformat(
            text.replace("Z", "+00:00")
        )
    except ValueError:
        pass

    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(
                text,
                fmt,
            )
        except ValueError:
            continue

    return None


def _default_datetime() -> datetime:
    return datetime.now()


def _requested_datetime(
    date: str | None,
    time: str | None,
    timestamp: str | None,
) -> datetime:
    if timestamp:
        parsed = _parse_datetime(timestamp)

        if parsed is not None:
            return parsed

    if date and time:
        parsed = _parse_datetime(
            f"{date} {time}"
        )

        if parsed is not None:
            return parsed

    if date:
        parsed = _parse_datetime(date)

        if parsed is not None:
            return parsed

    return _default_datetime()


def _interpret_query(question: str) -> dict[str, Any]:
    """Route arbitrary natural-language questions to an explicit ORCA intent.

    This is an intent router only. It never invents observations and never
    calculates the numerical risk score.
    """
    text = str(question or "").strip().lower()

    rules = [
        ("PFZ_SEARCH", ("nearest pfz", "pfz", "potential fishing zone", "fishing zone", "where should i fish", "where to fish"), "PFZ / fishing-area intelligence"),
        ("BEST_TIME", ("best time", "safest time", "when should i", "when can i", "what time", "better time", "good time"), "best available time window"),
        ("FISHING_SEASON", ("season", "seasonal", "months", "month is best", "which month"), "historical fishing season / seasonality"),
        ("FISHING_DECISION", ("can i go fishing", "go fishing", "should i fish", "is it safe to fish", "fishing trip", "fishing decision"), "fishing decision"),
        ("VESSEL_RANGE", ("can my boat", "can my vessel", "reach and return", "reach that area", "fuel", "range", "endurance", "return safely"), "vessel range / trip feasibility"),
        ("ROUTE", ("route", "path", "waypoint", "corridor", "travel to", "get there", "journey"), "route / operating conditions"),
        ("SATELLITE", ("satellite", "sst", "sea surface temperature", "chlorophyll", "remote sensing", "satellite image"), "satellite / environmental observation"),
        ("ENVIRONMENT", ("environment", "ecosystem", "marine life", "ocean health", "biological productivity", "anomaly", "change in ocean"), "environmental change / ocean health"),
        ("WEATHER", ("weather", "wind", "rain", "storm", "lightning", "cyclone", "temperature"), "weather conditions"),
        ("ALERTS", ("alert", "warning", "watch", "hazard"), "official alerts / warnings"),
        ("MARINE_CONDITIONS", ("marine conditions", "sea conditions", "ocean conditions", "wave", "swell", "current", "sea state", "how is the sea"), "marine conditions"),
        ("RESTRICTIONS", ("restricted", "restriction", "no fishing", "closed area", "protected area", "zone"), "GIS / restriction context"),
    ]

    for intent, keywords, label in rules:
        if any(k in text for k in keywords):
            return {
                "intent": intent,
                "intents": [intent.lower()],
                "requested_information": [label],
                "method": "transparent intent routing; numerical risk remains deterministic",
            }

    return {
        "intent": "GENERAL",
        "intents": ["general"],
        "requested_information": ["the information requested in the question"],
        "method": "transparent intent routing; numerical risk remains deterministic",
    }


def _num(value: Any) -> float | None:
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def _direct_question_answer(
    *,
    intent: str,
    weather: dict,
    ocean: dict,
    satellite: dict,
    decision: dict,
    pfz: dict,
    requested_datetime: datetime,
    vessel: dict | None,
    best_window: dict | None = None,
) -> dict[str, Any]:
    """Return a question-first answer. Evidence follows this answer in the UI."""
    risk_level = str(decision.get("risk_level", "UNAVAILABLE"))
    recommendation = str(decision.get("recommendation", "INSUFFICIENT_DATA"))
    wind = _num(weather.get("wind_speed"))
    wave = _num(ocean.get("wave_height"))
    current = _num(ocean.get("current_speed"))
    sst = _num(ocean.get("sst"))
    sat_obs = satellite.get("satellite_observations") or {}
    sat_sst = (sat_obs.get("sst") or {}).get("value")
    chl = (sat_obs.get("chlorophyll") or {}).get("value")
    dt_label = requested_datetime.strftime("%d %b %Y, %I:%M %p")

    if intent == "FISHING_DECISION":
        answer = recommendation.replace("_", " ").upper()
        summary = f"At the selected time ({dt_label}), ORCA's deterministic marine assessment is {risk_level}."
        return {"direct_answer": answer, "answer_summary": summary, "priority": ["decision", "risk", "weather", "ocean", "pfz"]}

    if intent == "MARINE_CONDITIONS":
        answer = f"{risk_level.upper()} MARINE CONDITIONS"
        summary = "Live sea-state evidence is shown below; unavailable values are not estimated."
        return {"direct_answer": answer, "answer_summary": summary, "priority": ["ocean", "weather", "satellite", "risk"]}

    if intent == "BEST_TIME":
        if best_window and best_window.get("start") and best_window.get("end"):
            answer = f"{best_window['start']}–{best_window['end']}"
            summary = "Best available operating window from the selected day's hourly live forecast."
        else:
            answer = "NO RELIABLE WINDOW"
            summary = "A reliable hourly best-time window could not be calculated from the available live data."
        return {"direct_answer": answer, "answer_summary": summary, "priority": ["best_time", "ocean", "weather"]}

    if intent == "FISHING_SEASON":
        return {
            "direct_answer": "HISTORICAL SEASONAL DATA REQUIRED",
            "answer_summary": "ORCA will not invent a fishing season from SST or chlorophyll. Use the connected CMFRI historical series when a species/zone series is available.",
            "priority": ["historical", "pfz", "satellite"],
        }

    if intent == "PFZ_SEARCH":
        coord_available = bool(pfz.get("pfz_coordinate_available"))
        if coord_available:
            answer = "PFZ AVAILABLE"
            summary = "An authoritative PFZ coordinate/geometry is available from the connected INCOIS source."
        else:
            answer = "PFZ COORDINATE NOT EXPOSED"
            summary = "INCOIS publishes the operational PFZ WebGIS, but the current machine-readable connector has not returned a coordinate, so ORCA will not invent a fishing point."
        return {
            "direct_answer": answer,
            "answer_summary": summary,
            "priority": ["pfz", "fishing_areas", "satellite", "historical"],
        }

    if intent == "VESSEL_RANGE":
        if vessel:
            fuel = _num(vessel.get("currentFuel"))
            reserve = _num(vessel.get("reserve")) or 0
            consumption = _num(vessel.get("consumption"))
            speed = _num(vessel.get("speed"))
            if fuel is not None and consumption and speed:
                usable = fuel * max(0.0, 1 - reserve / 100)
                endurance = usable / consumption
                one_way = endurance * speed / 2
                answer = f"ESTIMATED ONE-WAY RANGE: {one_way:.1f} KM"
                summary = "This is a planning estimate based on the entered vessel profile, reserve and fuel consumption—not a certified vessel assessment."
                return {"direct_answer": answer, "answer_summary": summary, "priority": ["vessel", "route", "weather", "ocean"]}
        return {"direct_answer": "VESSEL PROFILE INCOMPLETE", "answer_summary": "Enter fuel, consumption and cruising-speed information before ORCA can estimate round-trip feasibility.", "priority": ["vessel", "route"]}

    if intent == "ROUTE":
        return {"direct_answer": recommendation.replace("_", " ").upper(), "answer_summary": "Route feasibility is evaluated separately from the general marine answer and should be treated as planning guidance, not certified navigation.", "priority": ["route", "vessel", "weather", "ocean"]}

    if intent == "SATELLITE":
        if sat_sst is not None or chl is not None:
            pieces = []
            if sat_sst is not None: pieces.append(f"SST {sat_sst}°C")
            if chl is not None: pieces.append(f"chlorophyll {chl}")
            answer = " · ".join(pieces)
        else:
            answer = "SATELLITE OBSERVATION UNAVAILABLE"
        return {"direct_answer": answer, "answer_summary": "Satellite observations are displayed with provenance and observation time when available.", "priority": ["satellite", "environment"]}

    if intent == "ENVIRONMENT":
        answer = "ENVIRONMENTAL OBSERVATION"
        summary = "ORCA emphasizes SST, chlorophyll, currents and available satellite evidence; it does not infer fish abundance from one indicator."
        return {"direct_answer": answer, "answer_summary": summary, "priority": ["satellite", "environment", "ocean"]}

    if intent == "WEATHER":
        answer = f"{weather.get('condition') or 'WEATHER CONDITIONS'}"
        summary = f"Wind {wind:.1f} km/h." if wind is not None else "Live wind/weather data is limited."
        return {"direct_answer": answer, "answer_summary": summary, "priority": ["weather", "alerts"]}

    if intent == "ALERTS":
        return {"direct_answer": "CHECK OFFICIAL ALERT SOURCES", "answer_summary": "ORCA separates official alerts from model-derived marine risk and never turns page availability into a fake warning.", "priority": ["alerts", "weather", "ocean"]}

    if intent == "RESTRICTIONS":
        return {"direct_answer": "RESTRICTION STATUS", "answer_summary": "ORCA only claims a restriction when an authoritative machine-readable layer is connected.", "priority": ["gis", "alerts"]}

    return {"direct_answer": recommendation.replace("_", " ").upper(), "answer_summary": "ORCA matched the question to the available marine evidence and deterministic risk assessment.", "priority": ["decision", "weather", "ocean", "satellite", "gis"]}


def _marine_location_check(
    latitude: float,
    longitude: float,
) -> dict:
    """
    Conservative marine-location context.

    The backend does not fabricate marine observations. This context only
    records whether the coordinate falls within the broad configured coastal
    area and whether live ocean data can actually be obtained.
    """

    coastal = build_coastal_context(
        latitude,
        longitude,
    )

    return {
        **coastal,
        "is_marine": None,
    }


def _make_agent_status(
    name: str,
    source: str,
    data: dict | None,
) -> dict:
    data = data or {}

    status = str(
        data.get("status", "unavailable")
    ).lower()

    available = status in {
        "available",
        "success",
        "ok",
        "live",
    }

    return {
        "agent": name,
        "source": source,
        "status": (
            "AVAILABLE"
            if available
            else "UNAVAILABLE"
        ),
        "available": available,
    }


@app.get("/")
def root():
    return {
        "name": "ORCA Marine Ecosystem API",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ORCA backend",
    }


@app.get("/weather")
def weather(
    latitude: float = Query(...),
    longitude: float = Query(...),
    date: str | None = Query(None),
    time: str | None = Query(None),
    timestamp: str | None = Query(None),
):
    requested_datetime = _requested_datetime(
        date,
        time,
        timestamp,
    )

    return get_weather_data(
        latitude=latitude,
        longitude=longitude,
        requested_datetime=requested_datetime,
    )


@app.get("/ocean")
def ocean(
    latitude: float = Query(...),
    longitude: float = Query(...),
    date: str | None = Query(None),
    time: str | None = Query(None),
    timestamp: str | None = Query(None),
):
    requested_datetime = _requested_datetime(
        date,
        time,
        timestamp,
    )

    return get_ocean_data(
        latitude=latitude,
        longitude=longitude,
        requested_datetime=requested_datetime,
    )


@app.get("/outlook")
def outlook(
    latitude: float = Query(...),
    longitude: float = Query(...),
    date: str = Query(...),
    start_hour: int = Query(6),
    end_hour: int = Query(18),
):
    weather_data = get_weather_outlook(
        latitude=latitude,
        longitude=longitude,
        date=date,
        start_hour=start_hour,
        end_hour=end_hour,
    )

    ocean_data = get_ocean_outlook(
        latitude=latitude,
        longitude=longitude,
        date=date,
        start_hour=start_hour,
        end_hour=end_hour,
    )

    weather_rows = {
        row.get("timestamp"): row
        for row in weather_data.get("rows", [])
    }

    ocean_rows = {
        row.get("timestamp"): row
        for row in ocean_data.get("rows", [])
    }

    timestamps = sorted(
        set(weather_rows.keys())
        | set(ocean_rows.keys())
    )

    rows = []

    for timestamp in timestamps:
        weather_row = weather_rows.get(
            timestamp,
            {},
        )
        ocean_row = ocean_rows.get(
            timestamp,
            {},
        )

        wind = weather_row.get(
            "wind_speed"
        )
        wave = ocean_row.get(
            "wave_height"
        )
        rain = weather_row.get(
            "precipitation"
        )
        current = ocean_row.get(
            "current_speed"
        )
        sst = ocean_row.get("sst")

        score = 0

        try:
            if wind is not None:
                wind = float(wind)

                if wind > 25:
                    score += 40
                elif wind > 15:
                    score += 20
        except (TypeError, ValueError):
            pass

        try:
            if wave is not None:
                wave = float(wave)

                if wave > 2.5:
                    score += 40
                elif wave > 1.5:
                    score += 20
        except (TypeError, ValueError):
            pass

        try:
            if rain is not None:
                rain = float(rain)

                if rain > 8:
                    score += 20
                elif rain > 2:
                    score += 10
        except (TypeError, ValueError):
            pass

        try:
            if current is not None:
                current = float(current)

                if current > 2:
                    score += 20
                elif current > 1:
                    score += 10
        except (TypeError, ValueError):
            pass

        score = min(
            100,
            score,
        )

        if score <= 25:
            status = "BETTER"
        elif score <= 50:
            status = "CAUTION"
        else:
            status = "AVOID"

        parsed_timestamp = _parse_datetime(
            timestamp
        )

        rows.append(
            {
                "timestamp": timestamp,
                "hour": (
                    parsed_timestamp.hour
                    if parsed_timestamp
                    else None
                ),
                "wind_speed": wind,
                "wave_height": wave,
                "precipitation": rain,
                "current_speed": current,
                "sst": sst,
                "score": score,
                "status": status,
                "weather": weather_row,
                "ocean": ocean_row,
            }
        )

    best_window = None
    avoid_window = None

    if rows:
        better_rows = [
            row
            for row in rows
            if row["status"] == "BETTER"
        ]

        avoid_rows = [
            row
            for row in rows
            if row["status"] == "AVOID"
        ]

        if better_rows:
            best_window = {
                "start": better_rows[0]["timestamp"],
                "end": better_rows[-1]["timestamp"],
                "status": "BETTER",
            }

        if avoid_rows:
            avoid_window = {
                "start": avoid_rows[0]["timestamp"],
                "end": avoid_rows[-1]["timestamp"],
                "status": "AVOID",
            }

    return {
        "status": (
            "available"
            if rows
            else "unavailable"
        ),
        "latitude": latitude,
        "longitude": longitude,
        "date": date,
        "start_hour": start_hour,
        "end_hour": end_hour,
        "rows": rows,
        "best_window": best_window,
        "avoid_window": avoid_window,
        "weather_status": weather_data.get(
            "status",
            "unavailable",
        ),
        "ocean_status": ocean_data.get(
            "status",
            "unavailable",
        ),
        "sources": [
            "Open-Meteo Weather",
            "Open-Meteo Marine",
        ],
    }




def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * radius * math.asin(min(1.0, math.sqrt(a)))


def _water_point(latitude: float, longitude: float, *, allow_endpoint: bool = False) -> bool:
    """Return whether a point is ocean/water using the global land mask when installed."""
    if globe is None:
        return True
    try:
        return not bool(globe.is_land(float(latitude), float(longitude)))
    except Exception:
        return True


def _water_safe_route_points(origin_lat: float, origin_lon: float, target_lat: float, target_lon: float, corridor: str, count: int) -> tuple[list[dict[str, float]], bool]:
    """Build a route whose intermediate points avoid land when global-land-mask is available."""
    if globe is None:
        return _route_points_basic(origin_lat, origin_lon, target_lat, target_lon, corridor, count), False
    # Small grid A* around the direct corridor. Start may be on land (harbour/current location),
    # but all intermediate nodes are required to be water; target is allowed as the endpoint.
    import heapq
    pad = 1.2
    min_lat, max_lat = min(origin_lat, target_lat)-pad, max(origin_lat, target_lat)+pad
    min_lon, max_lon = min(origin_lon, target_lon)-pad, max(origin_lon, target_lon)+pad
    step = 0.05
    rows = max(10, min(90, int((max_lat-min_lat)/step)+1))
    cols = max(10, min(90, int((max_lon-min_lon)/step)+1))
    start = (round((origin_lat-min_lat)/step), round((origin_lon-min_lon)/step))
    goal = (round((target_lat-min_lat)/step), round((target_lon-min_lon)/step))
    side = 1 if corridor == 'north' else -1 if corridor == 'south' else 0
    def coord(node): return (min_lat + node[0]*step, min_lon + node[1]*step)
    def heuristic(a,b):
        la,lo=coord(a); lb,ob=coord(b); return _haversine_km(la,lo,lb,ob)
    def neighbors(n):
        r,c=n
        for dr in (-1,0,1):
            for dc in (-1,0,1):
                if not dr and not dc: continue
                rr,cc=r+dr,c+dc
                if 0<=rr<rows and 0<=cc<cols: yield (rr,cc)
    openq=[(heuristic(start,goal),0,start)]
    came={}; gscore={start:0.0}; seen=set()
    while openq and len(seen)<rows*cols:
        _,cost,current=heapq.heappop(openq)
        if current in seen: continue
        seen.add(current)
        if current == goal:
            path=[]
            while current in came:
                path.append(current); current=came[current]
            path.append(start); path.reverse()
            coords=[{'latitude':coord(n)[0],'longitude':coord(n)[1]} for n in path]
            if len(coords)>=2:
                # Apply a mild corridor preference without forcing land crossings.
                if side:
                    mid_lat=(origin_lat+target_lat)/2
                    coords.sort(key=lambda q: abs(q['latitude']-mid_lat) - side*0.0001)
                    # restore spatial order is intentionally skipped; A* path already has route order.
                    # Use path as generated.
                return _resample_route(coords,count), True
            break
        for nxt in neighbors(current):
            lat,lon=coord(nxt)
            if nxt not in (start,goal) and not _water_point(lat,lon):
                continue
            step_cost=_haversine_km(*coord(current),lat,lon)
            tentative=cost+step_cost
            if tentative < gscore.get(nxt,float('inf')):
                came[nxt]=current; gscore[nxt]=tentative
                heapq.heappush(openq,(tentative+heuristic(nxt,goal),tentative,nxt))
    return _route_points_basic(origin_lat, origin_lon, target_lat, target_lon, corridor, count), False


def _resample_route(points: list[dict[str,float]], count:int) -> list[dict[str,float]]:
    if len(points) <= count: return points
    out=[]
    for i in range(count):
        idx=round(i*(len(points)-1)/(count-1))
        out.append(points[idx])
    return out


def _route_points_basic(origin_lat: float, origin_lon: float, target_lat: float, target_lon: float, corridor: str = 'direct', count: int = 9) -> list[dict[str, float]]:
    count = max(5, min(15, count))
    waypoint = None
    if corridor != 'direct':
        dlat = target_lat - origin_lat; dlon = target_lon - origin_lon
        length = max(math.hypot(dlat, dlon), 0.001); side = 1.0 if corridor == 'north' else -1.0; offset = 0.18 * side
        waypoint = ((origin_lat + target_lat) / 2 - (dlon / length) * offset, (origin_lon + target_lon) / 2 + (dlat / length) * offset)
    anchors = [(origin_lat, origin_lon)] + ([waypoint] if waypoint else []) + [(target_lat, target_lon)]
    segments=len(anchors)-1; per_segment=max(2, math.ceil((count-1)/segments)); points=[]
    for seg in range(segments):
        a_lat,a_lon=anchors[seg]; b_lat,b_lon=anchors[seg+1]
        for i in range(per_segment):
            if seg>0 and i==0: continue
            t=i/per_segment; points.append({'latitude':a_lat+(b_lat-a_lat)*t,'longitude':a_lon+(b_lon-a_lon)*t})
    points.append({'latitude':target_lat,'longitude':target_lon}); return points


def _route_points(origin_lat: float, origin_lon: float, target_lat: float, target_lon: float, corridor: str = 'direct', count: int = 9) -> list[dict[str, float]]:
    points, _ = _water_safe_route_points(origin_lat, origin_lon, target_lat, target_lon, corridor, count)
    return points

def _open_meteo_multi_point(points: list[dict[str, float]], date: str, hour: int) -> list[dict[str, Any]]:
    if not points:
        return []
    lats = ','.join(f"{p['latitude']:.5f}" for p in points)
    lons = ','.join(f"{p['longitude']:.5f}" for p in points)
    weather_resp = requests.get('https://api.open-meteo.com/v1/forecast', params={
        'latitude': lats, 'longitude': lons,
        'hourly': 'wind_speed_10m,precipitation,weather_code',
        'forecast_days': 16, 'timezone': 'auto',
    }, timeout=20)
    weather_resp.raise_for_status()
    wp = weather_resp.json()
    weather_locations = wp if isinstance(wp, list) else [wp]
    marine_resp = requests.get('https://marine-api.open-meteo.com/v1/marine', params={
        'latitude': lats, 'longitude': lons,
        'hourly': 'wave_height,wave_period,ocean_current_velocity,sea_surface_temperature',
        'forecast_days': 16, 'timezone': 'auto',
    }, timeout=20)
    marine_resp.raise_for_status()
    mp = marine_resp.json()
    marine_locations = mp if isinstance(mp, list) else [mp]

    def at_hour(payload: dict[str, Any]) -> dict[str, Any]:
        hourly = payload.get('hourly') or {}
        times = hourly.get('time') or []
        wanted = f'{date}T{hour:02d}:00'
        idx = next((i for i, t in enumerate(times) if str(t) == wanted), None)
        if idx is None:
            idx = next((i for i, t in enumerate(times) if str(t).endswith(f'T{hour:02d}:00')), None)
        if idx is None:
            return {}
        return {k: (v[idx] if isinstance(v, list) and idx < len(v) else None) for k, v in hourly.items()}

    merged = []
    for i, point in enumerate(points):
        w = at_hour(weather_locations[min(i, len(weather_locations)-1)]) if weather_locations else {}
        o = at_hour(marine_locations[min(i, len(marine_locations)-1)]) if marine_locations else {}
        wind, wave, rain, current = w.get('wind_speed_10m'), o.get('wave_height'), w.get('precipitation'), o.get('ocean_current_velocity')
        score = 0
        factors = []
        for name, value, thresholds, maximum in [('Wind', wind, (15, 25), 40), ('Wave height', wave, (1.5, 2.5), 40), ('Rain', rain, (2, 8), 20), ('Ocean current', current, (1, 2), 20)]:
            try:
                number = float(value)
                contribution = maximum if number > thresholds[1] else maximum / 2 if number > thresholds[0] else 0
                score += contribution
                factors.append({'name': name, 'value': round(number, 2), 'contribution': int(contribution)})
            except (TypeError, ValueError):
                pass
        risk = min(100, int(round(score))) if factors else None
        level = 'LOW' if risk is not None and risk <= 25 else 'MODERATE' if risk is not None and risk <= 50 else 'HIGH' if risk is not None and risk <= 70 else 'SEVERE' if risk is not None else 'UNAVAILABLE'
        hazards = []
        try:
            if w.get('weather_code') is not None and int(float(w.get('weather_code'))) >= 95:
                hazards.append('THUNDERSTORM')
        except (TypeError, ValueError):
            pass
        try:
            if wave is not None and float(wave) > 2.5:
                hazards.append('HIGH_WAVES')
        except (TypeError, ValueError):
            pass
        merged.append({'latitude': point['latitude'], 'longitude': point['longitude'], 'wind_speed': wind, 'wave_height': wave, 'wave_period': o.get('wave_period'), 'current_speed': current, 'sst': o.get('sea_surface_temperature'), 'precipitation': rain, 'weather_code': w.get('weather_code'), 'risk_score': risk, 'risk_level': level, 'risk_factors': factors, 'hazards': hazards})
    return merged


def _route_summary(name: str, points: list[dict[str, float]], conditions: list[dict[str, Any]], speed_kmh: float, consumption_lph: float, usable_fuel_l: float) -> dict[str, Any]:
    distance = sum(_haversine_km(points[i]['latitude'], points[i]['longitude'], points[i+1]['latitude'], points[i+1]['longitude']) for i in range(len(points)-1))
    travel_hours = distance / speed_kmh if speed_kmh > 0 else None
    fuel_needed = travel_hours * consumption_lph if travel_hours is not None else None
    round_trip_hours = travel_hours * 2 if travel_hours is not None else None
    round_trip_fuel = fuel_needed * 2 if fuel_needed is not None else None
    # A fishing trip normally needs enough fuel to return, so route feasibility
    # is checked against the round-trip requirement, not just the outbound leg.
    fuel_ok = round_trip_fuel is not None and round_trip_fuel <= usable_fuel_l
    risks = [c['risk_score'] for c in conditions if c.get('risk_score') is not None]
    max_risk = max(risks) if risks else None
    avg_risk = round(sum(risks)/len(risks)) if risks else None
    risk_level = 'LOW' if max_risk is not None and max_risk <= 25 else 'MODERATE' if max_risk is not None and max_risk <= 50 else 'HIGH' if max_risk is not None and max_risk <= 70 else 'SEVERE' if max_risk is not None else 'UNAVAILABLE'
    hazards = sorted({h for c in conditions for h in c.get('hazards', [])})
    recommendation = 'OUT_OF_RANGE' if not fuel_ok else 'LIVE_ROUTE_DATA_UNAVAILABLE' if max_risk is None else 'PREFERRED' if max_risk <= 25 else 'CAUTION' if max_risk <= 50 else 'AVOID'
    return {'name': name, 'distance_km': round(distance,2), 'travel_time_hours': round(travel_hours,2) if travel_hours is not None else None, 'round_trip_time_hours': round(round_trip_hours,2) if round_trip_hours is not None else None, 'fuel_needed_l': round(fuel_needed,2) if fuel_needed is not None else None, 'round_trip_fuel_needed_l': round(round_trip_fuel,2) if round_trip_fuel is not None else None, 'usable_fuel_l': round(usable_fuel_l,2), 'fuel_feasible': fuel_ok, 'max_risk': max_risk, 'average_risk': avg_risk, 'risk_level': risk_level, 'recommendation': recommendation, 'hazards': hazards, 'points': conditions}


@app.get('/route-analysis')
def route_analysis(origin_latitude: float = Query(...), origin_longitude: float = Query(...), target_latitude: float = Query(...), target_longitude: float = Query(...), date: str = Query(...), time: str = Query(...), cruising_speed: float = Query(...), consumption_lph: float = Query(...), usable_fuel_l: float = Query(...)):
    try:
        hour = max(0, min(23, int(str(time).split(':')[0])))
        speed, consumption, usable_fuel = float(cruising_speed), float(consumption_lph), max(0.0, float(usable_fuel_l))
        if speed <= 0 or consumption <= 0:
            return {'status':'unavailable','message':'Cruising speed and fuel consumption must be positive.','routes':[]}
        routes = []
        water_routing = globe is not None
        for corridor, label in [('direct','Direct water-safe corridor'),('north','North water-safe alternate'),('south','South water-safe alternate')]:
            points = _route_points(origin_latitude, origin_longitude, target_latitude, target_longitude, corridor)
            conditions = _open_meteo_multi_point(points, date, hour)
            summary = _route_summary(label, points, conditions, speed, consumption, usable_fuel)
            summary['water_safe_routing'] = water_routing
            routes.append(summary)
        feasible = [r for r in routes if r['fuel_feasible'] and r['max_risk'] is not None]
        preferred = min(feasible, key=lambda r:(r['max_risk'], r['distance_km']), default=None)
        return {'status':'available','source':'Open-Meteo Weather + Open-Meteo Marine','requested_datetime':f'{date}T{hour:02d}:00','origin':{'latitude':origin_latitude,'longitude':origin_longitude},'target':{'latitude':target_latitude,'longitude':target_longitude},'vessel':{'cruising_speed_kmh':speed,'consumption_lph':consumption,'usable_fuel_l':usable_fuel},'routes':routes,'preferred_route':preferred['name'] if preferred else None,'message':('ORCA compared water-safe planning corridors using live forecast conditions and the supplied vessel fuel/time profile. Intermediate route points are checked against a global land mask when installed. This remains decision support, not certified navigation. If the land-mask package is unavailable, ORCA explicitly reports that limitation.'),'agents':['Route Agent','Weather Agent','Ocean Agent','Deterministic Risk Engine'],'water_safe_routing':globe is not None,'unavailable_hazards':[]}
    except Exception as exc:
        return {'status':'unavailable','message':f'Live route analysis could not be completed: {exc}','routes':[]}


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def _what_if_risk(weather_row: dict, ocean_row: dict) -> tuple[int | None, list[dict]]:
    factors: list[dict] = []
    def add(name: str, value: Any, unit: str, contribution: float):
        if value is not None:
            factors.append({"name": name, "value": round(float(value), 2), "unit": unit, "contribution": round(float(contribution), 1)})
    def num(row, key):
        try:
            return float(row.get(key)) if row.get(key) is not None else None
        except (TypeError, ValueError):
            return None
    wind, wave, rain, current = (num(weather_row, "wind_speed"), num(ocean_row, "wave_height"), num(weather_row, "precipitation"), num(ocean_row, "current_speed"))
    parts = []
    if wind is not None: parts.append(("Wind", wind, "km/h", _clamp01((wind - 10) / 25) * 35))
    if wave is not None: parts.append(("Wave height", wave, "m", _clamp01((wave - 0.5) / 3) * 35))
    if rain is not None: parts.append(("Rain", rain, "mm", _clamp01(rain / 15) * 15))
    if current is not None: parts.append(("Ocean current", current, "m/s", _clamp01(current / 2.5) * 15))
    if not parts: return None, []
    total = round(min(100, sum(p[3] for p in parts)))
    for p in parts: add(*p)
    return total, factors


@app.get("/what-if")
def what_if(latitude: float = Query(...), longitude: float = Query(...), date: str = Query(...), time: str = Query(...)):
    try: hour = int(str(time).split(":")[0])
    except (TypeError, ValueError): hour = 0
    w = get_weather_outlook(latitude=latitude, longitude=longitude, date=date, start_hour=hour, end_hour=hour)
    o = get_ocean_outlook(latitude=latitude, longitude=longitude, date=date, start_hour=hour, end_hour=hour)
    wr = (w.get("rows") or [{}])[0]
    orow = (o.get("rows") or [{}])[0]
    score, factors = _what_if_risk(wr, orow)
    if score is None:
        return {"status":"unavailable","available":False,"requested_datetime":f"{date}T{hour:02d}:00","risk_score":None,"risk_level":"UNAVAILABLE","recommendation":"No recommendation available.","weather":wr,"ocean":orow,"factors":[],"source":{"weather":"Open-Meteo Weather","ocean":"Open-Meteo Marine"},"message":"No valid live weather or marine values were available for the selected hour. ORCA did not invent a risk value."}
    if score <= 25: level, rec = "LOW", "Conditions appear relatively favorable for the selected hour based on the available live marine data."
    elif score <= 50: level, rec = "MODERATE", "Conditions require caution for the selected hour. Review the live wind, wave, rain and current values before departure."
    elif score <= 75: level, rec = "HIGH", "Conditions show elevated marine stress for the selected hour. Consider delaying departure and review the evidence."
    else: level, rec = "SEVERE", "Conditions show severe marine stress for the selected hour. Seek official warnings before departure."
    return {"status":"available","available":True,"requested_datetime":f"{date}T{hour:02d}:00","risk_score":score,"risk_level":level,"recommendation":rec,"weather":{**wr,"source":wr.get("source","Open-Meteo Weather")},"ocean":{**orow,"current_speed":orow.get("current_speed"),"ocean_current_velocity":orow.get("current_speed"),"sst":orow.get("sst"),"sea_surface_temperature":orow.get("sst"),"source":orow.get("source","Open-Meteo Marine")},"factors":factors,"source":{"weather":"Open-Meteo Weather","ocean":"Open-Meteo Marine"},"message":"Risk is a deterministic ORCA model estimate calculated from the exact selected-hour live forecast values. It is not an official safety clearance."}



@app.get("/official-alerts")
def official_alerts(latitude: float | None = Query(None), longitude: float | None = Query(None)):
    """Read official Indian marine/disaster alert pages without inventing an alert."""
    sources=[]
    # INCOIS tsunami status
    try:
        r=requests.get("https://tsunami.incois.gov.in/",timeout=12,headers={"User-Agent":"ORCA-Marine-Ecosystem/1.0"})
        text=r.text
        no_tsunami="No Tsunami" in text
        sources.append({"name":"INCOIS Tsunami Early Warning System","status":"clear" if no_tsunami else "review","alert":None if no_tsunami else "ACTIVE_OR_REVIEW","source_url":"https://tsunami.incois.gov.in/","details":"Official INCOIS national tsunami status page."})
    except requests.RequestException as exc:
        sources.append({"name":"INCOIS Tsunami Early Warning System","status":"unavailable","alert":None,"source_url":"https://tsunami.incois.gov.in/","details":str(exc)})
    # INCOIS high-wave and cyclone/storm-surge portals are official live sources.
    for name,url in [("INCOIS High Wave / Swell Surge","https://incois.gov.in/site/services/hwa.jsp"),("INCOIS Cyclone / Storm Surge","https://www.incois.gov.in/")]:
        try:
            rr=requests.get(url,timeout=12,headers={"User-Agent":"ORCA-Marine-Ecosystem/1.0"})
            sources.append({"name":name,"status":"source_reachable" if rr.ok else "unavailable","alert":None,"source_url":url,"details":"Official alert portal linked. ORCA does not infer an active warning from page reachability alone."})
        except requests.RequestException as exc:
            sources.append({"name":name,"status":"unavailable","alert":None,"source_url":url,"details":str(exc)})
    try:
        rr=requests.get("https://mausam.imd.gov.in/responsive/cyclone_bulletin_archive.php",timeout=12,headers={"User-Agent":"ORCA-Marine-Ecosystem/1.0"})
        sources.append({"name":"IMD All India Cyclone Bulletin","status":"source_reachable" if rr.ok else "unavailable","alert":None,"source_url":"https://mausam.imd.gov.in/responsive/cyclone_bulletin_archive.php","details":"Official IMD cyclone bulletin archive. Current warning interpretation requires the bulletin text."})
    except requests.RequestException as exc:
        sources.append({"name":"IMD All India Cyclone Bulletin","status":"unavailable","alert":None,"source_url":"https://mausam.imd.gov.in/responsive/cyclone_bulletin_archive.php","details":str(exc)})
    return {"status":"available" if sources else "unavailable","latitude":latitude,"longitude":longitude,"sources":sources,"message":"Official alert sources are connected as evidence feeds. ORCA never converts a page-access success into a fake warning."}


@app.get("/historical-fishing")
def historical_fishing(latitude: float = Query(...), longitude: float = Query(...)):
    """Expose authoritative fisheries-history provenance and current state baseline sources."""
    return {
        "status":"available",
        "available":True,
        "location":{"latitude":latitude,"longitude":longitude},
        "source":"CMFRI National Marine Fisheries Data Centre / marine landings statistics",
        "source_url":"https://www.cmfri.org.in/index.php/fish-catch-estimates",
        "historical_period":"CMFRI publishes long-run marine landing estimates and quarter/month-based fishing-zone records.",
        "seasonality":"Historical seasonal intelligence is derived only from published fisheries landing/catch series; ORCA does not infer fish abundance from SST/chlorophyll alone.",
        "message":"Historical fisheries data source is connected. Species/zone-level numeric seasonality should be read from the published CMFRI series rather than fabricated in ORCA."
    }


@app.get("/fishing-intelligence")
def fishing_intelligence(latitude: float = Query(...), longitude: float = Query(...), date: str = Query(...)):
    """Combine official PFZ provenance, real satellite observations, live hourly marine stress, and fisheries-history provenance."""
    live_pfz = get_live_pfz(latitude, longitude)
    sat = get_live_satellite(latitude, longitude)
    try:
        outlook_data = globals()["outlook"](latitude=latitude, longitude=longitude, date=date, start_hour=0, end_hour=23)
    except Exception as exc:
        outlook_data = {"rows": [], "status": "unavailable", "message": f"Hourly marine outlook unavailable: {exc}"}
    rows=[]
    for row in outlook_data.get('rows', []):
        rows.append({'hour':row.get('hour'),'wind_speed':row.get('wind_speed'),'wave_height':row.get('wave_height'),'current_speed':row.get('current_speed'),'score':row.get('score'),'status':row.get('status')})
    valid=[r for r in rows if r.get('score') is not None]
    best=min(valid,key=lambda r:r['score']) if valid else None
    historical=historical_fishing(latitude,longitude)
    return {
        'status':'available' if (sat.get('available') or live_pfz.get('available') or rows) else 'unavailable',
        'available':bool(sat.get('available') or live_pfz.get('available') or rows),
        'signal':'INCOIS operational PFZ advisory + environmental conditions' if live_pfz.get('available') else 'Environmental conditions only; PFZ coordinate not exposed by the current public machine-readable advisory page',
        'explanation':'PFZ is an official fish-aggregation proxy. SST/chlorophyll and hourly sea-state are supporting environmental evidence, not a fish-count model.',
        'current':{'sst':(sat.get('sst') or {}).get('value'),'chlorophyll':(sat.get('chlorophyll') or {}).get('value'),'pfz_available':bool(live_pfz.get('available')),'pfz_coordinate_available':bool(live_pfz.get('pfz_coordinate_available')),'observation_time':(sat.get('sst') or {}).get('observation_time') or (sat.get('chlorophyll') or {}).get('observation_time')},
        'hourly':rows,
        'seasonal':{'status':historical.get('status'),'message':historical.get('message'),'source':historical.get('source'),'source_url':historical.get('source_url')},
        'pfz_source':live_pfz,
        'source':'INCOIS PFZ + NOAA CoastWatch satellite + Open-Meteo Marine + CMFRI historical fisheries source',
        'best_hour':best,
    }
@app.get("/location/search")
def location_search(
    q: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=10),
):
    results = search_location(
        q,
        limit=limit,
    )

    return {
        "status": (
            "available"
            if results
            else "unavailable"
        ),
        "query": q,
        "results": results,
    }


@app.get("/location")
def location(
    q: str = Query(..., min_length=1),
):
    result = get_location(q)

    if result is None:
        return {
            "status": "unavailable",
            "query": q,
            "location": None,
        }

    return {
        "status": "available",
        "query": q,
        "location": result,
    }


@app.get("/watcher")
def watcher(
    latitude: float | None = Query(None),
    longitude: float | None = Query(None),
    date: str | None = Query(None),
    time: str | None = Query(None),
):
    if latitude is None or longitude is None:
        return {
            "status": "unavailable",
            "watcher": "NO_DATA",
            "message": (
                "Select a location before monitoring "
                "marine conditions."
            ),
            "sources": [],
        }

    requested_datetime = _requested_datetime(
        date,
        time,
        None,
    )

    weather_data = get_weather_data(
        latitude=latitude,
        longitude=longitude,
        requested_datetime=requested_datetime,
    )

    ocean_data = get_ocean_data(
        latitude=latitude,
        longitude=longitude,
        requested_datetime=requested_datetime,
    )

    weather_available = (
        str(
            weather_data.get(
                "status",
                "",
            )
        ).lower()
        == "available"
    )

    ocean_available = (
        str(
            ocean_data.get(
                "status",
                "",
            )
        ).lower()
        == "available"
    )

    if not weather_available and not ocean_available:
        return {
            "status": "unavailable",
            "watcher": "NO_DATA",
            "message": (
                "Live weather and ocean data are unavailable "
                "for the selected location and time."
            ),
            "sources": [
                _make_agent_status(
                    "Weather Agent",
                    "Open-Meteo Weather",
                    weather_data,
                ),
                _make_agent_status(
                    "Ocean Agent",
                    "Open-Meteo Marine",
                    ocean_data,
                ),
            ],
        }

    decision = build_decision(
        weather=weather_data,
        ocean=ocean_data,
        role="watcher",
    )

    risk_score = decision.get(
        "risk_score"
    )

    if risk_score is None:
        watcher_status = "WATCH"
    elif risk_score > 70:
        watcher_status = "ALERT"
    elif risk_score > 50:
        watcher_status = "WATCH"
    else:
        watcher_status = "SAFE"

    return {
        "status": "available",
        "watcher": watcher_status,
        "risk_score": risk_score,
        "risk_level": decision.get(
            "risk_level",
            "UNAVAILABLE",
        ),
        "message": (
            "Live marine conditions are being assessed "
            "from the available data sources."
        ),
        "sources": [
            _make_agent_status(
                "Weather Agent",
                "Open-Meteo Weather",
                weather_data,
            ),
            _make_agent_status(
                "Ocean Agent",
                "Open-Meteo Marine",
                ocean_data,
            ),
        ],
    }


@app.get("/orca-analysis")
def orca_analysis_get(
    latitude: float = Query(...),
    longitude: float = Query(...),
    date: str | None = Query(None),
    time: str | None = Query(None),
    role: str = Query("fisherman"),
    verified: bool = Query(False),
):
    return _run_orca_analysis(
        latitude=latitude,
        longitude=longitude,
        date=date,
        time=time,
        role=role,
        verified=verified,
        question="",
        vessel=None,
    )


@app.post("/orca-analysis")
def orca_analysis_post(
    payload: dict[str, Any],
):
    latitude = payload.get(
        "latitude"
    )
    longitude = payload.get(
        "longitude"
    )

    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except (TypeError, ValueError):
        return build_unavailable_decision(
            "Valid latitude and longitude are required."
        )

    return _run_orca_analysis(
        latitude=latitude,
        longitude=longitude,
        date=payload.get("date"),
        time=payload.get("time"),
        timestamp=payload.get("timestamp"),
        role=str(
            payload.get(
                "stakeholder",
                payload.get("role", "fisherman"),
            )
        ),
        verified=bool(
            payload.get(
                "verified",
                False,
            )
        ),
        question=str(
            payload.get(
                "question",
                "",
            )
        ),
        vessel=payload.get(
            "vessel"
        ),
    )


def _run_orca_analysis(
    latitude: float,
    longitude: float,
    date: str | None = None,
    time: str | None = None,
    timestamp: str | None = None,
    role: str = "fisherman",
    verified: bool = False,
    question: str = "",
    vessel: dict | None = None,
) -> dict:
    requested_datetime = _requested_datetime(
        date,
        time,
        timestamp,
    )

    marine_context = _marine_location_check(
        latitude,
        longitude,
    )

    weather_data = get_weather_data(
        latitude=latitude,
        longitude=longitude,
        requested_datetime=requested_datetime,
    )

    ocean_data = get_ocean_data(
        latitude=latitude,
        longitude=longitude,
        requested_datetime=requested_datetime,
    )

    # If live ocean data is obtained, the coordinate is confirmed as
    # marine for the purpose of this analysis.
    if str(
        ocean_data.get(
            "status",
            "",
        )
    ).lower() == "available":
        marine_context["is_marine"] = True

    elif (
        marine_context.get(
            "is_coastal_area"
        )
        is False
    ):
        marine_context["is_marine"] = False

    else:
        marine_context["is_marine"] = None

    local_pfz = get_pfz_data(
        latitude,
        longitude,
    )
    live_pfz = get_live_pfz(
        latitude,
        longitude,
    )
    if live_pfz.get("status") == "available":
        pfz_data = live_pfz
        if local_pfz.get("status") == "available":
            pfz_data["local_dataset"] = local_pfz
    else:
        pfz_data = local_pfz

    spatial_data = build_spatial_summary(
        latitude,
        longitude,
        restricted_zones=None,
    )
    live_satellite = get_live_satellite(
        latitude,
        longitude,
    )

    # Attach real satellite observations to the live PFZ/satellite evidence.
    # No replacement values are generated when satellite pixels are missing.
    pfz_data = {
        **pfz_data,
        "satellite_observations": live_satellite,
    }

    live_gis = get_live_gis(
        latitude,
        longitude,
        marine_context.get("is_marine") is True,
    )

    gis_data = {
        **live_gis,
        "coastal": spatial_data.get("coastal"),
        "restricted_zone": spatial_data.get("restricted_zone"),
        "spatial_context": spatial_data,
    }

    decision = build_decision(
        weather=weather_data,
        ocean=ocean_data,
        satellite=pfz_data,
        gis=gis_data,
        marine_context=marine_context,
        role=role,
        verified=verified,
        vessel=vessel,
    )

    reasoning = build_reasoning(
        weather=weather_data,
        ocean=ocean_data,
        satellite=pfz_data,
        gis=gis_data,
        question=question,
        role=role,
    )

    query_understanding = _interpret_query(question)
    intent = query_understanding.get("intent", "GENERAL")

    best_window = None
    if intent == "BEST_TIME":
        try:
            ow = outlook(latitude=latitude, longitude=longitude, date=requested_datetime.date().isoformat(), start_hour=0, end_hour=23)
            rows = [r for r in ow.get("rows", []) if r.get("risk_score") is not None or r.get("score") is not None]
            if rows:
                best = min(rows, key=lambda r: float(r.get("risk_score", r.get("score", 999))))
                best_window = {"start": best.get("time", f"{best.get('hour', 0):02d}:00"), "end": None, "score": best.get("risk_score", best.get("score"))}
                if best_window["start"]:
                    try:
                        h = int(str(best_window["start"])[11:13])
                        best_window["end"] = f"{(h + 2) % 24:02d}:00"
                    except Exception:
                        best_window["end"] = None
        except Exception:
            best_window = None

    direct_answer = _direct_question_answer(
        intent=intent, weather=weather_data, ocean=ocean_data, satellite=pfz_data,
        decision=decision, pfz=pfz_data, requested_datetime=requested_datetime,
        vessel=vessel, best_window=best_window,
    )

    normalized_risk = decision.get(
        "risk_score"
    )

    if normalized_risk is None:
        normalized_risk = normalize_risk_score(
            decision.get(
                "raw_risk_score"
            )
        )

    return {
        "status": decision.get(
            "status",
            "unavailable",
        ),
        "question": question,
        "query_understanding": query_understanding,
        "question_answer": {**direct_answer, "intent": intent, "best_window": best_window},
        "role": role,
        "verified": verified,
        "location": {
            "name": "Selected marine location",
            "latitude": latitude,
            "longitude": longitude,
            "marine_context": marine_context,
        },
        "requested_datetime": requested_datetime.isoformat(),
        "marine_context": marine_context,
        "weather": weather_data,
        "ocean": ocean_data,
        "marine_conditions": {
            "weather": weather_data,
            "ocean": ocean_data,
            "risk_assessment": {
                "risk_score": normalized_risk,
                "risk_level": decision.get("risk_level", "UNAVAILABLE"),
                "risk_factors": decision.get("factors", []),
            },
            "data_quality": {
                "overall": "live" if weather_data.get("status") == "available" and ocean_data.get("status") == "available" else "partial"
            },
        },
        "satellite": pfz_data,
        "fishing_zone": pfz_data,
        "gis": gis_data,
        "restricted_zone": gis_data.get("restricted_zone") or {"restricted": None, "status": "DATA_UNAVAILABLE"},
        "satellite": pfz_data,
        "decision": {
            **decision,
            "risk_score": normalized_risk,
        },
        "final_decision": decision.get("recommendation", "INSUFFICIENT_DATA"),
        "recommendation": decision.get("recommendation", "No recommendation available."),
        "risk_score": normalized_risk,
        "risk_level": decision.get("risk_level", "UNAVAILABLE"),
        "reasoning": {
            **reasoning,
            "summary": build_human_summary(
                reasoning
            ),
        },
        "evidence": get_source_summary(
            reasoning
        ),
        "risk": {
            "score": normalized_risk,
            "max_score": 100,
            "level": decision.get("risk_level", "UNAVAILABLE"),
            "factors": decision.get("factors", []),
        },
        "orca_recommendation": {
            "decision": decision.get("recommendation", "INSUFFICIENT_DATA"),
            "recommendation": decision.get("recommendation", "No recommendation available."),
            "marine_risk": decision.get("risk_level", "UNAVAILABLE"),
            "marine_risk_score": normalized_risk,
        },
        "sources": {
            "weather": weather_data.get(
                "source",
                "Open-Meteo Weather",
            ),
            "ocean": ocean_data.get(
                "source",
                "Open-Meteo Marine",
            ),
            "satellite": pfz_data.get(
                "source",
                "INCOIS PFZ WebGIS",
            ),
            "gis": gis_data.get(
                "source",
                "ISRO Bhuvan OGC services",
            ),
        },
        "disclaimer": (
            "ORCA is a decision-support prototype. "
            "It is not an official maritime navigation, "
            "weather-warning, or safety system."
        ),
    }


@app.post("/api/orca/query")
def api_orca_query(
    payload: dict[str, Any],
):
    """
    Compatibility endpoint for the ORCA frontend/API contract.
    """

    return orca_analysis_post(
        payload
    )


@app.get("/api/orca/query")
def api_orca_query_get(
    latitude: float = Query(...),
    longitude: float = Query(...),
    date: str | None = Query(None),
    time: str | None = Query(None),
    role: str = Query("fisherman"),
    verified: bool = Query(False),
    question: str = Query(""),
):
    return _run_orca_analysis(
        latitude=latitude,
        longitude=longitude,
        date=date,
        time=time,
        role=role,
        verified=verified,
        question=question,
        vessel=None,
    )


@app.get("/pfz")
def pfz(
    latitude: float = Query(...),
    longitude: float = Query(...),
):
    return get_pfz_data(
        latitude,
        longitude,
    )


@app.get("/coastal")
def coastal(
    latitude: float = Query(...),
    longitude: float = Query(...),
):
    return build_coastal_context(
        latitude,
        longitude,
    )


@app.get("/spatial")
def spatial(
    latitude: float = Query(...),
    longitude: float = Query(...),
):
    return build_spatial_summary(
        latitude,
        longitude,
        restricted_zones=None,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )