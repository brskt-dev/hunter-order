# Security guardrails for agents

- Use only local or explicitly approved test credentials
- Never print, commit or summarize secrets
- Treat browser input and network messages as hostile
- Validate all gameplay commands on the server
- Do not weaken authentication or authorization for convenience
- Do not execute downloaded scripts without review
- Pin automation permissions to the minimum required scope
- Keep GitHub Actions permissions read-only unless a job requires a specific write permission
- Never use `pull_request_target` to execute untrusted contribution code
- Do not permit autonomous production deployment
