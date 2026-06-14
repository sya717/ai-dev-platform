import request from 'supertest';
import app from '../index';

describe('Requirement AI API', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('POST /api/v1/requirements requires requirement field', async () => {
    const res = await request(app)
      .post('/api/v1/requirements')
      .send({});
    expect(res.status).toBe(400);
  });

  test('POST /api/v1/requirements accepts requirement', async () => {
    const res = await request(app)
      .post('/api/v1/requirements')
      .send({ requirement: 'Build a chatbot' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('processing');
  });
});
