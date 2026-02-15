import type { Todo } from "./app";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

/** A single todo row with a checkbox, label, and delete button. */
export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li style={styles.item}>
      <label style={styles.label}>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          style={styles.checkbox}
        />
        <span
          style={{
            ...styles.text,
            ...(todo.completed ? styles.completed : {}),
          }}
        >
          {todo.text}
        </span>
      </label>
      <button
        onClick={() => onDelete(todo.id)}
        style={styles.deleteBtn}
        aria-label="Delete todo"
      >
        &times;
      </button>
    </li>
  );
}

const styles: Record<string, React.CSSProperties> = {
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.5rem 0.75rem",
    borderRadius: 8,
    background: "#fafafa",
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    flex: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: "#111",
    cursor: "pointer",
  },
  text: {
    fontSize: "1rem",
    color: "#222",
    transition: "all 0.15s",
  },
  completed: {
    textDecoration: "line-through",
    color: "#aaa",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    fontSize: "1.25rem",
    color: "#ccc",
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: 1,
  },
};
