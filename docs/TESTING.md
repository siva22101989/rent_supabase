# 🧪 Testing Guide

This project uses **Vitest** for unit and integration testing.

## Running Tests

```bash
# Run all unit tests
npm test

# Run tests with coverage report
npm run test:coverage

# Watch mode (default for development)
npx vitest
```

## Writing Tests

### 1. Unit Tests (`src/lib/*.test.ts`)

Test individual functions and utilities in isolation.

```typescript
import { isDefined } from "@/types/utils";
import { describe, it, expect } from "vitest";

describe("isDefined", () => {
  it("should return true for defined values", () => {
    expect(isDefined("hello")).toBe(true);
  });
});
```

### 2. Component Tests (`src/components/*.test.tsx`)

Use React Testing Library to test component rendering and interaction.

```typescript
import { render, screen } from '@/test/utils';
import { Button } from './button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Keep tests simple:** Test one thing per test case.
2. **Use guards:** Use utility type guards (`isApiSuccess`, `isDefined`) to verify data shapes.
3. **Mock external dependencies:** Use `vi.mock()` for API calls and database interactions.
4. **Test edge cases:** Verify null, undefined, and error states.

## Test Structure

- `src/test/` - Test configuration and setup
- `src/lib/*.test.ts` - Unit tests for utilities
- `src/components/*.test.tsx` - Component tests
- `tests/` - Playwright E2E tests (run separately)
