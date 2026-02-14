/**
 * Main dashboard application component.
 */

import { useServerStatus } from "./hooks/useServerStatus";
import { useTaskEvents } from "./hooks/useTaskEvents";
import { StatusBar } from "./components/StatusBar";
import { TaskQueue } from "./components/TaskQueue";
import { TaskHistory } from "./components/TaskHistory";

export function App() {
  const status = useServerStatus();
  const { tasks, history, connected } = useTaskEvents();

  return (
    <div className="app">
      <header className="app-header">
        <h1>clens Dashboard</h1>
      </header>
      <StatusBar status={status} connected={connected} />
      <div className="panels">
        <TaskQueue tasks={tasks} />
        <TaskHistory history={history} />
      </div>
    </div>
  );
}
