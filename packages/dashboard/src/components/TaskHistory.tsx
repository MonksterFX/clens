/**
 * Task history component displaying completed/failed tasks with reopen capability.
 */

import { useState } from "react";
import { reopenTask, type CompletedTask } from "../lib/api";

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

/** Renders a list of completed/failed tasks with a reopen action and expandable details. */
export function TaskHistory({ history }: TaskHistoryProps) {
  const [reopening, setReopening] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  /** Reopens a completed or failed task back to the pending queue. */
  async function handleReopen(id: string) {
    setReopening((prev) => new Set(prev).add(id));
    try {
      await reopenTask(id);
    } catch (err) {
      console.error("Failed to reopen task:", err);
      alert("Failed to reopen task");
    } finally {
      setReopening((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  /** Toggles the details section for a task. */
  function toggleDetails(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

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
                {task.component && (
                  <div className="task-component-name">
                    {task.component.name}
                  </div>
                )}
                <div className="task-text">{task.text}</div>
                <div className="task-meta">
                  <span className="task-time">
                    {formatTime(task.timestamp)} →{" "}
                    {formatTime(task.completedAt)}
                  </span>
                  <span className="task-id">{task.id.slice(0, 8)}</span>
                  {task.component && (
                    <button
                      className="btn-details-toggle"
                      onClick={() => toggleDetails(task.id)}
                    >
                      {expanded.has(task.id) ? "Hide details" : "Details"}
                    </button>
                  )}
                </div>
                {task.component && expanded.has(task.id) && (
                  <div className="task-details">
                    {task.component.file && (
                      <div className="task-detail-row">
                        <span className="task-detail-label">File</span>
                        <span className="task-detail-value">
                          {task.component.file}
                          {task.component.line != null && (
                            <span className="task-detail-line">
                              :{task.component.line}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {task.component.element && (
                      <div className="task-detail-row">
                        <span className="task-detail-label">Element</span>
                        <span className="task-detail-value">
                          {task.component.element}
                        </span>
                      </div>
                    )}
                    {task.component.childPath && (
                      <div className="task-detail-row">
                        <span className="task-detail-label">Child Path</span>
                        <span className="task-detail-value">
                          {task.component.childPath}
                        </span>
                      </div>
                    )}
                    {task.result && (
                      <div className="task-detail-row">
                        <span className="task-detail-label">Result</span>
                        <span className="task-detail-value">{task.result}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleReopen(task.id)}
                disabled={reopening.has(task.id)}
                className="btn-reopen"
                title="Reopen this task"
              >
                {reopening.has(task.id) ? "..." : "↻"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
