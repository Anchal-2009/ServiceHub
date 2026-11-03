import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Wallet,
  Search,
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Star,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import { apiRequest } from "../../services/api";
import "../../styles/UserDashboard.css";

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDate = (dateString) => {
  if (!dateString) return "Date not available";

  // Avoid timezone shifts when the backend returns YYYY-MM-DD.
  const parts = String(dateString).split("T")[0].split("-");

  if (parts.length === 3) {
    const [year, month, day] = parts;
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return dateString;
};

const formatStatusClass = (status) =>
  String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "-");

const getActivityTime = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

function UserDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setFetchError("");

        const data = await apiRequest("/bookings/mine");

        setBookings(
          (data.bookings || []).map((booking) => ({
            ...booking,
            id: booking._id,
            providerName: booking.provider?.name || "Provider",
            providerId: booking.provider?._id || booking.provider,
            serviceName:
              booking.service?.title || booking.serviceName || "Service",
            description:
              booking.instructions || booking.service?.category || "",
            amount: Number(booking.price) || 0,
            image: booking.service?.image || "",
            location: booking.address || "Location not available",
            date: formatDate(booking.date),
          })),
        );
      } catch (error) {
        setFetchError(error.message || "Unable to load your bookings.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return bookings;

    return bookings.filter((booking) =>
      [
        booking.providerName,
        booking.serviceName,
        booking.description,
        booking.status,
        booking.location,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }, [bookings, searchTerm]);

  const upcomingBookings = bookings.filter((booking) =>
    ["Pending", "Confirmed"].includes(booking.status),
  );

  const completedBookings = bookings.filter(
    (booking) => booking.status === "Completed",
  );

  const totalSpent = completedBookings.reduce(
    (total, booking) => total + booking.amount,
    0,
  );

  const stats = [
    {
      title: "Total Bookings",
      value: String(bookings.length),
      note: "All your service bookings",
      icon: CalendarDays,
      color: "blue",
    },
    {
      title: "Upcoming",
      value: String(upcomingBookings.length),
      note: "Services scheduled",
      icon: Clock3,
      color: "orange",
    },
    {
      title: "Completed",
      value: String(completedBookings.length),
      note: "Services completed",
      icon: CheckCircle2,
      color: "green",
    },
    {
      title: "Total Spent",
      value: formatCurrency(totalSpent),
      note: "Completed service bookings",
      icon: Wallet,
      color: "purple",
    },
  ];

  const recentActivities = [...bookings]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0),
    )
    .slice(0, 3)
    .map((booking) => {
      let title = "Booking request sent";
      let detail = `Your ${booking.serviceName.toLowerCase()} request is pending.`;
      let type = "pending";

      if (booking.status === "Confirmed") {
        title = "Booking confirmed";
        detail = `Your ${booking.serviceName.toLowerCase()} service is confirmed.`;
        type = "success";
      } else if (booking.status === "In Progress") {
        title = "Service in progress";
        detail = `Your ${booking.serviceName.toLowerCase()} service is in progress.`;
        type = "pending";
      } else if (booking.status === "Completed") {
        title = "Service completed";
        detail = `Your ${booking.serviceName.toLowerCase()} service was completed.`;
        type = "completed";
      } else if (booking.status === "Cancelled") {
        title = "Booking cancelled";
        detail = `Your ${booking.serviceName.toLowerCase()} booking was cancelled.`;
        type = "completed";
      }

      return {
        id: booking.id,
        title,
        detail,
        time: getActivityTime(booking.updatedAt || booking.createdAt),
        type,
      };
    });

  return (
    <div className="customer-dashboard-layout">
      <Sidebar role="customer" onLogout={() => navigate("/login")} />

      <main className="customer-dashboard-main">
        <header className="customer-dashboard-header">
          <div className="customer-header-left">
            <div>
              <h1>Welcome Back, Anchal! 👋</h1>
              <p className="customer-header-subtitle">
                Here's your financial overview of service bookings.
              </p>
            </div>
          </div>
        </header>

        <div className="customer-dashboard-content">
          <section className="customer-welcome-banner">
            <div className="customer-banner-copy">
              <span className="customer-banner-label">YOUR SERVICE HUB</span>

              <h2>Everything you need, in one place.</h2>

              <p>
                Find trusted professionals, manage your bookings, and make your
                everyday tasks easier.
              </p>

              <Link to="/user-services" className="customer-primary-button">
                Explore Services
                <ArrowUpRight size={17} />
              </Link>
            </div>

            <div className="customer-banner-decoration">
              <div className="customer-banner-circle customer-circle-one" />
              <div className="customer-banner-circle customer-circle-two" />

              <div className="customer-banner-icon">
                <CheckCircle2 size={62} strokeWidth={1.5} />
              </div>

              <div className="customer-banner-floating-card">
                <span className="customer-floating-check">
                  <CheckCircle2 size={17} />
                </span>

                <div>
                  <strong>Trusted professionals</strong>
                  <span>Quality service, every time</span>
                </div>
              </div>
            </div>
          </section>

          <section className="customer-stats-grid">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article className="customer-stat-card" key={stat.title}>
                  <div className="customer-stat-top">
                    <span className={`customer-stat-icon ${stat.color}`}>
                      <Icon size={20} />
                    </span>

                    <span className="customer-stat-more">
                      <ArrowUpRight size={16} />
                    </span>
                  </div>

                  <p className="customer-stat-title">{stat.title}</p>
                  <h3>{stat.value}</h3>
                  <p className="customer-stat-note">{stat.note}</p>
                </article>
              );
            })}
          </section>

          <section className="customer-dashboard-section">
            <div className="customer-section-heading">
              <div>
                <h2>Upcoming Bookings</h2>
                <p>Keep track of your scheduled services.</p>
              </div>

              <Link to="/user-bookings" className="customer-text-link">
                View All <ArrowRight size={16} />
              </Link>
            </div>

            <div className="customer-bookings-list">
              {loading ? (
                <div className="customer-empty-state">
                  <Clock3 size={30} />
                  <h3>Loading your bookings...</h3>
                </div>
              ) : fetchError ? (
                <div className="customer-empty-state">
                  <h3>Unable to load bookings</h3>
                  <p>{fetchError}</p>
                  <button
                    type="button"
                    className="customer-empty-link"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  {filteredBookings.filter((booking) =>
                    ["Pending", "Confirmed"].includes(booking.status),
                  ).length === 0 ? (
                    <div className="customer-empty-state">
                      <CalendarDays size={30} />
                      <h3>No upcoming bookings found</h3>
                      <p>Try another search or explore available services.</p>
                      <Link to="/user-services" className="customer-empty-link">
                        Find Services
                      </Link>
                    </div>
                  ) : (
                    filteredBookings
                      .filter((booking) =>
                        ["Pending", "Confirmed"].includes(booking.status),
                      )
                      .map((booking) => (
                        <article
                          className="customer-booking-card"
                          key={booking.id}
                        >
                          {booking.image ? (
                            <img
                              src={booking.image}
                              alt={booking.serviceName}
                              className="customer-booking-image"
                            />
                          ) : (
                            <div className="customer-booking-image customer-booking-image-placeholder">
                              <Search size={25} />
                            </div>
                          )}

                          <div className="customer-booking-info">
                            <div className="customer-booking-title-row">
                              <h3>{booking.serviceName}</h3>

                              <span
                                className={`customer-status-badge ${formatStatusClass(
                                  booking.status,
                                )}`}
                              >
                                {booking.status}
                              </span>
                            </div>

                            <p className="customer-booking-description">
                              {booking.description || "Service booking"}
                            </p>

                            <p className="customer-booking-provider">
                              <span>Professional:</span> {booking.providerName}
                            </p>

                            <div className="customer-booking-meta">
                              <span>
                                <CalendarDays size={14} />
                                {booking.date}
                              </span>

                              <span>
                                <Clock3 size={14} />
                                {booking.time}
                              </span>

                              <span>
                                <MapPin size={14} />
                                {booking.location}
                              </span>
                            </div>
                          </div>

                          <div className="customer-booking-price">
                            <span>Service price</span>
                            <strong>{formatCurrency(booking.amount)}</strong>

                            {booking.providerId && (
                              <Link to={`/provider/${booking.providerId}`}>
                                View Details
                              </Link>
                            )}
                          </div>
                        </article>
                      ))
                  )}
                </>
              )}
            </div>
          </section>

          <section className="customer-bottom-grid">
            <div className="customer-panel customer-activity-panel">
              <div className="customer-section-heading">
                <div>
                  <h2>Recent Activity</h2>
                  <p>Your latest booking updates.</p>
                </div>
              </div>

              <div className="customer-activity-list">
                {loading ? (
                  <p>Loading recent activity...</p>
                ) : recentActivities.length === 0 ? (
                  <p>No recent booking activity yet.</p>
                ) : (
                  recentActivities.map((activity) => (
                    <div className="customer-activity-item" key={activity.id}>
                      <span
                        className={`customer-activity-icon ${activity.type}`}
                      >
                        {activity.type === "success" ? (
                          <CheckCircle2 size={17} />
                        ) : activity.type === "pending" ? (
                          <Clock3 size={17} />
                        ) : (
                          <Star size={17} />
                        )}
                      </span>

                      <div className="customer-activity-copy">
                        <h3>{activity.title}</h3>
                        <p>{activity.detail}</p>
                      </div>

                      <span className="customer-activity-time">
                        {activity.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="customer-panel customer-discover-panel">
              <div className="customer-discover-icon">
                <Search size={24} />
              </div>

              <h2>Need a service?</h2>

              <p>
                Discover reliable professionals near you for your everyday
                needs.
              </p>

              <Link
                to="/user-services"
                className="customer-primary-button customer-discover-button"
              >
                Find a Professional
                <ArrowRight size={17} />
              </Link>

              <div className="customer-trust-note">
                <CheckCircle2 size={15} />
                Browse services at your convenience
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default UserDashboard;
