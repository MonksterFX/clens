import { Component, output, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TextFieldComponent } from "./text-field.component";
import { AddButtonComponent } from "./add-button.component";

/** Input field with a submit button for creating new todos. */
@Component({
  selector: "app-todo-input",
  standalone: true,
  imports: [CommonModule, TextFieldComponent, AddButtonComponent],
  template: `
    <form (submit)="handleSubmit($event)" [ngStyle]="styles.form">
      <app-text-field
        [value]="value()"
        (valueChange)="value.set($event)"
        placeholder="What needs to be done?"
      />
      <app-add-button />
    </form>
  `,
})
export class TodoInputComponent {
  value = signal("");
  add = output<string>();

  /** Handles form submission – trims input and resets the field. */
  handleSubmit(e: Event): void {
    e.preventDefault();
    const trimmed = this.value().trim();
    if (!trimmed) return;
    this.add.emit(trimmed);
    this.value.set("");
  }

  styles = {
    form: {
      display: "flex",
      gap: "8px",
    },
  };
}
