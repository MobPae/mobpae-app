import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};

export function PrimaryButton({ children, icon, variant = "primary", ...props }: PrimaryButtonProps) {
  return (
    <button className={`button ${variant}`} type="button" {...props}>
      {icon}
      <span>{children}</span>
    </button>
  );
}
