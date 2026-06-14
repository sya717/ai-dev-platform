# AI Dev Platform

複数のAIエージェントを統合した開発自動化プラットフォーム。

## アーキテクチャ

```
要件 → PM AI → Architect AI → Implementation AI → Review AI → QA AI → Deploy → 本番
```

## 構成

### AI Agents（prompts/）
- **PM Agent**: 要件分析、ユーザーストーリー作成
- **Architect Agent**: 設計、DB・API設計
- **Reviewer Agent**: コード品質、セキュリティレビュー
- **QA Agent**: テストケース生成、品質検証

### Products（products/）
- **requirement-ai**: AIによる要件整理ツール
- **transcription-ai**: AI議事録生成
- **code-review-ai**: AIコードレビュー

## クイックスタート

### ローカル開発

```bash
# 環境構築
docker-compose up -d

# 依存関係インストール
npm install --workspaces

# テスト実行
npm run test --workspaces
```

### デプロイ

```bash
# Railway CLI インストール
npm install -g @railway/cli

# デプロイ
railway up
```

## ワークフロー

1. 要件を入力 → PM Agent が PRD を生成
2. PRD を受け取る → Architect Agent が設計書を作成
3. 設計書から → Implementation AI が実装
4. 実装完了 → Reviewer AI（別モデル）がレビュー
5. レビュー完了 → QA AI がテスト生成
6. テスト成功 → GitHub Actions で自動デプロイ

## 開発ガイド

詳細は [docs/](./docs/) を参照。

## ライセンス

MIT
