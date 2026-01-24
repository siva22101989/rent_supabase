# 🔐 Type Safety Guide

GrainFlow uses **TypeScript** with strict mode enabled to ensure code reliability and developer productivity.

## 🛡️ Core Principles

1. **No Implicit Ambiguity**: Avoid `any`. Use `unknown` if the type acts as a container.
2. **Strict Null Checks**: Always handle `null` and `undefined` explicitly.
3. **Runtime Validation**: Use Zod for all external data (API responses, form inputs).

## 🛠️ Utility Types

We provide a robust set of utility types in `src/types/utils.ts`.

### 1. Branded Types (IDs)

Prevent mixing up different ID types.

```typescript
import { UUID, RecordId } from "@/types/utils";

const userId: UUID = "..." as UUID; // Correct
const orderId: RecordId = "..." as RecordId; // Correct
```

### 2. API Responses

Handle success and error states consistently.

```typescript
import { ApiResponse, isApiSuccess } from '@/types/utils';

async function getData(): Promise<ApiResponse<Data>> { ... }

const result = await getData();
if (isApiSuccess(result)) {
  console.log(result.data); // Type safe access
} else {
  console.error(result.error);
}
```

### 3. Type Guards

Runtime checks that narrow types.

- `isDefined(val)`: Checks for non-null/undefined
- `isApiSuccess(res)`: Checks for successful API response
- `isApiError(res)`: Checks for failed API response

## ✅ Best Practices

- **Use JSDoc**: Document complex functions key params and return types.
- **Inferred Types**: Let TypeScript infer return types where possible, but explicit is better for public APIs.
- **Zod Schemas**: Define Zod schemas for all database tables and form inputs.

## 🚫 Common Pitfalls

- **Using `as any`**: defeats the purpose of TypeScript. Use type guards instead.
- **Ignoring null**: Use optional chaining `?.` or `isDefined()` checks.
- **Implicit `any`**: Ensure function parameters always have explicit types.
