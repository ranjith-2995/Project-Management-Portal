import { useState } from 'react';
import { createTask } from '../api/taskApi';

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', icon: '🔴', desc: 'Urgent' },
  { value: 'medium', label: 'Medium', icon: '🟡', desc: 'Normal' },
  { value: 'low', label: 'Low', icon: '🟢', desc: 'When free' },
];

export default function AddTask({ onSuccess, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    startDate: '',
    dueDate: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    else if (form.title.trim().length < 3) errs.title = 'Title must be at least 3 characters.';
    else if (form.title.trim().length > 100) errs.title = 'Title must be under 100 characters.';
    if (form.description.length > 500) errs.description = 'Description must be under 500 characters.';
    if (form.startDate && form.dueDate && new Date(form.startDate) > new Date(form.dueDate)) {
      errs.dates = 'Start date cannot be after due date.';
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
    setApiError('');
  };

  const handlePriority = (value) => {
    setForm((f) => ({ ...f, priority: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setApiError('');
    try {
      const newTask = await createTask({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
      });
      if (onSuccess) onSuccess(newTask);
    } catch (err) {
      setApiError(err?.response?.data?.message || 'Failed to create task.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-card" style={{ maxWidth: '100%' }}>
        <div className="form-card__title" style={{ justifyContent: 'space-between' }}>
          <div><span>📝</span> Add a New Task</div>
          {onCancel && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={onCancel}>
              ✕ Cancel
            </button>
          )}
        </div>

        {apiError && <div className="form-error" style={{ marginBottom: '1rem' }}>⚠ {apiError}</div>}

        {/* Title */}
        <div className="form-group">
          <label className="form-label" htmlFor="title">
            Task Title <span className="required">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            className={`form-input ${errors.title ? 'error' : ''}`}
            placeholder="e.g. Design landing page hero section"
            value={form.title}
            onChange={handleChange}
            maxLength={100}
            autoFocus
          />
          {errors.title ? (
            <span className="form-error">⚠ {errors.title}</span>
          ) : (
            <span className="form-hint">
              {form.title.length}/100 characters
            </span>
          )}
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label" htmlFor="description">
            Description{' '}
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
              (optional)
            </span>
          </label>
          <textarea
            id="description"
            name="description"
            className={`form-textarea ${errors.description ? 'error' : ''}`}
            placeholder="Add any relevant details, context, or notes…"
            value={form.description}
            onChange={handleChange}
            maxLength={500}
            rows={3}
          />
          {errors.description ? (
            <span className="form-error">⚠ {errors.description}</span>
          ) : (
            <span className="form-hint">
              {form.description.length}/500 characters
            </span>
          )}
        </div>

        {/* Priority */}
        <div className="form-group">
          <label className="form-label">Priority</label>
          <div className="priority-options">
            {PRIORITY_OPTIONS.map(({ value, label, desc }) => (
              <label
                key={value}
                className={`priority-option ${
                  form.priority === value ? `selected-${value}` : ''
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={value}
                  checked={form.priority === value}
                  onChange={() => handlePriority(value)}
                />
                <span className="priority-dot" aria-hidden="true" data-priority={value} />
                <strong>{label}</strong>
                <span className="priority-desc">{desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="startDate">Start Date</label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              className="form-input"
              value={form.startDate}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="dueDate">Due Date</label>
            <input
              id="dueDate"
              name="dueDate"
              type="date"
              className={`form-input ${errors.dates ? 'error' : ''}`}
              value={form.dueDate}
              onChange={handleChange}
            />
          </div>
        </div>
        {errors.dates && <div className="form-error" style={{ marginTop: '-1rem', marginBottom: '1rem' }}>⚠ {errors.dates}</div>}

        {/* Actions */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? '⏳ Creating…' : '✦ Create Task'}
          </button>
          {onCancel && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
