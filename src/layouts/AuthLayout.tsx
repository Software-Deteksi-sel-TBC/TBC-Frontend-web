import bg from "../assets/Background.png"

export default function AuthLayout({ children }: any) {
  return (
    <div className="min-h-screen flex items-center justify-center"
    style={{
      backgroundImage: `url(${bg})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      }}
    >
      <div className="bg-white p-8 rounded-xl shadow-md w-[400px]">
        {children}
      </div>
    </div>
  );
}