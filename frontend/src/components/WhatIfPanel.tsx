type WhatIfPanelProps = {
  onTimeChange: (
    time: string
  ) => void;

  selectedTime: string;

  loading?: boolean;
};

function WhatIfPanel({
  onTimeChange,
  selectedTime,
  loading = false,
}: WhatIfPanelProps) {

  // Internal values stay in 24-hour format for the app/API.
  // Users see a clearer 12-hour AM/PM format.
  const times = [
    "06:00",
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ];

  const formatTime = (time: string) => {
    const [hourString, minute] = time.split(":");
    const hour = Number(hourString);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minute} ${period}`;
  };

  return (
    <section className="what-if-section">

      <div className="section-heading">

        <span>
          🔄
        </span>

        <div>

          <h2>
            WHAT IF?
          </h2>

          <p>
            See how changing the departure
            time affects the complete marine
            assessment.
          </p>

        </div>

      </div>

      <div className="time-options">

        {times.map(
          (time) => {

            const selected =
              selectedTime === time;

            return (
              <button
                key={time}
                type="button"
                className={
                  selected
                    ? "time-selected"
                    : ""
                }
                onClick={() =>
                  onTimeChange(time)
                }
                disabled={
                  loading ||
                  selected
                }
              >
                {formatTime(time)}

                {selected && (
                  <span>
                    ✓
                  </span>
                )}
              </button>
            );
          }
        )}

      </div>

      {loading && (
        <div className="what-if-loading">

          <span className="status-dot" />

          ORCA is recalculating
          weather, ocean, satellite
          and GIS conditions...

        </div>
      )}

    </section>
  );
}

export default WhatIfPanel;