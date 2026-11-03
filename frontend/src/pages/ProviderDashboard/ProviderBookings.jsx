import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  CalendarDays,
  Clock3,
  MapPin,
  Phone,
  Eye,
  CheckCircle2,
  XCircle,
  BriefcaseBusiness,
  X,
  UserRound,
  IndianRupee,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import { apiRequest } from "../../services/api";
import "../../styles/ProviderDashboard.css";

const statusOptions = [
  "All",
  "Pending",
  "Confirmed",
  "In Progress",
  "Completed",
  "Cancelled",
];

function formatDate(dateString) {
  if (!dateString) return "Date unavailable";

  const datePart = String(dateString).split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);

  if (!year || !month || !day) return "Date unavailable";

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  const className = status.toLowerCase().replaceAll(" ", "-");

  return (
    <span className={`booking-status status-${className}`}>
      <span className="status-dot" />
      {status}
    </span>
  );
}

export default function ProviderBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Fetch bookings belonging to the logged-in provider
  useEffect(() => {
    let isMounted = true;

    async function fetchBookings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest("/bookings/provider");

        if (!data.success) {
          throw new Error(data.message || "Unable to load bookings.");
        }

        const formattedBookings = (data.bookings || []).map((booking) => ({
          ...booking,
          id: booking._id,
          customer: booking.customer?.name || "Customer",
          service: booking.service?.title || booking.serviceName || "Service",
          description: booking.instructions || "No additional service details.",
          date: booking.date,
          time: booking.time || "Time unavailable",
          duration: "Not specified",
          amount: Number(booking.price) || 0,
          address: booking.address || "Address not available",
          phone: booking.phone || "Phone not available",
          notes: booking.instructions || "",
          status: booking.status,
        }));

        if (isMounted) {
          setBookings(formattedBookings);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load bookings.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchBookings();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === "Pending").length,
      confirmed: bookings.filter((b) => b.status === "Confirmed").length,
      completed: bookings.filter((b) => b.status === "Completed").length,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesFilter =
        activeFilter === "All" || booking.status === activeFilter;

      const matchesSearch =
        !term ||
        booking.id.toLowerCase().includes(term) ||
        booking.customer.toLowerCase().includes(term) ||
        booking.service.toLowerCase().includes(term);

      return matchesFilter && matchesSearch;
    });
  }, [bookings, searchTerm, activeFilter]);

  // Save status changes in MongoDB
  async function handleStatusChange(booking, newStatus) {
    try {
      setUpdatingId(booking.id);
      setError("");
      setNotice("");

      const data = await apiRequest(`/bookings/${booking.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      if (!data.success) {
        throw new Error(data.message || "Unable to update booking.");
      }

      const updatedBooking = {
        ...booking,
        status: data.booking?.status || newStatus,
      };

      setBookings((current) =>
        current.map((item) => (item.id === booking.id ? updatedBooking : item)),
      );

      setSelectedBooking((current) =>
        current?.id === booking.id ? updatedBooking : current,
      );

      setNotice(data.message || `Booking updated to ${newStatus}.`);
    } catch (err) {
      setError(err.message || "Unable to update booking status.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="provider-bookings-layout">
      <Sidebar
        role="provider"
        activeItem="/provider-bookings"
        onLogout={() => navigate("/login")}
      />

      <main className="provider-bookings-main">
        <header className="provider-bookings-header">
          <div>
            <h1>My Bookings</h1>
            <p className="provider-page-subtitle">
              Manage appointments and keep track of your service jobs.
            </p>
          </div>

          <div className="provider-header-date">
            <CalendarDays size={18} />
            <span>
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        {notice && (
          <div className="provider-booking-notice" role="status">
            <CheckCircle2 size={18} />
            {notice}
          </div>
        )}

        {error && (
          <div className="provider-booking-notice" role="alert">
            <XCircle size={18} />
            {error}
          </div>
        )}

        <section className="provider-booking-stats">
          <div className="provider-booking-stat">
            <div className="booking-stat-icon stat-icon-blue">
              <BriefcaseBusiness size={21} />
            </div>
            <div>
              <p>Total Bookings</p>
              <h2>{stats.total}</h2>
            </div>
          </div>

          <div className="provider-booking-stat">
            <div className="booking-stat-icon stat-icon-orange">
              <Clock3 size={21} />
            </div>
            <div>
              <p>Pending Requests</p>
              <h2>{stats.pending}</h2>
            </div>
          </div>

          <div className="provider-booking-stat">
            <div className="booking-stat-icon stat-icon-green">
              <CalendarDays size={21} />
            </div>
            <div>
              <p>Confirmed</p>
              <h2>{stats.confirmed}</h2>
            </div>
          </div>

          <div className="provider-booking-stat">
            <div className="booking-stat-icon stat-icon-purple">
              <CheckCircle2 size={21} />
            </div>
            <div>
              <p>Completed</p>
              <h2>{stats.completed}</h2>
            </div>
          </div>
        </section>

        <section className="provider-bookings-panel">
          <div className="provider-bookings-panel-heading">
            <div>
              <h2>All Appointments</h2>
              <p>Review customer requests and manage scheduled work.</p>
            </div>
          </div>

          <div className="provider-booking-toolbar">
            <label className="provider-booking-search">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search customer, service or booking ID..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <div
              className="provider-booking-filters"
              aria-label="Filter bookings"
            >
              {statusOptions.map((status) => (
                <button
                  type="button"
                  key={status}
                  className={activeFilter === status ? "active" : ""}
                  onClick={() => setActiveFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="provider-bookings-table-wrap">
            <table className="provider-bookings-table">
              <thead>
                <tr>
                  <th>Booking / Customer</th>
                  <th>Service</th>
                  <th>Date &amp; Time</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6">
                      <div className="provider-bookings-empty">
                        <p>Loading bookings...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <div className="booking-customer-cell">
                          <div className="booking-customer-avatar">
                            {booking.customer.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong>{booking.customer}</strong>
                            <span>{booking.id}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="booking-service-name">
                          {booking.service}
                        </span>
                        <span className="booking-service-description">
                          {booking.duration}
                        </span>
                      </td>

                      <td>
                        <span className="booking-date-text">
                          {formatDate(booking.date)}
                        </span>
                        <span className="booking-service-description">
                          {booking.time}
                        </span>
                      </td>

                      <td>
                        <strong className="booking-amount">
                          ₹{booking.amount.toLocaleString("en-IN")}
                        </strong>
                      </td>

                      <td>
                        <StatusBadge status={booking.status} />
                      </td>

                      <td>
                        <div className="booking-row-actions">
                          <button
                            type="button"
                            className="booking-action-view"
                            title="View booking details"
                            aria-label={`View ${booking.id}`}
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <Eye size={17} />
                          </button>

                          {booking.status === "Pending" && (
                            <>
                              <button
                                type="button"
                                className="booking-action-accept"
                                title="Accept booking"
                                aria-label={`Accept ${booking.id}`}
                                disabled={updatingId === booking.id}
                                onClick={() =>
                                  handleStatusChange(booking, "Confirmed")
                                }
                              >
                                <CheckCircle2 size={17} />
                              </button>

                              <button
                                type="button"
                                className="booking-action-reject"
                                title="Reject booking"
                                aria-label={`Reject ${booking.id}`}
                                disabled={updatingId === booking.id}
                                onClick={() =>
                                  handleStatusChange(booking, "Cancelled")
                                }
                              >
                                <XCircle size={17} />
                              </button>
                            </>
                          )}

                          {booking.status === "Confirmed" && (
                            <button
                              type="button"
                              className="booking-action-accept"
                              title="Start service"
                              disabled={updatingId === booking.id}
                              onClick={() =>
                                handleStatusChange(booking, "In Progress")
                              }
                            >
                              Start
                            </button>
                          )}

                          {booking.status === "In Progress" && (
                            <button
                              type="button"
                              className="booking-action-accept"
                              title="Mark as completed"
                              disabled={updatingId === booking.id}
                              onClick={() =>
                                handleStatusChange(booking, "Completed")
                              }
                            >
                              Done
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">
                      <div className="provider-bookings-empty">
                        <Search size={28} />
                        <h3>
                          {error
                            ? "Unable to load bookings"
                            : "No bookings found"}
                        </h3>
                        <p>
                          {error
                            ? "Please check your connection and try again."
                            : "Try a different search term or status filter."}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm("");
                            setActiveFilter("All");
                          }}
                        >
                          Clear filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="provider-bookings-panel-footer">
            Showing <strong>{filteredBookings.length}</strong> of{" "}
            <strong>{bookings.length}</strong> bookings
          </div>
        </section>
      </main>

      {selectedBooking && (
        <div
          className="provider-booking-modal-overlay"
          onClick={() => setSelectedBooking(null)}
        >
          <section
            className="provider-booking-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="provider-booking-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="provider-booking-modal-header">
              <div>
                <p>BOOKING DETAILS</p>
                <h2 id="provider-booking-modal-title">{selectedBooking.id}</h2>
              </div>

              <button
                type="button"
                aria-label="Close booking details"
                onClick={() => setSelectedBooking(null)}
              >
                <X size={21} />
              </button>
            </div>

            <div className="provider-booking-modal-body">
              <div className="booking-modal-customer">
                <div className="booking-customer-avatar large">
                  {selectedBooking.customer.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{selectedBooking.customer}</h3>
                  <StatusBadge status={selectedBooking.status} />
                </div>
              </div>

              <div className="booking-modal-service-card">
                <div className="booking-modal-service-icon">
                  <BriefcaseBusiness size={22} />
                </div>
                <div>
                  <span>Requested service</span>
                  <strong>{selectedBooking.service}</strong>
                  <p>{selectedBooking.description}</p>
                </div>
              </div>

              <div className="booking-modal-details-grid">
                <div>
                  <CalendarDays size={18} />
                  <span>Date</span>
                  <strong>{formatDate(selectedBooking.date)}</strong>
                </div>

                <div>
                  <Clock3 size={18} />
                  <span>Time &amp; duration</span>
                  <strong>
                    {selectedBooking.time} · {selectedBooking.duration}
                  </strong>
                </div>

                <div>
                  <IndianRupee size={18} />
                  <span>Booking amount</span>
                  <strong>
                    ₹{selectedBooking.amount.toLocaleString("en-IN")}
                  </strong>
                </div>

                <div>
                  <Phone size={18} />
                  <span>Customer phone</span>
                  <strong>{selectedBooking.phone}</strong>
                </div>
              </div>

              <div className="booking-modal-address">
                <MapPin size={18} />
                <div>
                  <span>Service address</span>
                  <strong>{selectedBooking.address}</strong>
                </div>
              </div>

              <div className="booking-modal-notes">
                <UserRound size={18} />
                <div>
                  <span>Customer notes</span>
                  <p>{selectedBooking.notes || "No additional notes."}</p>
                </div>
              </div>
            </div>

            <div className="provider-booking-modal-footer">
              {selectedBooking.status === "Pending" && (
                <>
                  <button
                    type="button"
                    className="booking-modal-secondary"
                    disabled={updatingId === selectedBooking.id}
                    onClick={() =>
                      handleStatusChange(selectedBooking, "Cancelled")
                    }
                  >
                    Decline
                  </button>

                  <button
                    type="button"
                    className="booking-modal-primary"
                    disabled={updatingId === selectedBooking.id}
                    onClick={() =>
                      handleStatusChange(selectedBooking, "Confirmed")
                    }
                  >
                    <CheckCircle2 size={17} />
                    Accept Booking
                  </button>
                </>
              )}

              {selectedBooking.status === "Confirmed" && (
                <button
                  type="button"
                  className="booking-modal-primary"
                  disabled={updatingId === selectedBooking.id}
                  onClick={() =>
                    handleStatusChange(selectedBooking, "In Progress")
                  }
                >
                  Start Service
                </button>
              )}

              {selectedBooking.status === "In Progress" && (
                <button
                  type="button"
                  className="booking-modal-primary"
                  disabled={updatingId === selectedBooking.id}
                  onClick={() =>
                    handleStatusChange(selectedBooking, "Completed")
                  }
                >
                  <CheckCircle2 size={17} />
                  Mark Completed
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
