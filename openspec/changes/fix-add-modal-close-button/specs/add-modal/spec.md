## MODIFIED Requirements
### Requirement: Add Modal Close Button
The close button MUST be clearly visible at all viewport sizes and MUST meet minimum 44x44px tap target.

#### Scenario: Close button visible on desktop
- **WHEN** the Add Modal is open on a desktop viewport (>768px)
- **THEN** the X button is clearly visible in the top-right corner inside the modal

#### Scenario: Close button visible on mobile
- **WHEN** the Add Modal is open on a mobile viewport (320px-768px)
- **THEN** the X button is fully visible, not clipped, and has a 44x44px tap target

#### Scenario: Close button accessible
- **WHEN** a user clicks/taps the X button
- **THEN** the modal closes immediately
