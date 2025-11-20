import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useUser } from '../auth/UserContext.jsx';

const CalorieCalculator = () => {
  const { user } = useUser();
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState('male');
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);
  const [activityLevel, setActivityLevel] = useState('1.55');
  const [goal, setGoal] = useState('maintain');
  const [units, setUnits] = useState('metric');
  const [weightChangeRate, setWeightChangeRate] = useState(0); // -3 to +3 lbs per week
  const [lastProfileSavedAt, setLastProfileSavedAt] = useState(null);
  
  // Convert units to metric for calculation
  const getMetricValues = () => {
    if (units === 'metric') {
      return { weightKg: weight, heightCm: height };
    } else {
      // Convert imperial to metric
      const weightKg = weight * 0.453592; // lbs to kg
      const heightCm = height * 2.54; // inches to cm
      return { weightKg, heightCm };
    }
  };

  // Calculate BMR using Mifflin-St Jeor Equation (always uses metric internally)
  const calculateBMR = () => {
    const { weightKg, heightCm } = getMetricValues();
    if (gender === 'male') {
      return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }
  };

  // Handle unit switching
  const handleUnitsChange = (newUnits) => {
    if (newUnits === units) return;
    
    if (newUnits === 'imperial') {
      // Convert metric to imperial
      setWeight(Math.round(weight * 2.20462 * 10) / 10); // kg to lbs
      setHeight(Math.round(height / 2.54)); // cm to inches
    } else {
      // Convert imperial to metric
      setWeight(Math.round(weight * 0.453592 * 10) / 10); // lbs to kg
      setHeight(Math.round(height * 2.54)); // inches to cm
    }
    setUnits(newUnits);
  };
  
  const bmr = calculateBMR();
  const tdee = bmr * parseFloat(activityLevel);
  
  // Calculate goal calories based on weight change rate
  const getGoalCalories = () => {
    // 1 lb = approximately 3500 calories
    // So 1 lb/week = 500 cal/day deficit/surplus
    const calorieAdjustment = weightChangeRate * 500;
    return tdee + calorieAdjustment;
  };

  // Save profile to localStorage/cloud
  const saveProfile = async () => {
    const profile = {
      age,
      gender,
      weight,
      height,
      activityLevel,
      goal,
      units,
      weightChangeRate,
      savedAt: new Date().toISOString()
    };

    // Save to localStorage
    localStorage.setItem('calorieCalculatorProfile', JSON.stringify(profile));
    setLastProfileSavedAt(new Date());

    // Save to cloud if user is logged in
    if (user) {
      try {
        const { getFirestore, doc, setDoc } = await import('firebase/firestore');
        const db = getFirestore();
        await setDoc(doc(db, 'userProfiles', user.uid), {
          calorieProfile: profile
        }, { merge: true });
        toast.success('Profile saved successfully!');
      } catch (error) {
        console.error('Error saving to cloud:', error);
        toast.warning('Profile saved locally. Please check your internet connection for cloud sync.');
      }
    } else {
      toast.success('Profile saved locally. Sign in to sync across devices.');
    }
  };

  // Load profile from localStorage/cloud
  const loadProfile = async () => {
    try {
      let profile = null;

      // Try to load from cloud first if user is logged in
      if (user) {
        try {
          const { getFirestore, doc, getDoc } = await import('firebase/firestore');
          const db = getFirestore();
          const docRef = doc(db, 'userProfiles', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().calorieProfile) {
            profile = docSnap.data().calorieProfile;
          }
        } catch (error) {
          console.error('Error loading from cloud:', error);
        }
      }

      // Fall back to localStorage if cloud loading failed or no cloud data
      if (!profile) {
        const saved = localStorage.getItem('calorieCalculatorProfile');
        if (saved) {
          profile = JSON.parse(saved);
        }
      }

      // Apply loaded profile
      if (profile) {
        setAge(profile.age || 30);
        setGender(profile.gender || 'male');
        setWeight(profile.weight || 70);
        setHeight(profile.height || 175);
        setActivityLevel(profile.activityLevel || '1.55');
        setGoal(profile.goal || 'maintain');
        setUnits(profile.units || 'metric');
        setWeightChangeRate(profile.weightChangeRate || 0);
        if (profile.savedAt) {
          setLastProfileSavedAt(new Date(profile.savedAt));
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  // Load profile on component mount
  useEffect(() => {
    loadProfile();
  }, [user]);
  
  const goalCalories = getGoalCalories();
  
  const activityLevels = [
    { value: '1.2', label: 'Sedentary (little/no exercise)' },
    { value: '1.375', label: 'Light activity (light exercise 1-3 days/week)' },
    { value: '1.55', label: 'Moderate activity (moderate exercise 3-5 days/week)' },
    { value: '1.725', label: 'Very active (hard exercise 6-7 days/week)' },
    { value: '1.9', label: 'Extremely active (very hard exercise & physical job)' }
  ];

  return (
    <div className="calculator">
      <div className="card">
        <div className="center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            <span className="wiggle">🧮</span> Calorie Calculator
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Calculate your BMR and TDEE to determine your daily calorie needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="panel-blue">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Your Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Units
                </label>
                <select
                  value={units}
                  onChange={(e) => handleUnitsChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md"
                >
                  <option value="metric">Metric (kg, cm)</option>
                  <option value="imperial">Imperial (lbs, inches)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Age (years)
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md"
                  min="10"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Weight ({units === 'metric' ? 'kg' : 'lbs'})
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md"
                  min={units === 'metric' ? '30' : '66'}
                  max={units === 'metric' ? '300' : '660'}
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Height ({units === 'metric' ? 'cm' : 'inches'})
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md"
                  min={units === 'metric' ? '100' : '39'}
                  max={units === 'metric' ? '250' : '98'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Activity Level
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md"
                >
                  {activityLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Weight Change Goal: {weightChangeRate > 0 ? '+' : ''}{weightChangeRate} lbs/week
                </label>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.5"
                  value={weightChangeRate}
                  onChange={(e) => setWeightChangeRate(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Lose 3 lbs/week</span>
                  <span>Maintain</span>
                  <span>Gain 3 lbs/week</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={saveProfile}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  💾 Save Profile
                </button>
                <button
                  onClick={loadProfile}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  📂 Load Profile
                </button>
              </div>
              {lastProfileSavedAt && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Last saved: {lastProfileSavedAt.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="panel-green">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Your Results</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">BMR (Base Metabolic Rate):</span>
                  <span className="font-bold text-blue-600">{Math.round(bmr)} kcal/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">TDEE (Total Daily Energy):</span>
                  <span className="font-bold text-green-600">{Math.round(tdee)} kcal/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Target Daily Calories:</span>
                  <span className="font-bold text-orange-600">{Math.round(goalCalories)} kcal/day</span>
                </div>
                {weightChangeRate !== 0 && (
                  <div className="flex justify-between">
                    <span className="font-medium">Weekly Weight Change:</span>
                    <span className={`font-bold ${weightChangeRate > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {weightChangeRate > 0 ? '+' : ''}{weightChangeRate} lbs/week
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">Calorie Adjustment:</span>
                  <span className={`font-bold ${weightChangeRate > 0 ? 'text-blue-600' : weightChangeRate < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {weightChangeRate > 0 ? '+' : ''}{Math.round(weightChangeRate * 500)} kcal/day
                  </span>
                </div>
              </div>
            </div>
            
            {/* Macros Recommendation */}
            <div className="panel-yellow">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">Recommended Macros</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Protein (30%):</span>
                  <span className="font-medium">{Math.round(goalCalories * 0.3 / 4)}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Carbs (40%):</span>
                  <span className="font-medium">{Math.round(goalCalories * 0.4 / 4)}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Fat (30%):</span>
                  <span className="font-medium">{Math.round(goalCalories * 0.3 / 9)}g</span>
                </div>
              </div>
            </div>
            
            {/* Info */}
            <div className="panel-gray">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">ℹ️ Understanding the Numbers</h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li><strong>BMR:</strong> Calories your body needs at rest</li>
                <li><strong>TDEE:</strong> BMR + calories burned through activity</li>
                <li><strong>Goal Calories:</strong> Daily intake for your fitness goal</li>
                <li><strong>±500 calories:</strong> Approximately 1 lb weight change/week</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalorieCalculator;
