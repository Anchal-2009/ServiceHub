import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  BriefcaseBusiness,
  UserCheck,
  Clock3,
  UserX,
  Eye,
  CheckCircle2,
  XCircle,
  X,
  MapPin,
  Phone,
  Mail,
  CalendarDays,
  Star,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import { apiRequest } from "../../services/api";
import "../../styles/AdminDashboard.css";

function AdminProviders() {
  const navigate = useNavigate();

  const [providers, setProviders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Fetch providers from the backend
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest("/admin/providers");

        setProviders(data.providers || []);
      } catch (error) {
        setError(error.message || "Unable to load providers.");
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  // Search and filter providers
  const filteredProviders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return providers.filter((provider) => {
      const matchesSearch =
        !query ||
        (provider.name || "").toLowerCase().includes(query) ||
        (provider.email || "").toLowerCase().includes(query) ||
        (provider._id || "").toLowerCase().includes(query) ||
        (provider.category || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || provider.status === statusFilter;

      const matchesCategory =
        categoryFilter === "All" || provider.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [providers, searchTerm, statusFilter, categoryFilter]);

  // Provider statistics
  const pendingCount = providers.filter(
    (provider) => provider.status === "Pending",
  ).length;

  const approvedCount = providers.filter(
    (provider) => provider.status === "Approved",
  ).length;

  const rejectedCount = providers.filter(
    (provider) => provider.status === "Rejected",
  ).length;

  // Update provider status in MongoDB
  const updateProviderStatus = async (providerId, newStatus) => {
    try {
      setUpdatingId(providerId);
      setError("");

      const data = await apiRequest(`/admin/providers/${providerId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      const updatedProvider = data.provider;

      setProviders((currentProviders) =>
        currentProviders.map((provider) =>
          provider._id === providerId
            ? { ...provider, ...updatedProvider }
            : provider,
        ),
      );

      setSelectedProvider((currentProvider) =>
        currentProvider?._id === providerId
          ? { ...currentProvider, ...updatedProvider }
          : currentProvider,
      );
    } catch (error) {
      setError(error.message || "Unable to update provider status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Reset search and filters
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setCategoryFilter("All");
  };

  // Format provider name initials
  const getInitials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  // Format application date
  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="admin-providers-layout">
      <Sidebar
        role="admin"
        activeItem="/admin-providers"
        onLogout={() => navigate("/login")}
      />

      <main className="admin-providers-main">
        <div className="admin-providers-content">
          <div className="admin-providers-page-intro">
            <div>
              <h2>Service Providers</h2>
              <p>
                Review applications and manage professionals listed on
                ServiceHub.
              </p>
            </div>

            <button
              type="button"
              className="admin-providers-filter-toggle"
              onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
            >
              <Search size={15} />
              Filter Providers
            </button>
          </div>

          {/* Loading and error messages */}
          {loading && (
            <div className="admin-providers-empty-state">
              <strong>Loading providers...</strong>
            </div>
          )}

          {error && (
            <div className="admin-providers-review-notice">
              <div className="admin-providers-review-notice-icon">
                <XCircle size={20} />
              </div>
              <div>
                <strong>Something went wrong</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Provider statistics */}
          <section className="admin-providers-stats">
            <article className="admin-providers-stat-card">
              <div className="admin-providers-stat-top">
                <span>Total Providers</span>
                <div className="admin-providers-stat-icon total">
                  <BriefcaseBusiness size={20} />
                </div>
              </div>
              <strong>{providers.length}</strong>
              <p>Listed provider accounts</p>
            </article>

            <article className="admin-providers-stat-card">
              <div className="admin-providers-stat-top">
                <span>Approved</span>
                <div className="admin-providers-stat-icon approved">
                  <UserCheck size={20} />
                </div>
              </div>
              <strong>{approvedCount}</strong>
              <p>Approved providers</p>
            </article>

            <article className="admin-providers-stat-card">
              <div className="admin-providers-stat-top">
                <span>Pending Review</span>
                <div className="admin-providers-stat-icon pending">
                  <Clock3 size={20} />
                </div>
              </div>
              <strong>{pendingCount}</strong>
              <p>Applications to review</p>
            </article>

            <article className="admin-providers-stat-card">
              <div className="admin-providers-stat-top">
                <span>Rejected</span>
                <div className="admin-providers-stat-icon rejected">
                  <UserX size={20} />
                </div>
              </div>
              <strong>{rejectedCount}</strong>
              <p>Rejected applications</p>
            </article>
          </section>

          {/* Pending application notice */}
          {!loading && pendingCount > 0 && (
            <section className="admin-providers-review-notice">
              <div className="admin-providers-review-notice-icon">
                <Clock3 size={20} />
              </div>

              <div>
                <strong>Applications need your attention</strong>
                <p>
                  There {pendingCount === 1 ? "is" : "are"} {pendingCount}{" "}
                  pending provider application
                  {pendingCount === 1 ? "" : "s"}. Review each application
                  before making a decision.
                </p>
              </div>
            </section>
          )}

          {/* Providers table */}
          <section className="admin-providers-table-card">
            <div className="admin-providers-table-heading">
              <div>
                <h3>All Providers</h3>
                <p>
                  Showing {filteredProviders.length} of {providers.length}{" "}
                  providers
                </p>
              </div>

              <div className="admin-providers-table-controls">
                <label className="admin-providers-table-search">
                  <Search size={16} />
                  <input
                    type="search"
                    placeholder="Search by name or ID"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </label>

                <button
                  type="button"
                  className="admin-providers-reset-button"
                  onClick={resetFilters}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="admin-providers-filter-panel">
                <label>
                  Application status
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="All">All statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </label>

                <label>
                  Service category
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                  >
                    <option value="All">All categories</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="AC Repair">AC Repair</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Painting">Painting</option>
                    <option value="Beauty & Wellness">Beauty & Wellness</option>
                    <option value="Pest Control">Pest Control</option>
                    <option value="Appliance Repair">Appliance Repair</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
              </div>
            )}

            <div className="admin-providers-table-scroll">
              <table className="admin-providers-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Applied On</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {!loading &&
                    filteredProviders.map((provider) => (
                      <tr key={provider._id}>
                        <td>
                          <div className="admin-providers-user-cell">
                            <div className="admin-providers-user-avatar">
                              {getInitials(provider.name)}
                            </div>

                            <div className="admin-providers-user-details">
                              <strong>{provider.name}</strong>
                              <span>{provider.category} Services</span>
                              <small>
                                {provider._id.slice(-6).toUpperCase()}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="admin-providers-category">
                            {provider.category}
                          </span>
                        </td>

                        <td>
                          <span className="admin-providers-location">
                            <MapPin size={13} />
                            {provider.location}
                          </span>
                        </td>

                        <td>{formatDate(provider.applied)}</td>

                        <td>
                          <span className="admin-providers-no-rating">
                            Not rated
                          </span>
                        </td>

                        <td>
                          <span
                            className={`admin-providers-status ${provider.status.toLowerCase()}`}
                          >
                            <span />
                            {provider.status}
                          </span>
                        </td>

                        <td>
                          <div className="admin-providers-row-actions">
                            <button
                              type="button"
                              className="admin-providers-view-action"
                              title="View provider details"
                              aria-label={`View ${provider.name}`}
                              onClick={() => setSelectedProvider(provider)}
                            >
                              <Eye size={16} />
                            </button>

                            {provider.status === "Pending" && (
                              <>
                                <button
                                  type="button"
                                  className="admin-providers-approve-action"
                                  title="Approve provider"
                                  aria-label={`Approve ${provider.name}`}
                                  disabled={updatingId === provider._id}
                                  onClick={() =>
                                    updateProviderStatus(
                                      provider._id,
                                      "Approved",
                                    )
                                  }
                                >
                                  <CheckCircle2 size={16} />
                                </button>

                                <button
                                  type="button"
                                  className="admin-providers-reject-action"
                                  title="Reject provider"
                                  aria-label={`Reject ${provider.name}`}
                                  disabled={updatingId === provider._id}
                                  onClick={() =>
                                    updateProviderStatus(
                                      provider._id,
                                      "Rejected",
                                    )
                                  }
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {!loading && filteredProviders.length === 0 && (
                <div className="admin-providers-empty-state">
                  <BriefcaseBusiness size={32} />
                  <strong>No providers found</strong>
                  <p>Try a different search term or filter.</p>
                  <button type="button" onClick={resetFilters}>
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            <div className="admin-providers-table-footer">
              <span>
                {filteredProviders.length} provider
                {filteredProviders.length === 1 ? "" : "s"} displayed
              </span>
            </div>
          </section>
        </div>
      </main>

      {/* Provider details modal */}
      {selectedProvider && (
        <div
          className="admin-providers-modal-overlay"
          onClick={() => setSelectedProvider(null)}
        >
          <section
            className="admin-providers-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-providers-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-providers-modal-heading">
              <div>
                <span>PROVIDER APPLICATION</span>
                <h2 id="admin-providers-modal-title">Provider Details</h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProvider(null)}
                aria-label="Close provider details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-providers-modal-profile">
              <div className="admin-providers-modal-avatar">
                {getInitials(selectedProvider.name)}
              </div>

              <div>
                <h3>{selectedProvider.name}</h3>
                <p>{selectedProvider.category} Services</p>

                <span
                  className={`admin-providers-status ${selectedProvider.status.toLowerCase()}`}
                >
                  <span />
                  {selectedProvider.status}
                </span>
              </div>
            </div>

            <div className="admin-providers-modal-details">
              <div>
                <Mail size={15} />
                <span>{selectedProvider.email || "Not provided"}</span>
              </div>

              <div>
                <Phone size={15} />
                <span>{selectedProvider.phone || "Not provided"}</span>
              </div>

              <div>
                <MapPin size={15} />
                <span>{selectedProvider.location || "Not specified"}</span>
              </div>

              <div>
                <BriefcaseBusiness size={15} />
                <span>{selectedProvider.category || "Not specified"}</span>
              </div>

              <div>
                <Clock3 size={15} />
                <span>
                  Experience: {selectedProvider.experience || "Not specified"}
                </span>
              </div>

              <div>
                <CalendarDays size={15} />
                <span>Applied on {formatDate(selectedProvider.applied)}</span>
              </div>

              <div>
                <Star size={15} />
                <span>Rating and completed jobs not available yet</span>
              </div>
            </div>

            <div className="admin-providers-description">
              <h4>About the business</h4>
              <p>
                {selectedProvider.description ||
                  "No business description provided."}
              </p>
            </div>

            <div className="admin-providers-modal-actions">
              <button
                type="button"
                className="admin-providers-modal-secondary"
                onClick={() => setSelectedProvider(null)}
              >
                Close
              </button>

              {selectedProvider.status === "Pending" && (
                <>
                  <button
                    type="button"
                    className="admin-providers-modal-reject"
                    disabled={updatingId === selectedProvider._id}
                    onClick={() =>
                      updateProviderStatus(selectedProvider._id, "Rejected")
                    }
                  >
                    <XCircle size={15} />
                    Reject
                  </button>

                  <button
                    type="button"
                    className="admin-providers-modal-approve"
                    disabled={updatingId === selectedProvider._id}
                    onClick={() =>
                      updateProviderStatus(selectedProvider._id, "Approved")
                    }
                  >
                    <CheckCircle2 size={15} />
                    Approve
                  </button>
                </>
              )}

              {selectedProvider.status === "Rejected" && (
                <button
                  type="button"
                  className="admin-providers-modal-approve"
                  disabled={updatingId === selectedProvider._id}
                  onClick={() =>
                    updateProviderStatus(selectedProvider._id, "Approved")
                  }
                >
                  <CheckCircle2 size={15} />
                  Approve Provider
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminProviders;
