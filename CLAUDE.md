# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- **Start development server**: `npm run dev`
- **Build for production**: `vite build` or `npm run build`
- **Lint code**: `npm run lint`
- **Preview production build**: `npm run preview`
- **Install dependencies**: `npm install`

## Project Architecture

This is a React + Vite meal preparation application with Firebase authentication and Nutritionix API integration.

### Core Structure
- **React 19** frontend with modern JSX and ES modules
- **Vite** for development and build tooling
- **Firebase** for user authentication (Google provider) and Firestore database
- **Nutritionix API** for ingredient nutrition data lookup
- **Mobile-responsive** design with CSS layouts that adapt to small screens

### Key Components
- `App.jsx` - Root component with auth routing (Login vs MealPrep)
- `UserContext.jsx` - Firebase auth state management using React Context
- `MealPrep.jsx` - Main app container with 5-tab navigation (Meal Planner, Calorie Calculator, Instructions, Ingredients, Account)
- `MealPrepCalculator.jsx` - Core meal planning and calculation logic with multi-meal support (breakfast, lunch, dinner, snack)
- `CalorieCalculator.jsx` - Standalone calorie calculation tool
- `IngredientManager.jsx` - Ingredient search and management interface with Nutritionix integration
- `MealPrepInstructions.jsx` - Static instructions and guidance
- `AccountPage.jsx` - User account management
- `Login.jsx` - Google OAuth authentication

### Data Management Architecture

**Three-Layer Storage System:**

1. **Local Storage Layer** (`src/utils/ingredientStorage.js`)
   - Primary data cache using localStorage
   - Custom ingredients stored with unique timestamp-based IDs (>= 1000)
   - Provides immediate data access without network calls

2. **Firebase Sync Layer** (`src/utils/api.js`)
   - Syncs custom ingredients to Firestore `settings/{uid}` document
   - Saves meal plans to Firestore `plans` collection with uid filtering
   - Stores baseline configuration in `settings/{uid}` document
   - All writes trigger local → remote sync

3. **External API Layer** (`src/utils/nutritionixApi.js`)
   - Searches Nutritionix API for ingredient nutrition data
   - Two endpoints: instant search and natural language nutrients
   - Results are added to local/remote storage for future use

**Data Flow:**
- User auth → `syncFromRemote()` pulls Firestore data → saves to localStorage
- Ingredient changes → save to localStorage → `saveRemote()` pushes to Firestore
- New ingredients via Nutritionix → add to localStorage → sync to Firestore

### Meal Planning Data Model

**Plan Structure:**
- Each plan contains `calorieTarget`, `targetPercentages` (protein/fat/carbs), and `matchDinner` flag
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

### Code Patterns
- Uses modern React patterns (hooks, context, functional components)
- ESLint configured with React hooks and refresh plugins
- Import paths use relative references (`./` and `../`)
- Firebase services imported from `src/utils/firebase.js`
- CSS classes follow kebab-case convention
- No TypeScript - uses JSX with PropTypes or runtime validation
- Icon library: `lucide-react` for UI icons
- PDF generation: `jspdf` and `jspdf-autotable` for meal plan exports

### Authentication Flow
1. App checks Firebase auth state via `UserContext`
2. Unauthenticated users see `Login` component (Google OAuth)
3. Authenticated users see `MealPrep` with data sync from Firestore
4. On auth: `syncFromRemote(user.uid)` pulls custom ingredients and baseline config
5. User profile photo and display name shown in header

### Mobile Considerations
- Navigation buttons stack vertically on small screens
- Tables use horizontal scroll when content exceeds viewport
- Touch-friendly button sizing and spacing
- Responsive breakpoints handled via CSS
- Share functionality uses Web Share API for mobile integration (shopping list → Reminders)