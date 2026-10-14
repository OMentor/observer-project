param([string]$Service = "")
$compose = Join-Path $PSScriptRoot "..\infra\docker-compose.yml"
if ([string]::IsNullOrWhiteSpace($Service)) {
  docker compose -f $compose logs -f --tail 100
} else {
  docker compose -f $compose logs -f --tail 100 $Service
}
