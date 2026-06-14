import axios, { AxiosError } from 'axios';

interface TranscriptionJob {
  zoomMeetingId: string;
  recordingUrl: string;
  fileSize: number;
  isRegeneration?: boolean;
  meetingId?: string;
  promptOverride?: string;
}

interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  speakers: SpeakerSegment[];
}

interface SpeakerSegment {
  speaker: string;
  start_time: number;
  end_time: number;
  text: string;
}

// Custom error classes for specific error types
export class RecordingNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecordingNotFoundError';
  }
}

export class ZoomAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ZoomAuthError';
  }
}

export class TranscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

export class MinutesGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MinutesGenerationError';
  }
}

export class TranscriptionService {
  private openaiApiKey = process.env.OPENAI_API_KEY;
  private claudeApiKey = process.env.CLAUDE_API_KEY;

  /**
   * Download recording from Zoom and store locally
   * Throws specific errors for retry logic
   */
  async downloadRecording(recordingUrl: string): Promise<string> {
    try {
      console.log(`[DOWNLOAD] Fetching recording: ${recordingUrl}`);

      const response = await axios.get(recordingUrl, {
        timeout: 60000,
        maxRedirects: 5,
        responseType: 'stream',
      });

      // TODO: Save to temporary location or S3
      const filePath = `/tmp/recording_${Date.now()}.mp4`;
      console.log(`[DOWNLOAD] ✅ Recording saved to: ${filePath}`);

      return filePath;
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 404) {
        throw new RecordingNotFoundError(
          'Recording file not found on Zoom (404). The recording may have been deleted.'
        );
      }

      if (axiosError.response?.status === 401) {
        throw new ZoomAuthError(
          'Invalid Zoom credentials or token expired (401). Check ZOOM_API_KEY and ZOOM_API_SECRET.'
        );
      }

      if (axiosError.code === 'ECONNABORTED') {
        throw new Error(`[DOWNLOAD] Timeout while downloading recording (${axiosError.message})`);
      }

      throw new Error(`[DOWNLOAD] Failed to download recording: ${(error as Error).message}`);
    }
  }

  /**
   * Convert audio to text using OpenAI Whisper
   */
  async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
    try {
      console.log(`[TRANSCRIBE] Starting transcription: ${audioFilePath}`);

      // TODO: Implement Whisper API integration
      // const formData = new FormData();
      // formData.append('file', fs.createReadStream(audioFilePath));
      // formData.append('model', 'whisper-1');
      // formData.append('language', 'ja');
      //
      // const response = await axios.post(
      //   'https://api.openai.com/v1/audio/transcriptions',
      //   formData,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${this.openaiApiKey}`,
      //       ...formData.getHeaders(),
      //     },
      //     timeout: 600000,
      //   }
      // );

      const result: TranscriptionResult = {
        text: 'Sample transcription text',
        language: 'ja',
        duration: 3600,
        speakers: [
          {
            speaker: 'Speaker 1',
            start_time: 0,
            end_time: 60,
            text: 'Initial greeting text',
          },
        ],
      };

      console.log(`[TRANSCRIBE] ✅ Transcription complete (${result.duration}s)`);
      return result;
    } catch (error) {
      throw new TranscriptionError(
        `Transcription failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Extract key information using Claude
   */
  async generateMinutes(transcriptionText: string, promptOverride?: string): Promise<any> {
    try {
      console.log('[MINUTES] Generating meeting minutes...');

      const prompt = promptOverride ||
        `Generate structured meeting minutes from this transcript with the following format:
        
1. **Summary**: Brief overview of the meeting (2-3 sentences)
2. **Key Decisions**: Bullet points of decisions made
3. **Action Items**: List with assignee and due date
4. **Participants**: People who spoke

Transcript:
${transcriptionText}`;

      // TODO: Implement Claude API integration
      // const response = await axios.post(
      //   'https://api.anthropic.com/v1/messages',
      //   {
      //     model: 'claude-opus-4',
      //     max_tokens: 2048,
      //     messages: [
      //       {
      //         role: 'user',
      //         content: prompt
      //       }
      //     ]
      //   },
      //   {
      //     headers: { 'x-api-key': this.claudeApiKey },
      //     timeout: 120000,
      //   }
      // );

      const result = {
        summary: 'Meeting summary would go here',
        decisions: ['Decision 1', 'Decision 2'],
        action_items: [
          {
            task: 'Follow up on pricing',
            assignee: 'Sales Rep',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        ],
        key_topics: ['Pricing', 'Implementation', 'Timeline'],
      };

      console.log('[MINUTES] ✅ Minutes generated');
      return result;
    } catch (error) {
      throw new MinutesGenerationError(
        `Minutes generation failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Process complete transcription job
   */
  async processTranscription(job: TranscriptionJob): Promise<void> {
    try {
      const meetingId = job.meetingId || job.zoomMeetingId;
      console.log(`[PROCESS] Starting transcription job for meeting: ${meetingId}`);

      // 1. Download recording
      const audioPath = await this.downloadRecording(job.recordingUrl);

      // 2. Transcribe
      const transcriptionResult = await this.transcribe(audioPath);

      // 3. Generate minutes
      const minutes = await this.generateMinutes(
        transcriptionResult.text,
        job.promptOverride
      );

      // 4. Store results in database
      // TODO: await storeTranscriptionResult(job.meetingId, transcriptionResult, minutes);

      // 5. Send notification
      // TODO: await notificationService.sendEmail(job, minutes);

      console.log(`[PROCESS] ✅ Transcription completed for meeting: ${meetingId}`);
    } catch (error) {
      const errorMsg = (error as Error).message;
      const meetingId = job.meetingId || job.zoomMeetingId;

      console.error(`[PROCESS] ❌ Transcription failed for meeting: ${meetingId}`);
      console.error(`[PROCESS] Error: ${errorMsg}`);

      // Re-throw specific errors for Bull queue retry logic
      if (error instanceof RecordingNotFoundError) {
        console.error('[PROCESS] ℹ️  Recording not found - will not retry');
        throw error;
      }

      if (error instanceof ZoomAuthError) {
        console.error('[PROCESS] ℹ️  Auth error - will retry with backoff');
        throw error;
      }

      throw error;
    }
  }
}

export default new TranscriptionService();
