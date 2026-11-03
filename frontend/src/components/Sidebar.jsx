import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MapPin,
  LayoutDashboard,
  CalendarDays,
  Search,
  Star,
  UserRound,
  Settings,
  LogOut,
  BriefcaseBusiness,
  ClipboardList,
  Users,
  Tags,
} from "lucide-react";

import "../styles/Sidebar.css";

const menus = {
  customer: [
    { label: "Dashboard", path: "/user-dashboard", icon: LayoutDashboard },
    { label: "My Bookings", path: "/user-bookings", icon: CalendarDays },
    { label: "Find Services", path: "/user-services", icon: Search },
    { label: "Settings", path: "/user-settings", icon: Settings },
  ],

  provider: [
    { label: "Dashboard", path: "/provider-dashboard", icon: LayoutDashboard },
    {
      label: "My Services",
      path: "/provider-services",
      icon: BriefcaseBusiness,
    },
    { label: "Bookings", path: "/provider-bookings", icon: ClipboardList },
    { label: "Reviews", path: "/provider-reviews", icon: Star },
    { label: "Settings", path: "/provider-settings", icon: Settings },
  ],

  admin: [
    { label: "Dashboard", path: "/admin-dashboard", icon: LayoutDashboard },
    { label: "Manage Providers", path: "/admin-providers", icon: Users },
    { label: "Manage Bookings", path: "/admin-bookings", icon: ClipboardList },
    { label: "Categories", path: "/admin-categories", icon: Tags },
    { label: "Users", path: "/admin-users", icon: UserRound },
    { label: "Settings", path: "/admin-settings", icon: Settings },
  ],
};

function Sidebar({ role = "customer", activeItem, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = menus[role] || menus.customer;

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();

    // Remove authentication data
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Run optional parent logout callback
    if (onLogout) {
      onLogout();
    } else {
      navigate("/login", { replace: true });
    }
  };

  return (
    <aside className={`app-sidebar ${menuOpen ? "mobile-menu-open" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <Link to="/" className="sidebar-logo" onClick={closeMenu}>
            <span className="sidebar-logo-icon">
              <MapPin size={23} strokeWidth={2.5} />
            </span>

            <span className="sidebar-logo-text">
              <span>ServiceHub</span>
            </span>
          </Link>
        </div>

        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label={
            menuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      <nav
        className={`sidebar-navigation ${menuOpen ? "navigation-open" : ""}`}
        aria-label="Dashboard navigation"
      >
        {menuItems.map((item) => {
          const Icon = item.icon;

          const isActive = activeItem
            ? activeItem === item.path || activeItem === item.label
            : location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeMenu}
              className={`sidebar-link ${
                isActive ? "sidebar-link-active" : ""
              }`}
            >
              <Icon size={19} strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <button type="button" className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
