# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- **Start development server**: `npm run dev`
- **Build for production**: `vite build` or `npm run build`
- **Run tests** (watch mode): `npm test` or `npm run test`
- **Run tests** (single run): `npm run test:run`
- **Run tests with UI**: `npm run test:ui`
- **Run tests with coverage**: `npm run test:coverage`
- **Lint code**: `npm run lint`
- **Preview production build**: `npm run preview`
- **Install dependencies**: `npm install`

## Project Architecture

This is a React + Vite meal preparation application with Firebase authentication and Nutritionix API integration.

### Core Structure
- **React 19** frontend with modern JSX and ES modules
- **Vite** for development and build tooling
- **Tailwind CSS v4** for styling with class-based dark mode support
- **Vitest** with @testing-library/react for unit and component testing
- **Firebase** for user authentication (Google provider) and Firestore database
- **Nutritionix API** for ingredient nutrition data lookup
- **react-hot-toast** for user notifications and feedback
- **Mobile-responsive** design with Tailwind's responsive utilities

### Folder Structure

The project follows a **feature-based architecture** for better organization and scalability:

```
src/
├── app/                          # Application entry point
│   ├── App.jsx                   # Root component with providers
│   └── main.jsx                  # Vite entry point
├── features/                     # Feature modules (domain-driven)
│   ├── auth/                     # Authentication feature
│   │   ├── Login.jsx
│   │   └── UserContext.jsx
│   ├── meal-planner/             # Meal planning feature
│   │   ├── MealPrepCalculator.jsx
│   │   ├── IngredientCard.jsx
│   │   └── MealTemplateSelector.jsx
│   ├── ingredients/              # Ingredient management feature
│   │   ├── IngredientManager.jsx
│   │   ├── ingredientStorage.js
│   │   ├── nutritionHelpers.js
│   │   ├── favorites.js
│   │   └── *.test.js             # Co-located tests
│   ├── calorie-calculator/       # Calorie calculator feature
│   │   └── CalorieCalculator.jsx
│   ├── account/                  # Account management feature
│   │   └── AccountPage.jsx
│   └── instructions/             # Instructions feature
│       └── MealPrepInstructions.jsx
├── shared/                       # Shared/reusable code
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── Tooltip.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── SkeletonLoader.jsx
│   │   ├── layout/               # Layout components
│   │   │   ├── MealPrep.jsx      # Main app layout
│   │   │   ├── ThemeToggle.jsx
│   │   │   └── OfflineBanner.jsx
│   │   └── onboarding/           # Onboarding components
│   │       ├── OnboardingModal.jsx
│   │       └── KeyboardShortcutsHelp.jsx
│   ├── hooks/                    # Shared React hooks
│   │   ├── useKeyboardShortcuts.js
│   │   └── useUndoRedo.js
│   ├── context/                  # Global context providers
│   │   └── ThemeContext.jsx
│   ├── services/                 # External services
│   │   ├── firebase.js           # Firebase config
│   │   ├── firestore.js          # Firestore operations
│   │   ├── nutritionix.js        # Nutritionix API
│   │   ├── storage.js            # Storage facade
│   │   └── onboarding.js         # Onboarding storage
│   └── utils/                    # Shared utilities
│       ├── mealTemplates.js
│       └── recentIngredients.js
├── index.css                     # Global styles
└── App.css                       # Component styles
```

**Architecture Principles:**
- **Feature folders** contain all related code for a specific domain (components, utilities, tests)
- **Shared folder** contains code used across multiple features
- **Co-located tests** live next to the code they test
- **Clear boundaries** between features prevent tight coupling
- **Import paths** reflect the architecture (e.g., `../../shared/components/ui/LoadingSpinner`)

### Key Components

**Main Application Components:**
- `App.jsx` - Root component with auth routing, toast notifications, and theme/error boundary providers
- `MealPrep.jsx` - Main app container with 5-tab navigation (Meal Planner, Calorie Calculator, Instructions, Ingredients, Account)
- `Login.jsx` - Google OAuth authentication interface

**Feature Components:**
- `MealPrepCalculator.jsx` - Core meal planning and calculation logic with multi-meal support (breakfast, lunch, dinner, snack)
- `CalorieCalculator.jsx` - Standalone calorie/macronutrient calculator with user profile persistence
- `IngredientManager.jsx` - Ingredient search and management interface with Nutritionix integration
- `MealPrepInstructions.jsx` - Static instructions and guidance
- `AccountPage.jsx` - User account management

**Reusable UI Components:**
- `IngredientCard.jsx` - Card component for displaying ingredient details with quantity controls and nutrition info
- `ConfirmDialog.jsx` - Reusable confirmation dialog with variant support (danger/warning/info)
- `ThemeToggle.jsx` - Dark/light mode toggle button
- `ErrorBoundary.jsx` - React error boundary component for graceful error handling
- `LoadingSpinner.jsx` - Reusable loading indicator component

**Context Providers:**
- `UserContext.jsx` - Firebase auth state management using React Context
- `ThemeContext.jsx` - Dark mode theme management with localStorage persistence and system preference detection

### Data Management Architecture

**Three-Layer Storage System:**

1. **Local Storage Layer** (`src/features/ingredients/ingredientStorage.js`)
   - Primary data cache using localStorage
   - Custom ingredients stored with unique timestamp-based IDs (>= 1000)
   - Provides immediate data access without network calls

2. **Firebase Sync Layer** (`src/shared/services/firestore.js`)
   - Syncs custom ingredients to Firestore `settings/{uid}` document
   - Saves meal plans to Firestore `plans` collection with uid filtering
   - Stores baseline configuration in `settings/{uid}` document
   - All writes trigger local → remote sync

3. **External API Layer** (`src/shared/services/nutritionix.js`)
   - Searches Nutritionix API for ingredient nutrition data
   - Two endpoints: instant search and natural language nutrients
   - Results are added to local/remote storage for future use

**Data Flow:**
- User auth → `syncFromRemote()` pulls Firestore data → merges with local custom ingredients (remote wins on conflicts)
- Ingredient changes (via IngredientManager) → save to localStorage → persist to Firestore through `saveCustomIngredients()`
- New ingredients via Nutritionix → added as custom ingredients (local + Firestore)

**Additional Storage Systems:**
- **Favorites** (`src/features/ingredients/favorites.js`): localStorage-based favorites system for frequently used ingredients
- **Storage Facade** (`src/shared/services/storage.js`): Convenience wrapper that re-exports firestore.js functions for plan/baseline operations
- **Theme Preference** (`src/shared/context/ThemeContext.jsx`): Dark/light mode preference stored in localStorage with system preference fallback
  - Auth loading states use the shared `LoadingSpinner` component

### Meal Planning Data Model

**Plan Structure:**
- Each plan contains `calorieTarget`, `targetPercentages` (protein/fat/carbs), and `matchDinner` flag (mirrors lunch → dinner when true)
- Plans store all 4 meals (breakfast, lunch, dinner, snack) with ingredient references
- Ingredients stored as `{id, grams, quantity}` tuples
- Legacy format supported (plans with only `ingredients` field map to lunch)

**Baseline vs Plans:**
- Baseline: Default configuration loaded on app start from `settings/{uid}.baseline`
- Plans: Named configurations stored in `plans` collection, user can switch between them
- Both support the same data structure with backward compatibility

**Ingredient Quantity System:**
- Each ingredient has `unit` field: either "g" (gram-based) or "unit" (serving-based)
- `gramsPerUnit`: Reference serving size in grams
- `quantity`: Number of units (for unit-based) or grams (for gram-based)
- `grams`: Total grams calculated from quantity × gramsPerUnit
- Nutrition values (calories, protein, carbs, fat) are per `gramsPerUnit`

### Firebase Firestore Schema

```
/plans/{planId}
  - uid: string (user ID)
  - name: string
  - calorieTarget: number
  - targetPercentages: { protein, fat, carbs }
  - matchDinner: boolean
  - meals: { breakfast, lunch, dinner, snack } (each array of {id, grams, quantity})
  - ingredients: array (legacy field for backward compatibility)

/settings/{uid}
  - baseline: { calorieTarget, targetPercentages, matchDinner, meals, ingredients }
  - customIngredients: array of ingredient objects
```

### Firebase Firestore Security Rules

**IMPORTANT:** Configure these security rules in your Firebase console to protect user data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Plans collection - users can only access their own plans
    match /plans/{planId} {
      allow read, create: if request.auth != null &&
                           request.resource.data.uid == request.auth.uid;
      allow update, delete: if request.auth != null &&
                             resource.data.uid == request.auth.uid;
    }

    // Settings collection - users can only access their own settings
    match /settings/{uid} {
      allow read, write: if request.auth != null &&
                         request.auth.uid == uid;
    }

    // User profiles for CalorieCalculator
    match /userProfiles/{uid} {
      allow read, write: if request.auth != null &&
                         request.auth.uid == uid;
    }
  }
}
```

**Security Features Implemented:**
- Ownership validation: All plan operations verify `uid` matches authenticated user
- Read/write separation: Plans have separate rules for create vs update/delete
- Path-based protection: Settings and profiles use document ID matching for access control
- Authentication required: All operations require valid Firebase authentication

**Code-Level Security:**
- `assertPlanOwnership()` function in `src/shared/services/firestore.js` validates ownership before operations
- Race condition protection: UID checks prevent stale data updates
- Firebase Auth integration: User context provides authenticated user state

### Environment Configuration

Requires `.env` file (use `.env.example` as template):
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_NUTRITIONIX_APP_ID=
VITE_NUTRITIONIX_API_KEY=
```

Setup requirements:
1. Copy `.env.example` to `.env`
2. Create Firebase project and enable Google authentication provider
3. Add Firebase config values to `.env`
4. Sign up for Nutritionix API and add credentials

### Testing Infrastructure

**Test Framework:** Vitest with @testing-library/react

**Test Files Location:**
- Unit tests alongside source files: `*.test.js` (e.g., `ingredientConversions.test.js`)
- Integration tests in: `src/test/` directory
- Test setup configuration: `src/test/setup.js`
- Vitest configuration: `vitest.config.js`

**Running Tests:**
- `npm test` - Run all tests in watch mode
- `npm run test:ui` - Run tests with Vitest UI interface
- `npm run test:coverage` - Generate code coverage report

**Test Utilities:**
- React Testing Library: DOM testing utilities for component tests
- Current tests focus on utility functions; Firebase modules are not yet mocked
- Custom test helpers in `src/test/` directory

**Testing Patterns:**
- **Utility Functions**: Test pure calculation functions (nutrition helpers, conversions, matching algorithms)
- **Component Rendering**: Test that components render correctly with different props
- **User Interactions**: Simulate clicks, input changes, and form submissions
- **Data Flow**: Verify localStorage and Firebase sync operations
- **Error Handling**: Test error boundaries and error states

**Example Test Files:**
- `src/features/ingredients/ingredientConversions.test.js` - Unit conversion logic tests
- `src/features/ingredients/matchDinner.test.js` - Meal matching algorithm tests
- `src/features/ingredients/nutritionHelpers.test.js` - Nutrition calculation tests

### Code Patterns
- Uses modern React patterns (hooks, context, functional components)
- ESLint configured with React hooks and refresh plugins
- Import paths use relative references (`./` and `../`)
- Firebase services imported from `src/shared/services/firebase.js`
- **Tailwind CSS** for styling with utility classes and dark mode variants (`dark:` prefix)
- No TypeScript and no PropTypes/runtime validation in components
- Icon library: `lucide-react` for UI icons
- Toast notifications: `react-hot-toast` for user feedback
- PDF generation: `jspdf` and `jspdf-autotable` for meal plan exports

### Authentication Flow
1. App checks Firebase auth state via `UserContext`
2. Unauthenticated users see `Login` component (Google OAuth)
3. Authenticated users see `MealPrep` with data sync from Firestore
4. On auth: `syncFromRemote(user.uid)` pulls custom ingredients and baseline config
5. User profile photo and display name shown in header

### Dark Mode Implementation
- **Class-based dark mode** using Tailwind's `dark:` variant
- **ThemeContext** manages theme state across the application
- **ThemeToggle** component provides UI for switching themes
- **Persistence**: Theme preference saved to localStorage
- **System preference detection**: Defaults to `prefers-color-scheme` media query
- **Dark variants**: All components support dark mode styling with `dark:` utility classes

### Mobile Considerations
- Mobile bottom navigation bar (MealPrep) is fixed at the footer; ensure views leave bottom padding
- Ingredient Manager renders card layouts on mobile; desktop uses tables with horizontal scroll
- Tables use horizontal scroll when content exceeds viewport
- Touch-friendly button sizing (minimum 44×44px tap targets)
- Responsive breakpoints handled via Tailwind CSS utilities
- Share functionality uses Web Share API for mobile integration (shopping list → Reminders)
- Dark mode automatically adapts to system preference on first load
- Offline banner appears when `navigator.onLine` is false; Nutritionix search is disabled offline

## User Experience Improvement Roadmap

This section documents planned and potential UX improvements based on comprehensive codebase review.

### Completed Features ✅
- Dark mode with system preference detection
- Mobile-responsive design
- Favorites system for ingredients
- Offline detection and banner
- PDF export functionality
- Multi-plan management
- Nutritionix API integration
- Toast notifications for feedback
- **NEW: Keyboard shortcuts system** with help modal (press `?`)
- **NEW: Undo/Redo functionality** via `useUndoRedo` hook
- **NEW: Recent ingredients tracking** (last 10 used ingredients)
- **NEW: Meal templates library** (16 predefined + custom templates)
- **NEW: First-time user onboarding** (5-step interactive tutorial)
- **NEW: Tooltip component** for better UX guidance
- **NEW: Loading skeletons** for improved perceived performance

### High Priority Improvements 🎯

**1. First-Time User Onboarding**
- Interactive tutorial on first login
- Feature highlights for each tab
- Sample meal plan demonstration
- Dismissible contextual tips

**2. Undo/Redo System**
- Action history for meal planning
- Keyboard shortcuts (Ctrl+Z/Ctrl+Y)
- Toast-based undo prompts
- Last 20 actions tracked

**3. Quick Access Features**
- Recently used ingredients section
- One-click ingredient addition
- Combined with favorites system
- Speeds up common workflows

**4. Keyboard Shortcuts**
- Tab navigation (1-5 for tabs)
- Save/Export shortcuts (Ctrl+S, Ctrl+E)
- Search focus (Ctrl+F)
- Quantity adjustments (+/-)
- Modal closing (Escape)

**5. Meal Templates Library**
- Pre-configured common meals
- User-saved custom templates
- One-click meal population
- Categorized by meal type

### Medium Priority Enhancements 🔨

**6. Nutritional Insights**
- Smart warnings (low protein, low fiber)
- Color-coded macro indicators
- Nutrition score grading
- Micronutrient tracking suggestions

**7. Progress Tracking**
- Weekly/monthly nutrition trends
- Weight tracking integration
- Streak counters for goals
- Historical data visualization

**8. Enhanced Search**
- Autocomplete suggestions
- Recent searches dropdown
- Multi-criteria filters
- Saved filter presets
- Typo correction

**9. Batch Operations**
- Multi-select ingredients
- Bulk delete/favorite
- Bulk quantity scaling
- Meal duplication
- Copy between meals

**10. Drag & Drop Reordering**
- Visual ingredient reordering
- Drag between meals
- Touch device support
- Snap animations

### Future Enhancements 🚀

**11. PWA Capabilities**
- manifest.json for installation
- Service worker for offline
- Push notifications
- Native app experience

**12. Extended Export Formats**
- Excel/CSV export
- Social media images
- Calendar integration
- Recipe card format

**13. Collaboration Features**
- Shareable plan links
- Public template gallery
- Community ratings
- Plan discovery

**14. AI-Powered Suggestions**
- Pattern-based recommendations
- Smart ingredient substitutions
- Auto-complete meals
- Personalized suggestions

**15. Advanced Mobile UX**
- Swipe gestures
- Pull-to-refresh
- Haptic feedback
- Voice input
- Barcode scanning

**16. Accessibility Compliance**
- WCAG 2.1 AA standards
- Full keyboard navigation
- Screen reader optimization
- High contrast mode
- Focus indicators

**17. Data Portability**
- Full data export (JSON)
- Import with validation
- Automated backups
- Version history
- Sync status visibility

**18. UI Customization**
- Accent color selection
- Density options (compact/comfortable)
- Column visibility toggles
- Font size adjustment
- Custom meal emojis

### Quick Wins (Low Effort, High Impact) ⚡
- ✅ Loading skeletons during data fetch (IMPLEMENTED)
- ✅ Tooltips on hover (IMPLEMENTED)
- "Clear all" buttons per meal
- One-click plan duplication
- Ingredient thumbnails from API
- Changelog for updates
- Unsaved changes confirmation
- Prominent "Last saved" indicator
- Search term highlighting
- Empty state illustrations

## Implementation Guide for New Features

### 1. Keyboard Shortcuts (`useKeyboardShortcuts` hook)

**Location**: `src/shared/hooks/useKeyboardShortcuts.js`

**Usage Example**:
```javascript
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

function MyComponent() {
  const handleSave = () => { /* save logic */ };
  const handleUndo = () => { /* undo logic */ };

  useKeyboardShortcuts({
    'ctrl+s': handleSave,
    'ctrl+z': handleUndo,
    'escape': () => setModalOpen(false)
  }, [handleSave, handleUndo]);

  return <div>...</div>;
}
```

**Features**:
- Platform-aware (Cmd on Mac, Ctrl on Windows/Linux)
- Ignores shortcuts when typing in inputs (except Escape)
- Help modal component: `KeyboardShortcutsHelp.jsx`
- Press `?` to show keyboard shortcuts help

### 2. Undo/Redo System (`useUndoRedo` hook)

**Location**: `src/shared/hooks/useUndoRedo.js`

**Usage Example**:
```javascript
import { useUndoRedo } from '../hooks/useUndoRedo';

function MealPlanner() {
  const {
    state: mealIngredients,
    setState: setMealIngredients,
    undo,
    redo,
    canUndo,
    canRedo
  } = useUndoRedo(initialIngredients, 20); // 20 = history length

  // Use setState instead of regular useState setter
  const addIngredient = (ing) => {
    setMealIngredients([...mealIngredients, ing]);
  };

  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
    </div>
  );
}
```

**Features**:
- Automatic history tracking (max 20 states by default)
- Doesn't add to history during undo/redo actions
- Returns `canUndo` and `canRedo` for button states

### 3. Recent Ingredients Tracking

**Location**: `src/shared/utils/recentIngredients.js`

**API**:
- `addToRecentIngredients(ingredientId)` - Add ingredient to recent list
- `loadRecentIngredients()` - Get array of recent ingredient IDs
- `getRecentIngredientsWithData(allIngredients)` - Get full ingredient objects
- `clearRecentIngredients()` - Clear history

**Integration**:
Call `addToRecentIngredients(id)` whenever user adds an ingredient to a meal.
Display recent ingredients in a "Quick Add" section for faster workflow.

### 4. Meal Templates System

**Location**: `src/shared/utils/mealTemplates.js`, `src/features/meal-planner/MealTemplateSelector.jsx`

**Predefined Templates**:
- Breakfast: Oatmeal, Eggs & Toast, Protein Smoothie, Greek Yogurt Bowl
- Lunch: Chicken & Rice, Salmon & Quinoa, Turkey Sandwich
- Dinner: Steak & Potatoes, Pasta Bolognese, Chicken Stir-Fry
- Snack: Protein Bar, Apple & Peanut Butter, Trail Mix

**API**:
- `getTemplatesByCategory(category)` - Get all templates for a meal type
- `applyTemplate(template, allIngredients)` - Convert template to ingredient list
- `saveCustomTemplate(template)` - Save user's current meal as template
- `deleteCustomTemplate(templateId)` - Delete custom template

**Component Usage**:
```javascript
import MealTemplateSelector from './MealTemplateSelector';

<MealTemplateSelector
  isOpen={showTemplates}
  onClose={() => setShowTemplates(false)}
  mealType="breakfast"
  allIngredients={allIngredients}
  currentMealIngredients={breakfast}
  onApplyTemplate={(ingredients) => {
    setBreakfast(ingredients);
  }}
/>
```

### 5. First-Time User Onboarding

**Location**: `src/shared/components/onboarding/OnboardingModal.jsx`, `src/shared/services/onboarding.js`

**Integration**:
```javascript
import OnboardingModal from './OnboardingModal';
import { hasCompletedOnboarding, completeOnboarding } from '../utils/onboardingStorage';

function App() {
  const [showOnboarding, setShowOnboarding] = useState(!hasCompletedOnboarding());

  const handleOnboardingComplete = () => {
    completeOnboarding();
    setShowOnboarding(false);
  };

  return (
    <>
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
      {/* rest of app */}
    </>
  );
}
```

**Features**:
- 5-step interactive tutorial
- Progress dots for navigation
- Skippable at any time
- Stored in localStorage (won't show again)
- Use `resetOnboarding()` to force show again (for testing)

### 6. Tooltip Component

**Location**: `src/shared/components/ui/Tooltip.jsx`

**Usage**:
```javascript
import Tooltip from './Tooltip';

<Tooltip content="Click to save your plan" position="top" delay={300}>
  <button>Save</button>
</Tooltip>
```

**Props**:
- `content`: Text to display in tooltip
- `position`: 'top' | 'bottom' | 'left' | 'right' (default: 'top')
- `delay`: Milliseconds before showing (default: 300)

### 7. Loading Skeletons

**Location**: `src/shared/components/ui/SkeletonLoader.jsx`

**Available Components**:
- `Skeleton` - Base component
- `IngredientCardSkeleton` - For ingredient cards
- `TableRowSkeleton` - For table rows
- `StatCardSkeleton` - For stat/summary cards
- `MealSectionSkeleton` - For meal sections
- `PlanCardSkeleton` - For plan cards
- `SearchResultSkeleton` - For search results
- `PageSkeleton` - Full page skeleton

**Usage**:
```javascript
import { IngredientCardSkeleton, MealSectionSkeleton } from './SkeletonLoader';

function MyComponent() {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <MealSectionSkeleton />;
  }

  return <div>{/* actual content */}</div>;
}
```

## Integration Checklist for New Features

To integrate these features into existing components:

**MealPrepCalculator.jsx**:
- [ ] Replace `useState` for `mealIngredients` with `useUndoRedo`
- [ ] Add keyboard shortcuts (Ctrl+S, Ctrl+Z, Ctrl+Y, Ctrl+E)
- [ ] Add "Templates" button for each meal section
- [ ] Call `addToRecentIngredients()` when adding ingredients
- [ ] Show recent ingredients in a quick-add section
- [ ] Add loading skeletons while data loads
- [ ] Add tooltips to action buttons

**IngredientManager.jsx**:
- [ ] Add keyboard shortcut for search focus (Ctrl+F)
- [ ] Show recent ingredients section at top
- [ ] Add loading skeletons for search results
- [ ] Add tooltips to action buttons

**MealPrep.jsx** (Root):
- [ ] Add `OnboardingModal` that shows on first visit
- [ ] Add keyboard shortcuts for tab switching (1-5)
- [ ] Add keyboard shortcut to show shortcuts help (?)
- [ ] Wrap initial data load with skeleton loaders

**App.jsx**:
- [ ] Add global keyboard shortcut listener
- [ ] Add `KeyboardShortcutsHelp` modal component

## Testing New Features

All new utilities have been designed to be testable:

```bash
# Run tests
npm test

# Test specific features
npm test -- useUndoRedo
npm test -- mealTemplates
npm test -- recentIngredients
```

**Manual Testing Checklist**:
- [ ] Press `?` to open keyboard shortcuts help
- [ ] Test Ctrl+Z/Ctrl+Y undo/redo in meal planning
- [ ] Verify recent ingredients appear after adding to meals
- [ ] Test meal template selector for all 4 meal types
- [ ] Complete onboarding flow on first visit
- [ ] Hover over buttons to see tooltips
- [ ] Verify loading skeletons appear during data fetch
