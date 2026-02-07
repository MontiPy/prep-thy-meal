# UI Assessment - Prep Thy Meal

## Scope
- Static review of layout, theme, and core feature UI. No runtime or device testing.

## Overall
- The primary workflow (planner -> calculator -> ingredients -> account) is easy to discover and visually consistent inside the planner and calculator.
- The ingredient tooling is functionally rich, but its styling diverges from the rest of the app and from the theme system, which will cause dark-mode and consistency issues.

## Strengths
- Clear top-level navigation with tabs on desktop and bottom navigation on mobile (`src/shared/components/layout/MealPrep.jsx`).
- Strong macro focus with progress summaries, target vs actual deltas, and inline guidance (`src/features/meal-planner/MealPrepCalculator.jsx`, `src/features/calorie-calculator/CalorieCalculator.jsx`).
- Helpful onboarding and contextual help content (`src/shared/components/onboarding/OnboardingModal.jsx`).
- Thoughtful mobile fallbacks for dense tables and actions (`src/features/meal-planner/MealPrepCalculator.jsx`, `src/features/ingredients/IngredientManager.jsx`).
- Consistent card layouts and spacing across planner and calculator, with clear CTAs.

## Priority Issues and Risks
- High: Theme inconsistencies in dark mode due to hard-coded colors and non-theme tokens. This risks low contrast or unreadable text when the palette switches. Major offenders are in the ingredient feature and several modals (`src/features/ingredients/IngredientManager.jsx`, `src/features/ingredients/ServingSizePreviewModal.jsx`, `src/features/meal-planner/MealTemplateSelector.jsx`).
- High: Palette token misuse (e.g., `primary.50`, `primary.200`, `info.50`, `info.200`) likely resolves to invalid CSS or no-op colors. These appear in the calculator and info panels and weaken visual hierarchy (`src/features/calorie-calculator/CalorieCalculator.jsx`).
- High: Macro progress bars likely render as indeterminate because `LinearProgress` is set to `variant="determined"` instead of `determinate`, which makes the progress UI unreliable (`src/shared/components/ui/MacroProgressBar.jsx`).
- Medium: Meal planner table totals row is missing the "Grams" column alignment, so totals may appear under the wrong headers in desktop view (`src/features/meal-planner/MealPrepCalculator.jsx`).
- Medium: Mixed icon libraries (lucide-react and MUI) create inconsistent stroke weights and visual tone across screens (`src/shared/components/layout/MealPrep.jsx`, `src/features/meal-planner/MealPrepCalculator.jsx`, `src/features/ingredients/IngredientManager.jsx`, `src/features/calorie-calculator/CalorieCalculator.jsx`).
- Medium: Dense button grids for goal and macro presets can become cramped on small screens (four columns at `xs=3`), reducing tap accuracy (`src/features/calorie-calculator/CalorieCalculator.jsx`).
- Medium: Snackbars/alerts are anchored at the bottom center and may overlap the fixed bottom nav on mobile, reducing visibility of actions (`src/features/meal-planner/MealPrepCalculator.jsx`, `src/shared/components/layout/MealPrep.jsx`).
- Low: Several icon-only buttons lack `aria-label` and rely on tooltips, which are less usable on touch devices (`src/features/ingredients/IngredientManager.jsx`, `src/features/meal-planner/MealPrepCalculator.jsx`).

## Page-Level Notes
### Meal Planner
- Strong information structure: header summary, macro budget cards, meal accordions, and sticky summary sidebar.
- Table layout is dense; it will be hard to scan without horizontal breathing room on medium screens (`src/features/meal-planner/MealPrepCalculator.jsx`).
- Macro target editing is discoverable, but the popover lacks explicit validation feedback beyond adjustment text (`src/features/meal-planner/MacroTargetPopover.jsx`).

### Calorie Calculator
- Well-structured two-column layout with clear input grouping and a strong "Apply to Meal Planner" CTA.
- Bodyweight method and advanced method are easy to switch, but preset button grids are tight on small screens.
- Visual hierarchy inside the results column is good, but some highlight colors will not render as intended due to missing palette tokens (`src/features/calorie-calculator/CalorieCalculator.jsx`).

### Ingredients
- Feature-rich experience (OCR, smart paste, USDA search), but visual styling is inconsistent with the rest of the app and not theme-aware.
- Extensive use of hard-coded light-mode colors will clash in dark mode and reduce contrast (`src/features/ingredients/IngredientManager.jsx`, `src/features/ingredients/ServingSizePreviewModal.jsx`).

### Instructions
- Simple, readable format. The single long card could benefit from subsections or navigation if more content is added (`src/features/instructions/MealPrepInstructions.jsx`).

### Account and Onboarding
- Good use of cards and messaging for guest vs authenticated flows (`src/features/account/AccountPage.jsx`).
- Onboarding modal is clear and action-driven but prevents escape key close; verify this is the desired behavior (`src/shared/components/onboarding/OnboardingModal.jsx`).

## Accessibility and Interaction
- Many buttons use a 44px minimum height, but not all interactive elements follow this (chips, icon buttons, table controls).
- Tooltips are used extensively; consider alternate affordances for touch devices.
- Color-only status signaling appears in multiple places (over/under budget, macro warnings). Consider adding icons or labels for clarity.

## Recommendations (Next Pass)
- Normalize colors to theme tokens and remove hard-coded hex values in feature UIs.
- Fix macro progress bar variant and table totals alignment.
- Standardize icon sets to a single library to reduce style drift.
- Add responsive tweaks for preset button grids and bottom snackbars on mobile.
- Audit aria-label coverage for icon-only actions.

## Implementation Plan
1) Theme consistency: replace hard-coded colors with theme tokens and define missing palette slots.
2) Functional UI fixes: correct progress bar variant and planner table alignment issues.
3) Visual coherence: standardize icon set and typography treatment across features.
4) Responsive polish: adjust dense button grids and snackbar placement for mobile.
5) Accessibility pass: add aria-labels and non-color status cues.

## Checklist
- [X] Replace hard-coded colors in ingredient UI with `theme.palette` tokens.
- [X] Add explicit custom palette values for `primary.50`, `primary.200`, `info.50`, `info.200` or switch to supported tokens.
- [X] Fix `LinearProgress` variant to `determinate` in macro progress bars.
- [X] Correct planner totals row cell alignment so totals sit under the right column headers.
- [X] Choose a single icon library (MUI or lucide) and update mismatched icons.
- [X] Update macro preset button grid breakpoints for small screens.
- [X] Move/offset snackbars to avoid overlap with bottom navigation on mobile.
- [X] Add `aria-label` to icon-only buttons (move up/down, delete, edit, etc.).
- [X] Add non-color status indicators for over/under budget and macro warnings.
