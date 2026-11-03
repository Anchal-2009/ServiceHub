import { Link, useLocation } from "react-router-dom";
import {
  Check,
  CalendarDays,
  Clock3,
  MapPin,
  UserRound,
  Phone,
  IndianRupee,
  ClipboardList,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

import "../../styles/UserServices.css";

// Format the date received from MongoDB
function formatDate(dateString) {
  if (!dateString) return "Not specified";

  const datePart = String(dateString).slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Convert 24-hour time into 12-hour format
function formatTime(timeString) {
  if (!timeString) return "Not specified";

  const [hours, minutes] = timeString.split(":");
  const date = new Date();

  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function BookingConfirmation() {
  const location = useLocation();
  const booking = location.state?.booking;

  if (!booking) {
    return (
      <div className="confirmation-layout">
        <main className="confirmation-main">
          <div className="confirmation-empty">
            <div className="confirmation-empty-icon">
              <ClipboardList size={32} />
            </div>

            <h1>No Booking Details Found</h1>

            <p>
              We couldn't find booking details for this page. Please choose a
              service and submit your booking request first.
            </p>

            <Link to="/user-services" className="confirmation-primary-btn">
              <ArrowLeft size={17} />
              Browse Services
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const price = Number(booking.price) || 0;

  const bookingReference = booking.bookingId || booking._id || "Pending";

  const isConfirmed = booking.status === "Confirmed";

  const statusMessage = isConfirmed
    ? "Booking Confirmed"
    : booking.status === "Cancelled"
      ? "Booking Cancelled"
      : booking.status === "Completed"
        ? "Service Completed"
        : "Awaiting Provider Confirmation";

  return (
    <div className="confirmation-layout">
      <main className="confirmation-main">
        <div className="confirmation-content">
          <Link to="/user-services" className="confirmation-back-link">
            <ArrowLeft size={16} />
            Back to Services
          </Link>

          <section className="confirmation-card">
            <div className="confirmation-success-icon">
              <Check size={37} strokeWidth={3} />
            </div>

            <h1>
              {isConfirmed
                ? "Booking Confirmed!"
                : booking.status === "Cancelled"
                  ? "Booking Cancelled"
                  : booking.status === "Completed"
                    ? "Service Completed!"
                    : "Booking Request Submitted!"}
            </h1>

            <p className="confirmation-subtitle">
              {isConfirmed
                ? "Your service provider has confirmed your booking."
                : booking.status === "Cancelled"
                  ? "This booking has been cancelled."
                  : booking.status === "Completed"
                    ? "Your service has been completed successfully."
                    : "Your booking request has been submitted successfully."}
            </p>

            <div className="confirmation-status">
              <CheckCircle2 size={17} />
              <span>{statusMessage}</span>
            </div>

            <div className="confirmation-divider" />

            <div className="confirmation-details">
              <h2>Booking Details</h2>

              <div className="confirmation-detail-row">
                <span className="confirmation-detail-icon">
                  <ClipboardList size={18} />
                </span>

                <div className="confirmation-detail-text">
                  <span className="confirmation-label">Booking ID</span>

                  <strong>{bookingReference}</strong>
                </div>
              </div>

              <div className="confirmation-detail-row">
                <span className="confirmation-detail-icon">
                  <UserRound size={18} />
                </span>

                <div className="confirmation-detail-text">
                  <span className="confirmation-label">Service Provider</span>

                  <strong>{booking.providerName || "Service Provider"}</strong>
                </div>
              </div>

              <div className="confirmation-detail-row">
                <span className="confirmation-detail-icon">
                  <ClipboardList size={18} />
                </span>

                <div className="confirmation-detail-text">
                  <span className="confirmation-label">Selected Service</span>

                  <strong>
                    {booking.serviceName || booking.category || "Service"}
                  </strong>
                </div>
              </div>

              <div className="confirmation-detail-row">
                <span className="confirmation-detail-icon">
                  <CalendarDays size={18} />
                </span>

                <div className="confirmation-detail-text">
                  <span className="confirmation-label">Date</span>

                  <strong>{formatDate(booking.date)}</strong>
                </div>
              </div>

              <div className="confirmation-detail-row">
                <span className="confirmation-detail-icon">
                  <Clock3 size={18} />
                </span>

                <div className="confirmation-detail-text">
                  <span className="confirmation-label">Time</span>

                  <strong>{formatTime(booking.time)}</strong>
                </div>
              </div>

              <div className="confirmation-detail-row">
                <span className="confirmation-detail-icon">
                  <MapPin size={18} />
                </span>

                <div className="confirmation-detail-text">
                  <span className="confirmation-label">Service Address</span>

                  <strong>{booking.address || "Not specified"}</strong>
                </div>
              </div>

              {booking.customerName && (
                <div className="confirmation-detail-row">
                  <span className="confirmation-detail-icon">
                    <UserRound size={18} />
                  </span>

                  <div className="confirmation-detail-text">
                    <span className="confirmation-label">Customer</span>

                    <strong>{booking.customerName}</strong>
                  </div>
                </div>
              )}

              {booking.phone && (
                <div className="confirmation-detail-row">
                  <span className="confirmation-detail-icon">
                    <Phone size={18} />
                  </span>

                  <div className="confirmation-detail-text">
                    <span className="confirmation-label">Contact Number</span>

                    <strong>{booking.phone}</strong>
                  </div>
                </div>
              )}

              {booking.instructions && (
                <div className="confirmation-detail-row">
                  <span className="confirmation-detail-icon">
                    <ClipboardList size={18} />
                  </span>

                  <div className="confirmation-detail-text">
                    <span className="confirmation-label">
                      Additional Instructions
                    </span>

                    <strong>{booking.instructions}</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="confirmation-total">
              <div>
                <span className="confirmation-total-label">
                  Estimated Total
                </span>

                <span className="confirmation-total-note">
                  Final amount may depend on the service provided.
                </span>
              </div>

              <strong>
                <IndianRupee size={19} />
                {price.toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="confirmation-actions">
              <Link
                to="/user-bookings"
                state={{ booking }}
                className="confirmation-primary-btn"
              >
                View My Bookings
              </Link>

              <Link to="/user-services" className="confirmation-secondary-btn">
                Back to Services
              </Link>
            </div>

            <p className="confirmation-footer-note">
              Keep your booking ID for reference. Your booking status will
              update when the service provider responds.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
