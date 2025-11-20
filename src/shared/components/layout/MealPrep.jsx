// src/shared/components/layout/MealPrep.jsx
import React, { useState, useEffect } from "react";
import MealPrepCalculator from "../../../features/meal-planner/MealPrepCalculator";
import MealPrepInstructions from "../../../features/instructions/MealPrepInstructions";
import IngredientManager from "../../../features/ingredients/IngredientManager";
import CalorieCalculator from "../../../features/calorie-calculator/CalorieCalculator";
import AccountPage from "../../../features/account/AccountPage";
import ErrorBoundary from "../ui/ErrorBoundary";
import { getAllBaseIngredients } from "../../../features/ingredients/nutritionHelpers";
import { syncFromRemote } from "../../../features/ingredients/ingredientStorage";
import { useUser } from "../../../features/auth/UserContext";

const TABS = {
  CALCULATOR: "calculator",
  CALORIE_CALC: "calorie-calc", 
  INSTRUCTIONS: "instructions",
  INGREDIENTS: "ingredients",
  ACCOUNT: "account",
};

const MealPrep = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState(TABS.CALCULATOR);
  const [allIngredients, setAllIngredients] = useState(getAllBaseIngredients());
  const [lastSync, setLastSync] = useState(null);

  const handleIngredientChange = (list) => {
    setAllIngredients(list);
  };

  useEffect(() => {
    if (user) {
      syncFromRemote(user.uid).then(() => {
        setAllIngredients(getAllBaseIngredients());
        setLastSync(new Date());
      });
    } else {
      setAllIngredients(getAllBaseIngredients());
      setLastSync(new Date());
    }
  }, [user]);

  return (
    <div className="app-container pb-20 md:pb-0">
      {/* User Info Bar */}
      <div className="flex items-center justify-between mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
          )}
          {!user?.photoURL && (
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
              {(user?.displayName || 'User').charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium text-gray-700 dark:text-gray-200">
            Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
          </span>
          {user?.email && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{user.email}</span>
          )}
        </div>
        <div className="flex flex-col items-end text-sm text-gray-500 dark:text-gray-400">
          <span>Prep Thy Meal</span>
          {lastSync && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Synced {lastSync.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Desktop nav */}
      <nav className="nav-bar hidden md:flex">
        <button
          className={
            activeTab === TABS.CALCULATOR
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() => setActiveTab(TABS.CALCULATOR)}
        >
          🥗 Meal Planner
        </button>
        <button
          className={
            activeTab === TABS.CALORIE_CALC ? "nav-button active" : "nav-button"
          }
          onClick={() => setActiveTab(TABS.CALORIE_CALC)}
        >
          🧮 Calorie Calculator
        </button>
        <button
          className={
            activeTab === TABS.INSTRUCTIONS ? "nav-button active" : "nav-button"
          }
          onClick={() => setActiveTab(TABS.INSTRUCTIONS)}
        >
          📋 Instructions
        </button>
        <button
          className={
            activeTab === TABS.INGREDIENTS ? "nav-button active" : "nav-button"
          }
          onClick={() => setActiveTab(TABS.INGREDIENTS)}
        >
          🥘 Ingredients
        </button>
        <button
          className={
            activeTab === TABS.ACCOUNT ? "nav-button active" : "nav-button"
          }
          onClick={() => setActiveTab(TABS.ACCOUNT)}
        >
          👤 Account
        </button>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="fixed md:hidden bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40">
        <div className="flex justify-between">
          {[
            { key: TABS.CALCULATOR, label: "Plan", icon: "🥗" },
            { key: TABS.CALORIE_CALC, label: "Calories", icon: "🧮" },
            { key: TABS.INSTRUCTIONS, label: "Guide", icon: "📋" },
            { key: TABS.INGREDIENTS, label: "Ingredients", icon: "🥘" },
            { key: TABS.ACCOUNT, label: "Account", icon: "👤" },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2 text-xs flex flex-col items-center gap-1 ${
                activeTab === key
                  ? "text-blue-600 font-semibold"
                  : "text-gray-600 dark:text-gray-300"
              }`}
              aria-label={label}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div key={activeTab} className="tab-content">
        {activeTab === TABS.CALCULATOR && (
          <ErrorBoundary message="An error occurred in the Meal Planner. Try switching tabs or refreshing.">
            <MealPrepCalculator allIngredients={allIngredients} />
          </ErrorBoundary>
        )}
        {activeTab === TABS.CALORIE_CALC && (
          <ErrorBoundary message="An error occurred in the Calorie Calculator. Try switching tabs or refreshing.">
            <CalorieCalculator />
          </ErrorBoundary>
        )}
        {activeTab === TABS.INSTRUCTIONS && (
          <ErrorBoundary message="An error occurred loading the instructions. Try switching tabs or refreshing.">
            <MealPrepInstructions />
          </ErrorBoundary>
        )}
        {activeTab === TABS.INGREDIENTS && (
          <ErrorBoundary message="An error occurred in the Ingredient Manager. Try switching tabs or refreshing.">
            <IngredientManager onChange={handleIngredientChange} />
          </ErrorBoundary>
        )}
        {activeTab === TABS.ACCOUNT && (
          <ErrorBoundary message="An error occurred in the Account page. Try switching tabs or refreshing.">
            <AccountPage />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
};

export default MealPrep;
