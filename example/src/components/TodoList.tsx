import { TodoItem } from "./TodoItem";
import type { Todo } from "./app";

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

/** Renders the list of todo items, or an empty-state message. */
export function TodoList({ todos, onToggle, onDelete }: TodoListProps) {
  if (todos.length === 0) {
    return <p style={styles.empty}>No todos yet — add one above!</p>;
  }

  return (
    <ul style={styles.list}>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

const styles: Record<string, React.CSSProperties> = {
  list: {
    listStyle: "none",
    margin: "1rem 0 0",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  empty: {
    marginTop: "1.5rem",
    textAlign: "center",
    color: "#aaa",
    fontSize: "0.95rem",
  },
};
