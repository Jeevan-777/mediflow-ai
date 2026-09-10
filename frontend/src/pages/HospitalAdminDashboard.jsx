import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./HospitalAdminDashboard.css";
import backgroundImage from "../assets/HospitalAdminBackground.png";
import HospitalAdminDoctors from "./HospitalAdminDoctors";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

function HospitalAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [activePage, setActivePage] = useState("dashboard");

  const appointmentChartData = {
    labels: chartData.map((item) => item.day),
    datasets: [
      {
        label: "Appointments",
        data: chartData.map((item) => item.count),
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const appointmentChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const response = await fetch(
          "http://127.0.0.1:8000/appointments/hospital/stats",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load statistics");
        }

        setStats(data);
      } catch (error) {
        console.error("Dashboard stats error:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const response = await fetch(
          "http://127.0.0.1:8000/appointments/hospital/chart",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load chart data");
        }

        setChartData(data.data || []);
      } catch (error) {
        console.error("Appointment chart error:", error);
      }
    };

    fetchChartData();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const response = await fetch(
          "http://127.0.0.1:8000/appointments/hospital",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load appointments");
        }

        setAppointments(data);
      } catch (error) {
        console.error("Hospital appointments error:", error);
      } finally {
        setLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    localStorage.removeItem("role");

    window.location.reload();
  };

  return (
    <div
      className="hospital-admin-dashboard"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>MediFlow AI</h2>
          <span>Hospital Admin</span>
        </div>

        <nav className="admin-nav">
          <button
            className={activePage === "dashboard" ? "active" : ""}
            onClick={() => setActivePage("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={activePage === "doctors" ? "active" : ""}
            onClick={() => setActivePage("doctors")}
          >
            Doctors
          </button>

          <button>Appointments</button>
          <button>Departments</button>
          <button>Analytics</button>
          <button>Settings</button>
        </nav>

        <button className="admin-logout" onClick={handleLogout}>
          ↪ Logout
        </button>
      </aside>

      <main className="admin-main">
        {activePage === "doctors" ? (
          <HospitalAdminDoctors />
        ) : (
          <>
            <header className="admin-header">
              <div>
                <h1>Hello, CityCare Admin</h1>
                <p>Here's what's happening at your hospital today.</p>
              </div>

              <div className="admin-profile">
                <div className="profile-avatar">CA</div>

                <div>
                  <strong>CityCare Admin</strong>
                  <span>Hospital Administrator</span>
                </div>
              </div>
            </header>

            <section className="admin-content">
              <h2>Dashboard Overview</h2>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👨‍⚕️</div>

                  <div>
                    <span>Total Doctors</span>
                    <strong>
                      {loadingStats ? "—" : (stats?.total_doctors ?? 0)}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🟢</div>

                  <div>
                    <span>Active Doctors</span>
                    <strong>
                      {loadingStats ? "—" : (stats?.active_doctors ?? 0)}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📅</div>

                  <div>
                    <span>Total Appointments</span>
                    <strong>
                      {loadingStats ? "—" : (stats?.total_appointments ?? 0)}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📆</div>

                  <div>
                    <span>Today's Appointments</span>
                    <strong>
                      {loadingStats ? "—" : (stats?.todays_appointments ?? 0)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="appointment-overview">
                <div className="section-heading">
                  <div>
                    <h2>Appointment Overview</h2>
                    <p>Appointments scheduled over the past week</p>
                  </div>
                </div>

                <div className="appointment-chart">
                  <Line
                    data={appointmentChartData}
                    options={appointmentChartOptions}
                  />
                </div>
              </div>

              <div className="recent-appointments">
                <div className="section-heading">
                  <div>
                    <h2>Recent Appointments</h2>
                    <p>Latest appointments at your hospital</p>
                  </div>
                </div>

                {loadingAppointments ? (
                  <div className="appointments-loading">
                    Loading appointments...
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="appointments-empty">
                    No appointments found.
                  </div>
                ) : (
                  <div className="appointments-table-wrapper">
                    <table className="appointments-table">
                      <thead>
                        <tr>
                          <th>Patient</th>
                          <th>Doctor</th>
                          <th>Department</th>
                          <th>Date & Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {appointments.slice(0, 6).map((appointment) => {
                          const date = new Date(appointment.appointment_date);

                          return (
                            <tr key={appointment.id}>
                              <td>{appointment.patient_name}</td>

                              <td>{appointment.doctor_name}</td>

                              <td>{appointment.department}</td>

                              <td>
                                {date.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}

                                <span className="table-time">
                                  {date.toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </td>

                              <td>
                                <span
                                  className={`table-status ${appointment.status}`}
                                >
                                  {appointment.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default HospitalAdminDashboard;
