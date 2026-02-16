# Performance Baseline Metrics

This document tracks performance metrics over time to identify regressions and improvements.

## Current Baseline (Post v1 Foundation Fixes)

**Date**: 2026-02-08
**Commit**: `[To be recorded after deployment]`
**Chrome Version**: 131+
**Test Environment**: MacBook Pro M1, macOS

### Bundle Size

| Asset | Size | Gzip | Status |
|-------|------|------|--------|
| **Main Bundle** | 299.34 KB | 92.03 KB | ✅ Target met (<700 KB) |
| vendor-mui | 406.11 KB | 123.96 KB | ✅ Properly chunked |
| vendor-firebase | 321.19 KB | 99.07 KB | ✅ Properly chunked |
| vendor-pdf | 393.35 KB | 128.69 KB | ✅ Lazy loaded |
| vendor-ocr | 15.44 KB | 6.66 KB | ✅ Lazy loaded |
| vendor-react | 12.44 KB | 4.45 KB | ✅ Properly chunked |
| CalorieCalculator | 22.75 KB | 7.27 KB | ✅ Lazy loaded |
| IngredientManager | 54.07 KB | 15.42 KB | ✅ Lazy loaded |
| MealPrepInstructions | 4.41 KB | 1.73 KB | ✅ Lazy loaded |
| AccountPage | 10.42 KB | 3.13 KB | ✅ Lazy loaded |
| **TOTAL** | ~1,540 KB | ~483 KB | ✅ Optimized |

**Notes**:
- Main bundle reduced from 1,150 KB baseline to 299 KB (**74% reduction**)
- All heavy dependencies properly code-split
- Lazy loading working correctly for tabs

### Tab Switch Latency

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **p50** | [To be measured] | <150ms | ⏳ Pending |
| **p75** | [To be measured] | <200ms | ⏳ Pending |
| **p95** | [To be measured] | <350ms | ⏳ Pending |
| **Avg** | [To be measured] | <180ms | ⏳ Pending |

**Test Method**: Built-in performance overlay with `?perf` flag

**Expected Improvements**:
- Lazy tab mounting reduces initial render time
- Conditional mounting preserves state after first load
- React.lazy + Suspense improves code splitting

### Initial Load Performance (Core Web Vitals)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **FCP** (First Contentful Paint) | [To be measured] | <1.8s | ⏳ Pending |
| **LCP** (Largest Contentful Paint) | [To be measured] | <2.5s | ⏳ Pending |
| **TTI** (Time to Interactive) | [To be measured] | <3.8s | ⏳ Pending |
| **TBT** (Total Blocking Time) | [To be measured] | <300ms | ⏳ Pending |
| **CLS** (Cumulative Layout Shift) | [To be measured] | <0.1 | ⏳ Pending |

**Test Method**: Lighthouse in Chrome DevTools (Desktop mode)

### Network Performance

| Metric | Value | Status |
|--------|-------|--------|
| Total Requests | [To be measured] | ⏳ Pending |
| Total Size (transferred) | [To be measured] | ⏳ Pending |
| DOMContentLoaded | [To be measured] | ⏳ Pending |
| Load Time | [To be measured] | ⏳ Pending |

## Historical Baselines

### Pre-Optimization (Baseline)

**Date**: 2026-02-05 (estimated)
**Commit**: `[Before v1 foundation fixes]`

| Metric | Value | Notes |
|--------|-------|-------|
| Main Bundle | 1,150 KB | No code splitting |
| Tab Switch p75 | ~600ms | High variance, static imports |
| Tab Switch p95 | Variable | No measurement, observed laggy |
| FCP | Unknown | Not measured |
| Console Warnings | Multiple | Runtime errors present |

**Known Issues**:
- No lazy loading (all tabs loaded upfront)
- No vendor chunk splitting
- Firebase imported dynamically (build warning)
- Duplicate CSS keyframes
- No performance instrumentation

### Post Phase 1 (Runtime Stability)

**Date**: 2026-02-06
**Improvements**:
- ✅ Console warnings eliminated
- ✅ Import errors fixed
- ✅ will-change conditional on reduced motion

### Post Phase 2 (Performance Optimization)

**Date**: 2026-02-07
**Improvements**:
- ✅ Lazy tab mounting implemented
- ✅ Vite manualChunks configured (5 vendor chunks)
- ✅ Tesseract.js dynamically imported
- ✅ useUndoRedo stale closure fixed
- ✅ Duplicate CSS removed
- ✅ Firebase imports consolidated

**Impact**:
- Main bundle: 1,150 KB → 299 KB (**74% reduction**)
- Expected tab latency: ~600ms → <200ms p75

### Post Phase 3 (UX Friction)

**Date**: 2026-02-07
**Improvements**:
- ✅ Guest save enabled
- ✅ Onboarding for all users
- ✅ Macro context (replaced localStorage events)
- ✅ Mobile header optimized
- ✅ Deep linking support

**Impact**:
- Removed fragile localStorage event listeners
- Better mobile UX (narrow screens)
- Improved guest user retention

### Post Phase 4 (Storage Consolidation)

**Date**: 2026-02-08
**Improvements**:
- ✅ Storage facade extended (ingredients, preferences, favorites, recents)
- ✅ Centralized localStorage service with key registry
- ✅ Debug globals gated behind dev mode

**Impact**:
- Unified storage API
- Cleaner production builds
- Better developer experience

## Metric Definitions

### Bundle Size
- **Main Bundle**: Primary JavaScript chunk loaded on initial page load
- **Vendor Chunks**: Third-party dependencies split for better caching
- **Lazy Chunks**: Code-split components loaded on-demand

**Target**: Main bundle <700 KB (achieved: 299 KB ✅)

### Tab Switch Latency
- **p50**: 50th percentile (median) - half of switches faster, half slower
- **p75**: 75th percentile - 75% of switches faster than this
- **p95**: 95th percentile - 95% of switches faster than this
- **Avg**: Average of all measurements

**Target**: p75 <200ms, p95 <350ms

### Core Web Vitals
- **FCP**: Time until first content rendered
- **LCP**: Time until largest content element rendered
- **TTI**: Time until page is interactive
- **TBT**: Total time main thread is blocked during load
- **CLS**: Visual stability (layout shifts)

**Thresholds**: Google's "Good" targets

## Measurement Protocol

1. **Environment**:
   - Chrome browser (latest stable)
   - Incognito mode (no extensions)
   - Clear cache before each test

2. **Method**:
   - Run each test **3 times**
   - Take **median** value
   - Document outliers

3. **Recording**:
   - Update this file after each measurement
   - Include commit SHA
   - Note any environmental factors (CPU throttling, network conditions)

4. **Regression Threshold**:
   - ⚠️ Warning: >5% regression in any metric
   - 🛑 Block: >10% regression in critical metrics (bundle size, p75 latency)

## Next Steps

- [ ] Measure initial tab switch latency with performance overlay
- [ ] Run Lighthouse audit and record Core Web Vitals
- [ ] Measure network performance (total requests, load time)
- [ ] Set up automated bundle size tracking (bundlewatch)
- [ ] Consider Lighthouse CI in GitHub Actions

---

**Last Updated**: 2026-02-08
**Maintained By**: Engineering Team
