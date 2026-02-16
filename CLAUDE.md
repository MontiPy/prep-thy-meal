# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Prep Thy Meal is a React-based meal planning application with macro tracking, calorie calculation, and nutrition management. It supports both authenticated (Firebase) and guest (localStorage) modes, with automatic migration when users sign in.

## Development Commands

```bash
# Development
npm run dev              # Start Vite dev server with HMR
npm run build            # Production build to dist/
npm run preview          # Serve production build locally
npm run lint             # Run ESLint

# Testing
npm test                 # Run Vitest in watch mode
npm run test:run         # Single test run (CI-friendly)
npm run test:coverage    # Generate coverage reports (text/json/html)
npm run test:ui          # Open Vitest UI runner
```

## Architecture Overview

### Module Organization

- **`src/app/`** - Entry point (`main.jsx`, `App.jsx`) and root-level providers
- **`src/features/`** - Feature modules, each self-contained with components and logic
  - `auth/` - Firebase authentication and UserContext
  - `ingredients/` - Ingredient management, OCR, USDA/OpenFoodFacts integration
  - `meal-planner/` - Core meal planning UI and nutrition calculations
  - `calorie-calculator/` - TDEE and macro target calculator
  - `account/` - User account and preferences
  - `instructions/` - Help and documentation
- **`src/shared/`** - Reusable code across features
  - `components/` - UI components (layout, ui, onboarding)
  - `services/` - External integrations and data layer
  - `hooks/` - Custom React hooks
  - `context/` - Global context providers
  - `constants/` - Validation rules and config
  - `utils/` - Utility functions
- **`src/test/`** - Test setup and mocks (colocate tests with source files)

### Data Architecture

**Dual Storage System**: The app uses a storage facade pattern that routes to either Firebase (authenticated users) or localStorage (guest users).

- **Storage Facade** (`src/shared/services/storage.js`): Single API that routes to guest or Firebase based on auth state
- **Firebase** (`src/shared/services/firestore.js`): Firestore operations with retry logic and offline resilience
- **Guest Storage** (`src/shared/services/guestStorage.js`): localStorage-based persistence
- **Migration** (`src/shared/services/guestMigration.js`): Automatically migrates guest data to Firebase on sign-in

**Key Data Flows**:
1. Components call `storage.js` functions (e.g., `loadPlans`, `addPlan`, `updatePlan`)
2. Storage facade checks `uid` and routes to appropriate backend
3. Guest data lives in localStorage keys (`guestPlans`, `guestIngredients`, etc.)
4. Firebase data lives in Firestore collections (`plans`, `settings`, `ingredients`)

### State Management

- **Global State**: Context providers for auth (`UserContext`) and theme (`ThemeContext`)
- **Local State**: React `useState` within feature components
- **Undo/Redo**: Custom `useUndoRedo` hook (`src/shared/hooks/useUndoRedo.js`) for meal planner history
- **Performance**: Ingredient cache (`nutritionHelpers.js`) avoids repeated localStorage parsing

### Key Integrations

- **Firebase**: Authentication (Google OAuth) and Firestore for data persistence
- **USDA FoodData Central API**: Nutrition data search (requires API key in `.env`)
- **OpenFoodFacts API**: Barcode and product search (no key required)
- **Tesseract.js**: Offline OCR for nutrition label scanning
- **Material-UI (MUI)**: Component library and theming system
- **jsPDF**: PDF export for meal plans (lazy loaded)

## Configuration

1. Copy `.env.example` to `.env` and configure:
   - Firebase credentials (6 variables: API key, auth domain, project ID, storage bucket, messaging sender ID, app ID)
   - USDA API key (get free key from https://fdc.nal.usda.gov/api-key-signup.html)
2. Enable Google authentication provider in Firebase Console
3. No ingredients are preloaded; users add via search or manual entry

## Testing Strategy

- **Framework**: Vitest + Testing Library (`@testing-library/react`, `user-event`) with jsdom
- **Setup**: `src/test/setup.js` runs before all tests (cleanup, jest-dom matchers)
- **Mocks**: Reusable mocks in `src/test/mocks/` (Firebase, localStorage)
- **Helpers**: `src/test/testUtils.jsx` provides wrapped render with providers
- **Colocation**: Place tests next to source files as `*.test.js` or `*.test.jsx`
- **Coverage**: Excludes `node_modules/`, `src/test/`, test files, and `main.jsx`

## Code Style

- **Language**: JavaScript (no TypeScript), ES modules
- **Formatting**: 2-space indentation, semicolons (match existing code)
- **Naming**:
  - React components: PascalCase files and exports (`MealPrep.jsx`)
  - Utilities: camelCase files (`nutritionHelpers.js`)
  - Tests: Same name with `.test.js` suffix
- **ESLint**: React Hooks and React Refresh rules enabled (`eslint.config.js`)

## Important Patterns

### Theme Usage

- Use Material-UI theme tokens (`theme.palette.*`) instead of hard-coded colors
- Custom palette extensions defined in `ThemeContext.jsx`
- Theme persists to localStorage and respects system preferences
- **IMPORTANT**: Avoid using non-standard palette tokens like `primary.50` or `info.200` that don't exist in default MUI theme

### Ingredient System

- **Cache**: `nutritionHelpers.js` maintains an in-memory cache of ingredients
- **Invalidation**: Call `invalidateIngredientCache()` after any ingredient mutations
- **Normalization**: All ingredients pass through `normalizeIngredient()` for consistent structure
- **Serving Sizes**: Multi-unit support (grams, oz, cups, etc.) with conversion logic

### Performance Considerations

- Ingredient cache reduces localStorage parsing overhead
- PDF library (jsPDF) is lazy loaded to reduce initial bundle size
- Vitest coverage reports help identify optimization opportunities

## UI Architecture

- **Layout**: Tab navigation on desktop, bottom navigation on mobile (`MealPrep.jsx`)
- **Responsive**: Heavy use of MUI Grid and `useMediaQuery` for mobile/desktop layouts
- **Notifications**: `react-hot-toast` for global toast notifications (configured in `App.jsx`)
- **Theme**: Light/dark mode toggle persisted to localStorage
- **Offline**: `OfflineBanner` warns users when network is unavailable

## Common Gotchas

1. **Storage Operations**: Always use `storage.js` facade, never call firestore/guestStorage directly
2. **Ingredient Cache**: Mutations must call `invalidateIngredientCache()` or stale data will appear
3. **Auth State**: Check `user` from `useUser()` hook, not Firebase auth directly
4. **Theme Tokens**: Only use standard MUI palette tokens or custom ones defined in ThemeContext
5. **Undo/Redo**: Only works in meal planner; other features don't have history
6. **Firebase Rules**: Ensure Firestore security rules allow user access to their own documents

## Git Workflow

- Conventional commits preferred: `feat:`, `fix:`, `chore:`
- Keep subject imperative and under 50 chars
- Include co-author line for AI assistance: `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`
