# Prep Thy Meal: Comprehensive Implementation Proposal
**Version:** Final
**Generated:** 2026-02-08
**Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Part 1: Foundation Fixes (v1 Implementation)](#part-1-foundation-fixes-v1-implementation)
3. [Part 2: Feature Roadmap (Post-v1)](#part-2-feature-roadmap-post-v1)
4. [Part 3: Implementation Guide](#part-3-implementation-guide)
5. [Part 4: Risks and Mitigations](#part-4-risks-and-mitigations)

---

## Executive Summary

### Current State Assessment

Prep Thy Meal is a feature-rich React meal planning application with significant technical capabilities (offline OCR, multi-API ingredient search, guest mode with cloud sync). However, it suffers from critical performance and architectural issues that impact user experience:

**Key Metrics:**
- Main bundle: 1,150 KB (352 KB gzip) — **2.3x over recommended 500 KB limit**
- Tab switch latency: ~600ms average, with Planner tab showing significant spikes
- All 5 tabs render simultaneously (hidden via `display:none`), wasting render cycles
- Guest users cannot save plans — **biggest friction point for trial users**
- Console warnings (MUI Grid migration, nested buttons, missing keys) create noise and potential runtime issues

### Critical Issues Identified (Cross-Cutting)

| # | Issue | Impact | Files |
|---|-------|--------|-------|
| 1 | All 5 tabs mount simultaneously — hidden via `display:none` | Perf + UX | `MealPrep.jsx:477-544` |
| 2 | God components (2675, 1800, 1293 lines) | Arch + Perf | Feature components |
| 3 | Main bundle 1,150 KB — no code splitting | Perf | `MealPrep.jsx:29-34`, `vite.config.js` |
| 4 | Guest users can't save plans | UX + Arch | `MealPrepCalculator.jsx:682-685` |
| 5 | Ingredients bypass storage facade | Arch | `ingredientStorage.js`, `storage.js` |
| 6 | Phantom npm deps (`aux`, `mui`, `ps`) | Perf + Arch | `package.json` |

### Proposed Solution Overview

A **4-phase implementation plan** focusing first on stability and performance, then UX improvements, followed by architectural consolidation:

**PR1 (P0):** Runtime Stability — Eliminate console warnings and import errors
**PR2 (P1):** Performance — Code splitting, lazy loading, bundle optimization
**PR3 (P1):** UX Friction — Guest save, onboarding, flow improvements
**PR4 (P2):** Storage Consolidation — Unified storage facade, diagnostics

### Success Criteria

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Tab switch latency (p75) | ~600ms | <200ms | Performance marks |
| Tab switch latency (p95) | High variance | <350ms | Performance marks |
| Main bundle size | 1,150 KB | <700 KB | Vite build output |
| Console warnings | Multiple | 0 | Dev console |
| Guest save success rate | 0% | 100% | User testing |

### Timeline Estimate

- **PR1 (P0):** 3-5 days — Runtime stability fixes
- **PR2 (P1):** 5-7 days — Performance optimizations
- **PR3 (P1):** 4-6 days — UX friction removal
- **PR4 (P2):** 5-7 days — Storage consolidation

**Total:** ~17-25 days for v1 foundation fixes

**Post-v1 Feature Roadmap:** Phased over 12+ months (see Part 2)

---

## Part 1: Foundation Fixes (v1 Implementation)

### Workstream 1 (P0): Runtime Stability

**Goal:** Eliminate console warnings and import errors that cause behavioral issues and noisy profiling.

**Estimated Effort:** 3-5 days

#### Task 1.1: Fix MUI Grid Migration Issues

**Problem:** Components use deprecated Grid2 imports and legacy props causing warnings.

**Files to Modify:**
- `src/features/meal-planner/MealPrepCalculator.jsx`
- `src/features/ingredients/IngredientManager.jsx`
- `src/features/calorie-calculator/CalorieCalculator.jsx`
- `src/features/account/AccountPage.jsx`

**Step-by-Step Implementation:**

1. **Search for Grid2 imports:**
   ```bash
   grep -r "Grid2\|Unstable_Grid2" src/
   ```

2. **Replace imports:**
   ```javascript
   // BEFORE
   import Grid2 from '@mui/material/Unstable_Grid2';
   // or
   import { Grid2 } from '@mui/material';

   // AFTER
   import Grid from '@mui/material/Grid';
   ```

3. **Update Grid props:**
   ```javascript
   // BEFORE
   <Grid item xs={12} sm={6} md={4}>

   // AFTER
   <Grid size={{ xs: 12, sm: 6, md: 4 }}>
   ```

4. **Remove `container` and `spacing` from nested Grids:**
   ```javascript
   // BEFORE
   <Grid container spacing={2}>
     <Grid item xs={12}>

   // AFTER
   <Grid container spacing={2}>
     <Grid size={{ xs: 12 }}>
   ```

5. **Test each modified component:**
   - Verify layout remains unchanged
   - Check no console warnings appear
   - Test responsive breakpoints

**Acceptance Criteria:**
- ✅ No Grid migration warnings in console
- ✅ All layouts render correctly at all breakpoints
- ✅ `npm run dev` starts without import errors

#### Task 1.2: Fix Nested Button DOM Structure

**Problem:** Accordion summary in MealPrepCalculator has button-in-button composition causing React warnings.

**File:** `src/features/meal-planner/MealPrepCalculator.jsx`

**Step-by-Step Implementation:**

1. **Locate the accordion summary** (around line 1600-1700):
   ```javascript
   <AccordionSummary expandIcon={<ExpandMoreIcon />}>
     <Button onClick={handleSomeAction}>...</Button>
   </AccordionSummary>
   ```

2. **Refactor to remove nested button:**
   ```javascript
   // Option A: Use IconButton outside AccordionSummary
   <Box display="flex" alignItems="center">
     <AccordionSummary expandIcon={<ExpandMoreIcon />}>
       <Typography>Meal Name</Typography>
     </AccordionSummary>
     <IconButton onClick={handleSomeAction}>
       <SomeIcon />
     </IconButton>
   </Box>

   // Option B: Use onClick on Box with stopPropagation
   <AccordionSummary expandIcon={<ExpandMoreIcon />}>
     <Box
       onClick={(e) => {
         e.stopPropagation();
         handleSomeAction();
       }}
       sx={{ cursor: 'pointer' }}
     >
       <Typography>Action</Typography>
     </Box>
   </AccordionSummary>
   ```

3. **Test interaction:**
   - Verify accordion expand/collapse still works
   - Verify action button/area works independently
   - Check no console warnings

**Acceptance Criteria:**
- ✅ No "button inside button" warnings
- ✅ Accordion and action buttons work independently
- ✅ No UX regression

#### Task 1.3: Fix Tooltip Disabled Child Issues

**Problem:** Tooltips wrapping disabled buttons don't work correctly without a span wrapper.

**Files:** Multiple (search for disabled buttons with Tooltips)

**Step-by-Step Implementation:**

1. **Find all disabled tooltips:**
   ```bash
   grep -r "Tooltip.*disabled" src/
   ```

2. **Wrap disabled elements:**
   ```javascript
   // BEFORE
   <Tooltip title="Cannot do this">
     <Button disabled>Action</Button>
   </Tooltip>

   // AFTER
   <Tooltip title="Cannot do this">
     <span>
       <Button disabled>Action</Button>
     </span>
   </Tooltip>
   ```

3. **Add CSS if needed:**
   ```javascript
   <Tooltip title="Cannot do this">
     <span style={{ display: 'inline-block' }}>
       <Button disabled>Action</Button>
     </span>
   </Tooltip>
   ```

**Acceptance Criteria:**
- ✅ All tooltips on disabled elements display correctly
- ✅ No console warnings about disabled tooltips
- ✅ Visual appearance unchanged

#### Task 1.4: Add Stable Keys to List Renders

**Problem:** Ingredient lists and other mapped elements missing unique keys.

**File:** `src/features/ingredients/IngredientManager.jsx` (around line 793+)

**Step-by-Step Implementation:**

1. **Find all `.map()` calls without keys:**
   ```bash
   grep -n "\.map(" src/features/ingredients/IngredientManager.jsx
   ```

2. **Add stable keys:**
   ```javascript
   // BEFORE
   {ingredients.map((ingredient) => (
     <TableRow>...</TableRow>
   ))}

   // AFTER
   {ingredients.map((ingredient) => (
     <TableRow key={ingredient.id || ingredient.name}>
       ...
     </TableRow>
   ))}
   ```

3. **Avoid index as key for dynamic lists:**
   ```javascript
   // BAD
   {items.map((item, index) => <div key={index}>...</div>)}

   // GOOD
   {items.map((item) => <div key={item.id}>...</div>)}
   ```

4. **Test list operations:**
   - Add/remove ingredients
   - Filter ingredients
   - Sort ingredients
   - Verify no re-rendering issues

**Acceptance Criteria:**
- ✅ No "missing key" warnings
- ✅ List updates work smoothly
- ✅ No unexpected re-renders

#### Task 1.5: Verification and Testing

**Step-by-Step Verification:**

1. **Start dev server:**
   ```bash
   npm run dev
   ```
   - Verify no Vite import errors
   - Check console for any remaining warnings

2. **Test each feature:**
   - Planner: Add/remove ingredients, expand/collapse meals
   - Calorie Calculator: Fill form, calculate TDEE
   - Ingredients: Search, add, edit, delete
   - Account: View profile, change settings

3. **Check responsive layouts:**
   - Test at 320px, 768px, 1024px, 1920px widths
   - Verify Grid layouts adapt correctly

4. **Production build test:**
   ```bash
   npm run build
   npm run preview
   ```
   - Check for build warnings
   - Test functionality in production mode

**Deliverables:**
- All console warnings eliminated
- Components render correctly at all breakpoints
- No runtime errors during normal workflows

---

### Workstream 2 (P1): Performance — Tab Latency + Bundle Size

**Goal:** Make tab switching feel fast and reduce initial load time.

**Estimated Effort:** 5-7 days

#### Task 2.1: Implement Conditional Tab Mounting

**Problem:** All 5 tabs render simultaneously (hidden via `display:none`), wasting render cycles.

**File:** `src/shared/components/layout/MealPrep.jsx`

**Step-by-Step Implementation:**

1. **Locate current tab panel structure** (lines 477-544):
   ```javascript
   // CURRENT PATTERN
   <Box hidden={activeTab !== TABS.CALCULATOR} {...tabPanelProps}>
     <MealPrepCalculator ... />
   </Box>
   ```

2. **Add mount tracking state:**
   ```javascript
   const [mountedTabs, setMountedTabs] = useState(new Set([TABS.CALCULATOR]));
   ```

3. **Track which tabs have been visited:**
   ```javascript
   useEffect(() => {
     setMountedTabs(prev => new Set(prev).add(activeTab));
   }, [activeTab]);
   ```

4. **Conditionally render only mounted tabs:**
   ```javascript
   {mountedTabs.has(TABS.CALCULATOR) && (
     <Box hidden={activeTab !== TABS.CALCULATOR} {...tabPanelProps}>
       <MealPrepCalculator ... />
     </Box>
   )}
   ```

5. **Keep Planner mounted by default:**
   ```javascript
   const [mountedTabs, setMountedTabs] = useState(
     new Set([TABS.CALCULATOR]) // Planner always starts mounted
   );
   ```

6. **Add loading state for first-time tabs:**
   ```javascript
   const [loadingTab, setLoadingTab] = useState(false);

   const handleTabChange = useCallback((newTab) => {
     if (!mountedTabs.has(newTab)) {
       setLoadingTab(true);
       // Will mount in next render
       setTimeout(() => setLoadingTab(false), 0);
     }
     setActiveTab(newTab);
   }, [mountedTabs]);
   ```

**Testing:**
- Switch between tabs
- Verify only visited tabs remain mounted
- Check that state persists when returning to a tab
- Measure tab switch latency improvement

**Acceptance Criteria:**
- ✅ Unvisited tabs don't mount on initial load
- ✅ Once mounted, tabs stay mounted (state preservation)
- ✅ Tab switch latency reduced

#### Task 2.2: Add React.lazy() for Tab Components

**Problem:** All tab components imported statically, bloating main bundle.

**File:** `src/shared/components/layout/MealPrep.jsx` (lines 29-34)

**Step-by-Step Implementation:**

1. **Replace static imports:**
   ```javascript
   // BEFORE
   import MealPrepCalculator from '../../features/meal-planner/MealPrepCalculator';
   import CalorieCalculator from '../../features/calorie-calculator/CalorieCalculator';
   import MealPrepInstructions from '../../features/instructions/MealPrepInstructions';
   import IngredientManager from '../../features/ingredients/IngredientManager';
   import AccountPage from '../../features/account/AccountPage';

   // AFTER - Keep Planner eager
   import MealPrepCalculator from '../../features/meal-planner/MealPrepCalculator';

   // Lazy load other tabs
   const CalorieCalculator = lazy(() =>
     import('../../features/calorie-calculator/CalorieCalculator')
   );
   const MealPrepInstructions = lazy(() =>
     import('../../features/instructions/MealPrepInstructions')
   );
   const IngredientManager = lazy(() =>
     import('../../features/ingredients/IngredientManager')
   );
   const AccountPage = lazy(() =>
     import('../../features/account/AccountPage')
   );
   ```

2. **Wrap tab panels in Suspense:**
   ```javascript
   {mountedTabs.has(TABS.CALORIE) && (
     <Box hidden={activeTab !== TABS.CALORIE} {...tabPanelProps}>
       <Suspense fallback={<SkeletonLoader variant="page" />}>
         <CalorieCalculator ... />
       </Suspense>
     </Box>
   )}
   ```

3. **Create dedicated loading skeleton:**
   ```javascript
   const TabLoadingFallback = () => (
     <Box sx={{ p: 3 }}>
       <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
       <Skeleton variant="text" width="40%" sx={{ mb: 1 }} />
       <Skeleton variant="rectangular" height={400} />
     </Box>
   );
   ```

4. **Add error boundary for lazy failures:**
   ```javascript
   <ErrorBoundary fallback={<div>Failed to load tab</div>}>
     <Suspense fallback={<TabLoadingFallback />}>
       <CalorieCalculator ... />
     </Suspense>
   </ErrorBoundary>
   ```

**Testing:**
- Clear browser cache
- Load app and check Network tab
- Verify non-Planner tabs only load when clicked
- Check chunk sizes in build output

**Acceptance Criteria:**
- ✅ Main bundle reduced by 40-60%
- ✅ Lazy chunks load successfully
- ✅ Loading states display smoothly
- ✅ Error boundaries catch failed chunk loads

#### Task 2.3: Optional Prefetch on Tab Hover

**Purpose:** Reduce perceived latency by preloading tab chunks on hover.

**Implementation:**
```javascript
const prefetchTab = useCallback((tab) => {
  // Prefetch the lazy component
  if (tab === TABS.CALORIE && !mountedTabs.has(TABS.CALORIE)) {
    import('../../features/calorie-calculator/CalorieCalculator');
  }
  // ... other tabs
}, [mountedTabs]);

<Tab
  onMouseEnter={() => prefetchTab(TABS.CALORIE)}
  onFocus={() => prefetchTab(TABS.CALORIE)}
  ...
/>
```

**Note:** This is optional and can be added in a follow-up commit if initial implementation shows lag.

#### Task 2.4: Dynamic Import for Tesseract.js

**Problem:** OCR library loaded in main bundle even though rarely used.

**File:** `src/shared/services/ocrService.js`

**Step-by-Step Implementation:**

1. **Current structure:**
   ```javascript
   // Line 1-3
   import Tesseract from 'tesseract.js';

   export const extractNutritionFromImage = async (imageFile) => {
     // OCR logic
   };
   ```

2. **Refactor to dynamic import:**
   ```javascript
   // Remove static import

   let tesseractModule = null;

   const getTesseract = async () => {
     if (!tesseractModule) {
       tesseractModule = await import('tesseract.js');
     }
     return tesseractModule.default;
   };

   export const extractNutritionFromImage = async (imageFile) => {
     const Tesseract = await getTesseract();

     // ... existing OCR logic
   };
   ```

3. **Add loading indicator in component:**
   ```javascript
   // In IngredientManager.jsx
   const [ocrLoading, setOcrLoading] = useState(false);

   const handleOCR = async (file) => {
     setOcrLoading(true);
     try {
       const result = await extractNutritionFromImage(file);
       // ... handle result
     } finally {
       setOcrLoading(false);
     }
   };
   ```

4. **Handle errors gracefully:**
   ```javascript
   export const extractNutritionFromImage = async (imageFile) => {
     try {
       const Tesseract = await getTesseract();
       // ... OCR logic
     } catch (error) {
       console.error('Failed to load OCR module:', error);
       throw new Error('OCR functionality is temporarily unavailable');
     }
   };
   ```

**Testing:**
- Check main bundle no longer includes Tesseract
- Trigger OCR and verify dynamic load
- Test error handling with network disabled

**Acceptance Criteria:**
- ✅ Tesseract.js not in main bundle
- ✅ OCR loads successfully on first use
- ✅ Loading state shown during chunk load
- ✅ Errors handled gracefully

#### Task 2.5: Configure Vite Manual Chunks

**Problem:** No vendor code splitting, causing cache invalidation on every update.

**File:** `vite.config.js`

**Step-by-Step Implementation:**

1. **Add rollup output configuration:**
   ```javascript
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [react()],
     build: {
       sourcemap: false, // Disable for production
       rollupOptions: {
         output: {
           manualChunks: {
             // React core
             'react-vendor': ['react', 'react-dom', 'react-router-dom'],

             // MUI components
             'mui-core': [
               '@mui/material',
               '@mui/icons-material',
               '@emotion/react',
               '@emotion/styled'
             ],

             // Firebase
             'firebase': [
               'firebase/app',
               'firebase/auth',
               'firebase/firestore'
             ],

             // PDF generation (already lazy)
             'pdf-libs': [
               'jspdf',
               'jspdf-autotable'
             ],

             // Heavy utilities
             'utils': [
               'date-fns',
               'react-hot-toast'
             ]
           }
         }
       }
     }
   });
   ```

2. **Add bundle analyzer (optional):**
   ```bash
   npm install --save-dev rollup-plugin-visualizer
   ```

   ```javascript
   import { visualizer } from 'rollup-plugin-visualizer';

   export default defineConfig({
     plugins: [
       react(),
       visualizer({
         filename: './dist/stats.html',
         open: true,
         gzipSize: true,
         brotliSize: true
       })
     ],
     // ... rest of config
   });
   ```

3. **Test build output:**
   ```bash
   npm run build
   ```

4. **Expected output:**
   ```
   dist/assets/react-vendor-[hash].js    ~150KB
   dist/assets/mui-core-[hash].js        ~350KB
   dist/assets/firebase-[hash].js        ~150KB
   dist/assets/index-[hash].js           <700KB (main app code)
   ```

**Testing:**
- Build project and check dist/ folder
- Verify chunk sizes are reasonable
- Test that lazy chunks still load correctly
- Check Network tab for parallel chunk loading

**Acceptance Criteria:**
- ✅ Vendor code split into separate chunks
- ✅ Main bundle under 700KB
- ✅ Chunks load in parallel
- ✅ Long-term caching works (vendor chunks stable)

#### Task 2.6: Remove Duplicate CSS and Fix will-change

**Problem:** Duplicate keyframes and permanent `will-change` usage.

**File:** `src/index.css`

**Step-by-Step Implementation:**

1. **Find duplicate keyframes** (lines 151-199 and 222-291):
   ```bash
   grep -n "@keyframes" src/index.css
   ```

2. **Remove duplicates:**
   - Keep first definition
   - Delete second occurrence
   - Verify no other files reference the duplicates

3. **Fix permanent will-change:**
   ```css
   /* BEFORE - lines 137-139 */
   .MuiBox-root[role="tabpanel"] {
     will-change: transform, opacity;
   }

   /* AFTER - conditional, only during animation */
   .MuiBox-root[role="tabpanel"].animating {
     will-change: transform, opacity;
   }

   .MuiBox-root[role="tabpanel"] {
     will-change: auto;
   }
   ```

4. **Add/remove class during tab transitions:**
   ```javascript
   // In MealPrep.jsx
   const handleTabChange = useCallback((newTab) => {
     const panel = document.querySelector(`[role="tabpanel"][aria-labelledby="${newTab}"]`);
     panel?.classList.add('animating');

     setActiveTab(newTab);

     setTimeout(() => {
       panel?.classList.remove('animating');
     }, 300); // Match animation duration
   }, []);
   ```

**Testing:**
- Switch tabs and verify animations still work
- Check DevTools Performance tab for compositing layers
- Verify reduced GPU memory usage

**Acceptance Criteria:**
- ✅ No duplicate keyframes in CSS
- ✅ `will-change` only active during animations
- ✅ Animations work smoothly
- ✅ Reduced GPU memory usage

#### Task 2.7: Remove Phantom Dependencies

**Problem:** Unused/phantom packages in package.json.

**File:** `package.json`

**Step-by-Step Implementation:**

1. **Identify phantom deps:**
   ```bash
   # Search codebase for imports
   grep -r "from 'aux'" src/
   grep -r "from 'mui'" src/
   grep -r "from 'ps'" src/
   grep -r "from '@mui/x-data-grid'" src/
   ```

2. **Remove if not found:**
   ```bash
   npm uninstall aux mui ps
   # Check @mui/x-data-grid usage first
   # If not used:
   npm uninstall @mui/x-data-grid
   ```

3. **Clean install:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Test build:**
   ```bash
   npm run build
   npm run preview
   ```

**Acceptance Criteria:**
- ✅ No unused packages in package.json
- ✅ Build succeeds without removed packages
- ✅ All features work correctly

#### Task 2.8: Performance Benchmarking

**Purpose:** Establish baseline and verify improvements.

**Step-by-Step Process:**

1. **Add performance marks:**
   ```javascript
   // In MealPrep.jsx
   const handleTabChange = useCallback((newTab) => {
     performance.mark('tab-switch-start');
     setActiveTab(newTab);
   }, []);

   useEffect(() => {
     if (activeTab) {
       performance.mark('tab-switch-end');
       performance.measure('tab-switch', 'tab-switch-start', 'tab-switch-end');

       const measure = performance.getEntriesByName('tab-switch')[0];
       console.log(`Tab switch took ${measure.duration}ms`);
     }
   }, [activeTab]);
   ```

2. **Collect metrics:**
   ```javascript
   // Create utility to collect stats
   const tabSwitchTimes = [];

   const recordTabSwitch = (duration) => {
     tabSwitchTimes.push(duration);

     if (tabSwitchTimes.length >= 30) {
       const sorted = [...tabSwitchTimes].sort((a, b) => a - b);
       const p50 = sorted[Math.floor(sorted.length * 0.5)];
       const p75 = sorted[Math.floor(sorted.length * 0.75)];
       const p95 = sorted[Math.floor(sorted.length * 0.95)];

       console.table({ p50, p75, p95 });
     }
   };
   ```

3. **Run benchmark:**
   ```bash
   npm run build
   npm run preview
   ```
   - Switch between all tabs 30 times
   - Record p50, p75, p95 latencies
   - Compare to baseline

4. **Document results:**
   Create `/docs/perf-baseline.md`:
   ```markdown
   # Performance Baseline

   ## Before Optimization
   - Main bundle: 1,150 KB
   - Tab switch p75: ~600ms
   - Tab switch p95: ~900ms

   ## After Workstream 2
   - Main bundle: [RECORD]
   - Tab switch p75: [RECORD]
   - Tab switch p95: [RECORD]
   ```

**Acceptance Criteria:**
- ✅ Performance marks captured
- ✅ p75 tab switch <200ms
- ✅ p95 tab switch <350ms
- ✅ Main bundle <700KB

---

### Workstream 3 (P1): UX Friction

**Goal:** Remove trial-user dead ends and reduce multi-step flows.

**Estimated Effort:** 4-6 days

#### Task 3.1: Enable Guest Plan Saving

**Problem:** Guest users can't save plans, causing frustration and lost work.

**File:** `src/features/meal-planner/MealPrepCalculator.jsx` (lines 682-685)

**Step-by-Step Implementation:**

1. **Remove auth check:**
   ```javascript
   // BEFORE - line 682
   const handleSavePlan = async () => {
     if (!uid) {
       toast.error("Please sign in to save plans.");
       return;
     }
     // ... save logic
   };

   // AFTER
   const handleSavePlan = async () => {
     // Remove auth check - storage facade handles guest vs auth

     try {
       const planToSave = {
         name: currentPlanName,
         meals: currentMeals,
         calorieTarget: dailyCalories,
         // ... other plan data
       };

       await storage.savePlan(planToSave, uid); // uid can be null for guests

       if (uid) {
         toast.success('Plan saved to cloud');
       } else {
         toast.success(
           'Plan saved locally. Sign in to sync across devices.',
           { duration: 5000 }
         );
       }
     } catch (error) {
       toast.error('Failed to save plan');
     }
   };
   ```

2. **Update storage facade (if needed):**
   ```javascript
   // In src/shared/services/storage.js
   export const savePlan = async (plan, userId = null) => {
     if (userId) {
       return await savePlanToFirestore(plan, userId);
     } else {
       return guestStorage.savePlan(plan);
     }
   };

   export const loadPlans = async (userId = null) => {
     if (userId) {
       return await loadPlansFromFirestore(userId);
     } else {
       return guestStorage.loadPlans();
     }
   };
   ```

3. **Add cloud sync nudge:**
   ```javascript
   // Show after 3rd guest save
   const showSyncNudge = () => {
     const saveCount = localStorage.getItem('guestSaveCount') || 0;
     const newCount = parseInt(saveCount) + 1;
     localStorage.setItem('guestSaveCount', newCount);

     if (newCount === 3 && !uid) {
       setTimeout(() => {
         toast(
           (t) => (
             <Box>
               <Typography variant="body2" gutterBottom>
                 Sign in to sync your plans across devices
               </Typography>
               <Button size="small" onClick={() => {
                 toast.dismiss(t.id);
                 // Open login modal
               }}>
                 Sign In
               </Button>
             </Box>
           ),
           { duration: 7000 }
         );
       }, 2000);
     }
   };
   ```

**Testing:**
- Create plan as guest
- Save plan
- Refresh page
- Verify plan persists
- Sign in and verify migration works

**Acceptance Criteria:**
- ✅ Guests can save plans to localStorage
- ✅ Saved plans persist across sessions
- ✅ Helpful nudge shown (not blocking)
- ✅ Migration works when guest signs in

#### Task 3.2: Show Onboarding for Guest Users

**Problem:** Onboarding only shows for authenticated users.

**File:** `src/app/App.jsx` (lines 19-25)

**Step-by-Step Implementation:**

1. **Remove auth requirement:**
   ```javascript
   // BEFORE
   if (user && !hasCompletedOnboarding()) {
     const timer = setTimeout(() => setShowOnboarding(true), 500);
     return () => clearTimeout(timer);
   }

   // AFTER
   useEffect(() => {
     // Check onboarding for all users (guest or auth)
     if (!hasCompletedOnboarding()) {
       const timer = setTimeout(() => setShowOnboarding(true), 500);
       return () => clearTimeout(timer);
     }
   }, []); // Remove 'user' dependency
   ```

2. **Update onboarding completion:**
   ```javascript
   // In src/shared/services/onboarding.js
   export const markOnboardingComplete = () => {
     localStorage.setItem('hasCompletedOnboarding', 'true');
     // Also set for user if authenticated
     if (auth.currentUser) {
       // Set in Firestore user preferences
     }
   };

   export const hasCompletedOnboarding = () => {
     // Check localStorage for all users
     return localStorage.getItem('hasCompletedOnboarding') === 'true';
   };
   ```

3. **Handle migration:**
   ```javascript
   // When guest signs in, migrate onboarding status
   const migrateGuestOnboarding = async (userId) => {
     const completed = localStorage.getItem('hasCompletedOnboarding');
     if (completed === 'true') {
       await setDoc(doc(db, 'users', userId, 'preferences', 'onboarding'), {
         completed: true,
         completedAt: new Date()
       });
     }
   };
   ```

**Testing:**
- Clear localStorage and cookies
- Load app as guest
- Verify onboarding appears
- Complete onboarding
- Refresh and verify it doesn't show again
- Sign in and verify status migrates

**Acceptance Criteria:**
- ✅ Onboarding shows for guest users
- ✅ Completion persists in localStorage
- ✅ Doesn't show again after completion
- ✅ Status migrates when signing in

#### Task 3.3: Replace localStorage Bridge with Macro Context

**Problem:** Calorie Calculator uses fragile localStorage event listener for cross-tab communication.

**Files:**
- `src/features/calorie-calculator/CalorieCalculator.jsx`
- `src/features/meal-planner/MealPrepCalculator.jsx` (lines 341-376)

**Step-by-Step Implementation:**

1. **Create MacroTargetsContext:**
   ```javascript
   // Create src/shared/context/MacroTargetsContext.jsx
   import React, { createContext, useContext, useState, useCallback } from 'react';

   const MacroTargetsContext = createContext();

   export const MacroTargetsProvider = ({ children }) => {
     const [pendingTargets, setPendingTargets] = useState(null);

     const setTargets = useCallback((targets) => {
       setPendingTargets({
         ...targets,
         timestamp: Date.now()
       });
     }, []);

     const consumePendingTargets = useCallback(() => {
       const targets = pendingTargets;
       setPendingTargets(null);
       return targets;
     }, [pendingTargets]);

     const hasPendingTargets = useCallback(() => {
       return pendingTargets !== null;
     }, [pendingTargets]);

     return (
       <MacroTargetsContext.Provider value={{
         pendingTargets,
         setTargets,
         consumePendingTargets,
         hasPendingTargets
       }}>
         {children}
       </MacroTargetsContext.Provider>
     );
   };

   export const useMacroTargets = () => {
     const context = useContext(MacroTargetsContext);
     if (!context) {
       throw new Error('useMacroTargets must be used within MacroTargetsProvider');
     }
     return context;
   };
   ```

2. **Wrap app in provider:**
   ```javascript
   // In src/app/App.jsx
   import { MacroTargetsProvider } from '../shared/context/MacroTargetsContext';

   function App() {
     return (
       <ThemeProvider>
         <UserProvider>
           <MacroTargetsProvider>
             {/* ... rest of app */}
           </MacroTargetsProvider>
         </UserProvider>
       </ThemeProvider>
     );
   }
   ```

3. **Update CalorieCalculator to use context:**
   ```javascript
   // In CalorieCalculator.jsx
   import { useMacroTargets } from '../../shared/context/MacroTargetsContext';

   const CalorieCalculator = ({ onNavigate }) => {
     const { setTargets } = useMacroTargets();

     const handleSendToPlanner = () => {
       const targets = {
         calories: dailyCalories,
         protein: macros.protein,
         carbs: macros.carbs,
         fat: macros.fat
       };

       setTargets(targets);

       toast.success('Targets sent to Planner');

       // Auto-navigate to Planner tab
       if (onNavigate) {
         onNavigate('calculator'); // TABS.CALCULATOR
       }
     };

     return (
       // ... component JSX
       <Button onClick={handleSendToPlanner}>
         Send to Planner
       </Button>
     );
   };
   ```

4. **Update MealPrepCalculator to consume targets:**
   ```javascript
   // In MealPrepCalculator.jsx
   import { useMacroTargets } from '../../shared/context/MacroTargetsContext';

   const MealPrepCalculator = () => {
     const { hasPendingTargets, consumePendingTargets } = useMacroTargets();

     // Check for pending targets on mount and when tab becomes active
     useEffect(() => {
       if (hasPendingTargets()) {
         const targets = consumePendingTargets();

         if (targets) {
           setDailyCalories(targets.calories);
           setMacroTargets({
             protein: targets.protein,
             carbs: targets.carbs,
             fat: targets.fat
           });

           toast.success('Calorie targets applied');
         }
       }
     }, []); // Run on mount

     // ... rest of component
   };
   ```

5. **Remove localStorage event listeners:**
   ```javascript
   // DELETE from MealPrepCalculator.jsx (lines 341-376)
   // Remove entire localStorage event listener useEffect
   ```

6. **Pass navigation callback to CalorieCalculator:**
   ```javascript
   // In MealPrep.jsx
   const handleNavigateFromCalorie = useCallback((tab) => {
     setActiveTab(tab);
   }, []);

   <CalorieCalculator
     onNavigate={handleNavigateFromCalorie}
     // ... other props
   />
   ```

**Testing:**
- Calculate macros in Calorie Calculator
- Click "Send to Planner"
- Verify auto-navigation to Planner
- Verify targets applied immediately
- Verify toast confirmation shown

**Acceptance Criteria:**
- ✅ No localStorage used for cross-tab communication
- ✅ Targets transfer immediately via context
- ✅ Auto-navigation to Planner tab works
- ✅ Clear user feedback provided
- ✅ No localStorage event listeners remain

#### Task 3.4: Mobile Header Optimization

**Problem:** Toolbar overflows on narrow mobile screens (320-375px).

**File:** `src/shared/components/layout/MealPrep.jsx` (lines 239-421)

**Step-by-Step Implementation:**

1. **Identify mobile breakpoints:**
   ```javascript
   const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
   const isNarrowMobile = useMediaQuery('(max-width:375px)');
   ```

2. **Conditionally render header elements:**
   ```javascript
   <AppBar position="sticky">
     <Toolbar>
       {/* Logo - always show */}
       <Box sx={{ display: 'flex', alignItems: 'center' }}>
         <RestaurantIcon sx={{ mr: 1 }} />
         {!isNarrowMobile && (
           <Typography variant="h6">Prep Thy Meal</Typography>
         )}
       </Box>

       <Box sx={{ flexGrow: 1 }} />

       {/* Status indicators - hide on narrow mobile */}
       {!isNarrowMobile && (
         <>
           <OnlineStatusIndicator />
           <SyncTimestamp />
         </>
       )}

       {/* Theme toggle - always show */}
       <ThemeToggle />

       {/* Auth - always show */}
       {user ? (
         <>
           <Avatar />
           {!isMobile && <LogoutButton />}
         </>
       ) : (
         <LoginButton />
       )}
     </Toolbar>
   </AppBar>
   ```

3. **Move status to Account tab on mobile:**
   ```javascript
   // In AccountPage.jsx
   const StatusSection = () => {
     const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

     if (!isMobile) return null;

     return (
       <Paper sx={{ p: 2, mb: 2 }}>
         <Typography variant="subtitle2" gutterBottom>
           Connection Status
         </Typography>
         <OnlineStatusIndicator />
         <SyncTimestamp />
       </Paper>
     );
   };
   ```

4. **Test at multiple widths:**
   - 320px (iPhone SE)
   - 375px (iPhone 12)
   - 768px (iPad)
   - 1024px (desktop)

**Acceptance Criteria:**
- ✅ No horizontal overflow at 320px width
- ✅ All critical actions accessible on mobile
- ✅ Status info available in Account tab on mobile
- ✅ Responsive layout works smoothly

#### Task 3.5: Add Deep Linking Support

**Problem:** No URL routing for tabs, can't bookmark/share specific views.

**File:** `src/shared/components/layout/MealPrep.jsx`

**Step-by-Step Implementation:**

1. **Read tab from URL on mount:**
   ```javascript
   const [activeTab, setActiveTab] = useState(() => {
     const params = new URLSearchParams(window.location.search);
     const tabParam = params.get('tab');

     // Map tab param to TABS constant
     const tabMap = {
       'planner': TABS.CALCULATOR,
       'calories': TABS.CALORIE,
       'guide': TABS.INSTRUCTIONS,
       'ingredients': TABS.INGREDIENTS,
       'account': TABS.ACCOUNT
     };

     return tabMap[tabParam] || TABS.CALCULATOR;
   });
   ```

2. **Update URL when tab changes:**
   ```javascript
   const handleTabChange = useCallback((newTab) => {
     setActiveTab(newTab);

     // Map TABS constant to URL param
     const tabParamMap = {
       [TABS.CALCULATOR]: 'planner',
       [TABS.CALORIE]: 'calories',
       [TABS.INSTRUCTIONS]: 'guide',
       [TABS.INGREDIENTS]: 'ingredients',
       [TABS.ACCOUNT]: 'account'
     };

     const tabParam = tabParamMap[newTab];
     const url = new URL(window.location);
     url.searchParams.set('tab', tabParam);
     window.history.pushState({}, '', url);
   }, []);
   ```

3. **Handle browser back/forward:**
   ```javascript
   useEffect(() => {
     const handlePopState = () => {
       const params = new URLSearchParams(window.location.search);
       const tabParam = params.get('tab');

       const tabMap = {
         'planner': TABS.CALCULATOR,
         'calories': TABS.CALORIE,
         'guide': TABS.INSTRUCTIONS,
         'ingredients': TABS.INGREDIENTS,
         'account': TABS.ACCOUNT
       };

       const newTab = tabMap[tabParam] || TABS.CALCULATOR;
       setActiveTab(newTab);
     };

     window.addEventListener('popstate', handlePopState);
     return () => window.removeEventListener('popstate', handlePopState);
   }, []);
   ```

**Testing:**
- Switch tabs and verify URL updates
- Refresh page on different tabs
- Use browser back/forward buttons
- Share URL with tab parameter
- Verify default behavior when no tab param

**Acceptance Criteria:**
- ✅ URL updates when tab changes
- ✅ Correct tab loads from URL on page load
- ✅ Browser back/forward navigate tabs
- ✅ Shareable URLs work correctly

---

### Workstream 4 (P2): Storage Consolidation

**Goal:** Unified persistence contract for all data types.

**Estimated Effort:** 5-7 days

#### Task 4.1: Extend Storage Facade for Ingredients

**Problem:** Ingredients bypass storage facade, causing parallel storage paths.

**Files:**
- `src/shared/services/storage.js`
- `src/features/ingredients/ingredientStorage.js`

**Step-by-Step Implementation:**

1. **Add ingredient methods to storage facade:**
   ```javascript
   // In src/shared/services/storage.js

   // Import ingredient storage methods
   import * as ingredientStorage from '../../features/ingredients/ingredientStorage';

   // Add new facade methods
   export const loadIngredients = async (userId = null) => {
     if (userId) {
       return await ingredientStorage.loadCustomIngredients(userId);
     } else {
       return guestStorage.loadIngredients();
     }
   };

   export const saveIngredient = async (ingredient, userId = null) => {
     if (userId) {
       return await ingredientStorage.addCustomIngredient(ingredient, userId);
     } else {
       return guestStorage.saveIngredient(ingredient);
     }
   };

   export const updateIngredient = async (ingredientId, updates, userId = null) => {
     if (userId) {
       return await ingredientStorage.updateCustomIngredient(ingredientId, updates, userId);
     } else {
       return guestStorage.updateIngredient(ingredientId, updates);
     }
   };

   export const deleteIngredient = async (ingredientId, userId = null) => {
     if (userId) {
       return await ingredientStorage.deleteCustomIngredient(ingredientId, userId);
     } else {
       return guestStorage.deleteIngredient(ingredientId);
     }
   };
   ```

2. **Implement guest ingredient storage:**
   ```javascript
   // In src/shared/services/guestStorage.js

   export const loadIngredients = () => {
     try {
       const stored = localStorage.getItem('guestIngredients');
       return stored ? JSON.parse(stored) : [];
     } catch (error) {
       console.error('Failed to load guest ingredients:', error);
       return [];
     }
   };

   export const saveIngredient = (ingredient) => {
     try {
       const ingredients = loadIngredients();
       const newIngredient = {
         ...ingredient,
         id: ingredient.id || `guest-${Date.now()}-${Math.random()}`,
         createdAt: new Date().toISOString()
       };
       ingredients.push(newIngredient);
       localStorage.setItem('guestIngredients', JSON.stringify(ingredients));
       return newIngredient;
     } catch (error) {
       console.error('Failed to save guest ingredient:', error);
       throw error;
     }
   };

   export const updateIngredient = (ingredientId, updates) => {
     try {
       const ingredients = loadIngredients();
       const index = ingredients.findIndex(i => i.id === ingredientId);

       if (index === -1) {
         throw new Error('Ingredient not found');
       }

       ingredients[index] = { ...ingredients[index], ...updates };
       localStorage.setItem('guestIngredients', JSON.stringify(ingredients));
       return ingredients[index];
     } catch (error) {
       console.error('Failed to update guest ingredient:', error);
       throw error;
     }
   };

   export const deleteIngredient = (ingredientId) => {
     try {
       const ingredients = loadIngredients();
       const filtered = ingredients.filter(i => i.id !== ingredientId);
       localStorage.setItem('guestIngredients', JSON.stringify(filtered));
       return true;
     } catch (error) {
       console.error('Failed to delete guest ingredient:', error);
       throw error;
     }
   };
   ```

3. **Update IngredientManager to use facade:**
   ```javascript
   // In src/features/ingredients/IngredientManager.jsx

   // Replace direct ingredientStorage imports
   import * as storage from '../../shared/services/storage';
   import { useUser } from '../../shared/context/UserContext';

   const IngredientManager = () => {
     const { user } = useUser();
     const uid = user?.uid;

     // Load ingredients through facade
     useEffect(() => {
       const loadIngredients = async () => {
         try {
           const ingredients = await storage.loadIngredients(uid);
           setCustomIngredients(ingredients);
         } catch (error) {
           toast.error('Failed to load ingredients');
         }
       };
       loadIngredients();
     }, [uid]);

     // Save ingredient through facade
     const handleSaveIngredient = async (ingredient) => {
       try {
         await storage.saveIngredient(ingredient, uid);
         toast.success('Ingredient saved');
         // Invalidate cache
         invalidateIngredientCache();
       } catch (error) {
         toast.error('Failed to save ingredient');
       }
     };

     // ... other methods updated similarly
   };
   ```

4. **Update guest migration:**
   ```javascript
   // In src/shared/services/guestMigration.js

   export const migrateGuestDataToUser = async (userId) => {
     try {
       // Existing plan migration
       const plans = guestStorage.loadPlans();
       // ... migrate plans

       // NEW: Migrate ingredients
       const ingredients = guestStorage.loadIngredients();
       for (const ingredient of ingredients) {
         await storage.saveIngredient(ingredient, userId);
       }

       // Clear guest ingredients after successful migration
       localStorage.removeItem('guestIngredients');

       return { success: true, migratedIngredients: ingredients.length };
     } catch (error) {
       console.error('Migration failed:', error);
       throw error;
     }
   };
   ```

**Testing:**
- Add ingredient as guest
- Verify saved to localStorage
- Sign in and verify migration
- Add ingredient as authenticated user
- Verify saved to Firestore
- Sign out and verify guest storage still works

**Acceptance Criteria:**
- ✅ Ingredients routed through storage facade
- ✅ Guest ingredients persist to localStorage
- ✅ Auth ingredients persist to Firestore
- ✅ Migration includes ingredients
- ✅ Cache invalidation works correctly

#### Task 4.2: Extend Storage Facade for Preferences and Favorites

**Files:**
- `src/shared/services/userPreferences.js`
- `src/shared/services/favorites.js`
- `src/shared/services/recentIngredients.js`

**Step-by-Step Implementation:**

1. **Add facade methods:**
   ```javascript
   // In src/shared/services/storage.js

   export const loadPreferences = async (userId = null) => {
     if (userId) {
       return await userPreferences.getUserPreferences(userId);
     } else {
       return guestStorage.loadPreferences();
     }
   };

   export const savePreferences = async (preferences, userId = null) => {
     if (userId) {
       return await userPreferences.saveUserPreferences(preferences, userId);
     } else {
       return guestStorage.savePreferences(preferences);
     }
   };

   export const loadFavorites = async (userId = null) => {
     if (userId) {
       // Implement Firestore favorites
       const doc = await getDoc(doc(db, 'users', userId, 'data', 'favorites'));
       return doc.data()?.ingredients || [];
     } else {
       return guestStorage.loadFavorites();
     }
   };

   export const saveFavorite = async (ingredientId, userId = null) => {
     if (userId) {
       // Firestore implementation
     } else {
       return guestStorage.saveFavorite(ingredientId);
     }
   };

   export const loadRecentIngredients = async (userId = null) => {
     if (userId) {
       // Firestore implementation
     } else {
       return guestStorage.loadRecentIngredients();
     }
   };

   export const saveRecentIngredient = async (ingredient, userId = null) => {
     if (userId) {
       // Firestore implementation
     } else {
       return guestStorage.saveRecentIngredient(ingredient);
     }
   };
   ```

2. **Implement guest storage methods:**
   ```javascript
   // In src/shared/services/guestStorage.js

   export const loadPreferences = () => {
     try {
       const stored = localStorage.getItem('guestPreferences');
       return stored ? JSON.parse(stored) : getDefaultPreferences();
     } catch (error) {
       return getDefaultPreferences();
     }
   };

   export const savePreferences = (preferences) => {
     try {
       localStorage.setItem('guestPreferences', JSON.stringify(preferences));
       return preferences;
     } catch (error) {
       throw new Error('Failed to save preferences');
     }
   };

   export const loadFavorites = () => {
     try {
       const stored = localStorage.getItem('guestFavorites');
       return stored ? JSON.parse(stored) : [];
     } catch (error) {
       return [];
     }
   };

   export const saveFavorite = (ingredientId) => {
     try {
       const favorites = loadFavorites();
       if (!favorites.includes(ingredientId)) {
         favorites.push(ingredientId);
         localStorage.setItem('guestFavorites', JSON.stringify(favorites));
       }
       return favorites;
     } catch (error) {
       throw new Error('Failed to save favorite');
     }
   };

   export const loadRecentIngredients = () => {
     try {
       const stored = localStorage.getItem('guestRecents');
       return stored ? JSON.parse(stored) : [];
     } catch (error) {
       return [];
     }
   };

   export const saveRecentIngredient = (ingredient) => {
     try {
       const recents = loadRecentIngredients();
       // Keep only last 10
       const updated = [ingredient, ...recents.filter(r => r.id !== ingredient.id)].slice(0, 10);
       localStorage.setItem('guestRecents', JSON.stringify(updated));
       return updated;
     } catch (error) {
       throw new Error('Failed to save recent ingredient');
     }
   };
   ```

3. **Update components to use facade:**
   ```javascript
   // Update all components that currently use:
   // - userPreferences.js directly
   // - favorites.js directly
   // - recentIngredients.js directly

   // Replace with storage facade calls
   import * as storage from '../../shared/services/storage';
   ```

4. **Update migration:**
   ```javascript
   // Add to guestMigration.js
   const preferences = guestStorage.loadPreferences();
   await storage.savePreferences(preferences, userId);

   const favorites = guestStorage.loadFavorites();
   // Migrate favorites to Firestore

   const recents = guestStorage.loadRecentIngredients();
   // Migrate recents to Firestore
   ```

**Acceptance Criteria:**
- ✅ All data types routed through storage facade
- ✅ Guest storage works for preferences/favorites/recents
- ✅ Migration includes all data types
- ✅ Consistent API across all storage operations

#### Task 4.3: Centralize localStorage with Key Registry

**Problem:** 8+ independent localStorage keys with no central management.

**Step-by-Step Implementation:**

1. **Create localStorage service:**
   ```javascript
   // Create src/shared/services/localStorageService.js

   const STORAGE_KEYS = {
     GUEST_PLANS: 'guestPlans',
     GUEST_INGREDIENTS: 'guestIngredients',
     GUEST_PREFERENCES: 'guestPreferences',
     GUEST_FAVORITES: 'guestFavorites',
     GUEST_RECENTS: 'guestRecents',
     ONBOARDING_COMPLETE: 'hasCompletedOnboarding',
     THEME: 'theme',
     CALORIE_PROFILE: 'calorieCalculatorProfile',
     LAST_PLAN: 'lastPlan'
   };

   class LocalStorageService {
     constructor() {
       this.keys = STORAGE_KEYS;
     }

     get(key, defaultValue = null) {
       try {
         const item = localStorage.getItem(key);
         return item ? JSON.parse(item) : defaultValue;
       } catch (error) {
         console.error(`Failed to get ${key} from localStorage:`, error);
         return defaultValue;
       }
     }

     set(key, value) {
       try {
         localStorage.setItem(key, JSON.stringify(value));
         return true;
       } catch (error) {
         console.error(`Failed to set ${key} in localStorage:`, error);

         // Handle quota exceeded
         if (error.name === 'QuotaExceededError') {
           this.handleQuotaExceeded();
         }

         return false;
       }
     }

     remove(key) {
       try {
         localStorage.removeItem(key);
         return true;
       } catch (error) {
         console.error(`Failed to remove ${key} from localStorage:`, error);
         return false;
       }
     }

     clear() {
       try {
         localStorage.clear();
         return true;
       } catch (error) {
         console.error('Failed to clear localStorage:', error);
         return false;
       }
     }

     handleQuotaExceeded() {
       // Clear old data to make space
       console.warn('localStorage quota exceeded, cleaning up...');

       // Remove old recents
       this.remove(STORAGE_KEYS.GUEST_RECENTS);

       // Try operation again
       // Let caller handle retry
     }

     getAllKeys() {
       return Object.values(STORAGE_KEYS);
     }

     getStorageSize() {
       let total = 0;
       for (const key of this.getAllKeys()) {
         const item = localStorage.getItem(key);
         if (item) {
           total += item.length + key.length;
         }
       }
       return total;
     }
   }

   export const localStorageService = new LocalStorageService();
   export { STORAGE_KEYS };
   ```

2. **Replace direct localStorage calls:**
   ```javascript
   // BEFORE
   const plans = JSON.parse(localStorage.getItem('guestPlans') || '[]');

   // AFTER
   import { localStorageService, STORAGE_KEYS } from '../services/localStorageService';
   const plans = localStorageService.get(STORAGE_KEYS.GUEST_PLANS, []);
   ```

3. **Update all files:**
   - Search for `localStorage.getItem`
   - Search for `localStorage.setItem`
   - Search for `localStorage.removeItem`
   - Replace with localStorageService calls

4. **Add storage monitoring:**
   ```javascript
   // Optional: Add to App.jsx
   useEffect(() => {
     const size = localStorageService.getStorageSize();
     const maxSize = 5 * 1024 * 1024; // 5MB typical limit

     if (size > maxSize * 0.8) {
       console.warn(`localStorage usage: ${(size / 1024 / 1024).toFixed(2)}MB`);
     }
   }, []);
   ```

**Acceptance Criteria:**
- ✅ All localStorage access centralized
- ✅ Consistent error handling
- ✅ Safe JSON parse with fallbacks
- ✅ Quota exceeded handling
- ✅ No direct localStorage calls remain

#### Task 4.4: Remove Debug Globals

**Problem:** Debug function exposed on window object in production.

**File:** `src/features/ingredients/cleanupDuplicates.js` (line 49)

**Step-by-Step Implementation:**

1. **Locate window assignment:**
   ```javascript
   // Line 49
   window.cleanupDuplicateIngredients = cleanupDuplicateIngredients;
   ```

2. **Gate behind dev mode:**
   ```javascript
   // Only expose in development
   if (import.meta.env.DEV) {
     window.cleanupDuplicateIngredients = cleanupDuplicateIngredients;
     console.log('Debug: cleanupDuplicateIngredients() available in console');
   }
   ```

3. **Search for other window assignments:**
   ```bash
   grep -rn "window\." src/ | grep -v "window.location" | grep -v "window.addEventListener"
   ```

4. **Remove or gate all debug globals:**
   ```javascript
   if (import.meta.env.DEV) {
     window.DEBUG = {
       cleanupDuplicates: cleanupDuplicateIngredients,
       // ... other debug utilities
     };
   }
   ```

**Acceptance Criteria:**
- ✅ No debug functions on window in production
- ✅ Debug utilities available in dev mode
- ✅ No console logs in production build

---

### Workstream 5 (P2): Diagnostics and Performance Guardrails

**Goal:** Make latency regressions measurable and repeatable.

**Estimated Effort:** 2-3 days

#### Task 5.1: Add Performance Marks and Measures

**File:** `src/shared/components/layout/MealPrep.jsx`

**Step-by-Step Implementation:**

1. **Add performance marks:**
   ```javascript
   const handleTabChange = useCallback((newTab) => {
     performance.mark('tab-switch-start');
     performance.measure('tab-switch-trigger', 'navigationStart', 'tab-switch-start');

     setActiveTab(newTab);
   }, []);

   useEffect(() => {
     if (activeTab) {
       performance.mark('tab-switch-end');
       performance.measure('tab-switch-duration', 'tab-switch-start', 'tab-switch-end');

       // Log in dev mode
       if (import.meta.env.DEV) {
         const entries = performance.getEntriesByType('measure');
         const latest = entries[entries.length - 1];
         console.log(`Tab switch: ${latest.duration.toFixed(2)}ms`);
       }
     }
   }, [activeTab]);
   ```

2. **Add first render marks:**
   ```javascript
   // In each lazy-loaded component
   useEffect(() => {
     performance.mark(`${componentName}-first-render`);
     return () => {
       performance.clearMarks(`${componentName}-first-render`);
     };
   }, []);
   ```

3. **Create performance utility:**
   ```javascript
   // Create src/shared/utils/performance.js

   export const markTabSwitch = (tabName) => {
     performance.mark(`tab-${tabName}-switch-start`);
   };

   export const measureTabSwitch = (tabName) => {
     performance.mark(`tab-${tabName}-switch-end`);
     performance.measure(
       `tab-${tabName}-switch`,
       `tab-${tabName}-switch-start`,
       `tab-${tabName}-switch-end`
     );
   };

   export const getTabSwitchMetrics = () => {
     const measures = performance.getEntriesByType('measure')
       .filter(m => m.name.includes('tab-'));

     return measures.map(m => ({
       name: m.name,
       duration: m.duration,
       startTime: m.startTime
     }));
   };

   export const clearPerformanceMarks = () => {
     performance.clearMarks();
     performance.clearMeasures();
   };
   ```

**Acceptance Criteria:**
- ✅ Performance marks added to tab switches
- ✅ Metrics logged in dev mode
- ✅ No performance overhead in production
- ✅ Easy to extract metrics for benchmarking

#### Task 5.2: Add Performance Overlay (Dev Mode)

**Purpose:** Visual feedback for developers during optimization work.

**Step-by-Step Implementation:**

1. **Create performance overlay component:**
   ```javascript
   // Create src/shared/components/ui/PerformanceOverlay.jsx

   import React, { useState, useEffect } from 'react';
   import { Box, Paper, Typography } from '@mui/material';

   export const PerformanceOverlay = () => {
     const [metrics, setMetrics] = useState([]);

     useEffect(() => {
       const observer = new PerformanceObserver((list) => {
         const entries = list.getEntries();
         setMetrics(prev => [...prev, ...entries].slice(-10));
       });

       observer.observe({ entryTypes: ['measure'] });

       return () => observer.disconnect();
     }, []);

     const latestMetrics = metrics.slice(-5);
     const avg = latestMetrics.length > 0
       ? latestMetrics.reduce((sum, m) => sum + m.duration, 0) / latestMetrics.length
       : 0;

     return (
       <Paper
         sx={{
           position: 'fixed',
           bottom: 16,
           right: 16,
           p: 2,
           maxWidth: 300,
           bgcolor: 'rgba(0,0,0,0.8)',
           color: 'white',
           zIndex: 9999
         }}
       >
         <Typography variant="caption" display="block" gutterBottom>
           Performance Metrics
         </Typography>

         <Typography variant="body2" color={avg < 200 ? 'success.main' : 'warning.main'}>
           Avg: {avg.toFixed(0)}ms
         </Typography>

         {latestMetrics.map((m, i) => (
           <Typography key={i} variant="caption" display="block">
             {m.name}: {m.duration.toFixed(0)}ms
           </Typography>
         ))}
       </Paper>
     );
   };
   ```

2. **Add to App.jsx (gated):**
   ```javascript
   import { PerformanceOverlay } from './shared/components/ui/PerformanceOverlay';

   function App() {
     const showPerfOverlay = import.meta.env.DEV &&
       new URLSearchParams(window.location.search).get('perf') === '1';

     return (
       <>
         {/* ... rest of app */}
         {showPerfOverlay && <PerformanceOverlay />}
       </>
     );
   }
   ```

**Acceptance Criteria:**
- ✅ Overlay only shows with `?perf=1` in dev mode
- ✅ Real-time metrics display
- ✅ No impact on production bundle
- ✅ Easy to enable/disable

#### Task 5.3: Create Performance Benchmark Runbook

**Purpose:** Standardized process for measuring performance.

**Step-by-Step Implementation:**

1. **Create documentation:**
   ```markdown
   <!-- Create docs/perf-checklist.md -->

   # Performance Benchmarking Checklist

   ## Preparation

   1. Build production bundle:
      ```bash
      npm run build
      ```

   2. Start preview server:
      ```bash
      npm run preview
      ```

   3. Open Chrome DevTools:
      - Open Performance tab
      - Enable "Screenshots" and "Memory"
      - Set CPU throttling to 4x slowdown (simulates mobile)

   ## Bundle Size Measurement

   1. Check build output in terminal
   2. Record main bundle size
   3. Record chunk sizes
   4. Compare to baseline:
      - Main bundle: <700KB (target)
      - Baseline: 1,150KB

   ## Tab Switch Latency

   1. Open Performance tab in DevTools
   2. Start recording
   3. Click through all tabs 3 times:
      - Planner → Calories → Guide → Ingredients → Account → Planner
   4. Stop recording
   5. Measure tab switch durations:
      - Look for "tab-switch" measures
      - Record p50, p75, p95

   6. Target thresholds:
      - p75: <200ms
      - p95: <350ms

   ## Initial Load Performance

   1. Hard refresh (Cmd+Shift+R)
   2. Record metrics:
      - First Contentful Paint (FCP)
      - Largest Contentful Paint (LCP)
      - Time to Interactive (TTI)

   3. Targets:
      - FCP: <1.8s
      - LCP: <2.5s
      - TTI: <3.8s

   ## Memory Usage

   1. Open Memory tab
   2. Take heap snapshot after each tab visit
   3. Check for:
      - Memory leaks (increasing heap size)
      - Detached DOM nodes
      - Large retained objects

   ## Automated Testing

   Run Lighthouse:
   ```bash
   npm run build
   npm run preview
   npx lighthouse http://localhost:4173 --view
   ```

   Target scores:
   - Performance: >90
   - Accessibility: >90
   - Best Practices: >90

   ## Recording Results

   Update baseline document:
   ```markdown
   ## [Date] - [PR/Commit]
   - Main bundle: [size]
   - Tab switch p75: [ms]
   - Tab switch p95: [ms]
   - LCP: [s]
   - Notes: [any observations]
   ```
   ```

2. **Create baseline document:**
   ```markdown
   <!-- Create docs/perf-baseline.md -->

   # Performance Baseline

   ## Before Optimization (2026-02-08)

   ### Bundle Sizes
   - Main bundle: 1,149.91 KB (351.85 KB gzip)
   - jspdf (lazy): 352.74 KB
   - html2canvas (lazy): 201.40 KB

   ### Tab Switch Latency
   - Average: ~600ms
   - p95: High variance
   - Notes: All tabs mount simultaneously

   ### Critical Issues
   - No code splitting
   - Tesseract.js in main bundle
   - Permanent will-change on all tabs
   - 30+ useState in MealPrepCalculator

   ## After Workstream 2 (Target)

   ### Bundle Sizes
   - Main bundle: <700 KB
   - React vendor chunk: ~150 KB
   - MUI chunk: ~350 KB
   - Firebase chunk: ~150 KB

   ### Tab Switch Latency
   - p75: <200ms
   - p95: <350ms

   ### Improvements
   - React.lazy for tabs
   - Vite manual chunks
   - Dynamic Tesseract import
   - Conditional tab mounting
   ```

**Acceptance Criteria:**
- ✅ Runbook created and committed
- ✅ Baseline documented
- ✅ Repeatable measurement process
- ✅ Team can run benchmarks in <5 minutes

---

## Part 2: Feature Roadmap (Post-v1)

### Overview

After completing v1 foundation fixes, the app will be stable, performant, and have resolved critical UX friction. The feature roadmap focuses on differentiation and growth, targeting fitness enthusiasts doing meal prep.

### Phase 1: Foundation Features (0-3 months)

**Focus:** Quick wins that leverage existing infrastructure

#### 1.1 Barcode Scanner UI (2 weeks)
**Complexity:** Easy-Medium
**Dependencies:** None (OpenFoodFacts integration exists)

**Implementation:**
- Add `react-webcam` + `@zxing/library` for barcode scanning
- Create camera modal in IngredientManager
- Hook into existing OpenFoodFacts service
- Add fallback for devices without camera

**Expected Impact:**
- Faster ingredient entry
- Better mobile UX
- Competitive parity with MyFitnessPal

**Files to Create:**
- `src/features/ingredients/BarcodeScanner.jsx`
- `src/shared/utils/barcodeReader.js`

#### 1.2 Progressive Web App (3 weeks)
**Complexity:** Medium
**Dependencies:** None

**Implementation:**
- Add `vite-plugin-pwa`
- Create service worker for offline support
- Add PWA manifest
- Implement install prompt
- Add push notification support (optional)

**Expected Impact:**
- Native app feel
- Offline functionality
- Home screen installation
- Better mobile retention

**Files to Modify/Create:**
- `vite.config.js` - Add PWA plugin
- `public/manifest.json` - App manifest
- `src/sw.js` - Service worker

#### 1.3 Weekly Visual Planner (4 weeks)
**Complexity:** Medium
**Dependencies:** v1 meal planner refactoring

**Implementation:**
- Create calendar grid component (7 days x 4 meals)
- Add drag-and-drop between days (react-beautiful-dnd)
- Weekly shopping list aggregation
- Copy day/week functionality
- Weekly macro summary

**Expected Impact:**
- **Major competitive advantage** - most requested feature
- Aligns with actual meal prep behavior
- Better planning experience

**Files to Create:**
- `src/features/meal-planner/WeeklyPlanner.jsx`
- `src/features/meal-planner/DayCard.jsx`
- `src/shared/hooks/useWeeklyPlan.js`

**Storage Schema:**
```javascript
{
  weeklyPlan: {
    weekId: 'week-2026-06',
    days: {
      'monday': { meals: [...] },
      'tuesday': { meals: [...] },
      // ...
    },
    shoppingList: [...],
    weeklyMacros: {...}
  }
}
```

### Phase 2: Differentiation Features (3-6 months)

**Focus:** Features that set PTM apart from competitors

#### 2.1 Recipe Database (6 weeks)
**Complexity:** Hard
**Dependencies:** Weekly planner (optional but recommended)

**Implementation:**

1. **Recipe Schema:**
   ```javascript
   {
     id: string,
     name: string,
     description: string,
     servings: number,
     prepTime: minutes,
     cookTime: minutes,
     instructions: string[],
     ingredients: [
       { ingredientId, amount, unit }
     ],
     nutrition: { calories, protein, carbs, fat },
     tags: string[],
     photo: url,
     source: 'user' | 'community' | 'imported',
     createdBy: userId
   }
   ```

2. **Features:**
   - Recipe builder with ingredient search
   - Photo upload
   - Serving size scaling
   - Automatic nutrition calculation
   - Save to meal plan
   - Import from URL (basic scraping)

3. **Storage:**
   - Firestore collection: `recipes`
   - User recipes: `users/{uid}/recipes`
   - Community recipes (future): `public_recipes`

**Expected Impact:**
- Users think in recipes, not ingredients
- Major UX improvement
- Foundation for social features

**Files to Create:**
- `src/features/recipes/RecipeDatabase.jsx`
- `src/features/recipes/RecipeBuilder.jsx`
- `src/features/recipes/RecipeCard.jsx`
- `src/shared/services/recipeStorage.js`

#### 2.2 AI Meal Suggestions (4 weeks)
**Complexity:** Hard
**Dependencies:** Recipe database (recommended)

**Implementation:**

1. **OpenAI Integration:**
   ```javascript
   // src/shared/services/aiService.js
   import OpenAI from 'openai';

   export const generateMealPlan = async (preferences) => {
     const prompt = `Generate a meal plan for ${preferences.calories} calories,
                    ${preferences.protein}g protein, dietary restrictions: ${preferences.restrictions}.
                    Return JSON with 4 meals, each with ingredients and portions.`;

     const response = await openai.chat.completions.create({
       model: 'gpt-4-turbo-preview',
       messages: [{ role: 'user', content: prompt }],
       response_format: { type: 'json_object' }
     });

     return JSON.parse(response.choices[0].message.content);
   };
   ```

2. **Features:**
   - "Generate meal plan" button
   - Preference inputs (calories, macros, restrictions)
   - Review and edit before accepting
   - Learn from user adjustments (future)

**Expected Impact:**
- Major time-saver for users
- Differentiation from competitors
- Premium feature for monetization

**Cost Consideration:**
- ~$0.01-0.03 per generation
- Limit free users to 5/month, unlimited for premium

#### 2.3 Progress Tracking (4 weeks)
**Complexity:** Medium
**Dependencies:** None

**Implementation:**

1. **Data Points:**
   - Body weight (daily)
   - Body measurements (weekly)
   - Progress photos (weekly)
   - Macro adherence (auto-calculated)

2. **Visualizations:**
   - Weight trend chart (Recharts)
   - Body measurement comparison
   - Macro adherence heatmap
   - Photo timeline

3. **Storage Schema:**
   ```javascript
   {
     userId: string,
     entries: [
       {
         date: timestamp,
         weight: number,
         measurements: { chest, waist, hips, etc },
         photo: url,
         notes: string
       }
     ]
   }
   ```

**Expected Impact:**
- Keeps users engaged
- Shows value of meal planning
- Encourages consistent use

**Files to Create:**
- `src/features/progress/ProgressTracker.jsx`
- `src/features/progress/WeightChart.jsx`
- `src/features/progress/PhotoTimeline.jsx`
- `src/shared/services/progressStorage.js`

### Phase 3: Growth Features (6-12 months)

**Focus:** Network effects and partnerships

#### 3.1 Grocery Delivery Integration (8 weeks)
**Complexity:** Hard
**Dependencies:** Recipe database, weekly planner

**Implementation:**

1. **Partner APIs:**
   - Instacart API (requires partnership application)
   - Kroger API (available with developer account)
   - Walmart API (requires application)

2. **Features:**
   - "Order Groceries" button on shopping list
   - SKU mapping (ingredient name → store product)
   - Price estimation
   - Track order status

3. **Challenges:**
   - SKU mapping is complex and store-specific
   - API access requires partnerships
   - May need to start with affiliate links

**Expected Impact:**
- **Huge UX improvement** - full meal planning workflow
- Potential revenue stream (referral fees)
- Competitive moat

**Alternative MVP:**
- Start with affiliate links to Amazon Fresh
- Add direct API integrations later

#### 3.2 Family/Multi-User Sharing (6 weeks)
**Complexity:** Hard
**Dependencies:** None

**Implementation:**

1. **Firestore Security Rules:**
   ```javascript
   match /sharedPlans/{planId} {
     allow read: if request.auth.uid in resource.data.members;
     allow write: if request.auth.uid in resource.data.members;
   }
   ```

2. **Features:**
   - Create household/family group
   - Invite members via email
   - Shared meal plans and shopping lists
   - Role-based permissions (admin, member)
   - Separate macro targets per member

3. **UI:**
   - "Share Plan" button
   - Invite modal
   - Member management in Account tab
   - Indicator for shared vs personal plans

**Expected Impact:**
- Increases stickiness (network effects)
- Addresses household meal planning use case
- Premium feature for monetization

#### 3.3 Social Media Recipe Import (6 weeks)
**Complexity:** Hard
**Dependencies:** Recipe database

**Implementation:**

1. **URL Parsing:**
   - Instagram: Use IG embed API or scraping
   - TikTok: Use TikTok embed API
   - YouTube: Extract from description
   - General: Use recipe schema.org markup

2. **AI Extraction:**
   ```javascript
   export const extractRecipeFromURL = async (url) => {
     // Fetch URL content
     const html = await fetch(url).then(r => r.text());

     // Use AI to extract recipe
     const prompt = `Extract recipe from this HTML: ${html}
                    Return JSON with name, ingredients, instructions, servings.`;

     const recipe = await openai.chat.completions.create({...});
     return recipe;
   };
   ```

3. **Features:**
   - "Import from URL" button
   - Preview and edit before saving
   - Attribution to original source
   - Handle various formats (blog posts, social media, recipe sites)

**Expected Impact:**
- Massive convenience for users
- Taps into existing content ecosystem
- Viral potential (share PTM links)

### Phase 4: Polish Features (12+ months)

**Focus:** Nice-to-have improvements

| Feature | Complexity | Impact | Duration |
|---------|------------|--------|----------|
| Micronutrient Tracking | Medium | 3/5 | 3 weeks |
| Pantry Management | Medium | 3/5 | 4 weeks |
| Restaurant Meal Logging | Medium | 3/5 | 3 weeks |
| Meal Prep Timer & Cooking Mode | Medium | 3/5 | 4 weeks |
| Supplement Tracking | Easy | 2/5 | 2 weeks |
| Water Intake Tracking | Easy | 2/5 | 1 week |
| Export to MFP/CSV | Easy-Medium | 2/5 | 2 weeks |

### Monetization Strategy

**Free Tier:**
- All current features
- Basic recipe database (user recipes only)
- Up to 5 AI generations/month

**Premium ($4.99/month or $49/year):**
- Unlimited AI meal generation
- Community recipe database
- Progress tracking with advanced analytics
- Family sharing (up to 5 members)
- Grocery delivery integration
- Social media recipe import
- Priority support

**Expected Conversion:** 5-10% of active users

---

## Part 3: Implementation Guide

### PR Sequencing and Execution

#### PR1: Runtime Stability (P0)

**Goal:** Zero console warnings, clean dev experience

**Checklist:**
- [ ] Fix all Grid2 imports and props
- [ ] Remove nested button in MealPrepCalculator
- [ ] Wrap disabled tooltips with spans
- [ ] Add stable keys to all list renders
- [ ] Test all features work correctly
- [ ] Verify no console warnings
- [ ] Build succeeds without warnings

**Testing Strategy:**
1. Manual testing in dev mode
2. Check console for warnings at each tab
3. Test responsive layouts (320px, 768px, 1024px)
4. Production build test

**Rollback Plan:**
- Git revert if breaking changes
- Keep feature flags OFF if added
- Staged rollout: dev → staging → production

**Review Checklist:**
- [ ] No console warnings
- [ ] All layouts render correctly
- [ ] No runtime errors
- [ ] Build succeeds
- [ ] Lighthouse scores unchanged

#### PR2: Performance Optimizations (P1)

**Goal:** <700KB main bundle, <200ms p75 tab switch

**Checklist:**
- [ ] Conditional tab mounting implemented
- [ ] React.lazy() for 4 tabs (not Planner)
- [ ] Suspense with loading states
- [ ] Tesseract.js dynamic import
- [ ] Vite manualChunks configured
- [ ] Duplicate CSS keyframes removed
- [ ] will-change usage fixed
- [ ] Phantom deps removed
- [ ] Performance benchmarks collected

**Testing Strategy:**

1. **Bundle Analysis:**
   ```bash
   npm run build
   # Check dist/ folder
   # Verify chunk sizes
   ```

2. **Tab Switch Latency:**
   ```bash
   npm run preview
   # Open DevTools Performance tab
   # Switch tabs 30 times
   # Record p50, p75, p95
   ```

3. **Lighthouse:**
   ```bash
   npx lighthouse http://localhost:4173 --view
   ```

4. **Manual Testing:**
   - Clear cache and reload
   - Click through all tabs
   - Verify lazy chunks load
   - Check loading states
   - Test error boundaries

**Acceptance Criteria:**
- ✅ Main bundle <700KB
- ✅ Tab switch p75 <200ms
- ✅ Tab switch p95 <350ms
- ✅ No functional regressions
- ✅ Lighthouse Performance >85

**Rollback Plan:**
- Keep both implementations behind feature flag
- Can revert lazy loading if issues arise
- Vite config changes are safe to revert

#### PR3: UX Friction Removal (P1)

**Goal:** Guest save works, seamless flows, onboarding for all

**Checklist:**
- [ ] Guest plan saving implemented
- [ ] Cloud sync nudge shown (not blocking)
- [ ] Onboarding shows for guests
- [ ] MacroTargetsContext implemented
- [ ] CalorieCalculator uses context
- [ ] MealPrepCalculator consumes targets
- [ ] Auto-navigation to Planner works
- [ ] Mobile header optimized
- [ ] Deep linking implemented

**Testing Strategy:**

1. **Guest Flow:**
   - Open app in incognito
   - Create and save plan as guest
   - Refresh browser
   - Verify plan persists
   - Sign in
   - Verify plan migrates to cloud

2. **Calorie → Planner Flow:**
   - Calculate macros
   - Click "Send to Planner"
   - Verify auto-navigation
   - Verify targets applied
   - Verify toast confirmation

3. **Onboarding:**
   - Clear localStorage
   - Load app as guest
   - Verify onboarding appears
   - Complete onboarding
   - Refresh and verify doesn't show

4. **Mobile:**
   - Test at 320px, 375px, 768px widths
   - Verify no horizontal overflow
   - Check touch targets ≥44px

**Acceptance Criteria:**
- ✅ Guests can save/load plans
- ✅ Guest → auth migration works
- ✅ Onboarding shows for guests
- ✅ Calorie targets transfer automatically
- ✅ No localStorage events used
- ✅ Mobile header fits all widths
- ✅ Deep linking works

**Rollback Plan:**
- Guest save can be feature-flagged
- MacroContext can be disabled
- Graceful fallback to old localStorage method

#### PR4: Storage Consolidation (P2)

**Goal:** All data through storage facade, centralized localStorage

**Checklist:**
- [ ] Storage facade extended for ingredients
- [ ] Storage facade extended for preferences
- [ ] Storage facade extended for favorites/recents
- [ ] Guest storage implementations complete
- [ ] All components use facade (not direct calls)
- [ ] Migration includes all data types
- [ ] LocalStorageService created
- [ ] All localStorage calls centralized
- [ ] Key registry implemented
- [ ] Debug globals gated/removed
- [ ] Performance marks added
- [ ] Benchmark runbook created

**Testing Strategy:**

1. **Guest Flow:**
   - Add ingredients as guest
   - Set preferences as guest
   - Favorite some items
   - Sign in
   - Verify all data migrates

2. **Auth Flow:**
   - Create data as authenticated user
   - Sign out
   - Verify data persists
   - Sign back in
   - Verify data syncs

3. **Storage Facade:**
   - Test with uid=null (guest)
   - Test with uid=userId (auth)
   - Verify routing works correctly
   - Test error handling

4. **LocalStorage:**
   - Verify all access uses service
   - Test quota exceeded handling
   - Check error recovery

**Acceptance Criteria:**
- ✅ All data routed through facade
- ✅ Guest storage works for all types
- ✅ Migration includes all data types
- ✅ No direct localStorage calls
- ✅ Centralized error handling
- ✅ Debug globals gated
- ✅ Performance tools working

**Rollback Plan:**
- Can revert to direct storage calls
- Facade is additive, not replacing
- Migration is one-way (safe)

### Testing Protocols

#### Unit Testing

**New Tests to Add:**

1. **Storage Facade:**
   ```javascript
   // src/shared/services/storage.test.js
   describe('Storage Facade', () => {
     it('routes to guestStorage when uid is null', async () => {
       const plan = await storage.loadPlans(null);
       expect(guestStorage.loadPlans).toHaveBeenCalled();
     });

     it('routes to firestore when uid is provided', async () => {
       const plan = await storage.loadPlans('user123');
       expect(firestore.loadPlans).toHaveBeenCalledWith('user123');
     });
   });
   ```

2. **Guest Migration:**
   ```javascript
   describe('Guest Migration', () => {
     it('migrates all guest data types', async () => {
       // Setup guest data
       localStorage.setItem('guestPlans', JSON.stringify([...]));
       localStorage.setItem('guestIngredients', JSON.stringify([...]));

       await migrateGuestDataToUser('user123');

       // Verify migration
       expect(firestore.savePlan).toHaveBeenCalled();
       expect(firestore.saveIngredient).toHaveBeenCalled();
     });
   });
   ```

3. **MacroTargetsContext:**
   ```javascript
   describe('MacroTargetsContext', () => {
     it('stores and retrieves pending targets', () => {
       const { result } = renderHook(() => useMacroTargets(), {
         wrapper: MacroTargetsProvider
       });

       act(() => {
         result.current.setTargets({ calories: 2000 });
       });

       expect(result.current.hasPendingTargets()).toBe(true);

       const targets = result.current.consumePendingTargets();
       expect(targets.calories).toBe(2000);
       expect(result.current.hasPendingTargets()).toBe(false);
     });
   });
   ```

4. **LocalStorageService:**
   ```javascript
   describe('LocalStorageService', () => {
     it('handles JSON parse errors gracefully', () => {
       localStorage.setItem('test', 'invalid json');
       const result = localStorageService.get('test', 'default');
       expect(result).toBe('default');
     });

     it('handles quota exceeded', () => {
       const hugData = 'x'.repeat(10 * 1024 * 1024);
       const result = localStorageService.set('huge', hugData);
       expect(result).toBe(false);
     });
   });
   ```

#### Integration Testing

**Scenarios to Test:**

1. **Guest → Auth Flow:**
   - Create plan as guest
   - Add custom ingredients
   - Set preferences
   - Favorite items
   - Sign in
   - Verify all data migrated
   - Verify guest data cleared

2. **Tab Navigation:**
   - Load app
   - Verify only Planner mounted
   - Click Calories tab
   - Verify Calories lazy-loaded
   - Click back to Planner
   - Verify state preserved
   - Check Network tab for chunks

3. **Calorie → Planner Flow:**
   - Enter profile data
   - Calculate TDEE
   - Set macro targets
   - Click "Send to Planner"
   - Verify auto-navigation
   - Verify targets applied
   - Make changes in Planner
   - Return to Calories
   - Verify independent state

#### Regression Testing

**Critical Paths:**

1. **Meal Planning:**
   - Add ingredient to meal
   - Adjust serving sizes
   - View nutrition summary
   - Save plan
   - Load plan
   - Delete ingredient
   - Undo/redo operations

2. **Ingredient Management:**
   - Search USDA
   - Search OpenFoodFacts
   - Add custom ingredient
   - Edit ingredient
   - Delete ingredient
   - Import/export

3. **Calorie Calculator:**
   - Fill profile form
   - Calculate TDEE
   - Adjust activity level
   - Set macro split
   - Save profile
   - Send to Planner

4. **Auth Flow:**
   - Sign in with Google
   - Load user data
   - Make changes
   - Sign out
   - Sign back in
   - Verify data persists

#### Performance Regression Testing

**Benchmark Process:**

1. **Before Changes:**
   ```bash
   git checkout main
   npm run build
   npm run preview
   # Record baseline metrics
   ```

2. **After Changes:**
   ```bash
   git checkout feature-branch
   npm run build
   npm run preview
   # Record new metrics
   ```

3. **Compare:**
   - Bundle sizes (must be lower or equal)
   - Tab switch latency (must improve)
   - Memory usage (must not increase significantly)
   - Lighthouse scores (must maintain or improve)

4. **Acceptance:**
   - No metric regresses >10%
   - Target improvements achieved
   - No new console errors

### Deployment Strategy

#### Environment Setup

**Development:**
- Local dev servers
- Hot module replacement
- Debug tools enabled
- Performance overlay available
- All logging enabled

**Staging:**
- Production build
- Firebase emulators OR staging project
- Real APIs (test credentials)
- Performance monitoring
- Error tracking enabled

**Production:**
- Production build
- Firebase production project
- Real APIs (production credentials)
- Performance monitoring
- Error tracking
- Analytics

#### Rollout Plan

**Phase 1: Internal Testing (1-2 days)**
- Deploy to staging
- Team testing
- Check all critical flows
- Monitor error logs
- Verify performance metrics

**Phase 2: Canary Release (2-3 days)**
- Deploy to 10% of users
- Monitor key metrics:
  - Error rate
  - Performance (tab latency)
  - User engagement
  - Guest save success rate
- Rollback if error rate >2%

**Phase 3: Gradual Rollout (1 week)**
- 10% → 25% → 50% → 100%
- Monitor at each stage
- 24-hour soak at each level
- Rollback plan ready

**Phase 4: Monitoring (2 weeks)**
- Track key metrics daily
- User feedback collection
- Performance monitoring
- Bug triage and fixes

#### Rollback Procedures

**Quick Rollback (< 5 minutes):**
```bash
# Revert to previous Firebase hosting version
firebase hosting:rollback

# Or redeploy previous build
git checkout [previous-commit]
npm run build
firebase deploy --only hosting
```

**Partial Rollback:**
- Use feature flags to disable new features
- Keep infrastructure changes
- Gradual re-enable after fixes

**Database Rollback:**
- Firestore changes are backward-compatible
- No schema migrations in v1
- Guest data in localStorage (no rollback needed)
- If needed: run migration script in reverse

#### Monitoring and Alerts

**Key Metrics to Track:**

1. **Performance:**
   - Tab switch latency (p50, p75, p95)
   - Initial page load time
   - Bundle size
   - Memory usage

2. **Errors:**
   - JavaScript errors (Sentry/Firebase)
   - Console warnings
   - Failed API calls
   - Storage errors

3. **User Engagement:**
   - Guest save success rate
   - Guest → auth conversion rate
   - Feature usage (tab switches, plan saves)
   - Session duration

4. **Business Metrics:**
   - Daily/weekly active users
   - Retention (1-day, 7-day, 30-day)
   - Guest vs authenticated split
   - Churn rate

**Alert Thresholds:**
- Error rate >2% → Page team
- Performance degradation >20% → Investigate
- Conversion drop >15% → Rollback consideration

---

## Part 4: Risks and Mitigations

### Technical Risks

#### Risk 1: Lazy Loading Causes UX Regression

**Likelihood:** Medium
**Impact:** High
**Mitigation:**
- Add prefetch on hover to reduce perceived latency
- Use Suspense with polished loading states
- Test on slow 3G network throttling
- Provide instant feedback (skeleton, spinner)
- Rollback plan: remove lazy loading, keep conditional mounting

**Monitoring:**
- Track "chunk load failed" errors
- Monitor tab switch latency
- User feedback on perceived performance

#### Risk 2: Guest Migration Fails or Loses Data

**Likelihood:** Low
**Impact:** Critical
**Mitigation:**
- Extensive testing of migration paths
- Don't clear guest data immediately (keep backup)
- Retry logic for failed migrations
- User notification if migration fails
- Manual recovery process documented

**Monitoring:**
- Track migration success rate
- Log all migration attempts
- Alert on failures >1%

**Recovery Plan:**
```javascript
// Manual migration trigger in Account tab
const retryMigration = async () => {
  const guestData = {
    plans: localStorage.getItem('guestPlans'),
    ingredients: localStorage.getItem('guestIngredients'),
    // ... other data
  };

  await migrateGuestDataToUser(user.uid);
};
```

#### Risk 3: Storage Quota Exceeded

**Likelihood:** Medium (for power users)
**Impact:** Medium
**Mitigation:**
- Implement quota monitoring
- Warn users at 80% capacity
- Provide data export before hitting limit
- Clean up old/unused data automatically
- Compress stored JSON

**Handling:**
```javascript
try {
  localStorage.setItem(key, value);
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    // Show modal: "Storage almost full, please sign in for cloud sync"
    showStorageWarning();
  }
}
```

#### Risk 4: Bundle Size Optimization Breaks Features

**Likelihood:** Low
**Impact:** High
**Mitigation:**
- Thorough testing of lazy-loaded components
- Error boundaries around Suspense
- Monitor "chunk load failed" errors
- Test on slow/unreliable networks
- Keep bundle analysis in CI

**Rollback:**
- Revert to static imports if failures >1%
- Keep conditional mounting (still wins performance)

#### Risk 5: Performance Marks Add Overhead

**Likelihood:** Low
**Impact:** Low
**Mitigation:**
- Gate behind dev mode or query param
- Use performance.now() sparingly
- Clear marks after collection
- Minimal code in hot paths

### Timeline Risks

#### Risk 1: Scope Creep During Implementation

**Likelihood:** High
**Impact:** Medium
**Mitigation:**
- Strict adherence to workstream boundaries
- Code review checklist
- No "while we're here" refactors
- Defer non-critical improvements to follow-ups
- Time-box tasks (stop at 2x estimate)

**Example Scope Creep:**
- ❌ "Let's also refactor MealPrepCalculator while fixing tabs"
- ✅ "Add TODO comment, create follow-up issue"

#### Risk 2: Unexpected Blockers

**Likelihood:** Medium
**Impact:** Medium
**Mitigation:**
- Buffer time in estimates (1.5x)
- Parallel workstreams where possible
- Document blockers immediately
- Daily check-ins on progress
- Be ready to adjust priorities

**Common Blockers:**
- MUI version incompatibilities
- Firebase API changes
- localStorage edge cases
- Browser compatibility issues

### User Impact Risks

#### Risk 1: Breaking Changes for Active Users

**Likelihood:** Low
**Impact:** High
**Mitigation:**
- No schema changes in v1
- All storage changes are backward-compatible
- Test with existing user data
- Gradual rollout (10% → 100%)
- Monitoring for errors

**Testing:**
1. Create test account with extensive data
2. Export data
3. Deploy changes to test account
4. Verify all data loads correctly
5. Test all CRUD operations

#### Risk 2: User Confusion from UI Changes

**Likelihood:** Medium
**Impact:** Low
**Mitigation:**
- No major UI changes in v1 (mostly under-the-hood)
- Add subtle indicators for lazy loading
- Changelog/release notes
- In-app "What's New" banner (optional)
- Support documentation updated

**User-Facing Changes:**
- Faster tab switching (positive)
- Guest can now save (positive)
- Auto-navigation from Calorie to Planner (may surprise users)

#### Risk 3: Guest Users Don't Understand Local vs Cloud

**Likelihood:** Medium
**Impact:** Low
**Mitigation:**
- Clear messaging in save confirmation
- Periodic nudge to sign up for cloud sync
- Visual indicator for local vs synced plans
- Help text in Account tab
- Toast message: "Saved locally. Sign in to sync across devices."

**UI Indicators:**
```javascript
{user ? (
  <Chip label="Synced to Cloud" color="success" size="small" />
) : (
  <Chip label="Saved Locally" color="default" size="small" />
)}
```

### Quality Risks

#### Risk 1: Test Coverage Remains Low

**Likelihood:** Medium
**Impact:** Medium
**Mitigation:**
- Add tests for new code (storage facade, context)
- Integration tests for critical paths
- Manual testing checklist for each PR
- Don't block v1 on 100% coverage
- Plan test improvement sprint after v1

**Minimum Test Coverage for v1:**
- Storage facade: 80%
- Guest migration: 90%
- MacroTargetsContext: 100%
- LocalStorageService: 80%
- Critical user flows: manual testing

#### Risk 2: Performance Regressions Not Caught

**Likelihood:** Low
**Impact:** Medium
**Mitigation:**
- Mandatory performance benchmarking for PR2
- Lighthouse in CI (future)
- Manual testing on throttled network
- Bundle size budgets in CI (future)
- Performance marks allow post-deploy monitoring

**CI Checks (future enhancement):**
```yaml
- name: Check bundle size
  run: |
    npm run build
    SIZE=$(stat -f%z dist/assets/index-*.js)
    if [ $SIZE -gt 700000 ]; then
      echo "Bundle too large: $SIZE bytes"
      exit 1
    fi
```

### Mitigation Summary Table

| Risk Category | Top Risk | Mitigation Strategy | Rollback Plan |
|---------------|----------|---------------------|---------------|
| Technical | Lazy loading UX regression | Prefetch, loading states, testing | Revert to static imports |
| Timeline | Scope creep | Strict boundaries, time-boxing | Defer to follow-ups |
| User Impact | Breaking changes | Backward compatibility, gradual rollout | Quick rollback via Firebase |
| Quality | Low test coverage | Tests for new code, manual checklist | Manual testing safety net |

### Success Criteria Verification

**How We'll Know v1 Succeeded:**

1. **Performance Targets Met:**
   - ✅ Main bundle <700KB (measure with `npm run build`)
   - ✅ Tab switch p75 <200ms (measure with DevTools)
   - ✅ Tab switch p95 <350ms (measure with DevTools)

2. **Stability Targets Met:**
   - ✅ Zero console warnings in normal usage
   - ✅ Error rate <1% (monitor with Sentry/Firebase)
   - ✅ No runtime errors in critical paths

3. **UX Targets Met:**
   - ✅ Guest save success rate 100% (test manually)
   - ✅ Guest → auth migration success rate >99%
   - ✅ Calorie → Planner flow seamless (test manually)

4. **Code Quality:**
   - ✅ All new code has tests (unit + integration)
   - ✅ No direct localStorage calls (verify with grep)
   - ✅ All data routes through storage facade
   - ✅ No debug globals in production

5. **User Feedback:**
   - ✅ No critical bugs reported
   - ✅ Performance improvements noticed by users
   - ✅ Guest users successfully saving plans
   - ✅ No complaints about new flows

---

## Appendix A: File Reference

### Files to Modify (v1)

**Workstream 1 (P0):**
- `src/features/meal-planner/MealPrepCalculator.jsx` - Grid migration, nested buttons
- `src/features/ingredients/IngredientManager.jsx` - Grid migration, keys
- `src/features/calorie-calculator/CalorieCalculator.jsx` - Grid migration
- `src/features/account/AccountPage.jsx` - Grid migration
- `src/shared/components/layout/MealPrep.jsx` - Tooltips

**Workstream 2 (P1):**
- `src/shared/components/layout/MealPrep.jsx` - Lazy loading, conditional mounting
- `src/shared/services/ocrService.js` - Dynamic Tesseract import
- `vite.config.js` - Manual chunks
- `src/index.css` - Remove duplicates, fix will-change
- `package.json` - Remove phantom deps

**Workstream 3 (P1):**
- `src/features/meal-planner/MealPrepCalculator.jsx` - Guest save, macro context
- `src/features/calorie-calculator/CalorieCalculator.jsx` - Macro context
- `src/app/App.jsx` - Onboarding for guests, MacroTargetsProvider
- `src/shared/components/layout/MealPrep.jsx` - Deep linking, mobile header

**Workstream 4 (P2):**
- `src/shared/services/storage.js` - Extend facade
- `src/shared/services/guestStorage.js` - Add methods
- `src/features/ingredients/ingredientStorage.js` - Use facade
- `src/features/ingredients/cleanupDuplicates.js` - Gate debug global
- `src/shared/services/guestMigration.js` - Extend migration

### Files to Create (v1)

**Workstream 3:**
- `src/shared/context/MacroTargetsContext.jsx` - Macro transfer

**Workstream 4:**
- `src/shared/services/localStorageService.js` - Centralized storage

**Workstream 5:**
- `src/shared/utils/performance.js` - Performance utilities
- `src/shared/components/ui/PerformanceOverlay.jsx` - Dev overlay
- `docs/perf-checklist.md` - Benchmarking guide
- `docs/perf-baseline.md` - Metrics tracking

### Key Line Numbers

Reference for specific issues (may shift after edits):

- `MealPrep.jsx:29-34` - Static tab imports (need lazy)
- `MealPrep.jsx:477-544` - Tab panels (conditional mount)
- `MealPrep.jsx:239-421` - Toolbar (mobile optimization)
- `MealPrepCalculator.jsx:682-685` - Guest save block (remove check)
- `MealPrepCalculator.jsx:341-376` - localStorage event (remove)
- `ocrService.js:1` - Tesseract import (make dynamic)
- `cleanupDuplicates.js:49` - window.debug (gate)
- `index.css:137-139` - will-change (make conditional)
- `index.css:151-291` - Duplicate keyframes (remove)
- `App.jsx:19-25` - Onboarding auth check (remove)

---

## Conclusion

This comprehensive implementation proposal synthesizes findings from UX, architecture, and performance analysis into an actionable roadmap. The v1 foundation fixes (PR1-PR4) address critical issues impacting user experience and code maintainability, while the post-v1 roadmap provides a clear path for feature development and product differentiation.

**Next Steps:**

1. Review and approve this proposal
2. Create GitHub issues for each task
3. Assign workstreams to developers
4. Begin implementation with PR1 (Runtime Stability)
5. Monitor progress against success criteria
6. Iterate based on feedback and metrics

**Questions or Concerns:**

Contact the team lead with any questions about scope, timelines, or technical approach. This document should serve as the single source of truth for the implementation effort.

---

**Document Metadata:**
- **Created:** 2026-02-08
- **Version:** Final
- **Status:** Ready for Implementation
- **Estimated Total Effort:** 17-25 days for v1 foundation
- **Contributors:** UX Analyst, Architecture Analyst, Performance Analyst, Feature Research Agent, Proposal Writer
