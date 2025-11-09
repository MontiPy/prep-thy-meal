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
- `MealPrep.jsx` - Main app container with tabbed navigation (Calculator, Instructions, Ingredients)
- `MealPrepCalculator.jsx` - Core meal planning and calculation logic
- `IngredientManager.jsx` - Ingredient search and management interface

### Data Management
- **Local Storage**: Primary storage for ingredient data (`src/utils/storage.js`)
- **Firebase Sync**: User-specific ingredient data syncs to Firestore when authenticated
- **Nutrition API**: Real-time ingredient lookup via Nutritionix (`src/utils/nutritionixApi.js`)
- **Data Flow**: Local → Firebase sync → Nutritionix lookup for new ingredients

### Environment Configuration
Requires `.env` file with:
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

### Code Patterns
- Uses modern React patterns (hooks, context, functional components)
- ESLint configured with React hooks and refresh plugins
- Import paths use relative references (`./` and `../`)
- Firebase services imported from `src/utils/firebase.js`
- CSS classes follow kebab-case convention
- No TypeScript - uses JSX with PropTypes or runtime validation

### Authentication Flow
1. App checks Firebase auth state via `UserContext`
2. Unauthenticated users see `Login` component (Google OAuth)
3. Authenticated users see `MealPrep` with data sync from Firestore
4. Local ingredient data syncs to user's Firestore collection on auth

### Mobile Considerations
- Navigation buttons stack vertically on small screens
- Tables use horizontal scroll when content exceeds viewport
- Touch-friendly button sizing and spacing
- Responsive breakpoints handled via CSS