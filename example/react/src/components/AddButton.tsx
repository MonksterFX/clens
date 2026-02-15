import React from "react";

interface AddButtonProps {
  label?: string;
}

/** Submit button for adding a new todo. */
export function AddButton({ label = "Add" }: AddButtonProps) {
  return (
    <button type="submit" style={styles.button}>
      {label}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  button: {
    padding: "0.6rem 1.2rem",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#fff",
    background: "green",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
};
