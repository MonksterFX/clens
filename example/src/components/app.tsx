import { useState, useEffect } from "react";
import { TodoInput } from "./TodoInput";
import { TodoList } from "./TodoList";

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const STORAGE_KEY = "todos";

/** Reads todos from localStorage, falling back to an empty array. */
function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Persists the given todos array to localStorage. */
function saveTodos(todos: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

/** Root application component – manages todo state and renders the UI. */
export function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  /** Adds a new todo with the given text. */
  const addTodo = (text: string) => {
    setTodos((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, completed: false },
    ]);
  };

  /** Toggles the completed state of a todo by id. */
  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  /** Removes a todo by id. */
  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Todo App</h1>
        <TodoInput onAdd={addTodo} />
        <TodoList todos={todos} onToggle={toggleTodo} onDelete={deleteTodo} />
        {todos.length > 0 && (
          <p style={styles.footer}>
            {todos.filter((t) => t.completed).length} / {todos.length} completed
          </p>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem 1rem",
    background: "#e8f5e9",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderRadius: 12,
    padding: "2rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  title: {
    margin: "0 0 1.5rem",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#111",
  },
  footer: {
    marginTop: "1rem",
    fontSize: "0.85rem",
    color: "#888",
    textAlign: "center",
  },
};
