# AI Workflow ガイド

## 全体フロー

### 1. 要件入力

```
ユーザーが要件を記述
↓
PM Agent に渡す
```

### 2. PM Agent の動作

```markdown
# 入力例
"我々の営業チームは、顧客との議事録を毎回手書きしていて、
そのあとテキスト化に1時間かかってしまう。これを自動化したい。"

# 出力
- PRD ドキュメント
- User Stories (10-15個)
- 優先度付けリスト
```

### 3. Architect Agent の動作

```markdown
# 入力
PM Agent の出力 (PRD + Stories)

# 出力
- アーキテクチャ図
- DB スキーマ
- API 仕様 (OpenAPI)
- 実装上の注意点
```

### 4. Implementation AI の動作

```markdown
# 入力
Architect の設計書

# 出力
- ソースコード
- テンプレートコード
- GitHub PR
```

### 5. レビュープロセス

```
Implementation AI が PR 作成
↓
GitHub Actions が自動テスト実行
↓
Reviewer AI が別プロセスで確認
↓
PR マージ or コメント返却
```

## プロンプト活用方法

### 手動実行例

```bash
# Claude with PM prompt
cat prompts/pm.md | claude "あなたの要件" 

# GPT-4 with Architect prompt
cat prompts/architect.md | gpt-4 "PRDの内容"
```

### 自動化パイプライン

GitHub Issues で要件を入力
↓
自動で AI agents を呼び出し
↓
PR を自動生成
