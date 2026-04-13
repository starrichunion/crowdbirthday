Set-Location $PSScriptRoot
Write-Host "=== CrowdBirthday Deploy ===" -ForegroundColor Cyan

# Remove lock file if exists
$lockFile = Join-Path $PSScriptRoot ".git\config.lock"
if (Test-Path $lockFile) { Remove-Item $lockFile -Force; Write-Host "Removed config.lock" }

# Cleanup deprecated files
@(
    "lib\premium.ts", "lib\purchase.ts", "lib\referral.ts",
    "components\CampaignCard.tsx", "components\CampaignStatusBadge.tsx",
    "components\ItemCard.tsx", "components\PremiumOptions.tsx",
    "components\OGPPreview.tsx", "components\ShareButton.tsx",
    "app\explore", "app\delivery", "app\u",
    "app\dashboard\analytics", "app\campaign\[id]\messages",
    "app\api\delivery", "app\api\referral", "app\api\cron\track-deliveries",
    "BUILD_LOG.md", "MIGRATION_NOTES.md", "crowdbirthday-preview.html",
    "preview.html", "test.txt", "tsconfig.tsbuildinfo"
) | ForEach-Object {
    $p = Join-Path $PSScriptRoot $_
    if (Test-Path $p) { Remove-Item $p -Recurse -Force; Write-Host "  deleted $_" }
}
Write-Host "Cleanup done" -ForegroundColor Green

# Git operations
Write-Host "Git add and commit..." -ForegroundColor Cyan
git add -A 2>&1
git commit -m "Initial commit: CrowdBirthday v0.1.0" 2>&1

Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push -u origin main --force 2>&1

Write-Host ""
Write-Host "npm install..." -ForegroundColor Cyan
npm install 2>&1

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Green
Write-Host "https://github.com/starrichunion/crowdbirthday"
Read-Host "Enter to close"
