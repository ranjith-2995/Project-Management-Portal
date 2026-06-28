import { useState } from 'react';

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', icon: '🔴' },
  { value: 'medium', label: 'Medium', icon: '🟡' },
  { value: 'low', label: 'Low', icon: '🟢' },
];

export default function EditModal({ task, onSave, onClose }) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    else if (form.title.trim().length < 3) errs.title = 'Title must be at least 3 characters.';
    if (form.startDate && form.dueDate && new Date(form.startDate) > new Date(form.dueDate)) {
      errs.dates = 'Start date cannot be after due date.';
    }
    if (Object.keys(errs).length > 0) return setErrors(errs);

    setSaving(true);
    try {
      await onSave(task.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">✏ Edit Task</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-title">
              Title <span className="required">*</span>
            </label>
            <input
              id="edit-title"
              name="title"
              type="text"
              className={`form-input ${errors.title ? 'error' : ''}`}
              value={form.title}
              onChange={handleChange}
              maxLength={100}
              autoFocus
            />
            {errors.title && <span className="form-error">⚠ {errors.title}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-description">
              Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              id="edit-description"
              name="description"
              className="form-textarea"
              value={form.description}
              onChange={handleChange}
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Priority */}
          <div className="form-group">
            <label className="form-label">Priority</label>
            <div className="modal__priority-row">
              {PRIORITY_OPTIONS.map(({ value, label, icon }) => (
                <label
                  key={value}
                  className={`priority-option ${form.priority === value ? `selected-${value}` : ''}`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={value}
                    checked={form.priority === value}
                    onChange={() => setForm((f) => ({ ...f, priority: value }))}
                  />
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-startDate">Start Date</label>
              <input
                id="edit-startDate"
                name="startDate"
                type="date"
                className="form-input"
                value={form.startDate}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-dueDate">Due Date</label>
              <input
                id="edit-dueDate"
                name="dueDate"
                type="date"
                className={`form-input ${errors.dates ? 'error' : ''}`}
                value={form.dueDate}
                onChange={handleChange}
              />
            </div>
          </div>
          {errors.dates && <div className="form-error" style={{ marginTop: '-1rem', marginBottom: '1rem' }}>⚠ {errors.dates}</div>}

          <div className="modal__actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '⏳ Saving…' : '✓ Save Changes'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
