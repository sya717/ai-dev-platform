import express, { Request, Response } from 'express';
import { json } from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(json());

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Zoom Webhook - Recording Complete
app.post('/api/v1/webhooks/zoom', async (req: Request, res: Response) => {
  try {
    const { event, payload } = req.body;

    if (event !== 'recording.completed') {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    const { object } = payload;
    const { id: zoomMeetingId, recording_files } = object;

    // TODO: Queue transcription job
    // await transcriptionQueue.add({ zoomMeetingId, recording_files });

    res.json({
      status: 'queued',
      meeting_id: zoomMeetingId,
      message: 'Recording queued for transcription',
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
    console.error('Get meeting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Regenerate Minutes
app.post('/api/v1/meetings/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { prompt_override } = req.body;

    // TODO: Queue regeneration job
    // await regenerationQueue.add({ meetingId: id, prompt_override });

    res.json({
      status: 'queued',
      job_id: 'job_' + Date.now(),
      message: 'Regeneration queued',
    });
  } catch (error) {
    console.error('Regeneration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Transcription AI Server running on port ${PORT}`);
});

export default app;
