import "./PatientDashboard.css";
import patientDashboard from "../assets/PatientDashboard.png";

function PatientDashboard() {
  const name = localStorage.getItem("name") || "Patient";

  return (
    <div className="patient-dashboard">
      <img
        src={patientDashboard}
        alt="MediFlow AI Dashboard"
        className="patient-dashboard-bg"
      />

      <aside className="patient-sidebar">
        <div className="patient-brand">
          Medi<span>Flow</span> AI
        </div>

        <nav className="patient-nav">
          <button className="patient-nav-item active">
            <span>⌂</span>
            Dashboard
          </button>

          <button className="patient-nav-item">
            <span>▣</span>
            Book Appt.
          </button>

          <button className="patient-nav-item">
            <span>☷</span>
            My Appointments
          </button>

          <button className="patient-nav-item">
            <span>●</span>
            Profile
          </button>
        </nav>
      </aside>

      <header className="patient-header">
        <div className="patient-header-left">
          <span className="patient-ai-icon">✦</span>
          <span>MediFlow AI</span>
        </div>

        <div className="patient-header-right">
          <span>Welcome, {name}</span>
          <span className="patient-avatar">👤</span>

          <button className="patient-logout">Logout</button>
        </div>
      </header>

      <main className="patient-main">
        <section className="patient-content">
          <h1>Good morning, {name} 👋</h1>

          <div className="patient-stats">
            <div className="patient-stat-card">
              <span>Upcoming</span>
              <strong>2</strong>
              <small>Appointments</small>
            </div>

            <div className="patient-stat-card">
              <span>Completed</span>
              <strong>5</strong>
              <small>Appointments</small>
            </div>
          </div>

          <section className="symptom-section">
            <h2>How can we help?</h2>

            <textarea
              placeholder="Describe your symptoms..."
              className="symptom-input"
            />

            <button className="analyze-button">Analyze Symptoms 🔍</button>
          </section>

          <div className="patient-date">16 - 22 March</div>
        </section>

        <aside className="patient-right-panel">
          <div className="online-doctors">
            <h3>Doctors from the community</h3>
            <p>who are online</p>

            <div className="doctor-online-item">
              <span>👩‍⚕️</span>
              <span>Doctors Online</span>
            </div>

            <div className="doctor-online-item">
              <span>👨‍⚕️</span>
              <span>Available Now</span>
            </div>
          </div>

          <div className="newsletter">
            <h3>Subscribe to our newsletter</h3>
            <button>Subscribe</button>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default PatientDashboard;
