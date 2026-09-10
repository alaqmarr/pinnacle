import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "inStock"
    | "lowStock"
    | "outOfStock"
    | "category"
    | "featured"
    | "warning"
    | "info"
    | "neutral";
  size?: "sm" | "md";
}

export function Badge({
  children,
  variant = "neutral",
  size = "sm",
  className = "",
  ...props
}: BadgeProps) {
  const baseClasses =
    "inline-flex items-center font-semibold rounded-md uppercase tracking-wider select-none";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  const variantClasses = {
    inStock:
      "bg-green-100 text-green-800 border border-green-200",
    lowStock:
      "bg-amber-50 text-amber-800 border border-amber-200",
    outOfStock:
      "bg-red-50 text-red-700 border border-red-200",
    category:
      "bg-slate-100 text-slate-700 border border-slate-200 normal-case tracking-normal",
    featured:
      "bg-sky-50 text-sky-700 border border-sky-200",
    warning:
      "bg-amber-100 text-amber-800 border border-amber-300",
    info:
      "bg-sky-100 text-sky-800 border border-sky-300",
    neutral:
      "bg-slate-100 text-slate-600 border border-slate-200",
  };

  return (
    <span
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
