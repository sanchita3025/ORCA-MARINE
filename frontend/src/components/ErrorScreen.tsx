function ErrorScreen() {

  return (
    <div className="error-screen">

      <div className="error-icon">
        ⚠️
      </div>

      <h2>
        Unable to complete assessment
      </h2>

      <p>
        Some marine data is currently unavailable.
      </p>

      <p>
        Please try again.
      </p>

    </div>
  );
}


export default ErrorScreen;