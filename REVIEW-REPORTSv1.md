# Prep Thy Meal Unified Improvement Plan v1

## Summary
- Primary objective: reduce tab-switch latency and remove runtime instability while preserving current UX direction.
- Baseline (from current telemetry and report): tab switch around `~600ms`, with Planner spikes significantly higher.
- Success thresholds:
1. Tab switch latency: p75 `<200ms`, p95 `<350ms` on production build.
2. Initial JS payload: reduce main entry chunk by `>=40%` (target main entry `<700KB` raw).
3. Zero dev-console warnings for:
   - MUI Grid migration props/imports
   - nested button DOM structure
   - Tooltip disabled-child usage
   - missing React keys.

## Scope
- In scope: performance, runtime warnings, storage consistency, guest save UX, diagnostics.
- Out of scope in this pass: full breakup of all large components and long-horizon roadmap features.

## Workstream 1: P0 Runtime Stability (First)
- Goal: eliminate warnings/errors that can cause behavioral issues and noisy profiling.
- Tasks:
1. Replace any `@mui/material/Grid2` or `@mui/material/Unstable_Grid2` imports with supported MUI v7 `Grid`.
2. Remove legacy Grid props (`item`, `xs`, `sm`, `md`, `lg`) and use `size={{ ... }}` consistently.
3. Fix nested button issue in planner accordion summary by removing button-in-button composition in `src/features/meal-planner/MealPrepCalculator.jsx`.
4. Wrap disabled tooltip targets with `span` where required.
5. Ensure all mapped rows/items in `IngredientManager` use stable unique keys.
- Acceptance:
1. `npm run dev` starts without Vite import-analysis errors.
2. Interactions across Planner/Calories/Ingredients show zero matching console warnings.

## Workstream 2: P1 Tab Latency + Bundle Size
- Goal: make tab switching feel fast and reduce initial load.
- Tasks:
1. Refactor `src/shared/components/layout/MealPrep.jsx` to mount only active tab.
2. Add `React.lazy` + `Suspense` for non-default tabs (`Calorie`, `Guide`, `Ingredients`, `Account`).
3. Keep Planner eager-loaded for first paint.
4. Add lightweight prefetch on tab hover/focus.
5. Convert OCR to dynamic import (`tesseract.js`) on first OCR action in `src/shared/services/ocrService.js`.
6. Add `manualChunks` in `vite.config.js` for at least `react`, `mui`, `firebase`, `pdf/ocr`.
7. Remove duplicate keyframes and permanent `will-change` usage in `src/index.css`.
- Acceptance:
1. Build output shows split chunks and reduced main entry.
2. Tab switch samples meet p75 `<200ms`.
3. Reduced-motion and tab animation behavior remain correct.

## Workstream 3: P1 UX Friction (Guest + Flow)
- Goal: remove trial-user dead ends and reduce multi-step flows.
- Tasks:
1. Allow guests to save plans locally in `MealPrepCalculator` via storage facade.
2. Replace hard auth-block toast with local-save success + cloud-sync prompt.
3. Show onboarding for guest users too in `src/app/App.jsx`.
4. Replace `plannerTargetsFromCalculator` localStorage bridge with shared in-app state/context.
- Acceptance:
1. Guest can save/reload plans without auth.
2. Calories-to-planner targets transfer without manual tab/storage hacks.
3. Onboarding display logic works once-per-user/device.

## Workstream 4: P2 Storage Consolidation
- Goal: one persistence contract for plans, ingredients, preferences, recents, favorites.
- Tasks:
1. Extend `src/shared/services/storage.js` to include ingredients and preferences.
2. Refactor `src/features/ingredients/ingredientStorage.js` to use facade.
3. Add centralized localStorage key registry/service with safe parse fallback.
4. Remove debug globals on `window` or gate behind `import.meta.env.DEV`.
- Acceptance:
1. Domain persistence no longer bypasses facade.
2. Guest-to-auth migration covers ingredients + preferences.
3. Storage API returns consistent success/error shapes.

## Workstream 5: P2 Diagnostics and Performance Guardrails
- Goal: make latency regressions measurable and repeatable.
- Tasks:
1. Keep tab latency overlay behind `?perf=1` or env flag.
2. Add performance marks for tab-change start/end and tab-first-render complete.
3. Add benchmark runbook in `docs/perf-checklist.md`.
- Acceptance:
1. Diagnostics off by default in normal production UX.
2. Team can collect p50/p75/p95 tab latency in <5 minutes.

## Public APIs / Interfaces / Types
1. Add/expand storage facade API in `src/shared/services/storage.js`:
   - `getIngredients(userId?)`
   - `saveIngredients(ingredients, userId?)`
   - `getUserPreferences(userId?)`
   - `saveUserPreferences(preferences, userId?)`
   - `migrateGuestDataToUser(userId)`
2. Add shared macro handoff contract:
   - `MacroTargetsContext` with `setTargets(targets)` and `consumePendingTargets()`.
3. Optional URL contract (if included in this pass):
   - `?tab=<calculator|calorie|instructions|ingredients|account>`.

## Test Cases and Scenarios
1. Unit:
   - storage facade guest/auth parity for plans, ingredients, preferences.
   - guest migration correctness.
   - OCR lazy import success + failure handling.
2. Integration:
   - guest saves plan, refreshes, plan persists.
   - calorie “send to planner” updates planner targets directly.
   - only active tab mounts.
3. Regression:
   - no Grid migration warnings.
   - no nested button warnings.
   - no tooltip disabled-child warnings.
   - no missing key warnings.
4. Performance:
   - compare chunk sizes to baseline.
   - run 30 tab-switch sample and record p50/p75/p95.

## Rollout
1. PR1: P0 console/import/warning cleanup.
2. PR2: P1 performance (lazy tabs + chunk split + OCR dynamic import).
3. PR3: P1 UX friction (guest save + onboarding + macro context).
4. PR4: P2 storage consolidation + diagnostics hardening.

## Assumptions and Defaults
1. MUI remains v7; all Grid migration aligns to v7 API.
2. Planner stays default initial tab.
3. Performance targets are evaluated on production build, not dev HMR.
4. Guest persistence remains localStorage-backed; cloud sync remains auth-backed.
5. Large component decomposition is deferred until latency/stability targets are met.
