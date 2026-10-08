import { useEffect, useState } from "react";
import "./DoctorAppointments.css";

function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        "http://127.0.0.1:8000/appointments/doctor",
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
      console.error("Doctor appointments error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const updateStatus = async (appointmentId, status) => {
    try {
      setUpdatingId(appointmentId);

      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `http://127.0.0.1:8000/appointments/${appointmentId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: status,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update status");
      }

      await fetchAppointments();
    } catch (error) {
      console.error("Status update error:", error);
      alert(error.message || "Unable to update appointment status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="doctor-appointments-page">
      <div className="doctor-appointments-header">
        <div>
          <h1>Appointments</h1>
          <p>View and manage your patient appointments.</p>
        </div>
      </div>

      <div className="doctor-appointments-card">
        <div className="doctor-appointments-card-header">
          <div>
            <h2>All Appointments</h2>
            <p>
              {loading
                ? "Loading appointments..."
                : `${appointments.length} appointments`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="doctor-appointments-loading">
            Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          <div className="doctor-appointments-empty">
            No appointments found.
          </div>
        ) : (
          <div className="doctor-appointments-table-wrapper">
            <table className="doctor-appointments-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Symptoms</th>
                  <th>Hospital</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      <strong>{appointment.patient_name}</strong>
                    </td>

                    <td>{formatDate(appointment.appointment_date)}</td>

                    <td>{formatTime(appointment.appointment_date)}</td>

                    <td>{appointment.symptoms || "Not provided"}</td>

                    <td>{appointment.hospital_name}</td>

                    <td>
                      <span
                        className={`doctor-appointment-status ${appointment.status}`}
                      >
                        {appointment.status}
                      </span>
                    </td>

                    <td>
                      {appointment.status === "scheduled" ? (
                        <div className="doctor-appointment-actions">
                          <button
                            className="complete-button"
                            disabled={updatingId === appointment.id}
                            onClick={() =>
                              updateStatus(appointment.id, "completed")
                            }
                          >
                            Complete
                          </button>

                          <button
                            className="cancel-button"
                            disabled={updatingId === appointment.id}
                            onClick={() =>
                              updateStatus(appointment.id, "cancelled")
                            }
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="action-completed">No action</span>
                      )}
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

export default DoctorAppointments;
