export interface Meeting {
  id: string;
  zoomMeetingId: string;
  title: string;
  recordingUrl: string;
  durationSeconds: number;
  participantCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface Transcription {
  id: string;
  meetingId: string;
  fullText: string;
  language: string;
  durationSeconds: number;
  accuracyScore: number;
  createdAt: Date;
}

export interface Minutes {
  id: string;
  meetingId: string;
  summary: string;
  decisions: string[];
  actionItems: ActionItem[];
  participants: string[];
  rawMarkdown: string;
  generatedAt: Date;
}

export interface ActionItem {
  task: string;
  assignee: string;
  dueDate: Date;
  status: 'pending' | 'completed';
}

export interface Speaker {
  id: string;
  meetingId: string;
  speakerIndex: number;
  speakerName?: string;
  totalSpeakingTime: number;
  segments: SpeakerSegment[];
}

export interface SpeakerSegment {
  startTime: number;
  endTime: number;
  text: string;
}
