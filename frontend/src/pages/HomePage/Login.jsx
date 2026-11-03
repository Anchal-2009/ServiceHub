import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MapPin, Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

import { apiRequest } from "../../services/api";
import "../../styles/Auth.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: location.state?.email || "",
    password: "",
  });

  const [successMessage, setSuccessMessage] = useState(
    location.state?.message || "",
  );

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });

    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      if (!data.token || !data.user) {
        throw new Error("Invalid login response from the server.");
      }

      const role = data.user.role;

      const dashboardRoutes = {
        customer: "/user-dashboard",
        provider: "/provider-dashboard",
        admin: "/admin-dashboard",
      };

      const dashboardPath = dashboardRoutes[role];

      if (!dashboardPath) {
        throw new Error("Your account has an invalid role.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate(dashboardPath, { replace: true });
    } catch (error) {
      setError(error.message || "Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <header className="login-navbar">
        <Link to="/" className="login-brand">
          <MapPin size={24} />
          <span>ServiceHub</span>
        </Link>

        <div className="login-navbar-right">
          <span>New to ServiceHub?</span>
          <Link to="/choose-account">Sign Up</Link>
        </div>
      </header>

      <main className="login-main">
        <section className="login-card">
          <div className="login-form-side">
            <div className="login-heading">
              <span className="login-eyebrow">WELCOME BACK</span>

              <h1>Welcome Back</h1>

              <p>Log in to manage your services and bookings.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-field">
                <label htmlFor="login-email">Email Address</label>

                <div className="login-input">
                  <Mail size={17} />

                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="login-password">Password</label>

                <div className="login-input">
                  <Lock size={17} />

                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {successMessage && (
                <p className="login-message" role="status">
                  {successMessage}
                </p>
              )}

              {error && (
                <p className="login-message" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="login-divider">
              <span>OR</span>
            </div>

            <div className="login-signup-prompt">
              <p>Don't have an account?</p>
              <Link to="/choose-account">Create an account</Link>
            </div>

            <div className="login-security-note">
              <ShieldCheck size={15} />
              <span>Your information stays secure with us.</span>
            </div>
          </div>

          <aside className="login-visual">
            <div className="login-visual-content">
              <span className="login-visual-label">
                YOUR HOME, IN GOOD HANDS
              </span>

              <h2>Trusted help is just a few clicks away.</h2>

              <p>
                Find reliable local professionals and manage all your
                appointments in one convenient place.
              </p>
            </div>
          </aside>
        </section>

        <p className="login-terms">
          By continuing, you agree to our{" "}
          <Link to="/terms">Terms of Service</Link> and{" "}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </main>
    </div>
  );
}

export default Login;
