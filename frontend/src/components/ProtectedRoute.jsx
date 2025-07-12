import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

const ProtectedRoute = () => {
  const { authToken, loading, error } = useContext(AuthContext);
  const location = useLocation();

  // Show a custom loading animation while checking authentication
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <style>
          {`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}
        </style>
        <div
          style={{
            border: "4px solid rgba(0, 0, 0, 0.1)",
            borderLeftColor: "#09f",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            animation: "spin 1s linear infinite",
          }}
        ></div>
      </div>
    );
  }

  // Handle errors (e.g., network issues)
  if (error) {
    return <Navigate to="/error" replace />; // Redirect to an error page
  }

  console.log("ProtectedRoute check - Auth token exists:", !!authToken);

  // If there's no authToken, redirect to the login page
  if (!authToken) {
    // Pass the current location to the login page for redirection after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;