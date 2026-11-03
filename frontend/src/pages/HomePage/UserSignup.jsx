import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  UserRound,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import "../../styles/Auth.css";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";

function UserSignup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: "customer",
        }),
      });

      navigate("/login", {
        state: {
          message:
            data.message || "Account created successfully. Please log in.",
          email: formData.email,
        },
      });
    } catch (error) {
      setError(error.message || "Unable to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-register-page">
      <header className="customer-register-navbar">
        <Link to="/" className="customer-register-brand">
          <MapPin size={24} />
          <span>ServiceHub</span>
        </Link>

        <div className="customer-register-login">
          <span>Already have an account?</span>
          <Link to="/login">Login</Link>
        </div>
      </header>

      <main className="customer-register-main">
        <section className="customer-register-card">
          <div className="customer-register-form-side">
            <div className="customer-register-heading">
              <span className="customer-register-eyebrow">
                GET STARTED FOR FREE
              </span>
              <h1>Create Your Account</h1>
              <p>Join ServiceHub and find trusted professionals near you.</p>
            </div>

            <form className="customer-register-form" onSubmit={handleSubmit}>
              <div className="customer-register-field">
                <label htmlFor="customer-name">Full Name</label>
                <div className="customer-register-input">
                  <UserRound size={16} />
                  <input
                    id="customer-name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="customer-register-field">
                <label htmlFor="customer-email">Email Address</label>
                <div className="customer-register-input">
                  <Mail size={16} />
                  <input
                    id="customer-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="customer-register-field">
                <label htmlFor="customer-phone">Phone Number</label>
                <div className="customer-register-input">
                  <Phone size={16} />
                  <input
                    id="customer-phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              <div className="customer-register-field">
                <label htmlFor="customer-password">Password</label>
                <div className="customer-register-input">
                  <Lock size={16} />
                  <input
                    id="customer-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    className="customer-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="customer-register-field">
                <label htmlFor="customer-confirm-password">
                  Confirm Password
                </label>
                <div className="customer-register-input">
                  <Lock size={16} />
                  <input
                    id="customer-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    className="customer-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="customer-register-message" role="status">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="customer-register-submit"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="customer-register-bottom">
              <p>
                Already registered? <Link to="/login">Login</Link>
              </p>
            </div>
          </div>

          <aside className="customer-register-visual">
            <div className="customer-register-visual-content">
              <div className="customer-trust-badge">
                <CheckCircle2 size={17} />
                Trusted Local Professionals
              </div>
              <h2>Everyday services. Made simple.</h2>
              <p>
                Find the right professional, book with confidence, and get
                things done.
              </p>
            </div>
          </aside>
        </section>

        <p className="customer-register-terms">
          By creating an account, you agree to our{" "}
          <Link to="/terms">Terms of Service</Link> and{" "}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </main>
    </div>
  );
}

export default UserSignup;
