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
  BriefcaseBusiness,
  CheckCircle2,
} from "lucide-react";
import "../../styles/Auth.css";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";

function ProviderSignup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    experience: "",
    location: "",
    description: "",
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
          role: "provider",
          category: formData.category,
          experience: formData.experience,
          location: formData.location,
          description: formData.description,
        }),
      });

      navigate("/login", {
        state: {
          message:
            data.message ||
            "Provider account created successfully. Please log in.",
          email: formData.email,
        },
      });
    } catch (error) {
      setError(
        error.message || "Unable to register as a provider. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="provider-register-page">
      <header className="provider-register-navbar">
        <Link to="/" className="provider-register-brand">
          <MapPin size={24} />
          <span>ServiceHub</span>
        </Link>

        <div className="provider-register-login">
          <span>Already registered?</span>
          <Link to="/login">Login</Link>
        </div>
      </header>

      <main className="provider-register-main">
        <section className="provider-register-card">
          <div className="provider-register-form-side">
            <div className="provider-register-heading">
              <span className="provider-register-eyebrow">
                GROW YOUR BUSINESS
              </span>

              <h1>Become a Service Provider</h1>

              <p>
                Join ServiceHub and connect with customers looking for your
                professional services.
              </p>
            </div>

            <form className="provider-register-form" onSubmit={handleSubmit}>
              <div className="provider-register-field">
                <label htmlFor="provider-name">Full Name</label>
                <div className="provider-register-input">
                  <UserRound size={16} />
                  <input
                    id="provider-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="provider-register-field">
                <label htmlFor="provider-email">Email Address</label>
                <div className="provider-register-input">
                  <Mail size={16} />
                  <input
                    id="provider-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="provider-register-field">
                <label htmlFor="provider-phone">Phone Number</label>
                <div className="provider-register-input">
                  <Phone size={16} />
                  <input
                    id="provider-phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              <div className="provider-register-field">
                <label htmlFor="provider-category">Service Category</label>
                <div className="provider-register-input">
                  <BriefcaseBusiness size={16} />
                  <select
                    id="provider-category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Choose a service</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="AC Repair">AC Repair</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Painting">Painting</option>
                    <option value="Beauty & Wellness">Beauty & Wellness</option>
                    <option value="Pest Control">Pest Control</option>
                    <option value="Appliance Repair">Appliance Repair</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="provider-register-field">
                <label htmlFor="provider-experience">
                  Professional Experience
                </label>
                <div className="provider-register-input">
                  <BriefcaseBusiness size={16} />
                  <select
                    id="provider-experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select experience</option>
                    <option value="Less than 1 year">Less than 1 year</option>
                    <option value="1–3 years">1–3 years</option>
                    <option value="3–5 years">3–5 years</option>
                    <option value="5+ years">5+ years</option>
                  </select>
                </div>
              </div>

              <div className="provider-register-field">
                <label htmlFor="provider-location">City or Service Area</label>
                <div className="provider-register-input">
                  <MapPin size={16} />
                  <input
                    id="provider-location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Enter your city or locality"
                    autoComplete="address-level2"
                    required
                  />
                </div>
              </div>

              <div className="provider-register-field">
                <label htmlFor="provider-description">
                  Describe Your Services
                </label>
                <textarea
                  id="provider-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell customers about your skills and services"
                  rows={3}
                  required
                />
              </div>

              <div className="provider-register-field">
                <label htmlFor="provider-password">Password</label>
                <div className="provider-register-input">
                  <Lock size={16} />
                  <input
                    id="provider-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    className="provider-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="provider-register-field">
                <label htmlFor="provider-confirm-password">
                  Confirm Password
                </label>
                <div className="provider-register-input">
                  <Lock size={16} />
                  <input
                    id="provider-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    className="provider-password-toggle"
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
                <p className="provider-register-message" role="status">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="provider-register-submit"
                disabled={loading}
              >
                <CheckCircle2 size={16} />
                {loading ? "Creating Account..." : "Register as Provider"}
              </button>
            </form>

            <div className="provider-register-bottom">
              <p>
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </div>
          </div>

          <aside className="provider-register-visual">
            <div className="provider-register-visual-content">
              <div className="provider-trust-badge">
                <CheckCircle2 size={17} />
                Join Our Professional Network
              </div>

              <h2>Turn your skills into opportunities.</h2>

              <p>
                Showcase your expertise, receive booking requests, and grow your
                local business with ServiceHub.
              </p>

              <div className="provider-benefit">
                <CheckCircle2 size={16} />
                Connect with customers near you
              </div>

              <div className="provider-benefit">
                <CheckCircle2 size={16} />
                Manage your bookings in one place
              </div>
            </div>
          </aside>
        </section>

        <p className="provider-register-terms">
          By registering, you agree to our <Link>Terms of Service</Link> and{" "}
          <Link>Privacy Policy</Link>.
        </p>
      </main>
    </div>
  );
}

export default ProviderSignup;
