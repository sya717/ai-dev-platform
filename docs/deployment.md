# デプロイメントガイド

## Railway セットアップ

### 1. Railway アカウント作成

https://railway.app にアクセス

### 2. GitHub連携

- Railway ダッシュボード → "New Project" → "Deploy from GitHub"
- このリポジトリを選択
- デプロイ設定を自動検出

### 3. 環境変数設定

```bash
DATABASE_URL=postgresql://...
API_KEY=...
NODE_ENV=production
```

### 4. デプロイ

```bash
# ローカルから
npm install -g @railway/cli
railway login
railway up
```

## ローカル開発

```bash
docker-compose up -d
npm install --workspaces
npm run dev
```

## トラブルシューティング

### ビルド失敗時

```bash
railway logs  # ログ確認
railway status  # ステータス確認
```
