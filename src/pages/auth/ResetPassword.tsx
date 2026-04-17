import { useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { resetPassword } from "../../features/auth/services/auth.service";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AuthLayout from "../../layouts/AuthLayout";

export default function ResetPassword() {
    const [params] = useSearchParams();
    const token = params.get("token"); // Ini nanti mengambil token dari URL

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async () => {
        setError("");

        if (password.length < 8) {
            return setError("Password minimal 8 karakter");
        }

        if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
            return setError("Password harus kombinasi huruf & angka");
        }

        if (password !== confirm) {
            return setError("Password tidak sama");
        }

        try {
            setLoading(true);

            await resetPassword({
                token: token || "",
                newPassword: password
            });

            navigate("/login", { state: { success: "Password updated. Please log in with your new credentials." } });
        } catch (err: unknown) {
            const fallbackMessage = "Gagal memperbarui password";

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
        <AuthLayout>
            <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    void handleSubmit();
                }}
            >
                <div className="mb-4">
                    <label className="text-sm">New Password</label>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="mb-6">
                    <label className="text-sm">Confirm Password</label>
                    <Input
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                    />
                </div>

                <Button type="submit" disabled={loading}>
                    Submit
                </Button>
            </form>
        </AuthLayout>
    );
}
