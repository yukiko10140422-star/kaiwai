"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full rounded-lg border bg-background px-4 py-2.5 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-accent ${
            error ? "border-status-overdue" : "border-border"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-status-overdue">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
