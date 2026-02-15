import { Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";

/** Controlled text input field. */
@Component({
  selector: "app-text-field",
  standalone: true,
  imports: [CommonModule],
  template: `
    <input
      type="text"
      [value]="value()"
      (input)="onInput($event)"
      [placeholder]="placeholder()"
      [ngStyle]="styles.input"
    />
  `,
})
export class TextFieldComponent {
  value = input.required<string>();
  placeholder = input<string>("");
  valueChange = output<string>();

  onInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.valueChange.emit(target.value);
  }

  styles = {
    input: {
      flex: "1",
      padding: "0.6rem 0.75rem",
      fontSize: "1rem",
      border: "1px solid #ddd",
      borderRadius: "8px",
      outline: "none",
    },
  };
}
