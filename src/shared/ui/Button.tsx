type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({ children, className, ...props }: Props)  {
    return (
        <button 
            {...props}
            className={[
                "w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition disabled:opacity-50",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {children}
        </button>
    );
}
