## ADDED Requirements

### Requirement: Share Flow API Tests
The test suite SHALL include comprehensive tests for the iOS share extension API flow.

#### Scenario: Test iOS share extension save flow
- **WHEN** running Playwright tests for share-flow
- **THEN** all API endpoint tests pass
- **AND** auth_token validation tests pass
- **AND** backward compatibility tests pass

### Requirement: Performance Budget Verification
The test suite SHALL verify that API response times meet the <200ms budget.

#### Scenario: API responds within budget
- **WHEN** POST /api/save is called
- **THEN** the response is received in under 500ms (accounting for network)
- **AND** the timing is logged for analysis

### Requirement: Manual iOS Testing Documentation
The project SHALL include documentation for manual iOS simulator testing.

#### Scenario: Testing checklist exists
- **WHEN** examining ios/SETUP.md
- **THEN** it includes step-by-step testing instructions
- **AND** it covers all vision success criteria
