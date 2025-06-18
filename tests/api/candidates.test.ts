
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

describe('Candidates API', () => {
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

  describe('GET /api/candidates', () => {
    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/candidates');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });
  });

  describe('POST /api/candidates', () => {
    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/candidates')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });
  });
});
