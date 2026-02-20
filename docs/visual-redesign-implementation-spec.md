# HabitFlow Visual Redesign Implementation Spec

## Scope
This spec translates the visual redesign proposal into phased implementation work. The goal is to improve visual hierarchy, brand distinctiveness, and perceived polish without changing core product behavior.

## Progress
- Phase 1: Completed
- Phase 2: Completed
- Phase 3: Completed
- Phase 4: Completed
- Phase 5-6: Pending

## Design Direction
- Direction: Warm editorial plus tactile data
- Tone: Focused, optimistic, and calm
- Visual principles:
  - Stronger hierarchy between page frame, primary content, and secondary content
  - Richer but controlled background atmosphere (no flat canvas)
  - Better typographic personality while preserving readability
  - Reduced hard-coded blue usage in favor of semantic and contextual accents
  - Motion that communicates state change, not decoration

## Non-Goals
- No feature changes to habit scheduling, completion logic, or stats calculations
- No routing, data model, or storage migrations
- No full nav information architecture rework in this phase

## Phase Plan

### Phase 1: Foundations (current execution phase)
1. Introduce updated design tokens in global styles:
   - Base palette
   - Semantic palette
   - Surface/elevation tokens
   - Chart tokens
2. Introduce new typography pairing:
   - Display/headline font
   - Body/interface font
3. Improve global atmospheric background and baseline texture
4. Align shared primitives with new tokens:
   - Button
   - Card
   - Input
   - Badge
   - Progress
   - Dropdown menu
5. Remove hard-coded chart accent dependence where practical in primitives/charts

### Phase 2: Navigation and Frame
1. Sidebar visual branding block and active state refinement
2. Mobile bottom nav active affordance and depth
3. Header treatment pass (title scale, subtitle rhythm, action grouping)

### Phase 3: Today and Habits Experience
1. Today hero progress panel redesign
2. Habit row enrichment (streak/category visual cues)
3. Habits page list/card hybrid treatment with clearer grouping

### Phase 4: Week/Month Data Surfaces
1. Improve legibility of dense grid views
2. Better today/future/scheduled state visibility
3. Increased rhythm and row/column separation

### Phase 5: Stats and Analytics Visual Language
1. Refresh KPI cards and icon hierarchy
2. Unify chart palette and tooltip treatment
3. Heatmap color system aligned with tokenized accent scales

### Phase 6: Polish and QA
1. Contrast and accessibility pass
2. Motion/reduced-motion audit
3. Responsive checks (mobile through desktop)
4. Visual regression pass across light/dark themes

## Technical Strategy
- Use token-first updates in `src/app/globals.css` so component-level changes remain shallow.
- Favor semantic CSS variables over literal hex values in components.
- Keep component APIs stable where possible; adjust styling internals first.
- Maintain compatibility with current Tailwind v4 token bridge (`@theme inline`).

## Acceptance Criteria

### Phase 1 Acceptance Criteria
- New typefaces applied globally with no layout breakage.
- Global background has visible depth in both light and dark modes.
- Shared UI primitives render with updated hierarchy/elevation.
- Core charts/components used on Stats page no longer rely on a single hard-coded blue for all accents.
- Type-check and tests pass; no new lint errors introduced by Phase 1 changes.

### Overall Program Acceptance Criteria
- All primary routes (`/`, `/habits`, `/week`, `/month`, `/stats`, `/settings`) remain fully functional.
- Interaction cues (focus, hover, active, disabled) are visually consistent.
- Visual differentiation between primary and secondary surfaces is obvious.
- No regression in keyboard accessibility or reduced-motion behavior.

## Risks and Mitigations
- Risk: Contrast regressions with richer backgrounds
  - Mitigation: preserve high-contrast text tokens and run accessibility checks during Phase 6
- Risk: Token migration drift (old and new token usage mixed)
  - Mitigation: migrate base primitives early (Phase 1), then route-level cleanup
- Risk: Chart readability with new palette
  - Mitigation: define explicit chart token scale and apply progressively

## Rollout Notes
- Implement each phase in small PR-sized commits.
- Validate UI route-by-route after each phase.
- Keep this document updated as scope shifts.
