// src/shared/components/layout/MealPrep.jsx
import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { loadUserPreferences } from "../../../shared/services/userPreferences";
import AccountCircleIcon from "@mui/icons-material/AccountCircleRounded";
import ArticleIcon from "@mui/icons-material/ArticleRounded";
import CalculateIcon from "@mui/icons-material/CalculateRounded";
import KitchenIcon from "@mui/icons-material/KitchenRounded";
import RestaurantIcon from "@mui/icons-material/RestaurantMenuRounded";
import {
  AppBar,
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  useMediaQuery,
  useScrollTrigger,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MealPrepCalculator from "../../../features/meal-planner/MealPrepCalculator";
import MealPrepInstructions from "../../../features/instructions/MealPrepInstructions";
import IngredientManager from "../../../features/ingredients/IngredientManager";
import CalorieCalculator from "../../../features/calorie-calculator/CalorieCalculator";
import AccountPage from "../../../features/account/AccountPage";
import Login from "../../../features/auth/Login";
import ErrorBoundary from "../ui/ErrorBoundary";
import { getAllBaseIngredients } from "../../../features/ingredients/nutritionHelpers";
import { syncFromRemote } from "../../../features/ingredients/ingredientStorage";
import { useUser } from "../../../features/auth/UserContext";
import ThemeToggle from "./ThemeToggle";

const TABS = {
  CALCULATOR: "calculator",
  CALORIE_CALC: "calorie-calc", 
  INSTRUCTIONS: "instructions",
  INGREDIENTS: "ingredients",
  ACCOUNT: "account",
};

const TAB_CONFIG = [
  { key: TABS.CALCULATOR, label: "Planner", icon: <RestaurantIcon fontSize="small" /> },
  { key: TABS.CALORIE_CALC, label: "Calories", icon: <CalculateIcon fontSize="small" /> },
  { key: TABS.INSTRUCTIONS, label: "Guide", icon: <ArticleIcon fontSize="small" /> },
  { key: TABS.INGREDIENTS, label: "Ingredients", icon: <KitchenIcon fontSize="small" /> },
  { key: TABS.ACCOUNT, label: "Account", icon: <AccountCircleIcon fontSize="small" /> },
];

const MealPrep = () => {
  const { user, isGuest, logout } = useUser();
  const [activeTab, setActiveTab] = useState(TABS.CALCULATOR);
  const [allIngredients, setAllIngredients] = useState(getAllBaseIngredients());
  const [lastSync, setLastSync] = useState(null);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );
  const [userPreferences, setUserPreferences] = useState({ showRecentIngredients: true });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const trigger = useScrollTrigger({ threshold: 8 });

  const handleIngredientChange = (list) => {
    setAllIngredients(list);
  };

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  }, [logout]);

  // Refresh ingredients when switching tabs to pick up any changes
  useEffect(() => {
    if (activeTab === TABS.CALCULATOR || activeTab === TABS.INGREDIENTS) {
      setAllIngredients(getAllBaseIngredients());
    }
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      // Sync ingredients and preferences
      Promise.all([
        syncFromRemote(user.uid),
        loadUserPreferences(user.uid)
      ])
        .then(([_, prefs]) => {
          setAllIngredients(getAllBaseIngredients());
          setUserPreferences(prefs);
          setLastSync(new Date());
        })
        .catch((error) => {
          console.error("Failed to sync from remote:", error);
          toast.error("Failed to sync data. Using local data.");
          setAllIngredients(getAllBaseIngredients());
          setLastSync(new Date());
        });
    } else {
      setAllIngredients(getAllBaseIngredients());
      setLastSync(new Date());
    }
  }, [user]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        pb: isDesktop ? 4 : 10,
        background: isDesktop
          ? `radial-gradient(circle at 20% 20%, ${
              theme.palette.mode === "dark"
                ? "rgba(148, 163, 184, 0.12)"
                : "rgba(148, 163, 184, 0.2)"
            }, transparent 40%), radial-gradient(circle at 80% 0%, ${
              theme.palette.mode === "dark"
                ? "rgba(59, 130, 246, 0.12)"
                : "rgba(59, 130, 246, 0.18)"
            }, transparent 35%), ${theme.palette.background.default}`
          : theme.palette.background.default,
        transition: theme.transitions.create("background-color"),
      }}
    >
      <AppBar
        position="sticky"
        color="transparent"
        elevation={trigger ? 4 : 0}
        sx={{
          px: { xs: 1.5, md: 2 },
          py: 1,
          minHeight: 72,
          display: "flex",
          justifyContent: "center",
          backdropFilter: "blur(12px)",
          backgroundColor:
            theme.palette.mode === "dark"
              ? "rgba(15,23,42,0.92)"
              : "rgba(255,255,255,0.96)",
          borderBottom: `1px solid ${theme.palette.divider}`,
          transition: theme.transitions.create(["box-shadow"], {
            duration: theme.transitions.duration.shorter,
          }),
        }}
      >
        <Toolbar disableGutters sx={{ gap: { xs: 1, md: 2 }, alignItems: "center" }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 200 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                letterSpacing: 0.5,
                boxShadow: "0 12px 30px rgba(99, 102, 241, 0.45)",
              }}
            >
              PTM
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Prep Thy Meal
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  {user?.displayName?.split(" ")[0] || "Welcome"}
                </Typography>
                <Chip
                  label="beta"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 22, fontWeight: 700 }}
                />
              </Stack>
            </Box>
          </Stack>

          {isDesktop && (
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              textColor="primary"
              indicatorColor="primary"
              sx={{
                ml: 2,
                minHeight: 52,
                "& .MuiTab-root": { minHeight: 52 },
              }}
            >
              {TAB_CONFIG.map(({ key, label, icon }) => (
                <Tab
                  key={key}
                  value={key}
                  id={`tab-${key}`}
                  aria-controls={`tabpanel-${key}`}
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      {icon}
                      <Typography variant="body2" fontWeight={600}>
                        {label}
                      </Typography>
                    </Stack>
                  }
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    px: 2.5,
                  }}
                />
              ))}
            </Tabs>
          )}

          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ ml: "auto" }}>
            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
              sx={{
                px: 1.25,
                py: 0.5,
                borderRadius: 9999,
                border: "1px solid",
                borderColor: isOffline ? "warning.main" : "success.main",
                backgroundColor: isOffline ? "warning.light" : "success.light",
                color: isOffline ? "warning.dark" : "success.dark",
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: isOffline ? "warning.main" : "success.main",
                }}
              />
              <Typography variant="caption" fontWeight={700}>
                {isOffline ? "Offline" : "Online"}
              </Typography>
            </Stack>
            {lastSync && isDesktop && (
              <Typography variant="caption" color="text.secondary">
                Synced {lastSync.toLocaleTimeString()}
              </Typography>
            )}
            <ThemeToggle />
            <Stack direction="row" alignItems="center" spacing={1} sx={{ pl: 1 }}>
              {user ? (
                <>
                  <Avatar
                    src={user?.photoURL || ""}
                    alt={user?.displayName || "Profile"}
                    sx={{ width: 38, height: 38, bgcolor: "primary.main", fontWeight: 700 }}
                  >
                    {(user?.displayName || "User").charAt(0).toUpperCase()}
                  </Avatar>
                  <Button
                    type="button"
                    onClick={handleLogout}
                    variant="outlined"
                    color="error"
                    size="small"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Chip
                    label="Guest Mode"
                    size="small"
                    color="default"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                  <Button
                    onClick={() => setShowLoginModal(true)}
                    variant="contained"
                    color="primary"
                    size="small"
                  >
                    Login / Sign Up
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
        </Toolbar>
      </AppBar>

      {!isDesktop && (
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: (t) => t.zIndex.appBar,
            backdropFilter: "blur(10px)",
          }}
        >
          <BottomNavigation
            showLabels
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            component="nav"
            aria-label="Main navigation"
          >
            {TAB_CONFIG.map(({ key, label, icon }) => (
              <BottomNavigationAction
                key={key}
                value={key}
                label={label}
                icon={icon}
                aria-controls={`tabpanel-${key}`}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}

      <Container
        maxWidth="xl"
        component="main"
        sx={{
          pt: 3,
          pb: isDesktop ? 0 : 10,
        }}
      >
        {/* Keep MealPrepCalculator mounted to preserve state */}
        <Box
          role="tabpanel"
          id="tabpanel-calculator"
          aria-labelledby="tab-calculator"
          hidden={activeTab !== TABS.CALCULATOR}
          sx={{ display: activeTab === TABS.CALCULATOR ? "block" : "none" }}
        >
          <ErrorBoundary message="An error occurred in the Meal Planner. Try switching tabs or refreshing.">
            <MealPrepCalculator
              allIngredients={allIngredients}
              isActive={activeTab === TABS.CALCULATOR}
              userPreferences={userPreferences}
            />
          </ErrorBoundary>
        </Box>

        {/* Other tabs can mount/unmount as they don't have complex state */}
        {activeTab === TABS.CALORIE_CALC && (
          <Box role="tabpanel" id="tabpanel-calorie-calc" aria-labelledby="tab-calorie-calc">
            <ErrorBoundary message="An error occurred in the Calorie Calculator. Try switching tabs or refreshing.">
              <CalorieCalculator />
            </ErrorBoundary>
          </Box>
        )}
        {activeTab === TABS.INSTRUCTIONS && (
          <Box role="tabpanel" id="tabpanel-instructions" aria-labelledby="tab-instructions">
            <ErrorBoundary message="An error occurred loading the instructions. Try switching tabs or refreshing.">
              <MealPrepInstructions />
            </ErrorBoundary>
          </Box>
        )}
        {activeTab === TABS.INGREDIENTS && (
          <Box role="tabpanel" id="tabpanel-ingredients" aria-labelledby="tab-ingredients">
            <ErrorBoundary message="An error occurred in the Ingredient Manager. Try switching tabs or refreshing.">
              <IngredientManager onChange={handleIngredientChange} />
            </ErrorBoundary>
          </Box>
        )}
        {activeTab === TABS.ACCOUNT && (
          <Box role="tabpanel" id="tabpanel-account" aria-labelledby="tab-account">
            <ErrorBoundary message="An error occurred in the Account page. Try switching tabs or refreshing.">
              <AccountPage />
            </ErrorBoundary>
          </Box>
        )}
      </Container>

      {/* Login Modal for Guest Users */}
      <Login
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={(user) => {
          setShowLoginModal(false);
          // Sync will happen automatically via useEffect on user change
          toast.success(`Welcome, ${user.displayName}!`);
        }}
      />
    </Box>
  );
};

export default MealPrep;
