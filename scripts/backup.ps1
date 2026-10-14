param([string]$Name = "")
$ErrorActionPreference = "Stop"
$compose = Join-Path $PSScriptRoot "..\infra\docker-compose.yml"
$dir = Join-Path $PSScriptRoot "backups"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
if ([string]::IsNullOrWhiteSpace($Name)) {
  $Name = "calendar_{0}.sql" -f (Get-Date -Format "yyyyMMdd_HHmmss")
}
$out = Join-Path $dir $Name
$containerPath = "/tmp/$Name"
docker compose -f $compose exec -T postgres pg_dump -U calendar -d calendar -f $containerPath
docker compose -f $compose cp "postgres:$containerPath" $out
docker compose -f $compose exec -T postgres rm -f $containerPath
Write-Host "Backup saved: $out"
