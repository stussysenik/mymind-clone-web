# Change: Add Share Flow E2E Tests

## Why
To verify the iOS Share Sheet integration vision is complete, we need comprehensive E2E tests that:
1. Test the web-based share API flow
2. Verify performance budget (<200ms API response)
3. Document manual iOS testing steps
4. Create a test harness for simulating share extension behavior

## What Changes
- Create share-flow.spec.ts with comprehensive API tests
- Add performance timing assertions
- Document manual iOS simulator testing procedure
- Verify all TypeScript strict mode compliance

## Impact
- Affected specs: e2e-tests (new capability)
- Affected code:
  - `apps/web/tests/share-flow.spec.ts` - Enhanced E2E tests
- No breaking changes
