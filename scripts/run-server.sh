#!/usr/bin/env bash
# Run the Hunter Order server (Development) from the repository root.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

exec dotnet run --project server/src/HunterOrder.Bootstrap "$@"
