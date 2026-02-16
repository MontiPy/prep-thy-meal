// src/test/testUtils.jsx
import React from "react";
import { render } from "@testing-library/react";
import { ThemeProvider } from "../shared/context/ThemeContext";
import { UserProvider } from "../features/auth/UserContext";

// Mock user data for testing
export const mockUser = {
  uid: "test-user-123",
  email: "test@example.com",
  displayName: "Test User",
  photoURL: "https://example.com/photo.jpg",
};

// Mock ingredient data
export const mockIngredient = {
  id: 1001,
  name: "Test Chicken Breast",
  calories: 165,
  protein: 31,
  carbs: 0,
  fat: 3.6,
  gramsPerUnit: 100,
  unit: "g",
};

// Mock meal plan data
export const mockMealPlan = {
  id: "plan-123",
  uid: "test-user-123",
  name: "Test Plan",
  calorieTarget: 2000,
  targetPercentages: {
    protein: 30,
    fat: 25,
    carbs: 45,
  },
  matchDinner: false,
  meals: {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  },
};

/**
 * Custom render function that wraps components with all necessary providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @param {Object} options.user - Mock user object (null for unauthenticated)
 * @param {string} options.theme - 'light' or 'dark'
 * @returns {Object} - Render result from @testing-library/react
 */
export const renderWithProviders = (ui, options = {}) => {
  const { user = mockUser, theme = "light", ...renderOptions } = options;

  // Create a wrapper with all providers
  const Wrapper = ({ children }) => (
    <ThemeProvider initialTheme={theme}>
      <UserProvider initialUser={user}>{children}</UserProvider>
    </ThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Helper to wait for async operations
 * @param {number} ms - Milliseconds to wait
 */
export const wait = (ms = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Re-export commonly used utilities from @testing-library/react
export {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
