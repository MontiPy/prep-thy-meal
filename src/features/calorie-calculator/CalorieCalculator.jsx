import React, { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Popover,
  Select,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Flame,
  Info,
  ArrowRight,
  AlertTriangle,
  Save,
  FolderOpen,
} from "lucide-react";
import { useUser } from "../auth/UserContext.jsx";
import { validateAllMacros } from "../../shared/utils/macroValidation.js";
import MacroWarnings from "../../shared/components/ui/MacroWarnings.jsx";

// Preset configurations
const GOAL_PRESETS = {
  cut: { label: "Cut", weeklyChange: -1 },
  maintain: { label: "Maintain", weeklyChange: 0 },
  bulk: { label: "Lean Bulk", weeklyChange: 0.5 },
  custom: { label: "Custom", weeklyChange: null },
};

const MACRO_PRESETS = {
  balanced: { label: "Balanced", p: 30, c: 40, f: 30 },
  highProtein: { label: "High-Protein", p: 40, c: 35, f: 25 },
  endurance: { label: "Endurance", p: 25, c: 55, f: 20 },
  custom: { label: "Custom", p: null, c: null, f: null },
};

const ACTIVITY_LEVELS = {
  sedentary: { mult: 1.2, label: "Sedentary (desk job, little exercise)" },
  light: { mult: 1.375, label: "Light (1-3 workouts/week)" },
  moderate: { mult: 1.55, label: "Moderate (3-5 workouts/week)" },
  high: { mult: 1.725, label: "High (6-7 workouts/week)" },
  athlete: { mult: 1.9, label: "Athlete (hard training + active job)" },
};

const CalorieCalculator = () => {
  const { user } = useUser();
  const theme = useTheme();

  // User inputs
  const [units, setUnits] = useState("imperial");
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState(32);
  const [weight, setWeight] = useState(195);
  const [height, setHeight] = useState(72);
  const [activity, setActivity] = useState("light");

  // Goal settings
  const [goalPreset, setGoalPreset] = useState("maintain");
  const [weeklyChange, setWeeklyChange] = useState(0);

  // Macro settings
  const [macroMethod, setMacroMethod] = useState("bodyweight"); // "percentage" or "bodyweight"
  const [macroPreset, setMacroPreset] = useState("balanced");
  const [macroSplit, setMacroSplit] = useState({ p: 30, c: 40, f: 30 });

  // Bodyweight-based macro settings
  const [proteinPerLb, setProteinPerLb] = useState(1.0);
  const [fatPerLb, setFatPerLb] = useState(0.3);

  // Profile state
  const [lastProfileSavedAt, setLastProfileSavedAt] = useState(null);

  // Helper popover state
  const [helpAnchor, setHelpAnchor] = useState(null);
  const [helpContent, setHelpContent] = useState(null);

  const handleHelpClick = (event, content) => {
    setHelpAnchor(event.currentTarget);
    setHelpContent(content);
  };

  const handleHelpClose = () => {
    setHelpAnchor(null);
    setHelpContent(null);
  };

  // Handle goal preset changes
  useEffect(() => {
    if (goalPreset !== "custom") {
      setWeeklyChange(GOAL_PRESETS[goalPreset].weeklyChange);
    }
  }, [goalPreset]);

  // Handle macro preset changes
  useEffect(() => {
    if (macroPreset !== "custom") {
      const preset = MACRO_PRESETS[macroPreset];
      setMacroSplit({ p: preset.p, c: preset.c, f: preset.f });
    }
  }, [macroPreset]);

  // Normalize macro split to always sum to 100
  const setSplit = (next) => {
    const clamp = (n) => Math.max(0, Math.min(100, n));
    let p = clamp(next.p ?? macroSplit.p);
    let c = clamp(next.c ?? macroSplit.c);
    let f = clamp(next.f ?? macroSplit.f);
    const sum = p + c + f;
    if (sum !== 100) {
      c = clamp(c + (100 - sum));
    }
    setMacroSplit({ p, c, f });
  };

  // Handle unit switching with conversion
  const handleUnitsChange = (newUnits) => {
    if (newUnits === units) return;
    if (newUnits === "imperial") {
      setWeight(Math.round(weight * 2.20462 * 10) / 10);
      setHeight(Math.round(height / 2.54));
    } else {
      setWeight(Math.round(weight * 0.453592 * 10) / 10);
      setHeight(Math.round(height * 2.54));
    }
    setUnits(newUnits);
  };

  // Calculate all values
  const { bmr, tdee, target, adjustment, macros, percentages, warning, validation } = useMemo(() => {
    // Convert to metric for calculation
    const wKg = units === "imperial" ? weight * 0.453592 : weight;
    const hCm = units === "imperial" ? height * 2.54 : height;

    // Mifflin-St Jeor
    const s = gender === "male" ? 5 : -161;
    const bmrCalc = 10 * wKg + 6.25 * hCm - 5 * age + s;

    const activityMult = ACTIVITY_LEVELS[activity].mult;
    const tdeeCalc = bmrCalc * activityMult;

    // Weekly change to daily calorie delta
    const lbsPerWeek = units === "imperial" ? weeklyChange : weeklyChange * 2.20462;
    const dailyDelta = (lbsPerWeek * 3500) / 7;
    const targetCalc = tdeeCalc + dailyDelta;

    // Calculate macros in grams
    let macrosCalc;
    let actualPercentages;

    if (macroMethod === "bodyweight") {
      // Bodyweight-based calculation
      const bodyweightLbs = units === "imperial" ? weight : weight * 2.20462;

      // Protein: fixed grams based on bodyweight
      const proteinGrams = Math.round(bodyweightLbs * proteinPerLb);
      const proteinCals = proteinGrams * 4;

      // Fat: fixed grams based on bodyweight
      const fatGrams = Math.round(bodyweightLbs * fatPerLb);
      const fatCals = fatGrams * 9;

      // Carbs: remaining calories
      const carbCals = targetCalc - proteinCals - fatCals;
      const carbGrams = Math.round(Math.max(0, carbCals / 4));

      macrosCalc = {
        p: proteinGrams,
        c: carbGrams,
        f: fatGrams,
      };

      // Calculate actual percentages for display
      actualPercentages = {
        p: Math.round((proteinCals / targetCalc) * 100),
        c: Math.round((carbCals / targetCalc) * 100),
        f: Math.round((fatCals / targetCalc) * 100),
      };
    } else {
      // Percentage-based calculation (legacy)
      const pCal = (macroSplit.p / 100) * targetCalc;
      const cCal = (macroSplit.c / 100) * targetCalc;
      const fCal = (macroSplit.f / 100) * targetCalc;
      macrosCalc = {
        p: Math.round(pCal / 4),
        c: Math.round(cCal / 4),
        f: Math.round(fCal / 9),
      };
      actualPercentages = macroSplit;
    }

    // Check for warnings
    const deficitPct = (tdeeCalc - targetCalc) / tdeeCalc;
    let warningMsg = null;
    if (deficitPct > 0.25) {
      warningMsg = "Aggressive cut (>25% deficit). Consider a smaller weekly loss.";
    }
    if (targetCalc < 1200) {
      warningMsg = "Target calories are very low. Re-check inputs or choose a gentler goal.";
    }

    // Validate macros against bodyweight and research-based ranges
    const bodyweightLbs = units === "imperial" ? weight : weight * 2.20462;
    const validationResult = validateAllMacros({
      proteinGrams: macrosCalc.p,
      fatGrams: macrosCalc.f,
      carbGrams: macrosCalc.c,
      totalCalories: Math.round(targetCalc),
      bodyweightLbs,
      activityLevel: activity,
    });

    return {
      bmr: Math.round(bmrCalc),
      tdee: Math.round(tdeeCalc),
      target: Math.round(targetCalc),
      adjustment: Math.round(dailyDelta),
      macros: macrosCalc,
      percentages: actualPercentages,
      warning: warningMsg,
      validation: validationResult,
    };
  }, [units, gender, age, weight, height, activity, weeklyChange, macroSplit, macroMethod, proteinPerLb, fatPerLb]);

  // Save profile
  const saveProfile = async () => {
    const profile = {
      units,
      gender,
      age,
      weight,
      height,
      activity,
      goalPreset,
      weeklyChange,
      macroMethod,
      macroPreset,
      macroSplit,
      proteinPerLb,
      fatPerLb,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem("calorieCalculatorProfile", JSON.stringify(profile));
    setLastProfileSavedAt(new Date());

    if (user) {
      try {
        const { getFirestore, doc, setDoc } = await import("firebase/firestore");
        const db = getFirestore();
        await setDoc(
          doc(db, "userProfiles", user.uid),
          { calorieProfile: profile },
          { merge: true }
        );
        toast.success("Profile saved successfully!");
      } catch (error) {
        console.error("Error saving to cloud:", error);
        toast.error("Profile saved locally. Check your internet connection.");
      }
    } else {
      toast.success("Profile saved locally. Sign in to sync across devices.");
    }
  };

  // Load profile
  const loadProfile = useCallback(async () => {
    try {
      let profile = null;

      if (user) {
        try {
          const { getFirestore, doc, getDoc } = await import("firebase/firestore");
          const db = getFirestore();
          const docRef = doc(db, "userProfiles", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().calorieProfile) {
            profile = docSnap.data().calorieProfile;
          }
        } catch (error) {
          console.error("Error loading from cloud:", error);
        }
      }

      if (!profile) {
        const saved = localStorage.getItem("calorieCalculatorProfile");
        if (saved) {
          profile = JSON.parse(saved);
        }
      }

      if (profile) {
        setUnits(profile.units || "imperial");
        setGender(profile.gender || "male");
        setAge(profile.age || 32);
        setWeight(profile.weight || 195);
        setHeight(profile.height || 72);
        setActivity(profile.activity || "light");
        setGoalPreset(profile.goalPreset || "cut");
        setWeeklyChange(profile.weeklyChange ?? -1);
        setMacroMethod(profile.macroMethod || "bodyweight");
        setMacroPreset(profile.macroPreset || "balanced");
        if (profile.macroSplit) {
          setMacroSplit(profile.macroSplit);
        }
        if (profile.proteinPerLb !== undefined) {
          setProteinPerLb(profile.proteinPerLb);
        }
        if (profile.fatPerLb !== undefined) {
          setFatPerLb(profile.fatPerLb);
        }
        if (profile.savedAt) {
          setLastProfileSavedAt(new Date(profile.savedAt));
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Send targets to planner
  const sendToPlanner = () => {
    const plannerTargets = {
      calorieTarget: target,
      targetPercentages: {
        protein: percentages.p,
        fat: percentages.f,
        carbs: percentages.c,
      },
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("plannerTargetsFromCalculator", JSON.stringify(plannerTargets));
    toast.success("Targets saved! Switch to the Planner tab to apply them.");
  };

  const unitLabelW = units === "imperial" ? "lbs" : "kg";
  const unitLabelH = units === "imperial" ? "in" : "cm";

  // Generate intelligent recommendations based on activity and goals
  const getSmartRecommendations = () => {
    const bodyweightLbs = units === "imperial" ? weight : weight * 2.20462;
    const recommendations = [];

    // Protein recommendations
    const proteinRanges = {
      sedentary: { min: 0.8, max: 1.0, label: "muscle maintenance" },
      light: { min: 0.8, max: 1.1, label: "light activity" },
      moderate: { min: 1.0, max: 1.2, label: "moderate training" },
      high: { min: 1.0, max: 1.3, label: "frequent training" },
      athlete: { min: 1.1, max: 1.5, label: "intense training" },
    };

    const proteinRange = proteinRanges[activity];
    const goalAdjustment = goalPreset === "cut" ? "+0.1-0.2" : goalPreset === "bulk" ? "-0.1" : "";

    recommendations.push({
      title: "Protein",
      range: `${proteinRange.min}-${proteinRange.max} g/lb`,
      grams: `${Math.round(bodyweightLbs * proteinRange.min)}-${Math.round(bodyweightLbs * proteinRange.max)}g`,
      reason: `Optimal for ${proteinRange.label}${goalAdjustment ? ` (${goalAdjustment} for ${goalPreset})` : ""}`,
    });

    // Fat recommendations (bodyweight-based)
    const fatMinPerLb = 0.25;
    const fatMaxPerLb = goalPreset === "bulk" ? 0.4 : 0.35;
    const fatReason = goalPreset === "cut"
      ? "Minimum for hormone health, allowing more carbs"
      : goalPreset === "bulk"
      ? "Higher fat supports hormone production during surplus"
      : "Balanced for general health and satiety";

    recommendations.push({
      title: "Fat",
      range: `${fatMinPerLb}-${fatMaxPerLb} g/lb`,
      grams: `${Math.round(bodyweightLbs * fatMinPerLb)}-${Math.round(bodyweightLbs * fatMaxPerLb)}g`,
      reason: fatReason,
    });

    // Carbs insight
    const proteinCals = macros.p * 4;
    const fatCals = macros.f * 9;
    const carbCals = target - proteinCals - fatCals;
    const carbPercentage = Math.round((carbCals / target) * 100);

    const carbContext = carbPercentage < 20
      ? "Very low (ketogenic) - ensure adequate fat for energy"
      : carbPercentage < 30
      ? "Low-carb - monitor performance and energy"
      : carbPercentage > 50
      ? "High-carb - good for endurance and high activity"
      : "Moderate-carb - balanced approach";

    recommendations.push({
      title: "Carbs",
      range: `${carbPercentage}% (${macros.c}g)`,
      reason: carbContext,
    });

    return recommendations;
  };

  const smartRecommendations = getSmartRecommendations();

  // Helper content for each macro
  const macroHelp = {
    protein: {
      title: "Protein Guidelines",
      content: [
        {
          subtitle: "Why Protein Matters",
          text: "Protein is essential for building and maintaining muscle mass, supporting recovery, and preserving lean tissue during weight loss.",
        },
        {
          subtitle: "Research-Based Ranges",
          text: "• 0.8 g/lb: Minimum for muscle maintenance\n• 1.0 g/lb: Optimal for most active people\n• 1.2 g/lb: Higher end for athletes/cutting\n• 1.5 g/lb: Upper limit (no additional benefits)",
        },
        {
          subtitle: "By Activity Level",
          text: `• Sedentary: 0.8-1.0 g/lb\n• Light (1-3×/week): 0.8-1.1 g/lb\n• Moderate (3-5×/week): 1.0-1.2 g/lb\n• High (6-7×/week): 1.0-1.3 g/lb\n• Athlete: 1.1-1.5 g/lb`,
        },
        {
          subtitle: "Goal Adjustments",
          text: "• Cutting: Increase by 0.1-0.2 g/lb to preserve muscle\n• Bulking: Can use lower end of range\n• Maintenance: Aim for middle of your activity range",
        },
      ],
    },
    fat: {
      title: "Fat Guidelines",
      content: [
        {
          subtitle: "Why Fat Matters",
          text: "Dietary fat is crucial for hormone production (including testosterone), vitamin absorption (A, D, E, K), brain function, and satiety.",
        },
        {
          subtitle: "Research-Based Ranges",
          text: "• 0.25 g/lb: Absolute minimum for hormonal health\n• 0.3 g/lb: Comfortable minimum for most people\n• 0.35-0.4 g/lb: Optimal range for balanced diets\n• 0.5+ g/lb: Higher for low-carb/keto approaches",
        },
        {
          subtitle: "Goal Adjustments",
          text: "• Cutting: 0.25-0.35 g/lb (leaves room for carbs)\n• Bulking: 0.3-0.4 g/lb (supports hormone production)\n• Keto: 0.5-0.6+ g/lb (fat becomes primary fuel)",
        },
        {
          subtitle: "Important Notes",
          text: "• Never go below 0.25 g/lb for extended periods\n• Fat quality matters: prioritize unsaturated fats\n• About 10% of total fat from saturated sources is fine",
        },
      ],
    },
    carbs: {
      title: "Carbohydrate Guidelines",
      content: [
        {
          subtitle: "Why Carbs Matter",
          text: "Carbohydrates are your body's preferred energy source for high-intensity activity, brain function, and athletic performance.",
        },
        {
          subtitle: "Carb Ranges by Amount",
          text: "• <50g: Ketogenic (very low, fat becomes primary fuel)\n• 50-100g: Low-carb (reduced but not keto)\n• 100-200g: Moderate-carb (balanced approach)\n• 200g+: High-carb (endurance/very active)",
        },
        {
          subtitle: "By Percentage",
          text: "• <20%: Ketogenic territory\n• 20-35%: Low-carb approach\n• 35-50%: Moderate/balanced\n• 50%+: High-carb (endurance athletes)",
        },
        {
          subtitle: "Activity Considerations",
          text: "• Sedentary: Can function well on lower carbs\n• Moderate activity: Benefits from moderate carbs\n• High intensity training: Needs higher carbs for performance\n• Endurance athletes: Often need 50%+ from carbs",
        },
        {
          subtitle: "Auto-Calculation Note",
          text: "Carbs fill the remaining calories after protein and fat are set. This ensures you hit your calorie target while prioritizing the essential macros (protein for muscle, fat for hormones).",
        },
      ],
    },
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Grid container spacing={3}>
        {/* Left Column: Form */}
        <Grid item xs={12} md={6} lg={5}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 2.5 },
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {/* Header */}
            <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              >
                <Flame size={20} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Calorie Calculator
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Estimate BMR/TDEE and set your meal-planning budget
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={2}>
              {/* Units & Gender */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Units</InputLabel>
                    <Select
                      value={units}
                      label="Units"
                      onChange={(e) => handleUnitsChange(e.target.value)}
                    >
                      <MenuItem value="imperial">Imperial (lbs, in)</MenuItem>
                      <MenuItem value="metric">Metric (kg, cm)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={gender}
                      label="Gender"
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Age, Weight, Height */}
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Age"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    inputProps={{ min: 10, max: 90 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label={`Weight (${unitLabelW})`}
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    inputProps={{ min: 60, max: 400, step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label={`Height (${unitLabelH})`}
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    inputProps={{ min: 48, max: 96 }}
                  />
                </Grid>
              </Grid>

              {/* Activity Level */}
              <FormControl fullWidth size="small">
                <InputLabel>
                  Activity Level
                  <Tooltip title="Pick the option that matches your typical week">
                    <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
                      <Info size={14} />
                    </IconButton>
                  </Tooltip>
                </InputLabel>
                <Select
                  value={activity}
                  label="Activity Level"
                  onChange={(e) => setActivity(e.target.value)}
                >
                  {Object.entries(ACTIVITY_LEVELS).map(([key, { label }]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider />

              {/* Goal Presets */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Goal
                </Typography>
                <Grid container spacing={1}>
                  {Object.entries(GOAL_PRESETS).map(([key, { label }]) => (
                    <Grid item xs={3} key={key}>
                      <Button
                        fullWidth
                        size="small"
                        variant={goalPreset === key ? "contained" : "outlined"}
                        color={goalPreset === key ? "primary" : "inherit"}
                        onClick={() => setGoalPreset(key)}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          borderColor: theme.palette.divider,
                        }}
                      >
                        {label}
                      </Button>
                    </Grid>
                  ))}
                </Grid>

                {/* Weekly Change Slider */}
                <Paper
                  variant="outlined"
                  sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: "background.default" }}
                >
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Weekly change
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {weeklyChange > 0 ? "+" : ""}
                      {weeklyChange} {units === "imperial" ? "lb" : "kg"}/week
                    </Typography>
                  </Stack>
                  <Slider
                    value={weeklyChange}
                    onChange={(_, v) => setWeeklyChange(v)}
                    min={units === "imperial" ? -3 : -1.5}
                    max={units === "imperial" ? 3 : 1.5}
                    step={units === "imperial" ? 0.25 : 0.1}
                    disabled={goalPreset !== "custom"}
                    marks={[
                      { value: units === "imperial" ? -3 : -1.5, label: "Lose" },
                      { value: 0, label: "Maintain" },
                      { value: units === "imperial" ? 3 : 1.5, label: "Gain" },
                    ]}
                    sx={{ mt: 1 }}
                  />
                  {goalPreset !== "custom" && (
                    <Typography variant="caption" color="text.secondary">
                      Switch to Custom to adjust manually
                    </Typography>
                  )}
                </Paper>
              </Box>

              <Divider />

              {/* Macro Method Selection */}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Macro Calculator
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    <Button
                      size="small"
                      variant={macroMethod === "bodyweight" ? "contained" : "outlined"}
                      onClick={() => setMacroMethod("bodyweight")}
                      sx={{
                        textTransform: "none",
                        fontSize: "0.75rem",
                        px: 1.5,
                        py: 0.5,
                      }}
                    >
                      Simple
                    </Button>
                    <Button
                      size="small"
                      variant={macroMethod === "percentage" ? "contained" : "outlined"}
                      onClick={() => setMacroMethod("percentage")}
                      sx={{
                        textTransform: "none",
                        fontSize: "0.75rem",
                        px: 1.5,
                        py: 0.5,
                      }}
                    >
                      Advanced
                    </Button>
                  </Stack>
                </Stack>

                {macroMethod === "bodyweight" ? (
                  /* Bodyweight-Based Method (Simple) */
                  <Paper variant="outlined" sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: "primary.50" }}>
                    <Typography variant="caption" color="primary.main" fontWeight={600} mb={1} display="block">
                      Protein & fat based on bodyweight (g/lb), carbs auto-fill
                    </Typography>

                    {/* Protein Slider */}
                    <Stack spacing={1.5}>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography variant="body2" fontWeight={600}>
                              Protein
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={(e) => handleHelpClick(e, macroHelp.protein)}
                              sx={{ p: 0.25 }}
                            >
                              <Info size={14} />
                            </IconButton>
                          </Stack>
                          <Typography variant="body2" fontWeight={700} color="primary.main">
                            {proteinPerLb.toFixed(2)} g/lb = {macros.p}g ({percentages.p}%)
                          </Typography>
                        </Stack>
                        <Slider
                          value={proteinPerLb}
                          onChange={(_, v) => setProteinPerLb(v)}
                          min={0.6}
                          max={1.5}
                          step={0.05}
                          marks={[
                            { value: 0.8, label: "0.8" },
                            { value: 1.0, label: "1.0" },
                            { value: 1.2, label: "1.2" },
                          ]}
                          sx={{
                            '& .MuiSlider-markLabel': { fontSize: '0.65rem' },
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Recommended: {smartRecommendations[0].range}
                        </Typography>
                      </Box>

                      <Divider />

                      {/* Fat Slider */}
                      <Box>
                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography variant="body2" fontWeight={600}>
                              Fat
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={(e) => handleHelpClick(e, macroHelp.fat)}
                              sx={{ p: 0.25 }}
                            >
                              <Info size={14} />
                            </IconButton>
                          </Stack>
                          <Typography variant="body2" fontWeight={700} color="success.main">
                            {fatPerLb.toFixed(2)} g/lb = {macros.f}g ({percentages.f}%)
                          </Typography>
                        </Stack>
                        <Slider
                          value={fatPerLb}
                          onChange={(_, v) => setFatPerLb(v)}
                          min={0.2}
                          max={0.6}
                          step={0.05}
                          marks={[
                            { value: 0.25, label: "0.25" },
                            { value: 0.3, label: "0.3" },
                            { value: 0.4, label: "0.4" },
                          ]}
                          sx={{
                            '& .MuiSlider-markLabel': { fontSize: '0.65rem' },
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          Recommended: {smartRecommendations[1].range}
                        </Typography>
                      </Box>

                      <Divider />

                      {/* Carbs (Auto-calculated) */}
                      <Box>
                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography variant="body2" fontWeight={600}>
                              Carbs (remainder)
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={(e) => handleHelpClick(e, macroHelp.carbs)}
                              sx={{ p: 0.25 }}
                            >
                              <Info size={14} />
                            </IconButton>
                          </Stack>
                          <Typography variant="body2" fontWeight={700} color="warning.main">
                            {percentages.c}% = {macros.c}g
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {smartRecommendations[2].reason}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ) : (
                  /* Percentage-Based Method (Advanced) */
                  <>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, mb: 1 }}>
                      Traditional percentage-based macro splits
                    </Typography>
                    <Grid container spacing={1}>
                      {Object.entries(MACRO_PRESETS).map(([key, { label }]) => (
                        <Grid item xs={3} key={key}>
                          <Button
                            fullWidth
                            size="small"
                            variant={macroPreset === key ? "contained" : "outlined"}
                            color={macroPreset === key ? "primary" : "inherit"}
                            onClick={() => setMacroPreset(key)}
                            sx={{
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              borderColor: theme.palette.divider,
                            }}
                          >
                            {label}
                          </Button>
                        </Grid>
                      ))}
                    </Grid>

                    <Paper variant="outlined" sx={{ mt: 2, p: 2, borderRadius: 2 }}>
                      {[
                        { key: "p", label: "Protein" },
                        { key: "c", label: "Carbs" },
                        { key: "f", label: "Fat" },
                      ].map(({ key, label }) => (
                        <Stack
                          key={key}
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          sx={{ mb: key !== "f" ? 1.5 : 0 }}
                        >
                          <Typography variant="body2" sx={{ width: 60 }}>
                            {label}
                          </Typography>
                          <Slider
                            value={macroSplit[key]}
                            onChange={(_, v) => setSplit({ [key]: v })}
                            min={0}
                            max={100}
                            disabled={macroPreset !== "custom"}
                            sx={{ flex: 1 }}
                          />
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{ width: 40, textAlign: "right" }}
                          >
                            {macroSplit[key]}%
                          </Typography>
                        </Stack>
                      ))}
                      {macroPreset !== "custom" && (
                        <Typography variant="caption" color="text.secondary">
                          Preset selected. Choose Custom to edit.
                        </Typography>
                      )}
                    </Paper>
                  </>
                )}
              </Box>

              <Divider />

              {/* Save/Load Buttons */}
              <Stack direction="row" spacing={1}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Save size={18} />}
                  onClick={saveProfile}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Save Profile
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FolderOpen size={18} />}
                  onClick={loadProfile}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Load Profile
                </Button>
              </Stack>
              {lastProfileSavedAt && (
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  Last saved: {lastProfileSavedAt.toLocaleTimeString()}
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column: Results */}
        <Grid item xs={12} md={6} lg={7}>
          <Stack spacing={2}>
            {/* Results Cards */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="h6" fontWeight={700} mb={2}>
                Your Plan Budget
              </Typography>

              <Grid container spacing={2}>
                {[
                  { label: "BMR", value: `${bmr} kcal`, sub: "at rest", highlight: false },
                  { label: "TDEE", value: `${tdee} kcal`, sub: "with activity", highlight: false },
                  { label: "Target", value: `${target} kcal`, sub: "planning budget", highlight: true },
                  {
                    label: "Adjustment",
                    value: `${adjustment > 0 ? "+" : ""}${adjustment} kcal`,
                    sub: "per day",
                    highlight: false,
                  },
                ].map((item) => (
                  <Grid item xs={6} md={3} key={item.label}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: item.highlight ? "primary.50" : "background.paper",
                        borderColor: item.highlight ? "primary.200" : "divider",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                        {item.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.sub}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Warning */}
              {warning && (
                <Alert
                  severity="warning"
                  icon={<AlertTriangle size={18} />}
                  sx={{ mt: 2, borderRadius: 2 }}
                >
                  {warning}
                </Alert>
              )}

              {/* CTA Button */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                endIcon={<ArrowRight size={18} />}
                onClick={sendToPlanner}
                sx={{ mt: 3, textTransform: "none", fontWeight: 600, borderRadius: 2 }}
              >
                Use these targets in Planner
              </Button>
            </Paper>

            {/* Macro Breakdown */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="h6" fontWeight={700} mb={2}>
                Recommended Macros
              </Typography>

              <Stack spacing={1.5}>
                {[
                  { label: `Protein (${percentages.p}%)`, grams: macros.p, color: "error", macro: "protein" },
                  { label: `Carbs (${percentages.c}%)`, grams: macros.c, color: "warning", macro: "carbs" },
                  { label: `Fat (${percentages.f}%)`, grams: macros.f, color: "success", macro: "fat" },
                ].map((item) => {
                  const bodyweightLbs = units === "imperial" ? weight : weight * 2.20462;
                  const gramsPerLb = (item.grams / bodyweightLbs).toFixed(2);
                  const showPerLb = item.macro === "protein" || item.macro === "fat";

                  return (
                    <Box key={item.label}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2">{item.label}</Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {item.grams}g
                          {showPerLb && (
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                              sx={{ ml: 0.5 }}
                            >
                              ({gramsPerLb}g/lb)
                            </Typography>
                          )}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={item.label.includes("Protein") ? percentages.p : item.label.includes("Carbs") ? percentages.c : percentages.f}
                        color={item.color}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  );
                })}
              </Stack>

              {/* Visual Macro Bars */}
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {[
                  { label: "Protein", pct: percentages.p, color: "error.light" },
                  { label: "Carbs", pct: percentages.c, color: "warning.light" },
                  { label: "Fat", pct: percentages.f, color: "success.light" },
                ].map((item) => (
                  <Grid item xs={4} key={item.label}>
                    <Paper
                      variant="outlined"
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: "background.default" }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Box
                        sx={{
                          mt: 1,
                          height: 8,
                          borderRadius: 1,
                          bgcolor: "divider",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            width: `${item.pct}%`,
                            height: "100%",
                            bgcolor: item.color,
                          }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5 }}>
                        {item.pct}%
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Macro Validation Warnings */}
            {validation && (validation.hasWarnings || validation.hasCritical) && (
              <MacroWarnings validation={validation} sx={{ mt: 2 }} />
            )}

            {/* Info Section */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1,
                    bgcolor: "info.50",
                    border: `1px solid`,
                    borderColor: "info.200",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "info.main",
                  }}
                >
                  <Info size={16} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Understanding the Numbers
                </Typography>
              </Stack>
              <Stack spacing={0.75}>
                {[
                  { term: "BMR", desc: "calories your body needs at rest." },
                  { term: "TDEE", desc: "BMR plus calories burned through activity." },
                  { term: "Target", desc: "your daily meal-planning budget for this goal." },
                  { term: "Adjustment", desc: "kcal shift based on weekly change." },
                ].map((item) => (
                  <Typography key={item.term} variant="body2" color="text.secondary">
                    <strong>{item.term}</strong>: {item.desc}
                  </Typography>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* Help Popover */}
      <Popover
        open={Boolean(helpAnchor)}
        anchorEl={helpAnchor}
        onClose={handleHelpClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          '& .MuiPopover-paper': {
            maxWidth: 450,
            borderRadius: 2,
          },
        }}
      >
        {helpContent && (
          <Box sx={{ p: 2.5 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              {helpContent.title}
            </Typography>
            <Stack spacing={2}>
              {helpContent.content.map((section, idx) => (
                <Box key={idx}>
                  <Typography variant="subtitle2" fontWeight={600} color="primary.main" mb={0.5}>
                    {section.subtitle}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      whiteSpace: 'pre-line',
                      lineHeight: 1.6,
                    }}
                  >
                    {section.text}
                  </Typography>
                </Box>
              ))}
            </Stack>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleHelpClose}
              sx={{ mt: 2, textTransform: 'none' }}
            >
              Got it
            </Button>
          </Box>
        )}
      </Popover>
    </Container>
  );
};

export default CalorieCalculator;
