import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { apiRequest } from "../services/api";

function ProtectedRoute({ allowedRoles, children }) {
  const location = useLocation();
  const [status, setStatus] = useState("checking");
  const [user, setUser] = useState(null);

  const allowedRolesKey = allowedRoles.join(",");

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        if (!cancelled) {
          setStatus("unauthenticated");
        }
        return;
      }

      try {
        const data = await apiRequest("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const currentUser = data.user || data;

        if (!currentUser.role) {
          throw new Error("Invalid user session.");
        }

        if (!cancelled) {
          setUser(currentUser);
          setStatus("authenticated");
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        if (!cancelled) {
          setStatus("unauthenticated");
        }
      }
    };

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (status === "checking") {
    return <p>Verifying your session...</p>;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRolesKey.split(",").includes(user.role)) {
    const roleDashboard = {
      customer: "/user-dashboard",
      provider: "/provider-dashboard",
      admin: "/admin-dashboard",
    };

    return <Navigate to={roleDashboard[user.role] || "/login"} replace />;
  }

  return children;
}

export default ProtectedRoute;
