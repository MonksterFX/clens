/**
 * Task queue component displaying pending tasks with component details.
 */

import { useState } from "react";
import { clearTasks, deleteTask, type Task } from "../lib/api";

interface TaskQueueProps {
  tasks: Task[];
}

/**
 * Formats ISO timestamp to a readable time string.
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString();
}

/** Displays pending tasks with component info and expandable details. */
export function TaskQueue({ tasks }: TaskQueueProps) {
  const [clearing, setClearing] = useState(false);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  /** Clears all pending tasks after confirmation. */
  async function handleClearAll() {
    if (!confirm("Clear all pending tasks?")) return;
    setClearing(true);
    try {
      await clearTasks();
    } catch (err) {
      console.error("Failed to clear tasks:", err);
      alert("Failed to clear tasks");
    } finally {
      setClearing(false);
    }
  }

  /** Deletes a specific task by ID. */
  async function handleDelete(id: string) {
    setDeleting((prev) => new Set(prev).add(id));
    try {
      await deleteTask(id);
    } catch (err) {
      console.error("Failed to delete task:", err);
      alert("Failed to delete task");
    } finally {
      setDeleting((prev) => {
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
        <h2>Task Queue ({tasks.length})</h2>
        <button
          onClick={handleClearAll}
          disabled={clearing || tasks.length === 0}
          className="btn-clear"
        >
          {clearing ? "Clearing..." : "Clear All"}
        </button>
      </div>
      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="empty">No pending tasks</div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="task-item task-item--detailed">
              <div className="task-content">
                {task.component && (
                  <div className="task-component-name">
                    {task.component.name}
                  </div>
                )}
                <div className="task-text">{task.text}</div>
                <div className="task-meta">
                  <span
                    className={`task-status-badge task-status-badge--${task.status}`}
                  >
                    {task.status}
                  </span>
                  <span className="task-time">
                    {formatTime(task.timestamp)}
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
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDelete(task.id)}
                disabled={deleting.has(task.id)}
                className="btn-delete"
                title="Delete this task"
              >
                {deleting.has(task.id) ? "..." : "×"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
