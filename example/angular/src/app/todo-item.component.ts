import { Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import type { Todo } from "./app.component";

/** A single todo row with a checkbox, label, and delete button. */
@Component({
  selector: "app-todo-item",
  standalone: true,
  imports: [CommonModule],
  template: `
    <li [ngStyle]="styles.item">
      <label [ngStyle]="styles.label">
        <input
          type="checkbox"
          [checked]="todo().completed"
          (change)="toggle.emit(todo().id)"
          [ngStyle]="styles.checkbox"
        />
        <span [ngStyle]="getTextStyle()">
          {{ todo().text }}
        </span>
      </label>
      <button
        (click)="delete.emit(todo().id)"
        [ngStyle]="styles.deleteBtn"
        attr.aria-label="Delete todo"
      >
        &times;
      </button>
    </li>
  `,
})
export class TodoItemComponent {
  todo = input.required<Todo>();
  toggle = output<string>();
  delete = output<string>();

  getTextStyle() {
    return {
      ...this.styles.text,
      ...(this.todo().completed ? this.styles.completed : {}),
    };
  }

  styles = {
    item: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.5rem 0.75rem",
      borderRadius: "8px",
      background: "#fafafa",
    },
    label: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      cursor: "pointer",
      flex: "1",
    },
    checkbox: {
      width: "18px",
      height: "18px",
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
      lineHeight: "1",
    },
  };
}
