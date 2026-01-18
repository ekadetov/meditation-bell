/**
 * Periodic Mode - Rings bells at regular intervals
 * @module core/modes/PeriodicMode
 */

import { eventBus } from '../EventBus.js';
import { EVENTS, BELL_TYPES, TIMER_MODES } from '../../config/constants.js';
import { minutesToMs } from '../../utils/time.js';
import { validateInterval } from '../../utils/validation.js';

/**
 * PeriodicMode rings small bells at regular intervals
 * and optionally rings a big bell every N intervals
 * 
 * @example
 * const mode = new PeriodicMode({
 *   smallBellInterval: 5,  // Ring small bell every 5 minutes
 *   bigBellInterval: 15    // Ring big bell every 15 minutes
 * });
 */
export class PeriodicMode {
  /**
   * Creates a PeriodicMode instance
   * @param {Object} config - Mode configuration
   * @param {number} config.smallBellInterval - Small bell interval in minutes
   * @param {number} config.bigBellInterval - Big bell interval in minutes (0 = disabled)
   * @param {EventBus} config.eventBus - Event bus instance (optional)
   */
  constructor(config = {}) {
    const {
      smallBellInterval = 5,
      bigBellInterval = 0,
      eventBus: customEventBus = null
    } = config;
    
    // Validate intervals
    const smallValidation = validateInterval(smallBellInterval, 'periodic');
    if (!smallValidation.valid) {
      throw new Error(`Invalid small bell interval: ${smallValidation.errors.join(', ')}`);
    }
    
    if (bigBellInterval > 0) {
      const bigValidation = validateInterval(bigBellInterval, 'periodic');
      if (!bigValidation.valid) {
        throw new Error(`Invalid big bell interval: ${bigValidation.errors.join(', ')}`);
      }
      
      if (bigBellInterval <= smallBellInterval) {
        throw new Error('Big bell interval must be greater than small bell interval');
      }
    }
    
    /** @public {string} Mode name */
    this.name = TIMER_MODES.PERIODIC;
    
    /** @private {number} Small bell interval in minutes */
    this.smallBellInterval = smallBellInterval;
    
    /** @private {number} Big bell interval in minutes */
    this.bigBellInterval = bigBellInterval;
    
    /** @private {EventBus} Event bus reference */
    this.eventBus = customEventBus || eventBus;
    
    /** @private {number} Small bell counter */
    this.smallBellCount = 0;
    
    /** @private {number} Big bell counter */
    this.bigBellCount = 0;
    
    /** @private {number} Next small bell time (ms) */
    this.nextSmallBellTime = null;
    
    /** @private {number} Next big bell time (ms) */
    this.nextBigBellTime = null;
    
    /** @private {number} Start time reference */
    this.startTime = null;
  }

  /**
   * Initialize the mode when timer starts
   * @param {TimerEngine} timer - Timer engine instance
   */
  onStart(timer) {
    this.startTime = Date.now();
    this.smallBellCount = 0;
    this.bigBellCount = 0;
    
    // Calculate next bell times
    this.nextSmallBellTime = this.startTime + minutesToMs(this.smallBellInterval);
    
    if (this.bigBellInterval > 0) {
      this.nextBigBellTime = this.startTime + minutesToMs(this.bigBellInterval);
    }
    
    // Schedule the first bell check
    this.#scheduleNextCheck(timer);
  }

  /**
   * Called when timer completes an interval
   * @param {TimerEngine} timer - Timer engine instance
   */
  onComplete(timer) {
    const now = Date.now();
    
    // Determine which bell(s) to ring
    const shouldRingBig = this.bigBellInterval > 0 && now >= this.nextBigBellTime;
    const shouldRingSmall = !shouldRingBig && now >= this.nextSmallBellTime;
    
    if (shouldRingBig) {
      this.#ringBell(BELL_TYPES.BIG, now);
      this.bigBellCount++;
      
      // Update next big bell time
      this.nextBigBellTime = now + minutesToMs(this.bigBellInterval);
      
      // Also update small bell time to sync with big bell
      this.nextSmallBellTime = now + minutesToMs(this.smallBellInterval);
    } else if (shouldRingSmall) {
      this.#ringBell(BELL_TYPES.SMALL, now);
      this.smallBellCount++;
      
      // Update next small bell time
      this.nextSmallBellTime = now + minutesToMs(this.smallBellInterval);
    }
    
    // Schedule next check
    this.#scheduleNextCheck(timer);
  }

  /**
   * Schedule the next bell check
   * @private
   * @param {TimerEngine} timer - Timer engine instance
   */
  #scheduleNextCheck(timer) {
    // Determine next bell time
    let nextBellTime = this.nextSmallBellTime;
    
    if (this.bigBellInterval > 0 && this.nextBigBellTime < nextBellTime) {
      nextBellTime = this.nextBigBellTime;
    }
    
    const now = Date.now();
    const interval = Math.max(0, nextBellTime - now);
    
    // Reset timer with new interval
    timer.reset(interval);
    timer.start();
  }

  /**
   * Ring a bell
   * @private
   * @param {string} bellType - Type of bell to ring
   * @param {number} timestamp - Current timestamp
   */
  #ringBell(bellType, timestamp) {
    this.eventBus.dispatch(EVENTS.BELL_RING, {
      bellType,
      timestamp,
      mode: this.name,
      smallBellCount: this.smallBellCount,
      bigBellCount: this.bigBellCount
    });
  }

  /**
   * Get the next scheduled bell time
   * @returns {Object} Next bell info {time, type, interval}
   */
  getNextBell() {
    if (!this.nextSmallBellTime) {
      return null;
    }
    
    let nextTime = this.nextSmallBellTime;
    let nextType = BELL_TYPES.SMALL;
    
    if (this.bigBellInterval > 0 && this.nextBigBellTime < nextTime) {
      nextTime = this.nextBigBellTime;
      nextType = BELL_TYPES.BIG;
    }
    
    return {
      time: nextTime,
      type: nextType,
      interval: nextTime - Date.now()
    };
  }

  /**
   * Get mode statistics
   * @returns {Object} Mode statistics
   */
  getStats() {
    return {
      mode: this.name,
      smallBellInterval: this.smallBellInterval,
      bigBellInterval: this.bigBellInterval,
      smallBellCount: this.smallBellCount,
      bigBellCount: this.bigBellCount,
      totalBells: this.smallBellCount + this.bigBellCount,
      nextBell: this.getNextBell()
    };
  }

  /**
   * Reset mode state
   */
  reset() {
    this.smallBellCount = 0;
    this.bigBellCount = 0;
    this.nextSmallBellTime = null;
    this.nextBigBellTime = null;
    this.startTime = null;
  }

  /**
   * Get mode configuration
   * @returns {Object} Mode configuration
   */
  getConfig() {
    return {
      smallBellInterval: this.smallBellInterval,
      bigBellInterval: this.bigBellInterval
    };
  }

  /**
   * Update mode configuration
   * @param {Object} config - New configuration
   * @param {number} config.smallBellInterval - Small bell interval in minutes
   * @param {number} config.bigBellInterval - Big bell interval in minutes
   */
  updateConfig(config) {
    if (config.smallBellInterval !== undefined) {
      const validation = validateInterval(config.smallBellInterval, 'periodic');
      if (!validation.valid) {
        throw new Error(`Invalid small bell interval: ${validation.errors.join(', ')}`);
      }
      this.smallBellInterval = config.smallBellInterval;
    }
    
    if (config.bigBellInterval !== undefined) {
      if (config.bigBellInterval > 0) {
        const validation = validateInterval(config.bigBellInterval, 'periodic');
        if (!validation.valid) {
          throw new Error(`Invalid big bell interval: ${validation.errors.join(', ')}`);
        }
      }
      this.bigBellInterval = config.bigBellInterval;
    }
    
    // Validate big > small if both are set
    if (this.bigBellInterval > 0 && this.bigBellInterval <= this.smallBellInterval) {
      throw new Error('Big bell interval must be greater than small bell interval');
    }
  }
}
