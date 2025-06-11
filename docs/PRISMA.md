// schema.prisma - MVP essentials
model User {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email            String   @unique
  createdAt        DateTime @default(now()) @map("created_at")
  subscriptionPlan String   @default("free") @map("subscription_plan")
  role             String   @default("user")
  
  apiKeys        ApiKey[]
  toolLogs       ToolLog[]
  usageSummaries UsageSummary[]
  
  @@map("users")
}

model ApiKey {
  id                 String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId             String    @map("user_id") @db.Uuid
  key                String    @unique
  createdAt          DateTime  @default(now()) @map("created_at")
  expiresAt          DateTime? @map("expires_at")
  isActive           Boolean   @default(true) @map("is_active")
  rateLimitPerMinute Int       @default(100) @map("rate_limit_per_minute")
  lastRequestAt      DateTime? @map("last_request_at")
  
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  toolLogs ToolLog[]
  
  @@map("api_keys")
}

model ToolLog {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId          String    @map("user_id") @db.Uuid
  apiKeyId        String    @map("api_key_id") @db.Uuid
  toolName        String    @map("tool_name")
  toolVersion     String    @default("v1") @map("tool_version") // ADD THIS LINE
  inputPayload    Json?     @map("input_payload")
  outputPayload   Json?     @map("output_payload")
  createdAt       DateTime  @default(now()) @map("created_at")
  status          String    @default("success")
  executionTimeMs Int?      @map("execution_time_ms")
  tokensUsed      Int?      @map("tokens_used")
  errorMessage    String?   @map("error_message")
  
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  apiKey ApiKey @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)
  
  @@map("tool_logs")
}

model UsageSummary {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  monthYear   String   @map("month_year")
  totalCalls  Int      @default(0) @map("total_calls")
  totalTokens Int      @default(0) @map("total_tokens")
  createdAt   DateTime @default(now()) @map("created_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, monthYear])
  @@map("usage_summaries")
}

// ADD THE TOOL MODEL HERE:
model Tool {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name         String   @map("name")
  description  String?
  version      String   @default("v1")
  isActive     Boolean  @default(true) @map("is_active")
  endpointPath String   @map("endpoint_path")
  createdAt    DateTime @default(now()) @map("created_at")
  
  @@unique([name, version])
  @@map("tools")
}
Skip for Now - Use Raw SQL When Needed
typescript
// For super_admins - rare operations, use raw queries
const checkSuperAdmin = async (userId: string) => {
  const result = await db.$queryRaw`
    SELECT EXISTS(SELECT 1 FROM super_admins WHERE user_id = ${userId})
  `;
  return result[0].exists;
};
Benefits of Your Approach
Faster Development:
Type-safe queries for 90% of your app logic
Auto-complete and validation where it matters
Skip overhead for edge cases
Easier Testing:
Mock Prisma client for core business logic
Raw SQL for admin/internal operations doesn't need mocking
Cleaner Codebase:
Prisma handles complex relations (user → api_keys → tool_logs)
Simple SQL for one-off admin queries
Future-Proof:
Add SuperAdmin model later when you build admin UI
Migrate raw queries to Prisma incrementally
MVP Development Flow
typescript
// Your main API logic - clean and type-safe
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { 
    apiKeys: { where: { isActive: true } },
    usageSummaries: { where: { monthYear: currentMonth } }
  }
});

// Admin stuff - raw SQL when needed
const promoteToSuperAdmin = await db.$executeRaw`
  INSERT INTO super_admins (user_id, added_by, notes) 
  VALUES (${userId}, ${adminId}, 'Founder')
`;
This approach will save you hours of setup time while keeping your core app logic bulletproof. Smart prioritization!
Yes — Prisma is separate from your raw SQL schema, but they are tightly connected.
🔍 Here's how they relate:
Concept
Prisma Schema
SQL Schema (Postgres)
Definition File
schema.prisma (in your codebase)
SQL CREATE TABLE statements
Purpose
Tells Prisma how to talk to the database
Actually creates the database structure
Who Uses It
TypeScript/Node.js (via Prisma Client)
PostgreSQL database engine
Generated Code
Prisma generates a TypeScript client
Postgres just uses raw tables & queries
Sync Tool
prisma migrate
Executes SQL to match your Prisma model


✅ Summary:
Prisma schema (schema.prisma) is written in a declarative format.


It generates a database schema (via migrations), or maps to an existing one (via introspection).


It's the developer-friendly layer for talking to your SQL schema in TypeScript.



🔁 If You Change One:
If you change the SQL schema directly, you need to re-run prisma introspect to sync your Prisma schema.


If you change the Prisma schema, you need to run prisma migrate dev to update the actual Postgres tables.
