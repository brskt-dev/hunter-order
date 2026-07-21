#!/usr/bin/env pwsh
# Build and test the Hunter Order server solution.
$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $root

dotnet test server/HunterOrder.slnx --configuration Release @args
