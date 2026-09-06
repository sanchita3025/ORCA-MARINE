import { useEffect, useState } from "react";
import { Circle, CircleMarker, MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type RoutePoint = {
  latitude: number;
  longitude: number;
  risk_score?: number | null;
  risk_level?: string;
  hazards?: string[];
};

type RouteOption = {
  name: string;
  recommendation: string;
  max_risk: number | null;
  risk_level: string;
  points: RoutePoint[];
  fuel_feasible?: boolean;
  hazards?: string[];
};

type MarineMapProps = {
  latitude: number;
  longitude: number;
  locationName?: string;
  risk?: number | null;
  isMarine?: boolean;
  rangeKm?: number | null;
  pfz?: { latitude: number; longitude: number; label?: string } | null;
  restricted?: boolean;
  origin?: { latitude: number; longitude: number; name?: string } | null;
  routes?: RouteOption[];
  preferredRoute?: string | null;
};

const selectedIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const boatIcon = L.divIcon({
  className: "orca-boat-marker",
  html: '<span aria-hidden="true">🚤</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
});

function MapUpdater({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([latitude, longitude], 9, { duration: 0.8 });
  }, [latitude, longitude, map]);
  return null;
}

function riskLabel(risk: number | null | undefined) {
  if (risk == null || !Number.isFinite(risk)) return "Risk unavailable";
  if (risk <= 30) return `Low · ${risk}/100`;
  if (risk <= 50) return `Moderate · ${risk}/100`;
  if (risk <= 70) return `High · ${risk}/100`;
  return `Severe · ${risk}/100`;
}

function routeRisk(point: RoutePoint | undefined) {
  const value = point?.risk_score;
  if (value == null || !Number.isFinite(Number(value))) return "unavailable";
  if (Number(value) <= 25) return "low";
  if (Number(value) <= 50) return "moderate";
  if (Number(value) <= 70) return "high";
  return "severe";
}

function routeColor(point: RoutePoint | undefined) {
  const risk = routeRisk(point);
  if (risk === "low") return "#28d39f";
  if (risk === "moderate") return "#e4c75a";
  if (risk === "high") return "#f49a55";
  if (risk === "severe") return "#f06470";
  return "#7b9099";
}

function MapControls({ onToggleLegend, legendOpen }: { onToggleLegend: () => void; legendOpen: boolean }) {
  const map = useMap();
  const [full, setFull] = useState(false);
  const zoomIn = () => map.zoomIn();
  const zoomOut = () => map.zoomOut();
  const locate = () => map.setZoom(Math.max(map.getZoom(), 9));
  const toggleFullscreen = async () => {
    const shell = map.getContainer().closest(".marine-map-shell") as HTMLElement | null;
    if (!shell) return;
    try {
      if (!document.fullscreenElement) { await shell.requestFullscreen(); setFull(true); }
      else { await document.exitFullscreen(); setFull(false); }
    } catch { setFull(false); }
  };
  return <div className="map-control-stack">
    <button type="button" aria-label="Zoom in" title="Zoom in" onClick={zoomIn}>+</button>
    <button type="button" aria-label="Zoom out" title="Zoom out" onClick={zoomOut}>−</button>
    <button type="button" aria-label="Recenter map" title="Recenter" onClick={locate}>⌾</button>
    <button type="button" aria-label={legendOpen ? "Hide map legend" : "Show map legend"} title={legendOpen ? "Hide legend" : "Show legend"} onClick={onToggleLegend}>☰</button>
    <button type="button" aria-label={full ? "Exit full screen" : "View map full screen"} title={full ? "Exit full screen" : "View map full screen"} onClick={toggleFullscreen}>⛶</button>
  </div>;
}

export default function MarineMap({
  latitude,
  longitude,
  locationName = "Selected marine location",
  risk = null,
  isMarine = true,
  rangeKm = null,
  pfz = null,
  restricted = false,
  origin = null,
  routes = [],
  preferredRoute = null,
}: MarineMapProps) {
  const position: [number, number] = [latitude, longitude];
  const hasRange = rangeKm != null && Number.isFinite(rangeKm) && rangeKm > 0;
  const hasPfz = !!pfz && Number.isFinite(pfz.latitude) && Number.isFinite(pfz.longitude);
  const hasOrigin = !!origin && Number.isFinite(origin.latitude) && Number.isFinite(origin.longitude);
  const [legendOpen, setLegendOpen] = useState(true);

  return (
    <div className="marine-map-shell">
      <div className="map-overlay-title">
        <div><span className="map-kicker">LIVE ROUTE + MARINE RISK</span><b>🎯 {locationName}</b></div>
        <span className={`map-live-pill ${isMarine ? "good" : "warn"}`}>{isMarine ? "MARINE POINT" : "CHECK LOCATION"}</span>
      </div>

      <MapContainer center={position} zoom={9} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <MapUpdater latitude={latitude} longitude={longitude} />
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapControls legendOpen={legendOpen} onToggleLegend={() => setLegendOpen(v => !v)} />

        {routes.map((route) => {
          const points = route.points || [];
          return points.slice(0, -1).map((point, index) => {
            const next = points[index + 1];
            if (!next) return null;
            const positions: [number, number][] = [[point.latitude, point.longitude], [next.latitude, next.longitude]];
            const active = preferredRoute === route.name;
            return (
              <Polyline
                key={`${route.name}-${index}`}
                positions={positions}
                pathOptions={{ color: routeColor(point), weight: active ? 6 : 3.5, opacity: active ? 0.95 : 0.65, dashArray: route.recommendation === "OUT_OF_RANGE" ? "8 8" : undefined }}
              >
                <Popup>
                  <strong>{route.name}</strong><br />
                  Segment risk: {point.risk_score != null ? `${point.risk_score}/100` : "unavailable"}<br />
                  {point.risk_level || "Data unavailable"}<br />
                  {point.hazards?.length ? `Hazards: ${point.hazards.join(", ")}` : "No detected hazard in returned weather/ocean fields."}
                </Popup>
              </Polyline>
            );
          });
        })}

        {hasRange && (
          <Circle center={position} radius={rangeKm! * 1000} pathOptions={{ weight: 1.5, fillOpacity: 0.06 }}>
            <Popup>Estimated one-way vessel range: {rangeKm!.toFixed(1)} km. This is a fuel/speed estimate, not a navigation range assessment.</Popup>
          </Circle>
        )}

        {hasOrigin && (
          <Marker position={[origin!.latitude, origin!.longitude]} icon={boatIcon}>
            <Popup><strong>🚤 Departure</strong><br />{origin!.name || "Vessel departure point"}<br />{origin!.latitude.toFixed(4)}, {origin!.longitude.toFixed(4)}</Popup>
          </Marker>
        )}

        <Marker position={position} icon={selectedIcon}>
          <Popup>
            <strong>🎯 {locationName}</strong><br />
            Assessment / target point<br />
            {latitude.toFixed(4)}, {longitude.toFixed(4)}<br />
            {riskLabel(risk)}
          </Popup>
        </Marker>

        <CircleMarker center={position} radius={8} pathOptions={{ weight: 2, fillOpacity: 0.18 }} />

        {hasPfz && (
          <>
            <Circle center={[pfz!.latitude, pfz!.longitude]} radius={1800} pathOptions={{ color: "#a66cff", weight: 3, fillColor: "#a66cff", fillOpacity: 0.10, dashArray: "8 7" }}>
              <Popup><strong>🟣 Potential Fishing Zone signal</strong><br />{pfz!.label || "PFZ observation returned by ORCA"}<br />Purple boundary marks the reported PFZ signal; it is not a fish-count or guaranteed catch zone.</Popup>
            </Circle>
            <CircleMarker center={[pfz!.latitude, pfz!.longitude]} radius={9} pathOptions={{ color: "#a66cff", weight: 3, fillColor: "#a66cff", fillOpacity: 0.45 }}>
              <Popup><strong>🟣 PFZ observation</strong><br />{pfz!.label || "PFZ location returned by ORCA"}<br />{pfz!.latitude.toFixed(4)}, {pfz!.longitude.toFixed(4)}</Popup>
            </CircleMarker>
          </>
        )}
      </MapContainer>

      <div className={`map-legend-card ${legendOpen ? "open" : "collapsed"}`}>
        <button type="button" className="map-legend-toggle" onClick={() => setLegendOpen(v => !v)}>{legendOpen ? "‹ Hide map legend" : "› Show map legend"}</button>
        {legendOpen && <div className="map-legend-content">
        <div><span className="legend-dot selected" /> <b>Target / assessment</b></div>
        {hasOrigin && <div><span className="legend-dot departure" /> <b>🚤 Departure</b></div>}
        <div><span className="legend-dot pfz" /> <b>Purple = PFZ / fishing opportunity signal</b></div>
        {!hasPfz && <div className="map-restricted pfz-unavailable">PFZ coordinate unavailable from the live advisory — no zone is fabricated.</div>}
        {routes.length > 0 && <>
          <div><span className="legend-line route-low" /> <b>Low-risk corridor</b></div>
          <div><span className="legend-line route-moderate" /> <b>Moderate-risk corridor</b></div>
          <div><span className="legend-line route-high" /> <b>High-risk corridor</b></div>
          <div><span className="legend-line route-severe" /> <b>Severe-risk corridor</b></div>
          <div><span className="legend-line route-unavailable" /> <b>Live risk unavailable</b></div>
        </>}
        {hasRange && <div><span className="legend-line" /> <b>Estimated vessel range</b></div>}
        <div><span className="legend-risk">{risk != null ? risk : "—"}</span> <b>Target risk / 100</b></div>
        {preferredRoute && <div className="map-preferred">✓ Preferred: {preferredRoute}</div>}
        {restricted && <div className="map-restricted">⚠ Restricted-zone hit reported by connected GIS data</div>}
        </div>}
      </div>
    </div>
  );
}
