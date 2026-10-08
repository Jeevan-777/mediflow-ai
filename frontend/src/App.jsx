import { useState } from "react";
import "./App.css";
import login_page from "./assets/Login_page.png";
import PatientDashboard from "./pages/PatientDashboard";
import HospitalAdminDashboard from "./pages/HospitalAdminDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";

function App() {
  const [isRegister, setIsRegister] = useState(false);
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("access_token"),
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Registration failed.");
        return;
      }

      alert("Registration successful! Please login.");

      setName("");
      setEmail("");
      setPassword("");
      setIsRegister(false);
    } catch (error) {
      console.error("Registration error:", error);
      alert("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Invalid email or password.");
        return;
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("name", data.name);
      localStorage.setItem("email", data.email);
      localStorage.setItem("role", data.role);

      alert(`Login successful! Welcome ${data.name}`);

      console.log("Logged in user:", data);

      setLoggedIn(true);
    } catch (error) {
      console.error("Login error:", error);
      alert("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  if (loggedIn && localStorage.getItem("role") === "patient") {
    return <PatientDashboard />;
  }

  if (loggedIn && localStorage.getItem("role") === "hospital_admin") {
    return <HospitalAdminDashboard />;
  }

  if (loggedIn && localStorage.getItem("role") === "doctor") {
    return <DoctorDashboard />;
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <img
          src={login_page}
          alt="MediFlow AI Healthcare"
          className="auth-illustration"
        />
      </div>

      <div className="auth-right">
        <div className="auth-container">
          <div className="brand">
            Medi<span>Flow</span> AI
          </div>

          <h1>{isRegister ? "Create Account" : "Welcome Back"}</h1>

          <p className="auth-subtitle">
            {isRegister
              ? "Create your MediFlow AI account"
              : "Sign in to continue to MediFlow AI"}
          </p>

          {isRegister && (
            <input
              type="text"
              placeholder="Full Name"
              className="auth-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="auth-button"
            onClick={isRegister ? handleRegister : handleLogin}
            disabled={loading}
          >
            {isRegister
              ? loading
                ? "Creating Account..."
                : "Create Account"
              : loading
                ? "Logging in..."
                : "Login"}
          </button>

          <button
            className="switch-button"
            onClick={() => {
              setIsRegister(!isRegister);
              setName("");
              setEmail("");
              setPassword("");
            }}
          >
            {isRegister
              ? "Already have an account? Login"
              : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
