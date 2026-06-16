import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};

export function PrimaryButton({ children, icon, variant = "primary", ...props }: PrimaryButtonProps) {
  const cls = variant === "primary" ? "btn btn-primary" : variant === "ghost" ? "btn btn-ghost" : "btn btn-ghost";
  return (
    <button className={cls} type="button" {...props}>
      {icon}
      <span>{children}</span>
    </button>
  );
}
