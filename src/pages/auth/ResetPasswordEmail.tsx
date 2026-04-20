import { Link } from "react-router-dom";
import { useState, type FormEvent } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import AuthLayout from "../../layouts/AuthLayout";

export default function ResetPasswordEmail() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try{
            console.log("Mengirim link reset ke:", email)

            setTimeout(() => {
                setLoading(false);
                alert("Link reset password telah dikirim ke email Anda. Silahkan cek inbox Anda.");
            }, 1500);
        } catch (error) {
            setLoading(false);
            console.error("Gagal mengirim email reset:", error);
        }
    };

    return (
        <AuthLayout>
            <div>
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">Forgot Password</h2>
                    <p className="text-sm text-gray-500 mt-2">Enter your email address.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-[#374151] mb-2 block uppercase tracking-wide">
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

                    <div className="space-y-4">
                        <Button type="submit" disabled={loading}>
                            {loading ? "Sending..." : "Continue"}
                        </Button>

                        <div className="text-center">
                            <Link
                                to="/login"
                                className="text-sm font-semibold text-[#0061D1] hover:underline"
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
