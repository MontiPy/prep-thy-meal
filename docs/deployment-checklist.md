# Deployment Checklist - v1 Foundation Fixes

This checklist ensures safe deployment of the v1 foundation fixes to staging and production.

## Pre-Deployment Verification

### ✅ Build Verification

- [ ] **Clean build succeeds**
  ```bash
  rm -rf node_modules dist
  npm install
  npm run build
  ```
- [ ] **No build warnings** in terminal output
- [ ] **Bundle sizes within targets**:
  - Main bundle: <700 KB ✅ (current: 299 KB)
  - All vendor chunks properly split
  - Lazy chunks loading on-demand

### ✅ Code Quality

- [ ] **No ESLint errors**
  ```bash
  npm run lint
  ```
- [ ] **All tests passing** (if tests exist)
  ```bash
  npm test
  ```
- [ ] **No console errors** in dev mode
- [ ] **No console warnings** in dev mode

### ✅ Environment Configuration

- [ ] **Firebase config verified** in `.env`
  - VITE_FIREBASE_API_KEY
  - VITE_FIREBASE_AUTH_DOMAIN
  - VITE_FIREBASE_PROJECT_ID
  - VITE_FIREBASE_STORAGE_BUCKET
  - VITE_FIREBASE_MESSAGING_SENDER_ID
  - VITE_FIREBASE_APP_ID
- [ ] **USDA API key** configured (if needed)
  - VITE_USDA_API_KEY
- [ ] **Production environment variables** ready

### ✅ Git Hygiene

- [ ] **All changes committed**
  ```bash
  git status
  # Should show: "nothing to commit, working tree clean"
  ```
- [ ] **Commit message follows convention**
  - Format: `feat: v1 foundation fixes - all workstreams complete`
  - Includes Co-Authored-By line
- [ ] **Branch is up to date** with main/master
  ```bash
  git fetch origin
  git status
  ```

## Staging Deployment

### ✅ Pre-Deploy

- [ ] **Create deployment branch**
  ```bash
  git checkout -b deploy/v1-foundation-fixes
  ```
- [ ] **Tag the release**
  ```bash
  git tag -a v1.0.0-rc.1 -m "v1 Foundation Fixes - Release Candidate 1"
  ```
- [ ] **Push to remote**
  ```bash
  git push origin deploy/v1-foundation-fixes --tags
  ```

### ✅ Deploy to Staging

- [ ] **Build production bundle**
  ```bash
  npm run build
  ```
- [ ] **Deploy to staging** (adjust for your hosting):

  **Firebase Hosting (Staging Channel)**:
  ```bash
  firebase hosting:channel:deploy staging --expires 7d
  ```

  **Vercel/Netlify**:
  ```bash
  # Deploy to preview environment
  vercel --prod=false
  # OR
  netlify deploy --build
  ```

- [ ] **Verify deployment URL** is accessible
- [ ] **Record staging URL** for testing

### ✅ Post-Deploy Verification (Staging)

- [ ] **Homepage loads** without errors
- [ ] **All tabs accessible**: Planner, Calories, Guide, Ingredients, Account
- [ ] **Deep linking works**: Test `?tab=calories`, `?tab=ingredients`, etc.
- [ ] **Performance overlay works**: Add `?perf` to URL
- [ ] **No console errors** in browser DevTools
- [ ] **Mobile responsive**: Test on narrow viewport (375px)

## Staging Testing (QA)

See `docs/qa-testing-checklist.md` for complete testing protocol.

**Critical Paths**:
- [ ] Guest user can create and save plan
- [ ] Guest user can sign in (Google OAuth)
- [ ] Guest data migrates to Firebase on sign-in
- [ ] Authenticated user can save plans to cloud
- [ ] Tab switching is smooth (<200ms perceived)
- [ ] Macro transfer from Calories → Planner works
- [ ] Mobile header doesn't overflow on iPhone SE (375px)

## Performance Benchmarking

- [ ] **Run performance benchmark** using `docs/perf-checklist.md`
- [ ] **Record metrics** in `docs/perf-baseline.md`
- [ ] **Compare to targets**:
  - Bundle size: <700 KB ✅
  - Tab switch p75: <200ms
  - Tab switch p95: <350ms
- [ ] **Lighthouse audit** (target score >90)
  ```bash
  # In Chrome DevTools
  # Lighthouse → Performance → Analyze page load
  ```

## Production Deployment

### ✅ Pre-Production

- [ ] **Staging testing complete** (all checks passed)
- [ ] **Performance benchmarks recorded**
- [ ] **No critical bugs** identified in staging
- [ ] **Stakeholder approval** (if required)
- [ ] **Backup plan ready** (rollback procedure)

### ✅ Deploy to Production

- [ ] **Merge to main branch**
  ```bash
  git checkout main
  git merge deploy/v1-foundation-fixes
  ```
- [ ] **Tag production release**
  ```bash
  git tag -a v1.0.0 -m "v1 Foundation Fixes - Production Release"
  git push origin main --tags
  ```
- [ ] **Deploy to production**:

  **Firebase Hosting**:
  ```bash
  firebase deploy --only hosting
  ```

  **Vercel**:
  ```bash
  vercel --prod
  ```

  **Netlify**:
  ```bash
  netlify deploy --prod
  ```

### ✅ Post-Deploy Verification (Production)

- [ ] **Production URL accessible**
- [ ] **Smoke test critical paths**:
  - [ ] Homepage loads
  - [ ] Guest can create plan
  - [ ] Google sign-in works
  - [ ] Tab navigation smooth
  - [ ] No console errors
- [ ] **Performance check**: Add `?perf` to URL, verify p75 <200ms
- [ ] **Mobile check**: Test on real device (iPhone/Android)

## Monitoring (24-48 hours)

### ✅ Metrics to Watch

- [ ] **Error rate** (if analytics configured)
  - Target: <0.1% error rate
- [ ] **Bounce rate** (guest users)
  - Watch for increase (may indicate issues)
- [ ] **Average session duration**
  - Should remain stable or increase
- [ ] **Guest → Auth conversion rate**
  - Watch for improvements (guest save enabled)

### ✅ User Feedback

- [ ] **Monitor support channels** (if applicable)
- [ ] **Check GitHub issues** for bug reports
- [ ] **Test user feedback** from early adopters

### ✅ Performance Monitoring

- [ ] **Core Web Vitals** (if Google Search Console configured):
  - FCP: <1.8s
  - LCP: <2.5s
  - CLS: <0.1
- [ ] **Bundle size monitoring** (if configured)
- [ ] **Server costs** (Firebase/hosting bills)

## Rollback Procedure

**If critical issues found**:

### Quick Rollback (Firebase Hosting)
```bash
# Revert to previous deployment
firebase hosting:rollback

# Or deploy previous version
git checkout v0.9.0  # Previous stable tag
npm run build
firebase deploy --only hosting
```

### Quick Rollback (Vercel/Netlify)
- Use web dashboard to rollback to previous deployment
- Both platforms keep deployment history

### Partial Rollback
If only specific features are problematic:
1. Disable performance overlay: Remove `?perf` functionality
2. Disable guest save: Re-add auth check (temp fix)
3. Disable deep linking: Remove URL param handling

**DO NOT** partial rollback unless absolutely necessary. Full rollback is safer.

## Success Criteria

Deployment considered successful when:

- ✅ **No critical bugs** reported in first 48 hours
- ✅ **Performance targets met**: p75 <200ms, bundle <700 KB
- ✅ **Core Web Vitals passing**: FCP <1.8s, LCP <2.5s
- ✅ **Guest save working**: Users can save without sign-in
- ✅ **Mobile UX improved**: No overflow on narrow screens
- ✅ **Error rate stable**: No increase in console errors
- ✅ **User feedback positive**: No major complaints

## Post-Deployment Tasks

- [ ] **Update README** with new features
- [ ] **Create release notes** (GitHub release)
- [ ] **Update project board** (mark v1 complete)
- [ ] **Celebrate** 🎉 (team accomplished major milestone!)
- [ ] **Plan next iteration** (post-v1 features)

## Contacts

**Deployment Issues**:
- Technical Lead: [Name/Email]
- DevOps: [Name/Email]
- Firebase Admin: [Name/Email]

**Rollback Authorization**:
- Technical Lead: [Name]
- Product Owner: [Name]

---

**Last Updated**: 2026-02-08
**Version**: 1.0.0
**Maintained By**: Engineering Team
