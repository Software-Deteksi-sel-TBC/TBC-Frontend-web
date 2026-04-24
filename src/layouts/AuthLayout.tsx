import type { ReactNode } from "react";
import bg from "../assets/Background.png";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12  "
    style={{
      backgroundImage: `url(${bg})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      }}
    >
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-fit">
        {children}
      </div>
    </div>
  );
}
