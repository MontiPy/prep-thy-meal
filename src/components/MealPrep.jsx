// src/components/MealPrep.jsx
import React, { useState } from "react";
import MealPrepCalculator from "./MealPrepCalculator";
import MealPrepInstructions from "./MealPrepInstructions";

const TABS = {
  CALCULATOR: "calculator",
  INSTRUCTIONS: "instructions",
};

const MealPrep = () => {
  const [activeTab, setActiveTab] = useState(TABS.CALCULATOR);

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
      </nav>

      {activeTab === TABS.CALCULATOR ? (
        <MealPrepCalculator />
      ) : (
        <MealPrepInstructions />
      )}
    </div>
  );
};

export default MealPrep;
