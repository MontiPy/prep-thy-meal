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
  const [goalPreset, setGoalPreset] = useState("cut");
  const [weeklyChange, setWeeklyChange] = useState(-1);

  // Macro settings
  const [macroPreset, setMacroPreset] = useState("balanced");
  const [macroSplit, setMacroSplit] = useState({ p: 30, c: 40, f: 30 });

  // Profile state
  const [lastProfileSavedAt, setLastProfileSavedAt] = useState(null);

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
  const { bmr, tdee, target, adjustment, macros, warning } = useMemo(() => {
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
    const pCal = (macroSplit.p / 100) * targetCalc;
    const cCal = (macroSplit.c / 100) * targetCalc;
    const fCal = (macroSplit.f / 100) * targetCalc;
    const macrosCalc = {
      p: Math.round(pCal / 4),
      c: Math.round(cCal / 4),
      f: Math.round(fCal / 9),
    };

    // Check for warnings
    const deficitPct = (tdeeCalc - targetCalc) / tdeeCalc;
    let warningMsg = null;
    if (deficitPct > 0.25) {
      warningMsg = "Aggressive cut (>25% deficit). Consider a smaller weekly loss.";
    }
    if (targetCalc < 1200) {
      warningMsg = "Target calories are very low. Re-check inputs or choose a gentler goal.";
    }

    return {
      bmr: Math.round(bmrCalc),
      tdee: Math.round(tdeeCalc),
      target: Math.round(targetCalc),
      adjustment: Math.round(dailyDelta),
      macros: macrosCalc,
      warning: warningMsg,
    };
  }, [units, gender, age, weight, height, activity, weeklyChange, macroSplit]);

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
      macroPreset,
      macroSplit,
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
        setMacroPreset(profile.macroPreset || "balanced");
        if (profile.macroSplit) {
          setMacroSplit(profile.macroSplit);
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
        protein: macroSplit.p,
        fat: macroSplit.f,
        carbs: macroSplit.c,
      },
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("plannerTargetsFromCalculator", JSON.stringify(plannerTargets));
    toast.success("Targets saved! Switch to the Planner tab to apply them.");
  };

  const unitLabelW = units === "imperial" ? "lbs" : "kg";
  const unitLabelH = units === "imperial" ? "in" : "cm";

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Grid container spacing={3}>
        {/* Left Column: Form */}
        <Grid item xs={12} lg={5}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
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

            <Stack spacing={2.5}>
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

              {/* Macro Presets */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Macro Split
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

                {/* Macro Sliders */}
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
        <Grid item xs={12} lg={7}>
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
                  { label: `Protein (${macroSplit.p}%)`, grams: macros.p, color: "error" },
                  { label: `Carbs (${macroSplit.c}%)`, grams: macros.c, color: "warning" },
                  { label: `Fat (${macroSplit.f}%)`, grams: macros.f, color: "success" },
                ].map((item) => (
                  <Box key={item.label}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">{item.label}</Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {item.grams}g
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={item.label.includes("Protein") ? macroSplit.p : item.label.includes("Carbs") ? macroSplit.c : macroSplit.f}
                      color={item.color}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                ))}
              </Stack>

              {/* Visual Macro Bars */}
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {[
                  { label: "Protein", pct: macroSplit.p, color: "error.light" },
                  { label: "Carbs", pct: macroSplit.c, color: "warning.light" },
                  { label: "Fat", pct: macroSplit.f, color: "success.light" },
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
    </Container>
  );
};

export default CalorieCalculator;
