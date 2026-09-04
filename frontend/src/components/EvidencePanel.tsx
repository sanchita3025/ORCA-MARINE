type VerificationData = {
  verified?: boolean;
  confidence?: number;
};

type EvidencePanelProps = {
  verification?: VerificationData;
};

function EvidencePanel({
  verification,
}: EvidencePanelProps) {

  const verified =
    verification?.verified ??
    false;

  const confidenceValue =
    Number(
      verification?.confidence ?? 0
    );

  /*
    Backend may return:
    0.87

    or occasionally:
    87

    Normalize both.
  */

  const confidence =
    confidenceValue <= 1
      ? Math.round(
          confidenceValue * 100
        )
      : Math.round(
          confidenceValue
        );

  const safeConfidence =
    Math.min(
      100,
      Math.max(
        0,
        confidence
      )
    );

  const evidence = [
    {
      icon: "🌦️",
      name: "Weather",
      status: "Available",
      source: "Weather data service",
      time: "Recent",
    },

    {
      icon: "🌊",
      name: "Ocean",
      status: "Available",
      source: "Marine data service",
      time: "Recent",
    },

    {
      icon: "🛰️",
      name: "Satellite / PFZ",
      status: "Available",
      source: "INCOIS / Satellite data",
      time: "Recent",
    },

    {
      icon: "🗺️",
      name: "GIS",
      status: "Available",
      source: "Geospatial data",
      time: "Recent",
    },
  ];

  return (
    <div className="evidence-panel">

      {/* VERIFICATION SUMMARY */}

      <div className="evidence-verification">

        <div>

          <strong>
            Overall verification
          </strong>

          <span>
            {verified
              ? "✓ Verified"
              : "⚠ Partial verification"}
          </span>

        </div>

        <div>

          <strong>
            Confidence
          </strong>

          <span>
            {safeConfidence}%
          </span>

        </div>

      </div>

      {/* CONFIDENCE */}

      <div className="evidence-confidence">

        <div className="evidence-confidence-header">

          <span>
            Data confidence
          </span>

          <strong>
            {safeConfidence}%
          </strong>

        </div>

        <div className="evidence-confidence-bar">

          <div
            style={{
              width:
                `${safeConfidence}%`,
            }}
          />

        </div>

      </div>

      {/* SOURCES */}

      <div className="evidence-grid">

        {evidence.map(
          (item) => (

            <div
              className="evidence-card"
              key={item.name}
            >

              <div className="evidence-icon">
                {item.icon}
              </div>

              <div className="evidence-info">

                <h3>
                  {item.name}
                </h3>

                <div className="evidence-status">

                  <span>
                    ✓
                  </span>

                  {item.status}

                </div>

                <p>
                  {item.source}
                </p>

                <small>
                  Updated: {item.time}
                </small>

              </div>

            </div>

          )
        )}

      </div>

    </div>
  );
}

export default EvidencePanel;