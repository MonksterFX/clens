/**
 * Task queue component displaying pending tasks.
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

export function TaskQueue({ tasks }: TaskQueueProps) {
  const [clearing, setClearing] = useState(false);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());

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
            <div key={task.id} className="task-item">
              <div className="task-content">
                <div className="task-text">{task.text}</div>
                <div className="task-meta">
                  <span className="task-time">
                    {formatTime(task.timestamp)}
                  </span>
                  <span className="task-id">{task.id.slice(0, 8)}</span>
                </div>
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
