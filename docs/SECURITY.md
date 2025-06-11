# Security Considerations — AppsForHire V0

## 🔒 Authentication
- Supabase Auth with email/password (option for magic link)
- API key generation tied to user account

## 🔑 API Keys
- Unique UUIDv4 keys stored in Supabase `api_keys`
- Rate limits:
  - `rate_limit_per_minute`: 100 default
  - `burst_limit`: 10 requests
  - `window_seconds`: 60

## 🚫 Unauthorized Access
- Middleware blocks:
  - Missing/invalid keys
  - Expired or inactive keys
- Role-based logic: All users are `user` by default; admin features disabled in V0

## 🛡 Observability
- `tool_logs` stores:
  - API key used
  - Tool version and name
  - Request input/output
  - Execution time, token count
  - Status and errors

## 🧪 V0 Limitations
- No production secrets stored
- No RBAC (role-based access control)
- No TLS — local testing only
- No formal auditing or alerting

> V1 will include full auth guards, admin controls, and encryption at rest for sensitive keys.