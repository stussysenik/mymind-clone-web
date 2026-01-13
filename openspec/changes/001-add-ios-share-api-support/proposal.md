# Change: Add iOS Share Extension Support to /api/save

## Why
The iOS Share Sheet vision requires the /api/save endpoint to accept requests from the iOS Share Extension, which uses a different authentication mechanism (auth_token in request body instead of cookie-based Supabase auth) and needs to identify the request source for analytics/debugging.

## What Changes
- Add `source` field to SaveCardRequest to identify request origin ("ios-share-extension" | "web-share-api" | "manual" | "chrome-extension")
- Add `auth_token` field to SaveCardRequest for iOS Share Extension authentication
- Implement token validation for Share Extension requests (validate against Supabase)
- Ensure response remains <200ms (no additional blocking operations)

## Impact
- Affected specs: api-save (new capability)
- Affected code:
  - `apps/web/app/api/save/route.ts` - Add source/token handling
  - `apps/web/lib/types.ts` - Extend SaveCardRequest type
- No breaking changes to existing clients (new fields are optional)
