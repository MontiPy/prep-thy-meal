// src/components/MealPrep.jsx
import React, { useState } from "react";
import MealPrepCalculator from "./MealPrepCalculator";
import MealPrepInstructions from "./MealPrepInstructions";
import IngredientManager from "./IngredientManager";
import { getAllBaseIngredients } from "../utils/nutritionHelpers";

const TABS = {
  CALCULATOR: "calculator",
  INSTRUCTIONS: "instructions",
  INGREDIENTS: "ingredients",
};

const MealPrep = () => {
  const [activeTab, setActiveTab] = useState(TABS.CALCULATOR);
  const [allIngredients, setAllIngredients] = useState(getAllBaseIngredients());

  const handleIngredientChange = (list) => {
    setAllIngredients(list);
  };

  return (
    <div className="app-container">
      <nav className="nav-bar">
        <button
          className={
            activeTab === TABS.CALCULATOR
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() => setActiveTab(TABS.CALCULATOR)}
        >
          Calculator
        </button>
        <button
          className={
            activeTab === TABS.INSTRUCTIONS ? "nav-button active" : "nav-button"
          }
          onClick={() => setActiveTab(TABS.INSTRUCTIONS)}
        >
          Instructions
        </button>
        <button
          className={
            activeTab === TABS.INGREDIENTS ? "nav-button active" : "nav-button"
          }
          onClick={() => setActiveTab(TABS.INGREDIENTS)}
        >
          Ingredients
        </button>
      </nav>

      <div key={activeTab} className="tab-content">
        {activeTab === TABS.CALCULATOR ? (
          <MealPrepCalculator allIngredients={allIngredients} />
        ) : activeTab === TABS.INSTRUCTIONS ? (
          <MealPrepInstructions />
        ) : (
          <IngredientManager onChange={handleIngredientChange} />
        )}
      </div>
    </div>
  );
};

export default MealPrep;
