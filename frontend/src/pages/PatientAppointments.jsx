import { useEffect, useState } from "react";
import "./PatientAppointments.css";

/* ── Inline SVG Icons ── */
const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <line x1="8" y1="14" x2="11" y2="14"/><line x1="13" y1="14" x2="16" y2="14"/>
    <line x1="8" y1="18" x2="11" y2="18"/><line x1="13" y1="18" x2="16" y2="18"/>
  </svg>
);
const IconHourglass = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 22h14M5 2h14M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/>
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);
const IconBuilding = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M5 21V7l7-4 7 4v14"/>
    <path d="M9 21v-4h6v4"/>
    <line x1="10" y1="11" x2="14" y2="11"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
  </svg>
);
const IconPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconCal = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IconDoc = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
);

/* ── Donut Chart ── */
const DonutChart = ({ scheduled, completed, cancelled, total }) => {
  if (total === 0) {
    return <p className="no-data-text">No appointment data yet.</p>;
  }

  const R = 38;
  const C = 2 * Math.PI * R;

  const seg = (val) => (val / total) * C;
  const schedLen = seg(scheduled);
  const compLen  = seg(completed);
  const cancLen  = seg(cancelled);

  // offsets: each segment starts where previous ended, rotated from top
  const schedOff = C;                        // starts at top (offset = full circumference)
  const compOff  = C - schedLen;
  const cancOff  = C - schedLen - compLen;

  const pct = (v) => (total > 0 ? Math.round((v / total) * 100) : 0);

  return (
    <div className="donut-chart-wrapper">
      <div className="donut-svg-wrap">
        <svg width="110" height="110" viewBox="0 0 100 100">
          {/* track */}
          <circle cx="50" cy="50" r={R} fill="none" stroke="#e8f4ff" strokeWidth="14"/>
          {/* segments */}
          {cancelled > 0 && (
            <circle cx="50" cy="50" r={R} fill="none" stroke="#f87171" strokeWidth="14"
              strokeDasharray={`${cancLen} ${C}`} strokeDashoffset={cancOff}
              transform="rotate(-90 50 50)"/>
          )}
          {completed > 0 && (
            <circle cx="50" cy="50" r={R} fill="none" stroke="#60a5fa" strokeWidth="14"
              strokeDasharray={`${compLen} ${C}`} strokeDashoffset={compOff}
              transform="rotate(-90 50 50)"/>
          )}
          {scheduled > 0 && (
            <circle cx="50" cy="50" r={R} fill="none" stroke="#34d399" strokeWidth="14"
              strokeDasharray={`${schedLen} ${C}`} strokeDashoffset={schedOff}
              transform="rotate(-90 50 50)"/>
          )}
          {/* center text */}
          <text x="50" y="44" textAnchor="middle" fontSize="20" fontWeight="700" fill="#1e3a5f">{total}</text>
          <text x="50" y="60" textAnchor="middle" fontSize="11" fill="#64748b">Total</text>
        </svg>
      </div>
      <div className="donut-legend">
        <div className="legend-row">
          <span className="legend-dot" style={{background:'#34d399'}}/>
          <span className="legend-name">Scheduled</span>
          <span className="legend-stat">{scheduled} ({pct(scheduled)}%)</span>
        </div>
        <div className="legend-row">
          <span className="legend-dot" style={{background:'#60a5fa'}}/>
          <span className="legend-name">Completed</span>
          <span className="legend-stat">{completed} ({pct(completed)}%)</span>
        </div>
        <div className="legend-row">
          <span className="legend-dot" style={{background:'#f87171'}}/>
          <span className="legend-name">Cancelled</span>
          <span className="legend-stat">{cancelled} ({pct(cancelled)}%)</span>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ── */
export default function PatientAppointments({ onBackToDashboard }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://127.0.0.1:8000/appointments/patient", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to load");
        setAppointments(data);
      } catch (err) {
        console.error("Appointments error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="ap-page">
        <div className="ap-loading">
          <div className="ap-spinner"/>
          <p>Loading appointments…</p>
        </div>
      </div>
    );
  }

  const total     = appointments.length;
  const scheduled = appointments.filter(a => a.status.toLowerCase() === "scheduled").length;
  const completed = appointments.filter(a => a.status.toLowerCase() === "completed").length;
  const cancelled = appointments.filter(a => a.status.toLowerCase() === "cancelled").length;

  const fmtDate = (d) => d.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
  const fmtTime = (d) => d.toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" });

  return (
    <div className="ap-page">
      <div className="ap-inner">

        {/* ── Back button ── */}
        {onBackToDashboard && (
          <button className="back-dashboard-button" onClick={onBackToDashboard}>
            ← Back to Dashboard
          </button>
        )}

        {/* ── Header ── */}
        <div className="ap-header">
          <h1>My Appointments</h1>
          <p>View and manage your upcoming and previous appointments.</p>
        </div>

        {/* ── Stats Row ── */}
        <div className="ap-stats-row">
          <div className="ap-stats-group">
            <div className="stat-card">
              <span className="stat-icon stat-icon--total"><IconCalendar/></span>
              <div>
                <p className="stat-label">Total Appointments</p>
                <p className="stat-number">{total}</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon stat-icon--sched"><IconHourglass/></span>
              <div>
                <p className="stat-label">Scheduled</p>
                <p className="stat-number">{scheduled}</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon stat-icon--comp"><IconCheck/></span>
              <div>
                <p className="stat-label">Completed</p>
                <p className="stat-number">{completed}</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon stat-icon--canc"><IconX/></span>
              <div>
                <p className="stat-label">Cancelled</p>
                <p className="stat-number">{cancelled}</p>
              </div>
            </div>
          </div>

          <div className="ap-overview-card">
            <p className="overview-title">Appointments Overview</p>
            <DonutChart
              scheduled={scheduled}
              completed={completed}
              cancelled={cancelled}
              total={total}
            />
          </div>
        </div>

        {/* ── Appointment Cards ── */}
        {appointments.length === 0 ? (
          <div className="ap-empty">
            <h3>No appointments found</h3>
            <p>You don't have any appointments yet.</p>
          </div>
        ) : (
          <div className="ap-grid">
            {appointments.map((appt) => {
              const d   = new Date(appt.appointment_date);
              const st  = appt.status.toLowerCase();
              return (
                <div className="ap-card" key={appt.id}>
                  {/* Card header */}
                  <div className="card-top">
                    <div>
                      <h2 className="card-doctor">{appt.doctor_name}</h2>
                      <p className="card-dept">{appt.department}</p>
                    </div>
                    <span className={`card-badge card-badge--${st}`}>{appt.status}</span>
                  </div>
                  <div className="card-divider"/>
                  {/* Metadata 2×2 */}
                  <div className="card-meta-grid">
                    <div className="meta-item">
                      <span className="meta-icon"><IconBuilding/></span>
                      <div>
                        <p className="meta-label">Hospital</p>
                        <p className="meta-value">{appt.hospital_name}</p>
                      </div>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon"><IconPin/></span>
                      <div>
                        <p className="meta-label">Location</p>
                        <p className="meta-value">{appt.hospital_address}, {appt.hospital_city}</p>
                      </div>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon"><IconCal/></span>
                      <div>
                        <p className="meta-label">Date &amp; Time</p>
                        <p className="meta-value">{fmtDate(d)} • {fmtTime(d)}</p>
                      </div>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon"><IconPhone/></span>
                      <div>
                        <p className="meta-label">Hospital Contact</p>
                        <p className="meta-value">{appt.hospital_phone || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                  {/* Symptoms full width */}
                  {appt.symptoms && (
                    <div className="meta-item meta-item--full">
                      <span className="meta-icon"><IconDoc/></span>
                      <div>
                        <p className="meta-label">Symptoms</p>
                        <p className="meta-value">{appt.symptoms}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
