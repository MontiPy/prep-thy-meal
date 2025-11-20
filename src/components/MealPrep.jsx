// src/components/MealPrep.jsx
import React, { useState, useEffect } from "react";
import MealPrepCalculator from "./MealPrepCalculator";
import MealPrepInstructions from "./MealPrepInstructions";
import IngredientManager from "./IngredientManager";
import CalorieCalculator from "./CalorieCalculator";
import AccountPage from "./AccountPage";
import { getAllBaseIngredients } from "../utils/nutritionHelpers";
import { syncFromRemote } from "../utils/ingredientStorage";
import { useUser } from "../context/UserContext.jsx";

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

  const handleIngredientChange = (list) => {
    setAllIngredients(list);
  };

  useEffect(() => {
    if (user) {
      syncFromRemote(user.uid).then(() =>
        setAllIngredients(getAllBaseIngredients())
      );
    } else {
      setAllIngredients(getAllBaseIngredients());
    }
  }, [user]);

  return (
    <div className="app-container">
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
          <span className="font-medium text-gray-700 dark:text-gray-200">
            Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
          </span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">Prep Thy Meal</span>
      </div>

      <nav className="nav-bar">
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

      <div key={activeTab} className="tab-content">
        {activeTab === TABS.CALCULATOR && (
          <MealPrepCalculator allIngredients={allIngredients} />
        )}
        {activeTab === TABS.CALORIE_CALC && <CalorieCalculator />}
        {activeTab === TABS.INSTRUCTIONS && <MealPrepInstructions />}
        {activeTab === TABS.INGREDIENTS && (
          <IngredientManager onChange={handleIngredientChange} />
        )}
        {activeTab === TABS.ACCOUNT && <AccountPage />}
      </div>
    </div>
  );
};

export default MealPrep;
