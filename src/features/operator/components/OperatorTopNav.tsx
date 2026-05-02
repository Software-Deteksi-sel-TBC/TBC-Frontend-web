import { CircleUserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

// const linkBase =
//   "text-xs uppercase tracking-wide font-medium transition-colors";

const LinkBase = "text-xs uppercase tracking-wide font-medium transition-colors";

export default function OperatorTopNav() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="h-12 bg-white border-b border-blue-100 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link
          to="/operator/dashboard"
          className="text-[#0A52D6] font-semibold"
        >
          tbc-project
        </Link>
        <nav className="flex items-center gap-5">
          <Link
            to="/operator/dashboard"
            className={`${LinkBase} ${isActive("/operator/dashboard") || isActive("/dashboard")
              ? "text-[#0A52D6] border-b-2 border-[#0A52D6]" 
              : "text-slate-500 hover:text-[#0A52D6] border-b-2 border-transparent"
              }`}
          >
            Dashboard
          </Link>
          <Link
            to="/operator/patient-form"
            className={`${LinkBase} ${isActive("/operator/patient-form") || isActive("/operator/upload")
              ? "text-[#0A52D6] border-b-2 border-[#0A52D6]" 
              : "text-slate-500 hover:text-[#0A52D6] border-b-2 border-transparent"
          }`}
          >
            Upload
          </Link>
        </nav>
      </div>
      <button
        type="button"
        aria-label="Open profile menu"
        className="w-7 h-7 rounded-full border border-[#0A52D6] text-[#0A52D6] flex items-center justify-center"
      >
        <CircleUserRound size={14} />
      </button>
    </header>
  );
}

