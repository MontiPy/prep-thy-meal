# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` contains the entry points (`main.jsx`, `App.jsx`) and app bootstrapping.
- `src/features/` holds feature areas (auth, ingredients, meal-planner, calorie-calculator, instructions).
- `src/shared/` provides reusable UI components, hooks, constants, and services (Firebase, storage, USDA/OFF).
- `src/test/` includes Vitest setup and mocks; unit tests are colocated as `*.test.js|*.test.jsx`.
- Static assets live in `public/` and `src/assets/`. Build output goes to `dist/`.

## Build, Test, and Development Commands
- `npm run dev` starts the Vite dev server with HMR.
- `npm run build` builds production assets into `dist/`.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint on the repo.
- `npm run test` runs Vitest in watch mode.
- `npm run test:run` runs tests once (CI-friendly).
- `npm run test:coverage` generates coverage reports (text/json/html).
- `npm run test:ui` opens the Vitest UI runner.

## Coding Style & Naming Conventions
- JavaScript/JSX, ES modules; 2-space indentation and semicolons (match existing files).
- React components use `PascalCase` filenames and exports (e.g., `MealPrep.jsx`).
- Utility modules use `camelCase` filenames (e.g., `nutritionHelpers.js`).
- Keep tests alongside the module using `*.test.js|*.test.jsx`.
- Linting uses ESLint with React Hooks + React Refresh rules (`eslint.config.js`).

## Testing Guidelines
- Frameworks: Vitest + Testing Library (`@testing-library/react`, `@testing-library/user-event`) with `jsdom`.
- Global setup is in `src/test/setup.js`; reuse helpers in `src/test/testUtils.jsx`.
- Prefer unit tests colocated with features and shared utilities; name tests by behavior.
- Coverage: run `npm run test:coverage` before shipping larger changes.

## Commit & Pull Request Guidelines
- History is mixed, but prefer conventional commit prefixes like `feat:`, `fix:`, `chore:`.
- Keep the subject short and imperative (e.g., `feat: add macro presets`).
- PRs should include: a concise summary, testing notes, and screenshots for UI changes.
- Link related issues when applicable.

## Configuration & Secrets
- Copy `.env.example` to `.env` and fill in Firebase plus USDA API keys.
- README mentions Nutritionix credentials; confirm required keys in code before committing.
- Never commit `.env` files or API keys.
