type Role = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

type Assessment = {
  answer: string;
  risk: {
    score: number;
    level: string;
    message: string;
  };
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

type Location = {
  name: string;
  latitude: number;
  longitude: number;
};

type Props = {
  role: Role;
  fishermanVerified: boolean;
  assessment: Assessment;
  location: Location;
  onChangeRole: () => void;
};

type Card = {
  icon: string;
  title: string;
  value: string;
  detail: string;
  tone?: string;
};

function MetricCard({ card }: { card: Card }) {
  return (
    <div className={`stakeholder-metric ${card.tone || ""}`}>
      <div className="stakeholder-metric-icon">{card.icon}</div>
      <div className="stakeholder-metric-copy">
        <span>{card.title}</span>
        <strong>{card.value}</strong>
        <small>{card.detail}</small>
      </div>
    </div>
  );
}

function StakeholderDashboard({
  role,
  fishermanVerified,
  assessment,
  location,
  onChangeRole,
}: Props) {
  const isPublicFisherman =
    role.id === "fisherman" && !fishermanVerified;

  const dashboardRole: Role = isPublicFisherman
    ? {
        id: "traveler",
        icon: "🎣",
        title: "Fisherman • Public Access",
        description:
          "Public marine information is available. Government-authorized fisherman tools remain protected.",
      }
    : role;

  const baseMetrics: Card[] = [
    {
      icon: "🌊",
      title: "Wave Height",
      value: `${assessment.ocean.wave_height} m`,
      detail: "Current marine observation",
    },
    {
      icon: "💨",
      title: "Wind",
      value: `${assessment.weather.wind_speed} km/h`,
      detail: "Current weather observation",
    },
    {
      icon: "🌡️",
      title: "Sea Surface Temp.",
      value: `${assessment.ocean.sst}°C`,
      detail: "Ocean observation",
    },
    {
      icon: "🌊",
      title: "Current Speed",
      value: `${assessment.ocean.current_speed}`,
      detail: "Ocean current indicator",
    },
  ];

  const roleConfig: Record<
    string,
    {
      eyebrow: string;
      title: string;
      subtitle: string;
      cards: Card[];
      notice: string;
    }
  > = {
    researcher: {
      eyebrow: "RESEARCH INTELLIGENCE",
      title: "Marine Data & Satellite Analysis",
      subtitle:
        "Focus on observing, comparing and understanding marine conditions — without operational fishing tools.",
      cards: [
        {
          icon: "🌊",
          title: "Marine Data",
          value: `${assessment.ocean.wave_height} m waves`,
          detail: `Current ${assessment.ocean.current_speed} · SST ${assessment.ocean.sst}°C`,
        },
        {
          icon: "🛰️",
          title: "Satellite Observation",
          value: assessment.satellite.pfz_available
            ? `PFZ ${assessment.satellite.pfz}`
            : "PFZ unavailable",
          detail: "Satellite / PFZ observation status",
        },
        {
          icon: "📊",
          title: "Marine Analysis",
          value: assessment.risk.level,
          detail: "Prototype environmental assessment",
        },
        {
          icon: "📍",
          title: "Study Area",
          value: location.name,
          detail: `${location.latitude.toFixed(2)}° N · ${location.longitude.toFixed(2)}° E`,
        },
      ],
      notice:
        "Research view intentionally excludes fisherman safety, fuel, route-operation and protected emergency tools.",
    },
    "boat-operator": {
      eyebrow: "VESSEL OPERATIONS",
      title: "Route & Operating Conditions",
      subtitle:
        "Operational marine conditions for planning vessel movement and assessing route constraints.",
      cards: [
        {
          icon: "🗺️",
          title: "Route Status",
          value: assessment.gis.restricted_zone ? "RESTRICTED" : "CLEAR",
          detail: assessment.gis.location_name,
          tone: assessment.gis.restricted_zone ? "danger" : "good",
        },
        {
          icon: "🌤️",
          title: "Weather",
          value: `${assessment.weather.wind_speed} km/h wind`,
          detail: `${assessment.weather.temperature}°C · ${assessment.weather.precipitation}% precipitation`,
        },
        {
          icon: "⚓",
          title: "Operating Conditions",
          value: `${assessment.ocean.wave_height} m waves`,
          detail: `Current ${assessment.ocean.current_speed} · Period ${assessment.ocean.wave_period}`,
        },
        {
          icon: "⛽",
          title: "Fuel & Range",
          value: "Not yet connected",
          detail: "Fuel/range module is the next ORCA upgrade",
        },
      ],
      notice:
        "The current project has route/GIS and marine-condition data. Fuel and range are shown as a clearly marked next module rather than invented vessel data.",
    },
    traveler: {
      eyebrow: "PUBLIC COASTAL INFORMATION",
      title: "Marine Conditions & Coastal View",
      subtitle:
        "A simplified view for travelers and public users — only information relevant to coastal awareness.",
      cards: [
        ...baseMetrics.slice(0, 3),
        {
          icon: "🏖️",
          title: "Coastal Information",
          value: assessment.gis.restricted_zone
            ? "Zone advisory"
            : "General access",
          detail: assessment.gis.location_name,
          tone: assessment.gis.restricted_zone ? "warning" : "good",
        },
      ],
      notice:
        "Public access does not expose fisherman-only PFZ recommendations, fuel tools or emergency intelligence.",
    },
    environmentalist: {
      eyebrow: "OCEAN HEALTH",
      title: "Environmental Monitoring",
      subtitle:
        "Focus on marine conditions, satellite observations and signals that may indicate environmental change.",
      cards: [
        {
          icon: "🌡️",
          title: "Ocean Health Indicator",
          value: `${assessment.ocean.sst}°C SST`,
          detail: "Sea surface temperature observation",
        },
        {
          icon: "🛰️",
          title: "Environmental Satellite",
          value: assessment.satellite.pfz_available
            ? "Observation available"
            : "Observation unavailable",
          detail: `PFZ status: ${assessment.satellite.pfz}`,
        },
        {
          icon: "🔴",
          title: "Anomaly Watch",
          value: "Monitoring",
          detail: "Anomaly engine can be connected next",
        },
        {
          icon: "📈",
          title: "Marine Conditions",
          value: assessment.risk.level,
          detail: "Prototype condition indicator",
        },
      ],
      notice:
        "Environmental anomaly scoring is presented as a monitoring slot until a dedicated anomaly data source is connected.",
    },
    authority: {
      eyebrow: "COASTAL COMMAND",
      title: "Marine Alerts, Zones & Emergency Intelligence",
      subtitle:
        "A regional operational view focused on hazards, restricted areas and response-relevant information.",
      cards: [
        {
          icon: "🚨",
          title: "Marine Alert Level",
          value: assessment.risk.level,
          detail: `Prototype risk ${assessment.risk.score}/100`,
          tone:
            assessment.risk.score > 70
              ? "danger"
              : assessment.risk.score > 50
                ? "warning"
                : "good",
        },
        {
          icon: "🗺️",
          title: "Marine Zone",
          value: assessment.gis.restricted_zone ? "RESTRICTED" : "CLEAR",
          detail: assessment.gis.location_name,
          tone: assessment.gis.restricted_zone ? "danger" : "good",
        },
        {
          icon: "🆘",
          title: "Emergency Intelligence",
          value: "Monitoring",
          detail: "Incident/SAR layer can be connected next",
        },
        {
          icon: "📍",
          title: "Coastal Situation",
          value: location.name,
          detail: "Regional marine observation",
        },
      ],
      notice:
        "Authority view prioritizes alerts and spatial constraints; fisherman-only mission and PFZ tools are not shown.",
    },
  };

  const config =
    roleConfig[dashboardRole.id] ||
    roleConfig.traveler;

  return (
    <div className="stakeholder-dashboard">
      <header className="stakeholder-header">
        <div className="stakeholder-brand">
          <div className="stakeholder-logo">🐋</div>
          <div>
            <div className="stakeholder-brand-name">ORCA</div>
            <div className="stakeholder-brand-sub">
              MARINE INTELLIGENCE
            </div>
          </div>
        </div>

        <button
          type="button"
          className="stakeholder-change-role"
          onClick={onChangeRole}
        >
          ↻ Change role
        </button>
      </header>

      <main className="stakeholder-main">
        <div className="stakeholder-topline">
          <span className="stakeholder-role-pill">
            {dashboardRole.icon} {dashboardRole.title}
            {role.id === "fisherman" && fishermanVerified
              ? " • ✓ VERIFIED"
              : ""}
          </span>
          <span className="stakeholder-demo-pill">
            DEMO MODE
          </span>
        </div>

        <section className="stakeholder-hero">
          <div>
            <p className="stakeholder-eyebrow">
              {config.eyebrow}
            </p>
            <h1>{config.title}</h1>
            <p>{config.subtitle}</p>
          </div>

          <div className="stakeholder-location">
            <span>📍 CURRENT AREA</span>
            <strong>{location.name}</strong>
            <small>
              {location.latitude.toFixed(2)}° N ·{" "}
              {location.longitude.toFixed(2)}° E
            </small>
          </div>
        </section>

        {isPublicFisherman && (
          <div className="stakeholder-access-warning">
            <span>🔒</span>
            <div>
              <strong>Public access enabled</strong>
              <p>
                Government-authorized fisherman tools are hidden because
                this fisherman account has not been verified.
              </p>
            </div>
          </div>
        )}

        <section className="stakeholder-section">
          <div className="stakeholder-section-heading">
            <div>
              <span>ROLE-SPECIFIC DATA</span>
              <h2>What matters to you</h2>
            </div>
          </div>

          <div className="stakeholder-metrics">
            {config.cards.map((card) => (
              <MetricCard
                key={`${card.title}-${card.value}`}
                card={card}
              />
            ))}
          </div>
        </section>

        <section className="stakeholder-summary">
          <div>
            <span className="stakeholder-summary-label">
              ORCA STATUS
            </span>
            <h2>{assessment.risk.level} MARINE CONDITIONS</h2>
            <p>{assessment.risk.message}</p>
          </div>
          <div className="stakeholder-summary-score">
            <strong>{assessment.risk.score}</strong>
            <span>/ 100</span>
            <small>Prototype risk indicator</small>
          </div>
        </section>

        <div className="stakeholder-notice">
          <span>ℹ</span>
          <p>{config.notice}</p>
        </div>

        <footer className="stakeholder-footer">
          <span>
            ORCA • Evidence-based marine decision support
          </span>
          <span>
            Prototype data — not live maritime information
          </span>
        </footer>
      </main>
    </div>
  );
}

export default StakeholderDashboard;
