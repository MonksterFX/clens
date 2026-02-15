import { Component, signal, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TodoInputComponent } from "./todo-input.component";
import { TodoListComponent } from "./todo-list.component";

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
@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, TodoInputComponent, TodoListComponent],
  template: `
    <div [ngStyle]="styles.container">
      <div [ngStyle]="styles.card">
        <h1 [ngStyle]="styles.title">Todo App - Angular</h1>
        <app-todo-input (add)="addTodo($event)" />
        <app-todo-list
          [todos]="todos()"
          (toggle)="toggleTodo($event)"
          (delete)="deleteTodo($event)"
        />
        @if (todos().length > 0) {
          <p [ngStyle]="styles.footer">
            {{ completedCount() }} / {{ todos().length }} completed
          </p>
        }
      </div>
    </div>
  `,
})
export class AppComponent {
  todos = signal<Todo[]>(loadTodos());

  completedCount = () => this.todos().filter((t) => t.completed).length;

  constructor() {
    effect(() => {
      saveTodos(this.todos());
    });
  }

  /** Adds a new todo with the given text. */
  addTodo(text: string): void {
    this.todos.update((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, completed: false },
    ]);
  }

  /** Toggles the completed state of a todo by id. */
  toggleTodo(id: string): void {
    this.todos.update((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  /** Removes a todo by id. */
  deleteTodo(id: string): void {
    this.todos.update((prev) => prev.filter((t) => t.id !== id));
  }

  styles = {
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
      maxWidth: "480px",
      background: "#fff",
      borderRadius: "12px",
      padding: "2rem",
      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    },
    title: {
      margin: "0 0 1.5rem",
      fontSize: "1.5rem",
      fontWeight: "700",
      color: "#111",
    },
    footer: {
      marginTop: "1rem",
      fontSize: "0.85rem",
      color: "#888",
      textAlign: "center",
    },
  };
}
