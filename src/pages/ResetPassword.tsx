import { useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { resetPassword } from "../services/auth.service";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import AuthLayout from "../layouts/AuthLayout";

export default function ResetPassword() {
    const [params] = useSearchParams();
    const token = params.get("token");

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

            navigate("/reset-success");
        } catch (err: any) {
            alert(err.response?.data?.message || "Error reset password");
        }
    };

    return (
        <AuthLayout>
            <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>

            {error && (
                <p className="text-red-500 text-sm mb-3">{error}</p>
            )}
            
            <div className="mb-4">
                <label className="text-sm">New Password</label>
                <Input type="password" />
            </div>

            {/* <Input 
                 placeholder="Confirm Password"
                type="password"
                className="mt-3"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
            /> */}

            <div className="mb-6">
                <label className="text-sm">Confirm Password</label>
                <Input type="password" />
            </div>

            <Button>Submit</Button>
        </AuthLayout>
    )

}