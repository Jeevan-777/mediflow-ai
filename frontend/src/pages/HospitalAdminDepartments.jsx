import { useEffect, useState } from "react";
import "./HospitalAdminDepartments.css";

function HospitalAdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        console.error("Hospital departments error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  return (
    <div className="hospital-admin-departments">
      <div className="departments-page-header">
        <div>
          <h1>Departments</h1>
          <p>View departments available at your hospital.</p>
        </div>
      </div>

      <div className="departments-content">
        <div className="departments-section-header">
          <div>
            <h2>Hospital Departments</h2>
            <p>
              {loading
                ? "Loading departments..."
                : `${departments.length} departments available`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="departments-loading">Loading departments...</div>
        ) : departments.length === 0 ? (
          <div className="departments-empty">No departments found.</div>
        ) : (
          <div className="departments-grid">
            {departments.map((department) => (
              <div className="department-card" key={department.id}>
                <div>
                  <h3>{department.name}</h3>
                  <p>{department.description || "Medical department"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HospitalAdminDepartments;
