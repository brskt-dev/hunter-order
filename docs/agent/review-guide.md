# Agent review guide

The reviewer must assume the implementation may be wrong even when tests pass.

## Review order

1. Compare the task with the actual behavior
2. Check for unauthorized product decisions
3. Trace authority boundaries from client intent to server result
4. Inspect persistence and concurrency risks
5. Check failure and reconnect paths
6. Evaluate test quality, not only test count
7. Look for unnecessary abstractions and dependencies
8. Confirm documentation matches the code

## Reviewer output

Classify findings as:

- `BLOCKER`: correctness, security, data loss or unauthorized product decision
- `MAJOR`: likely defect, architectural violation or missing critical test
- `MINOR`: maintainability or clarity issue
- `NOTE`: non-blocking observation

The reviewer should not rewrite the implementation during the first pass.
