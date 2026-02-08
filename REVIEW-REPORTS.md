# Prep Thy Meal — Comprehensive Review Reports

Generated 2026-02-07 by a team of three analysis agents covering UX, Architecture, and Performance, plus a feature research agent.

---

# Table of Contents

1. [Unified Summary](#unified-summary)
2. [UX Improvement Report](#ux-improvement-report)
3. [Architecture Improvement Report](#architecture-improvement-report)
4. [Performance Improvement Report](#performance-improvement-report)
5. [Feature Comparison & Product Roadmap](#feature-comparison--product-roadmap)

---

# Unified Summary

## Critical (Cross-Cutting Themes)

These issues were flagged by **multiple agents**, making them the highest priority:

| # | Issue | Domains | Key Files |
|---|-------|---------|-----------|
| 1 | **All 5 tabs mount simultaneously** — hidden via `display:none`, wasting render cycles, running effects, and bloating initial load | Perf + UX + Arch | `MealPrep.jsx:477-544` |
| 2 | **God components** — MealPrepCalculator (2675 lines, 30+ useState), IngredientManager (1800 lines), CalorieCalculator (1293 lines) | Arch + Perf | Feature components |
| 3 | **Main bundle is 1,150 KB** — no code splitting, no lazy loading of tabs, Tesseract.js statically imported | Perf | `MealPrep.jsx:29-34`, `ocrService.js:1`, `vite.config.js` |
| 4 | **Guest users can't save plans** — biggest friction point for trial users | UX + Arch | `MealPrepCalculator.jsx:682-685` |
| 5 | **Ingredients bypass the storage facade** — parallel localStorage/Firestore paths, no guest migration for ingredients | Arch | `ingredientStorage.js`, `storage.js` |
| 6 | **Phantom npm deps** (`aux`, `mui`, `ps`) — unused packages, potential supply chain risk | Perf + Arch | `package.json` |

## Top 10 Actions by Impact

### Performance
1. **Add `React.lazy()` for tab components** — could cut main bundle 40-60% (`MealPrep.jsx:29-34`)
2. **Configure Vite `manualChunks`** for vendor splitting (MUI, Firebase) (`vite.config.js`)
3. **Dynamic import Tesseract.js** — only load when OCR is triggered (`ocrService.js:1`)
4. **Fix `useUndoRedo` stale closure** — causes cascading callback instability (`useUndoRedo.js:18-37`)
5. **Remove duplicate CSS keyframes** — `tabFadeUp`, `glowPulse`, `skeletonShimmer` defined twice (`index.css:151-291`)

### Architecture
6. **Extend storage facade** to cover ingredients, favorites, preferences, recents — and fix guest migration (`storage.js`, `ingredientStorage.js`)
7. **Centralize localStorage** — 8+ independent keys with no registry or error handling
8. **Replace localStorage cross-tab communication** with shared context (`MealPrepCalculator.jsx:341`, `CalorieCalculator.jsx`)
9. **Remove phantom deps** and verify `@mui/x-data-grid` usage (`package.json`)

### UX
10. **Enable guest plan saving** via guestStorage + show onboarding to all users (`MealPrepCalculator.jsx:682`, `App.jsx:19-25`)

## Medium Priority

| Domain | Issue | Files |
|--------|-------|-------|
| UX | Planner has no empty state / new user guidance | `MealPrepCalculator.jsx:1446+` |
| UX | Mobile toolbar overflows on narrow screens | `MealPrep.jsx:239-421` |
| UX | Calorie-to-Planner flow is indirect (localStorage + manual tab switch) | `CalorieCalculator.jsx:346-358` |
| UX | Neon macro colors fail WCAG contrast in light mode (cyan #00e5ff = 2.0:1) | `IngredientCard.jsx:17-22` |
| UX | No deep linking / URL routing for tabs | `MealPrep.jsx:59` |
| Arch | ErrorBoundary uses hardcoded colors, no granular boundaries inside features | `ErrorBoundary.jsx:27-78` |
| Arch | `userPreferences.js` has no guest fallback | `userPreferences.js` |
| Arch | Debug function leaked to `window` in production | `cleanupDuplicates.js:49` |
| Perf | `handleIngredientChange` not memoized | `MealPrep.jsx:109-111` |
| Perf | `CategoryPill` defined inside render (remounts every render) | `IngredientManager.jsx:776-791` |
| Perf | Ingredient list has no virtualization (100+ rows possible) | `IngredientManager.jsx:793+` |
| Perf | `will-change` permanently on all 5 tab panels | `index.css:137-139` |

## Low Priority

- Missing `aria-label` on several buttons
- Toast duration inconsistency (3s may be too short for complex messages)
- OnboardingModal disables Escape key
- SkeletonLoader shimmer colors assume dark mode
- LoadingSpinner hardcodes dark-mode colors
- Duplicate MEALS constant definition
- Undo/redo stores 20 full state snapshots
- Test coverage gaps (0 tests for MealPrepCalculator, IngredientManager, storage facade)
- Inconsistent page container widths and header patterns across features

---

# UX Improvement Report

## 1. Navigation Flow

### 1a. Tab System — All Tabs Rendered Simultaneously (High Impact)
**Files:** `src/shared/components/layout/MealPrep.jsx:477-544`

All five tab panels are always mounted and rendered — they are merely hidden via `display: none`. This means:
- All tabs load their data and run effects on initial mount (even if never visited).
- The IngredientManager, CalorieCalculator, and AccountPage all make API calls and sync data even if the user only uses the Planner tab.

**Recommendation:** Lazy-mount tabs so content only renders when first visited (keep mounted after first visit for state preservation). This improves both performance and perceived UX.

### 1b. Mobile Bottom Navigation Lacks Active State Feedback (Medium Impact)
**File:** `src/shared/components/layout/MealPrep.jsx:448-465`

The `BottomNavigation` component uses MUI defaults. There is no haptic feedback, no scale/bounce animation on tap, and no visual distinction beyond the default MUI color change. On mobile, users benefit from stronger active-state feedback.

**Recommendation:** Add a subtle scale animation or ripple enhancement to the active bottom nav item for better tactile feedback.

### 1c. No Deep Linking / URL Routing (Medium Impact)
**File:** `src/shared/components/layout/MealPrep.jsx:59`

Active tab is stored in React state only (`useState(TABS.CALCULATOR)`). Users cannot share a link to a specific tab, and browser back/forward does not navigate between tabs.

**Recommendation:** Sync `activeTab` with URL hash or query params (e.g., `?tab=ingredients`) so users can bookmark and share specific views.

### 1d. Toolbar Overflow on Mobile (High Impact)
**File:** `src/shared/components/layout/MealPrep.jsx:239-421`

The header toolbar contains: logo, app name, beta chip, online/offline status indicator, sync timestamp, theme toggle, avatar, and login/logout button. On narrow mobile screens (320-375px), this overflows horizontally.

**Recommendation:** Collapse secondary toolbar items (status indicator, sync time) into a menu or hide them on xs breakpoints. Consider moving logout into the Account tab on mobile.

## 2. Onboarding Experience

### 2a. Onboarding Only Shows for Authenticated Users (High Impact)
**File:** `src/app/App.jsx:19-25`

```js
if (user && !hasCompletedOnboarding()) {
  const timer = setTimeout(() => setShowOnboarding(true), 500);
```

Guest users never see the onboarding modal. Since the app supports a full guest mode, new guest users land directly on the Planner tab with no guidance at all.

**Recommendation:** Show onboarding for all new users regardless of auth state. Check `hasCompletedOnboarding()` without requiring `user`.

### 2b. OnboardingModal References Non-Existent Theme Token (Low Impact)
**File:** `src/shared/components/onboarding/OnboardingModal.jsx:60,82`

```js
<Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.accent' }}>
```

`background.accent` is defined in ThemeContext but is not a standard MUI palette token — verify it resolves correctly.

### 2c. OnboardingModal Disables Escape Key (Low Impact)
**File:** `src/shared/components/onboarding/OnboardingModal.jsx:186`

`disableEscapeKeyDown` prevents keyboard-only users from dismissing the modal. While there is a Skip button, this is an accessibility barrier.

**Recommendation:** Allow Escape to dismiss (same as Skip) for keyboard accessibility.

### 2d. OnboardingModal Skip Button Positioning (Medium Impact)
**File:** `src/shared/components/onboarding/OnboardingModal.jsx:224-248`

The Skip button sits between Back and Next, which is unusual. Users expect Skip in a corner or at the top. Its `variant="text"` and `color="text.secondary"` makes it visually blend in, causing confusion about button hierarchy.

**Recommendation:** Move Skip to top-right of the dialog, or clearly separate it from the primary Back/Next flow.

## 3. Form Interactions and Validation

### 3a. Calorie Calculator Lacks Input Validation Boundaries (High Impact)
**File:** `src/features/calorie-calculator/CalorieCalculator.jsx:579-610`

The age, weight, and height fields use `type="number"` with `inputProps` min/max, but these HTML constraints are easily bypassed. There is no programmatic validation — a user can enter age=0, weight=-50, or height=999 and the Mifflin-St Jeor calculation will produce nonsensical results.

**Recommendation:** Add onChange validation that clamps values to valid ranges and shows inline warning text for out-of-range inputs.

### 3b. Ingredient Form Missing Required Field Indication (Medium Impact)
**File:** `src/features/ingredients/IngredientManager.jsx:835-852`

The ingredient name field is the only required field, but there is no visual indication (no asterisk, no "required" label). The save function silently returns if name is empty (`if (!form.name.trim()) return;` at line 452) with no user feedback.

**Recommendation:** Add `required` prop to the name TextField and show a toast or inline error when attempting to save with an empty name.

### 3c. Calorie Target Editing UX (Medium Impact)
**File:** `src/features/meal-planner/MealPrepCalculator.jsx:1407-1431`

The calorie target edit requires clicking an edit icon, changing the value, then clicking a confirm button. The validation message uses emoji prefixes which is inconsistent with the rest of the app.

**Recommendation:** Use inline editing with onBlur commit, and replace emoji in validation messages with proper MUI Alert or helper text.

### 3d. Number Fields Accept Non-Numeric Input (Low Impact)
**Files:** Multiple `TextField` with `type="number"` throughout CalorieCalculator and IngredientManager.

`type="number"` still allows "e", "+", "-" characters in many browsers. The `onChange` handlers use `Number()` or `parseInt()` which can produce NaN.

**Recommendation:** Add inputMode="numeric" pattern="[0-9]*" for mobile keyboards and validate on change.

## 4. Error Handling and User Feedback

### 4a. ErrorBoundary Uses Hard-Coded Colors (Medium Impact)
**File:** `src/shared/components/ui/ErrorBoundary.jsx:27-78`

The ErrorBoundary renders raw HTML with inline styles using hard-coded light-mode colors (`backgroundColor: '#fff3cd'`, `border: '1px solid #ffc107'`). In dark mode, this produces a jarring yellow box that breaks the theme.

**Recommendation:** Refactor ErrorBoundary to use MUI components (Alert, Button, Paper) so it inherits the theme properly.

### 4b. LoadingSpinner Uses Hard-Coded Dark Theme Colors (Medium Impact)
**File:** `src/shared/components/ui/LoadingSpinner.jsx:26-41`

```js
border: '3px solid rgba(255,255,255,0.06)',
borderTop: '3px solid #ff2d78',
color: '#7a78a0',
```

This assumes dark mode. In light mode, the spinner border is nearly invisible against a white background.

**Recommendation:** Use MUI theme tokens or accept theme as a prop to handle both modes.

### 4c. Guest Users Get Confusing Error on Save (High Impact)
**File:** `src/features/meal-planner/MealPrepCalculator.jsx:682-685`

```js
if (!uid) {
  toast.error("Please sign in to save plans.");
  return;
}
```

Guest users can build entire meal plans but are blocked from saving with a terse error toast. There is no guidance on how to sign in from this context, and no local save fallback.

**Recommendation:** Either (a) enable local plan saving for guests via guestStorage, or (b) show a contextual prompt with a "Sign In" button directly in the toast/dialog rather than just an error message.

### 4d. Duplicate OfflineBanner and Inline Status Indicator (Low Impact)
**Files:**
- `src/shared/components/layout/OfflineBanner.jsx` (Snackbar-based)
- `src/shared/components/layout/MealPrep.jsx:332-365` (inline status pill)

Both components independently track online/offline state and display separate indicators. The OfflineBanner shows a Snackbar at the top, while the header shows a status pill. This is redundant.

**Recommendation:** Remove one of the two indicators.

## 5. Mobile vs Desktop Usability

### 5a. MealPrepCalculator Header Wraps Poorly on Mobile (High Impact)
**File:** `src/features/meal-planner/MealPrepCalculator.jsx:1462-1577`

The planner header contains: title, subtitle, plan dropdown, plan name input, unsaved chip, undo/redo buttons, save button, and actions menu. On mobile this creates a tall, cluttered header that pushes content below the fold.

**Recommendation:** On mobile, collapse plan management into a collapsible section or move plan selection into a separate modal/drawer.

### 5b. Ingredient Table Not Responsive (Medium Impact)
**File:** `src/features/ingredients/IngredientManager.jsx` (table section, offset ~1000+)

The ingredient list uses MUI `Table` with multiple columns. On mobile, this requires horizontal scrolling which is not indicated to the user.

**Recommendation:** Use a card-based layout on mobile instead of a table, or add horizontal scroll indicators.

### 5c. Touch Targets Below 44px (Medium Impact)
**Files:** Multiple locations including `CalorieCalculator.jsx:618` and various `IconButton size="small"` instances.

Some interactive elements have touch targets below the recommended 44x44px minimum.

**Recommendation:** Audit all IconButton and clickable elements on mobile and ensure minimum 44x44px touch targets.

### 5d. Bottom Navigation Overlaps Content (Low Impact)
**File:** `src/shared/components/layout/MealPrep.jsx:212,474`

Bottom padding is set to `pb: 10` for mobile, but this is a fixed value. If system UI (iOS safe area) is present, content may still be obscured.

**Recommendation:** Use `env(safe-area-inset-bottom)` CSS variable for proper safe area handling on iOS.

## 6. Accessibility

### 6a. Tab Panels Have Proper ARIA Attributes (Positive)
**File:** `src/shared/components/layout/MealPrep.jsx:477-544`

Good: Each tabpanel has `role="tabpanel"`, `id`, and `aria-labelledby` attributes. Desktop tabs have `id` and `aria-controls`. Bottom nav has `aria-label="Main navigation"`.

### 6b. Missing aria-label on Several Interactive Elements (Medium Impact)
**Files:**
- `MealPrep.jsx:389-397` — Logout button lacks `aria-label`
- `MealPrep.jsx:411-417` — Login button lacks `aria-label`
- `IngredientManager.jsx` — Delete, Edit, and Search buttons for ingredients lack `aria-label`

**Recommendation:** Add descriptive `aria-label` attributes to all icon-only buttons and action buttons.

### 6c. Color Contrast Concerns in Macro Colors (Medium Impact)
**File:** `src/features/meal-planner/IngredientCard.jsx:17-22`

Cyan (`#00e5ff`) on a white or light background has a contrast ratio of approximately 2.0:1, well below the WCAG AA minimum of 4.5:1 for normal text. The amber (`#ffb020`) is similarly low contrast on light backgrounds.

**Recommendation:** Use darker variants for light mode (e.g., `#00838f` for cyan, `#e65100` for amber). Keep neon colors for dark mode only.

### 6d. IngredientCard Quantity Display Not Screen-Reader Friendly (Low Impact)
**File:** `src/features/meal-planner/IngredientCard.jsx:113-119`

Screen readers will read quantity and unit as separate elements without context.

**Recommendation:** Add `aria-label` to the quantity container (e.g., "2 servings, 200g").

### 6e. Focus Management After Modal Close (Low Impact)
**Files:** Login, MealTemplateSelector, ConfirmDialog

When dialogs close, focus is not explicitly returned to the triggering element for programmatic closes via `onSuccess` callbacks.

## 7. Empty States and Loading States

### 7a. Good: EmptyState and SkeletonLoader Components Exist (Positive)
These are well-designed reusable components with themed variants.

### 7b. Planner Tab Has No Empty State for New Users (High Impact)
**File:** `src/features/meal-planner/MealPrepCalculator.jsx:1446+`

When a new user first opens the Planner, they see an empty plan with 0 ingredients in all four meals. There is no guidance, no "Get Started" prompt.

**Recommendation:** Show a contextual empty state within each meal section.

### 7c. CalorieCalculator Has No Loading State for Profile Load (Low Impact)
**File:** `src/features/calorie-calculator/CalorieCalculator.jsx:287-343`

Form fields show default values while the async load runs, then suddenly update.

### 7d. SkeletonLoader Shimmer Color Assumes Dark Mode (Low Impact)
**File:** `src/shared/components/ui/SkeletonLoader.jsx:5-9`

Colors are tuned for dark mode and are nearly invisible on light backgrounds.

## 8. Toast / Notification Patterns

### 8a. Inconsistent Toast Duration (Medium Impact)
**File:** `src/app/App.jsx:60-81`

Default 4000ms, success 3000ms, error 5000ms. The 3-second success duration may be too short for messages requiring comprehension.

**Recommendation:** Standardize: 3s simple confirmations, 5s messages requiring comprehension, 7s+ actionable messages.

### 8b. Toast Messages Use Emojis Inconsistently (Low Impact)
Toast messages are generally emoji-free but validation warnings use them.

## 9. User Journey Friction Points

### 9a. Calorie Calculator to Planner Flow Is Indirect (High Impact)
**File:** `src/features/calorie-calculator/CalorieCalculator.jsx:346-358`

The "Send to Planner" button saves targets to localStorage and shows a toast telling the user to manually switch tabs.

**Recommendation:** After "Send to Planner", automatically switch to the Planner tab with an inline confirmation.

### 9b. No Cross-Feature Data Awareness (Medium Impact)
No "Use this ingredient" action from the Ingredients tab to the Planner.

### 9c. Plan Save Requires Authentication (High Impact)
**File:** `src/features/meal-planner/MealPrepCalculator.jsx:682-685`

Guest users can create meals but cannot save plans.

**Recommendation:** Allow guests to save plans to localStorage. Show a non-blocking nudge to sign up for cloud sync.

### 9d. MealPrepInstructions Is Static and Generic (Low Impact)
The Guide tab contains only hard-coded cooking instructions. It does not adapt to the user's actual ingredients.

## 10. Consistency Across Features

### 10a. Mixed Page Structure Patterns (Medium Impact)
Each feature uses a different container/max-width strategy.

**Recommendation:** Create a shared `PageContainer` component.

### 10b. Inconsistent Card/Paper Border Radius (Low Impact)
Various values: `borderRadius: 2`, `borderRadius: 3`, `borderRadius: 9999`.

### 10c. Inconsistent Header Patterns (Medium Impact)
Each page uses a different header structure.

**Recommendation:** Create a shared `PageHeader` component.

## UX Priority Summary

### High Impact
1. Guest users cannot save plans — MealPrepCalculator.jsx:682
2. Onboarding not shown to guest users — App.jsx:19-25
3. Empty planner with no guidance for new users — MealPrepCalculator.jsx:1446+
4. Mobile toolbar overflow — MealPrep.jsx:239-421
5. Calorie Calculator to Planner flow is indirect — CalorieCalculator.jsx:346-358
6. CalorieCalculator lacks input validation — CalorieCalculator.jsx:579-610
7. Planner header wraps poorly on mobile — MealPrepCalculator.jsx:1462-1577

### Medium Impact
8. ErrorBoundary ignores theme — ErrorBoundary.jsx:27-78
9. LoadingSpinner dark-mode-only colors — LoadingSpinner.jsx:26-41
10. Missing aria-labels on buttons — multiple files
11. Color contrast for neon macro colors in light mode — IngredientCard.jsx:17-22
12. No deep linking / URL routing — MealPrep.jsx:59
13. Ingredient form missing required field indication — IngredientManager.jsx:835,452
14. Inconsistent page container widths — multiple files
15. Inconsistent header patterns — multiple files
16. Toast duration standardization — App.jsx:60-81
17. Touch targets below 44px on mobile — multiple files
18. No "Use in Planner" from Ingredients tab

### Low Impact
19. OnboardingModal references non-existent theme token — OnboardingModal.jsx:60
20. OnboardingModal disables Escape key — OnboardingModal.jsx:186
21. Duplicate offline indicators — OfflineBanner.jsx + MealPrep.jsx:332
22. SkeletonLoader shimmer assumes dark mode — SkeletonLoader.jsx:5-9
23. Number fields accept non-numeric input
24. Inconsistent emoji usage in messages
25. Bottom nav iOS safe area handling — MealPrep.jsx:212

---

# Architecture Improvement Report

## HIGH IMPACT

### 1. Monolithic "God Components" (Critical)
**Files:** `MealPrepCalculator.jsx` (2675 lines), `IngredientManager.jsx` (1800 lines), `CalorieCalculator.jsx` (1293 lines)

These components each manage massive amounts of local state, business logic, UI rendering, and side effects in a single file. `MealPrepCalculator.jsx` alone has 30+ `useState` calls, multiple `useEffect` hooks, inline PDF export logic, shopping list generation, plan CRUD, ingredient manipulation, undo/redo, template management, and the full meal builder UI.

**Recommendation:** Extract each into sub-components and custom hooks:
- `useMealPlans(user)` — plan CRUD, loading/saving
- `useShoppingList(mealIngredients, prepDays)` — shopping aggregation
- `usePlanSync(user)` — Firebase sync/hydration
- Break the render into `<MealSection>`, `<ShoppingList>`, `<PlanManager>`, `<NutritionSummary>`

### 2. Inconsistent Storage Facade — Ingredients Bypass the Facade Pattern
**Files:** `src/features/ingredients/ingredientStorage.js:1-84`, `src/shared/services/storage.js:1-77`

The app has a clean storage facade (`storage.js`) for plans and baseline that routes between Firebase and guest localStorage. However, `ingredientStorage.js` implements its own parallel local+remote sync pattern, directly importing from `firestore.js` (line 2) and managing localStorage independently. This means:
- Ingredients do NOT go through the storage facade
- `favorites.js`, `recentIngredients.js`, `onboarding.js`, and `userPreferences.js` all directly hit localStorage or Firestore, bypassing the facade
- The guest migration service (`guestMigration.js`) only migrates plans and baseline, NOT ingredients, favorites, recent ingredients, or preferences

**Recommendation:** Extend `storage.js` to cover all data types (ingredients, favorites, recents, preferences) and route the migration service accordingly. This is the single most important architectural fix.

### 3. Scattered localStorage Usage Without Centralization
**Files:** Multiple direct `localStorage` calls across:
- `ingredientStorage.js:6-8` (customIngredients key)
- `favorites.js:1` (favoriteIngredients key)
- `recentIngredients.js:3` (recentIngredients key)
- `onboarding.js:3` (hasCompletedOnboarding key)
- `cleanupDuplicates.js:42` (direct localStorage write)
- `MealPrepCalculator.jsx:264` (calorieCalculatorProfile key), `:341` (plannerTargetsFromCalculator key), `:404` (lastPlan key)
- `ThemeContext.jsx:41-55` (theme key)
- `CalorieCalculator.jsx` (calorieCalculatorProfile, plannerTargetsFromCalculator)

At least 8 different localStorage keys are managed independently with no central registry.

**Recommendation:** Create a `localStorageService.js` with a key registry, typed getters/setters, and centralized error handling.

### 4. Cross-Feature Communication via localStorage Events
**Files:** `MealPrepCalculator.jsx:341-376`, `CalorieCalculator.jsx` (plannerTargetsFromCalculator)

The CalorieCalculator writes to `localStorage.setItem("plannerTargetsFromCalculator", ...)` and MealPrepCalculator reads it with a `storage` event listener and a 5-minute TTL check. This is a fragile cross-tab communication pattern.

**Recommendation:** Use a shared `MacroTargetsContext` or a simple pub/sub pattern instead of localStorage polling.

### 5. No Error Boundaries Inside Feature Components
**Files:** `src/shared/components/ui/ErrorBoundary.jsx:1-85`, `src/shared/components/layout/MealPrep.jsx:485-544`

Error boundaries wrap each tab panel in `MealPrep.jsx` (good), and there's a root-level boundary in `App.jsx`. However:
- The `ErrorBoundary` component uses hardcoded colors that don't respect the theme system
- No error boundaries exist inside the massive feature components themselves
- No error recovery mechanism beyond full page reload

**Recommendation:** Add granular error boundaries within `MealPrepCalculator` around the shopping list, plan manager, and meal sections. Also theme the `ErrorBoundary` component using MUI.

## MEDIUM IMPACT

### 6. Duplicate MEALS Constant Definition
**Files:** `src/features/meal-planner/MealPrepCalculator.jsx:90`, `src/shared/constants/validation.js:66`

`MEALS` is defined as `["breakfast", "lunch", "dinner", "snack"]` in both files. The component should import from the shared constant.

### 7. `cleanupDuplicates.js` Exposes Function on `window` Object
**File:** `src/features/ingredients/cleanupDuplicates.js:49`

`window.cleanupDuplicateIngredients = cleanupDuplicateIngredients;` runs at module import time. This is a debug utility leaking into production.

**Recommendation:** Remove the `window` assignment. If needed for debug, gate it behind `import.meta.env.DEV`.

### 8. `userPreferences.js` Bypasses Storage Facade and Has No Guest Support
**File:** `src/shared/services/userPreferences.js:1-63`

This service directly uses Firestore with no guest/localStorage fallback. Guest users cannot persist preferences.

**Recommendation:** Add localStorage fallback for guest users.

### 9. Ingredient Cache is a Module-Level Singleton with No React Integration
**File:** `src/features/ingredients/nutritionHelpers.js:8-36`

The ingredient cache lives as module-level variables. React components get stale data unless they manually track `cacheVersion`. There's no subscription mechanism.

**Recommendation:** Consider `useSyncExternalStore` or a Context provider around the ingredient store.

### 10. Inconsistent Return Types in Storage Operations
**Files:** `src/shared/services/storage.js` vs `src/shared/services/guestStorage.js`

The return value consistency is maintained at the facade level but is fragile — a caller of `guestStorage.js` directly would get different behavior.

### 11. Dynamic Firestore Import in MealPrepCalculator
**File:** `src/features/meal-planner/MealPrepCalculator.jsx:249-256`

Dynamically imports Firestore to load the bodyweight profile, bypassing the app's `firebase.js` module and the storage facade.

**Recommendation:** Import `db` from `../../shared/services/firebase.js` or route through the storage facade.

### 12. Spurious npm Dependencies
**File:** `package.json:22-23`

`aux` (v0.0.6), `mui` (v0.0.1), `ps` (v1.0.0) — placeholder/abandoned packages never imported in the codebase. Supply chain risk.

**Recommendation:** Remove immediately.

### 13. `@mui/x-data-grid` Unused
**File:** `package.json:20`

Listed as a dependency but not imported anywhere. This is a large package (~500KB).

**Recommendation:** Verify and remove if unused.

## LOW IMPACT

### 14. Test Coverage Gaps
8 test files exist covering helpers and hooks. **Not covered:** storage.js, firestore.js, guestStorage.js, guestMigration.js, ingredientStorage.js, usda.js, openFoodFacts.js, ocrService.js, MealPrepCalculator.jsx, IngredientManager.jsx, CalorieCalculator.jsx, AccountPage.jsx, smartParser.js, userPreferences.js.

**Recommendation:** Prioritize testing the storage facade, guest migration, and `calculateNutrition` paths.

### 15. `useUndoRedo` Closure Issue
**File:** `src/shared/hooks/useUndoRedo.js:18-37`

The `setState` callback closes over `state`, meaning rapid successive calls can lose intermediate states.

**Recommendation:** Use `useRef` to track current state, or use a reducer pattern.

### 16. `categorizeIngredient` Uses Naive String Matching
**File:** `src/features/meal-planner/MealPrepCalculator.jsx:119-194`

76 lines of if/includes chains. "pepper" matches both "Produce - Vegetables" and "Condiments & Spices".

### 17. Theme Hardcoded Colors in Non-Theme Components
**Files:** `MealPrep.jsx:569-571`, `ErrorBoundary.jsx:29-35`

### 18. All Tabs Mount Simultaneously
**File:** `src/shared/components/layout/MealPrep.jsx:306`

The `hidden` + `display: none` pattern means all 5 feature components mount on first load. Intentional for state preservation but impacts performance.

## Architecture Summary Table

| # | Finding | Impact | Files |
|---|---------|--------|-------|
| 1 | God components (2675, 1800, 1293 lines) | HIGH | MealPrepCalculator, IngredientManager, CalorieCalculator |
| 2 | Ingredients bypass storage facade | HIGH | ingredientStorage.js, storage.js |
| 3 | 8+ scattered localStorage keys | HIGH | Multiple files |
| 4 | Cross-feature comms via localStorage | HIGH | MealPrepCalculator, CalorieCalculator |
| 5 | ErrorBoundary gaps and no theming | HIGH | ErrorBoundary.jsx, MealPrep.jsx |
| 6 | Duplicate MEALS constant | MEDIUM | MealPrepCalculator.jsx, validation.js |
| 7 | Debug function on window object | MEDIUM | cleanupDuplicates.js |
| 8 | userPreferences has no guest support | MEDIUM | userPreferences.js |
| 9 | Module-level cache without React integration | MEDIUM | nutritionHelpers.js |
| 10 | Inconsistent return types | MEDIUM | storage.js, guestStorage.js |
| 11 | Dynamic Firestore import bypasses app module | MEDIUM | MealPrepCalculator.jsx:249 |
| 12 | Spurious npm deps (aux, mui, ps) | MEDIUM | package.json |
| 13 | Unused @mui/x-data-grid | MEDIUM | package.json |
| 14 | Major test coverage gaps | LOW | No tests for core features |
| 15 | useUndoRedo closure issue | LOW | useUndoRedo.js |
| 16 | Naive categorizeIngredient | LOW | MealPrepCalculator.jsx:119 |
| 17 | Hardcoded colors in non-theme components | LOW | MealPrep.jsx, ErrorBoundary.jsx |
| 18 | All tabs mount simultaneously | LOW | MealPrep.jsx |

---

# Performance Improvement Report

## 1. Bundle Size & Code Splitting

### [HIGH] Main bundle is 1,150 KB (352 KB gzip) — far exceeds the 500 KB recommended limit

Production build output:
```
dist/assets/index-pmOddMEw.js   1,149.91 kB │ gzip: 351.85 kB  (MAIN BUNDLE)
dist/assets/jspdf.es.min-...js    352.74 kB │ gzip: 115.77 kB  (already lazy)
dist/assets/html2canvas.esm-...   201.40 kB │ gzip:  47.48 kB  (already lazy)
```

The main bundle contains ALL tab content, Firebase SDK, MUI components, and Tesseract.js — loaded upfront.

**Root cause:** In `src/shared/components/layout/MealPrep.jsx:29-34`, all five tab components are statically imported.

**Recommendation:** Use `React.lazy()` + `Suspense` for all tabs except the default (Planner). Could move 40-60% of the main bundle into on-demand chunks.

### [HIGH] Spurious/phantom dependencies in package.json

`aux` (v0.0.6), `mui` (v0.0.1), `ps` (v1.0.0) — NEVER imported anywhere. Remove immediately.

### [MEDIUM] Firebase Firestore is both statically and dynamically imported

Vite build warning confirms dynamic imports in CalorieCalculator and MealPrepCalculator are effectively dead code since static imports in firestore.js pull Firestore into the main bundle anyway.

**Recommendation:** Either commit to static imports everywhere or restructure so Firestore is ONLY dynamically imported.

### [MEDIUM] Tesseract.js included in main bundle

`src/shared/services/ocrService.js:1` — static import. Should be dynamically imported only when OCR is triggered.

### [LOW] `@mui/x-data-grid` in dependencies but possibly unused

Verify it's actually used; if not, remove it.

## 2. Tab Switching & Render Performance

### [HIGH] All 5 tabs render simultaneously and stay mounted

`src/shared/components/layout/MealPrep.jsx:477-544` — All tabs rendered inside `<Box>` wrappers using `display: none`. Every tab's component tree, hooks, effects, and state are active from app load.

**Recommendation:** Use conditional rendering or `React.lazy` to only mount the active tab.

### [MEDIUM] MealPrepCalculator is a massive monolith (~2675 lines)

30+ `useState` calls, 10+ `useEffect`s, 10+ `useCallback`s. Any state change triggers re-render of the entire tree.

**Recommendation:** Extract sub-components wrapped in `React.memo`.

### [MEDIUM] `handleIngredientChange` is not memoized

`src/shared/components/layout/MealPrep.jsx:109-111` — Recreated on every render. Wrap with `useCallback`.

### [MEDIUM] useUndoRedo hook has stale closure issues

`src/shared/hooks/useUndoRedo.js:18-37` — `setState` captures state value at creation time. New function created on EVERY state change, cascading to all consumers.

**Recommendation:** Use a ref to track current state inside the hook.

### [LOW] `CategoryPill` component defined inside render

`src/features/ingredients/IngredientManager.jsx:776-791` — Recreated on every render, causing unmount/remount. Move outside the component.

## 3. localStorage Access Patterns

### [MEDIUM] Redundant localStorage parsing in ingredientStorage operations

Every mutation does `JSON.parse(localStorage.getItem(...))`. For 50+ ingredients, this parse-modify-serialize cycle is O(n) per operation.

### [LOW] Multiple localStorage reads on mount

At least 6 synchronous localStorage reads on app load. The ingredient list parse could be significant for large libraries.

## 4. CSS Animation Performance

### [MEDIUM] `will-change` applied to ALL tab panels permanently

`src/index.css:137-139` — Promotes all 5 tab panels to compositing layers permanently. Should only apply during animation.

### [LOW] box-shadow animations not GPU-accelerated

`neonPulse`, `cyanPulse`, `statusPulse`, `glowPulse` animate `box-shadow` which causes repaints.

**Recommendation:** Consider `::after` pseudo-element with `opacity` animation for GPU compositing.

### [LOW] Duplicate CSS keyframe definitions

`tabFadeUp`, `glowPulse`, `skeletonShimmer`, `.tab-stagger`, and `.cheer` rule sets are duplicated in `index.css` (lines 151-199 repeated at 222-291).

## 5. Vite Build Config

### [HIGH] Bare-minimum Vite config with no optimizations

`vite.config.js` — No manual chunks, no rollup output config, no bundle analysis.

**Recommendations:**
1. Add `build.rollupOptions.output.manualChunks` to split vendor code (MUI, Firebase)
2. Consider `build.sourcemap: false` for production
3. Add `rollup-plugin-visualizer` to audit bundle composition

## 6. List Virtualization

### [MEDIUM] Ingredient list renders all items without virtualization

`src/features/ingredients/IngredientManager.jsx:793+` — All filtered ingredients rendered in a single `<Table>`. 100+ items = 100+ rows with multiple MUI components each.

**Recommendation:** Add `react-window` or pagination for 50+ items.

### [LOW] Shopping list in MealPrepCalculator also unvirtualized

Typically < 30 items so lower impact.

## 7. Network & Data Loading

### [MEDIUM] Parallel API calls for USDA + OpenFoodFacts on every search

`src/features/ingredients/IngredientManager.jsx:248-251` — Two API calls on every search. Ensure debouncing (300-500ms) and use AbortController for cancellation.

### [LOW] Double sync on mount for authenticated users

`MealPrep.jsx:146-165` fires `syncFromRemote`, then `IngredientManager.jsx:390-407` also fires `syncFromRemote`.

## 8. Third-Party Library Weight

| Library | In main bundle? | Notes |
|---------|-----------------|-------|
| `@mui/*` | Yes (tree-shaken) | Largest dep, 208 MB in node_modules |
| `firebase` | Yes (static import) | ~150-200KB uncompressed |
| `jspdf` + `autotable` | Lazy loaded (good) | ~352KB + 39KB separate chunks |
| `tesseract.js` | Static import (bad) | Should be lazy |
| `html2canvas` | Lazy loaded (good) | 201KB chunk |
| `@mui/x-data-grid` | Possibly unused | Verify usage |
| `aux`, `mui`, `ps` | Never imported | Phantom deps, remove |

## 9. Memory Considerations

### [LOW] Undo/redo stores full state snapshots

20 history entries × 4 meal arrays × N ingredients = potentially 800+ ingredient object copies in memory.

## Performance Summary: Top 5 Actions

| Priority | Finding | File(s) | Expected Impact |
|----------|---------|---------|-----------------|
| 1 | Add `React.lazy` + code splitting for tabs | `MealPrep.jsx:29-34` | -40-60% main bundle size |
| 2 | Configure Vite `manualChunks` for vendor splitting | `vite.config.js` | Better caching, parallel loading |
| 3 | Remove phantom deps (`aux`, `mui`, `ps`) | `package.json` | Security + cleanliness |
| 4 | Only mount active tab, unmount inactive | `MealPrep.jsx:477-544` | Eliminate hidden tab render cost |
| 5 | Make Tesseract.js a dynamic import | `ocrService.js:1` | Remove from main bundle |

---

# Feature Comparison & Product Roadmap

## Feature Status Overview

| Category | Feature | Status |
|----------|---------|--------|
| **Meal Planning** | Multi-meal daily planning (4 slots) | Has |
| | Macro/calorie targets | Has |
| | Multiple saved plans | Has |
| | Meal templates (pre-built + custom) | Has |
| | Undo/Redo | Has |
| | Match dinner to lunch | Has |
| | Shopping list + PDF export | Has |
| | Weekly visual calendar | **Missing** |
| | Recipe database | **Missing** |
| | AI meal generation | **Missing** |
| **Nutrition** | TDEE calculator (Mifflin-St Jeor) | Has |
| | Bodyweight-based macros | Has |
| | Macro validation/warnings | Has |
| | Micronutrient display | Partial (data fetched, not shown) |
| | Progress tracking/charts | **Missing** |
| **Ingredients** | USDA search (800k+ items) | Has |
| | OpenFoodFacts integration | Has |
| | OCR label scanning (offline) | Has |
| | Smart paste parser | Has |
| | Custom ingredients + import/export | Has |
| | Camera barcode scanner UI | **Missing** |
| **Platform** | Responsive design | Has |
| | Dark/light mode | Has |
| | Guest mode + auth migration | Has |
| | Cloud sync (Firestore) | Has |
| | PWA support | **Missing** |
| | Grocery delivery integration | **Missing** |
| | Family/multi-user sharing | **Missing** |

## PTM's Differentiators

1. **Offline-first OCR** — privacy-focused, no cloud processing
2. **No forced sign-up** — full guest mode with seamless migration
3. **Bodyweight-based macros** — built for serious lifters
4. **Undo/Redo** — very rare in meal planning apps
5. **Multi-API ingredient search** — USDA + OpenFoodFacts + custom
6. **Smart paste parser** — paste nutrition text from anywhere
7. **Match dinner to lunch** — one-click meal duplication
8. **Meal templates with custom saving** — pre-built + user-created

## High-Value Missing Features (Ranked)

### 1. Recipe Database & Generation (Impact: 5/5, Complexity: Hard)
Users want meals, not just ingredients. No recipe library, no AI generation, no step-by-step instructions, no URL import.

### 2. Weekly/Multi-Day Visual Planner (Impact: 5/5, Complexity: Medium)
Most users meal prep for the week. Current PTM only shows daily view. Need calendar grid, drag-and-drop between days, weekly shopping consolidation.

### 3. Grocery Delivery Integration (Impact: 5/5, Complexity: Hard)
One-click grocery ordering via Instacart, Kroger, Walmart APIs. Requires partnership applications and SKU mapping.

### 4. Progress Tracking & Charts (Impact: 4/5, Complexity: Medium)
Weight logging, body measurements, progress photos, trend charts. Fitness users need to track progress over time.

### 5. Barcode Scanner UI (Impact: 4/5, Complexity: Easy-Medium)
Camera barcode scanning using `react-webcam` + `@zxing/library`. Leverages existing OpenFoodFacts integration.

### 6. Progressive Web App (Impact: 4/5, Complexity: Medium)
PWA manifest, service worker, push notifications, app install prompt. Use `vite-plugin-pwa`.

### 7. Family/Multi-User Sharing (Impact: 4/5, Complexity: Hard)
Shared meal plans and grocery lists. Multi-user Firestore access with role-based permissions.

### 8. AI-Powered Meal Suggestions (Impact: 4/5, Complexity: Hard)
OpenAI GPT-4 integration for "Generate a 2000 calorie high-protein meal plan". Preference learning, leftover optimizer.

### 9. Social Media Recipe Import (Impact: 3/5, Complexity: Hard)
Import from Instagram, TikTok, Pinterest, YouTube. URL scraping with AI extraction.

### 10. Micronutrient Tracking (Impact: 3/5, Complexity: Medium)
USDA already provides vitamin/mineral data — just need to display it with RDA targets and deficiency warnings.

## Nice-to-Have Features

| Feature | Impact | Complexity |
|---------|--------|------------|
| Meal prep timer & cooking mode | 3/5 | Medium |
| Restaurant meal logging | 3/5 | Medium |
| Pantry management | 3/5 | Medium |
| Meal prep photos & notes | 2/5 | Easy |
| Export to other apps (MFP, CSV) | 2/5 | Easy-Medium |
| YouTube/video integration | 2/5 | Easy |
| Nutrition label generator | 2/5 | Medium |
| Supplement tracking | 2/5 | Easy |
| Water intake tracking | 2/5 | Easy |

## Recommended Roadmap

### Phase 1: Foundation (0-3 months)
1. Barcode Scanner UI (2 weeks)
2. PWA Support (3 weeks)
3. Weekly Visual Planner (4 weeks)

### Phase 2: Differentiation (3-6 months)
4. Recipe Database (6 weeks)
5. AI Meal Suggestions (4 weeks)
6. Progress Tracking (4 weeks)

### Phase 3: Growth (6-12 months)
7. Grocery Delivery Integration (8 weeks)
8. Family Sharing (6 weeks)
9. Social Media Recipe Import (6 weeks)

### Phase 4: Polish (12+ months)
10. Micronutrient Tracking (3 weeks)
11. Pantry Management (4 weeks)
12. Restaurant Meal Logging (3 weeks)
13. Meal Prep Timer & Cooking Mode (4 weeks)

## Competitive Positioning

**Target:** Fitness enthusiasts doing meal prep (bodybuilders, CrossFitters, athletes)

**Pricing Model:**
- **Free:** Current features (planning, ingredients, guest mode)
- **Premium ($4.99/month):** Recipe database, AI generation, progress tracking, grocery delivery, family sharing, micronutrients

**Marketing Angles:**
- "The meal prep app built by lifters, for lifters"
- "Plan, prep, perform: Hit your macros every day"
- "Privacy-first nutrition tracking (no cloud OCR)"

## Sources

- [Ollie — Best Meal-Planning Apps in 2025](https://ollie.ai/2025/10/21/best-meal-planning-apps-in-2025/)
- [CNN Underscored — Best meal-planning apps 2026](https://www.cnn.com/cnn-underscored/reviews/best-meal-planning-apps)
- [Fitia — Top Food Tracking Apps 2026](https://fitia.app/learn/article/top-food-tracking-apps-2026-healthy-eating/)
- [Prospre — Meal Planner App](https://www.prospre.io/)
- [Strongr Fastr — AI Nutrition & Meal Planner](https://www.strongrfastr.com/)
- [MacroFactor vs MyFitnessPal 2025](https://macrofactor.com/macrofactor-vs-myfitnesspal-2025/)
- [Honeydew — Recipe Apps for Social Media Imports 2026](https://honeydewcook.com/blog/recipe-apps-social-media-imports)
- [ClickUp — 11 Best AI Recipe Generators 2026](https://clickup.com/blog/ai-recipe-generators/)
- [Fitia — Meal Planning Apps with Grocery Lists](https://fitia.app/learn/article/7-meal-planning-apps-smart-grocery-lists-us/)
- [MyFitnessPal](https://www.myfitnesspal.com/)
- [Cronometer](https://cronometer.com/index.html)
