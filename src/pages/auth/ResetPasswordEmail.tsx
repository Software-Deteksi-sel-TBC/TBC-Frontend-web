import { Link } from "react-router-dom";
import { useState, type FormEvent } from "react";
import axios from "axios";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AuthLayout from "../../layouts/AuthLayout";
import { requestResetPassword } from "../../features/auth/services/auth.service";

export default function ResetPasswordEmail() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage("");
        setError("");
        setLoading(true);

        try {
            await requestResetPassword({ email });
            setMessage("Link reset password telah dikirim ke email Anda. Silahkan cek inbox Anda.");
            setEmail("");
        } catch (err: unknown) {
            const fallbackMessage = "Gagal mengirim email reset password.";

            if (!axios.isAxiosError(err)) {
                setError(fallbackMessage);
                return;
            }

            const responseData = err.response?.data;
            if (responseData && typeof responseData === "object") {
                const apiMessage = (responseData as { message?: unknown }).message;
                if (typeof apiMessage === "string" && apiMessage.length > 0) {
                    setError(apiMessage);
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
            <div>
                <div className="text-center mb-6 md:mb-8">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">Forgot Password</h2>
                    <p className="text-sm text-gray-500 mt-1 md:mt-2">Enter your email address.</p>
                </div>

                {message && (
                    <div className="mb-3 md:mb-4 rounded-md border border-green-200 bg-green-50 p-2.5 md:p-3 text-xs md:text-sm text-green-700">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-3 md:mb-4 rounded-md border border-red-200 bg-red-50 p-2.5 md:p-3 text-xs md:text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-[11px] md:text-xs font-bold text-[#374151] mb-1 md:mb-2 block uppercase tracking-wide">
                            Email
                        </label>
                        <div className="relative">
                            <Input 
                                type="email"
                                placeholder="abcd@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            {email && (
                                <button
                                    type="button"
                                    onClick={() => setEmail("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                        <Button type="submit" disabled={loading} className="py-2.5 md:py-3 text-sm md:text-base">
                            {loading ? "Sending..." : "Continue"}
                        </Button>

                        <div className="text-center">
                            <Link
                                to="/login"
                                className="text-xs md:text-sm font-semibold text-[#0061D1] hover:underline"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </AuthLayout>
    )
}
