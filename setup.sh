#!/bin/bash
# ============================================
# CrowdBirthday セットアップスクリプト
# eGift Model v3
# ============================================

set -e

echo "🎂 CrowdBirthday セットアップ開始..."
echo ""

# 1. Node.js チェック
echo "📦 Node.js バージョン確認..."
node -v || { echo "❌ Node.js がインストールされていません。https://nodejs.org からインストールしてください"; exit 1; }
echo ""

# 2. 廃止ファイルの削除
echo "🧹 廃止ファイルを削除中..."
DEPRECATED_FILES=(
  "lib/purchase.ts"
  "lib/referral.ts"
  "lib/premium.ts"
  "app/api/delivery"
  "app/api/cron/track-deliveries"
  "app/api/referral"
  "app/explore"
  "app/dashboard/analytics"
  "app/delivery"
  "app/u"
  "app/campaign/[id]/messages"
  "components/CampaignCard.tsx"
  "components/CampaignStatusBadge.tsx"
  "components/ItemCard.tsx"
  "components/PremiumOptions.tsx"
  "components/ShareButton.tsx"
  "components/OGPPreview.tsx"
)
for f in "${DEPRECATED_FILES[@]}"; do
  if [ -e "$f" ]; then
    rm -rf "$f"
    echo "  削除: $f"
  fi
done
echo "✅ クリーンアップ完了"
echo ""

# 3. npm install
echo "📦 依存関係をインストール中..."
npm install
echo "✅ 依存関係インストール完了"
echo ""

# 4. .env.local 作成
if [ ! -f .env.local ]; then
  echo "🔧 .env.local を作成中..."
  cp .env.local.example .env.local
  echo ""
  echo "⚠️  .env.local を編集して以下の値を設定してください："
  echo ""
  echo "  1. Supabase (https://supabase.com で無料プロジェクト作成)"
  echo "     - NEXT_PUBLIC_SUPABASE_URL"
  echo "     - NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "     - SUPABASE_SERVICE_ROLE_KEY"
  echo ""
  echo "  2. Stripe (https://dashboard.stripe.com/apikeys)"
  echo "     - STRIPE_SECRET_KEY (sk_test_...)"
  echo "     - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_test_...)"
  echo "     - STRIPE_WEBHOOK_SECRET"
  echo ""
  echo "  3. Resend (https://resend.com)"
  echo "     - RESEND_API_KEY"
  echo ""
  echo "  4. Claude API (https://console.anthropic.com)"
  echo "     - ANTHROPIC_API_KEY"
  echo ""
else
  echo "✅ .env.local は既に存在します"
fi

# 5. Supabase DB セットアップ案内
echo ""
echo "🗄️  データベースセットアップ:"
echo "  Supabase ダッシュボード → SQL Editor で以下を順に実行："
echo "  1. supabase/schema.sql   ← テーブル + RLS + インデックス"
echo "  2. supabase/functions.sql ← DB関数 + トリガー"
echo "  3. supabase/seed.sql     ← テストデータ（任意）"
echo ""

# 6. TypeScript チェック
echo "🔍 TypeScript コンパイルチェック..."
npx tsc --noEmit --skipLibCheck 2>&1 || echo "⚠️  型エラーあり（上のログを確認してください）"
echo ""

# 7. ビルドテスト
echo "🏗️  ビルドテスト..."
npm run build 2>&1 || { echo "❌ ビルド失敗。上のエラーを確認してください"; exit 1; }
echo "✅ ビルド成功"
echo ""

# 8. 完了
echo "🚀 準備ができたら以下で起動："
echo "   npm run dev"
echo ""
echo "   → http://localhost:3000 でアクセス"
echo ""
echo "🎉 セットアップ完了！"
