const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let app;
let authToken;
let taskId;

// ─── Test Setup ───────────────────────────────────────────────────────────────

jest.setTimeout(60000); // 60s timeout for downloads

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Set env vars before importing app
  process.env.NODE_ENV = 'test';
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.JWT_EXPIRE = '1h';

  // Connect mongoose
  await mongoose.connect(uri);

  // Import app after env is set
  app = require('../index');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clean all collections before each test suite section
});

// ─── Auth Tests ───────────────────────────────────────────────────────────────

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.name).toBe('Test User');
      expect(res.body.user.email).toBe('test@example.com');
      authToken = res.body.token;
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Another', email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should require all fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'incomplete@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      authToken = res.body.token;
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
    });
  });
});

// ─── Task CRUD Tests ──────────────────────────────────────────────────────────

describe('Task Endpoints', () => {
  describe('POST /api/tasks', () => {
    it('should create a task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Task', description: 'A test description', priority: 'high' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.task.title).toBe('Test Task');
      expect(res.body.task.description).toBe('A test description');
      expect(res.body.task.priority).toBe('high');
      expect(res.body.task.status).toBe('pending');
      taskId = res.body.task.id;
    });

    it('should reject task without title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'No title' });

      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Unauthorized Task' });

      expect(res.status).toBe(401);
    });

    it('should create multiple tasks for pagination testing', async () => {
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: `Pagination Task ${i}`, priority: 'medium' });
      }

      const res = await request(app)
        .get('/api/tasks?limit=100')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.body.total).toBeGreaterThanOrEqual(6);
    });
  });

  describe('GET /api/tasks', () => {
    it('should return paginated tasks', async () => {
      const res = await request(app)
        .get('/api/tasks?page=1&limit=3')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tasks.length).toBeLessThanOrEqual(3);
      expect(res.body.page).toBe(1);
      expect(res.body.totalPages).toBeGreaterThanOrEqual(2);
      expect(res.body.total).toBeGreaterThanOrEqual(6);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/tasks?status=pending&limit=100')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      res.body.tasks.forEach((task) => {
        expect(task.status).toBe('pending');
      });
    });

    it('should search by title', async () => {
      const res = await request(app)
        .get('/api/tasks?search=Pagination&limit=100')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      res.body.tasks.forEach((task) => {
        expect(task.title.toLowerCase()).toContain('pagination');
      });
    });

    it('should sort ascending', async () => {
      const res = await request(app)
        .get('/api/tasks?sort=asc&limit=100')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const dates = res.body.tasks.map((t) => new Date(t.createdAt).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
      }
    });

    it('should sort descending by default', async () => {
      const res = await request(app)
        .get('/api/tasks?limit=100')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const dates = res.body.tasks.map((t) => new Date(t.createdAt).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
      }
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('should cycle status pending → in-progress', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.task.status).toBe('in-progress');
    });

    it('should cycle status in-progress → completed', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.task.status).toBe('completed');
    });

    it('should cycle status completed → pending', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.task.status).toBe('pending');
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/tasks/:id (edit)', () => {
    it('should update task fields', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title', description: 'Updated description', priority: 'low' });

      expect(res.status).toBe(200);
      expect(res.body.task.title).toBe('Updated Title');
      expect(res.body.task.description).toBe('Updated description');
      expect(res.body.task.priority).toBe('low');
    });

    it('should reject empty title', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '', description: 'test', priority: 'low' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for already deleted task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});

// ─── Dashboard Stats Test ─────────────────────────────────────────────────────

describe('Dashboard Statistics', () => {
  it('should return correct task counts by status', async () => {
    // Clean up
    const Task = require('../models/Task');
    await Task.deleteMany({});

    // Create tasks with specific statuses
    const User = require('../models/User');
    const user = await User.findOne({ email: 'test@example.com' });

    await Task.create([
      { title: 'Pending 1', status: 'pending', user: user._id },
      { title: 'Pending 2', status: 'pending', user: user._id },
      { title: 'InProg 1', status: 'in-progress', user: user._id },
      { title: 'Done 1', status: 'completed', user: user._id },
      { title: 'Done 2', status: 'completed', user: user._id },
      { title: 'Done 3', status: 'completed', user: user._id },
    ]);

    // Get all tasks
    const allRes = await request(app)
      .get('/api/tasks?limit=100')
      .set('Authorization', `Bearer ${authToken}`);

    expect(allRes.body.total).toBe(6);

    // Filter pending
    const pendingRes = await request(app)
      .get('/api/tasks?status=pending&limit=100')
      .set('Authorization', `Bearer ${authToken}`);

    expect(pendingRes.body.total).toBe(2);

    // Filter in-progress
    const ipRes = await request(app)
      .get('/api/tasks?status=in-progress&limit=100')
      .set('Authorization', `Bearer ${authToken}`);

    expect(ipRes.body.total).toBe(1);

    // Filter completed
    const compRes = await request(app)
      .get('/api/tasks?status=completed&limit=100')
      .set('Authorization', `Bearer ${authToken}`);

    expect(compRes.body.total).toBe(3);
  });
});

// ─── Health Check ─────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('should return server status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.database).toBe('connected');
  });
});
