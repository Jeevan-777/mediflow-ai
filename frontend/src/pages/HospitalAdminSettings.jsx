import { useEffect, useState } from "react";
import "./HospitalAdminSettings.css";

function HospitalAdminSettings() {
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHospital = async () => {
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
          throw new Error(data.detail || "Failed to load hospital information");
        }

        setHospital(data);
      } catch (error) {
        console.error("Hospital settings error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHospital();
  }, []);

  return (
    <div className="hospital-admin-settings">
      <div className="settings-page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your hospital administration details.</p>
        </div>
      </div>

      <div className="settings-content">
        <div className="settings-card">
          <div className="settings-card-header">
            <h2>Hospital Information</h2>
            <p>Information about your hospital.</p>
          </div>

          {loading ? (
            <div className="settings-loading">
              Loading hospital information...
            </div>
          ) : (
            <div className="settings-fields">
              <div className="settings-field">
                <label>Hospital Name</label>
                <div className="settings-value">
                  {hospital?.hospital_name || "CityCare Hospital"}
                </div>
              </div>

              <div className="settings-field">
                <label>Hospital ID</label>
                <div className="settings-value">
                  {hospital?.hospital_id || "—"}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <h2>Administrator Information</h2>
            <p>Details of the current hospital administrator.</p>
          </div>

          <div className="settings-fields">
            <div className="settings-field">
              <label>Name</label>
              <div className="settings-value">
                {localStorage.getItem("name") || "CityCare Admin"}
              </div>
            </div>

            <div className="settings-field">
              <label>Email</label>
              <div className="settings-value">
                {localStorage.getItem("email") || "admin@citycare.com"}
              </div>
            </div>

            <div className="settings-field">
              <label>Role</label>
              <div className="settings-value">Hospital Administrator</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HospitalAdminSettings;
