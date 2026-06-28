import { useState } from 'react';
import EditModal from './EditModal';

const PRIORITY_CONFIG = {
  high: { label: 'High', color: 'badge-high' },
  medium: { label: 'Medium', color: 'badge-medium' },
  low: { label: 'Low', color: 'badge-low' },
};

const STATUS_CONFIG = {
  'pending': { label: '○ Pending', badgeClass: 'badge-status-pending' },
  'in-progress': { label: '⏳ In Progress', badgeClass: 'badge-status-in-progress' },
  'completed': { label: '✓ Done', badgeClass: 'badge-status-completed' },
};

const TOGGLE_LABELS = {
  'pending': '▶ Start',
  'in-progress': '✓ Complete',
  'completed': '↩ Undo',
};

const TOGGLE_CLASSES = {
  'pending': 'btn-progress',
  'in-progress': 'btn-success',
  'completed': 'btn-ghost',
};

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TaskCard({ task, onToggle, onDelete, onEdit }) {
  const [confirming, setConfirming] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG['pending'];
  const isCompleted = task.status === 'completed';

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    await onToggle(task.id);
    setToggling(false);
  };

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    setDeleting(true);
    await onDelete(task.id);
  };

  return (
    <>
      <div className={`task-card ${isCompleted ? 'completed' : ''} ${task.status === 'in-progress' ? 'in-progress' : ''}`}>
        <div className="task-card__header">
          <h3 className="task-card__title">{task.title}</h3>
          <div className="task-card__badges">
            <span className={`badge ${priority.color}`}>{priority.label}</span>
            <span className={`badge ${statusCfg.badgeClass}`}>{statusCfg.label}</span>
          </div>
        </div>

        {/* Description — always rendered if non-empty */}
        {task.description && task.description.trim() !== '' && (
          <p className="task-card__description">{task.description}</p>
        )}

        <div className="task-card__footer">
          <div className="task-card__meta">
            <span className="task-card__date">📅 Created: {formatDate(task.createdAt)}</span>
            {task.dueDate && (
              <span className={`task-card__date task-card__due ${new Date(task.dueDate) < new Date() && !isCompleted ? 'overdue' : ''}`}>
                🔔 Due: {formatDate(task.dueDate)}
              </span>
            )}
            {task.startDate && (
              <span className="task-card__date">
                🚦 Start: {formatDate(task.startDate)}
              </span>
            )}
          </div>

          <div className="task-card__actions">
            {/* Edit button */}
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setEditOpen(true)}
              aria-label="Edit task"
              title="Edit task"
            >
              ✏ Edit
            </button>

            {/* Status toggle */}
            <button
              className={`btn btn-sm ${TOGGLE_CLASSES[task.status]}`}
              onClick={handleToggle}
              disabled={toggling}
              aria-label="Advance task status"
            >
              {toggling ? '…' : TOGGLE_LABELS[task.status]}
            </button>

            {/* Delete */}
            <button
              className={`btn btn-sm ${confirming ? 'btn-danger' : 'btn-ghost'}`}
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete task"
            >
              {deleting ? '…' : confirming ? '⚠ Confirm?' : '🗑'}
            </button>
          </div>
        </div>
      </div>

      {editOpen && (
        <EditModal
          task={task}
          onSave={onEdit}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
