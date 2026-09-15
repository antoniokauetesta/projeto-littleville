import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Sightings from "./pages/Sightings";
import Profile from "./pages/Profile";
import AppLayout from "./layouts/AppLayout";
import Admin from "./pages/Admin";
import Community from "./pages/Community";
import Welcome from "./pages/Welcome";

function AppShell() {
  const { signed, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0e17", color: "#e8ecf4" }}>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!signed) {
    return <Welcome />;
  }

  return <AppLayout />;
}

function PublicRoute({ children }) {
  const { signed, loading } = useAuth();

  if (loading) return null;

  if (signed) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user?.role !== "ADMIN") return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Rotas Protegidas */}
          <Route path="/" element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="sightings" element={<Sightings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="community" element={<Community />} />
            <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
