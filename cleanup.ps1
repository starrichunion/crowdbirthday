# CrowdBirthday v3 - Cleanup deprecated files
# Run: powershell -ExecutionPolicy Bypass -File cleanup.ps1

Write-Host "🧹 Cleaning up deprecated files..." -ForegroundColor Cyan

$files = @(
    "lib/premium.ts",
    "lib/purchase.ts",
    "lib/referral.ts",
    "components/CampaignCard.tsx",
    "components/CampaignStatusBadge.tsx",
    "components/ItemCard.tsx",
    "components/PremiumOptions.tsx",
    "components/OGPPreview.tsx",
    "components/ShareButton.tsx",
    "app/explore/page.tsx",
    "app/delivery/[token]/page.tsx",
    "app/dashboard/analytics/page.tsx",
    "app/u/[slug]/page.tsx",
    "app/u/[slug]/edit/page.tsx",
    "app/campaign/[id]/messages/page.tsx",
    "app/api/delivery/[token]/route.ts",
    "app/api/referral/route.ts",
    "app/api/cron/track-deliveries/route.ts"
)

$deleted = 0
foreach ($f in $files) {
    $path = Join-Path $PSScriptRoot $f
    if (Test-Path $path) {
        Remove-Item $path -Force
        Write-Host "  ✓ Deleted: $f" -ForegroundColor Green
        $deleted++
    } else {
        Write-Host "  - Already gone: $f" -ForegroundColor DarkGray
    }
}

# Remove empty directories
$dirs = @(
    "app/explore",
    "app/delivery/[token]",
    "app/delivery",
    "app/dashboard/analytics",
    "app/u/[slug]/edit",
    "app/u/[slug]",
    "app/u",
    "app/campaign/[id]/messages",
    "app/api/delivery/[token]",
    "app/api/delivery",
    "app/api/referral",
    "app/api/cron/track-deliveries"
)

foreach ($d in $dirs) {
    $path = Join-Path $PSScriptRoot $d
    if ((Test-Path $path) -and ((Get-ChildItem $path -Recurse -File).Count -eq 0)) {
        Remove-Item $path -Recurse -Force
        Write-Host "  ✓ Removed empty dir: $d" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Cleanup complete! $deleted files deleted." -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. npm install"
Write-Host "  2. npm run dev"
Write-Host "  3. Open http://localhost:3000"
