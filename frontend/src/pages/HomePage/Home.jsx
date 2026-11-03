import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import {
  MapPin,
  Search,
  Wrench,
  Zap,
  Sparkles,
  Wind,
  Hammer,
  PaintRoller,
  Flower2,
  Bug,
  Star,
  ArrowRight,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { apiRequest } from "../../services/api";
import "../../styles/Home.css";

const categories = [
  { name: "Plumbing", icon: Wrench, color: "blue" },
  { name: "Electrical", icon: Zap, color: "orange" },
  { name: "Cleaning", icon: Sparkles, color: "green" },
  { name: "AC Repair", icon: Wind, color: "purple" },
  { name: "Carpentry", icon: Hammer, color: "orange" },
  { name: "Painting", icon: PaintRoller, color: "pink" },
  { name: "Beauty & Wellness", icon: Flower2, color: "purple" },
  { name: "Pest Control", icon: Bug, color: "green" },
];

function Home() {
  const navigate = useNavigate();

  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [providerError, setProviderError] = useState("");

  // Fetch real registered providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoadingProviders(true);
        setProviderError("");

        const response = await apiRequest("/users/providers");

        setProviders(response.providers || []);
      } catch (error) {
        console.error("Error fetching providers:", error.message);
        setProviderError("Unable to load service providers. Please try again.");
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchProviders();
  }, []);

  return (
    <div className="home-page">
      <header className="navbar">
        <Link to="/" className="navbar-brand">
          <MapPin className="brand-pin" size={29} />
          <span>
            <span className="brand-highlight">ServiceHub</span>
          </span>
        </Link>

        <div className="navbar-actions">
          <Link to="/login" className="login-link">
            Login
          </Link>

          <Link to="/choose-account" className="signup-button">
            Sign Up
          </Link>

          <Link to="/login" className="navbar-user" aria-label="Account">
            <UserRound size={19} />
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <span className="hero-eyebrow">Find Local Professionals</span>

            <h1>
              Find Trusted
              <span> Local Services</span>
              Near You
            </h1>

            <p className="hero-description">
              From home repairs to cleaning, find skilled professionals in your
              area and book your service in just a few clicks.
            </p>

            <button
              type="button"
              className="hero-button"
              onClick={() => navigate("/signup")}
            >
              Start Finding Services <ArrowRight size={17} />
            </button>

            <div className="hero-trust">
              <ShieldCheck size={17} />
              <span>Trusted professionals for your home</span>
            </div>
          </div>

          <div className="hero-image-wrap">
            <div className="hero-image-badge">
              <ShieldCheck size={18} />
              <div>
                <strong>Trusted Experts</strong>
                <span>Quality service, every time</span>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="categories-section" id="services">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">What do you need?</span>

              <h2>Popular Service Categories</h2>
              <p>Find the right professional for every task.</p>
            </div>
          </div>

          <div className="category-grid">
            {categories.map(({ name, icon: Icon, color }) => (
              <button type="button" className="category-card">
                <span className={`category-icon ${color}`}>
                  <Icon size={26} strokeWidth={1.9} />
                </span>

                <span className="category-name">{name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Featured Providers Section */}
        <section className="providers-section" id="featured-providers">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">
                Professionals you can trust
              </span>

              <h2>Featured Service Providers</h2>
              <p>Explore professionals for your everyday needs.</p>
            </div>
          </div>

          <div className="provider-grid">
            {loadingProviders ? (
              <p className="provider-message">Loading service providers...</p>
            ) : providerError ? (
              <p className="provider-message">{providerError}</p>
            ) : providers.length === 0 ? (
              <p className="provider-message">
                No service providers have registered yet. Check back soon!
              </p>
            ) : (
              providers.map((provider, index) => (
                <article className="provider-card" key={provider.id}>
                  <div className={`provider-avatar avatar-${(index % 4) + 1}`}>
                    <span>
                      {provider.name
                        ?.split(" ")
                        .filter(Boolean)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                  </div>

                  <div className="provider-info">
                    <h3>{provider.name}</h3>

                    <p className="provider-service">
                      {provider.category || "Service Professional"}
                      {provider.experience ? ` · ${provider.experience}` : ""}
                    </p>

                    <div className="provider-rating">
                      <Star size={15} />
                      <span>New provider</span>
                    </div>

                    <p className="provider-location">
                      <MapPin size={13} />
                      {provider.location || "Location not provided"}
                    </p>

                    <span className="verified-label">
                      <ShieldCheck size={13} />
                      Registered
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-section" id="how-it-works">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">Simple and convenient</span>

              <h2>How ServiceHub Works</h2>
            </div>
          </div>

          <div className="how-grid">
            <article className="how-card">
              <span className="how-number">01</span>
              <Search size={27} />
              <h3>Find a Service</h3>
              <p>Search for the service you need in your area.</p>
            </article>

            <article className="how-card">
              <span className="how-number">02</span>
              <ShieldCheck size={27} />
              <h3>Choose a Professional</h3>
              <p>Compare profiles, prices, and customer reviews.</p>
            </article>

            <article className="how-card">
              <span className="how-number">03</span>
              <MapPin size={27} />
              <h3>Book an Appointment</h3>
              <p>Choose a suitable time and request your service.</p>
            </article>
          </div>
        </section>

        {/* Provider CTA Section */}
        <section className="provider-cta" id="about">
          <div>
            <span className="section-eyebrow">Grow your business</span>

            <h2>Are you a service professional?</h2>

            <p>
              Join ServiceHub, connect with local customers, and manage your
              bookings in one place.
            </p>
          </div>

          <button
            className="cta-button"
            onClick={() => navigate("/provider-signup")}
          >
            Become a Provider <ArrowRight size={17} />
          </button>
        </section>
      </main>

      <footer className="home-footer">
        <span>© {new Date().getFullYear()} ServiceHub</span>
        <span>Local Services · Trusted Professionals</span>
      </footer>
    </div>
  );
}

export default Home;
