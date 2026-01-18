/**
 * Random Mode - Rings bells at random intervals
 * @module core/modes/RandomMode
 */

import { eventBus } from '../EventBus.js';
import { EVENTS, BELL_TYPES, TIMER_MODES } from '../../config/constants.js';
import { minutesToMs } from '../../utils/time.js';
import { validateRandomConfig, validateBellType } from '../../utils/validation.js';

/**
 * RandomMode rings bells at unpredictable intervals within a specified range
 * Uses weighted randomness for more natural unpredictability
 * 
 * @example
 * const mode = new RandomMode({
 *   minInterval: 2,   // Minimum 2 minutes between bells
 *   maxInterval: 10,  // Maximum 10 minutes between bells
 *   bellType: 'random' // Randomly choose big or small bell
 * });
 */
export class RandomMode {
  /**
   * Creates a RandomMode instance
   * @param {Object} config - Mode configuration
   * @param {number} config.minInterval - Minimum interval in minutes
   * @param {number} config.maxInterval - Maximum interval in minutes
   * @param {string} config.bellType - Bell type ('big', 'small', or 'random')
   * @param {EventBus} config.eventBus - Event bus instance (optional)
   */
  constructor(config = {}) {
    const {
      minInterval = 2,
      maxInterval = 10,
      bellType = 'random',
      eventBus: customEventBus = null
    } = config;
    
    // Validate configuration
    const validation = validateRandomConfig({ minInterval, maxInterval });
    if (!validation.valid) {
      throw new Error(`Invalid random mode config: ${validation.errors.join(', ')}`);
    }
    
    if (bellType !== 'random') {
      const bellValidation = validateBellType(bellType);
      if (!bellValidation.valid) {
        throw new Error(`Invalid bell type: ${bellValidation.errors.join(', ')}`);
      }
    }
    
    /** @public {string} Mode name */
    this.name = TIMER_MODES.RANDOM;
    
    /** @private {number} Minimum interval in minutes */
    this.minInterval = minInterval;
    
    /** @private {number} Maximum interval in minutes */
    this.maxInterval = maxInterval;
    
    /** @private {string} Bell type preference */
    this.bellType = bellType;
    
    /** @private {EventBus} Event bus reference */
    this.eventBus = customEventBus || eventBus;
    
    /** @private {number} Bell counter */
    this.bellCount = 0;
    
    /** @private {number} Next bell time (ms) */
    this.nextBellTime = null;
    
    /** @private {number} Start time reference */
    this.startTime = null;
    
    /** @private {Array<number>} History of intervals for stats */
    this.intervalHistory = [];
  }

  /**
   * Initialize the mode when timer starts
   * @param {TimerEngine} timer - Timer engine instance
   */
  onStart(timer) {
    this.startTime = Date.now();
    this.bellCount = 0;
    this.intervalHistory = [];
    
    // Calculate first random interval
    const firstInterval = this.#generateRandomInterval();
    this.nextBellTime = this.startTime + firstInterval;
    
    // Start timer with first interval
    timer.reset(firstInterval);
    timer.start();
  }

  /**
   * Called when timer completes an interval
   * @param {TimerEngine} timer - Timer engine instance
   */
  onComplete(timer) {
    const now = Date.now();
    
    // Ring the bell
    const bellType = this.#selectBellType();
    this.#ringBell(bellType, now);
    this.bellCount++;
    
    // Generate next random interval
    const nextInterval = this.#generateRandomInterval();
    this.nextBellTime = now + nextInterval;
    
    // Reset timer with new interval
    timer.reset(nextInterval);
    timer.start();
  }

  /**
   * Generate a random interval using weighted distribution
   * Favors middle values for more natural randomness
   * @private
   * @returns {number} Random interval in milliseconds
   */
  #generateRandomInterval() {
    // Use triangular distribution for more natural randomness
    // This creates a bell-curve-like distribution favoring middle values
    const min = this.minInterval;
    const max = this.maxInterval;
    const mid = (min + max) / 2;
    
    // Generate two random numbers and average them (simple triangular distribution)
    const r1 = Math.random();
    const r2 = Math.random();
    const avg = (r1 + r2) / 2;
    
    // Map to interval range
    const intervalMinutes = min + (avg * (max - min));
    const intervalMs = minutesToMs(intervalMinutes);
    
    // Store in history
    this.intervalHistory.push(intervalMinutes);
    if (this.intervalHistory.length > 100) {
      this.intervalHistory.shift(); // Keep last 100
    }
    
    return intervalMs;
  }

  /**
   * Select which bell type to ring
   * @private
   * @returns {string} Bell type to ring
   */
  #selectBellType() {
    if (this.bellType === 'random') {
      // 50/50 chance between big and small
      return Math.random() < 0.5 ? BELL_TYPES.BIG : BELL_TYPES.SMALL;
    }
    return this.bellType;
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
      bellCount: this.bellCount
    });
  }

  /**
   * Get the next scheduled bell time
   * @returns {Object} Next bell info {time, interval}
   */
  getNextBell() {
    if (!this.nextBellTime) {
      return null;
    }
    
    return {
      time: this.nextBellTime,
      interval: this.nextBellTime - Date.now(),
      estimated: true // Flag that this is unpredictable
    };
  }

  /**
   * Get mode statistics
   * @returns {Object} Mode statistics
   */
  getStats() {
    const avgInterval = this.intervalHistory.length > 0
      ? this.intervalHistory.reduce((a, b) => a + b, 0) / this.intervalHistory.length
      : 0;
    
    return {
      mode: this.name,
      minInterval: this.minInterval,
      maxInterval: this.maxInterval,
      bellType: this.bellType,
      bellCount: this.bellCount,
      averageInterval: avgInterval,
      intervalHistory: [...this.intervalHistory],
      nextBell: this.getNextBell()
    };
  }

  /**
   * Reset mode state
   */
  reset() {
    this.bellCount = 0;
    this.nextBellTime = null;
    this.startTime = null;
    this.intervalHistory = [];
  }

  /**
   * Get mode configuration
   * @returns {Object} Mode configuration
   */
  getConfig() {
    return {
      minInterval: this.minInterval,
      maxInterval: this.maxInterval,
      bellType: this.bellType
    };
  }

  /**
   * Update mode configuration
   * @param {Object} config - New configuration
   * @param {number} config.minInterval - Minimum interval in minutes
   * @param {number} config.maxInterval - Maximum interval in minutes
   * @param {string} config.bellType - Bell type preference
   */
  updateConfig(config) {
    const newConfig = {
      minInterval: config.minInterval !== undefined ? config.minInterval : this.minInterval,
      maxInterval: config.maxInterval !== undefined ? config.maxInterval : this.maxInterval
    };
    
    const validation = validateRandomConfig(newConfig);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    
    if (config.minInterval !== undefined) {
      this.minInterval = config.minInterval;
    }
    
    if (config.maxInterval !== undefined) {
      this.maxInterval = config.maxInterval;
    }
    
    if (config.bellType !== undefined) {
      if (config.bellType !== 'random') {
        const bellValidation = validateBellType(config.bellType);
        if (!bellValidation.valid) {
          throw new Error(`Invalid bell type: ${bellValidation.errors.join(', ')}`);
        }
      }
      this.bellType = config.bellType;
    }
  }
}
