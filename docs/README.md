# AppsForHire (V0 - Local Testing MVP)

AppsForHire is an API-first platform that provides AI Agents (e.g., GPTs, CrewAI, LangGraph) with access to a catalog of ready-to-use tools via REST endpoints. V0 is focused on local testing and validation using Supabase, ngrok, and TypeScript/Next.js.

---

## 🚀 Purpose & Vision
- Validate agent compatibility with APIs
- Confirm tool utility and endpoint design
- Ensure Supabase Auth and key generation work
- Test API logging, rate limiting, and auth

---

## 🧩 Core Features (V0)
- Tool Endpoints: `/api/v1/clean-json`, `/api/v1/check-csv`, `/api/v1/summarize`
- Supabase Auth: Email/password login + API key generation
- Middleware: Key-based access with basic rate limiting
- OpenAPI Docs: Auto-generated from tRPC + Zod
- Tool Discovery: `/api/v1/tools` returns tool metadata
- Local Logging: Tracks tool usage via Supabase
- Agent Testing: Expose locally using `ngrok`

---

## 🧪 Stack
- **Frontend/Backend**: Next.js 15 + TypeScript + Tailwind
- **API Layer**: tRPC + OpenAPI
- **Database**: Supabase (Postgres)
- **ORM**: Prisma
- **Validation**: Zod
- **Hosting**: Localhost (via `ngrok`)
- **Payment (Mock)**: Stripe test mode
- **Auth**: Supabase Auth
- **Monitoring**: Optional PostHog

---

## 🛠 Deployment
Use `ngrok http 3000` to expose your localhost and test endpoints with Custom GPTs or Postman.

---

## ✅ Success Criteria
- GPT agents call tools successfully
- Invalid keys are rejected, valid ones logged
- Tool output is accurate
- Logs and API activity stored in Supabase

---

## 🔒 Auth & Keys
- API keys auto-generated on user signup
- Key middleware enforces auth and logs usage
- See `api_keys` and `tool_logs` tables for implementation

---

## 📂 Related Docs
- [`SCHEMA.md`](./SCHEMA.md)
- [`PRISMA.md`](./PRISMA.md)
- [`THEME.md`](./THEME.md)
- [`SECURITY.md`](./SECURITY.md)

---

## 📌 License
Control over Distribution