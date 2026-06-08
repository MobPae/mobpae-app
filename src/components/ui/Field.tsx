import type { ChangeEventHandler, HTMLInputTypeAttribute } from "react";

type FieldProps = {
  label: string;
  value: string | number;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  min?: number;
  max?: number;
};

export function Field({ label, value, onChange, placeholder, type = "text", min, max }: FieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} min={min} max={max} />
    </label>
  );
}
