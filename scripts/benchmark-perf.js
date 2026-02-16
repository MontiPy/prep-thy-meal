#!/usr/bin/env node
/**
 * Performance Benchmarking Script
 *
 * Helps automate performance measurements and baseline comparisons
 * Run after deployment to verify performance targets
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASELINE_FILE = join(__dirname, '../docs/perf-baseline.md');
const RESULTS_DIR = join(__dirname, '../perf-results');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function _formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function getBundleStats() {
  const distPath = join(__dirname, '../dist');

  if (!existsSync(distPath)) {
    log('❌ Build not found. Run npm run build first.', 'red');
    return null;
  }

  // Read build output from package.json scripts or parse dist folder
  log('\n📦 Bundle Size Analysis', 'cyan');
  log('Run: npm run build', 'blue');
  log('Then manually record bundle sizes from terminal output\n', 'blue');

  return null;
}

function displayPerfOverlayInstructions() {
  log('\n⚡ Tab Switch Latency Measurement', 'cyan');
  log('', 'reset');
  log('1. Open your app in Chrome', 'blue');
  log('2. Add ?perf to the URL (e.g., http://localhost:4173?perf)', 'blue');
  log('3. Performance overlay will appear in bottom-right', 'blue');
  log('4. Switch through all tabs 3 times:', 'blue');
  log('   Planner → Calories → Guide → Ingredients → Account → Planner', 'blue');
  log('5. Check overlay for p50, p75, p95, avg values', 'blue');
  log('', 'reset');
  log('Targets:', 'yellow');
  log('  - p75: <200ms (green = pass)', 'yellow');
  log('  - p95: <350ms (yellow/green = pass)', 'yellow');
  log('  - Avg: <180ms', 'yellow');
  log('', 'reset');
}

function displayLighthouseInstructions() {
  log('\n🔍 Lighthouse Audit', 'cyan');
  log('', 'reset');
  log('1. Open your app in Chrome', 'blue');
  log('2. Open DevTools (F12 or Cmd+Option+I)', 'blue');
  log('3. Navigate to Lighthouse tab', 'blue');
  log('4. Select:', 'blue');
  log('   - Mode: Navigation', 'blue');
  log('   - Device: Desktop (or Mobile)', 'blue');
  log('   - Categories: Performance', 'blue');
  log('5. Click "Analyze page load"', 'blue');
  log('6. Record Core Web Vitals:', 'blue');
  log('   - FCP (First Contentful Paint)', 'blue');
  log('   - LCP (Largest Contentful Paint)', 'blue');
  log('   - TBT (Total Blocking Time)', 'blue');
  log('   - CLS (Cumulative Layout Shift)', 'blue');
  log('', 'reset');
  log('Targets:', 'yellow');
  log('  - FCP: <1.8s', 'yellow');
  log('  - LCP: <2.5s', 'yellow');
  log('  - TBT: <300ms', 'yellow');
  log('  - CLS: <0.1', 'yellow');
  log('', 'reset');
}

function displayConsoleAPIInstructions() {
  log('\n🖥️  Console API (Alternative Method)', 'cyan');
  log('', 'reset');
  log('1. Open your app with ?perf flag', 'blue');
  log('2. Switch through tabs to collect samples', 'blue');
  log('3. Open browser console', 'blue');
  log('4. Run commands:', 'blue');
  log('', 'reset');
  log('   // Get statistics', 'green');
  log('   window.perfUtils.getStats()', 'green');
  log('   // Returns: { p50, p75, p95, avg, count }', 'blue');
  log('', 'reset');
  log('   // Export metrics as JSON', 'green');
  log('   window.perfUtils.export()', 'green');
  log('', 'reset');
  log('   // Clear metrics', 'green');
  log('   window.perfUtils.clear()', 'green');
  log('', 'reset');
}

function _checkTargets(metrics) {
  log('\n🎯 Target Verification', 'cyan');
  log('', 'reset');

  const targets = {
    bundleSize: 700, // KB
    tabSwitchP75: 200, // ms
    tabSwitchP95: 350, // ms
    tabSwitchAvg: 180, // ms
    fcp: 1800, // ms
    lcp: 2500, // ms
    tbt: 300, // ms
    cls: 0.1
  };

  if (metrics.bundleSize) {
    const pass = metrics.bundleSize < targets.bundleSize;
    log(`Main Bundle: ${metrics.bundleSize} KB ${pass ? '✅' : '❌'} (target: <${targets.bundleSize} KB)`, pass ? 'green' : 'red');
  }

  if (metrics.tabSwitchP75) {
    const pass = metrics.tabSwitchP75 < targets.tabSwitchP75;
    log(`Tab Switch p75: ${metrics.tabSwitchP75}ms ${pass ? '✅' : '❌'} (target: <${targets.tabSwitchP75}ms)`, pass ? 'green' : 'red');
  }

  if (metrics.tabSwitchP95) {
    const pass = metrics.tabSwitchP95 < targets.tabSwitchP95;
    log(`Tab Switch p95: ${metrics.tabSwitchP95}ms ${pass ? '✅' : '❌'} (target: <${targets.tabSwitchP95}ms)`, pass ? 'green' : 'red');
  }

  if (metrics.fcp) {
    const pass = metrics.fcp < targets.fcp;
    log(`FCP: ${metrics.fcp}ms ${pass ? '✅' : '❌'} (target: <${targets.fcp}ms)`, pass ? 'green' : 'red');
  }

  if (metrics.lcp) {
    const pass = metrics.lcp < targets.lcp;
    log(`LCP: ${metrics.lcp}ms ${pass ? '✅' : '❌'} (target: <${targets.lcp}ms)`, pass ? 'green' : 'red');
  }

  log('', 'reset');
}

function main() {
  log('\n╔════════════════════════════════════════════════════╗', 'cyan');
  log('║   Performance Benchmarking Helper                 ║', 'cyan');
  log('║   Prep Thy Meal - v1 Foundation Fixes             ║', 'cyan');
  log('╚════════════════════════════════════════════════════╝\n', 'cyan');

  log('This script guides you through performance benchmarking.', 'reset');
  log('Follow the instructions below for each measurement type.\n', 'reset');

  // Bundle size
  getBundleStats();

  // Tab switch latency
  displayPerfOverlayInstructions();

  // Lighthouse
  displayLighthouseInstructions();

  // Console API
  displayConsoleAPIInstructions();

  log('\n📝 Recording Results', 'cyan');
  log('', 'reset');
  log('After collecting measurements, update:', 'blue');
  log('  docs/perf-baseline.md', 'green');
  log('', 'reset');
  log('Replace [To be measured] placeholders with actual values.', 'blue');
  log('', 'reset');

  log('\n📋 Full Testing Checklist', 'cyan');
  log('See docs/perf-checklist.md for complete benchmarking protocol\n', 'blue');

  log('Happy benchmarking! 🚀\n', 'green');
}

main();
