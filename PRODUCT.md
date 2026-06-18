# Product

## Register

product

## Users

Engineers and operators use this interface to monitor RF power sensor data, review logs and alarms, and manage network and system configuration. They are working in an operational context where clear readings, fast scanning, and confidence in state changes matter more than brand expression.

## Product Purpose

This product provides a browser-based control and monitoring surface for RF power sensor systems. It brings together live power readings, datalogger history, alarms, calibration, network settings, role configuration, Wi-Fi settings, and system actions so technical users can keep equipment observable and configurable from one place.

The primary visual reference for future UI work is `datalogger.php` with `myfunctionDatalogger.js`, especially its event log explorer, filter bar, metric cards, trend charts, table styling, pagination, and status badges.

## Brand Personality

Technical, calm, readable, consistent, and production-ready. The interface should feel like a trusted engineering console: direct, precise, durable, and focused on the task.

## Anti-references

Do not make the UI feel like a marketing page, landing page, decorative dashboard, or consumer app. Avoid ornamental motion, loud gradients, novelty typography, ambiguous controls, and visual changes that make operational state harder to scan.

Do not change backend behavior, SQL queries, database schema, PHP session checks, WebSocket message formats, JavaScript data flow, or existing features. Frontend work should stay scoped to UI/UX, CSS, layout, typography, spacing, tables, filter bars, cards, buttons, status badges, animation, and responsive behavior.

## Design Principles

1. Preserve operational trust: every change should make status, readings, filters, and actions easier to understand without altering system behavior.
2. Optimize for scanning under pressure: tables, badges, metrics, and controls should expose hierarchy and state at a glance.
3. Standardize the component vocabulary: buttons, inputs, cards, tables, pagination, filters, and badges should behave and look consistent across pages.
4. Respect the existing system contract: improve presentation without changing backend flows, session gates, WebSocket payloads, or data ordering.
5. Design for field readability: responsive layouts, legible type, strong contrast, and stable spacing are required, not polish afterthoughts.

## Accessibility & Inclusion

Target WCAG AA contrast for body text and controls. Provide visible keyboard focus states, reduced-motion alternatives, and status indicators that do not rely on color alone. Preserve readable data density across desktop and smaller screens.
