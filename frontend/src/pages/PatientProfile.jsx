import { useEffect, useState } from "react";
import "./PatientProfile.css";

const API_BASE = "http://127.0.0.1:8000";

/* ── Inline SVG Icons ─────────────────────────────────── */
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconSave = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IconHeart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    <polyline points="2 13 5 13 7 9 9 17 11 13 14 13" strokeWidth="1.4" />
  </svg>
);

/* ── Helpers ─────────────────────────────────────────── */
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ── Component ───────────────────────────────────────── */
function PatientProfile({ onBackToDashboard }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    date_of_birth: "",
    gender: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  /* ── Load profile on mount ─── */
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setErrorMsg("You are not logged in.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/patients/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || "Failed to load profile");
        }

        setForm({
          name: data.name || "",
          email: data.email || "",
          date_of_birth: data.date_of_birth || "",
          gender: data.gender || "",
          phone: data.phone || "",
        });
      } catch (err) {
        setErrorMsg(err.message || "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /* ── Handle input change ─── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuccessMsg("");
    setErrorMsg("");
  };

  /* ── Save profile ─── */
  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!form.name.trim()) {
      setErrorMsg("Name is required.");
      return;
    }
    if (!form.email.trim()) {
      setErrorMsg("Email is required.");
      return;
    }
    if (!validateEmail(form.email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("access_token");

    try {
      const res = await fetch(`${API_BASE}/patients/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          date_of_birth: form.date_of_birth || null,
          gender: form.gender || null,
          phone: form.phone || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to save profile");
      }

      /* Sync localStorage so the dashboard greeting reflects the new name */
      localStorage.setItem("name", form.name.trim());
      localStorage.setItem("email", form.email.trim());

      setSuccessMsg("Profile updated successfully!");
    } catch (err) {
      setErrorMsg(err.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Render ─── */
  return (
    <div className="pp-shell">

      {/* ── Sidebar ── */}
      <aside className="pp-sidebar">
        <div className="pp-brand">
          <div className="pp-brand-circle">
            <span className="pp-brand-icon"><IconHeart /></span>
          </div>
          <div className="pp-brand-name">
            Medi<span>Flow</span> AI
          </div>
        </div>

        <nav className="pp-nav">
          <button className="pp-nav-item" onClick={onBackToDashboard}>
            <span className="pp-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            Dashboard
          </button>

          <button className="pp-nav-item pp-nav-active">
            <span className="pp-nav-icon"><IconUser /></span>
            Profile
          </button>
        </nav>

        <div className="pp-sidebar-deco" />
      </aside>

      {/* ── Header ── */}
      <header className="pp-header">
        <div className="pp-header-title">
          <span className="pp-header-icon"><IconUser /></span>
          <span>My Profile</span>
        </div>

        <button className="pp-back-btn" onClick={onBackToDashboard}>
          <IconArrowLeft />
          Back to Dashboard
        </button>
      </header>

      {/* ── Main ── */}
      <main className="pp-main">
        {loading ? (
          <div className="pp-loading">
            <div className="pp-spinner" />
            <p>Loading your profile&hellip;</p>
          </div>
        ) : (
          <form className="pp-form-card" onSubmit={handleSave} noValidate>

            {/* Card header */}
            <div className="pp-card-header">
              <div className="pp-avatar-large"><IconUser /></div>
              <div>
                <h2 className="pp-card-title">{form.name || "Your Profile"}</h2>
                <p className="pp-card-subtitle">Manage your personal information</p>
              </div>
            </div>

            {/* Banners */}
            {successMsg && (
              <div className="pp-banner pp-banner-success" role="status">
                <span className="pp-banner-icon"><IconCheck /></span>
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="pp-banner pp-banner-error" role="alert">
                &#9888; {errorMsg}
              </div>
            )}

            {/* Fields */}
            <div className="pp-fields">
              <div className="pp-field-group">
                <label className="pp-label" htmlFor="pp-name">
                  Full Name <span className="pp-required">*</span>
                </label>
                <input id="pp-name" className="pp-input" type="text"
                  name="name" value={form.name} onChange={handleChange}
                  placeholder="Your full name" autoComplete="name" required />
              </div>

              <div className="pp-field-group">
                <label className="pp-label" htmlFor="pp-email">
                  Email Address <span className="pp-required">*</span>
                </label>
                <input id="pp-email" className="pp-input" type="email"
                  name="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com" autoComplete="email" required />
              </div>

              <div className="pp-field-group">
                <label className="pp-label" htmlFor="pp-dob">
                  Date of Birth
                </label>
                <input id="pp-dob" className="pp-input" type="date"
                  name="date_of_birth" value={form.date_of_birth}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]} />
              </div>

              <div className="pp-field-group">
                <label className="pp-label" htmlFor="pp-gender">Gender</label>
                <select id="pp-gender" className="pp-input pp-select"
                  name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="pp-field-group pp-field-full">
                <label className="pp-label" htmlFor="pp-phone">
                  Phone Number
                </label>
                <input id="pp-phone" className="pp-input" type="tel"
                  name="phone" value={form.phone} onChange={handleChange}
                  placeholder="+91 00000 00000" autoComplete="tel" maxLength={20} />
              </div>
            </div>

            {/* Actions */}
            <div className="pp-actions">
              <button type="button" className="pp-btn-secondary"
                onClick={onBackToDashboard}>
                Cancel
              </button>
              <button type="submit" className="pp-btn-primary" disabled={saving}>
                <span className="pp-btn-icon"><IconSave /></span>
                {saving ? "Saving\u2026" : "Save Changes"}
              </button>
            </div>

          </form>
        )}
      </main>
    </div>
  );
}

export default PatientProfile;
