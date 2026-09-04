# ORCA Integrated – Marine Intelligence + GIS

This package combines the current ORCA FastAPI backend with Member 3's React/Leaflet GIS frontend.

## Structure

```text
orca-integrated/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── services/
│   │   ├── weather_service.py
│   │   ├── ocean_service.py
│   │   ├── marine_service.py
│   │   ├── location_service.py
│   │   ├── reasoning_service.py
│   │   ├── decision_service.py
│   │   └── pfz_service.py
│   └── data/
│       ├── fallback_data.json
│       └── satellite/
│           └── current_pfz_suitability_2026-07-31.nc  # add your existing file
└── frontend/
    ├── src/
    ├── package.json
    └── ...
```

## Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The backend exposes the existing marine endpoints plus `/pfz`, `/pfz/hotspots`, `/pfz/nearest`, `/gis-data`, and `/orca-analysis`.

**Satellite file:** the current `pfz_service.py` expects `data/satellite/current_pfz_suitability_2026-07-31.nc`. The binary NetCDF file was not present in the uploaded ZIP, so place your existing satellite file at that exact path before using backend PFZ endpoints.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

The GIS frontend now calls the ORCA `/gis-data` endpoint for selected coordinates and displays:
- selected/GPS location
- dynamic marine risk zone
- nearest PFZ route
- PFZ suitability
- restricted-zone status
- Member 3's static PFZ/restricted GeoJSON layers
