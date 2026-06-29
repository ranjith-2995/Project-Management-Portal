require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Task = require('./models/Task');
const authRoutes = require('./routes/auth');
const { protect } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://taskflow-project-management-ten.vercel.app',
  'https://project-management-portal-ka8q.onrender.com',
  'https://client-xsi10ejth-ranjith-tech.vercel.app',
  'https://project-management-portal-leb4.vercel.app'
];

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    if (origin.endsWith('.vercel.app')) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('\n✅ Connected to MongoDB'))
  .catch((err) => console.error('\n❌ MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Task Manager API is live.' });
});

// ─── Auth Routes (public) ─────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─── Task Routes (all protected) ─────────────────────────────────────────────

// GET /api/tasks — get tasks for logged-in user, optional ?status filter
app.get('/api/tasks', protect, async (req, res) => {
  try {
    const { status, sort = 'desc', page = 1, limit = 10, search } = req.query;
    const query = { user: req.user.id };

    if (status && ['pending', 'in-progress', 'completed'].includes(status)) {
      query.status = status;
    }

    // Server-side search by title
    if (search && search.trim() !== '') {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    // Sort direction
    const sortOrder = sort === 'asc' ? 1 : -1;

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      Task.find(query).sort({ createdAt: sortOrder }).skip(skip).limit(limitNum),
      Task.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: tasks.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/tasks — create a new task for logged-in user
app.post('/api/tasks', protect, async (req, res) => {
  try {
    const { title, description = '', priority = 'medium', startDate, dueDate } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ success: false, message: 'Priority must be low, medium, or high.' });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      priority,
      status: 'pending',
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      user: req.user.id
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/tasks/:id — cycle status: pending → in-progress → completed → pending
app.patch('/api/tasks/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOne({ _id: id, user: req.user.id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Cycle through statuses
    const cycle = { 'pending': 'in-progress', 'in-progress': 'completed', 'completed': 'pending' };
    task.status = cycle[task.status] || 'pending';
    await task.save();

    res.json({ success: true, task });
  } catch (error) {
    console.error('Error updating task:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/tasks/:id — edit task fields (title, description, priority, dates)
app.put('/api/tasks/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, startDate, dueDate } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority.' });
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { 
        title: title.trim(), 
        description: description?.trim() || '', 
        priority,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.json({ success: true, task });
  } catch (error) {
    console.error('Error editing task:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/tasks/:id — delete a task owned by logged-in user
app.delete('/api/tasks/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOneAndDelete({ _id: id, user: req.user.id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Error deleting task:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const statusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    success: true,
    message: 'Server is running!',
    database: statusMap[dbState],
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// Export app for testing — only listen when run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n🚀 Task Manager API running on http://localhost:${PORT}`);
    console.log(`   Auth:   http://localhost:${PORT}/api/auth`);
    console.log(`   Tasks:  http://localhost:${PORT}/api/tasks\n`);
  });
}

module.exports = app;
