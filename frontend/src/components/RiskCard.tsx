interface RiskCardProps {
  score?: number;
  level?: string;
  message?: string;
}

export default function RiskCard({
  score = 0,
  level = "UNKNOWN",
  message,
}: RiskCardProps) {

  const safeLevel =
    String(
      level || "UNKNOWN"
    ).toUpperCase();

  const safeScore =
    Math.min(
      100,
      Math.max(
        0,
        Number(score) || 0
      )
    );

  const getRiskClass = () => {
    switch (safeLevel) {

      case "LOW":
        return "risk-low";

      case "MODERATE":
        return "risk-moderate";

      case "HIGH":
        return "risk-high";

      case "SEVERE":
        return "risk-severe";

      default:
        return "risk-unknown";
    }
  };

  const displayMessage =
    message?.trim() ||
    "Risk information is currently unavailable.";

  return (
    <div
      className={`risk-card ${getRiskClass()}`}
    >

      <div className="risk-header">

        <span className="risk-label">
          ORCA RISK ASSESSMENT
        </span>

        <span className="risk-level">
          {safeLevel}
        </span>

      </div>

      <div className="risk-score">

        {Math.round(
          safeScore
        )}

        <span>
          / 100
        </span>

      </div>

      <p className="risk-message">
        {displayMessage}
      </p>

    </div>
  );
}