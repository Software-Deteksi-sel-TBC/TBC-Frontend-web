import { CircleUserRound, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useState, useRef, useEffect } from "react";

// const linkBase =
//   "text-xs uppercase tracking-wide font-medium transition-colors";

const LinkBase = "text-xs uppercase tracking-wide font-medium transition-colors";

export default function OperatorTopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-16 md:h-12 bg-white border-b border-blue-100 px-3 md:px-6 flex items-center justify-between gap-2 md:gap-0">
      {/* Logo & Navigation - Hide nav on mobile */}
      <div className="flex items-center gap-3 md:gap-6 min-w-0">
        <Link
          to="/operator/dashboard"
          className="text-[#0A52D6] font-semibold text-sm md:text-base whitespace-nowrap flex-shrink-0"
        >
          tbc-project
        </Link>
        <nav className="hidden md:flex items-center gap-5">
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

      {/* Profile Section - Responsive */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 relative" ref={menuRef}>
        <div className="text-left hidden sm:block">
          <p className="text-xs md:text-sm font-semibold text-gray-800 leading-tight whitespace-nowrap">
            {user?.name || "Operator"}
          </p>
          <p className="text-[8px] md:text-[10px] text-gray-500 uppercase">
            {user?.role || "Staff"}
          </p>
        </div>
        <button
          type="button"
          aria-label="Open profile menu"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-7 h-7 rounded-full border border-[#0A52D6] text-[#0A52D6] flex items-center justify-center flex-shrink-0 hover:bg-blue-50 transition-colors"
        >
          <CircleUserRound size={14} />
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-700">
                {user?.name || "Operator"}
              </p>
              <p className="text-[10px] text-gray-500">
                {user?.email || "user@example.com"}
              </p>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

