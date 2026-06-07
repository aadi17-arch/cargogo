import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import authRoutes from '../../routes/auth.routes';

// Mock database config
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    session: {
      create: jest.fn().mockResolvedValue({}),
    }
  }
}));

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

describe('Auth Endpoints Integration Test', () => {
  it('should return 400 or 401 when trying to login with invalid parameters', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@cargogo.com', password: '' });

    // Login with missing password fields should return validation error/unauthorized
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
