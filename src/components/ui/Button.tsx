"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-accent to-accent-secondary text-white hover:shadow-lg hover:shadow-accent/25 hover:scale-[1.02] active:scale-[0.98]",
  secondary:
    "border border-border bg-transparent hover:bg-card hover:border-accent/50 hover:shadow-md",
  ghost:
    "bg-transparent hover:bg-card",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-2 text-xs rounded-lg min-h-[40px]",
  md: "px-4 py-2.5 text-sm rounded-lg min-h-[44px]",
  lg: "px-6 py-3 text-base rounded-xl min-h-[44px]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center font-medium transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
