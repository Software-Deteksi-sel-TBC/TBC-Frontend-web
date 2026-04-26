import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import AuthLayout from "../../layouts/AuthLayout";

export default function ResetSuccess() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <h1 className="text-lg md:text-xl font-bold mb-3 md:mb-4">
        Reset Password Berhasil!
      </h1>

      <p className="text-xs md:text-sm mb-4">
        Anda telah berhasil mengubah password Anda.
      </p>

      <Button
        onClick={() => navigate("/")}
        className="py-2.5 md:py-3 text-sm md:text-base"
      >
        OK
      </Button>
    </AuthLayout>
  );
}
