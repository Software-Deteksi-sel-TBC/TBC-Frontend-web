type Props = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className, ...props }: Props) {
  return (
    <input
      {...props}
      className={[
        "w-full mt-1 p-2.5 md:p-3 text-sm md:text-base rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
