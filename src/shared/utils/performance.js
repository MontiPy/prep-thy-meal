// Performance measurement utilities

/**
 * Check if performance tracking is enabled
 * Can be enabled via URL param ?perf or localStorage ptm_perf=1
 * @returns {boolean} True if performance tracking is enabled
 */
export const isPerfEnabled = () => {
  if (typeof window === 'undefined') return false;

  // Check URL param
  const params = new URLSearchParams(window.location.search);
  if (params.has('perf')) return true;

  // Check localStorage
  try {
    return window.localStorage?.getItem('ptm_perf') === '1';
  } catch {
    return false;
  }
};

/**
 * Enable performance tracking
 */
export const enablePerf = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem('ptm_perf', '1');
    if (import.meta.env.DEV) console.log('[perf] Performance tracking enabled. Refresh to apply.');
  } catch (e) {
    console.error('Failed to enable perf tracking:', e);
  }
};

/**
 * Disable performance tracking
 */
export const disablePerf = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.removeItem('ptm_perf');
    if (import.meta.env.DEV) console.log('[perf] Performance tracking disabled. Refresh to apply.');
  } catch (e) {
    console.error('Failed to disable perf tracking:', e);
  }
};

/**
 * Mark the start of a tab switch
 * @param {string} fromTab - Tab being switched from
 * @param {string} toTab - Tab being switched to
 */
export const markTabSwitchStart = (fromTab, toTab) => {
  if (typeof performance === 'undefined') return;
  try {
    performance.mark(`tab:${fromTab}->${toTab}:start`);
  } catch {
    // Ignore unsupported environments
  }
};

/**
 * Mark the end of a tab switch and measure duration
 * @param {string} fromTab - Tab being switched from
 * @param {string} toTab - Tab being switched to
 */
export const markTabSwitchEnd = (fromTab, toTab) => {
  if (typeof performance === 'undefined') return;
  try {
    performance.mark(`tab:${fromTab}->${toTab}:end`);
    performance.measure(
      `tab:${fromTab}->${toTab}`,
      `tab:${fromTab}->${toTab}:start`,
      `tab:${fromTab}->${toTab}:end`
    );
  } catch {
    // Ignore unsupported environments
  }
};

/**
 * Mark component first render
 * @param {string} componentName - Name of the component
 */
export const markComponentRender = (componentName) => {
  if (typeof performance === 'undefined') return;
  try {
    performance.mark(`${componentName}-first-render`);
  } catch {
    // Ignore unsupported environments
  }
};

/**
 * Clear component render mark
 * @param {string} componentName - Name of the component
 */
export const clearComponentRenderMark = (componentName) => {
  if (typeof performance === 'undefined') return;
  try {
    performance.clearMarks(`${componentName}-first-render`);
  } catch {
    // Ignore unsupported environments
  }
};

/**
 * Get all tab switch metrics
 * @returns {Array} Array of tab switch performance measures
 */
export const getTabSwitchMetrics = () => {
  if (typeof performance === 'undefined') return [];
  try {
    return performance
      .getEntriesByType('measure')
      .filter(m => m.name.includes('tab:'));
  } catch {
    return [];
  }
};

/**
 * Calculate statistics from tab switch metrics
 * @returns {Object} Statistics object with p50, p75, p95, avg
 */
export const getTabSwitchStats = () => {
  const metrics = getTabSwitchMetrics();
  if (metrics.length === 0) {
    return { p50: 0, p75: 0, p95: 0, avg: 0, count: 0 };
  }

  const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
  const count = durations.length;

  const p50Index = Math.floor(count * 0.5);
  const p75Index = Math.floor(count * 0.75);
  const p95Index = Math.floor(count * 0.95);

  const avg = durations.reduce((sum, d) => sum + d, 0) / count;

  return {
    p50: durations[p50Index],
    p75: durations[p75Index],
    p95: durations[p95Index],
    avg,
    count
  };
};

/**
 * Clear all performance marks and measures
 */
export const clearPerformanceMetrics = () => {
  if (typeof performance === 'undefined') return;
  try {
    performance.clearMarks();
    performance.clearMeasures();
    if (import.meta.env.DEV) console.log('[perf] All performance metrics cleared');
  } catch {
    // Ignore unsupported environments
  }
};

/**
 * Export performance metrics as JSON
 * @returns {Object} Performance metrics data
 */
export const exportMetrics = () => {
  const metrics = getTabSwitchMetrics();
  const stats = getTabSwitchStats();

  return {
    timestamp: new Date().toISOString(),
    stats,
    metrics: metrics.map(m => ({
      name: m.name,
      duration: m.duration,
      startTime: m.startTime
    }))
  };
};

// Make utilities available in dev console
if (import.meta.env.DEV) {
  window.perfUtils = {
    enable: enablePerf,
    disable: disablePerf,
    getMetrics: getTabSwitchMetrics,
    getStats: getTabSwitchStats,
    clear: clearPerformanceMetrics,
    export: exportMetrics
  };
  console.log('[perf] Performance utilities available: window.perfUtils.enable()');
}
