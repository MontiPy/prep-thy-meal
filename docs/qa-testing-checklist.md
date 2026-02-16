# QA Testing Checklist - v1 Foundation Fixes

Comprehensive testing protocol for staging and production deployments.

## Test Environment Setup

### Desktop Testing
- **Browser**: Chrome (latest stable)
- **Viewport**: 1920x1080 (desktop), 768x1024 (tablet)
- **Network**: Fast 3G throttling (optional)
- **Extensions**: Disabled (use Incognito mode)

### Mobile Testing
- **Devices**:
  - iPhone SE (375px width) - narrow mobile test
  - iPhone 14 Pro (393px width)
  - Samsung Galaxy S21 (360px width)
  - iPad (768px width)
- **Browser**: Safari (iOS), Chrome (Android)

## 🎯 Critical Path Testing

### Test 1: Guest User Journey

**Objective**: Verify guest users can use the app without sign-in

**Steps**:
1. [ ] Open app in **Incognito mode** (ensures clean state)
2. [ ] **Verify onboarding appears** (first-time users only)
   - Should show modal with "Welcome to Prep Thy Meal"
   - Complete onboarding
3. [ ] Navigate to **Planner** tab (default tab)
4. [ ] **Create a meal plan**:
   - Add ingredients to meals (breakfast, lunch, dinner, snack)
   - Set calorie target
   - Adjust macro percentages
5. [ ] **Save the plan**:
   - Click "Save Plan" button
   - ✅ Expected: Toast message "Plan saved locally. Sign in to sync across devices."
   - ✅ Expected: NO error about sign-in required
6. [ ] **Refresh the page** (Cmd+R)
7. [ ] **Verify plan persists**:
   - Plan should still be there
   - All ingredients should be present
   - Calorie target and macros preserved

**Pass Criteria**:
- ✅ Guest can save plans without sign-in
- ✅ Plans persist across page refreshes
- ✅ Appropriate toast message shown

---

### Test 2: Guest → Authenticated Migration

**Objective**: Verify guest data migrates to Firebase on sign-in

**Pre-requisites**: Complete Test 1 first (have guest data)

**Steps**:
1. [ ] **While still as guest**, verify you have saved plan(s)
2. [ ] Click **"Login / Sign Up"** button (top-right)
3. [ ] **Sign in with Google**
4. [ ] **Wait for migration** (should be automatic)
5. [ ] **Verify plans migrated**:
   - Plans should still be visible
   - All ingredients preserved
   - Calorie targets preserved
6. [ ] **Verify cloud sync**:
   - Save another plan
   - Toast should say "Plan saved to cloud" (not "locally")
7. [ ] **Test persistence**:
   - Sign out
   - Sign back in
   - Plans should still be there (from Firestore)

**Pass Criteria**:
- ✅ Guest plans migrate to Firebase on sign-in
- ✅ No data loss during migration
- ✅ Subsequent saves go to cloud

---

### Test 3: Macro Transfer (Calories → Planner)

**Objective**: Verify macro targets transfer from Calorie Calculator to Planner

**Steps**:
1. [ ] Navigate to **Calories** tab
2. [ ] **Enter profile data**:
   - Age: 30
   - Weight: 180 lbs
   - Height: 72 inches
   - Activity: Moderate
   - Goal: Cut
3. [ ] **Adjust macro split** (optional):
   - Change protein/fat/carb percentages
4. [ ] **Click "Send to Planner"** button
5. [ ] **Verify toast**: "Targets saved! Switch to the Planner tab to apply them."
6. [ ] **Switch to Planner tab**
7. [ ] **Verify prompt appears**:
   - Should see banner/modal: "Apply macro targets from Calorie Calculator?"
   - Shows calorie target and macro breakdown
8. [ ] **Click "Apply Targets"**
9. [ ] **Verify targets applied**:
   - Calorie target updated in planner
   - Macro percentages updated
   - Toast: "Applied [X] kcal target with new macro split!"

**Pass Criteria**:
- ✅ Macro transfer works without page refresh
- ✅ No localStorage errors in console
- ✅ Targets applied correctly to planner

---

### Test 4: Tab Navigation Performance

**Objective**: Verify smooth tab switching without lag

**Steps**:
1. [ ] **Enable performance overlay**: Add `?perf` to URL
2. [ ] **Switch through all tabs** 3 times:
   - Planner → Calories → Guide → Ingredients → Account → Planner
3. [ ] **Check performance overlay**:
   - p75 should be <200ms (green)
   - p95 should be <350ms (yellow or green)
   - Avg should be <180ms
4. [ ] **Verify no visual lag**:
   - Tab content appears immediately
   - No blank screens
   - No flickering
5. [ ] **Check console**: No errors during tab switching

**Pass Criteria**:
- ✅ p75 latency <200ms
- ✅ No visual lag or jank
- ✅ No console errors

---

### Test 5: Deep Linking

**Objective**: Verify URL-based tab navigation

**Steps**:
1. [ ] **Test direct tab links**:
   - Open `[APP_URL]/?tab=planner` → Should show Planner tab
   - Open `[APP_URL]/?tab=calories` → Should show Calories tab
   - Open `[APP_URL]/?tab=guide` → Should show Guide tab
   - Open `[APP_URL]/?tab=ingredients` → Should show Ingredients tab
   - Open `[APP_URL]/?tab=account` → Should show Account tab
2. [ ] **Test tab changes update URL**:
   - Click Calories tab
   - URL should change to `?tab=calories`
   - Click back button in browser
   - Should return to previous tab
3. [ ] **Test invalid tab param**:
   - Open `[APP_URL]/?tab=invalid`
   - Should default to Planner tab

**Pass Criteria**:
- ✅ Deep links work for all tabs
- ✅ URL updates on tab change
- ✅ Browser back button works
- ✅ Invalid tabs default to Planner

---

### Test 6: Mobile Header (Narrow Screens)

**Objective**: Verify header doesn't overflow on narrow mobile devices

**Steps**:
1. [ ] **Set viewport to 375px width** (iPhone SE)
   - Chrome DevTools: Toggle device toolbar
   - Select iPhone SE or custom 375x667
2. [ ] **Verify header layout**:
   - ✅ PTM logo visible
   - ✅ "Prep Thy Meal" text HIDDEN (not visible on narrow screens)
   - ✅ Welcome text HIDDEN
   - ✅ Beta chip HIDDEN
   - ✅ Online/Offline indicator HIDDEN
   - ✅ Theme toggle VISIBLE
   - ✅ Login button (or avatar) VISIBLE
3. [ ] **Verify no overflow**:
   - No horizontal scrollbar
   - No cut-off elements
   - All visible elements fit within 375px
4. [ ] **Test at 320px width** (smallest mobile):
   - Set custom viewport: 320x568
   - Header should still fit without overflow

**Pass Criteria**:
- ✅ Header fits on 375px screen
- ✅ No horizontal overflow
- ✅ Essential elements visible (logo, theme, login)

---

## 🔍 Feature Testing

### Onboarding

- [ ] **First visit shows onboarding** (Incognito mode)
- [ ] **Onboarding shows for guest users** (not just authenticated)
- [ ] **Onboarding can be completed**
- [ ] **Onboarding doesn't show again** after completion
- [ ] **Onboarding completion persists** across page refreshes

### Plan Management

- [ ] **Create plan** (guest and authenticated)
- [ ] **Save plan** (guest and authenticated)
- [ ] **Load plan** from saved plans list
- [ ] **Update plan** (edit existing plan)
- [ ] **Delete plan**
- [ ] **Export plan to PDF**

### Ingredient Management

- [ ] **Add custom ingredient**
- [ ] **Search USDA database**
- [ ] **Search OpenFoodFacts** (barcode)
- [ ] **Upload nutrition label** (OCR)
- [ ] **Edit custom ingredient**
- [ ] **Delete custom ingredient**
- [ ] **Favorite ingredient**
- [ ] **Recent ingredients appear**

### Calorie Calculator

- [ ] **Calculate TDEE** (Basic and Advanced modes)
- [ ] **Adjust macro split**
- [ ] **Save profile** (localStorage + cloud)
- [ ] **Load profile** on return
- [ ] **Send to Planner** works

### Theme

- [ ] **Toggle light/dark mode**
- [ ] **Theme persists** across page refreshes
- [ ] **System theme respected** (initial load)

### Authentication

- [ ] **Google sign-in works**
- [ ] **Logout works**
- [ ] **Profile photo shows** after sign-in
- [ ] **Display name shows** in header

---

## 🐛 Regression Testing

### Console Errors

- [ ] **No console errors** on page load
- [ ] **No console errors** during tab switching
- [ ] **No console errors** when saving plans
- [ ] **No console warnings** (React, Vite, etc.)

### Bundle Size

- [ ] **Main bundle <700 KB** (check build output)
- [ ] **Lazy chunks load on-demand**:
  - CalorieCalculator chunk loads when Calories tab opened
  - IngredientManager chunk loads when Ingredients tab opened
  - AccountPage chunk loads when Account tab opened
- [ ] **Tesseract.js loads dynamically** (only when OCR used)

### Debug Globals

- [ ] **Production build has NO debug globals**:
  - Open console
  - Type `window.cleanupDuplicateIngredients`
  - Should be `undefined` in production
  - Should be defined in dev mode (`npm run dev`)

### Storage

- [ ] **Guest plans in localStorage** (key: `guestPlans`)
- [ ] **Authenticated plans in Firestore**
- [ ] **No duplicate keys** in localStorage
- [ ] **Quota handling works** (if localStorage full)

---

## 📱 Mobile-Specific Testing

### iOS Safari

- [ ] **App loads** on iOS Safari
- [ ] **Tabs switch smoothly**
- [ ] **Touch targets adequate** (44x44px minimum)
- [ ] **No tap delay** (300ms tap delay fixed)
- [ ] **Scrolling smooth** (momentum scrolling)
- [ ] **Inputs work** (no zoom-in on focus)

### Android Chrome

- [ ] **App loads** on Android Chrome
- [ ] **Tabs switch smoothly**
- [ ] **Bottom navigation accessible**
- [ ] **No layout shifts**
- [ ] **Back button works**

### Responsive Design

- [ ] **Desktop (1920px)**: Full layout with tabs in header
- [ ] **Tablet (768px)**: Bottom navigation
- [ ] **Mobile (390px)**: Bottom navigation, narrow header
- [ ] **Narrow mobile (375px)**: Optimized header
- [ ] **Very narrow (320px)**: Still functional

---

## ⚡ Performance Testing

### Lighthouse Audit

- [ ] **Run Lighthouse** in Chrome DevTools
- [ ] **Performance score** >90
- [ ] **Accessibility score** >90
- [ ] **Best Practices score** >90
- [ ] **SEO score** >90
- [ ] **Core Web Vitals passing**:
  - FCP <1.8s
  - LCP <2.5s
  - CLS <0.1

### Load Time

- [ ] **First load <3s** (fast 3G)
- [ ] **DOMContentLoaded <2s**
- [ ] **Time to Interactive <4s**

### Memory

- [ ] **No memory leaks** (DevTools Memory tab)
- [ ] **Tab switching doesn't accumulate memory**
- [ ] **Garbage collection works**

---

## 🔒 Security Testing

### Authentication

- [ ] **Cannot access Firestore without auth**
- [ ] **Guest data isolated** (different users can't see each other's data)
- [ ] **Logout clears session**
- [ ] **No auth tokens in localStorage** (Firebase handles)

### Data Validation

- [ ] **XSS protection**: Try entering `<script>alert('XSS')</script>` in ingredient name
  - Should be escaped, not executed
- [ ] **SQL injection protection**: Not applicable (Firestore, not SQL)
- [ ] **Input sanitization**: Special characters handled correctly

---

## 📊 Analytics Verification (if configured)

- [ ] **Page views tracked**
- [ ] **Events tracked**:
  - Plan created
  - Plan saved
  - User signed in
  - Tab switched
- [ ] **User properties set**:
  - Auth status (guest vs authenticated)
  - Theme preference

---

## ✅ Sign-Off Checklist

### Critical (Must Pass)

- [ ] All **Critical Path Tests** passed (Tests 1-6)
- [ ] No **console errors** in any browser
- [ ] **Performance targets met** (p75 <200ms, bundle <700 KB)
- [ ] **Mobile responsive** on all tested devices
- [ ] **Guest save works** without sign-in
- [ ] **Migration works** from guest to authenticated

### High Priority (Should Pass)

- [ ] **All Feature Tests** passed
- [ ] **Regression Tests** passed (no new bugs)
- [ ] **Lighthouse score** >90
- [ ] **No memory leaks** detected
- [ ] **Deep linking** works

### Medium Priority (Nice to Have)

- [ ] **Analytics tracking** verified
- [ ] **SEO score** >90
- [ ] **PWA criteria** met (if applicable)

---

## 🐞 Bug Reporting

If bugs found, report with:
1. **Severity**: Critical / High / Medium / Low
2. **Steps to reproduce**
3. **Expected behavior**
4. **Actual behavior**
5. **Screenshots/videos**
6. **Browser/device info**
7. **Console errors** (if any)

**Template**:
```markdown
## Bug: [Brief description]

**Severity**: [Critical/High/Medium/Low]

**Environment**:
- Browser: Chrome 131
- Device: iPhone 14 Pro
- OS: iOS 17.2

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected**: [What should happen]

**Actual**: [What actually happened]

**Console Errors**: [Paste errors or "None"]

**Screenshots**: [Attach if relevant]
```

---

**Last Updated**: 2026-02-08
**Version**: 1.0.0
**QA Lead**: [Name]
