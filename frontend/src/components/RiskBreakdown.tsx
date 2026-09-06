interface BreakdownData {
  wind?: number;
  waves?: number;
  wave?: number;
  weather?: number;
  ocean?: number;
  pfz?: number;
  gis?: number;
  period?: number;
}

interface RiskBreakdownProps {
  breakdown?: BreakdownData;
  data?: BreakdownData;
  weather?: any;
  ocean?: any;
  result?: any;
}

export default function RiskBreakdown({
  breakdown = {},
  data,
  weather = {},
  ocean = {},
  result,
}: RiskBreakdownProps) {
  const values = breakdown || data || {};

  const numeric = (value: any) =>
    Number.isFinite(Number(value)) ? Number(value) : null;

  const wind = numeric(weather.wind_speed);
  const wave = numeric(ocean.wave_height);
  const precipitation = numeric(weather.precipitation);
  const current = numeric(ocean.current_speed);
  const period = numeric(ocean.wave_period);
  const sst = numeric(ocean.sst);

  const items = [
    {
      label: "Wind",
      value: wind !== null ? `${wind} km/h` : "Unavailable",
      points: values.wind ?? 0,
      icon: "💨",
    },
    {
      label: "Waves",
      value: wave !== null ? `${wave} m` : "Unavailable",
      points: values.waves ?? values.wave ?? 0,
      icon: "🌊",
    },
    {
      label: "Precipitation",
      value: precipitation !== null ? `${precipitation} mm` : "Unavailable",
      points: values.weather ?? 0,
      icon: "🌦️",
    },
    {
      label: "Ocean Current",
      value: current !== null ? `${current} m/s` : "Unavailable",
      points: values.ocean ?? 0,
      icon: "🌊",
    },
    {
      label: "Wave Period",
      value: period !== null ? `${period} s` : "Unavailable",
      points: values.period ?? 0,
      icon: "〰️",
    },
    {
      label: "Sea Surface Temperature",
      value: sst !== null ? `${sst} °C` : "Unavailable",
      points: 0,
      icon: "🌡️",
    },
    {
      label: "PFZ",
      value: result?.fishing_zone?.nearest_pfz ? "Hotspot available" : "No nearby hotspot",
      points: values.pfz ?? 0,
      icon: "🛰️",
    },
    {
      label: "GIS",
      value: result?.restricted_zone?.restricted ? "Restricted zone" : "Clear",
      points: values.gis ?? 0,
      icon: "🗺️",
    },
  ];

  const backendScore = numeric(result?.risk_score ?? result?.risk_assessment?.risk_score ?? result?.marine_conditions?.risk_assessment?.risk_score);

  const contributors = items
    .filter((item) => item.points > 0)
    .sort((a, b) => b.points - a.points);

  const reasoning = contributors.length
    ? `${contributors[0].label} is the largest positive contributor to the deterministic risk score. The values shown above are the actual marine observations returned for this analysis.`
    : "The current measured conditions add no positive risk points under ORCA's deterministic thresholds. A 0-point risk score can therefore be a valid low-risk result, not missing data.";

  return (
    <section className="risk-breakdown">
      <div className="section-title">
        <span>💡</span>
        <div>
          <h2>WHY THIS RESULT?</h2>
          <p>Actual marine values and their deterministic risk contribution</p>{backendScore !== null && <strong className="risk-breakdown-total">ORCA risk: {backendScore}/12</strong>}
        </div>
      </div>

      <div className="breakdown-list">
        {items.map((item) => (
          <div className="breakdown-item" key={item.label}>
            <div className="breakdown-name">
              <span className="breakdown-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>

            <span className="breakdown-measured-value">
              {item.value}
            </span>

            <span
              className={`breakdown-value ${
                item.points > 0 ? "positive" : "neutral"
              }`}
              title="Risk points contributed by this factor"
            >
              +{item.points}
            </span>
          </div>
        ))}
      </div>

      <div className="breakdown-summary">
        <strong>ORCA's reasoning:</strong>
        <p>{reasoning}</p>
      </div>
    </section>
  );
}
