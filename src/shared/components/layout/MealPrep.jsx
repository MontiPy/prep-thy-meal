// src/shared/components/layout/MealPrep.jsx
import React, { useEffect, useState, useCallback, useMemo, useRef, Profiler, Suspense, lazy } from "react";
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
  CircularProgress,
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
// Eager load: Default tab (critical for first paint)
import MealPrepCalculator from "../../../features/meal-planner/MealPrepCalculator";
// Lazy load: Non-default tabs (loaded on demand)
const CalorieCalculator = lazy(() => import("../../../features/calorie-calculator/CalorieCalculator"));
const MealPrepInstructions = lazy(() => import("../../../features/instructions/MealPrepInstructions"));
const IngredientManager = lazy(() => import("../../../features/ingredients/IngredientManager"));
const AccountPage = lazy(() => import("../../../features/account/AccountPage"));
// Non-tab components (always loaded)
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
  const { user, logout } = useUser();
  // Initialize tab from URL query param (deep linking support)
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return TABS.CALCULATOR;

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');

    // Map tab param to TABS constant
    const tabMap = {
      'planner': TABS.CALCULATOR,
      'calories': TABS.CALORIE_CALC,
      'guide': TABS.INSTRUCTIONS,
      'ingredients': TABS.INGREDIENTS,
      'account': TABS.ACCOUNT
    };

    return tabMap[tabParam] || TABS.CALCULATOR;
  });
  // Track which tabs have been mounted (for state preservation)
  const [mountedTabs, setMountedTabs] = useState(new Set([TABS.CALCULATOR]));
  const [perfSamples, setPerfSamples] = useState([]);
  const perfStartRef = useRef(null);
  const perfFromRef = useRef(null);
  const [allIngredients, setAllIngredients] = useState(getAllBaseIngredients());
  const [lastSync, setLastSync] = useState(null);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );
  const [userPreferences, setUserPreferences] = useState({ showRecentIngredients: true });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const plannerRef = useRef(null);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isNarrowMobile = useMediaQuery('(max-width:375px)');
  const trigger = useScrollTrigger({ threshold: 8 });

  const perfEnabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    if (params.has("perf")) return true;
    try {
      return window.localStorage?.getItem("ptm_perf") === "1";
    } catch {
      return false;
    }
  }, []);

  const handleProfilerRender = useCallback(
    (id, phase, actualDuration, baseDuration) => {
      if (!perfEnabled || typeof console === "undefined") return;
      const actual = actualDuration.toFixed(1);
      const base = baseDuration.toFixed(1);
      if (import.meta.env.DEV) console.info(`[perf] ${id} ${phase} actual:${actual}ms base:${base}ms`);
    },
    [perfEnabled]
  );

  const withProfiler = useCallback(
    (id, node) => {
      if (!perfEnabled) return node;
      return (
        <Profiler id={id} onRender={handleProfilerRender}>
          {node}
        </Profiler>
      );
    },
    [perfEnabled, handleProfilerRender]
  );
  const isDark = theme.palette.mode === "dark";

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

  const handleTabChange = useCallback(
    (_, value) => {
      if (value === activeTab) return;
      if (perfEnabled && typeof performance !== "undefined") {
        perfStartRef.current = performance.now();
        perfFromRef.current = activeTab;
        try {
          performance.mark(`tab:${activeTab}->${value}:start`);
        } catch {
          // Ignore unsupported environments.
        }
      }
      setActiveTab(value);
      // Mark tab as mounted for state preservation
      setMountedTabs((prev) => new Set(prev).add(value));

      // Update URL with tab param for deep linking
      if (typeof window !== 'undefined') {
        const tabParamMap = {
          [TABS.CALCULATOR]: 'planner',
          [TABS.CALORIE_CALC]: 'calories',
          [TABS.INSTRUCTIONS]: 'guide',
          [TABS.INGREDIENTS]: 'ingredients',
          [TABS.ACCOUNT]: 'account'
        };

        const tabParam = tabParamMap[value];
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tabParam);
        window.history.pushState({}, '', url);
      }
      if (value === TABS.CALCULATOR) {
        plannerRef.current?.onTabActive?.();
      }
    },
    [activeTab, perfEnabled]
  );

  // Ingredients are refreshed via sync and IngredientManager updates.

  useEffect(() => {
    if (user) {
      Promise.all([
        syncFromRemote(user.uid),
        loadUserPreferences(user.uid)
      ])
        .then(([, prefs]) => {
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
    if (!perfEnabled || perfStartRef.current == null || typeof performance === "undefined") return;
    const start = perfStartRef.current;
    const from = perfFromRef.current || "unknown";
    const to = activeTab;
    perfStartRef.current = null;

    const finalize = () => {
      const end = performance.now();
      const duration = Math.round(end - start);
      setPerfSamples((prev) => [
        { from, to, duration, ts: new Date().toLocaleTimeString() },
        ...prev,
      ].slice(0, 5));
      try {
        performance.mark(`tab:${from}->${to}:end`);
        performance.measure(`tab:${from}->${to}`, `tab:${from}->${to}:start`, `tab:${from}->${to}:end`);
      } catch {
        // Ignore unsupported environments.
      }
      if (import.meta.env.DEV) console.info(`[perf] tab ${from} -> ${to}: ${duration}ms`);
    };

    if (typeof window !== "undefined" && window.requestAnimationFrame) {
      window.requestAnimationFrame(() => window.requestAnimationFrame(finalize));
    } else {
      setTimeout(finalize, 0);
    }
  }, [activeTab, perfEnabled]);

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
              isDark
                ? "rgba(255,45,120,0.06)"
                : "rgba(214,36,94,0.04)"
            }, transparent 40%), radial-gradient(circle at 80% 0%, ${
              isDark
                ? "rgba(0,229,255,0.06)"
                : "rgba(0,184,212,0.04)"
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
        }}
      >
        <Toolbar disableGutters sx={{ gap: { xs: 1, md: 2 }, alignItems: "center" }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 200 }}>
            {/* PTM Logo with neon glow */}
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                background: isDark
                  ? "linear-gradient(135deg, #ff2d78 0%, #a855f7 100%)"
                  : "linear-gradient(135deg, #d6245e 0%, #8b3fd4 100%)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontFamily: '"Orbitron", sans-serif',
                fontWeight: 700,
                fontSize: "0.75rem",
                letterSpacing: 1,
                boxShadow: isDark
                  ? "0 0 20px rgba(255,45,120,0.4), 0 0 60px rgba(255,45,120,0.15)"
                  : "0 4px 16px rgba(214,36,94,0.3)",
                animation: isDark ? "neonPulse 3s ease-in-out infinite" : "none",
              }}
            >
              PTM
            </Box>
            {!isNarrowMobile && (
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
                    sx={{
                      height: 22,
                      fontWeight: 700,
                      fontSize: "0.65rem",
                      borderColor: isDark ? "rgba(255,45,120,0.4)" : "primary.main",
                      color: "primary.main",
                      border: "1px solid",
                    }}
                  />
                </Stack>
              </Box>
            )}
          </Stack>

          {isDesktop && (
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              textColor="primary"
              indicatorColor="primary"
              sx={{
                ml: 2,
                minHeight: 52,
                "& .MuiTab-root": {
                  minHeight: 52,
                  fontFamily: '"Urbanist", sans-serif',
                  fontWeight: 600,
                  letterSpacing: 0.5,
                },
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
            {/* Status indicator with neon pulse - hide on narrow mobile */}
            {!isNarrowMobile && (
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 9999,
                  border: "1px solid",
                  borderColor: isOffline
                    ? isDark ? "rgba(255,176,32,0.4)" : "warning.main"
                    : isDark ? "rgba(57,255,127,0.4)" : "success.main",
                  backgroundColor: isOffline
                    ? isDark ? "rgba(255,176,32,0.08)" : "warning.light"
                    : isDark ? "rgba(57,255,127,0.08)" : "success.light",
                  color: isOffline
                    ? isDark ? "#ffb020" : "warning.dark"
                    : isDark ? "#39ff7f" : "success.dark",
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: isOffline ? "warning.main" : "success.main",
                    animation: !isOffline ? "statusPulse 2s ease-in-out infinite" : "none",
                  }}
                />
                <Typography variant="caption" fontWeight={700}>
                  {isOffline ? "Offline" : "Online"}
                </Typography>
              </Stack>
            )}
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
                    sx={{
                      width: 38,
                      height: 38,
                      bgcolor: "primary.main",
                      fontWeight: 700,
                      border: isDark ? "2px solid rgba(255,45,120,0.4)" : "2px solid",
                      borderColor: isDark ? undefined : "primary.light",
                    }}
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
                    variant="outlined"
                    sx={{
                      fontWeight: 600,
                      borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
                    }}
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
            borderTop: isDark
              ? "1px solid rgba(255,255,255,0.04)"
              : "1px solid rgba(0,0,0,0.06)",
            "&::before": isDark ? {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,45,120,0.3), rgba(0,229,255,0.3), transparent)",
            } : {},
          }}
        >
          <BottomNavigation
            showLabels
            value={activeTab}
            onChange={handleTabChange}
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
        maxWidth={false}
        component="main"
        sx={{
          pt: 3,
          px: { xs: 1.5, sm: 2.5, md: 4 },
          pb: isDesktop ? 0 : 10,
        }}
      >
        {/* Planner Tab - Always mounted (eager loaded) */}
        <Box
          role="tabpanel"
          id="tabpanel-calculator"
          aria-labelledby="tab-calculator"
          hidden={activeTab !== TABS.CALCULATOR}
          className={`tab-panel ${activeTab === TABS.CALCULATOR ? "tab-panel-active" : ""}`}
          sx={{ display: activeTab === TABS.CALCULATOR ? "block" : "none" }}
        >
          <ErrorBoundary message="An error occurred in the Meal Planner. Try switching tabs or refreshing.">
            {withProfiler(
              "PlannerTab",
              <MealPrepCalculator
                ref={plannerRef}
                allIngredients={allIngredients}
                userPreferences={userPreferences}
              />
            )}
          </ErrorBoundary>
        </Box>

        {/* Calorie Calculator Tab - Lazy loaded */}
        {mountedTabs.has(TABS.CALORIE_CALC) && (
          <Box
            role="tabpanel"
            id="tabpanel-calorie-calc"
            aria-labelledby="tab-calorie-calc"
            hidden={activeTab !== TABS.CALORIE_CALC}
            className={`tab-panel ${activeTab === TABS.CALORIE_CALC ? "tab-panel-active" : ""}`}
            sx={{ display: activeTab === TABS.CALORIE_CALC ? "block" : "none" }}
          >
            <ErrorBoundary message="An error occurred in the Calorie Calculator. Try switching tabs or refreshing.">
              <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}><CircularProgress /></Box>}>
                {withProfiler("CaloriesTab", <CalorieCalculator />)}
              </Suspense>
            </ErrorBoundary>
          </Box>
        )}

        {/* Instructions Tab - Lazy loaded */}
        {mountedTabs.has(TABS.INSTRUCTIONS) && (
          <Box
            role="tabpanel"
            id="tabpanel-instructions"
            aria-labelledby="tab-instructions"
            hidden={activeTab !== TABS.INSTRUCTIONS}
            className={`tab-panel ${activeTab === TABS.INSTRUCTIONS ? "tab-panel-active" : ""}`}
            sx={{ display: activeTab === TABS.INSTRUCTIONS ? "block" : "none" }}
          >
            <ErrorBoundary message="An error occurred loading the instructions. Try switching tabs or refreshing.">
              <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}><CircularProgress /></Box>}>
                {withProfiler("GuideTab", <MealPrepInstructions />)}
              </Suspense>
            </ErrorBoundary>
          </Box>
        )}

        {/* Ingredients Tab - Lazy loaded */}
        {mountedTabs.has(TABS.INGREDIENTS) && (
          <Box
            role="tabpanel"
            id="tabpanel-ingredients"
            aria-labelledby="tab-ingredients"
            hidden={activeTab !== TABS.INGREDIENTS}
            className={`tab-panel ${activeTab === TABS.INGREDIENTS ? "tab-panel-active" : ""}`}
            sx={{ display: activeTab === TABS.INGREDIENTS ? "block" : "none" }}
          >
            <ErrorBoundary message="An error occurred in the Ingredient Manager. Try switching tabs or refreshing.">
              <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}><CircularProgress /></Box>}>
                {withProfiler("IngredientsTab", <IngredientManager onChange={handleIngredientChange} />)}
              </Suspense>
            </ErrorBoundary>
          </Box>
        )}

        {/* Account Tab - Lazy loaded */}
        {mountedTabs.has(TABS.ACCOUNT) && (
          <Box
            role="tabpanel"
            id="tabpanel-account"
            aria-labelledby="tab-account"
            hidden={activeTab !== TABS.ACCOUNT}
            className={`tab-panel ${activeTab === TABS.ACCOUNT ? "tab-panel-active" : ""}`}
            sx={{ display: activeTab === TABS.ACCOUNT ? "block" : "none" }}
          >
            <ErrorBoundary message="An error occurred in the Account page. Try switching tabs or refreshing.">
              <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}><CircularProgress /></Box>}>
                {withProfiler("AccountTab", <AccountPage />)}
              </Suspense>
            </ErrorBoundary>
          </Box>
        )}
      </Container>

      <Login
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={(user) => {
          setShowLoginModal(false);
          toast.success(`Welcome, ${user.displayName}!`);
        }}
      />

      {perfEnabled && (
        <Paper
          elevation={10}
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            p: 1.5,
            borderRadius: 2,
            bgcolor: "rgba(10,10,18,0.88)",
            color: "#e2e8f0",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 12,
            zIndex: (t) => t.zIndex.tooltip + 1,
            minWidth: 220,
          }}
        >
          <Typography variant="caption" sx={{ display: "block", mb: 0.5, color: "#94a3b8" }}>
            Tab Switch Latency
          </Typography>
          <Stack spacing={0.5}>
            {perfSamples.length === 0 ? (
              <Typography variant="caption">Switch tabs to record timings.</Typography>
            ) : (
              perfSamples.map((sample, idx) => (
                <Box key={`${sample.ts}-${idx}`} sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" sx={{ color: "#cbd5f5" }}>
                    {sample.from} → {sample.to}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#38bdf8" }}>
                    {sample.duration}ms
                  </Typography>
                </Box>
              ))
            )}
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

export default MealPrep;
