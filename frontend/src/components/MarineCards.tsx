type MarineCardsProps = {
  weather: {
    temperature: number;
    wind_speed: number;
    precipitation: number;
  };
  ocean: {
    wave_height: number;
    wave_period: number;
    current_speed: number;
    sst: number;
  };
  satellite: {
    pfz_available: boolean;
    pfz: string;
  };
  gis: {
    restricted_zone: boolean;
    location_name: string;
  };
};

function MarineCards({ weather, ocean, satellite, gis }: MarineCardsProps) {
  return (
    <div className="marine-cards">

      <div className="marine-card">
        <div className="marine-card-icon">🌦️</div>
        <div>
          <p>Weather</p>
          <h3>{weather.temperature}°C</h3>
          <span>
            Wind {weather.wind_speed} km/h · Rain {weather.precipitation}%
          </span>
        </div>
      </div>

      <div className="marine-card">
        <div className="marine-card-icon">🌊</div>
        <div>
          <p>Ocean</p>
          <h3>{ocean.wave_height} m</h3>
          <span>
            Wave period {ocean.wave_period}s · Current {ocean.current_speed} m/s
          </span>
        </div>
      </div>

      <div className="marine-card">
        <div className="marine-card-icon">🛰️</div>
        <div>
          <p>Satellite / PFZ</p>
          <h3>{satellite.pfz}</h3>
          <span>
            {satellite.pfz_available
              ? "PFZ advisory available"
              : "PFZ unavailable"}
          </span>
        </div>
      </div>

      <div className="marine-card">
        <div className="marine-card-icon">🗺️</div>
        <div>
          <p>GIS</p>
          <h3>{gis.restricted_zone ? "RESTRICTED" : "SAFE"}</h3>
          <span>{gis.location_name}</span>
        </div>
      </div>

    </div>
  );
}

export default MarineCards;