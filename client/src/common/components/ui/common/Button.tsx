import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "success" | "disabled";

type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: `
    border border-slate-700
    bg-slate-800
    text-slate-100
    hover:bg-slate-700
    focus:ring-slate-500
    active:bg-slate-800
  `,

  secondary: `
    border border-slate-800
    bg-slate-700
    text-slate-100
    hover:bg-slate-800
    focus:ring-slate-500
  `,

  success: `
    bg-emerald-600
    text-white
    shadow-sm
    hover:bg-emerald-500
    focus:ring-emerald-500/50
    active:bg-emerald-700
  `,

  disabled: `
    bg-slate-700
    text-slate-400
    cursor-not-allowed
  `,
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
};

const Button = ({
  variant = "primary",
  size = "sm",
  loading = false,
  loadingText,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg
        font-semibold
        transition
        focus:outline-none
        focus:ring-2
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="
            h-4 w-4
            animate-spin
            rounded-full
            border-2
            border-white/30
            border-t-white
          "
        />
      )}

      {loading ? (loadingText ?? children) : children}
    </button>
  );
};

export default Button;
