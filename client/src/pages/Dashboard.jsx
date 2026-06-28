import { useState, useEffect, useCallback } from 'react';
import { getTasks, toggleTask, deleteTask, updateTask } from '../api/taskApi';
import TaskCard from '../components/TaskCard';
import FilterBar from '../components/FilterBar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import AddTask from './AddTask';
import CalendarView from '../components/CalendarView';
import TimelineView from '../components/TimelineView';

const LIMIT = 6; // Tasks per page

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState('list'); // list, calendar, timeline
  const [allTasks, setAllTasks] = useState([]); // all tasks for calendar/timeline
  const { toasts, addToast } = useToast();

  // Stats — fetched separately (all tasks, no filter/search/page)
  const [stats, setStats] = useState({ all: 0, pending: 0, 'in-progress': 0, completed: 0 });

  const fetchStats = useCallback(async () => {
    try {
      const data = await getTasks({ limit: 1000 }); // Get all for counting
      const all = data.tasks;
      setStats({
        all: data.total,
        pending: all.filter((t) => t.status === 'pending').length,
        'in-progress': all.filter((t) => t.status === 'in-progress').length,
        completed: all.filter((t) => t.status === 'completed').length,
      });
    } catch {}
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTasks({
        status: filter !== 'all' ? filter : undefined,
        page,
        limit: LIMIT,
        sort,
        search: search.trim() || undefined,
      });
      setTasks(data.tasks);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      addToast('Failed to load tasks.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, page, sort, search, addToast]);

  const fetchAllTasks = useCallback(async () => {
    try {
      const data = await getTasks({ limit: 1000, sort: 'asc' });
      setAllTasks(data.tasks);
    } catch {}
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Fetch all tasks when switching to calendar or timeline view
  useEffect(() => {
    if (view === 'calendar' || view === 'timeline') {
      fetchAllTasks();
    }
  }, [view, fetchAllTasks]);

  // Reset to page 1 when filter/search/sort changes
  useEffect(() => {
    setPage(1);
  }, [filter, search, sort]);

  const refreshAll = () => {
    fetchTasks();
    fetchStats();
    if (view === 'calendar' || view === 'timeline') fetchAllTasks();
  };

  const handleToggle = async (id) => {
    try {
      const updated = await toggleTask(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      const statusMsgs = {
        'pending': 'Task moved to Pending.',
        'in-progress': 'Task is now In Progress ⏳',
        'completed': 'Task marked as completed! 🎉',
      };
      addToast(statusMsgs[updated.status] || 'Status updated.', 'success');
      fetchStats();
    } catch {
      addToast('Failed to update status.', 'error');
    }
  };

  const handleEdit = async (id, updates) => {
    try {
      const updated = await updateTask(id, updates);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      addToast('Task updated successfully.', 'success');
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to update task.', 'error');
      throw err;
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      addToast('Task deleted successfully.', 'success');
      refreshAll();
    } catch {
      addToast('Failed to delete task.', 'error');
    }
  };

  const handleAddSuccess = () => {
    setShowAdd(false);
    addToast('Task created successfully! 🎉', 'success');
    setPage(1);
    setFilter('all');
    setSearch('');
    refreshAll();
  };

  const completionPct = stats.all > 0 ? Math.round((stats.completed / stats.all) * 100) : 0;

  return (
    <>
      <main className="page">
        <div className="container">
          {/* Header */}
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-header__title">
                My <span>Tasks</span>
              </h1>
              <p className="dashboard-header__subtitle">
                {loading ? 'Fetching your tasks…' : 'Manage your work and keep progress moving.'}
              </p>
            </div>
            {!showAdd && (
              <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                <span>＋</span> Add Task
              </button>
            )}
          </div>

          {/* Add Task Inline Form */}
          {showAdd && (
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <AddTask onSuccess={handleAddSuccess} onCancel={() => setShowAdd(false)} />
            </div>
          )}

          {/* Stats Row */}
          {!loading && stats.all > 0 && (
            <div className="stats-row stats-row--4">
              <div className="stat-card">
                <div className="stat-card__value">{stats.all}</div>
                <div className="stat-card__label">Total Tasks</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__value">{stats.pending}</div>
                <div className="stat-card__label">Pending</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__value">{stats['in-progress']}</div>
                <div className="stat-card__label">In Progress</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__value">{stats.completed}</div>
                <div className="stat-card__label">Completed</div>
              </div>
            </div>
          )}

          {/* Controls: Filter, Search, Sort */}
          <div className="task-list-controls">
            <FilterBar activeFilter={filter} onFilter={setFilter} counts={stats} />

            <div className="controls-right">
              {/* View Toggle */}
              <div className="view-toggles" style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
                <button className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: 'var(--radius-full)', padding: '4px 12px' }} onClick={() => setView('list')}>List</button>
                <button className={`btn btn-sm ${view === 'calendar' ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: 'var(--radius-full)', padding: '4px 12px' }} onClick={() => setView('calendar')}>Calendar</button>
                <button className={`btn btn-sm ${view === 'timeline' ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: 'var(--radius-full)', padding: '4px 12px' }} onClick={() => setView('timeline')}>Timeline</button>
              </div>

              {/* Sort toggle */}
              <button
                className="btn btn-sm btn-ghost sort-toggle"
                onClick={() => setSort((s) => (s === 'desc' ? 'asc' : 'desc'))}
                title={sort === 'desc' ? 'Newest first' : 'Oldest first'}
              >
                {sort === 'desc' ? '↓' : '↑'} {sort === 'desc' ? 'Newest' : 'Oldest'}
              </button>

              {/* Search Bar */}
              <div className="search-bar">
                <span className="search-bar__icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-bar__input"
                />
                {search && (
                  <button className="search-bar__clear" onClick={() => setSearch('')}>✕</button>
                )}
              </div>
            </div>
          </div>

          {/* Task List */}
          {loading ? (
            <LoadingSpinner />
          ) : tasks.length === 0 ? (
            search ? (
              <div className="empty-state">
                <div className="empty-state__icon">🔍</div>
                <h3 className="empty-state__title">No matches found</h3>
                <p className="empty-state__desc">No tasks matching "{search}".</p>
                <button className="btn btn-ghost" onClick={() => setSearch('')}>Clear Search</button>
              </div>
            ) : (
              <EmptyState filter={filter} onAddClick={() => setShowAdd(true)} />
            )
          ) : (
            <>
              {view === 'list' && (
                <div className="task-list">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  ))}
                </div>
              )}

              {view === 'calendar' && (
                <CalendarView tasks={allTasks} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} />
              )}

              {view === 'timeline' && (
                <TimelineView tasks={allTasks} />
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn-sm btn-ghost"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ← Prev
                  </button>

                  <div className="pagination__pages">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        className={`pagination__page ${p === page ? 'active' : ''}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    className="btn btn-sm btn-ghost"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next →
                  </button>

                  <span className="pagination__info">
                    Page {page} of {totalPages} · {total} task{total !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Toast toasts={toasts} />
    </>
  );
}
