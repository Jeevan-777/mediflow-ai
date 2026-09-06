import { useEffect, useState } from "react";
import "./PatientDashboard.css";
import patientDashboard from "../assets/PatientDashboard.png";

function PatientDashboard() {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [symptoms, setSymptoms] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  useEffect(() => {
    const fetchPatientDashboard = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/patients/dashboard",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load dashboard");
        }

        setPatient(data);
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDashboard();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    localStorage.removeItem("role");

    window.location.reload();
  };

  const handleAnalyzeSymptoms = async () => {
    if (!symptoms.trim()) {
      alert("Please describe your symptoms first.");
      return;
    }

    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch("http://127.0.0.1:8000/symptoms/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symptoms: symptoms,
          appointment_date: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "AI analysis failed");
      }

      setAnalysisResult(data);

      console.log("AI Analysis Result:", data);
      setAiResult(data);
    } catch (error) {
      console.error("Symptom analysis error:", error);
      alert(error.message || "Unable to analyze symptoms.");
    } finally {
      setAnalyzing(false);
    }
  };

  const name = patient?.name || "Patient";

  // Compute current week date range
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const fmtDate = (d) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  const weekRange = `${fmtDate(startOfWeek)} - ${fmtDate(endOfWeek)}`;

  return (
    <div className="patient-dashboard">
      {/* Decorative background image */}
      <img src={patientDashboard} alt="" className="patient-dashboard-bg" />

      {/* SIDEBAR */}
      <aside className="patient-sidebar">
        <div className="patient-brand">
          <div className="brand-logo-circle">
            <svg
              className="brand-logo-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              <polyline
                points="2 13 5 13 7 9 9 17 11 13 14 13"
                strokeWidth="1.4"
              />
            </svg>
          </div>
          <div className="brand-name">
            Medi<span>Flow</span> AI
          </div>
        </div>

        <nav className="patient-nav">
          <button className="patient-nav-item active">
            <span className="nav-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            Dashboard
          </button>

          <button className="patient-nav-item">
            <span className="nav-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M9 12h6M9 16h6" />
              </svg>
            </span>
            My Appointments
          </button>

          <button className="patient-nav-item">
            <span className="nav-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            Profile
          </button>
        </nav>

        <div className="sidebar-bottom-deco" />
      </aside>

      {/* HEADER */}
      <header className="patient-header">
        <div className="patient-header-title">
          <span className="patient-header-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              <polyline
                points="2 13 5 13 7 9 9 17 11 13 14 13"
                strokeWidth="1.5"
              />
            </svg>
          </span>
          <span>Patient Dashboard</span>
        </div>

        <div className="patient-header-right">
          <span className="patient-welcome">
            Welcome, <strong>{loading ? "..." : name}</strong>
          </span>

          <div className="patient-avatar">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          <div className="patient-header-divider"></div>

          <button className="patient-logout" onClick={handleLogout}>
            <span className="logout-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
            </span>
            Logout
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="patient-main">
        <section className="patient-content">
          {/* Greeting area — sits directly on the dashboard background */}
          <div className="patient-greeting-area">
            <div className="greeting-text">
              <h1>Good morning, {loading ? "..." : name} &#x1F44B;</h1>
              <p>Your health, our priority</p>
            </div>
          </div>

          {/* Stat cards — standalone, floating directly on the background */}
          <div className="patient-stats">
            <div className="patient-stat-card upcoming-card">
              <div className="stat-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
              </div>
              <div className="stat-information">
                <span>Upcoming</span>
                <strong>
                  {loading ? "..." : (patient?.upcoming_appointments ?? 0)}
                </strong>
                <small>Appointments</small>
              </div>
            </div>

            <div className="patient-stat-card completed-card">
              <div className="stat-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="stat-information">
                <span>Completed</span>
                <strong>
                  {loading ? "..." : (patient?.completed_appointments ?? 0)}
                </strong>
                <small>Appointments</small>
              </div>
            </div>
          </div>

          {/* Symptoms Section */}
          <section className="symptom-section">
            <h2>How can we help?</h2>

            <textarea
              className="symptom-input"
              placeholder="Describe your symptoms..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />

            <button
              className="analyze-button"
              onClick={handleAnalyzeSymptoms}
              disabled={analyzing}
            >
              {analyzing ? "Analyzing..." : "Analyze Symptoms"}
              <span className="button-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" x2="16.65" y1="21" y2="16.65" />
                </svg>
              </span>
            </button>

            <div className="ai-information">
              <span className="info-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="16" y2="12" />
                  <line x1="12" x2="12.01" y1="8" y2="8" />
                </svg>
              </span>
              <p>
                Our AI analyzes your symptoms and suggests the right department
                and doctor.
              </p>
            </div>
            {aiResult && (
              <div className="ai-result-card">
                <div className="ai-result-header">
                  <span>🩺</span>
                  <h3>AI Recommendation</h3>
                </div>

                <div className="ai-result-content">
                  <div>
                    <strong>Recommended Department</strong>
                    <p>{aiResult.recommended_department}</p>
                  </div>

                  <div>
                    <strong>Recommended Doctor</strong>
                    <p>{aiResult.recommended_doctor?.name}</p>
                  </div>

                  <div>
                    <strong>Experience</strong>
                    <p>{aiResult.recommended_doctor?.experience_years} years</p>
                  </div>

                  <div>
                    <strong>Estimated Waiting Time</strong>
                    <p>
                      {aiResult.recommended_doctor?.estimated_waiting_time}{" "}
                      minutes
                    </p>
                  </div>

                  <div>
                    <strong>Urgency</strong>
                    <p>{aiResult.urgency}</p>
                  </div>
                </div>

                <div className="ai-disclaimer">⚠️ {aiResult.disclaimer}</div>

                <button
                  className="book-recommended-button"
                  onClick={() => setShowBookingForm(true)}
                >
                  Book Appointment
                </button>
                {showBookingForm && (
                  <div className="booking-form">
                    <h3>Book Appointment</h3>

                    <div className="booking-doctor">
                      <strong>Recommended Doctor</strong>
                      <p>{aiResult.recommended_doctor.name}</p>
                      <span>
                        {aiResult.recommended_department} •{" "}
                        {aiResult.recommended_doctor.experience_years} years
                        experience
                      </span>
                    </div>

                    <label>Appointment Date</label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />

                    <label>Appointment Time</label>
                    <input
                      type="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                    />

                    <div className="booking-actions">
                      <button
                        className="cancel-booking-button"
                        onClick={() => setShowBookingForm(false)}
                      >
                        Cancel
                      </button>

                      <button
                        className="confirm-booking-button"
                        onClick={async () => {
                          if (!appointmentDate || !appointmentTime) {
                            alert("Please select appointment date and time.");
                            return;
                          }

                          try {
                            const token = localStorage.getItem("access_token");

                            const appointmentDateTime = `${appointmentDate}T${appointmentTime}:00`;

                            const response = await fetch(
                              "http://127.0.0.1:8000/appointments/",
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                  patient_id: patient?.id || 0,
                                  doctor_id: aiResult.recommended_doctor.id,
                                  appointment_date: appointmentDateTime,
                                  symptoms: symptoms,
                                }),
                              },
                            );

                            const data = await response.json();

                            if (!response.ok) {
                              throw new Error(
                                data.detail || "Failed to book appointment",
                              );
                            }

                            alert("Appointment booked successfully! 🎉");

                            setShowBookingForm(false);
                            setAppointmentDate("");
                            setAppointmentTime("");
                          } catch (error) {
                            console.error("Booking error:", error);
                            alert(
                              error.message || "Unable to book appointment.",
                            );
                          }
                        }}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Weekly Section */}
          <div className="patient-week-section">
            <div className="week-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
            </div>

            <div className="week-information">
              <strong>This Week</strong>
              <span>{weekRange}</span>
            </div>

            <div className="week-navigation">
              <button aria-label="Previous week">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button aria-label="Next week">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Right Panel */}
        <aside className="patient-right-panel">
          {/* Upcoming Appointments */}
          <section className="upcoming-panel">
            <div className="panel-heading">
              <h2>Upcoming Appointments</h2>
              <button className="view-all-btn">View All</button>
            </div>

            {patient?.appointments?.length > 0 ? (
              patient.appointments.map((appointment) => {
                const date = new Date(appointment.appointment_date);

                return (
                  <div className="upcoming-appointment" key={appointment.id}>
                    <div className="upcoming-appointment-doctor">
                      {appointment.doctor_name}
                    </div>

                    <div className="upcoming-appointment-department">
                      {appointment.department}
                      <br></br>
                      {appointment.specialization
                        ? `${appointment.specialization}`
                        : ""}
                    </div>

                    <div className="upcoming-appointment-date">
                      📅{" "}
                      {date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" • "}
                      {date.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="upcoming-empty">
                <div className="upcoming-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                </div>

                <h3>No upcoming appointments</h3>

                <p>
                  You don&apos;t have any upcoming appointments at the moment.
                </p>
              </div>
            )}
          </section>

          {/* Need Help */}
          <section className="help-panel">
            <h2>Need help?</h2>

            <button className="help-item">
              <div className="help-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </div>
              <div className="help-text">
                <strong>Book an Appointment</strong>
                <span>Find and book with specialists</span>
              </div>
              <span className="help-arrow">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </button>

            <button className="help-item">
              <div className="help-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" x2="8" y1="13" y2="13" />
                  <line x1="16" x2="8" y1="17" y2="17" />
                  <line x1="10" x2="8" y1="9" y2="9" />
                </svg>
              </div>
              <div className="help-text">
                <strong>View My Appointments</strong>
                <span>Check upcoming and past visits</span>
              </div>
              <span className="help-arrow">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </button>

            <button className="help-item">
              <div className="help-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="help-text">
                <strong>Update Profile</strong>
                <span>Manage your personal information</span>
              </div>
              <span className="help-arrow">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </button>
          </section>
        </aside>
      </main>
    </div>
  );
}

export default PatientDashboard;
