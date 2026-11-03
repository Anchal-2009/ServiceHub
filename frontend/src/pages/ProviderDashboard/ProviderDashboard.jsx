import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  CheckCircle2,
  IndianRupee,
  Clock3,
  MapPin,
  Star,
  MoreHorizontal,
  ArrowRight,
  BriefcaseBusiness,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import { apiRequest } from "../../services/api";
import "../../styles/ProviderDashboard.css";

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDate = (dateString) => {
  if (!dateString) return "Date not available";

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

const getInitials = (name) =>
  String(name || "Customer")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getAvatarColor = (name) => {
  const colors = ["blue", "purple", "orange", "green"];
  const value = String(name || "").length;
  return colors[value % colors.length];
};

const formatBooking = (booking) => ({
  ...booking,
  id: booking._id,
  customer: booking.customer?.name || "Customer",
  service: booking.service?.title || booking.serviceName || "Service",
  date: formatDate(booking.date),
  time: booking.time || "Time not available",
  location: booking.address || "Location not available",
  price: Number(booking.price) || 0,
  initials: getInitials(booking.customer?.name),
  color: getAvatarColor(booking.customer?.name),
});

function ProviderDashboard() {
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setFetchError("");

        const [bookingData, reviewData] = await Promise.all([
          apiRequest("/bookings/provider"),
          apiRequest("/reviews/provider"),
        ]);

        setBookings((bookingData.bookings || []).map(formatBooking));

        setReviews(
          (reviewData.reviews || []).map((review) => ({
            ...review,
            id: review._id,
            name: review.customer?.name || "Customer",
            service: review.service?.title || "Service",
            rating: Number(review.rating) || 0,
            comment: review.comment || "",
            date: review.createdAt
              ? new Date(review.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "",
            initials: getInitials(review.customer?.name),
          })),
        );

        setAverageRating(Number(reviewData.averageRating) || 0);
        setReviewCount(Number(reviewData.count) || 0);
      } catch (error) {
        setFetchError(error.message || "Unable to load dashboard information.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const pendingRequests = useMemo(
    () => bookings.filter((booking) => booking.status === "Pending"),
    [bookings],
  );

  const upcomingBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        ["Confirmed", "In Progress"].includes(booking.status),
      ),
    [bookings],
  );

  const completedBookings = bookings.filter(
    (booking) => booking.status === "Completed",
  );

  const totalEarnings = completedBookings.reduce(
    (total, booking) => total + booking.price,
    0,
  );

  const recentRequests = pendingRequests.slice(0, 3);
  const recentReviews = reviews.slice(0, 2);

  const stats = [
    {
      title: "Total Bookings",
      value: String(bookings.length),
      change: "All requests",
      note: "Total bookings received",
      icon: ClipboardList,
      color: "blue",
    },
    {
      title: "Pending Requests",
      value: String(pendingRequests.length).padStart(2, "0"),
      change: "Needs attention",
      note: "Awaiting response",
      icon: Clock3,
      color: "orange",
    },
    {
      title: "Completed Jobs",
      value: String(completedBookings.length),
      change: "Completed",
      note: "Successfully finished",
      icon: CheckCircle2,
      color: "green",
    },
    {
      title: "Total Earnings",
      value: formatCurrency(totalEarnings),
      change: "Completed jobs",
      note: "Based on completed bookings",
      icon: IndianRupee,
      color: "purple",
    },
  ];

  const handleRequest = async (id, action) => {
    const status = action === "accept" ? "Confirmed" : "Cancelled";

    try {
      setUpdatingId(id);

      await apiRequest(`/bookings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setBookings((current) =>
        current.map((booking) =>
          booking.id === id ? { ...booking, status } : booking,
        ),
      );
    } catch (error) {
      window.alert(error.message || "Unable to update booking.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="provider-dashboard-layout">
      <Sidebar
        role="provider"
        activeItem="/provider-dashboard"
        onLogout={() => navigate("/login")}
      />

      <main className="provider-dashboard-main">
        <div className="provider-dashboard-content">
          <section className="provider-welcome-row">
            <div>
              <h1>Welcome back, UrbanClean! 👋</h1>
              <p>Here's what's happening with your business today.</p>
            </div>

            <button
              type="button"
              className="provider-primary-button"
              onClick={() => navigate("/provider-services")}
            >
              <BriefcaseBusiness size={17} />
              Manage Services
            </button>
          </section>

          {fetchError && (
            <div className="provider-empty-state">
              <strong>Unable to load dashboard data</strong>
              <span>{fetchError}</span>
              <button type="button" onClick={() => window.location.reload()}>
                Try Again
              </button>
            </div>
          )}

          <section className="provider-stats-grid">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article className="provider-stat-card" key={stat.title}>
                  <div className="provider-stat-top">
                    <span className={`provider-stat-icon ${stat.color}`}>
                      <Icon size={20} />
                    </span>

                    <button
                      type="button"
                      className="provider-more-button"
                      aria-label={`More options for ${stat.title}`}
                    >
                      <MoreHorizontal size={19} />
                    </button>
                  </div>

                  <p className="provider-stat-title">{stat.title}</p>

                  <div className="provider-stat-value">
                    {loading ? "..." : stat.value}
                  </div>

                  <div className="provider-stat-footer">
                    <span
                      className={
                        stat.color === "orange"
                          ? "provider-stat-change neutral"
                          : "provider-stat-change positive"
                      }
                    >
                      {stat.color !== "orange" && <ArrowUpRight size={14} />}
                      {stat.change}
                    </span>

                    <span>{stat.note}</span>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="provider-dashboard-grid">
            <article className="provider-panel">
              <div className="provider-panel-heading">
                <div>
                  <h2>New Booking Requests</h2>
                  <p>Review and respond to customer requests</p>
                </div>

                <span className="provider-count-badge">
                  {loading ? "..." : `${pendingRequests.length} New`}
                </span>
              </div>

              <div className="provider-request-list">
                {loading ? (
                  <div className="provider-empty-state">
                    <Clock3 size={28} />
                    <strong>Loading booking requests...</strong>
                  </div>
                ) : recentRequests.length === 0 ? (
                  <div className="provider-empty-state">
                    <CheckCircle2 size={28} />
                    <strong>No new booking requests</strong>
                    <span>New customer requests will appear here.</span>
                  </div>
                ) : (
                  recentRequests.map((request) => (
                    <div className="provider-request-item" key={request.id}>
                      <div
                        className={`provider-customer-avatar ${request.color}`}
                      >
                        {request.initials}
                      </div>

                      <div className="provider-request-info">
                        <div className="provider-request-title-row">
                          <h3>{request.customer}</h3>
                          <span className="provider-request-id">
                            #{request.id.slice(-6)}
                          </span>
                        </div>

                        <p className="provider-request-service">
                          {request.service}
                        </p>

                        <div className="provider-request-meta">
                          <span>
                            <CalendarDays size={13} />
                            {request.date}
                          </span>

                          <span>
                            <Clock3 size={13} />
                            {request.time}
                          </span>
                        </div>

                        <div className="provider-request-location">
                          <MapPin size={13} />
                          {request.location}
                        </div>
                      </div>

                      <div className="provider-request-actions">
                        <strong>{formatCurrency(request.price)}</strong>

                        <button
                          type="button"
                          className="provider-accept-button"
                          disabled={updatingId === request.id}
                          onClick={() => handleRequest(request.id, "accept")}
                        >
                          {updatingId === request.id ? "Updating..." : "Accept"}
                        </button>

                        <button
                          type="button"
                          className="provider-reject-button"
                          disabled={updatingId === request.id}
                          onClick={() => handleRequest(request.id, "reject")}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                className="provider-panel-footer-link"
                onClick={() => navigate("/provider-booking-requests")}
              >
                View all requests <ArrowRight size={16} />
              </button>
            </article>

            <article className="provider-panel">
              <div className="provider-panel-heading">
                <div>
                  <h2>Upcoming Bookings</h2>
                  <p>Your next scheduled appointments</p>
                </div>

                <button
                  type="button"
                  className="provider-text-button"
                  onClick={() => navigate("/provider-bookings")}
                >
                  View all
                </button>
              </div>

              <div className="provider-upcoming-list">
                {loading ? (
                  <div className="provider-empty-state">
                    <Clock3 size={28} />
                    <strong>Loading upcoming bookings...</strong>
                  </div>
                ) : upcomingBookings.length === 0 ? (
                  <div className="provider-empty-state">
                    <CalendarDays size={28} />
                    <strong>No upcoming bookings</strong>
                    <span>Confirmed appointments will appear here.</span>
                  </div>
                ) : (
                  upcomingBookings.slice(0, 3).map((booking) => (
                    <div className="provider-upcoming-item" key={booking.id}>
                      <div className="provider-upcoming-date-icon">
                        <CalendarDays size={19} />
                      </div>

                      <div className="provider-upcoming-info">
                        <h3>{booking.service}</h3>
                        <p>{booking.customer}</p>

                        <span>
                          <Clock3 size={13} />
                          {booking.date} · {booking.time}
                        </span>

                        <span>
                          <MapPin size={13} />
                          {booking.location}
                        </span>
                      </div>

                      <span
                        className={`provider-booking-status ${
                          booking.status === "In Progress"
                            ? "confirmed"
                            : booking.status.toLowerCase()
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                className="provider-panel-footer-link"
                onClick={() => navigate("/provider-bookings")}
              >
                Manage schedule <ArrowRight size={16} />
              </button>
            </article>
          </section>

          <section className="provider-panel provider-reviews-panel">
            <div className="provider-panel-heading">
              <div>
                <h2>Recent Customer Reviews</h2>
                <p>See what customers are saying about your services</p>
              </div>

              <button
                type="button"
                className="provider-text-button"
                onClick={() => navigate("/provider-reviews")}
              >
                View all reviews
              </button>
            </div>

            <div className="provider-reviews-grid">
              {loading ? (
                <div className="provider-empty-state">
                  <Clock3 size={28} />
                  <strong>Loading reviews...</strong>
                </div>
              ) : recentReviews.length === 0 ? (
                <div className="provider-empty-state">
                  <Star size={28} />
                  <strong>No customer reviews yet</strong>
                  <span>Reviews from customers will appear here.</span>
                </div>
              ) : (
                recentReviews.map((review) => (
                  <article className="provider-review-card" key={review.id}>
                    <div className="provider-review-top">
                      <div className="provider-review-customer">
                        <div className="provider-review-avatar">
                          {review.initials}
                        </div>

                        <div>
                          <h3>{review.name}</h3>
                          <span>{review.service}</span>
                        </div>
                      </div>

                      <span className="provider-review-date">
                        {review.date}
                      </span>
                    </div>

                    <div className="provider-review-stars">
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          size={15}
                          fill={index < review.rating ? "currentColor" : "none"}
                        />
                      ))}

                      <strong>{review.rating.toFixed(1)}</strong>
                    </div>

                    <p className="provider-review-comment">
                      "{review.comment}"
                    </p>
                  </article>
                ))
              )}
            </div>

            <div className="provider-rating-summary">
              <div className="provider-rating-score">
                <Star size={20} fill="currentColor" />
                <strong>{averageRating.toFixed(1)}</strong>
                <span>/ 5</span>
              </div>

              <p>Average rating based on {reviewCount} customer reviews</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default ProviderDashboard;
