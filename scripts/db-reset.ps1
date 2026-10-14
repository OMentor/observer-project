param()
$ErrorActionPreference = "Stop"
$compose = Join-Path $PSScriptRoot "..\infra\docker-compose.yml"
docker compose -f $compose down -v
docker compose -f $compose up -d postgres redis
Write-Host "DB dropped and recreated. Run migrations: pnpm --dir backend prisma:migrate"
