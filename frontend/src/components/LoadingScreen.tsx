import { useEffect, useState } from "react";

function LoadingScreen() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      icon: "🧠",
      title: "Understanding question",
      description: "ORCA Coordinator is interpreting your request",
    },
    {
      icon: "☁️",
      title: "Weather Agent",
      description: "Analyzing wind, temperature and precipitation",
    },
    {
      icon: "🌊",
      title: "Ocean Agent",
      description: "Analyzing waves, currents and sea conditions",
    },
    {
      icon: "🛰️",
      title: "Satellite Agent",
      description: "Checking marine observations and PFZ intelligence",
    },
    {
      icon: "📍",
      title: "GIS Agent",
      description: "Checking location constraints and restricted zones",
    },
    {
      icon: "🤖",
      title: "ORCA Reasoner",
      description: "Combining evidence and calculating risk",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((current) => {
        if (current < steps.length - 1) {
          return current + 1;
        }

        return current;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="loading-screen">

      {/* ORCA ICON */}

      <div className="loading-orca">
        🐋
      </div>

      {/* TITLE */}

      <p className="section-label">
        MULTI-AGENT ANALYSIS
      </p>

      <h2>
        ORCA IS ANALYZING<span>...</span>
      </h2>

      <p className="loading-description">
        Multiple intelligence agents are working together
        to assess the marine environment.
      </p>

      {/* AGENT STEPS */}

      <div className="loading-steps">

        {steps.map((step, index) => {

          const completed =
            index < activeStep;

          const active =
            index === activeStep;

          return (
            <div
              key={step.title}
              className={`loading-step ${
                active
                  ? "loading-step-active"
                  : ""
              } ${
                completed
                  ? "loading-step-complete"
                  : ""
              }`}
            >

              {/* ICON */}

              <div className="loading-step-icon">
                {completed
                  ? "✓"
                  : step.icon}
              </div>

              {/* TEXT */}

              <div className="loading-step-content">

                <strong>
                  {step.title}
                </strong>

                <span>
                  {step.description}
                </span>

              </div>

              {/* STATUS */}

              <div className="loading-step-status">

                {completed && (
                  <span>
                    COMPLETE
                  </span>
                )}

                {active && (
                  <span className="analyzing-status">
                    ANALYZING
                  </span>
                )}

                {!completed &&
                  !active && (
                    <span>
                      WAITING
                    </span>
                  )}

              </div>

            </div>
          );
        })}

      </div>

      {/* BOTTOM STATUS */}

      <div className="loading-footer">

        <span className="status-dot" />

        Collaborative agents active

      </div>

    </div>
  );
}

export default LoadingScreen;