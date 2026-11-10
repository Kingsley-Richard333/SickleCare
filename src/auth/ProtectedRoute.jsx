import { Navigate } from "react-router-dom";
import { useAuth, homeFor } from "./AuthContext.jsx";

export default function ProtectedRoute({ role, children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <section className="wrap page"><p className="lead">Loading...</p></section>;
  if (!user) return <Navigate to={role === "doctor" ? "/doctor-login" : "/patient-login"} replace />;
  if (role && profile && profile.role !== role) return <Navigate to={homeFor(profile.role)} replace />;
  return children;
}
