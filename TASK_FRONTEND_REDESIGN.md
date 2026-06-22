# Task: Redesign PHP Web Frontend with Light/Dark Theme Fixes

You are working on an existing PHP, JavaScript, CSS, and HTML web frontend project.

## Main Task

Redesign and improve the frontend UI.

The main issue is light/day mode. Some containers, cards, divs, panels, tables, modals, or sections still appear black, dark, or dark-toned in light mode. Some text remains white or low-contrast, making it hard or impossible to read.

Dark/night mode is mostly acceptable, but both light and dark modes must be clean, readable, modern, and consistent after the redesign.

You may redesign the frontend presentation significantly. It does not need to look exactly like the old design.

## Main Goals

1. Redesign the frontend UI to look modern and professional.
2. Fully support both light/day mode and dark/night mode.
3. Fix all light-mode readability problems.
4. Remove dark/black containers from light mode unless intentionally designed with proper readable contrast.
5. Make text larger, clearer, and easier to read.
6. Preserve all existing backend behavior.
7. Add a Back button in `changepass.php` that returns to `index.php`.
8. Do not change anything unrelated unless required for frontend/theme consistency.

## Critical Backend Protection Rules

Do not change backend behavior.

Do not modify:
- SQL queries
- Database schema
- PHP session logic
- Authentication logic
- Authorization logic
- Role/permission logic
- POST/GET handling
- Form action attributes
- Form method attributes
- Input name attributes
- Hidden input meaning
- API endpoints
- AJAX URLs
- AJAX payload keys
- WebSocket ports
- WebSocket menuID values
- WebSocket JSON keys
- WebSocket payload builders
- Device-control behavior
- Save/update/delete/export/import behavior
- Business logic
- Data calculation logic
- Existing backend-connected IDs unless safe and verified

## Allowed Changes

You may modify:
- CSS
- HTML presentation
- Safe wrapper divs
- Safe CSS classes
- Layout structure
- Typography
- Spacing
- Cards
- Tables
- Forms
- Buttons
- Badges
- Modals
- Sidebar
- Header
- Navigation presentation
- Responsive design
- Accessibility attributes
- Frontend-only JavaScript animation
- Frontend-only JavaScript visual behavior
- Theme visual class toggling

## JavaScript Restriction

JavaScript may be edited only for:
- Animation
- UI transitions
- Theme visual behavior
- Visual class toggling
- Hover/focus/active visual states
- Loading visual states
- Sidebar/menu/modal/dropdown animations
- Frontend-only decoration

Do not modify JavaScript logic related to:
- AJAX requests
- AJAX payloads
- API endpoints
- WebSocket connections
- WebSocket payloads
- WebSocket ports
- WebSocket menuID values
- JSON keys
- Polling logic
- Reconnect logic
- Device-control commands
- Backend-connected data parsing
- Save/update/delete/export/import actions
- Business logic

## Design Direction

Create a modern technical dashboard UI suitable for:
- RF monitoring system
- Embedded device web interface
- Network configuration page
- SNMP page
- Logs page
- Calibration page
- Admin dashboard

The UI should be:
- Modern
- Clean
- Professional
- Technical
- Readable
- Spacious
- Responsive
- Consistent
- Production-ready

## Theme Requirements

Create or improve a centralized theme system, preferably in `rf-console.css`.

Both modes must be complete:
1. Light/day mode
2. Dark/night mode

Light mode must not contain unreadable dark blocks.

Fix:
- Black containers
- Dark cards
- Dark panels
- Dark divs
- White text on light backgrounds
- White text inside light cards
- Low-contrast gray text
- Invisible labels
- Unreadable table headers
- Unreadable inputs
- Unreadable buttons
- Bad modal contrast
- Bad dropdown contrast
- Bad badge/status contrast

Dark mode should remain polished and readable. Do not break the existing dark mode.

## Theme Token Requirements

Avoid random hard-coded colors.

Create or standardize CSS variables for:
- `--rf-bg`
- `--rf-surface`
- `--rf-card`
- `--rf-card-muted`
- `--rf-text`
- `--rf-text-soft`
- `--rf-text-muted`
- `--rf-border`
- `--rf-primary`
- `--rf-secondary`
- `--rf-success`
- `--rf-warning`
- `--rf-danger`
- `--rf-info`
- `--rf-input-bg`
- `--rf-input-text`
- `--rf-input-border`
- `--rf-table-head-bg`
- `--rf-table-row-bg`
- `--rf-table-row-hover`
- `--rf-modal-bg`
- `--rf-dropdown-bg`
- `--rf-focus-ring`
- `--rf-shadow`
- `--rf-chart-primary`
- `--rf-chart-secondary`

Use these variables consistently across the project.

## Special Required Change

In `changepass.php`, add a clear Back button that returns to `index.php`.

Requirements:
- Button label: `Back to Dashboard`
- Target: `index.php`
- Must be visually consistent with the redesigned UI.
- Must not affect password change logic.
- Must not modify form submission behavior.

Recommended:
`<a href="index.php" class="rf-btn rf-btn-secondary">Back to Dashboard</a>`

## Frontend Redesign Scope

Inspect and update relevant frontend pages, including but not limited to:
- `index.php`
- `datalogger.php`
- `network.php`
- `wifi.php`
- `snmp_update.php`
- `role.php`
- `thrulan.php`
- `cal.php`
- `monitor.php`
- `radioctrl.php`
- `chart.php`
- `changepass.php`
- `login.php`
- `update.php`
- shared PHP includes or layout files
- CSS files
- frontend-related JavaScript files

## Hard-Coded Color Cleanup

Search and replace frontend hard-coded colors that bypass the theme system.

Look for:
- Hex colors
- `rgb(...)`
- `rgba(...)`
- Inline `style="color: ..."`
- Inline `style="background: ..."`
- Inline `style="background-color: ..."`
- Inline `style="border-color: ..."`
- JavaScript `style.backgroundColor`
- JavaScript `style.color`
- JavaScript `style.borderColor`
- W3.CSS color classes
- Bootstrap color classes that do not match the theme
- Page-specific CSS palettes that do not follow `rf-console.css`

Replace with:
- CSS variables
- Theme-aware classes
- Shared design system classes

## Implementation Strategy

1. Inspect the project structure.
2. Inspect `rf-console.css` and existing theme logic.
3. Inspect how light/dark mode is toggled.
4. Audit all pages for dark containers in light mode.
5. Audit all pages for unreadable text in light mode.
6. Build or improve the central design system.
7. Apply theme-aware classes to PHP/HTML presentation.
8. Update page-specific CSS to use shared variables.
9. Update JavaScript only for animation, theme visuals, or safe class toggling.
10. Add the Back button in `changepass.php`.
11. Validate that backend behavior is preserved.
12. Create a ZIP archive and patch file.

## Validation Commands

Run validation on modified files.

For PHP:
`php -l filename.php`

For JavaScript:
`node --check filename.js`

For CSS:
Check for missing braces and broken selectors.

## Manual Test Checklist

Test:
- Light mode
- Dark mode
- Dashboard
- Datalogger
- Network
- Wi-Fi
- SNMP
- Role
- True LAN
- Calibration
- Monitor
- Radio control
- Chart
- Login
- Change password
- Update/System pages

In light mode, specifically check:
- No unreadable dark containers
- No black panels with bad contrast
- No white text on light background
- No invisible labels
- No invisible table text
- No unreadable form inputs
- No unreadable modals
- No unreadable dropdowns
- No unreadable status badges

## Backend Preservation Checklist

Confirm:
- Existing forms still submit.
- Existing buttons still work.
- Existing AJAX still works.
- Existing WebSocket still works.
- Existing data still displays.
- Existing role/session behavior is unchanged.
- Existing save/update/delete/export/import behavior is unchanged.
- Password change behavior is unchanged except for the new Back button.

## Deliverables

Create:
1. Updated project ZIP
2. Patch file

Suggested commands:
`zip -r iview_frontend_redesign_light_dark_fixed.zip .`
`git diff > iview_frontend_redesign_light_dark_fixed.patch`

Final response must include:
- Modified files list
- Summary of redesign
- Light mode fixes
- Dark mode confirmation
- `changepass.php` Back button change
- JavaScript changes limited to animation/visual behavior
- Backend behavior preserved
- Validation results
- Remaining risks

Important:
Do not modify backend logic.
Do not modify functionality that was not requested.
Everything not mentioned should remain functionally the same.
