import { Component, input } from "@angular/core";
import { CommonModule } from "@angular/common";

/** Submit button for adding a new todo. */
@Component({
  selector: "app-add-button",
  standalone: true,
  imports: [CommonModule],
  template: `
    <button type="submit" [ngStyle]="styles.button">
      {{ label() }}
    </button>
  `,
})
export class AddButtonComponent {
  label = input<string>("Add");

  styles = {
    button: {
      padding: "0.6rem 1.2rem",
      fontSize: "1rem",
      fontWeight: "600",
      color: "#fff",
      background: "green",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
    },
  };
}
