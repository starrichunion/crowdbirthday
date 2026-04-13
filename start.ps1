# CrowdBirthday - ワンクリック起動スクリプト
# 使い方: PowerShellで右クリック→「PowerShellで実行」
# または: powershell -ExecutionPolicy Bypass -File start.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "`n🎂 CrowdBirthday 起動準備中...`n" -ForegroundColor Cyan

# 1. Node.js チェック
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js が見つかりません。https://nodejs.org からインストールしてください" -ForegroundColor Red
    Read-Host "Enterで終了"
    exit 1
}

# 2. 廃止ファイル削除
Write-Host "`n🧹 廃止ファイルをクリーンアップ中..." -ForegroundColor Yellow
$deprecated = @(
    "lib/premium.ts", "lib/purchase.ts", "lib/referral.ts",
    "components/CampaignCard.tsx", "components/CampaignStatusBadge.tsx",
    "components/ItemCard.tsx", "components/PremiumOptions.tsx",
    "components/OGPPreview.tsx", "components/ShareButton.tsx",
    "app/explore", "app/delivery", "app/u",
    "app/dashboard/analytics", "app/campaign/[id]/messages",
    "app/api/delivery", "app/api/referral", "app/api/cron/track-deliveries"
)
$count = 0
foreach ($f in $deprecated) {
    $path = Join-Path $PSScriptRoot $f
    if (Test-Path $path) {
        Remove-Item $path -Recurse -Force
        $count++
    }
}
Write-Host "  $count 個の廃止ファイルを削除" -ForegroundColor DarkGray

# 3. npm install
if (-not (Test-Path "node_modules/.package-lock.json")) {
    Write-Host "`n📦 依存パッケージをインストール中（初回は2-3分かかります）..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm install に失敗しました" -ForegroundColor Red
        Read-Host "Enterで終了"
        exit 1
    }
} else {
    Write-Host "`n✅ 依存パッケージはインストール済み" -ForegroundColor Green
}

# 4. .env.local チェック
if (-not (Test-Path ".env.local")) {
    Write-Host "`n⚠️  .env.local が見つかりません。.env.local.example をコピーして設定してください" -ForegroundColor Red
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "  .env.local.example → .env.local にコピーしました。API キーを設定してください。" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env.local 設定済み" -ForegroundColor Green
}

# 5. 開発サーバー起動
Write-Host "`n🚀 開発サーバーを起動します..." -ForegroundColor Cyan
Write-Host "   http://localhost:3000 でアクセスできます" -ForegroundColor White
Write-Host "   停止するには Ctrl+C を押してください`n" -ForegroundColor DarkGray

npm run dev
