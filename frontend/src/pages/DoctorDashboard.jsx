import React, { useEffect, useState } from "react";
import "./DoctorDashboard.css";
import DoctorAppointments from "./DoctorAppointments";
import doctorAvatar from "../assets/doctor_avatar.png";
import doctorBanner from "../assets/doctor_banner.png";

function DoctorDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("dashboard");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch("http://127.0.0.1:8000/doctors/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load dashboard");
      }

      setDashboard(data);
    } catch (err) {
      console.error("Doctor dashboard error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="doctor-loading">
        <h2>Loading Doctor Dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doctor-loading">
        <h2>Unable to load dashboard</h2>
        <p>{error}</p>
      </div>
    );
  }

  const doctor = dashboard.doctor;
  const statistics = dashboard.statistics;
  const appointments = dashboard.appointments;

  return (
    <div className="doctor-dashboard">
      {/* SIDEBAR */}
      <aside className="doctor-sidebar">
        <div className="doctor-logo">
          <div className="logo-heart">♡</div>

          <h2>
            Medi<span>Flow</span> AI
          </h2>
        </div>

        <nav>
          <button
            className={`sidebar-item ${
              activePage === "dashboard" ? "active" : ""
            }`}
            onClick={() => setActivePage("dashboard")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className={`sidebar-item ${
              activePage === "appointments" ? "active" : ""
            }`}
            onClick={() => setActivePage("appointments")}
          >
            <span>●</span>
            Appointments
          </button>

          <button className="sidebar-item">
            <span>♟</span>
            Patients
          </button>

          <button className="sidebar-item">
            <span>●</span>
            Profile
          </button>

          <button className="sidebar-item">
            <span>✉</span>
            Messages
          </button>

          <button className="sidebar-item">
            <span>▥</span>
            Reports
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          ⇥ Logout
        </button>
      </aside>

      {/* MAIN */}
      <main className="doctor-main">
        {activePage === "appointments" ? (
          <DoctorAppointments />
        ) : (
          <>
            {/* LEFT CONTENT */}
            <div className="doctor-content">
              {/* HEADER */}
              <header className="dashboard-header">
                <div>
                  <h1>Dashboard</h1>

                  <p>
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="header-actions">
                  <button className="today-btn">Today⌄</button>

                  <button className="add-note-btn">＋ Add Note</button>
                </div>
              </header>

              {/* WELCOME */}
              <section className="welcome-banner">
                <img src={doctorBanner} alt="Doctor" />

                <div className="welcome-text">
                  <p>Welcome back,</p>

                  <h2>Dr. {doctor.name}</h2>

                  <span>Have a productive day!</span>
                </div>
              </section>

              {/* STATISTICS */}
              <section className="stats-grid">
                <div className="stat-card blue">
                  <div className="stat-icon">👥</div>

                  <div>
                    <p>Total Patients</p>

                    <h2>{statistics.total_patients}</h2>

                    <small>Unique patients</small>
                  </div>
                </div>

                <div className="stat-card green">
                  <div className="stat-icon">▣</div>

                  <div>
                    <p>Today's Appointments</p>

                    <h2>{statistics.today_appointments}</h2>

                    <small>Scheduled today</small>
                  </div>
                </div>

                <div className="stat-card pink">
                  <div className="stat-icon">●</div>

                  <div>
                    <p>Completed</p>

                    <h2>{statistics.completed}</h2>

                    <small>Total completed</small>
                  </div>
                </div>

                <div className="stat-card purple">
                  <div className="stat-icon">◷</div>

                  <div>
                    <p>Upcoming</p>

                    <h2>{statistics.upcoming}</h2>

                    <small>Scheduled appointments</small>
                  </div>
                </div>
              </section>

              {/* TODAY'S APPOINTMENTS */}
              <section className="appointments-card">
                <div className="section-header">
                  <h2>Today's Appointments</h2>

                  <button onClick={() => setActivePage("appointments")}>
                    View All →
                  </button>
                </div>

                <div className="appointment-table">
                  <div className="table-header">
                    <span>Time</span>
                    <span>Patient Name</span>
                    <span>Age</span>
                    <span>Symptoms</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>

                  {appointments.length === 0 ? (
                    <div className="no-appointments">
                      No appointments scheduled for today.
                    </div>
                  ) : (
                    appointments.map((appointment) => (
                      <Appointment
                        key={appointment.id}
                        appointment={appointment}
                      />
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN */}
            <aside className="doctor-right">
              {/* PROFILE */}
              <section className="profile-card">
                <div className="profile-title">
                  <h2>My Profile</h2>
                  <span>🔔</span>
                </div>

                <img
                  src={doctorAvatar}
                  alt="Doctor Avatar"
                  className="doctor-avatar"
                />

                <h2>Dr. {doctor.name}</h2>

                <p className="specialization">
                  {doctor.specialization || "Doctor"}
                </p>

                <div className="profile-info">
                  <p>
                    🏥
                    <span>{doctor.hospital_name}</span>
                  </p>

                  <p>
                    ⚕<span>{doctor.department}</span>
                  </p>

                  <p>
                    💼
                    <span>{doctor.experience_years} Years Experience</span>
                  </p>

                  <p>
                    ✉<span>{doctor.email}</span>
                  </p>
                </div>

                <button className="profile-btn">View Profile →</button>
              </section>

              {/* UPCOMING */}
              <section className="upcoming-card">
                <div className="section-header">
                  <h2>Upcoming Appointments</h2>

                  <button onClick={() => setActivePage("appointments")}>
                    View All
                  </button>
                </div>

                {appointments
                  .filter((appointment) => appointment.status === "scheduled")
                  .slice(0, 3)
                  .map((appointment) => (
                    <div className="upcoming-item" key={appointment.id}>
                      <div className="patient-avatar">👤</div>

                      <div>
                        <strong>{appointment.patient_name}</strong>

                        <p>
                          {new Date(
                            appointment.appointment_date,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <span>
                        {appointment.symptoms || "General consultation"}
                      </span>
                    </div>
                  ))}
              </section>

              {/* PATIENT STATISTICS */}
              <section className="statistics-card">
                <div className="section-header">
                  <h2>Patient Statistics</h2>

                  <button>This Week⌄</button>
                </div>

                <div className="chart">
                  <div className="chart-line">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span className="highest"></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>

                <div className="chart-days">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </section>
            </aside>
          </>
        )}
      </main>
    </div>
  );
}

/* APPOINTMENT COMPONENT */

function Appointment({ appointment }) {
  const age = appointment.date_of_birth
    ? calculateAge(appointment.date_of_birth)
    : "-";

  return (
    <div className="appointment-row">
      <span>
        {new Date(appointment.appointment_date).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>

      <strong>{appointment.patient_name}</strong>

      <span>{age}</span>

      <span>{appointment.symptoms || "General consultation"}</span>

      <span>
        <b className={`status ${appointment.status}`}>{appointment.status}</b>
      </span>

      <button className="view-btn">View</button>
    </div>
  );
}

function calculateAge(dateOfBirth) {
  const today = new Date();
  const birth = new Date(dateOfBirth);

  let age = today.getFullYear() - birth.getFullYear();

  const monthDifference = today.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

export default DoctorDashboard;
