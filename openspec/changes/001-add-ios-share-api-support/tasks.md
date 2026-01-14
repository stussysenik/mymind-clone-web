# Tasks: Add iOS Share Extension Support to /api/save

## 1. Type Definitions
- [x] 1.1 Add `source` field to SaveCardRequest type in types.ts
- [x] 1.2 Add `auth_token` field to SaveCardRequest type in types.ts
- [x] 1.3 Define SaveSource type union

## 2. API Endpoint Enhancement
- [x] 2.1 Parse source and auth_token from request body
- [x] 2.2 Implement auth_token validation for share extension requests
- [x] 2.3 Use token-based user lookup when source is "ios-share-extension"
- [x] 2.4 Maintain backward compatibility (existing auth flow still works)

## 3. Testing
- [x] 3.1 Create Playwright test for /api/save with source parameter
- [x] 3.2 Create test for auth_token validation flow
- [x] 3.3 Verify <200ms response time in tests

## 4. Validation
- [x] 4.1 Run existing tests to ensure no regressions
- [x] 4.2 Verify TypeScript strict mode passes
