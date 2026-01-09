---
description: Run Playwright specs for MyMind Clone
---

# Playwright Spec-Driven Testing

This workflow validates frontend/backend functionality using spec-driven development.

## Running All Specs

// turbo
```bash
cd /home/senik/Desktop/mymind-clone/apps/web && npx playwright test --reporter=list
```

## Running Specific Specs

```bash
# Card Grid tests
cd /home/senik/Desktop/mymind-clone/apps/web && npx playwright test -g "Card Grid"

# Add Modal tests  
cd /home/senik/Desktop/mymind-clone/apps/web && npx playwright test -g "Add Modal"

# API tests
cd /home/senik/Desktop/mymind-clone/apps/web && npx playwright test -g "API"
```

## With JSON Output (for CLI consumption)

// turbo
```bash
cd /home/senik/Desktop/mymind-clone/apps/web && npx playwright test --reporter=json 2>/dev/null | jq '.suites[].specs[] | {title: .title, status: .tests[0].results[0].status}'
```

## Debug Mode (headed browser)

```bash
cd /home/senik/Desktop/mymind-clone/apps/web && npx playwright test --headed --debug
```

## View HTML Report

```bash
cd /home/senik/Desktop/mymind-clone/apps/web && npx playwright show-report
```
