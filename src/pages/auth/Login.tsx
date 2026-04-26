import { useState } from "react";
import axios from "axios";
import { login } from "../../features/auth/services/auth.service";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AuthLayout from "../../layouts/AuthLayout";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const successMsg = location.state?.successMessage;

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError("");

        if (!email || !password) {
            return setError("Email dan password harus diisi");
        }
        try {
            setLoading(true);

            const res = await login({ email, password });

            const storage = remember ? localStorage : sessionStorage;
            storage.setItem("token", res.token);

            if (res.user?.is_first_login) {
                navigate("/update-credentials", {
                    state: {
                        currentEmail: email,
                        currentPassword: password,
                    },
                });
            } else {
                navigate("/dashboard");
            }
        } catch (err: unknown) {
            const fallbackMessage =
                "Login Gagal. Periksa kembali email dan password Anda.";

            if (!axios.isAxiosError(err)) {
                setError(fallbackMessage);
                return;
            }

            const responseData = err.response?.data;
            if (responseData && typeof responseData === "object") {
                const message = (responseData as { message?: unknown }).message;
                if (typeof message === "string" && message.length > 0) {
                    setError(message);
                    return;
                }
            }

            setError(fallbackMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout verticalAlign="center">
            {successMsg && (
                <div className="bg-green-500 text-white p-3 rounded-md mb-4 text-sm flex items-center gap-2">
                    <span>check_circle</span>
                    {successMsg}
                </div>
            )}

            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-[30px] font-bold text-[#1F2937] mb-1 md:mb-2 text-center leading-tight">
                    Log in to your account
                </h1>
                <p className="text-sm text-[#6B7280] text-center">
                    Please enter your details
                </p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-2 md:p-3 rounded-md text-xs mb-3 md:mb-4 text-center border border-red-100">
                    {error}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
                <div>
                    <label className="text-[11px] md:text-xs font-bold text-[#374151] mb-1 md:mb-2 block uppercase tracking-wide">
                        USERNAME
                    </label>
                    <Input
                        placeholder="Username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="text-[11px] md:text-xs font-bold text-[#374151] mb-1 md:mb-1.5 block uppercase tracking-wide">
                        PASSWORD
                    </label>
                    <Input
                        placeholder="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="pt-2">
                    <Button className="py-2.5 md:py-3 text-sm md:text-base">{loading ? "Logging in..." : "Login"}</Button>
                </div>

                <div className="text-center">
                    <a
                        href="/reset-password-email"
                        className="text-[#2563EB] text-xs md:text-sm font-medium hover:underline"
                    >
                        Forgot Your Password
                    </a>
                </div>
            </form>
        </AuthLayout>
    );
}
