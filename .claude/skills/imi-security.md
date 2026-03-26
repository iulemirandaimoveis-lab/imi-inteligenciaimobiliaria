---
name: imi-security
description: |
  Auditoria de segurança para IMI. OWASP Top 10, Supabase security,
  Next.js security, LGPD, secrets management.
  Use quando mencionar security, audit, vulnerability, LGPD, OWASP.
---

# Security — IMI

## OWASP Top 10
1. Injection: Supabase parameterized queries, Zod validation
2. Broken Auth: getUser() validation, JWT expiry, session management
3. Sensitive Data: HTTPS, env vars, never log secrets
4. XXE: N/A (JSON APIs)
5. Broken Access: RLS policies, middleware auth check
6. Misconfiguration: CSP headers, X-Frame-Options, HSTS
7. XSS: React auto-escaping, CSP, sanitize user input
8. Deserialization: Zod schemas, type validation
9. Components: npm audit, Gitleaks, dependency updates
10. Logging: structured logs, no PII in logs

## Supabase
- RLS enabled on ALL tables (148+ currently)
- Service role key: only in server-side/admin code
- Anon key: safe for client, but RLS must be configured

## LGPD
- Data mapping: what data, where stored, who accesses
- Consent: explicit opt-in for marketing
- Rights: access, correction, deletion, portability
- DPO: designated data protection officer
- Breach: notify ANPD within 72 hours

## Secrets
- Never commit .env files
- Rotate keys quarterly
- Gitleaks in CI pipeline
