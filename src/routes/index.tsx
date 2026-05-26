import type { ReactElement } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import ResetPasswordEmail from "../pages/auth/ResetPasswordEmail";
import ResetPassword from "../pages/auth/ResetPassword";
import ResetSuccess from "../pages/auth/ResetSuccess";
import UpdateCredentials from "../pages/auth/UpdateCredentials";
// import UploadCitra from "../pages/UploadCitra";
import OperatorDashboardPage from "../features/operator/pages/OperatorDashboardPage";
import OperatorUploadPage from "../features/operator/pages/OperatorUploadPage";
import OperatorPatientFormPage from "../features/operator/pages/OperatorPatientFormPage";
import PatologDashboardPage from "../features/patolog/pages/PatologDashboard";
import { useAuth } from "../context/AuthContext";

function RequireAuth({ children, allowedRoles }: { children: ReactElement; allowedRoles?: string[] }) {
  const { user } = useAuth();
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles && user?.role && user.role !== "OPERATOR_LAB") {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-success" element={<ResetSuccess />} />
        <Route path="/update-credentials" element={<UpdateCredentials />} />
        <Route path="/reset-password-email" element={<ResetPasswordEmail />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth allowedRoles={["OPERATOR_LAB"]}>
              <OperatorDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/operator/dashboard"
          element={
            <RequireAuth allowedRoles={["OPERATOR_LAB"]}>
              <OperatorDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/operator/patient-form"
          element={
            <RequireAuth allowedRoles={["OPERATOR_LAB"]}>
              <OperatorPatientFormPage />
            </RequireAuth>
          }
        />
        <Route
          path="/operator/upload"
          element={
            <RequireAuth allowedRoles={["OPERATOR_LAB"]}>
              <OperatorUploadPage />
            </RequireAuth>
          }
        />
        <Route
          path="/patolog/dashboard"
          element={
            <RequireAuth allowedRoles={["DOKTER_PATOLOGI"]}>
              <PatologDashboardPage />
            </RequireAuth>
          }
        />
        {/* <Route path="/upload" element={<UploadCitra />} /> */}
      </Routes>
    </BrowserRouter>
  );
}
