import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Users,
  BriefcaseBusiness,
  CalendarDays,
  ArrowUpRight,
  ArrowRight,
  Search,
  UserPlus,
  ShieldCheck,
  Activity,
  Eye,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import { apiRequest } from "../../services/api";
import "../../styles/AdminDashboard.css";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTimeAgo = (date) => {
  if (!date) return "Recently";

  const difference = Date.now() - new Date(date).getTime();

  if (Number.isNaN(difference)) return "Recently";

  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);

  return `${days} days ago`;
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [bookingFilter, setBookingFilter] = useState("All");
  const [chartPeriod, setChartPeriod] = useState("6 months");

  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 0,
      totalProviders: 0,
      totalBookings: 0,
      totalRevenue: 0,
    },
    bookingChart: [],
    recentBookings: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest("/admin/dashboard");

        if (!data.success) {
          throw new Error("Unable to load dashboard information.");
        }

        setDashboardData({
          stats: data.stats || {},
          bookingChart: data.bookingChart || [],
          recentBookings: data.recentBookings || [],
        });
      } catch (error) {
        setError(error.message || "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const { stats, bookingChart, recentBookings } = dashboardData;

  // Build the last six months, including months with zero bookings.
  const completeChartData = useMemo(() => {
    const months = [];

    for (let index = 5; index >= 0; index--) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - index);

      const month = date.toLocaleDateString("en-IN", {
        month: "short",
      });

      const year = date.getFullYear();

      const matchingData = bookingChart.find(
        (item) => item.month === month && item.year === year,
      );

      months.push({
        month,
        year,
        bookings: matchingData?.bookings || 0,
      });
    }

    return months;
  }, [bookingChart]);

  const chartData =
    chartPeriod === "3 months"
      ? completeChartData.slice(-3)
      : completeChartData;

  const maxBookings = Math.max(50, ...chartData.map((item) => item.bookings));

  const chartMaximum = Math.ceil(maxBookings / 50) * 50;

  const chartLabels = Array.from(
    { length: 6 },
    (_, index) => chartMaximum - index * (chartMaximum / 5),
  );

  const filteredBookings = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return recentBookings.filter((booking) => {
      const customer = booking.customer?.name || booking.customerName || "";

      const provider = booking.provider?.name || "";

      const bookingId = booking._id || "";

      const matchesSearch =
        !search ||
        bookingId.toLowerCase().includes(search) ||
        customer.toLowerCase().includes(search) ||
        provider.toLowerCase().includes(search) ||
        (booking.serviceName || "").toLowerCase().includes(search);

      const matchesStatus =
        bookingFilter === "All" || booking.status === bookingFilter;

      return matchesSearch && matchesStatus;
    });
  }, [recentBookings, searchTerm, bookingFilter]);

  const statsCards = [
    {
      title: "Total Users",
      value: (stats.totalUsers || 0).toLocaleString("en-IN"),
      detail: "Registered customers",
      icon: Users,
      color: "blue",
      link: "/admin-users",
    },
    {
      title: "Service Providers",
      value: (stats.totalProviders || 0).toLocaleString("en-IN"),
      detail: "Registered providers",
      icon: BriefcaseBusiness,
      color: "purple",
      link: "/admin-providers",
    },
    {
      title: "Total Bookings",
      value: (stats.totalBookings || 0).toLocaleString("en-IN"),
      detail: "All platform bookings",
      icon: CalendarDays,
      color: "orange",
      link: "/admin-bookings",
    },
  ];

  const currentMonthBookings =
    completeChartData[completeChartData.length - 1]?.bookings || 0;

  const getActivityIcon = () => CalendarDays;

  return (
    <div className="admin-dashboard-layout">
      <Sidebar
        role="admin"
        activeItem="/admin-dashboard"
        onLogout={() => navigate("/login")}
      />

      <main className="admin-dashboard-main">
        <div className="admin-dashboard-content">
          <section className="admin-welcome-row">
            <div>
              <h2>Welcome back, Admin! 👋</h2>
              <p>
                Here's what's happening with your ServiceHub platform today.
              </p>
            </div>

            <span className="admin-dashboard-date">
              <CalendarDays size={16} />
              {new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </section>

          {error && (
            <div className="admin-bookings-empty" role="alert">
              <strong>Unable to load dashboard</strong>
              <p>{error}</p>
              <button type="button" onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          )}

          <section className="admin-stats-grid">
            {statsCards.map((stat) => {
              const Icon = stat.icon;

              return (
                <Link
                  to={stat.link}
                  key={stat.title}
                  className="admin-stat-card"
                >
                  <div className="admin-stat-top">
                    <span>{stat.title}</span>
                    <div className={`admin-stat-icon ${stat.color}`}>
                      <Icon size={21} />
                    </div>
                  </div>

                  <strong className="admin-stat-value">
                    {loading ? "..." : stat.value}
                  </strong>

                  <div className="admin-stat-bottom">
                    <span>{stat.detail}</span>
                  </div>

                  <span className="admin-stat-link">
                    View details <ArrowUpRight size={14} />
                  </span>
                </Link>
              );
            })}
          </section>

          <section className="admin-dashboard-middle">
            <article className="admin-panel admin-booking-chart-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>Booking Overview</h2>
                  <p>Monthly booking activity across ServiceHub.</p>
                </div>

                <select
                  value={chartPeriod}
                  onChange={(event) => setChartPeriod(event.target.value)}
                  aria-label="Booking chart period"
                >
                  <option value="6 months">Last 6 months</option>
                  <option value="3 months">Last 3 months</option>
                </select>
              </div>

              <div className="admin-chart-summary">
                <div>
                  <strong>{loading ? "..." : currentMonthBookings}</strong>
                  <span>Bookings this month</span>
                </div>
              </div>

              <div
                className="admin-booking-chart"
                role="img"
                aria-label="Monthly bookings bar chart"
              >
                <div className="admin-chart-y-labels">
                  {chartLabels.map((label, index) => (
                    <span key={index}>{label}</span>
                  ))}
                </div>

                <div className="admin-chart-plot">
                  <div className="admin-chart-grid-lines">
                    {Array.from({ length: 6 }, (_, index) => (
                      <span key={index} />
                    ))}
                  </div>

                  <div className="admin-chart-bars">
                    {chartData.map((item, index) => (
                      <div
                        className="admin-chart-bar-group"
                        key={`${item.month}-${item.year}`}
                      >
                        <div className="admin-chart-bar-area">
                          <span className="admin-chart-bar-value">
                            {item.bookings}
                          </span>

                          <div
                            className={`admin-chart-bar ${
                              index === chartData.length - 1 ? "highlight" : ""
                            }`}
                            style={{
                              height: `${
                                (item.bookings / chartMaximum) * 100
                              }%`,
                            }}
                            title={`${item.month} ${item.year}: ${item.bookings} bookings`}
                          />
                        </div>

                        <span className="admin-chart-month">{item.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            <article className="admin-panel admin-activity-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>Recent Activity</h2>
                  <p>Latest booking activity.</p>
                </div>
                <Activity size={20} />
              </div>

              <div className="admin-activity-list">
                {recentBookings.slice(0, 4).map((booking) => {
                  const Icon = getActivityIcon();

                  return (
                    <div className="admin-activity-item" key={booking._id}>
                      <div className="admin-activity-icon booking">
                        <Icon size={17} />
                      </div>

                      <div className="admin-activity-copy">
                        <strong>New booking received</strong>
                        <p>
                          {booking.customer?.name ||
                            booking.customerName ||
                            "A customer"}{" "}
                          booked {booking.serviceName || "a service"}.
                        </p>
                        <span>{formatTimeAgo(booking.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}

                {!loading && recentBookings.length === 0 && (
                  <div className="admin-bookings-empty">
                    <p>No recent booking activity.</p>
                  </div>
                )}

                {loading && <p>Loading activity...</p>}
              </div>

              <Link to="/admin-bookings" className="admin-view-activity-link">
                View all bookings <ArrowRight size={15} />
              </Link>
            </article>
          </section>

          <section className="admin-panel admin-recent-bookings-panel">
            <div className="admin-panel-heading admin-bookings-heading">
              <div>
                <h2>Recent Bookings</h2>
                <p>Review the latest customer service bookings.</p>
              </div>

              <Link to="/admin-bookings" className="admin-view-all-link">
                View All <ArrowRight size={15} />
              </Link>
            </div>

            <div className="admin-booking-filters">
              {["All", "Pending", "Confirmed", "Completed", "Cancelled"].map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    className={bookingFilter === status ? "active" : ""}
                    onClick={() => setBookingFilter(status)}
                  >
                    {status}
                  </button>
                ),
              )}
            </div>

            <div className="admin-bookings-table-wrap">
              <table className="admin-bookings-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Service Provider</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>
                        <strong className="admin-booking-id">
                          #{booking._id.slice(-6).toUpperCase()}
                        </strong>
                      </td>

                      <td>
                        {booking.customer?.name || booking.customerName || "—"}
                      </td>

                      <td>{booking.provider?.name || "—"}</td>

                      <td>{booking.serviceName || "—"}</td>

                      <td>{formatDate(booking.date)}</td>

                      <td className="admin-booking-amount">
                        {formatCurrency(booking.price)}
                      </td>

                      <td>
                        <span
                          className={`admin-booking-status ${booking.status.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <span />
                          {booking.status}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-booking-view-button"
                          title="View booking"
                          aria-label={`View booking ${booking._id}`}
                          onClick={() =>
                            navigate(`/admin-bookings?search=${booking._id}`)
                          }
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && filteredBookings.length === 0 && (
                <div className="admin-bookings-empty">
                  <Search size={27} />
                  <strong>No bookings found</strong>
                  <p>Try another search term or status filter.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setBookingFilter("All");
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}

              {loading && (
                <div className="admin-bookings-empty">
                  <p>Loading bookings...</p>
                </div>
              )}
            </div>
          </section>

          <section className="admin-quick-actions">
            <div>
              <h2>Quick Actions</h2>
              <p>Common administrative tasks.</p>
            </div>

            <div className="admin-quick-action-grid">
              <Link to="/admin-users" className="admin-quick-action-card">
                <span className="quick-action-icon blue">
                  <Users size={20} />
                </span>
                <span>
                  <strong>Manage Users</strong>
                  <small>Review customer accounts</small>
                </span>
                <ArrowUpRight size={16} />
              </Link>

              <Link to="/admin-providers" className="admin-quick-action-card">
                <span className="quick-action-icon purple">
                  <BriefcaseBusiness size={20} />
                </span>
                <span>
                  <strong>Manage Providers</strong>
                  <small>Review provider accounts</small>
                </span>
                <ArrowUpRight size={16} />
              </Link>

              <Link to="/admin-bookings" className="admin-quick-action-card">
                <span className="quick-action-icon orange">
                  <CalendarDays size={20} />
                </span>
                <span>
                  <strong>Manage Bookings</strong>
                  <small>Monitor service bookings</small>
                </span>
                <ArrowUpRight size={16} />
              </Link>

              <Link to="/admin-providers" className="admin-quick-action-card">
                <span className="quick-action-icon green">
                  <ShieldCheck size={20} />
                </span>
                <span>
                  <strong>Provider Approvals</strong>
                  <small>Review provider applications</small>
                </span>
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
