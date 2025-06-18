
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

describe('Admin API', () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('POST /api/admin/login', () => {
    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Username and password are required');
    });

    it('should return 401 for invalid admin credentials', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          username: 'wrongadmin',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });
  });

  describe('GET /api/admin/users', () => {
    it('should return 401 for request without admin token', async () => {
      const response = await request(app)
        .get('/api/admin/users');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });
  });
});
