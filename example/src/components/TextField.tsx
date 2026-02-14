import React from "react";

interface TextFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

/** Controlled text input field. */
export function TextField({ value, onChange, placeholder }: TextFieldProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={styles.input}
    />
  );
}

const styles: Record<string, React.CSSProperties> = {
  input: {
    flex: 1,
    padding: "0.6rem 0.75rem",
    fontSize: "1rem",
    border: "1px solid #ddd",
    borderRadius: 8,
    outline: "none",
  },
};
