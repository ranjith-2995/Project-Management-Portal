import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Fetch tasks with pagination, filtering, search, and sort
 * @param {Object} opts
 * @param {string|null} opts.status - 'pending' | 'in-progress' | 'completed' | null
 * @param {number} opts.page - page number (1-indexed)
 * @param {number} opts.limit - items per page
 * @param {string} opts.sort - 'asc' | 'desc'
 * @param {string} opts.search - search query for title
 */
export const getTasks = async ({ status, page = 1, limit = 10, sort = 'desc', search } = {}) => {
  const params = {};
  if (status && status !== 'all') params.status = status;
  if (page) params.page = page;
  if (limit) params.limit = limit;
  if (sort) params.sort = sort;
  if (search && search.trim()) params.search = search.trim();

  const { data } = await api.get('/tasks', { params });
  return data; // returns { tasks, total, page, totalPages, count }
};

/**
 * Create a new task
 */
export const createTask = async (taskData) => {
  const { data } = await api.post('/tasks', taskData);
  return data.task;
};

/**
 * Cycle task status: pending → in-progress → completed → pending
 */
export const toggleTask = async (id) => {
  const { data } = await api.patch(`/tasks/${id}`);
  return data.task;
};

/**
 * Edit a task's title, description, and priority
 */
export const updateTask = async (id, updates) => {
  const { data } = await api.put(`/tasks/${id}`, updates);
  return data.task;
};

/**
 * Delete a task
 */
export const deleteTask = async (id) => {
  const { data } = await api.delete(`/tasks/${id}`);
  return data;
};
