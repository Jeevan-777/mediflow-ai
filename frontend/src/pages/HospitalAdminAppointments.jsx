import { useEffect, useState } from "react";
import "./HospitalAdminAppointments.css";

function HospitalAdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="hospital-admin-appointments">
      <div className="appointments-page-header">
        <div>
          <h1>Appointments</h1>
          <p>View appointments scheduled at your hospital.</p>
        </div>
      </div>

      <div className="appointments-content">
        <div className="appointments-section-header">
          <div>
            <h2>Hospital Appointments</h2>
            <p>
              {loading
                ? "Loading appointments..."
                : `${appointments.length} appointments found`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="appointments-loading">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="appointments-empty">No appointments found.</div>
        ) : (
          <div className="admin-appointments-table-wrapper">
            <table className="admin-appointments-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      <div className="appointment-patient">
                        {appointment.patient_name}
                      </div>
                    </td>

                    <td>{appointment.doctor_name}</td>

                    <td>{appointment.department}</td>

                    <td>{formatDate(appointment.appointment_date)}</td>

                    <td>{formatTime(appointment.appointment_date)}</td>

                    <td>
                      <span
                        className={`admin-appointment-status ${appointment.status}`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default HospitalAdminAppointments;
