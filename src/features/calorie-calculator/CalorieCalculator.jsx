import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
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
  const loadProfile = useCallback(async () => {
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
  }, [user]);

  // Load profile on component mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);
  
  const goalCalories = getGoalCalories();
  
  const activityLevels = [
    { value: '1.2', label: 'Sedentary (little/no exercise)' },
    { value: '1.375', label: 'Light activity (light exercise 1-3 days/week)' },
    { value: '1.55', label: 'Moderate activity (moderate exercise 3-5 days/week)' },
    { value: '1.725', label: 'Very active (hard exercise 6-7 days/week)' },
    { value: '1.9', label: 'Extremely active (very hard exercise & physical job)' }
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 1.5, md: 3 } }}>
      <Card sx={{ borderRadius: 3 }} variant="outlined">
        <CardHeader
          title={
            <Stack spacing={1} alignItems="center" textAlign="center">
              <Typography variant="h5" fontWeight={800}>
                <span className="wiggle">🧮</span> Calorie Calculator
              </Typography>
              <Typography variant="body2" color="text.secondary" maxWidth={520}>
                Calculate your BMR and TDEE to determine your daily calorie needs
              </Typography>
            </Stack>
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            {/* Input Form */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
                <CardHeader title={<Typography variant="h6" fontWeight={800}>Your Information</Typography>} />
                <CardContent>
                  <Stack spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel id="units-label">Units</InputLabel>
                      <Select
                        labelId="units-label"
                        label="Units"
                        value={units}
                        onChange={(e) => handleUnitsChange(e.target.value)}
                      >
                        <MenuItem value="metric">Metric (kg, cm)</MenuItem>
                        <MenuItem value="imperial">Imperial (lbs, inches)</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel id="gender-label">Gender</InputLabel>
                      <Select
                        labelId="gender-label"
                        label="Gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                      >
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      type="number"
                      label="Age (years)"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      inputProps={{ min: 10, max: 100 }}
                    />

                    <TextField
                      type="number"
                      label={`Weight (${units === 'metric' ? 'kg' : 'lbs'})`}
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      inputProps={{
                        min: units === 'metric' ? 30 : 66,
                        max: units === 'metric' ? 300 : 660,
                        step: 0.1,
                      }}
                    />

                    <TextField
                      type="number"
                      label={`Height (${units === 'metric' ? 'cm' : 'inches'})`}
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      inputProps={{ min: units === 'metric' ? 100 : 39, max: units === 'metric' ? 250 : 98 }}
                    />

                    <FormControl fullWidth>
                      <InputLabel id="activity-label">Activity Level</InputLabel>
                      <Select
                        labelId="activity-label"
                        label="Activity Level"
                        value={activityLevel}
                        onChange={(e) => setActivityLevel(e.target.value)}
                      >
                        {activityLevels.map((level) => (
                          <MenuItem key={level.value} value={level.value}>
                            {level.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Weight Change Goal: {weightChangeRate > 0 ? '+' : ''}{weightChangeRate} lbs/week
                      </Typography>
                      <Slider
                        min={-3}
                        max={3}
                        step={0.5}
                        value={weightChangeRate}
                        onChange={(_, value) => setWeightChangeRate(value)}
                        marks={[
                          { value: -3, label: 'Lose 3' },
                          { value: 0, label: 'Maintain' },
                          { value: 3, label: 'Gain 3' },
                        ]}
                      />
                    </Box>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button fullWidth variant="contained" onClick={saveProfile}>
                        💾 Save Profile
                      </Button>
                      <Button fullWidth variant="outlined" onClick={loadProfile}>
                        📂 Load Profile
                      </Button>
                    </Stack>
                    {lastProfileSavedAt && (
                      <Typography variant="caption" color="text.secondary">
                        Last saved: {lastProfileSavedAt.toLocaleTimeString()}
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Results */}
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardHeader title={<Typography variant="h6" fontWeight={800}>Your Results</Typography>} />
                  <CardContent>
                    <Stack spacing={1.5}>
                      {[
                        { label: 'BMR (Base Metabolic Rate)', value: `${Math.round(bmr)} kcal/day`, color: 'primary.main' },
                        { label: 'TDEE (Total Daily Energy)', value: `${Math.round(tdee)} kcal/day`, color: 'success.main' },
                        { label: 'Target Daily Calories', value: `${Math.round(goalCalories)} kcal/day`, color: 'warning.main' },
                        ...(weightChangeRate !== 0
                          ? [{
                              label: 'Weekly Weight Change',
                              value: `${weightChangeRate > 0 ? '+' : ''}${weightChangeRate} lbs/week`,
                              color: weightChangeRate > 0 ? 'primary.main' : 'error.main',
                            }]
                          : []),
                        {
                          label: 'Calorie Adjustment',
                          value: `${weightChangeRate > 0 ? '+' : ''}${Math.round(weightChangeRate * 500)} kcal/day`,
                          color: weightChangeRate > 0 ? 'primary.main' : weightChangeRate < 0 ? 'error.main' : 'text.primary',
                        },
                      ].map((item) => (
                        <Stack direction="row" justifyContent="space-between" key={item.label}>
                          <Typography fontWeight={600}>{item.label}:</Typography>
                          <Typography fontWeight={800} color={item.color}>
                            {item.value}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>

                {/* Macros */}
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardHeader title={<Typography variant="h6" fontWeight={800}>Recommended Macros</Typography>} />
                  <CardContent>
                    <Stack spacing={1}>
                      {[
                        { label: 'Protein (30%)', grams: Math.round(goalCalories * 0.3 / 4) },
                        { label: 'Carbs (40%)', grams: Math.round(goalCalories * 0.4 / 4) },
                        { label: 'Fat (30%)', grams: Math.round(goalCalories * 0.3 / 9) },
                      ].map((item) => (
                        <Stack direction="row" justifyContent="space-between" key={item.label}>
                          <Typography>{item.label}</Typography>
                          <Typography fontWeight={700}>{item.grams}g</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>

                {/* Info */}
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardHeader title={<Typography variant="h6" fontWeight={800}>ℹ️ Understanding the Numbers</Typography>} />
                  <CardContent>
                    <Stack spacing={0.75}>
                      {[
                        'BMR: Calories your body needs at rest',
                        'TDEE: BMR + calories burned through activity',
                        'Goal Calories: Daily intake for your fitness goal',
                        '±500 calories: Approximately 1 lb weight change/week',
                      ].map((item) => (
                        <Typography key={item} variant="body2" color="text.secondary">
                          {item}
                        </Typography>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CalorieCalculator;
