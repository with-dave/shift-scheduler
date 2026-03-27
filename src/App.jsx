import React from 'react';
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import CalendarMonth from "./components/CalendarMonth";

function App() {
  return (
    <div>
      <h1>Shift Scheduler</h1>

      <ErrorBoundary>
        <div className="mt-8">
          <CalendarMonth />
        </div>
      </ErrorBoundary>
    </div>
  );
}

export default App;
