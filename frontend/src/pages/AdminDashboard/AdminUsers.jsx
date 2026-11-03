import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Eye,
  Ban,
  CheckCircle2,
  X,
  Filter,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import { apiRequest } from "../../services/api";
import "../../styles/AdminDashboard.css";

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function AdminUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest("/admin/users");

      setUsers(response.users || []);
    } catch (err) {
      setError(err.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Search and filter users
  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        String(user.id).toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query);

      const matchesRole = roleFilter === "All" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "All" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Statistics
  const activeCount = users.filter((user) => user.status === "Active").length;

  const providerCount = users.filter((user) => user.role === "Provider").length;

  const suspendedCount = users.filter(
    (user) => user.status === "Suspended",
  ).length;

  // Suspend or activate account
  const toggleUserStatus = async (user) => {
    const isActive = user.status === "Suspended";

    try {
      setUpdatingUserId(user.id);
      setActionError("");

      const response = await apiRequest(`/admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });

      const updatedUser = response.user;

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                ...updatedUser,
              }
            : currentUser,
        ),
      );

      setSelectedUser((currentUser) =>
        currentUser?.id === user.id
          ? {
              ...currentUser,
              ...updatedUser,
            }
          : currentUser,
      );
    } catch (err) {
      setActionError(err.message || "Unable to update account status.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setRoleFilter("All");
    setStatusFilter("All");
  };

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div className="admin-users-layout">
      <Sidebar
        role="admin"
        activeItem="/admin-users"
        onLogout={() => navigate("/login")}
      />

      <main className="admin-users-main">
        <div className="admin-users-content">
          <div className="admin-users-page-intro">
            <div>
              <h2>Users Overview</h2>
              <p>
                Manage customer and service provider accounts across ServiceHub.
              </p>
            </div>

            <button
              type="button"
              className="admin-users-filter-toggle"
              onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
            >
              <Filter size={16} />
              Filters
            </button>
          </div>

          {/* Statistics */}
          <section className="admin-users-stats">
            <article className="admin-users-stat-card">
              <div className="admin-users-stat-top">
                <span>Total Users</span>
                <div className="admin-users-stat-icon users">
                  <Users size={20} />
                </div>
              </div>
              <strong>{users.length.toLocaleString("en-IN")}</strong>
              <p>Registered accounts</p>
            </article>

            <article className="admin-users-stat-card">
              <div className="admin-users-stat-top">
                <span>Active Accounts</span>
                <div className="admin-users-stat-icon active">
                  <UserCheck size={20} />
                </div>
              </div>
              <strong>{activeCount.toLocaleString("en-IN")}</strong>
              <p>Currently active</p>
            </article>

            <article className="admin-users-stat-card">
              <div className="admin-users-stat-top">
                <span>Service Providers</span>
                <div className="admin-users-stat-icon providers">
                  <ShieldCheck size={20} />
                </div>
              </div>
              <strong>{providerCount.toLocaleString("en-IN")}</strong>
              <p>Provider accounts</p>
            </article>

            <article className="admin-users-stat-card">
              <div className="admin-users-stat-top">
                <span>Suspended</span>
                <div className="admin-users-stat-icon suspended">
                  <UserX size={20} />
                </div>
              </div>
              <strong>{suspendedCount.toLocaleString("en-IN")}</strong>
              <p>Restricted accounts</p>
            </article>
          </section>

          {/* Users table */}
          <section className="admin-users-table-card">
            <div className="admin-users-table-heading">
              <div>
                <h3>All Users</h3>
                <p>
                  Showing {filteredUsers.length} of {users.length} accounts
                </p>
              </div>

              <div className="admin-users-table-controls">
                <label className="admin-users-table-search">
                  <Search size={16} />
                  <input
                    type="search"
                    placeholder="Name, email or ID"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </label>

                <button
                  type="button"
                  className="admin-users-reset-button"
                  onClick={resetFilters}
                >
                  Reset
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="admin-users-filter-panel">
                <label>
                  Role
                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                  >
                    <option value="All">All roles</option>
                    <option value="Customer">Customer</option>
                    <option value="Provider">Provider</option>
                  </select>
                </label>

                <label>
                  Account status
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="All">All statuses</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </label>
              </div>
            )}

            {actionError && <p className="admin-users-error">{actionError}</p>}

            {error && !loading && (
              <div className="admin-users-empty-state">
                <Users size={32} />
                <strong>Unable to load users</strong>
                <p>{error}</p>
                <button type="button" onClick={fetchUsers}>
                  Try again
                </button>
              </div>
            )}

            {loading ? (
              <div className="admin-users-empty-state">
                <p>Loading users...</p>
              </div>
            ) : !error ? (
              <>
                <div className="admin-users-table-scroll">
                  <table className="admin-users-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>User ID</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Bookings</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="admin-users-user-cell">
                              <div
                                className={`admin-users-user-avatar ${
                                  user.role === "Provider" ? "provider" : ""
                                }`}
                              >
                                {getInitials(user.name)}
                              </div>

                              <div className="admin-users-user-details">
                                <strong>{user.name}</strong>
                                <span>{user.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="admin-users-id-cell">
                            {String(user.id).slice(-8).toUpperCase()}
                          </td>

                          <td>
                            <span
                              className={`admin-users-role ${
                                user.role === "Provider"
                                  ? "provider"
                                  : "customer"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>

                          <td>{formatDate(user.joined)}</td>

                          <td className="admin-users-booking-count">
                            {user.bookings ?? 0}
                          </td>

                          <td>
                            <span
                              className={`admin-users-status ${user.status.toLowerCase()}`}
                            >
                              <span />
                              {user.status}
                            </span>
                          </td>

                          <td>
                            <div className="admin-users-row-actions">
                              <button
                                type="button"
                                className="admin-users-view-action"
                                title="View user details"
                                aria-label={`View ${user.name}`}
                                onClick={() => {
                                  setActionError("");
                                  setSelectedUser(user);
                                }}
                              >
                                <Eye size={17} />
                              </button>

                              <button
                                type="button"
                                disabled={updatingUserId === user.id}
                                className={
                                  user.status === "Suspended"
                                    ? "admin-users-activate-action"
                                    : "admin-users-suspend-action"
                                }
                                title={
                                  user.status === "Suspended"
                                    ? "Activate account"
                                    : "Suspend account"
                                }
                                aria-label={
                                  user.status === "Suspended"
                                    ? `Activate ${user.name}`
                                    : `Suspend ${user.name}`
                                }
                                onClick={() => toggleUserStatus(user)}
                              >
                                {user.status === "Suspended" ? (
                                  <CheckCircle2 size={17} />
                                ) : (
                                  <Ban size={17} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredUsers.length === 0 && (
                    <div className="admin-users-empty-state">
                      <Users size={32} />
                      <strong>No users found</strong>
                      <p>Try changing your search or filters.</p>
                      <button type="button" onClick={resetFilters}>
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>

                <div className="admin-users-table-footer">
                  <span>
                    {filteredUsers.length} user
                    {filteredUsers.length === 1 ? "" : "s"} displayed
                  </span>
                </div>
              </>
            ) : null}
          </section>
        </div>
      </main>

      {/* User details modal */}
      {selectedUser && (
        <div
          className="admin-users-modal-overlay"
          onClick={() => setSelectedUser(null)}
        >
          <section
            className="admin-users-user-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-users-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-users-modal-heading">
              <div>
                <span>USER DETAILS</span>
                <h2 id="admin-users-modal-title">Account Information</h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                aria-label="Close user details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-users-modal-profile">
              <div className="admin-users-modal-avatar">
                {getInitials(selectedUser.name)}
              </div>

              <div>
                <h3>{selectedUser.name}</h3>
                <p>{selectedUser.email}</p>

                <span
                  className={`admin-users-status ${selectedUser.status.toLowerCase()}`}
                >
                  <span />
                  {selectedUser.status}
                </span>
              </div>
            </div>

            <div className="admin-users-modal-details">
              <div>
                <span>User ID</span>
                <strong>
                  {String(selectedUser.id).slice(-8).toUpperCase()}
                </strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>{selectedUser.phone || "—"}</strong>
              </div>

              <div>
                <span>Account role</span>
                <strong>{selectedUser.role}</strong>
              </div>

              <div>
                <span>Joined on</span>
                <strong>{formatDate(selectedUser.joined)}</strong>
              </div>

              <div>
                <span>Total bookings</span>
                <strong>{selectedUser.bookings ?? 0}</strong>
              </div>
            </div>

            {actionError && <p className="admin-users-error">{actionError}</p>}

            <div className="admin-users-modal-actions">
              <button
                type="button"
                className="admin-users-modal-secondary"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>

              <button
                type="button"
                disabled={updatingUserId === selectedUser.id}
                className={
                  selectedUser.status === "Suspended"
                    ? "admin-users-modal-activate"
                    : "admin-users-modal-suspend"
                }
                onClick={() => toggleUserStatus(selectedUser)}
              >
                {updatingUserId === selectedUser.id
                  ? "Please wait..."
                  : selectedUser.status === "Suspended"
                    ? "Activate Account"
                    : "Suspend Account"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
