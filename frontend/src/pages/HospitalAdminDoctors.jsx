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
    </div>
  );
}

export default HospitalAdminDoctors;
