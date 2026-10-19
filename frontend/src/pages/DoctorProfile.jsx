import React, { useEffect, useState } from "react";
import "./DoctorProfile.css";
import doctorAvatar from "../assets/doctor_avatar.png";

function DoctorProfile({ onBackToDashboard }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const response = await fetch("http://127.0.0.1:8000/doctors/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load doctor profile.");
      }

      setProfile(data);
    } catch (err) {
      console.error("Doctor profile fetch error:", err);
      setError(err.message || "Failed to load doctor profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="doctor-profile-page">
        <div className="doctor-profile-header">
          <div>
            <h1>Doctor Profile</h1>
            <p>View your professional credentials and account details.</p>
          </div>
          {onBackToDashboard && (
            <button className="doctor-back-btn" onClick={onBackToDashboard}>
              ← Back to Dashboard
            </button>
          )}
        </div>
        <div className="doctor-profile-loading">
          <h2>Loading Profile...</h2>
          <p>Retrieving your doctor profile from the system.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doctor-profile-page">
        <div className="doctor-profile-header">
          <div>
            <h1>Doctor Profile</h1>
            <p>View your professional credentials and account details.</p>
          </div>
          {onBackToDashboard && (
            <button className="doctor-back-btn" onClick={onBackToDashboard}>
              ← Back to Dashboard
            </button>
          )}
        </div>
        <div className="doctor-profile-error">
          <h2>Unable to Load Profile</h2>
          <p>{error}</p>
          <button className="doctor-profile-retry-btn" onClick={fetchProfile}>
            ↻ Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="doctor-profile-page">
      {/* Header */}
      <div className="doctor-profile-header">
        <div>
          <h1>Doctor Profile</h1>
          <p>View your professional credentials and account details.</p>
        </div>
        {onBackToDashboard && (
          <button className="doctor-back-btn" onClick={onBackToDashboard}>
            ← Back to Dashboard
          </button>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="doctor-profile-layout">
        {/* Left Side: Summary Card */}
        <div className="doctor-profile-card-summary">
          <div className="doctor-profile-avatar-wrapper">
            <img
              src={doctorAvatar}
              alt={profile.name}
              className="doctor-profile-avatar-img"
            />
            <span
              className={`doctor-profile-status-badge ${profile.is_active ? "active" : "inactive"
                }`}
            >
              {profile.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          <h2 className="doctor-profile-name">{profile.name}</h2>
          <p className="doctor-profile-spec">
            {profile.specialization || "Medical Specialist"}
          </p>

          <div
            className={`doctor-profile-badge-pill ${profile.is_active ? "active" : "inactive"
              }`}
          >
            <span className="doctor-profile-pill-dot" />
            {profile.is_active ? "Account Active" : "Account Inactive"}
          </div>

          <div className="doctor-profile-summary-meta">
            <div className="doctor-profile-meta-row">
              <span className="meta-icon">🏥</span>
              <span>
                Hospital: <strong>{profile.hospital_name || "N/A"}</strong>
              </span>
            </div>
            <div className="doctor-profile-meta-row">
              <span className="meta-icon">⚕</span>
              <span>
                Dept: <strong>{profile.department || "General"}</strong>
              </span>
            </div>
            <div className="doctor-profile-meta-row">
              <span className="meta-icon">💼</span>
              <span>
                Experience:{" "}
                <strong>
                  {profile.experience_years}{" "}
                  {profile.experience_years === 1 ? "Year" : "Years"}
                </strong>
              </span>
            </div>
            <div className="doctor-profile-meta-row">
              <span className="meta-icon">✉</span>
              <span>
                <strong>{profile.email}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed Info Panels */}
        <div className="doctor-profile-details">
          {/* Professional Credentials */}
          <div className="doctor-profile-panel">
            <div className="doctor-profile-panel-header">
              <h2>Professional Information</h2>
              <p>Your hospital affiliation and medical practice specialization</p>
            </div>
            <div className="doctor-profile-fields-grid">
              <div className="doctor-profile-field">
                <span className="doctor-profile-label">Specialization</span>
                <div className="doctor-profile-value">
                  {profile.specialization || "Not specified"}
                </div>
              </div>

              <div className="doctor-profile-field">
                <span className="doctor-profile-label">Department</span>
                <div className="doctor-profile-value">
                  {profile.department || "Not specified"}
                </div>
              </div>

              <div className="doctor-profile-field">
                <span className="doctor-profile-label">Years of Experience</span>
                <div className="doctor-profile-value">
                  {profile.experience_years}{" "}
                  {profile.experience_years === 1 ? "Year" : "Years"}
                </div>
              </div>

              <div className="doctor-profile-field">
                <span className="doctor-profile-label">Hospital Affiliation</span>
                <div className="doctor-profile-value">
                  {profile.hospital_name || "Not specified"}
                </div>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="doctor-profile-panel">
            <div className="doctor-profile-panel-header">
              <h2>Account Information</h2>
              <p>Personal identification and contact details</p>
            </div>
            <div className="doctor-profile-fields-grid">
              <div className="doctor-profile-field">
                <span className="doctor-profile-label">Doctor Name</span>
                <div className="doctor-profile-value">{profile.name}</div>
              </div>

              <div className="doctor-profile-field">
                <span className="doctor-profile-label">Email Address</span>
                <div className="doctor-profile-value">{profile.email}</div>
              </div>

              <div className="doctor-profile-field">
                <span className="doctor-profile-label">Account Status</span>
                <div className="doctor-profile-value">
                  <span
                    className={`doctor-status-tag ${profile.is_active ? "active" : "inactive"
                      }`}
                  >
                    ● {profile.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="doctor-profile-field">
                <span className="doctor-profile-label">Doctor ID</span>
                <div className="doctor-profile-value">#{profile.id}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorProfile;
