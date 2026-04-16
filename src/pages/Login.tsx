import { useState } from "react";
import { login } from "../services/auth.service";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import AuthLayout from "../layouts/AuthLayout";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async () => {
        setError("");

        if (!email || !password) {
            return setError("Email dan password harus diisi");
        }
        try {
            setLoading(true);

            const res = await login ({ email, password });

            if (remember) {
                localStorage.setItem("token", res.token);
            } else {
                sessionStorage.setItem("token", res.token);
            }

            navigate("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.message || "Login Gagal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <h1 className="text-2xl font-bold mb-6 text-center">Log in to your account</h1>

            {error && (
                <p className="text-red-500 text-sm mb-3">{error}</p>
            )}

            <div className="mb-4">
                <label className="text-sm">Username</label>
                <Input 
                    placeholder = "Username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div className="mb-4">
                <label className="text-sm">Password</label>
                <Input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <div className="flex justify-between items-center mb-4 text-sm">
                <label className="flex items-center gap-2">
                    <input 
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                    />
                    <span>Ingat Saya</span>
                </label>
                <a 
                    href="/reset-password"
                    className="text-blue-600 underline"
                    >Lupa Password
                </a>
            </div>

            <Button onClick={handleLogin} disabled={loading}>
                {loading ? "Loading..." : "Login"}
            </Button>
        </AuthLayout>
    )
}