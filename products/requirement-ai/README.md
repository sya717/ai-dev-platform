# Requirement AI

AI-powered requirement management tool.

## Overview

This service automatically:
1. Analyzes customer requirements
2. Generates PRDs (Product Requirement Documents)
3. Creates user stories
4. Prioritizes backlog items

## Architecture

```
User Input → PM Agent → Architect Agent → Implementation
     ↓
   PRD
   User Stories
   Backlog
```

## API

### POST /api/v1/requirements

```bash
curl -X POST http://localhost:3001/api/v1/requirements \
  -H "Content-Type: application/json" \
  -d '{"requirement": "Build an AI meeting transcriber"}'
```

Response:
```json
{
  "message": "Requirement received",
  "requirement": "Build an AI meeting transcriber",
  "status": "processing",
  "prd": {...},
  "stories": [...],
  "backlog": [...]
}
```

## Development

```bash
npm install
npm run dev
```

## Testing

```bash
npm test
```
