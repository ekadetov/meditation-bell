/**
 * Reminder Mode - Rings bells at specific times
 * @module core/modes/ReminderMode
 */

import { eventBus } from '../EventBus.js';
import { EVENTS, BELL_TYPES, TIMER_MODES } from '../../config/constants.js';
import { timeUntilTime } from '../../utils/time.js';
import { validateReminderTimes, validateBellType } from '../../utils/validation.js';

/**
 * ReminderMode rings bells at user-specified times
 * Supports one-time and recurring daily reminders
 * 
 * @example
 * const mode = new ReminderMode({
 *   times: ['06:00', '12:00', '18:00'],  // Ring at 6 AM, noon, and 6 PM
 *   recurring: true,                      // Repeat daily
 *   bellType: 'big'                       // Always use big bell
 * });
 */
export class ReminderMode {
  /**
   * Creates a ReminderMode instance
   * @param {Object} config - Mode configuration
   * @param {string[]} config.times - Array of times in HH:MM format
   * @param {boolean} config.recurring - Whether reminders repeat daily
   * @param {string} config.bellType - Bell type ('big' or 'small')
   * @param {EventBus} config.eventBus - Event bus instance (optional)
   */
  constructor(config = {}) {
    const {
      times = [],
      recurring = true,
      bellType = BELL_TYPES.BIG,
      eventBus: customEventBus = null
    } = config;
    
    // Validate times
    const validation = validateReminderTimes(times);
    if (!validation.valid) {
      throw new Error(`Invalid reminder times: ${validation.errors.join(', ')}`);
    }
    
    // Validate bell type
    const bellValidation = validateBellType(bellType);
    if (!bellValidation.valid) {
      throw new Error(`Invalid bell type: ${bellValidation.errors.join(', ')}`);
    }
    
    /** @public {string} Mode name */
    this.name = TIMER_MODES.REMINDER;
    
    /** @private {string[]} Reminder times */
    this.times = [...times].sort(); // Sort times chronologically
    
    /** @private {boolean} Recurring daily */
    this.recurring = recurring;
    
    /** @private {string} Bell type */
    this.bellType = bellType;
    
    /** @private {EventBus} Event bus reference */
    this.eventBus = customEventBus || eventBus;
    
    /** @private {Set<string>} Completed reminder times (for one-time reminders) */
    this.completed = new Set();
    
    /** @private {number} Bell counter */
    this.bellCount = 0;
    
    /** @private {string} Next reminder time */
    this.nextReminderTime = null;
    
    /** @private {number} Next bell timestamp */
    this.nextBellTime = null;
  }

  /**
   * Initialize the mode when timer starts
   * @param {TimerEngine} timer - Timer engine instance
   */
  onStart(timer) {
    this.bellCount = 0;
    
    if (!this.recurring) {
      this.completed.clear();
    }
    
    // Find next reminder
    this.#scheduleNextReminder(timer);
  }

  /**
   * Called when timer completes an interval
   * @param {TimerEngine} timer - Timer engine instance
   */
  onComplete(timer) {
    const now = Date.now();
    
    // Ring the bell
    this.#ringBell(this.bellType, now, this.nextReminderTime);
    this.bellCount++;
    
    // Mark as completed if not recurring
    if (!this.recurring && this.nextReminderTime) {
      this.completed.add(this.nextReminderTime);
    }
    
    // Schedule next reminder
    this.#scheduleNextReminder(timer);
  }

  /**
   * Schedule the next reminder
   * @private
   * @param {TimerEngine} timer - Timer engine instance
   */
  #scheduleNextReminder(timer) {
    const nextReminder = this.#findNextReminder();
    
    if (!nextReminder) {
      // No more reminders
      timer.stop();
      this.eventBus.dispatch(EVENTS.TIMER_STOP, {
        reason: 'No more reminders scheduled',
        bellCount: this.bellCount
      });
      return;
    }
    
    this.nextReminderTime = nextReminder.time;
    this.nextBellTime = nextReminder.timestamp;
    
    const interval = nextReminder.timestamp - Date.now();
    
    // Reset timer with interval to next reminder
    timer.reset(interval);
    timer.start();
  }

  /**
   * Find the next reminder time
   * @private
   * @returns {Object|null} Next reminder {time, timestamp} or null
   */
  #findNextReminder() {
    const now = new Date();
    const candidates = [];
    
    for (const time of this.times) {
      // Skip if already completed (for one-time reminders)
      if (!this.recurring && this.completed.has(time)) {
        continue;
      }
      
      const msUntil = timeUntilTime(time);
      const timestamp = now.getTime() + msUntil;
      
      candidates.push({
        time,
        timestamp,
        msUntil
      });
    }
    
    // Sort by timestamp and return earliest
    candidates.sort((a, b) => a.timestamp - b.timestamp);
    
    return candidates.length > 0 ? candidates[0] : null;
  }

  /**
   * Ring a bell
   * @private
   * @param {string} bellType - Type of bell to ring
   * @param {number} timestamp - Current timestamp
   * @param {string} reminderTime - The reminder time (HH:MM)
   */
  #ringBell(bellType, timestamp, reminderTime) {
    this.eventBus.dispatch(EVENTS.BELL_RING, {
      bellType,
      timestamp,
      mode: this.name,
      reminderTime,
      bellCount: this.bellCount
    });
  }

  /**
   * Get the next scheduled bell time
   * @returns {Object} Next bell info {time, reminderTime, interval}
   */
  getNextBell() {
    if (!this.nextBellTime) {
      const nextReminder = this.#findNextReminder();
      if (!nextReminder) {
        return null;
      }
      return {
        time: nextReminder.timestamp,
        reminderTime: nextReminder.time,
        interval: nextReminder.msUntil
      };
    }
    
    return {
      time: this.nextBellTime,
      reminderTime: this.nextReminderTime,
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
      times: [...this.times],
      recurring: this.recurring,
      bellType: this.bellType,
      bellCount: this.bellCount,
      completed: Array.from(this.completed),
      nextBell: this.getNextBell()
    };
  }

  /**
   * Reset mode state
   */
  reset() {
    this.bellCount = 0;
    this.completed.clear();
    this.nextReminderTime = null;
    this.nextBellTime = null;
  }

  /**
   * Get mode configuration
   * @returns {Object} Mode configuration
   */
  getConfig() {
    return {
      times: [...this.times],
      recurring: this.recurring,
      bellType: this.bellType
    };
  }

  /**
   * Update mode configuration
   * @param {Object} config - New configuration
   * @param {string[]} config.times - New reminder times
   * @param {boolean} config.recurring - Recurring setting
   * @param {string} config.bellType - Bell type
   */
  updateConfig(config) {
    if (config.times !== undefined) {
      const validation = validateReminderTimes(config.times);
      if (!validation.valid) {
        throw new Error(`Invalid reminder times: ${validation.errors.join(', ')}`);
      }
      this.times = [...config.times].sort();
    }
    
    if (config.recurring !== undefined) {
      this.recurring = config.recurring;
    }
    
    if (config.bellType !== undefined) {
      const validation = validateBellType(config.bellType);
      if (!validation.valid) {
        throw new Error(`Invalid bell type: ${validation.errors.join(', ')}`);
      }
      this.bellType = config.bellType;
    }
  }

  /**
   * Add a reminder time
   * @param {string} time - Time in HH:MM format
   */
  addReminder(time) {
    const validation = validateReminderTimes([time]);
    if (!validation.valid) {
      throw new Error(`Invalid reminder time: ${validation.errors.join(', ')}`);
    }
    
    if (!this.times.includes(time)) {
      this.times.push(time);
      this.times.sort();
    }
  }

  /**
   * Remove a reminder time
   * @param {string} time - Time in HH:MM format
   */
  removeReminder(time) {
    const index = this.times.indexOf(time);
    if (index > -1) {
      this.times.splice(index, 1);
      this.completed.delete(time);
    }
  }
}
