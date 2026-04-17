import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import AuthLayout from "../../layouts/AuthLayout";

export default function ResetSuccess() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <h1 className="text-xl font-bold mb-4">
        Reset Password Berhasil!
      </h1>

      <p className="text-sm mb-4">
        Anda telah berhasil mengubah password Anda.
      </p>

      <Button onClick={() => navigate("/")}>
        OK
      </Button>
    </AuthLayout>
  );
}
