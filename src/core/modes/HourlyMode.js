/**
 * Hourly Mode - Rings bell every hour on the hour
 * @module core/modes/HourlyMode
 */

import { eventBus } from '../EventBus.js';
import { EVENTS, BELL_TYPES, TIMER_MODES } from '../../config/constants.js';
import { timeUntilHour, isValidTimeString } from '../../utils/time.js';
import { validateBellType } from '../../utils/validation.js';

/**
 * HourlyMode rings a bell every hour on the hour
 * Optionally restricts to specific hours (e.g., 9 AM to 9 PM)
 * 
 * @example
 * const mode = new HourlyMode({
 *   bellType: 'big',
 *   onlyDuringHours: { start: '09:00', end: '21:00' } // Only ring 9 AM - 9 PM
 * });
 */
export class HourlyMode {
  /**
   * Creates an HourlyMode instance
   * @param {Object} config - Mode configuration
   * @param {string} config.bellType - Bell type ('big' or 'small')
   * @param {Object} config.onlyDuringHours - Optional time restriction {start, end} in HH:MM
   * @param {EventBus} config.eventBus - Event bus instance (optional)
   */
  constructor(config = {}) {
    const {
      bellType = BELL_TYPES.BIG,
      onlyDuringHours = null,
      eventBus: customEventBus = null
    } = config;
    
    // Validate bell type
    const bellValidation = validateBellType(bellType);
    if (!bellValidation.valid) {
      throw new Error(`Invalid bell type: ${bellValidation.errors.join(', ')}`);
    }
    
    // Validate time restrictions if provided
    if (onlyDuringHours) {
      if (!onlyDuringHours.start || !onlyDuringHours.end) {
        throw new Error('onlyDuringHours must have both start and end times');
      }
      
      if (!isValidTimeString(onlyDuringHours.start) || !isValidTimeString(onlyDuringHours.end)) {
        throw new Error('onlyDuringHours times must be in HH:MM format');
      }
    }
    
    /** @public {string} Mode name */
    this.name = TIMER_MODES.HOURLY;
    
    /** @private {string} Bell type */
    this.bellType = bellType;
    
    /** @private {Object|null} Time restrictions */
    this.onlyDuringHours = onlyDuringHours;
    
    /** @private {EventBus} Event bus reference */
    this.eventBus = customEventBus || eventBus;
    
    /** @private {number} Bell counter */
    this.bellCount = 0;
    
    /** @private {number} Next bell time (hour) */
    this.nextBellHour = null;
    
    /** @private {number} Next bell timestamp */
    this.nextBellTime = null;
  }

  /**
   * Initialize the mode when timer starts
   * @param {TimerEngine} timer - Timer engine instance
   */
  onStart(timer) {
    this.bellCount = 0;
    
    // Schedule first hourly bell
    this.#scheduleNextHour(timer);
  }

  /**
   * Called when timer completes an interval
   * @param {TimerEngine} timer - Timer engine instance
   */
  onComplete(timer) {
    const now = new Date();
    
    // Ring the bell if we're within allowed hours
    if (this.#isWithinAllowedHours(now)) {
      this.#ringBell(this.bellType, now.getTime(), now.getHours());
      this.bellCount++;
    }
    
    // Schedule next hour
    this.#scheduleNextHour(timer);
  }

  /**
   * Schedule the next hourly bell
   * @private
   * @param {TimerEngine} timer - Timer engine instance
   */
  #scheduleNextHour(timer) {
    const now = new Date();
    let nextHour = now.getHours() + 1;
    
    // Handle day rollover
    if (nextHour >= 24) {
      nextHour = 0;
    }
    
    // If we have hour restrictions, find the next allowed hour
    if (this.onlyDuringHours) {
      nextHour = this.#findNextAllowedHour(nextHour);
      if (nextHour === null) {
        // No more allowed hours today, schedule for start time tomorrow
        const [startHour] = this.onlyDuringHours.start.split(':').map(Number);
        nextHour = startHour;
      }
    }
    
    this.nextBellHour = nextHour;
    const msUntilNextHour = timeUntilHour(nextHour);
    this.nextBellTime = Date.now() + msUntilNextHour;
    
    // Reset timer with interval to next hour
    timer.reset(msUntilNextHour);
    timer.start();
  }

  /**
   * Check if current time is within allowed hours
   * @private
   * @param {Date} date - Date to check
   * @returns {boolean} True if within allowed hours
   */
  #isWithinAllowedHours(date) {
    if (!this.onlyDuringHours) {
      return true; // No restrictions
    }
    
    const currentTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const { start, end } = this.onlyDuringHours;
    
    return currentTime >= start && currentTime <= end;
  }

  /**
   * Find the next allowed hour
   * @private
   * @param {number} startHour - Hour to start searching from
   * @returns {number|null} Next allowed hour or null if none today
   */
  #findNextAllowedHour(startHour) {
    if (!this.onlyDuringHours) {
      return startHour;
    }
    
    const [startAllowed, startMinutes] = this.onlyDuringHours.start.split(':').map(Number);
    const [endAllowed, endMinutes] = this.onlyDuringHours.end.split(':').map(Number);
    
    // Check each hour from startHour to 23
    for (let hour = startHour; hour <= 23; hour++) {
      if (hour >= startAllowed && hour <= endAllowed) {
        // Check if this hour is valid considering minutes
        if (hour === startAllowed && startMinutes > 0 && hour === startHour) {
          continue; // Skip if we've already passed the start time
        }
        if (hour === endAllowed && endMinutes === 0) {
          continue; // Skip if end is exactly on the hour (no ring)
        }
        return hour;
      }
    }
    
    return null; // No more allowed hours today
  }

  /**
   * Ring a bell
   * @private
   * @param {string} bellType - Type of bell to ring
   * @param {number} timestamp - Current timestamp
   * @param {number} hour - Current hour
   */
  #ringBell(bellType, timestamp, hour) {
    this.eventBus.dispatch(EVENTS.BELL_RING, {
      bellType,
      timestamp,
      mode: this.name,
      hour,
      bellCount: this.bellCount
    });
  }

  /**
   * Get the next scheduled bell time
   * @returns {Object} Next bell info {time, hour, interval}
   */
  getNextBell() {
    if (!this.nextBellTime) {
      return null;
    }
    
    return {
      time: this.nextBellTime,
      hour: this.nextBellHour,
      interval: this.nextBellTime - Date.now()
    };
  }

  /**
   * Get mode statistics
   * @returns {Object} Mode statistics
   */
  getStats() {
    return {
      mode: this.name,
      bellType: this.bellType,
      onlyDuringHours: this.onlyDuringHours,
      bellCount: this.bellCount,
      nextBell: this.getNextBell()
    };
  }

  /**
   * Reset mode state
   */
  reset() {
    this.bellCount = 0;
    this.nextBellHour = null;
    this.nextBellTime = null;
  }

  /**
   * Get mode configuration
   * @returns {Object} Mode configuration
   */
  getConfig() {
    return {
      bellType: this.bellType,
      onlyDuringHours: this.onlyDuringHours ? { ...this.onlyDuringHours } : null
    };
  }

  /**
   * Update mode configuration
   * @param {Object} config - New configuration
   * @param {string} config.bellType - Bell type
   * @param {Object} config.onlyDuringHours - Time restrictions
   */
  updateConfig(config) {
    if (config.bellType !== undefined) {
      const validation = validateBellType(config.bellType);
      if (!validation.valid) {
        throw new Error(`Invalid bell type: ${validation.errors.join(', ')}`);
      }
      this.bellType = config.bellType;
    }
    
    if (config.onlyDuringHours !== undefined) {
      if (config.onlyDuringHours === null) {
        this.onlyDuringHours = null;
      } else {
        if (!config.onlyDuringHours.start || !config.onlyDuringHours.end) {
          throw new Error('onlyDuringHours must have both start and end times');
        }
        
        if (!isValidTimeString(config.onlyDuringHours.start) || 
            !isValidTimeString(config.onlyDuringHours.end)) {
          throw new Error('onlyDuringHours times must be in HH:MM format');
        }
        
        this.onlyDuringHours = { ...config.onlyDuringHours };
      }
    }
  }
}
