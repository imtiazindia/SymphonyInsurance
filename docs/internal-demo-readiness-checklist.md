# Internal Demo Readiness Checklist

Last reviewed: July 10, 2026

This checklist is for development use only. It tracks production-readiness polish for the Symphony Insurance demo experience.

## Application Shell

- [x] Primary navigation routes are available from the left navigation and mobile navigation.
- [x] Application footer displays version, demo dataset status, build date, current role, and demo mode status.
- [x] Global focus indicators are visible for keyboard users.
- [x] Page transitions stay within the 150-250ms productivity range.
- [x] Reduced-motion preferences are respected.

## iBar

- [x] Ctrl/Cmd + K focuses iBar.
- [x] `/` focuses iBar from the application shell.
- [x] Clear query control is available when text is present.
- [x] Suggestions animate in and preserve recent-search behavior.
- [x] iBar completion emits a user-facing notification.

## Keyboard Productivity

- [x] `Esc` closes active shell panels and dialogs.
- [x] `G` then `D` opens Dashboard.
- [x] `G` then `C` opens Clients.
- [x] `G` then `R` opens Renewals.
- [x] `G` then `K` opens Claims.
- [x] `G` then `O` opens Documents.
- [x] `G` then `P` opens Reports.
- [x] `G` then `A` opens Administration.
- [x] `?` opens the shortcut reference dialog.

## Demo Mode

- [x] Demo Mode remains accessible from the top bar.
- [x] Demo Mode status is visible in the footer.
- [ ] Full presenter script reviewed end to end before prospect demo.
- [ ] Overlay readability verified on desktop and mobile viewports before prospect demo.

## Quality Review

- [x] Build command completes successfully.
- [ ] Browser console reviewed across priority routes before release.
- [ ] No horizontal scrolling on desktop, tablet, and phone viewports.
- [ ] No placeholder lorem ipsum text visible.
- [ ] Cross-workspace terminology reviewed for consistency.
- [ ] Accessibility scan reviewed for contrast, ARIA labels, headings, and dialogs.
- [ ] Netlify deployment verified after push.
