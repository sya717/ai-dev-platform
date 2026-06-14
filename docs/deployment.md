# 🚀 Deployment Guide: AI Meeting Transcription System

## 📋 Overview

このガイドは、AI Meeting Transcription System を Railway にデプロイするための手順です。

**Status:** ✅ Code ready (main branch commit d3ce4ee)  
**Next:** Railway setup & environment variables

---

## 🔐 Step 1: API Keys 取得

### 1.1 Zoom API
```
1. https://developers.zoom.us/ にアクセス
2. "Create App" → "Server-to-Server OAuth"
3. App Name: "Transcription AI"
4. 取得するキー:
   - Client ID → ZOOM_API_KEY
   - Client Secret → ZOOM_API_SECRET
   - Webhook Secret → ZOOM_WEBHOOK_SECRET
```

### 1.2 Claude API (Anthropic)
```
1. https://console.anthropic.com/account/keys
2. "Create Key"
3. CLAUDE_API_KEY に保存
```

### 1.3 OpenAI API (Whisper)
```
1. https://platform.openai.com/api-keys
2. "Create new secret key"
3. OPENAI_API_KEY に保存
```

---

## 🚀 Step 2: Railway デプロイ

### 2.1 Railway Project 作成

**GUI での手順:**
1. https://railway.app にアクセス
2. "New Project" をクリック
3. "Deploy from GitHub repo" を選択
4. GitHub で `sya717/ai-dev-platform` を選択
5. Root directory: `products/transcription-ai` に設定

**CLI での手順:**
```bash
# Railway CLI をインストール
npm install -g @railway/cli

# ログイン
railway login

# デプロイ
cd products/transcription-ai
railway up
```

### 2.2 Services を追加

```bash
# PostgreSQL データベース
railway add --plugin postgres

# Redis キャッシュ
railway add --plugin redis
```

### 2.3 環境変数を設定

Railway Dashboard → Variables タブ:

```env
# Node Environment
NODE_ENV=production
PORT=3002

# API Keys
ZOOM_API_KEY=<your_zoom_key>
ZOOM_API_SECRET=<your_zoom_secret>
ZOOM_WEBHOOK_SECRET=<your_webhook_secret>
CLAUDE_API_KEY=<your_claude_key>
OPENAI_API_KEY=<your_openai_key>

# Database & Cache (auto-generated)
DATABASE_URL=<auto>
REDIS_URL=<auto>

# Server
API_BASE_URL=https://<your-railway-domain>.railway.app

# Optional
AWS_REGION=ap-northeast-1
AWS_S3_BUCKET=transcription-recordings
```

---

## ✅ Step 3: デプロイ検証

### 3.1 Status 確認
```bash
# Dashboard で Status = "Running" か確認
railway logs --tail 50
```

### 3.2 Health Check
```bash
curl https://<your-railway-domain>.railway.app/health

# 期待レスポンス:
# {"status":"ok","timestamp":"2026-06-14T12:00:00.000Z"}
```

### 3.3 ログ確認
```bash
railway logs

# 期待:
# [CONFIG] All required environment variables are set ✅
# ✅ Transcription AI Server running on port 3002
```

---

## 🔗 Step 4: Zoom Webhook 連携

### 4.1 Zoom App 設定
1. https://developers.zoom.us → My Apps
2. アプリを選択 → "Feature" タブ
3. "Event Subscriptions" → Edit
4. "Subscription notification URL":
   ```
   https://<your-railway-domain>.railway.app/api/v1/webhooks/zoom
   ```
5. Verification Token: `ZOOM_WEBHOOK_SECRET` の値を入力
6. Subscribe to Events: `recording.completed` を選択
7. Save

### 4.2 Webhook テスト
```bash
curl -X POST https://<your-railway-domain>.railway.app/api/v1/webhooks/zoom \
  -H "Content-Type: application/json" \
  -d '{
    "event": "recording.completed",
    "payload": {
      "object": {
        "id": "test_meeting",
        "uuid": "test_uuid",
        "recording_files": [{
          "download_url": "https://example.com/test.mp4",
          "file_size": 1024000000
        }]
      }
    }
  }'

# 期待レスポンス (200 OK):
# {
#   "status": "queued",
#   "meeting_id": "test_meeting",
#   "job_id": "job_1234567890"
# }
```

---

## 📊 Step 5: End-to-End テスト

### 5.1 実 Zoom 会議でテスト
1. Zoom 会議を開催
2. 会議を録画
3. 会議終了 → `recording.completed` webhook が自動発火
4. Railway ログで確認:

```
[WEBHOOK] Received recording.completed for meeting: xxx
[QUEUE] Processing job xxx: yyy
[PROCESS] Starting transcription job for meeting: xxx
[DOWNLOAD] ✅ Recording saved to: /tmp/recording_xxx.mp4
[TRANSCRIBE] ✅ Transcription complete (3600s)
[MINUTES] ✅ Minutes generated
[PROCESS] ✅ Transcription completed for meeting: xxx
```

### 5.2 エラー確認
```bash
railway logs --grep "ERROR\|error\|failed"
```

---

## 🎯 チェックリスト

デプロイ完了の確認：

- [ ] ✅ Railway project created
- [ ] ✅ PostgreSQL service running
- [ ] ✅ Redis service running
- [ ] ✅ All environment variables set
- [ ] ✅ Health check: 200 OK
- [ ] ✅ Webhook test: 200 OK + job_id
- [ ] ✅ Logs: No errors
- [ ] ✅ Zoom app configured

---

## 🔧 トラブルシューティング

### "Missing env vars" エラー
```
[CONFIG ERROR] Missing required environment variables: ZOOM_API_KEY, ...
```
**解決:** Railway Dashboard で環境変数を追加 → Deploy 再実行

### Webhook 署名エラー
```
[WEBHOOK] Invalid webhook signature
```
**解決:** ZOOM_WEBHOOK_SECRET が正しいか確認

### Redis 接続エラー
```
[QUEUE] Failed to connect to Redis
```
**解決:** Redis service が Running か確認

### Database 接続エラー
```
Error: connect ECONNREFUSED
```
**解決:** PostgreSQL service が Running か確認

---

## 📈 次のステップ

**Phase 3: 機能追加**
- Database migrations スクリプト
- S3 統合（音声ファイル保存）
- Email/Slack 通知
- Monitoring & alerting
- Rate limiting

**Phase 4: 本番化**
- Load testing
- Security audit
- Performance optimization
- Backup & disaster recovery

---

## 📚 参考リンク

- [Railway Docs](https://docs.railway.app)
- [Express.js Guide](https://expressjs.com)
- [Bull Queue Docs](https://github.com/OptimalBits/bull)
- [Zoom API Docs](https://developers.zoom.us/docs)
- [Claude API Docs](https://docs.anthropic.com)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)

---

**Last Updated:** 2026-06-14  
**Status:** ✅ Ready for deployment

