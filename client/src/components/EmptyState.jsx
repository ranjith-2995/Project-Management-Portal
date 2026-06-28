export default function EmptyState({ filter, onAddClick }) {
  const messages = {
    all: {
      icon: '📋',
      title: 'No tasks yet',
      desc: "You're all caught up! Start by creating your first task to track your progress.",
    },
    pending: {
      icon: '○',
      title: 'No pending tasks',
      desc: 'Everything is moving forward!',
    },
    'in-progress': {
      icon: '⏳',
      title: 'No tasks in progress',
      desc: 'Pick up a pending task and start working on it.',
    },
    completed: {
      icon: '🏆',
      title: 'No completed tasks',
      desc: "You haven't completed any tasks yet. Check off a task to see it here.",
    },
  };

  const { icon, title, desc } = messages[filter] || messages.all;

  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__desc">{desc}</p>
      {filter === 'all' && onAddClick && (
        <button onClick={onAddClick} className="btn btn-primary">
          <span>＋</span> Create Task
        </button>
      )}
    </div>
  );
}
