import React, { useEffect, useState } from "react";
import "./DoctorPatients.css";
import doctorAvatar from "../assets/doctor_avatar.png";

function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
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
        throw new Error(data.detail || "Unable to load patients");
      }

      const uniquePatients = [];

      data.forEach((appointment) => {
        const exists = uniquePatients.find(
          (patient) => patient.patient_id === appointment.patient_id,
        );

        if (!exists) {
          uniquePatients.push({
            patient_id: appointment.patient_id,
            patient_name: appointment.patient_name,
            appointment_date: appointment.appointment_date,
            symptoms: appointment.symptoms,
          });
        }
      });

      setPatients(uniquePatients);
    } catch (err) {
      console.error("Doctor patients error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="doctor-patients-loading">Loading patients...</div>;
  }

  if (error) {
    return (
      <div className="doctor-patients-loading">
        <h2>Unable to load patients</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="doctor-patients-page">
      <div className="doctor-patients-header">
        <div>
          <h1>Patients</h1>
          <p>View patients who have appointments with you.</p>
        </div>
      </div>

      <div className="doctor-patients-layout">
        <div className="doctor-patients-card">
          <div className="doctor-patients-card-header">
            <h2>My Patients</h2>
            <p>{patients.length} patients</p>
          </div>

          {patients.length === 0 ? (
            <div className="doctor-patients-empty">No patients found.</div>
          ) : (
            <div className="doctor-patients-table-wrapper">
              <table className="doctor-patients-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Last Appointment</th>
                    <th>Symptoms</th>
                  </tr>
                </thead>

                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.patient_id}>
                      <td>
                        <strong>{patient.patient_name}</strong>
                      </td>

                      <td>
                        {new Date(patient.appointment_date).toLocaleDateString(
                          "en-US",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </td>

                      <td>{patient.symptoms || "General consultation"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="doctor-patients-doctor">
          <img src={doctorAvatar} alt="Doctor" />

          <h2>Patient Care</h2>

          <p>Manage and review the patients who have appointments with you.</p>
        </div>
      </div>
    </div>
  );
}

export default DoctorPatients;
