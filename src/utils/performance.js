/**
 * Performance Monitoring Utilities
 * Tracks Core Web Vitals and other performance metrics
 * @module utils/performance
 */

/**
 * Performance metrics storage
 * @type {Object}
 */
const metrics = {
  lcp: null,
  fid: null,
  cls: 0,
  tti: null,
  fcp: null,
};

/**
 * Track Largest Contentful Paint (LCP)
 * Good: < 2.5s | Needs Improvement: 2.5s - 4s | Poor: > 4s
 */
function trackLCP() {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 LCP:', metrics.lcp.toFixed(2) + 'ms', getMetricStatus(metrics.lcp, 2500, 4000));
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (error) {
    console.warn('[Performance] Error tracking LCP:', error);
  }
}

/**
 * Track First Input Delay (FID)
 * Good: < 100ms | Needs Improvement: 100ms - 300ms | Poor: > 300ms
 */
function trackFID() {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        metrics.fid = entry.processingStart - entry.startTime;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 FID:', metrics.fid.toFixed(2) + 'ms', getMetricStatus(metrics.fid, 100, 300));
        }
      });
    });

    observer.observe({ entryTypes: ['first-input'] });
  } catch (error) {
    console.warn('[Performance] Error tracking FID:', error);
  }
}

/**
 * Track Cumulative Layout Shift (CLS)
 * Good: < 0.1 | Needs Improvement: 0.1 - 0.25 | Poor: > 0.25
 */
function trackCLS() {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // Only count layout shifts without recent input
        if (!entry.hadRecentInput) {
          metrics.cls += entry.value;
          
          if (process.env.NODE_ENV === 'development') {
            console.log('📊 CLS:', metrics.cls.toFixed(3), getMetricStatus(metrics.cls, 0.1, 0.25));
          }
        }
      });
    });

    observer.observe({ entryTypes: ['layout-shift'] });
  } catch (error) {
    console.warn('[Performance] Error tracking CLS:', error);
  }
}

/**
 * Track First Contentful Paint (FCP)
 * Good: < 1.8s | Needs Improvement: 1.8s - 3s | Poor: > 3s
 */
function trackFCP() {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          metrics.fcp = entry.startTime;
          
          if (process.env.NODE_ENV === 'development') {
            console.log('📊 FCP:', metrics.fcp.toFixed(2) + 'ms', getMetricStatus(metrics.fcp, 1800, 3000));
          }
        }
      });
    });

    observer.observe({ entryTypes: ['paint'] });
  } catch (error) {
    console.warn('[Performance] Error tracking FCP:', error);
  }
}

/**
 * Track Time to Interactive (TTI)
 * Approximate based on when the page is fully interactive
 */
function trackTTI() {
  if (typeof performance === 'undefined') return;

  try {
    // Use a heuristic: when the page is fully loaded and idle
    if (document.readyState === 'complete') {
      calculateTTI();
    } else {
      window.addEventListener('load', calculateTTI);
    }
  } catch (error) {
    console.warn('[Performance] Error tracking TTI:', error);
  }
}

/**
 * Calculate TTI based on performance timeline
 */
function calculateTTI() {
  try {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      metrics.tti = navigation.domInteractive;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 TTI:', metrics.tti.toFixed(2) + 'ms', getMetricStatus(metrics.tti, 3800, 7300));
      }
    }
  } catch (error) {
    console.warn('[Performance] Error calculating TTI:', error);
  }
}

/**
 * Get metric status label
 * @param {number} value - Metric value
 * @param {number} goodThreshold - Good threshold
 * @param {number} poorThreshold - Poor threshold
 * @returns {string} Status label with emoji
 */
function getMetricStatus(value, goodThreshold, poorThreshold) {
  if (value < goodThreshold) return '✅ Good';
  if (value < poorThreshold) return '⚠️ Needs Improvement';
  return '❌ Poor';
}

/**
 * Track bundle load time
 */
function trackBundleLoad() {
  if (typeof performance === 'undefined') return;

  try {
    const resources = performance.getEntriesByType('resource');
    const scripts = resources.filter(r => r.name.endsWith('.js'));
    const styles = resources.filter(r => r.name.endsWith('.css'));

    const scriptLoadTime = scripts.reduce((sum, s) => sum + s.duration, 0);
    const styleLoadTime = styles.reduce((sum, s) => sum + s.duration, 0);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📦 Bundle Load Time:');
      console.log('  JavaScript:', scriptLoadTime.toFixed(2) + 'ms');
      console.log('  CSS:', styleLoadTime.toFixed(2) + 'ms');
      console.log('  Total:', (scriptLoadTime + styleLoadTime).toFixed(2) + 'ms');
    }
  } catch (error) {
    console.warn('[Performance] Error tracking bundle load:', error);
  }
}

/**
 * Get all tracked metrics
 * @returns {Object} Performance metrics object
 */
export function getMetrics() {
  return { ...metrics };
}

/**
 * Log all metrics to console (development only)
 */
export function logMetrics() {
  if (process.env.NODE_ENV !== 'development') return;

  console.group('📊 Performance Metrics');
  console.log('LCP (Largest Contentful Paint):', metrics.lcp ? metrics.lcp.toFixed(2) + 'ms' : 'Not measured');
  console.log('FID (First Input Delay):', metrics.fid ? metrics.fid.toFixed(2) + 'ms' : 'Not measured');
  console.log('CLS (Cumulative Layout Shift):', metrics.cls.toFixed(3));
  console.log('FCP (First Contentful Paint):', metrics.fcp ? metrics.fcp.toFixed(2) + 'ms' : 'Not measured');
  console.log('TTI (Time to Interactive):', metrics.tti ? metrics.tti.toFixed(2) + 'ms' : 'Not measured');
  console.groupEnd();
}

/**
 * Initialize performance monitoring
 * Call this once when the app starts
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Track Core Web Vitals
  trackLCP();
  trackFID();
  trackCLS();
  trackFCP();
  trackTTI();

  // Track bundle load time
  if (document.readyState === 'complete') {
    trackBundleLoad();
  } else {
    window.addEventListener('load', trackBundleLoad);
  }

  // Log metrics after page is fully loaded (development only)
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      logMetrics();
    }, 3000);
  }
}

/**
 * Report performance metrics (for analytics/monitoring services)
 * @param {Function} callback - Callback function to send metrics
 */
export function reportMetrics(callback) {
  if (typeof callback !== 'function') {
    console.warn('[Performance] reportMetrics requires a callback function');
    return;
  }

  // Wait for metrics to be collected
  setTimeout(() => {
    callback(getMetrics());
  }, 3000);
}

/**
 * Mark a custom performance measurement
 * @param {string} name - Measurement name
 */
export function mark(name) {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
}

/**
 * Measure time between two marks
 * @param {string} name - Measurement name
 * @param {string} startMark - Start mark name
 * @param {string} endMark - End mark name
 */
export function measure(name, startMark, endMark) {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      const measurement = performance.getEntriesByName(name)[0];
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${name}:`, measurement.duration.toFixed(2) + 'ms');
      }
      
      return measurement.duration;
    } catch (error) {
      console.warn(`[Performance] Error measuring ${name}:`, error);
    }
  }
}

// Export default object with all functions
export default {
  init: initPerformanceMonitoring,
  getMetrics,
  logMetrics,
  reportMetrics,
  mark,
  measure,
};
