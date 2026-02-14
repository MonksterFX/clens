/**
 * Task history component displaying completed tasks.
 */

import type { CompletedTask } from "../lib/api";

interface TaskHistoryProps {
  history: CompletedTask[];
}

/**
 * Formats ISO timestamp to a readable time string.
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString();
}

export function TaskHistory({ history }: TaskHistoryProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Task History ({history.length})</h2>
      </div>
      <div className="task-list history">
        {history.length === 0 ? (
          <div className="empty">No completed tasks</div>
        ) : (
          history.map((task) => (
            <div key={task.id} className="task-item completed">
              <div className="task-content">
                <div className="task-text">{task.text}</div>
                <div className="task-meta">
                  <span className="task-time">
                    {formatTime(task.timestamp)} →{" "}
                    {formatTime(task.completedAt)}
                  </span>
                  <span className="task-id">{task.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
