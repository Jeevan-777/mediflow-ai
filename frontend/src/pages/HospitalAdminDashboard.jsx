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

  const appointmentChartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Appointments",
        data: [8, 12, 9, 15, 11, 6, 4],
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
          <button className="active">Dashboard</button>
          <button>Doctors</button>
          <button>Appointments</button>
          <button>Departments</button>
          <button>Analytics</button>
          <button>Settings</button>
        </nav>

        <button className="admin-logout">↪ Logout</button>
      </aside>

      <main className="admin-main">
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

          {/* Statistics Cards */}
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

          {/* Appointment Overview */}
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
        </section>
      </main>
    </div>
  );
}

export default HospitalAdminDashboard;
