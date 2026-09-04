type AgentActivityProps = {
  active?: boolean;
};

function AgentActivity({
  active = true,
}: AgentActivityProps) {

  const agents = [
    {
      icon: "🧠",
      name: "COORDINATOR",
      description: "Understanding your question",
    },
    {
      icon: "🌊",
      name: "OCEAN AGENT",
      description: "Analyzing waves and currents",
    },
    {
      icon: "☁️",
      name: "WEATHER AGENT",
      description: "Analyzing wind and weather",
    },
    {
      icon: "🛰️",
      name: "SATELLITE AGENT",
      description: "Checking marine observations",
    },
    {
      icon: "📍",
      name: "GIS AGENT",
      description: "Checking geographic constraints",
    },
    {
      icon: "🤖",
      name: "ORCA REASONER",
      description: "Combining available evidence",
    },
  ];

  return (
    <div className="agent-activity">

      <div className="agent-activity-header">
        <span className="status-dot" />

        ORCA AGENT NETWORK

      </div>

      <div className="agent-activity-list">

        {agents.map((agent, index) => (

          <div
            key={agent.name}
            className={`activity-agent ${
              active
                ? "activity-agent-active"
                : ""
            }`}
            style={{
              animationDelay: `${index * 0.35}s`,
            }}
          >

            <div className="activity-icon">
              {agent.icon}
            </div>

            <div className="activity-info">

              <strong>
                {agent.name}
              </strong>

              <span>
                {agent.description}
              </span>

            </div>

            <div className="activity-status">
              ●
            </div>

          </div>

        ))}

      </div>

    </div>
  );
}

export default AgentActivity;