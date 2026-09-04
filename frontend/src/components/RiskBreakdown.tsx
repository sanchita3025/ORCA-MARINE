interface BreakdownData {
  wind?: number;
  waves?: number;
  wave?: number;
  weather?: number;
  ocean?: number;
  pfz?: number;
  gis?: number;
}

interface RiskBreakdownProps {
  breakdown?: BreakdownData;
  data?: BreakdownData;
}

export default function RiskBreakdown({
  breakdown,
  data,
}: RiskBreakdownProps) {

  const values =
    breakdown || data || {};

  const wind =
    values.wind ?? 0;

  const waves =
    values.waves ??
    values.wave ??
    0;

  const weather =
    values.weather ?? 0;

  const ocean =
    values.ocean ?? 0;

  const pfz =
    values.pfz ?? 0;

  const gis =
    values.gis ?? 0;

  const items = [
    {
      label: "Wind",
      value: wind,
      icon: "💨",
    },
    {
      label: "Waves",
      value: waves,
      icon: "🌊",
    },
    {
      label: "Weather",
      value: weather,
      icon: "🌦️",
    },
    {
      label: "Ocean",
      value: ocean,
      icon: "🌊",
    },
    {
      label: "PFZ",
      value: pfz,
      icon: "🛰️",
    },
    {
      label: "GIS",
      value: gis,
      icon: "🗺️",
    },
  ];

  const largestRiskFactor =
    items
      .filter((item) => item.value > 0)
      .sort(
        (a, b) =>
          b.value - a.value
      )[0];

  const favorableFactor =
    items
      .filter((item) => item.value < 0)
      .sort(
        (a, b) =>
          a.value - b.value
      )[0];

  let reasoning =
    "Multiple marine and environmental factors contribute to the current assessment.";

  if (largestRiskFactor) {
    reasoning =
      `${largestRiskFactor.label} is currently the largest positive contributor to the assessed risk.`;
  }

  if (
    favorableFactor &&
    !largestRiskFactor
  ) {
    reasoning =
      `${favorableFactor.label} is providing a favorable contribution to the assessment.`;
  }

  return (
    <section className="risk-breakdown">

      <div className="section-title">

        <span>💡</span>

        <div>

          <h2>
            WHY THIS RESULT?
          </h2>

          <p>
            Factors contributing to the
            current risk assessment
          </p>

        </div>

      </div>

      <div className="breakdown-list">

        {items.map((item) => (

          <div
            className="breakdown-item"
            key={item.label}
          >

            <div className="breakdown-name">

              <span className="breakdown-icon">
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>

            </div>

            <span
              className={`breakdown-value ${
                item.value > 0
                  ? "positive"
                  : item.value < 0
                  ? "negative"
                  : "neutral"
              }`}
            >
              {item.value > 0
                ? "+"
                : ""}

              {item.value}
            </span>

          </div>

        ))}

      </div>

      <div className="breakdown-summary">

        <strong>
          ORCA's reasoning:
        </strong>

        <p>
          {reasoning}
        </p>

      </div>

    </section>
  );
}