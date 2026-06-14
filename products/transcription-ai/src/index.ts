import express, { Request, Response } from 'express';
import { json, urlencoded } from 'body-parser';
import Queue from 'bull';
import { z } from 'zod';
import { validateEnv, config } from './config';
import { verifyZoomWebhookSignature } from './middleware/webhookAuth';
import transcriptionService from './services/transcriptionService';

// Validate environment variables at startup
validateEnv();

const app = express();
const PORT = config.port;

// Request body size limits (prevent DoS)
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ limit: '10mb', extended: true }));

// Initialize Bull queue for transcription jobs
const transcriptionQueue = new Queue('transcription', config.redis.url);

// Queue processor
transcriptionQueue.process(async (job) => {
  console.log(`[QUEUE] Processing job ${job.id}: ${job.data.zoomMeetingId}`);
  try {
    await transcriptionService.processTranscription(job.data);
    console.log(`[QUEUE] ✅ Job ${job.id} completed`);
  } catch (error) {
    console.error(`[QUEUE] ❌ Job ${job.id} failed:`, error);
    throw error;
  }
});

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Zoom Webhook - Recording Complete
// Schema validation for Zoom webhook payload
const ZoomWebhookSchema = z.object({
  event: z.literal('recording.completed'),
  payload: z.object({
    object: z.object({
      id: z.string(),
      uuid: z.string(),
      recording_files: z.array(z.object({
        download_url: z.string().url(),
        file_size: z.number().positive(),
      })).min(1),
    }),
  }),
});

app.post('/api/v1/webhooks/zoom',
  verifyZoomWebhookSignature,
  async (req: Request, res: Response) => {
    try {
      // Validate payload structure with Zod
      const payload = ZoomWebhookSchema.parse(req.body);

      const { id: zoomMeetingId, recording_files } = payload.payload.object;

      console.log(`[WEBHOOK] Received recording.completed for meeting: ${zoomMeetingId}`);

      // Queue transcription job with retry logic
      const job = await transcriptionQueue.add(
        {
          zoomMeetingId,
          recordingUrl: recording_files[0].download_url,
          fileSize: recording_files[0].file_size,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        }
      );

      console.log(`[WEBHOOK] ✅ Job queued with ID: ${job.id}`);

      res.json({
        status: 'queued',
        meeting_id: zoomMeetingId,
        job_id: job.id,
        message: 'Recording queued for transcription',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[WEBHOOK] Validation error:', error.errors);
        return res.status(400).json({
          error: 'Invalid payload',
          details: error.errors,
        });
      }

      console.error('[WEBHOOK] Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get Meeting & Minutes
app.get('/api/v1/meetings/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Fetch from database
    // const meeting = await getMeeting(id);
    // const minutes = await getMinutes(id);

    res.json({
      meeting: {
        id,
        status: 'processing',
        message: 'Meeting data not yet available',
      },
    });
  } catch (error) {
    console.error('[GET_MEETING] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Regenerate Minutes
app.post('/api/v1/meetings/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { prompt_override } = req.body;

    // Queue regeneration job
    const job = await transcriptionQueue.add(
      {
        meetingId: id,
        promptOverride: prompt_override,
        isRegeneration: true,
      },
      {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      }
    );

    console.log(`[REGENERATE] ✅ Regeneration job queued: ${job.id}`);

    res.json({
      status: 'queued',
      job_id: job.id,
      message: 'Regeneration queued',
    });
  } catch (error) {
    console.error('[REGENERATE] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling for uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED_REJECTION]', reason);
});

app.listen(PORT, () => {
  console.log(`✅ Transcription AI Server running on port ${PORT}`);
  console.log(`📍 Webhook endpoint: POST ${config.apiBaseUrl}/api/v1/webhooks/zoom`);
});

export default app;
