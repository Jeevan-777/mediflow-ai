import { useEffect, useState } from "react";

function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const response = await fetch(
          "http://127.0.0.1:8000/appointments/patient",
          {
            method: "GET",
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
        console.error("Appointments error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  if (loading) {
    return <div>Loading appointments...</div>;
  }

  return (
    <div>
      <h1>My Appointments</h1>

      {appointments.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        appointments.map((appointment) => {
          const date = new Date(appointment.appointment_date);

          return (
            <div key={appointment.id}>
              <h3>{appointment.doctor_name}</h3>

              <p>{appointment.department}</p>

              <p>
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
              </p>

              <p>Status: {appointment.status}</p>

              {appointment.symptoms && <p>Symptoms: {appointment.symptoms}</p>}
            </div>
          );
        })
      )}
    </div>
  );
}

export default PatientAppointments;
