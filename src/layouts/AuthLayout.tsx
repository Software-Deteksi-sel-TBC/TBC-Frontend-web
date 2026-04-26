import type { ReactNode } from "react";
import bg from "../assets/Background.png";

type AuthLayoutProps = {
  children: ReactNode;
  verticalAlign?: "top" | "center";
};

export default function AuthLayout({
  children,
  verticalAlign = "center",
}: AuthLayoutProps) {
  return (
    <div
      className={`auth-shell ${verticalAlign === "center" ? "auth-shell--center" : ""}`}
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="auth-card">
        {children}
      </div>
    </div>
  );
}
