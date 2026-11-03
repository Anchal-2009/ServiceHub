import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Star,
  Eye,
  XCircle,
  Search,
} from "lucide-react";

import { apiRequest } from "../../services/api";
import Sidebar from "../../components/Sidebar";
import "../../styles/UserDashboard.css";

const filters = ["All", "Upcoming", "Completed", "Cancelled"];

function formatDate(dateString) {
  if (!dateString) return "Not specified";

  const datePart = String(dateString).slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "Not specified";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timeString) {
  if (!timeString) return "Not specified";

  const [hours, minutes] = String(timeString).split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return "Not specified";
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getDisplayStatus(status) {
  if (status === "Pending" || status === "Confirmed") {
    return "Upcoming";
  }

  return status || "Pending";
}

function UserBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [notice, setNotice] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  // Fetch bookings belonging to the logged-in customer
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setFetchError("");

        const data = await apiRequest("/bookings/mine");

        const savedBookings = Array.isArray(data.bookings) ? data.bookings : [];

        const formattedBookings = savedBookings.map((booking) => ({
          ...booking,
          id: booking._id,
          provider: booking.provider?.name || "Service Provider",
          service: booking.service?.title || booking.serviceName || "Service",
          category: booking.service?.category || booking.category || "Service",
          description:
            booking.instructions || booking.serviceName || "Service booking",
          date: formatDate(booking.date),
          time: formatTime(booking.time),
          location: booking.address || "Address not available",
          amount: Number(booking.price) || 0,
          status: getDisplayStatus(booking.status),
          image: booking.service?.image || "/images/image.png",
          originalStatus: booking.status,
          phone: booking.phone || "Not available",
        }));

        setBookings(formattedBookings);
      } catch (error) {
        setFetchError(error.message || "Unable to load your bookings.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Filter and search bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesFilter =
      activeFilter === "All" || booking.status === activeFilter;

    const matchesSearch =
      `${booking.provider} ${booking.service} ${booking.category} ${booking.id}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const formatCurrency = (amount) => `₹${amount.toLocaleString("en-IN")}`;

  // Cancel booking and update the database
  const cancelBooking = async (booking) => {
    if (!booking?._id || cancellingId) return;

    try {
      setCancellingId(booking.id);
      setNotice("");

      const data = await apiRequest(`/bookings/${booking._id}/cancel`, {
        method: "PATCH",
      });

      if (!data.success) {
        throw new Error(data.message || "Unable to cancel booking.");
      }

      const updatedBooking = {
        ...booking,
        status: "Cancelled",
        originalStatus: "Cancelled",
      };

      setBookings((currentBookings) =>
        currentBookings.map((item) =>
          item.id === booking.id ? updatedBooking : item,
        ),
      );

      setSelectedBooking((currentBooking) =>
        currentBooking?.id === booking.id ? updatedBooking : currentBooking,
      );

      setNotice(data.message || "Booking cancelled successfully.");
    } catch (error) {
      setNotice(error.message || "Unable to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  };

  // Reviews will be saved after adding a backend review endpoint.

  const submitReview = async (event) => {
    event.preventDefault();

    if (!reviewBooking) return;

    try {
      setNotice("");

      const data = await apiRequest("/reviews", {
        method: "POST",
        body: JSON.stringify({
          bookingId: reviewBooking._id,
          rating: reviewRating,
          comment: reviewText.trim(),
        }),
      });

      if (!data.success) {
        throw new Error(data.message || "Unable to submit review.");
      }

      setNotice(data.message || "Review submitted successfully.");

      setReviewBooking(null);
      setReviewRating(5);
      setReviewText("");
    } catch (error) {
      setNotice(error.message || "Unable to submit review.");
    }
  };

  return (
    <div className="customer-bookings-layout">
      <Sidebar role="customer" />

      <main className="customer-bookings-main">
        <header className="bookings-header">
          <div>
            <h1>My Bookings</h1>
            <p>Manage your services and keep track of every booking.</p>
          </div>
        </header>

        <div className="bookings-content">
          {loading ? (
            <div className="bookings-empty">
              <CalendarDays size={34} />
              <h3>Loading your bookings...</h3>
            </div>
          ) : fetchError ? (
            <div className="bookings-empty">
              <XCircle size={34} />
              <h3>Unable to load bookings</h3>
              <p>{fetchError}</p>

              <button type="button" onClick={() => window.location.reload()}>
                Try Again
              </button>
            </div>
          ) : (
            <>
              <section className="bookings-summary">
                <div>
                  <span>Total Bookings</span>
                  <h2>{bookings.length}</h2>
                </div>

                <div>
                  <span>Upcoming</span>
                  <h2>
                    {
                      bookings.filter(
                        (booking) => booking.status === "Upcoming",
                      ).length
                    }
                  </h2>
                </div>

                <div>
                  <span>Completed</span>
                  <h2>
                    {
                      bookings.filter(
                        (booking) => booking.status === "Completed",
                      ).length
                    }
                  </h2>
                </div>
              </section>

              <section className="bookings-panel">
                <div className="bookings-panel-heading">
                  <div>
                    <h2>Your Service Bookings</h2>
                    <p>View your appointments and booking status.</p>
                  </div>

                  <span className="bookings-total">
                    {filteredBookings.length} bookings
                  </span>
                </div>

                <div className="bookings-toolbar">
                  <div className="booking-filter-tabs">
                    {filters.map((filter) => (
                      <button
                        type="button"
                        key={filter}
                        className={
                          activeFilter === filter
                            ? "booking-filter active"
                            : "booking-filter"
                        }
                        onClick={() => setActiveFilter(filter)}
                      >
                        {filter}

                        {filter === "All" && (
                          <span className="filter-count">
                            {bookings.length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <label className="bookings-search">
                    <Search size={16} />

                    <input
                      type="search"
                      placeholder="Search bookings..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </label>
                </div>

                <div className="booking-cards">
                  {filteredBookings.length === 0 ? (
                    <div className="bookings-empty">
                      <CalendarDays size={34} />
                      <h3>No bookings found</h3>
                      <p>
                        {bookings.length === 0
                          ? "You haven't booked any services yet."
                          : "Try another filter or search for a different service."}
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilter("All");
                          setSearchTerm("");
                        }}
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    filteredBookings.map((booking) => (
                      <article className="booking-item" key={booking.id}>
                        <img
                          className="booking-provider-image"
                          src={booking.image}
                          alt={booking.provider}
                          onError={(event) => {
                            event.currentTarget.style.visibility = "hidden";
                          }}
                        />

                        <div className="booking-item-info">
                          <div className="booking-title-line">
                            <h3>{booking.service}</h3>

                            <span
                              className={`booking-status ${booking.status.toLowerCase()}`}
                            >
                              {booking.status}
                            </span>
                          </div>

                          <p className="booking-provider-name">
                            {booking.provider}
                          </p>

                          <p className="booking-description">
                            {booking.description}
                          </p>

                          <div className="booking-metadata">
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

                          <span className="booking-id">
                            Booking ID: {booking.id}
                          </span>
                        </div>

                        <div className="booking-item-actions">
                          <div className="booking-price">
                            <span>Service price</span>
                            <strong>{formatCurrency(booking.amount)}</strong>
                          </div>

                          <div className="booking-action-buttons">
                            <button
                              type="button"
                              className="booking-view-button"
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <Eye size={15} />
                              View
                            </button>

                            {booking.status === "Upcoming" && (
                              <button
                                type="button"
                                className="booking-cancel-button"
                                onClick={() => cancelBooking(booking)}
                                disabled={cancellingId === booking.id}
                              >
                                <XCircle size={15} />
                                {cancellingId === booking.id
                                  ? "Cancelling..."
                                  : "Cancel"}
                              </button>
                            )}

                            {booking.status === "Completed" && (
                              <button
                                type="button"
                                className="booking-review-button"
                                onClick={() => setReviewBooking(booking)}
                              >
                                <Star size={15} />
                                Leave Review
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div
          className="booking-modal-overlay"
          onClick={() => setSelectedBooking(null)}
        >
          <section
            className="booking-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="booking-modal-close"
              onClick={() => setSelectedBooking(null)}
              aria-label="Close booking details"
            >
              ×
            </button>

            <h2 id="booking-modal-title">Booking Details</h2>

            <p className="booking-modal-subtitle">{selectedBooking.id}</p>

            <img
              className="booking-modal-image"
              src={selectedBooking.image}
              alt={selectedBooking.provider}
            />

            <h3>{selectedBooking.service}</h3>
            <p>{selectedBooking.description}</p>

            <div className="booking-modal-details">
              <span>Professional</span>
              <strong>{selectedBooking.provider}</strong>

              <span>Date</span>
              <strong>{selectedBooking.date}</strong>

              <span>Time</span>
              <strong>{selectedBooking.time}</strong>

              <span>Location</span>
              <strong>{selectedBooking.location}</strong>

              <span>Amount</span>
              <strong>{formatCurrency(selectedBooking.amount)}</strong>

              <span>Status</span>
              <strong>
                {selectedBooking.status === "Upcoming"
                  ? selectedBooking.originalStatus
                  : selectedBooking.status}
              </strong>

              <span>Phone</span>
              <strong>{selectedBooking.phone}</strong>
            </div>

            {selectedBooking.status === "Upcoming" && (
              <button
                type="button"
                className="booking-modal-cancel"
                onClick={() => cancelBooking(selectedBooking)}
                disabled={cancellingId === selectedBooking.id}
              >
                {cancellingId === selectedBooking.id
                  ? "Cancelling..."
                  : "Cancel Booking"}
              </button>
            )}
          </section>
        </div>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <div
          className="booking-modal-overlay"
          onClick={() => setReviewBooking(null)}
        >
          <form
            className="booking-modal review-modal"
            onSubmit={submitReview}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="booking-modal-close"
              onClick={() => setReviewBooking(null)}
              aria-label="Close review"
            >
              ×
            </button>

            <h2>Leave a Review</h2>

            <p>Share your experience with {reviewBooking.provider}.</p>

            <div className="review-stars">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  type="button"
                  key={rating}
                  aria-label={`Rate ${rating} stars`}
                  onClick={() => setReviewRating(rating)}
                  className={rating <= reviewRating ? "selected" : ""}
                >
                  <Star size={27} fill="currentColor" />
                </button>
              ))}
            </div>

            <textarea
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              placeholder="Tell us about your experience..."
              rows={4}
              maxLength={1000}
              required
            />

            <button type="submit" className="review-submit">
              Submit Review
            </button>
          </form>
        </div>
      )}

      {notice && (
        <div className="booking-notice" role="status">
          {notice}

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default UserBookings;
