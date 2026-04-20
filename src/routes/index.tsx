import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import ResetPasswordEmail from "../pages/auth/ResetPasswordEmail";
import ResetPassword from "../pages/auth/ResetPassword";
import ResetSuccess from "../pages/auth/ResetSuccess";
import UpdateCredentials from "../pages/auth/UpdateCredentials";

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
      </Routes>
    </BrowserRouter>
  );
}
