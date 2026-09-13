import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import "./HospitalAdminAnalytics.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

function HospitalAdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const [statsResponse, chartResponse] = await Promise.all([
          fetch("http://127.0.0.1:8000/appointments/hospital/stats", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("http://127.0.0.1:8000/appointments/hospital/chart", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const statsData = await statsResponse.json();
        const chartResult = await chartResponse.json();

        if (!statsResponse.ok) {
          throw new Error(statsData.detail || "Failed to load statistics");
        }

        if (!chartResponse.ok) {
          throw new Error(chartResult.detail || "Failed to load chart data");
        }

        setStats(statsData);
        setChartData(chartResult.data || []);
      } catch (error) {
        console.error("Hospital analytics error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const appointmentChartData = {
    labels: chartData.map((item) => item.day),
    datasets: [
      {
        label: "Appointments",
        data: chartData.map((item) => item.count),
        borderWidth: 1,
        borderRadius: 6,
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

  return (
    <div className="hospital-admin-analytics">
      <div className="analytics-page-header">
        <div>
          <h1>Analytics</h1>
          <p>Monitor appointment activity at your hospital.</p>
        </div>
      </div>

      <div className="analytics-content">
        <div className="analytics-section-header">
          <h2>Hospital Overview</h2>
          <p>Current activity and appointment statistics.</p>
        </div>

        <div className="analytics-stats-grid">
          <div className="analytics-stat-card">
            <span>Total Doctors</span>
            <strong>{loading ? "—" : (stats?.total_doctors ?? 0)}</strong>
          </div>

          <div className="analytics-stat-card">
            <span>Active Doctors</span>
            <strong>{loading ? "—" : (stats?.active_doctors ?? 0)}</strong>
          </div>

          <div className="analytics-stat-card">
            <span>Total Appointments</span>
            <strong>{loading ? "—" : (stats?.total_appointments ?? 0)}</strong>
          </div>

          <div className="analytics-stat-card">
            <span>Today's Appointments</span>
            <strong>{loading ? "—" : (stats?.todays_appointments ?? 0)}</strong>
          </div>
        </div>

        <div className="analytics-chart-card">
          <div className="analytics-chart-header">
            <div>
              <h2>Appointment Trends</h2>
              <p>Appointments over the past 7 days.</p>
            </div>
          </div>

          <div className="analytics-chart">
            <Bar
              data={appointmentChartData}
              options={appointmentChartOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HospitalAdminAnalytics;
