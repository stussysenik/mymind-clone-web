---
description: Run Playwright specs for MyMind Clone
---

# Playwright Spec-Driven Testing

This workflow validates frontend/backend functionality using spec-driven development.

## Test Account Setup (Required)

Add test credentials to `.env.local`:
```bash
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=your-test-password
```

Create a test account in Supabase Dashboard → Authentication → Users.

// turbo
```bash
cd /home/senik/Desktop/mymind-clone/apps/web && bun x playwright test --reporter=list
```

## Running Specific Specs

```bash
# Navigation tests
cd /home/senik/Desktop/mymind-clone/apps/web && bun x playwright test -g "Navigation"

# Filter tests  
cd /home/senik/Desktop/mymind-clone/apps/web && bun x playwright test -g "Category Filters"

# API tests
cd /home/senik/Desktop/mymind-clone/apps/web && bun x playwright test -g "API"

# Modal tests
cd /home/senik/Desktop/mymind-clone/apps/web && bun x playwright test -g "Modal"
```

## With JSON Output (for CLI consumption)

// turbo
```bash
cd /home/senik/Desktop/mymind-clone/apps/web && bun x playwright test --reporter=json 2>/dev/null | jq '.suites[].specs[] | {title: .title, status: .tests[0].results[0].status}'
```

## Debug Mode (headed browser)

```bash
cd /home/senik/Desktop/mymind-clone/apps/web && bun x playwright test --headed --debug
```

## View HTML Report

```bash
cd /home/senik/Desktop/mymind-clone/apps/web && bun x playwright show-report
```

## Test Files

| File | Coverage |
|------|----------|
| `mymind.spec.ts` | Card grid, Add modal, API endpoints |
| `navigation.spec.ts` | Header, tabs, routing |
| `filters.spec.ts` | TagScroller filters, URL state |
| `card-modal.spec.ts` | Card detail modal |
| `interactions.spec.ts` | Loading, hover, responsive |
