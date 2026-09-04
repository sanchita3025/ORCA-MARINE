type WelcomeScreenProps = {
  onComplete: () => void;
};

function WelcomeScreen({
  onComplete,
}: WelcomeScreenProps) {
  return (
    <div className="welcome-screen">

      <div className="welcome-glow welcome-glow-one" />
      <div className="welcome-glow welcome-glow-two" />

      <div className="welcome-grid" />

      <div className="welcome-content">

        <div className="welcome-logo">
          <div className="orca-symbol">
            🐋
          </div>
        </div>

        <p className="welcome-label">
          MARINE INTELLIGENCE PLATFORM
        </p>

        <h1>
          ORCA
        </h1>

        <h2>
          Marine Ecosystem
          <span>
            Reasoning with Collaborative Agents
          </span>
        </h2>

        <p className="welcome-description">
          AI-powered marine intelligence for
          safer decisions, environmental
          awareness, and ocean understanding.
        </p>

        <div className="welcome-loading">

          <div className="welcome-line">
            <div className="welcome-line-progress" />
          </div>

          <span>
            MARINE INTELLIGENCE SYSTEM READY
          </span>

        </div>

        <button
          type="button"
          onClick={onComplete}
          className="welcome-enter-button"
        >
          <span>ENTER ORCA</span>
          <strong>→</strong>
        </button>

      </div>

      <div className="welcome-bottom">
        <span>ORCA</span>
        <span>•</span>
        <span>SIH 2026</span>
        <span>•</span>
        <span>MARINE INTELLIGENCE</span>
      </div>

    </div>
  );
}

export default WelcomeScreen;