import type { ReactNode } from "react";
import bg from "../assets/Background.png";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-[100vh] flex items-start justify-center px-4 py-12"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="bg-white w-full max-w-md rounded-xl shadow-md p-6 md:p-8 pb-8">
        {children}
      </div>
    </div>
  );
}
