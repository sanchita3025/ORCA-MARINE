type EvidencePanelProps = {
  result?: any;
  verified?: boolean;
};

function EvidencePanel({ result, verified = false }: EvidencePanelProps) {
  const quality = result?.marine_conditions?.data_quality ?? result?.data_quality ?? {};
  const weatherQuality = quality.weather || "unknown";
  const oceanQuality = quality.ocean || "unknown";
  const overall = quality.overall || result?.marine_conditions?.status || "unknown";
  const pfzAvailable = result?.fishing_zone?.status === "available";
  const gisAvailable = Boolean(result?.gis || result?.restricted_zone);

  const confidence = overall === "live" ? 90 : overall === "forecast" ? 85 : overall === "partial" ? 70 : overall === "fallback" ? 55 : 65;

  const items = [
    { icon: "🌦️", name: "Weather", status: weatherQuality.toUpperCase(), source: "Open-Meteo Weather API" },
    { icon: "🌊", name: "Ocean", status: oceanQuality.toUpperCase(), source: "Open-Meteo Marine API" },
    { icon: "🛰️", name: "Satellite / PFZ", status: pfzAvailable ? "AVAILABLE" : "UNAVAILABLE", source: pfzAvailable ? "Configured PFZ dataset" : "No PFZ dataset available in this demo" },
    { icon: "🗺️", name: "GIS", status: gisAvailable ? "CHECKED" : "UNAVAILABLE", source: "ORCA spatial-zone analysis" },
  ];

  return (
    <div className="evidence-panel">
      <div className="evidence-verification">
        <div><strong>Evidence status</strong><span>{overall.toUpperCase()}</span></div>
        <div><strong>User access</strong><span>{verified ? "✓ Verified fisherman" : "Public / role-based"}</span></div>
        <div><strong>Prototype confidence</strong><span>{confidence}%</span></div>
      </div>

      <div className="evidence-confidence">
        <div className="evidence-confidence-header"><span>Data confidence indicator</span><strong>{confidence}%</strong></div>
        <div className="evidence-confidence-bar"><div style={{ width: `${confidence}%` }} /></div>
        <small>This is a prototype data-quality indicator, not a claim that the underlying sources are independently verified.</small>
      </div>

      <div className="evidence-grid">
        {items.map((item) => (
          <div className="evidence-card" key={item.name}>
            <div className="evidence-icon">{item.icon}</div>
            <div className="evidence-info">
              <h3>{item.name}</h3>
              <div className="evidence-status"><span>{item.status === "UNAVAILABLE" ? "–" : "✓"}</span>{item.status}</div>
              <p>{item.source}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EvidencePanel;
