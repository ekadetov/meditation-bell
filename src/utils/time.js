/**
 * Time utility functions
 * @module utils/time
 */

/**
 * Format seconds into human-readable time string
 * @param {number} seconds - Total seconds
 * @param {string} format - Format string ('HH:MM:SS', 'MM:SS', 'H:MM', etc.)
 * @returns {string} Formatted time string
 * 
 * @example
 * formatTime(3665) // "01:01:05"
 * formatTime(125, 'MM:SS') // "02:05"
 */
export function formatTime(seconds, format = 'HH:MM:SS') {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const pad = (num) => String(num).padStart(2, '0');
  
  switch (format) {
    case 'HH:MM:SS':
      return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
    case 'MM:SS':
      return `${pad(minutes)}:${pad(secs)}`;
    case 'H:MM':
      return `${hours}:${pad(minutes)}`;
    case 'M:SS':
      return `${minutes}:${pad(secs)}`;
    default:
      return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
}

/**
 * Parse time string into seconds
 * @param {string} timeStr - Time string (HH:MM:SS, MM:SS, or HH:MM)
 * @returns {number} Total seconds
 * 
 * @example
 * parseTime('01:30:00') // 5400
 * parseTime('05:30') // 330
 */
export function parseTime(timeStr) {
  const parts = timeStr.split(':').map(Number);
  
  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS or HH:MM (assume MM:SS for timer context)
    return parts[0] * 60 + parts[1];
  }
  
  return 0;
}

/**
 * Convert minutes to milliseconds
 * @param {number} minutes - Minutes
 * @returns {number} Milliseconds
 * 
 * @example
 * minutesToMs(5) // 300000
 */
export function minutesToMs(minutes) {
  return minutes * 60 * 1000;
}

/**
 * Convert milliseconds to minutes
 * @param {number} ms - Milliseconds
 * @returns {number} Minutes
 * 
 * @example
 * msToMinutes(300000) // 5
 */
export function msToMinutes(ms) {
  return ms / 1000 / 60;
}

/**
 * Convert milliseconds to seconds
 * @param {number} ms - Milliseconds
 * @returns {number} Seconds
 * 
 * @example
 * msToSeconds(5000) // 5
 */
export function msToSeconds(ms) {
  return ms / 1000;
}

/**
 * Convert seconds to milliseconds
 * @param {number} seconds - Seconds
 * @returns {number} Milliseconds
 * 
 * @example
 * secondsToMs(5) // 5000
 */
export function secondsToMs(seconds) {
  return seconds * 1000;
}

/**
 * Get current timestamp in milliseconds
 * @returns {number} Current timestamp
 * 
 * @example
 * const now = now() // 1705507200000
 */
export function now() {
  return Date.now();
}

/**
 * Get high-precision timestamp using Performance API
 * @returns {number} High-precision timestamp in milliseconds
 * 
 * @example
 * const start = performanceNow();
 * // ... do work ...
 * const elapsed = performanceNow() - start;
 */
export function performanceNow() {
  return performance.now();
}

/**
 * Calculate time until a specific hour
 * @param {number} targetHour - Target hour (0-23)
 * @returns {number} Milliseconds until target hour
 * 
 * @example
 * const msUntilNoon = timeUntilHour(12);
 */
export function timeUntilHour(targetHour) {
  const now = new Date();
  const target = new Date(now);
  target.setHours(targetHour, 0, 0, 0);
  
  // If target hour has passed today, set for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  
  return target.getTime() - now.getTime();
}

/**
 * Calculate time until a specific time (HH:MM format)
 * @param {string} timeStr - Time string in HH:MM format
 * @returns {number} Milliseconds until target time
 * 
 * @example
 * const msUntil6PM = timeUntilTime('18:00');
 */
export function timeUntilTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  const now = new Date();
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  
  // If target time has passed today, set for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  
  return target.getTime() - now.getTime();
}

/**
 * Format a timestamp as a readable date/time string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date/time string
 * 
 * @example
 * formatDateTime(Date.now()) // "Jan 17, 2026, 5:00 PM"
 */
export function formatDateTime(timestamp, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options
  };
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(new Date(timestamp));
}

/**
 * Format duration in a human-friendly way
 * @param {number} seconds - Duration in seconds
 * @returns {string} Human-readable duration
 * 
 * @example
 * formatDuration(3665) // "1 hour, 1 minute"
 * formatDuration(90) // "1 minute"
 */
export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  
  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }
  if (secs > 0 && hours === 0) {
    parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
  }
  
  return parts.join(', ') || '0 seconds';
}

/**
 * Check if a time string is valid (HH:MM format)
 * @param {string} timeStr - Time string to validate
 * @returns {boolean} True if valid
 * 
 * @example
 * isValidTimeString('18:30') // true
 * isValidTimeString('25:00') // false
 */
export function isValidTimeString(timeStr) {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(timeStr);
}

/**
 * Get the current timezone
 * @returns {string} IANA timezone identifier
 * 
 * @example
 * getTimezone() // "Europe/Lisbon"
 */
export function getTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>} Promise that resolves after duration
 * 
 * @example
 * await sleep(1000); // Wait 1 second
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
