import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  SlidersHorizontal,
  ArrowUpRight,
  Star,
  ShieldCheck,
  CheckCircle2,
  Wrench,
  Zap,
  Sparkles,
  Snowflake,
  Paintbrush,
  Truck,
  Laptop,
  Scissors,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import { apiRequest } from "../../services/api";
import "../../styles/UserServices.css";

const categories = [
  { name: "All Services", icon: Sparkles },
  { name: "Plumbing", icon: Wrench },
  { name: "Electrical", icon: Zap },
  { name: "Cleaning", icon: Sparkles },
  { name: "AC Repair", icon: Snowflake },
  { name: "Painting", icon: Paintbrush },
  { name: "Moving", icon: Truck },
  { name: "Appliance Repair", icon: Laptop },
  { name: "Beauty", icon: Scissors },
];

const formatPrice = (price) => `₹${Number(price || 0).toLocaleString("en-IN")}`;

function UserServices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Services");
  const [sortBy, setSortBy] = useState("recommended");
  const [maxPrice, setMaxPrice] = useState("all");
  const [favorites, setFavorites] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch services from the backend
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest("/services");

        setServices(Array.isArray(data) ? data : data.services || []);
      } catch (err) {
        setError(err.message || "Unable to load services. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Search, filter and sort services
  const filteredProviders = useMemo(() => {
    let result = services.filter((service) => {
      const providerName =
        typeof service.provider === "object"
          ? service.provider?.name || ""
          : "";

      const searchText = [
        providerName,
        service.category,
        service.title,
        service.description,
        service.location,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchText.includes(
        searchTerm.trim().toLowerCase(),
      );

      const matchesCategory =
        selectedCategory === "All Services" ||
        (service.category || "").trim().toLowerCase() ===
          selectedCategory.trim().toLowerCase();

      const matchesLocation =
        !location.trim() ||
        (service.location || "")
          .toLowerCase()
          .includes(location.trim().toLowerCase());

      const matchesPrice =
        maxPrice === "all" || Number(service.price) <= Number(maxPrice);

      return (
        matchesSearch && matchesCategory && matchesLocation && matchesPrice
      );
    });

    if (sortBy === "price-low") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else {
      result.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );
    }

    return result;
  }, [services, searchTerm, location, selectedCategory, sortBy, maxPrice]);

  // Add or remove a service from favourites
  const toggleFavorite = (id) => {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  // Reset all filters
  const clearFilters = () => {
    setSearchTerm("");
    setLocation("Delhi");
    setSelectedCategory("All Services");
    setSortBy("recommended");
    setMaxPrice("all");
  };

  return (
    <div className="find-services-layout">
      <Sidebar role="customer" />

      <main className="find-services-main">
        <header className="find-services-header">
          <div className="find-header-title">
            <h1>Find Local Services</h1>
            <p>Discover trusted professionals in your neighbourhood.</p>
          </div>
        </header>

        <div className="find-services-content">
          {/* Hero Section */}
          <section className="find-hero">
            <div className="find-hero-copy">
              <span className="find-hero-label">
                <ShieldCheck size={15} />
                YOUR TRUSTED SERVICE PARTNER
              </span>

              <h2>
                Find trusted
                <br />
                <span>local professionals.</span>
              </h2>

              <p>
                From home repairs to cleaning, discover skilled professionals
                and book the right service with confidence.
              </p>

              <div className="find-hero-points">
                <span>
                  <CheckCircle2 size={15} />
                  Verified professionals
                </span>

                <span>
                  <CheckCircle2 size={15} />
                  Transparent pricing
                </span>
              </div>
            </div>

            <div className="find-hero-visual">
              <div className="find-hero-orbit" />

              <div className="find-hero-icon">
                <Wrench size={65} strokeWidth={1.5} />
              </div>

              <div className="find-hero-float-card">
                <span className="find-hero-float-icon">
                  <Star size={16} fill="currentColor" />
                </span>

                <div>
                  <strong>Trusted experts</strong>
                  <span>Quality service, every time</span>
                </div>
              </div>
            </div>
          </section>

          {/* Search Section */}
          <section className="find-search-panel">
            <div className="find-search-field">
              <MapPin size={19} />

              <div>
                <label htmlFor="service-location">Your location</label>

                <input
                  id="service-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Enter city"
                />
              </div>
            </div>

            <span className="find-search-divider" />

            <div className="find-search-field find-search-keyword">
              <Search size={19} />

              <div>
                <label htmlFor="service-keyword">
                  What service do you need?
                </label>

                <input
                  id="service-keyword"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="e.g. plumber, electrician, cleaning"
                />
              </div>
            </div>

            <button
              type="button"
              className="find-search-button"
              onClick={() =>
                document
                  .getElementById("service-results")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Search size={17} />
              Search
            </button>
          </section>

          {/* Categories */}
          <section className="find-category-section">
            <div className="find-section-heading">
              <div>
                <span className="find-section-eyebrow">BROWSE BY CATEGORY</span>

                <h2>Popular Service Categories</h2>
                <p>What do you need help with today?</p>
              </div>
            </div>

            <div className="find-category-list">
              {categories.map((category) => {
                const Icon = category.icon;
                const active = selectedCategory === category.name;

                return (
                  <button
                    type="button"
                    key={category.name}
                    className={`find-category-chip ${active ? "active" : ""}`}
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    <span className="find-category-icon">
                      <Icon size={19} />
                    </span>

                    <span>{category.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Service Results */}
          <section className="find-results-section" id="service-results">
            <div className="find-results-heading">
              <div>
                <span className="find-section-eyebrow">
                  PROFESSIONALS NEAR YOU
                </span>

                <h2>Available Services</h2>

                <p>
                  Showing <strong>{filteredProviders.length}</strong>{" "}
                  {filteredProviders.length === 1 ? "service" : "services"}{" "}
                  matching your search
                </p>
              </div>

              <label className="find-sort-control">
                <span>Sort by</span>

                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price: Low to high</option>
                  <option value="price-high">Price: High to low</option>
                </select>
              </label>
            </div>

            <div className="find-results-body">
              {/* Filters */}
              <aside className="find-filter-panel">
                <div className="find-filter-heading">
                  <h3>
                    <SlidersHorizontal size={17} />
                    Filters
                  </h3>

                  <button type="button" onClick={clearFilters}>
                    Reset
                  </button>
                </div>

                <div className="find-filter-group">
                  <h4>Service category</h4>

                  {categories.map((category) => (
                    <label className="find-filter-option" key={category.name}>
                      <input
                        type="radio"
                        name="service-category"
                        checked={selectedCategory === category.name}
                        onChange={() => setSelectedCategory(category.name)}
                      />

                      <span>{category.name}</span>
                    </label>
                  ))}
                </div>

                <div className="find-filter-group">
                  <h4>Maximum starting price</h4>

                  <select
                    className="find-price-select"
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                  >
                    <option value="500">Up to ₹500</option>
                    <option value="1000">Up to ₹1,000</option>
                    <option value="1500">Up to ₹1,500</option>
                    <option value="all">Any price</option>
                  </select>
                </div>

                <div className="find-filter-trust">
                  <ShieldCheck size={20} />

                  <div>
                    <strong>Book with confidence</strong>
                    <p>Choose professionals who match your needs.</p>
                  </div>
                </div>
              </aside>

              {/* Service Cards */}
              <div className="find-provider-results">
                {loading ? (
                  <div className="find-no-results">
                    <p>Loading available services...</p>
                  </div>
                ) : error ? (
                  <div className="find-no-results">
                    <h3>Couldn't load services</h3>
                    <p>{error}</p>
                  </div>
                ) : filteredProviders.length === 0 ? (
                  <div className="find-no-results">
                    <Search size={35} />

                    <h3>No services found</h3>

                    <p>
                      Try another keyword, category, location, or price range.
                    </p>

                    <button
                      type="button"
                      className="find-search-button"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  filteredProviders.map((provider) => (
                    <article className="find-provider-card" key={provider._id}>
                      <div className="find-provider-photo-wrap">
                        <img
                          src={provider.image || "/images/image.png"}
                          alt={provider.title}
                          className="find-provider-photo"
                          onError={(event) => {
                            event.currentTarget.style.visibility = "hidden";
                          }}
                        />

                        {/* <button
                          type="button"
                          className={`find-favorite-button ${
                            favorites.includes(provider._id) ? "saved" : ""
                          }`}
                          onClick={() => toggleFavorite(provider._id)}
                          aria-label={
                            favorites.includes(provider._id)
                              ? "Remove from favourites"
                              : "Add to favourites"
                          }
                        >
                          <Heart
                            size={18}
                            fill={
                              favorites.includes(provider._id)
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button> */}
                      </div>

                      <div className="find-provider-details">
                        <div className="find-provider-name-row">
                          <div>
                            <h3>
                              {typeof provider.provider === "object"
                                ? provider.provider?.name || "Service Provider"
                                : "Service Provider"}
                            </h3>

                            <p>{provider.title}</p>
                          </div>
                        </div>

                        <p className="find-provider-description">
                          {provider.description}
                        </p>

                        <div className="find-provider-meta">
                          <span>
                            <MapPin size={14} />
                            {provider.location}
                          </span>
                        </div>

                        <div className="find-provider-bottom">
                          <div className="find-provider-price">
                            <span>Starting from</span>

                            <strong>{formatPrice(provider.price)}</strong>

                            <small>/ service</small>
                          </div>

                          <div className="find-provider-actions">
                            <Link
                              to={`/provider/${
                                typeof provider.provider === "object"
                                  ? provider.provider?._id
                                  : provider.provider
                              }`}
                              className="find-view-profile"
                            >
                              View Profile
                            </Link>

                            <Link
                              to={`/book-service/${provider._id}`}
                              className="find-book-button"
                            >
                              Book Now
                              <ArrowUpRight size={15} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default UserServices;
