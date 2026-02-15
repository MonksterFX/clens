import "zone.js";
import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { enableInspectorOverlay } from "@clens/angular";

enableInspectorOverlay();

bootstrapApplication(AppComponent);
