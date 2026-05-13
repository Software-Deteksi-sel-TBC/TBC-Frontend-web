import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className, type, ...props }: Props) {
  const isPasswordField = type === "password";
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const resolvedType = isPasswordField
    ? isPasswordVisible
      ? "text"
      : "password"
    : type;

  const inputClassName = [
    "w-full mt-1 p-2.5 md:p-3 text-sm md:text-base rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500",
    isPasswordField ? "pr-11" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (!isPasswordField) {
    return <input {...props} type={resolvedType} className={inputClassName} />;
  }

  return (
    <div className="relative">
      <input {...props} type={resolvedType} className={inputClassName} />
      <button
        type="button"
        aria-label={isPasswordVisible ? "Sembunyikan password" : "Tampilkan password"}
        onClick={() => setIsPasswordVisible((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
      >
        {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
