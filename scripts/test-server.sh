#!/usr/bin/env bash
# Build and test the Hunter Order server solution.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

dotnet test server/HunterOrder.slnx --configuration Release "$@"
