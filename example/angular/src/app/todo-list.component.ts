import { Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TodoItemComponent } from "./todo-item.component";
import type { Todo } from "./app.component";

/** Renders the list of todo items, or an empty-state message. */
@Component({
  selector: "app-todo-list",
  standalone: true,
  imports: [CommonModule, TodoItemComponent],
  template: `
    @if (todos().length === 0) {
      <p [ngStyle]="styles.empty">No todos yet — add one above!</p>
    } @else {
      <ul [ngStyle]="styles.list">
        @for (todo of todos(); track todo.id) {
          <app-todo-item
            [todo]="todo"
            (toggle)="toggle.emit($event)"
            (delete)="delete.emit($event)"
          />
        }
      </ul>
    }
  `,
})
export class TodoListComponent {
  todos = input.required<Todo[]>();
  toggle = output<string>();
  delete = output<string>();

  styles = {
    list: {
      listStyle: "none",
      margin: "1rem 0 0",
      padding: "0",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "6px",
    },
    empty: {
      marginTop: "1.5rem",
      textAlign: "center",
      color: "#aaa",
      fontSize: "0.95rem",
    },
  };
}
