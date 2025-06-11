# API Guidelines — AppsForHire

These guidelines ensure that all AppsForHire endpoints are secure, predictable, and usable by both humans and AI agents (e.g., GPT, CrewAI, LangGraph).

---

## 🔁 Versioning

- All routes follow `/api/v{version}/{tool-name}`
- Current version: `v1`
- Future: Avoid breaking changes by incrementing the version (e.g., `/api/v2/clean-json`)

---

## 📥 Request Format

- **Method**: POST (default)
- **Content-Type**: `application/json`
- **Required Header**:

Authorization: Bearer {API_KEY}

---

## 🧾 Example Request

POST /api/v1/clean-json
Authorization: Bearer sk_live_abc123
Content-Type: application/json

{
"input": "{ malformed: 'json', missingComma: true }"
}


---

## 📤 Response Format

Always return:
```json
{
  "status": "success",
  "data": { /* tool-specific result */ },
  "meta": {
    "tool": "clean-json",
    "version": "v1",
    "execution_time_ms": 73
  }
}

On error:

{
  "status": "error",
  "error": "Invalid JSON format",
  "code": 400
}

Authentication & Keys
API key is required for all endpoints

Invalid/missing keys return 401 Unauthorized

Keys are checked against rate limits and activity status

All requests are logged (tool_logs table)

Rate Limits
Default: 100 req/min, with a 10 req burst

Use headers to expose remaining quota (future enhancement):

X-RateLimit-Limit: 100
X-RateLimit-Remaining: 83
X-RateLimit-Reset: 1697100189


Tool Endpoint Design
Principle	Rule
Consistent	All tools accept input key in JSON
Fail-safe	Return helpful 400 errors if input is malformed
Agent-Usable	Include sample input/output in OpenAPI
Versioned	Keep older versions alive unless deprecated

Tool Discovery
Agents and users can query:
GET /api/v1/tools

Returns:

[
  {
    "name": "clean-json",
    "description": "Fixes broken or malformed JSON strings.",
    "version": "v1",
    "endpoint": "/api/v1/clean-json"
  },
  ...
]

Tool Criteria
All tools must:

Perform a clear, single function

Accept clean JSON input

Return structured, predictable output

Be usable by a stateless HTTP client (GPT, curl, etc.)

Be documented in /api/v1/tools metadata

Future Guidelines
OpenAPI schema for each tool

/api/v1/meta/{tool} endpoint for detail schema

Tool tagging (category, input_type, etc.)

AI compatibility rating (planned)

Maintain API consistency. Think: Stripe-level polish, LangChain-ready design.


---

Let me know if you want this broken into auto-loaded routes, a `/meta` endpoint spec, or OpenAPI 3.1 examples. I can also add a contribution format for new tool endpoints.



