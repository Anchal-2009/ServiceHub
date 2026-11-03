import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Clock,
  BriefcaseBusiness,
} from "lucide-react";

import { apiRequest } from "../../services/api";
import "../../styles/UserServices.css";

function ProviderProfile() {
  const { id } = useParams();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch services from backend
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest("/services");

        const allServices = Array.isArray(data) ? data : data.services || [];

        // Find services belonging to this provider
        const providerServices = allServices.filter(
          (service) =>
            String(
              typeof service.provider === "object"
                ? service.provider?._id
                : service.provider,
            ) === String(id),
        );

        setServices(providerServices);
      } catch (err) {
        setError(err.message || "Unable to load provider details.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [id]);

  // Get provider details from the first service
  const provider = useMemo(() => {
    if (services.length === 0) return null;

    const firstService = services[0];

    return {
      id,
      name:
        typeof firstService.provider === "object"
          ? firstService.provider?.name || "Service Provider"
          : "Service Provider",
      location: firstService.location || "Location not specified",
      image: firstService.image || "",
      services,
    };
  }, [services, id]);

  const startingPrice = useMemo(() => {
    if (!services.length) return 0;

    return Math.min(...services.map((service) => Number(service.price) || 0));
  }, [services]);

  if (loading) {
    return (
      <main className="provider-profile-page">
        <div className="profile-not-found">
          <p>Loading provider details...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="provider-profile-page">
        <div className="profile-not-found">
          <BriefcaseBusiness size={42} />
          <h2>Unable to load provider</h2>
          <p>{error}</p>

          <Link to="/user-services" className="profile-primary-btn">
            Browse Services
          </Link>
        </div>
      </main>
    );
  }

  if (!provider) {
    return (
      <main className="provider-profile-page">
        <div className="profile-not-found">
          <BriefcaseBusiness size={42} />
          <h2>Provider not found</h2>
          <p>This provider has no active services available.</p>

          <Link to="/user-services" className="profile-primary-btn">
            Browse Services
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="provider-profile-page">
      <main className="profile-content">
        <Link to="/user-services" className="profile-back-link">
          <ArrowLeft size={17} />
          Back to services
        </Link>

        {/* Provider Profile Card */}
        <section className="provider-profile-card">
          <div className="provider-cover">
            <div className="provider-cover-label">
              <ShieldCheck size={16} />
              Professional service provider
            </div>
          </div>

          <div className="provider-main-info">
            <div className="provider-avatar-wrap">
              {provider.image ? (
                <img
                  src={provider.image}
                  alt={provider.name}
                  className="provider-profile-image"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="provider-image-fallback">
                  {provider.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="provider-heading">
              <span className="provider-category">
                {services.length} Active Services
              </span>

              <h1>{provider.name}</h1>

              <p className="provider-tagline">
                Professional services for your home and everyday needs.
              </p>

              <div className="provider-meta">
                <span>
                  <MapPin size={16} />
                  {provider.location}
                </span>
              </div>
            </div>
          </div>

          <div className="provider-stats">
            <div className="provider-stat">
              <BriefcaseBusiness size={20} />
              <div>
                <strong>{services.length}</strong>
                <span>Active Services</span>
              </div>
            </div>

            <div className="provider-stat">
              <MapPin size={20} />
              <div>
                <strong>{provider.location}</strong>
                <span>Service Location</span>
              </div>
            </div>

            <div className="provider-stat">
              <CheckCircle2 size={20} />
              <div>
                <strong>Available</strong>
                <span>Active provider listings</span>
              </div>
            </div>

            <div className="provider-stat">
              <Clock size={20} />
              <div>
                <strong>Booking</strong>
                <span>Choose a service below</span>
              </div>
            </div>
          </div>
        </section>

        {/* Provider Services */}
        <div className="provider-details-grid">
          <div className="provider-details-main">
            <section className="profile-section-card">
              <h2>About the professional</h2>

              <p className="provider-about-text">{services[0].description}</p>
            </section>

            <section className="profile-section-card">
              <div className="profile-section-heading">
                <div>
                  <h2>Services and pricing</h2>
                  <p>Choose the service you need.</p>
                </div>
              </div>

              <div className="provider-service-list">
                {services.map((service) => (
                  <div className="provider-service-row" key={service._id}>
                    <div className="provider-service-check">
                      <CheckCircle2 size={18} />
                    </div>

                    <div className="provider-service-name">
                      <strong>{service.title}</strong>

                      <span>{service.category}</span>
                    </div>

                    <strong className="provider-service-price">
                      ₹{Number(service.price).toLocaleString("en-IN")}
                    </strong>

                    <Link
                      to={`/book-service/${service._id}`}
                      className="profile-primary-btn"
                    >
                      Book
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            <section className="profile-section-card">
              <h2>Service Location</h2>

              <div className="provider-availability">
                <MapPin size={19} />

                <div>
                  <strong>{provider.location}</strong>
                  <p>Location provided by the service professional.</p>
                </div>
              </div>
            </section>
          </div>

          {/* Booking Sidebar */}
          <aside className="provider-booking-sidebar">
            <section className="profile-section-card booking-summary-card">
              <span className="booking-summary-label">SERVICE VISIT</span>

              <h2>Book this professional</h2>

              <p className="booking-summary-description">
                Select one of the available services to continue.
              </p>

              <div className="booking-price-row">
                <span>Starting price</span>

                <strong>₹{startingPrice.toLocaleString("en-IN")}</strong>
              </div>

              <div className="booking-trust-note">
                <ShieldCheck size={18} />

                <span>Review service details before confirming.</span>
              </div>
            </section>

            <section className="profile-section-card contact-card">
              <h3>Need more options?</h3>

              <p>
                Explore other professionals and services available on
                ServiceHub.
              </p>

              <Link to="/user-services" className="profile-contact-link">
                <ArrowLeft size={17} />
                Browse other services
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default ProviderProfile;
