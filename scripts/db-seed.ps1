param()
$ErrorActionPreference = "Stop"
$backend = Join-Path $PSScriptRoot "..\backend"
Push-Location $backend
try {
  pnpm prisma:seed
} finally {
  Pop-Location
}
