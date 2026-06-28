import React, { useMemo } from 'react';

export default function TimelineView({ tasks }) {
  // Sort tasks by dueDate, placing those without a dueDate at the end (or by createdAt)
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.createdAt).getTime();
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.createdAt).getTime();
      return dateA - dateB;
    });
  }, [tasks]);

  if (tasks.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No tasks for timeline.</div>;
  }

  return (
    <div className="timeline-view">
      <div className="timeline-container">
        {sortedTasks.map((task, index) => {
          const dateToDisplay = task.dueDate 
            ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' (Created)';
            
          return (
            <div key={task.id} className="timeline-item">
              <div className="timeline-item__date">
                {dateToDisplay}
              </div>
              <div className="timeline-item__divider">
                <div className={`timeline-item__dot priority-${task.priority} ${task.status === 'completed' ? 'completed' : ''}`}></div>
                {index !== sortedTasks.length - 1 && <div className="timeline-item__line"></div>}
              </div>
              <div className="timeline-item__content">
                <div className={`task-card ${task.status === 'completed' ? 'completed' : ''}`}>
                  <div className="task-card__header" style={{ marginBottom: 0 }}>
                    <h3 className="task-card__title" style={{ fontSize: '1rem' }}>{task.title}</h3>
                    <div className="task-card__badges">
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      <span className={`badge badge-status-${task.status}`}>{task.status.replace('-', ' ')}</span>
                    </div>
                  </div>
                  {task.description && (
                    <p className="task-card__description" style={{ marginTop: '12px', marginBottom: 0 }}>
                      {task.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
