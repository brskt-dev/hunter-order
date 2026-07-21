#!/usr/bin/env pwsh
# Run the Hunter Order server (Development) from the repository root.
$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $root

dotnet run --project server/src/HunterOrder.Bootstrap @args
