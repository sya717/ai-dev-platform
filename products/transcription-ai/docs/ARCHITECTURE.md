# Architecture Design: AI-Powered Meeting Minutes Automation

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Zoom Webhook Trigger                       │
│                  (Meeting Recording Complete)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             v
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway (Express)                         │
│              - Auth & Rate Limiting                              │
│              - Request Validation                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                 ┌───────────┴───────────┐
                 v                       v
    ┌────────────────────────┐  ┌────────────────────────┐
    │  Audio Processing      │  │  Metadata Storage      │
    │  Service (Worker)      │  │  (PostgreSQL)          │
    │ - Download from Zoom   │  │ - Meeting info         │
    │ - STT (Speech-to-Text) │  │ - Participant list     │
    │ - Speaker Diarization  │  │ - Timestamps           │
    └────────────┬───────────┘  └──────────┬─────────────┘
                 │                         │
                 └───────────┬─────────────┘
                             v
        ┌────────────────────────────────────┐
        │  Minutes Generation Engine         │
        │  - Summarization (Claude API)      │
        │  - Decision Extraction             │
        │  - Action Item Detection           │
        └────────────┬───────────────────────┘
                     │
         ┌───────────┴───────────┐
         v                       v
  ┌──────────────────┐  ┌──────────────────┐
  │  Notification    │  │  Storage         │
  │  Service         │  │  (S3 + DB)       │
  │  - Email         │  │  - Markdown      │
  │  - Slack         │  │  - JSON          │
  │  - Webhook       │  │  - Searchable    │
  └──────────────────┘  └──────────────────┘
```

## 2. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|----------|
| Backend | Node.js + Express (TypeScript) | High productivity for rapid iteration |
| STT Engine | OpenAI Whisper API | 90%+ accuracy for Japanese |
| LLM | Claude API (Opus/Sonnet) | Superior summarization & extraction |
| Database | PostgreSQL | Structured meeting data |
| Cache | Redis | Session management, rate limiting |
| Storage | AWS S3 | Scalable audio/document storage |
| Queue | Bull (Redis) | Background job processing |
| Infrastructure | Docker + Railway | Simple deployment |

## 3. Database Schema

```sql
-- Meetings
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zoom_meeting_id VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  recording_url TEXT NOT NULL,
  duration_seconds INTEGER,
  participant_count INTEGER,
  status ENUM ('pending', 'processing', 'completed', 'failed'),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  metadata JSONB,
  INDEX (zoom_meeting_id),
  INDEX (status)
);

-- Transcriptions
CREATE TABLE transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  full_text TEXT NOT NULL,
  language VARCHAR(10),
  duration_seconds INTEGER,
  accuracy_score FLOAT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (meeting_id)
);

-- Minutes (Generated Output)
CREATE TABLE minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  summary TEXT,
  decisions JSONB,
  action_items JSONB,
  participants JSONB,
  raw_markdown TEXT,
  generated_at TIMESTAMP DEFAULT NOW(),
  INDEX (meeting_id)
);

-- Speaker Data
CREATE TABLE speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  speaker_index INTEGER,
  speaker_name VARCHAR(255),
  total_speaking_time INTEGER,
  speaker_segments JSONB,
  INDEX (meeting_id)
);
```

## 4. API Design (OpenAPI)

### POST /api/v1/webhooks/zoom
Zoom の recording.completed webhook
```yaml
Request:
  body:
    event: 'recording.completed'
    payload:
      object:
        id: 'zoom_meeting_id'
        uuid: 'unique_uuid'
        recording_files: [{ download_url, file_size }]

Response: { status: 'queued', meeting_id: 'uuid' }
```

### GET /api/v1/meetings/{id}
会議及び議事録取得
```yaml
Response:
  meeting:
    id: 'uuid'
    title: 'string'
    status: 'completed'
  minutes:
    summary: 'string'
    decisions: []
    action_items: []
  transcription:
    text: 'string'
    speakers: []
```

### POST /api/v1/meetings/{id}/regenerate
議事録再生成
```yaml
Request: { prompt_override?: 'string' }
Response: { job_id: 'uuid', status: 'processing' }
```

## 5. Integration Points

### External APIs
- **Zoom API**: Recording download, meeting metadata
- **OpenAI Whisper**: Audio transcription
- **Claude API**: Summarization, extraction
- **AWS S3**: Document storage
- **Email/Slack**: Notifications

### Async Processing
- Redis Queue for background jobs
- Webhook retries with exponential backoff
- Event sourcing for audit trail

## 6. Security Considerations

- **Authentication**: Zoom JWT verification on webhooks
- **Authorization**: Role-based access (Admin, Manager, Viewer)
- **Data Encryption**: TLS for transmission, encryption at rest in S3
- **PII Handling**: Automatic speaker anonymization option
- **Rate Limiting**: 1000 requests/hour per API key
- **Audit Logging**: All access to minutes logged

## 7. Scalability Plan

- **Expected Load**: 100 meetings/day (peak 50 concurrent)
- **Database**: PostgreSQL with connection pooling (20 connections)
- **Cache**: Redis for session + rate limiting
- **Workers**: 5-10 Bull workers for transcription queue
- **Storage**: S3 with lifecycle policies (archive after 90 days)
- **CDN**: CloudFront for document delivery

## 8. Deployment Strategy

- Phase 1: Single Railway instance (MVP)
- Phase 2: Multi-region with load balancing
- Phase 3: Kubernetes for auto-scaling

## 9. Monitoring & Observability

- **Logging**: Winston + DataDog
- **Metrics**: Prometheus
- **Tracing**: OpenTelemetry
- **Alerting**: Page Duty for critical failures
