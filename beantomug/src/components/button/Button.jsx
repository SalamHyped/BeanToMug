export default function Button({
  children = "Click Me",
  onClick = () => {},
  type = "button",
  variant = "primary",
  disabled = false,
  loading = false,
  fullWidth = false,
  className = "",
  ...rest
}) {
  const baseStyles = "px-4 py-2 rounded font-semibold transition-all duration-200";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-400 text-black hover:bg-gray-500",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  const disabledStyles = "opacity-50 cursor-not-allowed";
  const fullWidthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variants[variant] || variants.primary}
        ${disabled || loading ? disabledStyles : ""}
        ${fullWidthStyle}
        ${className}
      `}
      {...rest}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
