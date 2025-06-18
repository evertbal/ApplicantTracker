
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

describe('Authentication API', () => {
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

  describe('POST /api/auth/login', () => {
    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Email and password are required');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });
  });

  describe('GET /api/auth/user', () => {
    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/auth/user');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });
  });

  describe('GET /api/replit-user', () => {
    it('should return 401 for unauthenticated Replit user', async () => {
      const response = await request(app)
        .get('/api/replit-user');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Not authenticated with Replit');
    });
  });
});
