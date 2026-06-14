import request from 'supertest';
import app from '../index';

describe('Transcription AI API', () => {
  describe('Health Check', () => {
    test('GET /health returns ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
    });
  });

  describe('Webhook Endpoint', () => {
    test('POST /api/v1/webhooks/zoom returns queued status', async () => {
      const payload = {
        event: 'recording.completed',
        payload: {
          object: {
            id: 'zoom_meeting_123',
            uuid: 'unique_uuid',
            recording_files: [
              {
                download_url: 'https://example.com/recording.mp4',
                file_size: 1024000000,
              },
            ],
          },
        },
      };

      const res = await request(app)
        .post('/api/v1/webhooks/zoom')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'queued');
      expect(res.body).toHaveProperty('meeting_id');
    });

    test('POST /api/v1/webhooks/zoom rejects invalid event', async () => {
      const payload = {
        event: 'invalid_event',
        payload: {},
      };

      const res = await request(app)
        .post('/api/v1/webhooks/zoom')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('Get Meeting Endpoint', () => {
    test('GET /api/v1/meetings/:id returns meeting status', async () => {
      const res = await request(app).get('/api/v1/meetings/meeting_123');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('meeting');
      expect(res.body.meeting).toHaveProperty('id');
      expect(res.body.meeting).toHaveProperty('status');
    });
  });

  describe('Regenerate Minutes Endpoint', () => {
    test('POST /api/v1/meetings/:id/regenerate queues job', async () => {
      const res = await request(app)
        .post('/api/v1/meetings/meeting_123/regenerate')
        .send({ prompt_override: 'Focus on technical details' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'queued');
      expect(res.body).toHaveProperty('job_id');
    });
  });
});
