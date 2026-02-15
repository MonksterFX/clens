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
  const { tasks, connected } = useTaskEvents();

  const history = tasks.filter((task) => task.completedAt !== undefined);
  const pending = tasks.filter((task) => task.completedAt === undefined);

  return (
    <div className="app">
      <header className="app-header">
        <h1>clens Dashboard - beta</h1>
      </header>
      <StatusBar
        status={status}
        connected={connected}
        activeTaskCount={pending.length}
      />
      <div className="panels">
        <TaskQueue tasks={pending} />
        <TaskHistory history={history} />
      </div>
    </div>
  );
}
