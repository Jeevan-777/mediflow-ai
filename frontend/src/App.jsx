import { useState } from "react";
import "./App.css";
import login_page from "./assets/Login_page.png";

function App() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    } catch (error) {
      console.error("Login error:", error);
      alert("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

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
            <input type="text" placeholder="Full Name" className="auth-input" />
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

          {isRegister && (
            <select className="auth-input">
              <option value="">Select Role</option>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          )}

          <button
            className="auth-button"
            onClick={isRegister ? undefined : handleLogin}
            disabled={loading}
          >
            {isRegister
              ? "Create Account"
              : loading
                ? "Logging in..."
                : "Login"}
          </button>

          <button
            className="switch-button"
            onClick={() => setIsRegister(!isRegister)}
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
