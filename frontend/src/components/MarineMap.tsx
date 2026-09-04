import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import {
  useEffect,
} from "react";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

type MarineMapProps = {
  latitude: number;
  longitude: number;
  locationName?: string;
};

const userIcon =
  new L.Icon({
    iconUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize: [
      25,
      41,
    ],

    iconAnchor: [
      12,
      41,
    ],

    popupAnchor: [
      1,
      -34,
    ],
  });

/*
=========================================================
MAP POSITION UPDATER
=========================================================
*/

function MapUpdater({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map =
    useMap();

  useEffect(() => {
    map.flyTo(
      [
        latitude,
        longitude,
      ],
      9,
      {
        duration: 1.2,
      }
    );
  }, [
    latitude,
    longitude,
    map,
  ]);

  return null;
}

/*
=========================================================
MARINE MAP
=========================================================
*/

function MarineMap({
  latitude,
  longitude,
  locationName =
    "Selected marine location",
}: MarineMapProps) {

  const position:
    [number, number] = [
      latitude,
      longitude,
    ];

  return (
    <div className="map-wrapper">

      <div className="map-overlay-title">
        📍 {locationName}
      </div>

      <MapContainer
        center={position}
        zoom={9}
        scrollWheelZoom={true}
        style={{
          height: "480px",
          width: "100%",
        }}
      >

        <MapUpdater
          latitude={latitude}
          longitude={longitude}
        />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={position}
          icon={userIcon}
        >

          <Popup>

            <strong>
              📍 {locationName}
            </strong>

            <br />

            Selected assessment location

            <br />

            <span>
              {latitude.toFixed(4)},{" "}
              {longitude.toFixed(4)}
            </span>

          </Popup>

        </Marker>

      </MapContainer>

    </div>
  );
}

export default MarineMap;