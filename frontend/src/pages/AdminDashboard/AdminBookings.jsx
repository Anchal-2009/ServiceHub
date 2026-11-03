import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  CalendarDays,
  Clock3,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Eye,
  X,
  MapPin,
  Phone,
  Mail,
  Filter,
  UserRound,
  BriefcaseBusiness,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import { apiRequest } from "../../services/api";
import "../../styles/AdminDashboard.css";

const bookingStatuses = ["Pending", "Confirmed", "Completed", "Cancelled"];

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function AdminBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  // Fetch bookings from backend
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest("/admin/bookings");

      setBookings(response.bookings || []);
    } catch (err) {
      setError(err.message || "Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Search and filter bookings
  const filteredBookings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesSearch =
        !query ||
        String(booking.id).toLowerCase().includes(query) ||
        booking.customer?.toLowerCase().includes(query) ||
        booking.provider?.toLowerCase().includes(query) ||
        booking.service?.toLowerCase().includes(query) ||
        booking.category?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || booking.status === statusFilter;

      const matchesCategory =
        categoryFilter === "All" || booking.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [bookings, searchTerm, statusFilter, categoryFilter]);

  // Statistics
  const pendingCount = bookings.filter(
    (booking) => booking.status === "Pending",
  ).length;

  const confirmedCount = bookings.filter(
    (booking) => booking.status === "Confirmed",
  ).length;

  const completedCount = bookings.filter(
    (booking) => booking.status === "Completed",
  ).length;

  const cancelledCount = bookings.filter(
    (booking) => booking.status === "Cancelled",
  ).length;

  const totalRevenue = bookings.reduce(
    (total, booking) => total + (Number(booking.amount) || 0),
    0,
  );

  // Get available categories dynamically
  const categories = [
    ...new Set(bookings.map((booking) => booking.category).filter(Boolean)),
  ];

  // Update booking status in backend
  const updateBooking = async (bookingId, updates) => {
    try {
      setUpdatingBookingId(bookingId);
      setActionError("");

      const response = await apiRequest(`/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });

      const updatedBooking = response.booking;

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, ...updatedBooking }
            : booking,
        ),
      );

      setSelectedBooking((currentBooking) =>
        currentBooking?.id === bookingId
          ? { ...currentBooking, ...updatedBooking }
          : currentBooking,
      );

      return true;
    } catch (err) {
      setActionError(err.message || "Unable to update booking status.");

      return false;
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setCategoryFilter("All");
  };

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div className="admin-bookings-layout">
      <Sidebar
        role="admin"
        activeItem="/admin-bookings"
        onLogout={() => navigate("/login")}
      />

      <main className="admin-bookings-main">
        <div className="admin-bookings-content">
          {/* Page heading */}
          <div className="admin-bookings-page-intro">
            <div>
              <h2>Booking Overview</h2>
              <p>
                Monitor customer requests, service appointments, and bookings.
              </p>
            </div>

            <button
              type="button"
              className="admin-bookings-filter-toggle"
              onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
            >
              <Filter size={16} />
              Filters
            </button>
          </div>

          {/* Statistics */}
          <section className="admin-bookings-stats">
            <article className="admin-bookings-stat-card">
              <div className="admin-bookings-stat-top">
                <span>Total Bookings</span>
                <div className="admin-bookings-stat-icon total">
                  <CalendarDays size={20} />
                </div>
              </div>
              <strong>{bookings.length.toLocaleString("en-IN")}</strong>
              <p>All service bookings</p>
            </article>

            <article className="admin-bookings-stat-card">
              <div className="admin-bookings-stat-top">
                <span>Pending</span>
                <div className="admin-bookings-stat-icon pending">
                  <Clock3 size={20} />
                </div>
              </div>
              <strong>{pendingCount.toLocaleString("en-IN")}</strong>
              <p>Awaiting confirmation</p>
            </article>

            <article className="admin-bookings-stat-card">
              <div className="admin-bookings-stat-top">
                <span>Confirmed</span>
                <div className="admin-bookings-stat-icon confirmed">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <strong>{confirmedCount.toLocaleString("en-IN")}</strong>
              <p>Scheduled bookings</p>
            </article>

            <article className="admin-bookings-stat-card">
              <div className="admin-bookings-stat-top">
                <span>Total Booking Value</span>
                <div className="admin-bookings-stat-icon revenue">
                  <IndianRupee size={20} />
                </div>
              </div>
              <strong>{formatCurrency(totalRevenue)}</strong>
              <p>Combined booking amounts</p>
            </article>
          </section>

          {/* Secondary statistics */}
          <section className="admin-bookings-secondary-stats">
            <div>
              <span className="admin-bookings-secondary-icon completed">
                <CheckCircle2 size={17} />
              </span>
              <div>
                <span>Completed bookings</span>
                <strong>{completedCount}</strong>
              </div>
            </div>

            <div>
              <span className="admin-bookings-secondary-icon cancelled">
                <XCircle size={17} />
              </span>
              <div>
                <span>Cancelled bookings</span>
                <strong>{cancelledCount}</strong>
              </div>
            </div>
          </section>

          {/* Bookings table */}
          <section className="admin-bookings-table-card">
            <div className="admin-bookings-table-heading">
              <div>
                <h3>All Bookings</h3>
                <p>
                  Showing {filteredBookings.length} of {bookings.length}{" "}
                  bookings
                </p>
              </div>

              <div className="admin-bookings-table-controls">
                <label className="admin-bookings-table-search">
                  <Search size={16} />
                  <input
                    type="search"
                    placeholder="Search ID, customer..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </label>

                <button
                  type="button"
                  className="admin-bookings-reset-button"
                  onClick={resetFilters}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="admin-bookings-filter-panel">
                <label>
                  Booking status
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="All">All statuses</option>

                    {bookingStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Service category
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                  >
                    <option value="All">All categories</option>

                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {actionError && (
              <p className="admin-bookings-error">{actionError}</p>
            )}

            {loading ? (
              <div className="admin-bookings-empty-state">
                <p>Loading bookings...</p>
              </div>
            ) : error ? (
              <div className="admin-bookings-empty-state">
                <CalendarDays size={32} />
                <strong>Unable to load bookings</strong>
                <p>{error}</p>
                <button type="button" onClick={fetchBookings}>
                  Try again
                </button>
              </div>
            ) : (
              <>
                <div className="admin-bookings-table-scroll">
                  <table className="admin-bookings-table">
                    <thead>
                      <tr>
                        <th>Booking</th>
                        <th>Customer</th>
                        <th>Service / Provider</th>
                        <th>Appointment</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td>
                            <div className="admin-bookings-id-cell">
                              <strong>
                                {String(booking.id).slice(-8).toUpperCase()}
                              </strong>
                              <span>Created {formatDate(booking.created)}</span>
                            </div>
                          </td>

                          <td>
                            <div className="admin-bookings-person-cell">
                              <div className="admin-bookings-person-avatar">
                                {getInitials(booking.customer)}
                              </div>
                              <strong>{booking.customer}</strong>
                            </div>
                          </td>

                          <td>
                            <div className="admin-bookings-service-cell">
                              <strong>{booking.service}</strong>
                              <span>{booking.category}</span>
                              <small>Provider: {booking.provider}</small>
                            </div>
                          </td>

                          <td>
                            <div className="admin-bookings-date-cell">
                              <strong>{formatDate(booking.date)}</strong>
                              <span>{booking.time || "—"}</span>
                            </div>
                          </td>

                          <td className="admin-bookings-amount">
                            {formatCurrency(booking.amount)}
                          </td>

                          <td>
                            {editingBookingId === booking.id ? (
                              <select
                                className="admin-bookings-inline-status"
                                value={booking.status}
                                disabled={updatingBookingId === booking.id}
                                aria-label={`Change status for ${booking.id}`}
                                onChange={async (event) => {
                                  const newStatus = event.target.value;

                                  const success = await updateBooking(
                                    booking.id,
                                    { status: newStatus },
                                  );

                                  if (success) {
                                    setEditingBookingId(null);
                                  }
                                }}
                                onBlur={() => {
                                  if (updatingBookingId !== booking.id) {
                                    setEditingBookingId(null);
                                  }
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === "Escape") {
                                    setEditingBookingId(null);
                                  }
                                }}
                                autoFocus
                              >
                                {bookingStatuses.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <button
                                type="button"
                                className={`admin-bookings-status ${booking.status?.toLowerCase()}`}
                                onClick={() => setEditingBookingId(booking.id)}
                                title="Click to change booking status"
                              >
                                <span />
                                {booking.status}
                              </button>
                            )}
                          </td>

                          <td>
                            <button
                              type="button"
                              className="admin-bookings-view-action"
                              title="View booking details"
                              aria-label={`View ${booking.id}`}
                              onClick={() => {
                                setActionError("");
                                setSelectedBooking(booking);
                              }}
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredBookings.length === 0 && (
                    <div className="admin-bookings-empty-state">
                      <CalendarDays size={32} />
                      <strong>No bookings found</strong>
                      <p>Try changing your search or filters.</p>
                      <button type="button" onClick={resetFilters}>
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {/* Booking details modal */}
      {selectedBooking && (
        <div
          className="admin-bookings-modal-overlay"
          onClick={() => setSelectedBooking(null)}
        >
          <section
            className="admin-bookings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-bookings-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-bookings-modal-heading">
              <div>
                <span>BOOKING DETAILS</span>
                <h2 id="admin-bookings-modal-title">
                  {String(selectedBooking.id).slice(-8).toUpperCase()}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                aria-label="Close booking details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-bookings-modal-status-row">
              <span
                className={`admin-bookings-status ${selectedBooking.status?.toLowerCase()}`}
              >
                <span />
                {selectedBooking.status}
              </span>

              <span className="admin-bookings-payment pending">
                Not recorded
              </span>
            </div>

            <div className="admin-bookings-modal-section">
              <h3>
                <UserRound size={16} />
                Customer Information
              </h3>

              <p>
                <UserRound size={15} />
                {selectedBooking.customer}
              </p>

              <p>
                <Mail size={15} />
                {selectedBooking.customerEmail}
              </p>

              <p>
                <Phone size={15} />
                {selectedBooking.customerPhone}
              </p>
            </div>

            <div className="admin-bookings-modal-section">
              <h3>
                <BriefcaseBusiness size={16} />
                Service Information
              </h3>

              <p>
                <BriefcaseBusiness size={15} />
                {selectedBooking.service} · {selectedBooking.category}
              </p>

              <p>
                <UserRound size={15} />
                {selectedBooking.provider}
              </p>

              <p>
                <Mail size={15} />
                {selectedBooking.providerEmail}
              </p>

              <p>
                <MapPin size={15} />
                {selectedBooking.location}
              </p>
            </div>

            <div className="admin-bookings-modal-summary">
              <div>
                <span>Appointment</span>
                <strong>
                  {formatDate(selectedBooking.date)} ·{" "}
                  {selectedBooking.time || "—"}
                </strong>
              </div>

              <div>
                <span>Booking created</span>
                <strong>{formatDate(selectedBooking.created)}</strong>
              </div>

              <div>
                <span>Booking amount</span>
                <strong>{formatCurrency(selectedBooking.amount)}</strong>
              </div>
            </div>

            {actionError && (
              <p className="admin-bookings-error">{actionError}</p>
            )}

            <div className="admin-bookings-modal-actions">
              <button
                type="button"
                className="admin-bookings-modal-secondary"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </button>

              <label className="admin-bookings-modal-status-control">
                Change status
                <select
                  value={selectedBooking.status}
                  disabled={updatingBookingId === selectedBooking.id}
                  onChange={(event) =>
                    updateBooking(selectedBooking.id, {
                      status: event.target.value,
                    })
                  }
                >
                  {bookingStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminBookings;
