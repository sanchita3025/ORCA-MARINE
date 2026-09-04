import {
  Brain,
  Check,
  CloudSun,
  LoaderCircle,
  Map,
  Satellite,
  Waves,
} from "lucide-react";

function LoadingScreen() {
  return (
    <div className="orca-loading">
      <div className="loading-header">
        <div className="loading-brain">
          <Brain size={25} />
        </div>

        <div>
          <p className="section-label">
            ORCA INTELLIGENCE
          </p>

          <h2>Analyzing marine conditions</h2>
        </div>
      </div>

      <div className="loading-agents">
        <div className="loading-agent complete">
          <CloudSun />
          <span>Weather</span>
          <Check />
        </div>

        <div className="loading-agent complete">
          <Waves />
          <span>Ocean</span>
          <Check />
        </div>

        <div className="loading-agent active">
          <Satellite />
          <span>Satellite / PFZ</span>
          <LoaderCircle />
        </div>

        <div className="loading-agent">
          <Map />
          <span>Spatial intelligence</span>
          <LoaderCircle />
        </div>
      </div>

      <div className="loading-message">
        <span />
        Multiple marine intelligence agents are collaborating
      </div>
    </div>
  );
}

export default LoadingScreen;