import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent/90 border-transparent",
  secondary: "bg-surface text-fg hover:bg-bg border-border-strong",
  danger: "bg-surface text-danger hover:bg-danger-soft border-danger/30",
  ghost: "bg-transparent text-fg hover:bg-bg border-transparent",
};

export function buttonClassName(variant: Variant = "secondary", className = "") {
  return `inline-flex items-center justify-center gap-2 rounded-md border px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ variant = "secondary", className = "", ...props }: ButtonProps) {
  return <button {...props} className={buttonClassName(variant, className)} />;
}
