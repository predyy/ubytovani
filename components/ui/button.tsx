import * as React from "react";

import { cn } from "./cn";

type ButtonVariant = "default" | "outline" | "secondary";
type ButtonSize = "default" | "lg";

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 disabled:pointer-events-none disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-blue-600 text-white hover:bg-blue-700",
  outline:
    "border border-blue-200 text-blue-700 hover:border-blue-300 hover:bg-blue-50",
  secondary: "bg-white text-blue-700 hover:bg-blue-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-5",
  lg: "h-12 px-6 text-base",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
};

export function Button({
  className,
  variant = "default",
  size = "default",
  asChild,
  children,
  type,
  ...props
}: ButtonProps) {
  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(classes, children.props.className),
    });
  }

  return (
    <button type={type ?? "button"} className={classes} {...props}>
      {children}
    </button>
  );
}
