import { useEffect, useState } from "react";
import "./HospitalAdminDoctors.css";

function HospitalAdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingDoctor, setAddingDoctor] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department_id: "",
    specialization: "",
    experience_years: "",
  });

  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [submittingUnavailability, setSubmittingUnavailability] = useState(false);
  const [unavailabilityError, setUnavailabilityError] = useState("");
  const [successBanner, setSuccessBanner] = useState("");

  const [unavailabilityData, setUnavailabilityData] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    reason: "",
  });

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch("http://127.0.0.1:8000/doctors/hospital", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load doctors");
      }

      setDoctors(data);
    } catch (error) {
      console.error("Hospital doctors error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch("http://127.0.0.1:8000/departments/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load departments");
      }

      setDepartments(data);
    } catch (error) {
      console.error("Departments error:", error);
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      department_id: "",
      specialization: "",
      experience_years: "",
    });
  };

  const handleOpenUnavailableModal = (doctor) => {
    setSelectedDoctor(doctor);
    setUnavailabilityError("");
    setUnavailabilityData({
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      reason: "",
    });
    setShowUnavailableModal(true);
  };

  const handleCloseUnavailableModal = () => {
    if (submittingUnavailability) return;
    setShowUnavailableModal(false);
    setSelectedDoctor(null);
    setUnavailabilityError("");
  };

  const handleUnavailableInputChange = (e) => {
    const { name, value } = e.target;

    setUnavailabilityData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (unavailabilityError) {
      setUnavailabilityError("");
    }
  };

  const handleConfirmUnavailability = async (e) => {
    e.preventDefault();
    setUnavailabilityError("");

    const { startDate, startTime, endDate, endTime, reason } = unavailabilityData;

    // 1. Validate required fields
    if (!startDate || !startTime || !endDate || !endTime) {
      const msg = "Please fill in all required fields (Start Date, Start Time, End Date, and End Time).";
      setUnavailabilityError(msg);
      return;
    }

    // 2. Validate valid date/time objects
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      const msg = "Please enter valid date and time values.";
      setUnavailabilityError(msg);
      return;
    }

    // 3. Validate start date/time is in the future
    const now = new Date();
    if (startDateTime <= now) {
      const msg = "Start date and time must be in the future.";
      setUnavailabilityError(msg);
      return;
    }

    // 4. Validate end date/time is later than start date/time
    if (endDateTime <= startDateTime) {
      const msg = "End date and time must be later than the start date and time.";
      setUnavailabilityError(msg);
      return;
    }

    setSubmittingUnavailability(true);

    try {
      const token = localStorage.getItem("access_token");
      const formatTime = (timeStr) => (timeStr.length === 5 ? `${timeStr}:00` : timeStr);

      const payload = {
        start_at: `${startDate}T${formatTime(startTime)}`,
        end_at: `${endDate}T${formatTime(endTime)}`,
        reason: reason.trim() || null,
      };

      const response = await fetch(
        `http://127.0.0.1:8000/doctors/hospital/${selectedDoctor.id}/unavailability`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to mark doctor unavailable");
      }

      const successMsg = `${data.message}. Reassigned appointments: ${data.reassigned_count}`;
      setSuccessBanner(successMsg);
      alert(successMsg);

      await fetchDoctors();

      setShowUnavailableModal(false);
      setSelectedDoctor(null);
      setUnavailabilityData({
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        reason: "",
      });
    } catch (error) {
      console.error("Mark doctor unavailable error:", error);
      setUnavailabilityError(error.message);
      alert(error.message);
    } finally {
      setSubmittingUnavailability(false);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();

    if (!formData.department_id) {
      alert("Please select a department.");
      return;
    }

    setAddingDoctor(true);

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch("http://127.0.0.1:8000/doctors/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          department_id: Number(formData.department_id),
          specialization: formData.specialization,
          experience_years: Number(formData.experience_years),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to add doctor");
      }

      alert("Doctor added successfully!");

      await fetchDoctors();

      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error("Add doctor error:", error);
      alert(error.message);
    } finally {
      setAddingDoctor(false);
    }
  };

  return (
    <div className="hospital-admin-doctors">
      <div className="doctors-page-header">
        <div>
          <h1>Doctors</h1>
          <p>Manage doctors at your hospital.</p>
        </div>

        <button
          className="add-doctor-button"
          onClick={() => setShowAddForm(true)}
        >
          + Add Doctor
        </button>
      </div>

      <div className="doctors-content">
        <div className="doctors-section-header">
          <div>
            <h2>Hospital Doctors</h2>
            <p>
              {loading
                ? "Loading doctors..."
                : `${doctors.length} doctors registered`}
            </p>
          </div>
        </div>

        {successBanner && (
          <div className="doctors-success-banner" role="status">
            <span>✓ {successBanner}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setSuccessBanner("")}
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="doctors-loading">Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <div className="doctors-empty">No doctors found.</div>
        ) : (
          <div className="doctors-table-wrapper">
            <table className="doctors-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Specialization</th>
                  <th>Experience</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {doctors.map((doctor) => (
                  <tr key={doctor.id}>
                    <td>
                      <div className="doctor-name">{doctor.name}</div>
                    </td>

                    <td>{doctor.department}</td>

                    <td>{doctor.specialization || "—"}</td>

                    <td>{doctor.experience_years} years</td>

                    <td>
                      <div className="doctor-status-actions">
                        <span
                          className={`doctor-status ${
                            doctor.is_active ? "active" : "inactive"
                          }`}
                        >
                          {doctor.is_active ? "Active" : "Inactive"}
                        </span>

                        <button
                          className={`doctor-toggle-button ${
                            doctor.is_active ? "deactivate" : "activate"
                          }`}
                          onClick={async () => {
                            try {
                              const token =
                                localStorage.getItem("access_token");

                              const action = doctor.is_active
                                ? "deactivate"
                                : "activate";

                              const response = await fetch(
                                `http://127.0.0.1:8000/doctors/hospital/${doctor.id}/${action}`,
                                {
                                  method: "PATCH",
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                },
                              );

                              const data = await response.json();

                              if (!response.ok) {
                                throw new Error(
                                  data.detail || `Failed to ${action} doctor`,
                                );
                              }

                              await fetchDoctors();
                            } catch (error) {
                              console.error("Doctor status error:", error);
                              alert(error.message);
                            }
                          }}
                        >
                          {doctor.is_active ? "Deactivate" : "Activate"}
                        </button>

                        {doctor.is_active && (
                          <button
                            type="button"
                            className="doctor-unavailable-button"
                            onClick={() => handleOpenUnavailableModal(doctor)}
                          >
                            Mark Unavailable
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddForm && (
        <div
          className="doctor-modal-overlay"
          onClick={() => {
            if (!addingDoctor) {
              setShowAddForm(false);
            }
          }}
        >
          <div className="doctor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="doctor-modal-header">
              <div>
                <h2>Add New Doctor</h2>
                <p>Add a doctor to your hospital.</p>
              </div>

              <button
                className="close-modal-button"
                onClick={() => setShowAddForm(false)}
                disabled={addingDoctor}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddDoctor}>
              <div className="doctor-form-grid">
                <div className="form-field">
                  <label>Doctor Name</label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Enter doctor name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Email</label>

                  <input
                    type="email"
                    name="email"
                    placeholder="doctor@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Password</label>

                  <input
                    type="password"
                    name="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Department</label>

                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Department</option>

                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Specialization</label>

                  <input
                    type="text"
                    name="specialization"
                    placeholder="e.g. Cardiologist"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Experience</label>

                  <input
                    type="number"
                    name="experience_years"
                    placeholder="Years"
                    min="0"
                    value={formData.experience_years}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="doctor-form-actions">
                <button
                  type="button"
                  className="cancel-doctor-button"
                  onClick={() => setShowAddForm(false)}
                  disabled={addingDoctor}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-doctor-button"
                  disabled={addingDoctor}
                >
                  {addingDoctor ? "Adding..." : "Add Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUnavailableModal && selectedDoctor && (
        <div
          className="doctor-modal-overlay"
          onClick={() => {
            if (!submittingUnavailability) {
              handleCloseUnavailableModal();
            }
          }}
        >
          <div className="doctor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="doctor-modal-header">
              <div>
                <h2>Mark Doctor Unavailable</h2>
                <p>
                  Schedule unavailable period for{" "}
                  <strong>{selectedDoctor.name}</strong>
                </p>
              </div>

              <button
                type="button"
                className="close-modal-button"
                onClick={handleCloseUnavailableModal}
                disabled={submittingUnavailability}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="doctor-info-banner">
              <div className="doctor-info-item">
                <span className="info-label">Doctor Name</span>
                <span className="info-value">{selectedDoctor.name}</span>
              </div>
              <div className="doctor-info-item">
                <span className="info-label">Department</span>
                <span className="info-value">
                  {selectedDoctor.department || "General"}
                </span>
              </div>
              {selectedDoctor.specialization && (
                <div className="doctor-info-item">
                  <span className="info-label">Specialization</span>
                  <span className="info-value">
                    {selectedDoctor.specialization}
                  </span>
                </div>
              )}
            </div>

            {unavailabilityError && (
              <div className="doctor-modal-error" role="alert">
                <span>⚠️</span>
                <span>{unavailabilityError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmUnavailability}>
              <div className="doctor-form-grid">
                <div className="form-field">
                  <label htmlFor="unavail-start-date">Start Date *</label>
                  <input
                    id="unavail-start-date"
                    type="date"
                    name="startDate"
                    value={unavailabilityData.startDate}
                    onChange={handleUnavailableInputChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="unavail-start-time">Start Time *</label>
                  <input
                    id="unavail-start-time"
                    type="time"
                    name="startTime"
                    value={unavailabilityData.startTime}
                    onChange={handleUnavailableInputChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="unavail-end-date">End Date *</label>
                  <input
                    id="unavail-end-date"
                    type="date"
                    name="endDate"
                    value={unavailabilityData.endDate}
                    onChange={handleUnavailableInputChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="unavail-end-time">End Time *</label>
                  <input
                    id="unavail-end-time"
                    type="time"
                    name="endTime"
                    value={unavailabilityData.endTime}
                    onChange={handleUnavailableInputChange}
                    required
                  />
                </div>

                <div className="form-field full-width">
                  <label htmlFor="unavail-reason">Reason (optional)</label>
                  <input
                    id="unavail-reason"
                    type="text"
                    name="reason"
                    placeholder="e.g. Vacation, medical leave, conference"
                    value={unavailabilityData.reason}
                    onChange={handleUnavailableInputChange}
                  />
                </div>
              </div>

              <div className="doctor-form-actions">
                <button
                  type="button"
                  className="cancel-doctor-button"
                  onClick={handleCloseUnavailableModal}
                  disabled={submittingUnavailability}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-doctor-button confirm-unavailability-button"
                  disabled={submittingUnavailability}
                >
                  {submittingUnavailability
                    ? "Confirming..."
                    : "Confirm Unavailability"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HospitalAdminDoctors;
