import { Link } from "react-router-dom";
import {
  MapPin,
  UserRound,
  Wrench,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import "../../styles/Auth.css";

function ChooseAccount() {
  return (
    <div className="choose-account-page">
      <header className="choose-account-navbar">
        <Link to="/" className="choose-account-brand">
          <MapPin size={23} />
          <span>ServiceHub</span>
        </Link>

        <div className="choose-account-login">
          <span>Already have an account?</span>
          <Link to="/login">Login</Link>
        </div>
      </header>

      <main className="choose-account-main">
        <div className="choose-account-heading">
          <span className="choose-account-eyebrow">
            GET STARTED WITH SERVICEHUB
          </span>

          <h1>Join ServiceHub</h1>

          <p>
            Choose how you want to use ServiceHub and get started in minutes.
          </p>
        </div>

        <div className="account-choice-grid">
          <article className="account-choice-card customer-choice">
            <div className="account-choice-icon customer-icon">
              <UserRound size={29} />
            </div>

            <h2>I am a Customer</h2>

            <p className="account-choice-description">
              Find trusted professionals and book services for your home.
            </p>

            <ul className="account-choice-features">
              <li>
                <CheckCircle2 size={16} />
                Find trusted local professionals
              </li>
              <li>
                <CheckCircle2 size={16} />
                Compare prices and ratings
              </li>
              <li>
                <CheckCircle2 size={16} />
                Book and manage appointments
              </li>
            </ul>

            <Link to="/signup" className="account-choice-button">
              Sign Up as Customer
              <ArrowRight size={16} />
            </Link>
          </article>

          <article className="account-choice-card provider-choice">
            <div className="account-choice-icon provider-icon">
              <Wrench size={29} />
            </div>

            <h2>I am a Service Provider</h2>

            <p className="account-choice-description">
              Grow your business by connecting with customers in your area.
            </p>

            <ul className="account-choice-features">
              <li>
                <CheckCircle2 size={16} />
                Showcase your professional skills
              </li>
              <li>
                <CheckCircle2 size={16} />
                Receive local booking requests
              </li>
              <li>
                <CheckCircle2 size={16} />
                Manage services and appointments
              </li>
            </ul>

            <Link to="/provider-signup" className="account-choice-button">
              Sign Up as Provider
              <ArrowRight size={16} />
            </Link>
          </article>
        </div>

        <p className="choose-account-footer">
          By continuing, you agree to our{" "}
          <Link to="/terms">Terms of Service</Link> and{" "}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </main>
    </div>
  );
}

export default ChooseAccount;
