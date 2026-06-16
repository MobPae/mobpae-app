import type { ChangeEventHandler, HTMLInputTypeAttribute } from "react";

type FieldProps = {
  label: string;
  value: string | number;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  min?: number;
  max?: number;
  disabled?: boolean;
};

export function Field({ label, value, onChange, placeholder, type = "text", min, max, disabled }: FieldProps) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="field-wrap">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          max={max}
          disabled={disabled}
          style={{ paddingLeft: 14 }}
        />
      </div>
    </div>
  );
}
