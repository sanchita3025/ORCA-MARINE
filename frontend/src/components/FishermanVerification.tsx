import { useState } from "react";

type FishermanVerificationProps = {
  onComplete: (verified: boolean) => void;
};

const DEMO_IDS = [
  "ORCA-OD-1024",
  "ORCA-OD-2048",
  "ORCA-KL-3021",
];

function FishermanVerification({ onComplete }: FishermanVerificationProps) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [id, setId] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "verified" | "invalid">("idle");

  function verifyId() {
    setStatus("checking");

    window.setTimeout(() => {
      const valid = DEMO_IDS.includes(id.trim().toUpperCase());
      setStatus(valid ? "verified" : "invalid");
    }, 600);
  }

  if (authorized === false) {
    return (
      <div className="verification-screen">
        <div className="verification-card">
          <div className="verification-icon">🎣</div>
          <div className="verification-kicker">FISHERMAN ACCESS</div>
          <h1>Continue without government verification</h1>
          <p>
            You can continue with publicly available marine information.
            Government-authorized tools will remain protected.
          </p>
          <button className="verification-primary" onClick={() => onComplete(false)}>
            CONTINUE TO ORCA →
          </button>
          <button className="verification-secondary" onClick={() => setAuthorized(null)}>
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-screen">
      <div className="verification-glow verification-glow-one" />
      <div className="verification-glow verification-glow-two" />

      <div className="verification-card">
        <div className="verification-icon">🛡️</div>
        <div className="verification-kicker">FISHERMAN ACCESS</div>
        <h1>Are you a government-authorized fisherman?</h1>
        <p>
          Verification is only required for fishermen who want authorized-user access.
          Other stakeholders are not required to provide a fisherman ID.
        </p>

        {authorized === null && (
          <div className="verification-choice-grid">
            <button className="verification-choice" onClick={() => setAuthorized(true)}>
              <span>✓</span>
              <strong>Yes, I am authorized</strong>
              <small>Verify my government-issued fisherman ID</small>
            </button>
            <button className="verification-choice" onClick={() => setAuthorized(false)}>
              <span>→</span>
              <strong>No / Not applicable</strong>
              <small>Continue with public marine information</small>
            </button>
          </div>
        )}

        {authorized === true && (
          <div className="verification-form">
            <label htmlFor="fisherman-id">Government Fisherman ID</label>
            <input
              id="fisherman-id"
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setStatus("idle");
              }}
              placeholder="e.g. ORCA-OD-1024"
              autoComplete="off"
            />

            <div className="verification-demo-note">
              Prototype demo IDs: ORCA-OD-1024 · ORCA-OD-2048 · ORCA-KL-3021
            </div>

            {status === "checking" && <div className="verification-status checking">⟳ Verifying ID...</div>}
            {status === "verified" && <div className="verification-status success">✓ ID verified successfully</div>}
            {status === "invalid" && <div className="verification-status error">✕ ID not recognized. Try a demo ID.</div>}

            {status === "verified" ? (
              <button className="verification-primary" onClick={() => onComplete(true)}>
                CONTINUE AS VERIFIED FISHERMAN →
              </button>
            ) : (
              <button className="verification-primary" onClick={verifyId} disabled={!id.trim() || status === "checking"}>
                VERIFY FISHERMAN ID
              </button>
            )}

            <button className="verification-secondary" onClick={() => setAuthorized(null)}>
              ← Choose another option
            </button>
          </div>
        )}

        <div className="verification-disclaimer">
          Prototype verification • No government database is connected in this demo
        </div>
      </div>
    </div>
  );
}

export default FishermanVerification;
