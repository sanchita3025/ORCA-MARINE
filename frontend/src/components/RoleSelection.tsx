type Role = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

const roles: Role[] = [
  { id: "fisherman", icon: "🎣", title: "Fisherman", description: "Fishing conditions, PFZ, safety & marine risk" },
  { id: "researcher", icon: "🔬", title: "Researcher", description: "Marine data, satellite observations & analysis" },
  { id: "boat-operator", icon: "🚤", title: "Boat Operator", description: "Routes, weather, fuel & operating conditions" },
  { id: "traveler", icon: "🧳", title: "Traveler / Public", description: "Marine conditions & public coastal information" },
  { id: "environmentalist", icon: "🌱", title: "Environmentalist", description: "Ocean health, anomalies & environmental data" },
  { id: "authority", icon: "🏛️", title: "Coastal Authority", description: "Marine alerts, zones & emergency intelligence" },
];

type RoleSelectionProps = { onSelect: (role: Role) => void };

function RoleSelection({ onSelect }: RoleSelectionProps) {
  return (
    <div className="role-selection-screen">
      <div className="role-selection-glow role-selection-glow-one" />
      <div className="role-selection-glow role-selection-glow-two" />
      <div className="role-selection-content">
        <div className="role-selection-logo">🐋</div>
        <p className="role-selection-label">ORCA • MULTI-STAKEHOLDER PLATFORM</p>
        <h1>How will you use<span>ORCA?</span></h1>
        <p className="role-selection-description">Choose your role to personalize the marine intelligence and information available to you.</p>
        <div className="role-grid">
          {roles.map((role) => (
            <button key={role.id} type="button" className="role-card" onClick={() => onSelect(role)}>
              <div className="role-icon">{role.icon}</div>
              <div className="role-card-content"><h2>{role.title}</h2><p>{role.description}</p></div>
              <span className="role-arrow">→</span>
            </button>
          ))}
        </div>
        <div className="role-selection-footer"><span>ORCA</span><span>•</span><span>MARINE INTELLIGENCE</span><span>•</span><span>SIH 2026</span></div>
      </div>
    </div>
  );
}

export default RoleSelection;
