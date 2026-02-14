import { useState } from "react";
import { TextField } from "./TextField";
import { AddButton } from "./AddButton";

interface TodoInputProps {
  onAdd: (text: string) => void;
}

/** Input field with a submit button for creating new todos. */
export function TodoInput({ onAdd }: TodoInputProps) {
  const [value, setValue] = useState("");

  /** Handles form submission – trims input and resets the field. */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <TextField
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What needs to be done?"
      />
      <AddButton />
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: "flex",
    gap: 8,
  },
};
