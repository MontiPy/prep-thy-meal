// src/components/OnboardingModal.jsx
import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

const OnboardingModal = ({ isOpen, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: '👋 Welcome to Prep Thy Meal!',
      description: 'Your personal meal planning companion',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Plan your meals, track nutrition, and achieve your fitness goals with ease.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              ✨ What you can do:
            </h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Plan meals across 4 daily categories</li>
              <li>• Track calories and macronutrients</li>
              <li>• Search 800,000+ ingredients via Nutritionix</li>
              <li>• Save and manage multiple meal plans</li>
              <li>• Export shopping lists as PDFs</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: '🥗 Meal Planner',
      description: 'Build your perfect meal plan',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            The Meal Planner is where the magic happens. Add ingredients to each meal and watch your nutrition totals update in real-time.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 dark:bg-green-900 rounded-lg p-3">
              <div className="text-2xl mb-2">🍳</div>
              <h5 className="font-semibold text-sm dark:text-gray-200">Breakfast</h5>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Start your day right
              </p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-3">
              <div className="text-2xl mb-2">🥪</div>
              <h5 className="font-semibold text-sm dark:text-gray-200">Lunch</h5>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Midday fuel
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900 rounded-lg p-3">
              <div className="text-2xl mb-2">🍽️</div>
              <h5 className="font-semibold text-sm dark:text-gray-200">Dinner</h5>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Evening nutrition
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-3">
              <div className="text-2xl mb-2">🍎</div>
              <h5 className="font-semibold text-sm dark:text-gray-200">Snack</h5>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Extra energy
              </p>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Pro tip:</strong> Use the + and - buttons to quickly adjust quantities, or use meal templates for instant planning!
            </p>
          </div>
        </div>
      )
    },
    {
      title: '🔍 Finding Ingredients',
      description: 'Search, favorite, and manage ingredients',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Access the Ingredients tab to search our database of 800,000+ foods or create your own custom ingredients.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl">🔍</div>
              <div>
                <h5 className="font-semibold text-sm dark:text-gray-200">Nutritionix Search</h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Type any food name to find detailed nutrition data
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl">⭐</div>
              <div>
                <h5 className="font-semibold text-sm dark:text-gray-200">Favorites</h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Star your frequently used ingredients for quick access
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl">📝</div>
              <div>
                <h5 className="font-semibold text-sm dark:text-gray-200">Custom Ingredients</h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Create your own ingredients with custom nutrition values
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '⌨️ Keyboard Shortcuts',
      description: 'Work faster with shortcuts',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Speed up your workflow with keyboard shortcuts.
          </p>
          <div className="space-y-2">
            {[
              { keys: ['1-5'], description: 'Switch between tabs' },
              { keys: ['Ctrl', 'S'], description: 'Save current plan' },
              { keys: ['Ctrl', 'Z'], description: 'Undo last action' },
              { keys: ['Ctrl', 'E'], description: 'Export to PDF' },
              { keys: ['?'], description: 'View all shortcuts' },
            ].map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {shortcut.description}
                </span>
                <div className="flex gap-1">
                  {shortcut.keys.map((key, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span className="text-gray-400 mx-1">+</span>}
                      <kbd className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
                        {key}
                      </kbd>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">?</kbd> anytime to see all shortcuts
          </p>
        </div>
      )
    },
    {
      title: '🎉 You\'re All Set!',
      description: 'Start planning your meals',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            You're ready to start planning! Here are some quick tips to get you started:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900 rounded-lg">
              <div className="text-2xl">💡</div>
              <div>
                <h5 className="font-semibold text-sm dark:text-gray-200">Start with Templates</h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Use meal templates for quick planning, then customize to your needs
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <div className="text-2xl">⚖️</div>
              <div>
                <h5 className="font-semibold text-sm dark:text-gray-200">Set Your Calorie Target</h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Use the Calorie Calculator tab to determine your daily needs
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900 rounded-lg">
              <div className="text-2xl">💾</div>
              <div>
                <h5 className="font-semibold text-sm dark:text-gray-200">Save Multiple Plans</h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Create different plans for different days or goals
                </p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-4 rounded">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Remember:</strong> Your data syncs automatically when you're signed in. Meal prep has never been easier!
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 id="onboarding-title" className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">
                {step.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {step.description}
              </p>
            </div>
            <button
              onClick={handleSkip}
              className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Skip onboarding"
            >
              <X size={20} />
            </button>
          </div>
          {/* Progress dots */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-blue-600'
                    : index < currentStep
                    ? 'w-2 bg-green-600'
                    : 'w-2 bg-gray-300 dark:bg-gray-600'
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step.content}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            Step {currentStep + 1} of {steps.length}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            {isLastStep ? (
              <>
                Get Started
                <Check size={20} />
              </>
            ) : (
              <>
                Next
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
