/**
 * Validation utility functions
 * @module utils/validation
 */

import { LIMITS, TIMER_MODES, BELL_TYPES } from '../config/constants.js';
import { isValidTimeString } from './time.js';

/**
 * Validate volume level
 * @param {number} volume - Volume level to validate
 * @returns {Object} Validation result {valid, errors}
 * 
 * @example
 * validateVolume(0.5) // {valid: true, errors: []}
 * validateVolume(1.5) // {valid: false, errors: ['Volume must be between 0 and 1']}
 */
export function validateVolume(volume) {
  const errors = [];
  
  if (typeof volume !== 'number') {
    errors.push('Volume must be a number');
  } else if (volume < LIMITS.MIN_VOLUME || volume > LIMITS.MAX_VOLUME) {
    errors.push(`Volume must be between ${LIMITS.MIN_VOLUME} and ${LIMITS.MAX_VOLUME}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate timer interval in minutes
 * @param {number} interval - Interval in minutes
 * @param {string} type - Type of interval ('periodic' or 'random')
 * @returns {Object} Validation result {valid, errors}
 * 
 * @example
 * validateInterval(5, 'periodic') // {valid: true, errors: []}
 * validateInterval(150, 'periodic') // {valid: false, errors: [...]}
 */
export function validateInterval(interval, type = 'periodic') {
  const errors = [];
  
  if (typeof interval !== 'number') {
    errors.push('Interval must be a number');
    return { valid: false, errors };
  }
  
  if (!Number.isFinite(interval)) {
    errors.push('Interval must be a finite number');
    return { valid: false, errors };
  }
  
  const min = type === 'periodic' ? LIMITS.MIN_PERIODIC_INTERVAL : LIMITS.MIN_RANDOM_INTERVAL;
  const max = type === 'periodic' ? LIMITS.MAX_PERIODIC_INTERVAL : LIMITS.MAX_RANDOM_INTERVAL;
  
  if (interval < min || interval > max) {
    errors.push(`${type} interval must be between ${min} and ${max} minutes`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate random timer configuration
 * @param {Object} config - Random timer config {minInterval, maxInterval}
 * @returns {Object} Validation result {valid, errors}
 * 
 * @example
 * validateRandomConfig({minInterval: 2, maxInterval: 10})
 */
export function validateRandomConfig(config) {
  const errors = [];
  
  if (!config || typeof config !== 'object') {
    errors.push('Config must be an object');
    return { valid: false, errors };
  }
  
  const { minInterval, maxInterval } = config;
  
  // Validate individual intervals
  const minResult = validateInterval(minInterval, 'random');
  const maxResult = validateInterval(maxInterval, 'random');
  
  errors.push(...minResult.errors, ...maxResult.errors);
  
  // Validate min < max
  if (minInterval >= maxInterval) {
    errors.push('Min interval must be less than max interval');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate reminder times array
 * @param {string[]} times - Array of time strings in HH:MM format
 * @returns {Object} Validation result {valid, errors}
 * 
 * @example
 * validateReminderTimes(['06:00', '12:00', '18:00'])
 */
export function validateReminderTimes(times) {
  const errors = [];
  
  if (!Array.isArray(times)) {
    errors.push('Reminder times must be an array');
    return { valid: false, errors };
  }
  
  if (times.length > LIMITS.MAX_REMINDER_TIMES) {
    errors.push(`Maximum ${LIMITS.MAX_REMINDER_TIMES} reminder times allowed`);
  }
  
  times.forEach((time, index) => {
    if (typeof time !== 'string') {
      errors.push(`Reminder time at index ${index} must be a string`);
    } else if (!isValidTimeString(time)) {
      errors.push(`Invalid reminder time format at index ${index}: ${time}. Use HH:MM format`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate timer mode
 * @param {string} mode - Timer mode
 * @returns {Object} Validation result {valid, errors}
 * 
 * @example
 * validateTimerMode('periodic') // {valid: true, errors: []}
 * validateTimerMode('invalid') // {valid: false, errors: [...]}
 */
export function validateTimerMode(mode) {
  const errors = [];
  
  const validModes = Object.values(TIMER_MODES);
  
  if (!validModes.includes(mode)) {
    errors.push(`Invalid timer mode: ${mode}. Must be one of: ${validModes.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate bell type
 * @param {string} bellType - Bell type
 * @returns {Object} Validation result {valid, errors}
 * 
 * @example
 * validateBellType('big') // {valid: true, errors: []}
 */
export function validateBellType(bellType) {
  const errors = [];
  
  const validTypes = [...Object.values(BELL_TYPES), 'random'];
  
  if (!validTypes.includes(bellType)) {
    errors.push(`Invalid bell type: ${bellType}. Must be one of: ${validTypes.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate timer configuration based on mode
 * @param {string} mode - Timer mode
 * @param {Object} config - Timer configuration
 * @returns {Object} Validation result {valid, errors}
 * 
 * @example
 * validateTimerConfig('periodic', {smallBellInterval: 5, bigBellInterval: 15})
 */
export function validateTimerConfig(mode, config) {
  const errors = [];
  
  // Validate mode first
  const modeResult = validateTimerMode(mode);
  if (!modeResult.valid) {
    return modeResult;
  }
  
  if (!config || typeof config !== 'object') {
    errors.push('Timer config must be an object');
    return { valid: false, errors };
  }
  
  switch (mode) {
    case TIMER_MODES.PERIODIC: {
      const { smallBellInterval, bigBellInterval } = config;
      
      if (smallBellInterval !== undefined) {
        const result = validateInterval(smallBellInterval, 'periodic');
        errors.push(...result.errors);
      }
      
      if (bigBellInterval !== undefined && bigBellInterval !== 0) {
        const result = validateInterval(bigBellInterval, 'periodic');
        errors.push(...result.errors);
        
        if (smallBellInterval && bigBellInterval && bigBellInterval <= smallBellInterval) {
          errors.push('Big bell interval must be greater than small bell interval');
        }
      }
      break;
    }
    
    case TIMER_MODES.RANDOM: {
      const result = validateRandomConfig(config);
      errors.push(...result.errors);
      break;
    }
    
    case TIMER_MODES.REMINDER: {
      if (config.times) {
        const result = validateReminderTimes(config.times);
        errors.push(...result.errors);
      }
      
      if (config.bellType) {
        const result = validateBellType(config.bellType);
        errors.push(...result.errors);
      }
      break;
    }
    
    case TIMER_MODES.HOURLY: {
      if (config.bellType) {
        const result = validateBellType(config.bellType);
        errors.push(...result.errors);
      }
      break;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize user input string
 * @param {string} input - Input string to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 * 
 * @example
 * sanitizeInput('  Hello World  ', 50) // "Hello World"
 */
export function sanitizeInput(input, maxLength = LIMITS.MAX_NOTE_LENGTH) {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential HTML tags
}

/**
 * Validate tags array
 * @param {string[]} tags - Array of tag strings
 * @returns {Object} Validation result {valid, errors}
 * 
 * @example
 * validateTags(['morning', 'breath-work']) // {valid: true, errors: []}
 */
export function validateTags(tags) {
  const errors = [];
  
  if (!Array.isArray(tags)) {
    errors.push('Tags must be an array');
    return { valid: false, errors };
  }
  
  if (tags.length > LIMITS.MAX_TAGS_PER_SESSION) {
    errors.push(`Maximum ${LIMITS.MAX_TAGS_PER_SESSION} tags allowed per session`);
  }
  
  tags.forEach((tag, index) => {
    if (typeof tag !== 'string') {
      errors.push(`Tag at index ${index} must be a string`);
    } else if (tag.length > LIMITS.MAX_TAG_LENGTH) {
      errors.push(`Tag at index ${index} exceeds maximum length of ${LIMITS.MAX_TAG_LENGTH} characters`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate a complete user preferences object
 * @param {Object} preferences - User preferences object
 * @returns {Object} Validation result {valid, errors}
 */
export function validatePreferences(preferences) {
  const errors = [];
  
  if (!preferences || typeof preferences !== 'object') {
    errors.push('Preferences must be an object');
    return { valid: false, errors };
  }
  
  // Validate audio preferences
  if (preferences.audio) {
    if (preferences.audio.volume !== undefined) {
      const result = validateVolume(preferences.audio.volume);
      errors.push(...result.errors);
    }
    
    if (preferences.audio.bellType) {
      const result = validateBellType(preferences.audio.bellType);
      errors.push(...result.errors);
    }
  }
  
  // Validate timer preferences
  if (preferences.timer) {
    if (preferences.timer.defaultMode) {
      const result = validateTimerMode(preferences.timer.defaultMode);
      errors.push(...result.errors);
    }
    
    if (preferences.timer.periodicInterval !== undefined) {
      const result = validateInterval(preferences.timer.periodicInterval, 'periodic');
      errors.push(...result.errors);
    }
    
    if (preferences.timer.randomMinInterval !== undefined && preferences.timer.randomMaxInterval !== undefined) {
      const result = validateRandomConfig({
        minInterval: preferences.timer.randomMinInterval,
        maxInterval: preferences.timer.randomMaxInterval
      });
      errors.push(...result.errors);
    }
    
    if (preferences.timer.reminderTimes) {
      const result = validateReminderTimes(preferences.timer.reminderTimes);
      errors.push(...result.errors);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
