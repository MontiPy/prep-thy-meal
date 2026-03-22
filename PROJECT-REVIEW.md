# Prep Thy Meal — Project Review & Recommendations

*Review Date: March 22, 2026*

## What's Done Well

### Architecture & Code Quality
- **Dual storage facade** (`storage.js`) cleanly routes to guest (localStorage) or Firebase — components never need to know which backend they're using
- **Guest-to-auth migration** is seamless with conflict handling and no data loss
- **Strategic code splitting** — lazy-loaded tabs + dynamic jsPDF/Tesseract imports reduce initial load from ~1,540KB to ~300KB gzipped
- **Feature-module organization** keeps the codebase navigable and maintainable
- **Research-backed macro validation** (protein 0.36–2.0 g/lb, fat 0.2–1.0 g/lb) with actionable warnings

### UI & Design
- **Theme system is a standout** — 6 polished themes (Tokyo Nights, Clean Slate, Ocean Breeze, Forest Floor, Midnight Ember, Lavender Haze) plus a custom editor, synced across devices
- **Responsive layout** with bottom nav on mobile and tab nav on desktop, proper breakpoints throughout
- **Real-time macro feedback** — color-coded progress bars update live as ingredients are added
- **Smart macro warnings** — collapsible alerts with severity levels and specific recommendations
- **5-step onboarding modal** for new users with progressive disclosure
- **Undo/redo** in the meal planner with 50-state history

### Developer Experience
- Comprehensive CLAUDE.md and DEPLOYMENT-READY.md documentation
- Vitest + Testing Library foundation with coverage reports
- Hidden perf overlay (`?perf`), benchmark script, and Profiler component

---

## Recommendations

### 1. User Workflow Improvements

#### 1a. Recipe/Dish System (High Impact)
Users can only add individual ingredients to meals. There's no way to save a combination of ingredients as a reusable recipe (e.g., "Chicken Stir Fry" = chicken breast + rice + broccoli + soy sauce). Add a Recipe entity that groups ingredients with fixed proportions. Recipes should appear in ingredient search and expand into editable components when added to a meal. This eliminates the most repetitive workflow in the app.

#### 1b. Meal Cloning / Copy-Paste (High Impact)
If lunch and dinner share ingredients, each must be re-added manually. The "Match Dinner to Lunch" checkbox is limited to an exact copy. Add per-meal "Copy/Paste" actions that work within a plan and across plans. Also enable "Copy Day" for multi-day planning.

#### 1c. Weekly/Multi-Day Planning View (Medium Impact)
The planner is single-day only. Users doing weekly meal prep must mentally track variety across days or use separate plans with no overview. Add a week-view calendar showing daily macro totals at a glance, with each day linking to the existing daily planner.

#### 1d. Streamline Calculator → Planner Handoff (Low Impact)
After calculating targets, show a prominent callout: "Your targets have been set. Switch to the Planner tab to start building meals." Add a direct navigation button. Consider auto-switching to the Planner tab after applying targets.

---

### 2. Feature Additions

#### 2a. Dietary Tags & Allergen Filters (High Impact)
No way to tag ingredients as vegetarian, vegan, gluten-free, dairy-free, etc. Add optional dietary tags to ingredients, enable filtering in ingredient search, and show dietary summary per meal/plan.

#### 2b. Micronutrient Tracking (Medium Impact)
Only 4 macros tracked (calories, protein, carbs, fat). Fiber, sugar, and sodium are available from the USDA API but not stored or displayed. Add an expandable "Micronutrients" section to meal totals.

#### 2c. Ingredient Substitution Suggestions (Medium Impact)
Add a "Swap" action on each ingredient that searches for items in the same category with similar macros and shows a comparison view.

#### 2d. Cost Tracking (Low Impact)
Add an optional price field to ingredients with estimated meal and plan costs — valuable for budget-conscious meal preppers.

#### 2e. Meal Timing / Schedule (Low Impact)
Add optional time fields per meal for users who practice intermittent fasting or timed nutrition.

---

### 3. Output & Export Improvements

#### 3a. Enhanced PDF Export (High Impact)
Current PDF is a basic table. Improvements:
- Add a **visual macro breakdown** (pie/bar chart) using jsPDF drawing primitives
- Include the **calorie profile summary** (BMR, TDEE, goal) — `buildFullPlanExport.js` already computes this but isn't wired into the PDF
- Add a **shopping list section** to the PDF
- Support **multi-day PDF** if weekly planning is added

#### 3b. CSV/Spreadsheet Export (Medium Impact)
Many users track nutrition in spreadsheets. Add CSV export with columns: Meal, Ingredient, Grams, Calories, Protein, Carbs, Fat. Integrates with Google Sheets, Excel, and MyFitnessPal import.

#### 3c. Shareable Plan Links (Medium Impact)
Plans can only be shared via JSON file export/import. Generate a shareable URL (Firebase-hosted short link or encoded data) so recipients can view and optionally import plans.

#### 3d. Shopping List Standalone Export (Low Impact)
The shopping list is generated in-app but can't be exported independently. Add "Export Shopping List" as PDF, text file, or clipboard copy.

#### 3e. Wire Up `buildFullPlanExport.js` (Low Impact)
This tested module computes a rich export object (calorie profile, BMR, TDEE, scaled nutrition) but isn't used in the UI. Use it as the data source for enhanced PDF/CSV exports.

---

### 4. UI Layout Improvements

#### 4a. Break Up MealPrepCalculator.jsx (High Priority)
At **2,784 lines**, this is a monolith handling meal display, ingredient management, macro targets, plan CRUD, PDF export, JSON export, shopping list, and templates. Extract into:
- `MealSection.jsx` — single meal (breakfast/lunch/dinner/snack) with its ingredient list
- `MacroTargetEditor.jsx` — calorie target and percentage popover
- `PlanManager.jsx` — save/load/delete plan controls
- `ShoppingList.jsx` — shopping list generation and display
- `ExportControls.jsx` — PDF/JSON/copy actions

#### 4b. Mobile Touch Targets (Medium Priority)
Some buttons use MUI `size="small"` (36px), below the 44×44px WCAG AAA minimum for touch. Audit all interactive elements on mobile and set minimum touch target to 44px.

#### 4c. Contextual Empty States (Low Priority)
Empty states exist but are generic. When a meal has no ingredients, show "Add your first ingredient to breakfast" with an inline search field rather than a generic illustration.

#### 4d. Design Token Consistency (Low Priority)
Scattered hardcoded values for border radius (1, 2, 3, 9999), alpha transparency (0.06–0.4), and shadows. Define design tokens in the theme (`theme.custom.radius`, `theme.custom.alpha`) and apply consistently.

#### 4e. Accessibility Gaps
- Add `aria-live="polite"` for dynamically updating macro totals
- Add visible focus indicators (dark themes lose native focus rings)
- Ensure toast notifications are announced to screen readers
- Add landmark regions (`<nav>`, `<main>`) for screen reader navigation

---

## Priority Summary

| Priority | Recommendation | Category |
|----------|---------------|----------|
| **High** | Recipe/dish system | Workflow |
| **High** | Meal cloning/copy-paste | Workflow |
| **High** | Enhanced PDF export (charts, profile, shopping list) | Export |
| **High** | Break up MealPrepCalculator.jsx (2,784 lines) | UI/Maintainability |
| **Medium** | Weekly planning view | Workflow |
| **Medium** | Dietary tags & allergen filters | Features |
| **Medium** | Micronutrient tracking | Features |
| **Medium** | CSV/spreadsheet export | Export |
| **Medium** | Shareable plan links | Export |
| **Medium** | Mobile touch targets (44px min) | UI |
| **Low** | Calculator → planner handoff | Workflow |
| **Low** | Ingredient substitutions | Features |
| **Low** | Cost tracking | Features |
| **Low** | Shopping list standalone export | Export |
| **Low** | Wire up buildFullPlanExport.js | Export |
| **Low** | Design token consistency | UI |
| **Low** | Accessibility improvements | UI |
