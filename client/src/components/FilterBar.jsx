const FILTERS = [
  { key: 'all', label: 'All', icon: '⊞' },
  { key: 'pending', label: 'Pending', icon: '○' },
  { key: 'in-progress', label: 'In Progress', icon: '⏳' },
  { key: 'completed', label: 'Completed', icon: '✓' },
];

export default function FilterBar({ activeFilter, onFilter, counts }) {
  return (
    <div className="filter-bar">
      <span className="filter-bar__label">Filter</span>
      {FILTERS.map(({ key, label, icon }) => (
        <button
          key={key}
          className={`filter-pill ${activeFilter === key ? 'active' : ''}`}
          onClick={() => onFilter(key)}
          aria-pressed={activeFilter === key}
        >
          <span>{icon}</span>
          {label}
          <span className="filter-pill__count">{counts[key] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
