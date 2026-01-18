/**
 * Timer Engine with high-precision timing and drift compensation
 * @module core/TimerEngine
 */

import { eventBus } from './EventBus.js';
import { EVENTS, TIMER_STATES, TIMING } from '../config/constants.js';
import { performanceNow } from '../utils/time.js';

/**
 * TimerEngine class provides high-precision timing with drift compensation
 * Uses requestAnimationFrame for smooth, accurate timing
 * 
 * @fires TIMER_START - When timer starts
 * @fires TIMER_TICK - On each tick (configurable interval)
 * @fires TIMER_PAUSE - When timer is paused
 * @fires TIMER_RESUME - When timer resumes
 * @fires TIMER_STOP - When timer stops
 * @fires TIMER_COMPLETE - When timer completes an interval
 */
export class TimerEngine {
  /**
   * Creates a TimerEngine instance
   * @param {Object} options - Timer configuration
   * @param {number} options.interval - Timer interval in milliseconds
   * @param {Object} options.mode - Timer mode strategy (optional for base timer)
   * @param {EventBus} options.eventBus - Event bus instance (optional, uses global)
   */
  constructor(options = {}) {
    const { interval = 5000, mode = null, eventBus: customEventBus = null } = options;
    
    /** @private {number} Timer interval in milliseconds */
    this.interval = interval;
    
    /** @private {Object} Timer mode strategy */
    this.mode = mode;
    
    /** @private {EventBus} Event bus reference */
    this.eventBus = customEventBus || eventBus;
    
    /** @private {string} Current timer state */
    this.state = TIMER_STATES.IDLE;
    
    /** @private {number} Time when timer started (performance.now()) */
    this.startTime = null;
    
    /** @private {number} Expected time for next tick */
    this.expectedTime = null;
    
    /** @private {number} Accumulated elapsed time (for pause/resume) */
    this.elapsedTime = 0;
    
    /** @private {number} Time when timer was paused */
    this.pausedTime = null;
    
    /** @private {number} requestAnimationFrame ID */
    this.rafId = null;
    
    /** @private {number} Cumulative drift in milliseconds */
    this.totalDrift = 0;
    
    /** @private {number} Number of ticks */
    this.tickCount = 0;
    
    /** @private {number} Last tick time for tick interval control */
    this.lastTickTime = null;
    
    /** @private {number} Tick emission interval in ms */
    this.tickInterval = TIMING.TICK_INTERVAL;
  }

  /**
   * Start the timer
   * @param {number} customInterval - Optional custom interval (overrides default)
   * 
   * @example
   * timer.start();
   * timer.start(10000); // Start with 10 second interval
   */
  start(customInterval = null) {
    if (this.state === TIMER_STATES.RUNNING) {
      console.warn('[TimerEngine] Timer is already running');
      return;
    }
    
    if (customInterval !== null) {
      this.interval = customInterval;
    }
    
    // Reset state
    this.state = TIMER_STATES.RUNNING;
    this.startTime = performanceNow();
    this.expectedTime = this.startTime + this.interval;
    this.elapsedTime = 0;
    this.totalDrift = 0;
    this.tickCount = 0;
    this.lastTickTime = this.startTime;
    
    // Emit start event
    this.eventBus.dispatch(EVENTS.TIMER_START, {
      interval: this.interval,
      startTime: this.startTime,
      mode: this.mode?.name || 'basic'
    });
    
    // Begin tick loop
    this.#tick();
  }

  /**
   * Pause the timer
   * 
   * @example
   * timer.pause();
   */
  pause() {
    if (this.state !== TIMER_STATES.RUNNING) {
      console.warn('[TimerEngine] Timer is not running');
      return;
    }
    
    this.state = TIMER_STATES.PAUSED;
    this.pausedTime = performanceNow();
    
    // Cancel animation frame
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    // Emit pause event
    this.eventBus.dispatch(EVENTS.TIMER_PAUSE, {
      elapsedTime: this.elapsedTime,
      pausedAt: this.pausedTime
    });
  }

  /**
   * Resume the timer
   * 
   * @example
   * timer.resume();
   */
  resume() {
    if (this.state !== TIMER_STATES.PAUSED) {
      console.warn('[TimerEngine] Timer is not paused');
      return;
    }
    
    const now = performanceNow();
    const pauseDuration = now - this.pausedTime;
    
    // Adjust times to account for pause
    this.startTime += pauseDuration;
    this.expectedTime += pauseDuration;
    this.lastTickTime += pauseDuration;
    
    this.state = TIMER_STATES.RUNNING;
    this.pausedTime = null;
    
    // Emit resume event
    this.eventBus.dispatch(EVENTS.TIMER_RESUME, {
      pauseDuration,
      resumedAt: now
    });
    
    // Resume tick loop
    this.#tick();
  }

  /**
   * Stop the timer
   * 
   * @example
   * timer.stop();
   */
  stop() {
    if (this.state === TIMER_STATES.IDLE) {
      console.warn('[TimerEngine] Timer is already stopped');
      return;
    }
    
    const finalElapsed = this.state === TIMER_STATES.RUNNING
      ? performanceNow() - this.startTime
      : this.elapsedTime;
    
    this.state = TIMER_STATES.STOPPED;
    
    // Cancel animation frame
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    // Emit stop event
    this.eventBus.dispatch(EVENTS.TIMER_STOP, {
      elapsedTime: finalElapsed,
      totalDrift: this.totalDrift,
      tickCount: this.tickCount
    });
    
    // Reset to idle
    this.state = TIMER_STATES.IDLE;
    this.startTime = null;
    this.expectedTime = null;
    this.elapsedTime = 0;
    this.pausedTime = null;
    this.totalDrift = 0;
    this.tickCount = 0;
  }

  /**
   * Reset the timer to a specific interval
   * @param {number} newInterval - New interval in milliseconds
   * 
   * @example
   * timer.reset(30000); // Reset to 30 seconds
   */
  reset(newInterval = null) {
    const wasRunning = this.state === TIMER_STATES.RUNNING;
    
    this.stop();
    
    if (newInterval !== null) {
      this.interval = newInterval;
    }
    
    if (wasRunning) {
      this.start();
    }
  }

  /**
   * Get current timer status
   * @returns {Object} Timer status
   * 
   * @example
   * const status = timer.getStatus();
   * console.log(status.elapsedTime, status.drift);
   */
  getStatus() {
    const now = performanceNow();
    
    let currentElapsed = this.elapsedTime;
    if (this.state === TIMER_STATES.RUNNING && this.startTime !== null) {
      currentElapsed = now - this.startTime;
    }
    
    return {
      state: this.state,
      interval: this.interval,
      elapsedTime: currentElapsed,
      remainingTime: Math.max(0, this.interval - currentElapsed),
      totalDrift: this.totalDrift,
      averageDrift: this.tickCount > 0 ? this.totalDrift / this.tickCount : 0,
      tickCount: this.tickCount,
      isRunning: this.state === TIMER_STATES.RUNNING,
      isPaused: this.state === TIMER_STATES.PAUSED
    };
  }

  /**
   * Main tick loop using requestAnimationFrame
   * Implements drift compensation for accuracy
   * @private
   */
  #tick() {
    if (this.state !== TIMER_STATES.RUNNING) {
      return;
    }
    
    const now = performanceNow();
    this.elapsedTime = now - this.startTime;
    
    // Calculate drift (positive = ahead of schedule, negative = behind)
    const drift = now - this.expectedTime;
    this.totalDrift += Math.abs(drift);
    
    // Emit tick event at configured interval
    if (now - this.lastTickTime >= this.tickInterval) {
      this.tickCount++;
      this.lastTickTime = now;
      
      this.eventBus.dispatch(EVENTS.TIMER_TICK, {
        elapsedTime: this.elapsedTime,
        remainingTime: Math.max(0, this.interval - this.elapsedTime),
        drift,
        totalDrift: this.totalDrift,
        tickCount: this.tickCount
      });
    }
    
    // Check if interval is complete
    if (now >= this.expectedTime) {
      // Emit complete event
      this.eventBus.dispatch(EVENTS.TIMER_COMPLETE, {
        completedAt: now,
        drift,
        totalDrift: this.totalDrift
      });
      
      // If mode has a callback for completion, call it
      if (this.mode && typeof this.mode.onComplete === 'function') {
        this.mode.onComplete(this);
      } else {
        // Default behavior: restart with drift compensation
        this.expectedTime = now + this.interval - drift;
        this.startTime = now;
        this.elapsedTime = 0;
      }
    }
    
    // Schedule next tick
    this.rafId = requestAnimationFrame(() => this.#tick());
  }

  /**
   * Set timer mode strategy
   * @param {Object} mode - Timer mode strategy
   * 
   * @example
   * timer.setMode(new PeriodicMode({smallBellInterval: 5}));
   */
  setMode(mode) {
    this.mode = mode;
  }

  /**
   * Get current timer mode
   * @returns {Object} Timer mode strategy
   */
  getMode() {
    return this.mode;
  }

  /**
   * Check if timer is running
   * @returns {boolean} True if running
   */
  isRunning() {
    return this.state === TIMER_STATES.RUNNING;
  }

  /**
   * Check if timer is paused
   * @returns {boolean} True if paused
   */
  isPaused() {
    return this.state === TIMER_STATES.PAUSED;
  }

  /**
   * Check if timer is idle
   * @returns {boolean} True if idle
   */
  isIdle() {
    return this.state === TIMER_STATES.IDLE;
  }
}
