# Performance Benchmarking Checklist

This document provides a standardized process for measuring and tracking performance metrics in Prep Thy Meal.

## Preparation

### 1. Build Production Bundle

```bash
npm run build
```

Record the build output (bundle sizes will be displayed in terminal).

### 2. Start Preview Server

```bash
npm run preview
```

This serves the production build locally at `http://localhost:4173`.

### 3. Open Chrome DevTools

1. Open the app in **Chrome** (consistent testing environment)
2. Open DevTools (Cmd+Option+I or F12)
3. Navigate to **Performance** tab
4. Enable:
   - ✅ Screenshots
   - ✅ Memory
   - ✅ Web Vitals
5. Set **CPU throttling** to **4x slowdown** (simulates mobile devices)
6. Set **Network throttling** to **Fast 3G** (optional, for network-bound tests)

## Bundle Size Measurement

### Target Metrics
- **Main bundle**: <700 KB (baseline: 1,150 KB)
- **Vendor chunks**: Properly split for caching
- **Lazy chunks**: Loaded on-demand

### Steps

1. Check build output in terminal after `npm run build`
2. Record main bundle size (index-*.js)
3. Record vendor chunk sizes:
   - vendor-react
   - vendor-mui
   - vendor-firebase
   - vendor-pdf
   - vendor-ocr
4. Record lazy-loaded chunks:
   - CalorieCalculator
   - IngredientManager
   - MealPrepInstructions
   - AccountPage
5. Compare to baseline (see `docs/perf-baseline.md`)

### Example Output
```
dist/index.html                      1.25 kB │ gzip:   0.55 kB
dist/assets/vendor-react-*.js       12.44 kB │ gzip:   4.45 kB
dist/assets/vendor-mui-*.js        406.11 kB │ gzip: 123.96 kB
dist/assets/index-*.js             299.34 kB │ gzip:  92.03 kB
```

## Tab Switch Latency Measurement

### Target Metrics
- **p75**: <200ms
- **p95**: <350ms
- **Avg**: <180ms

### Method 1: Built-in Performance Overlay (Recommended)

1. Add `?perf` to URL or run `localStorage.setItem('ptm_perf', '1')` in console
2. Refresh the page
3. Performance overlay appears in bottom-right corner
4. Click through all tabs **3 times**:
   - Planner → Calories → Guide → Ingredients → Account → Planner
5. Check overlay for:
   - p50, p75, p95 values
   - Recent samples
6. Record metrics in `docs/perf-baseline.md`

### Method 2: Chrome DevTools (Deep Dive)

1. Open Performance tab in DevTools
2. Click **Record** button (●)
3. Click through all tabs once:
   - Planner → Calories → Guide → Ingredients → Account → Planner
4. Click **Stop** button (■)
5. In the recording:
   - Look for "User Timing" section
   - Find `tab:*->*` measures
   - Hover to see duration
6. Repeat 3 times and calculate p75/p95 manually

### Method 3: Console API

```javascript
// Enable performance tracking
localStorage.setItem('ptm_perf', '1');
// Refresh page

// After switching tabs, get stats:
window.perfUtils.getStats();
// Returns: { p50, p75, p95, avg, count }

// Export metrics:
window.perfUtils.export();
// Returns JSON with full metrics

// Clear metrics:
window.perfUtils.clear();
```

## Initial Load Performance

### Target Metrics
- **FCP (First Contentful Paint)**: <1.8s
- **LCP (Largest Contentful Paint)**: <2.5s
- **TTI (Time to Interactive)**: <3.8s
- **TBT (Total Blocking Time)**: <300ms

### Steps

1. Open **Lighthouse** tab in DevTools
2. Select:
   - Mode: **Navigation**
   - Device: **Desktop** or **Mobile**
   - Categories: **Performance** only (for speed)
3. Click **Analyze page load**
4. Record Core Web Vitals:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to Interactive (TTI)
   - Total Blocking Time (TBT)
   - Cumulative Layout Shift (CLS)
5. Compare to baseline

### Manual Measurement (DevTools Performance)

1. Open Performance tab
2. Click **Reload** button (◎) to record page load
3. After load completes, check:
   - **FCP**: Blue line in timeline
   - **LCP**: Green line in timeline
   - **TTI**: When main thread becomes idle
4. Record metrics

## Memory Leak Detection

### Steps

1. Open DevTools → **Memory** tab
2. Select **Heap snapshot**
3. Take baseline snapshot (before navigation)
4. Navigate through all tabs 5+ times
5. Return to Planner tab
6. Force garbage collection (🗑️ icon in Memory tab)
7. Take second snapshot
8. Compare snapshots:
   - Look for "Detached" DOM nodes
   - Check for growing arrays/objects
   - Verify cleanup in component unmount

### Target
- No significant memory growth after GC
- No detached DOM nodes
- Stable memory profile across tab switches

## Network Performance

### Steps

1. Open DevTools → **Network** tab
2. Enable **Disable cache** checkbox
3. Set throttling to **Fast 3G**
4. Hard refresh (Cmd+Shift+R)
5. Record:
   - Total requests
   - Total size (transferred)
   - DOMContentLoaded time
   - Load time
6. Check for:
   - ✅ Lazy loading of chunks
   - ✅ Proper caching headers
   - ✅ No duplicate requests

## Regression Testing

Before merging any PR that touches:
- Bundle configuration (vite.config.js)
- Lazy loading logic (MealPrep.jsx)
- Heavy dependencies (imports)

Run this full checklist and compare to baseline. If any metric regresses >10%, investigate before merging.

## Tips

- Run tests in **Incognito mode** to avoid extension interference
- Clear browser cache between test runs for consistency
- Test on **multiple devices** (desktop, tablet, mobile) if possible
- Run tests **3 times** and average results for accuracy
- Document environment (Chrome version, OS, CPU, etc.)

## Automation (Future)

Consider adding automated performance testing:
- Lighthouse CI in GitHub Actions
- Bundle size monitoring (bundlewatch)
- Performance budgets in vite.config.js

---

**Last Updated**: 2026-02-08
**Maintained By**: Engineering Team
