/**
 * Audio Scheduler - Schedules bell sounds with sub-millisecond precision
 * Uses AudioContext.currentTime for accurate timing
 * @module audio/AudioScheduler
 */

import { eventBus } from '../core/EventBus.js';
import { EVENTS, BELL_TYPES, TIMING } from '../config/constants.js';
import { audioContextManager } from './AudioContextManager.js';
import { BellSynthesizer } from './BellSynthesizer.js';

/**
 * Schedules bell sounds with precise timing using Web Audio API
 */
export class AudioScheduler {
  /**
   * Create an AudioScheduler
   * @param {AudioContext} audioContext - The Web Audio API context
   * @param {GainNode} [destination=null] - Destination for scheduled bells
   */
  constructor(audioContext, destination = null) {
    /** @private {AudioContext} */
    this.context = audioContext || audioContextManager.getContext();

    /** @private {BellSynthesizer} */
    this.synthesizer = new BellSynthesizer(this.context);

    /** @private {GainNode} Destination node */
    this.destination = destination || audioContextManager.getMasterGain();

    /** @private {Map<number, Object>} Scheduled sounds by ID */
    this.scheduledSounds = new Map();

    /** @private {number} Next schedule ID */
    this.nextId = 0;

    /** @private {number|null} Scheduling check interval */
    this.checkInterval = null;

    /** @private {number} How far ahead to schedule (ms) */
    this.lookahead = TIMING.AUDIO_LOOKAHEAD || 100;

    /** @private {number} How often to check schedule (ms) */
    this.scheduleInterval = TIMING.AUDIO_SCHEDULE_INTERVAL || 25;

    /** @private {boolean} Whether scheduler is running */
    this.isRunning = false;

    /** @private {Array<Object>} Queue of bells to schedule */
    this.queue = [];
  }

  /**
   * Schedule a bell sound at a specific time
   * @param {string} bellType - 'big' or 'small'
   * @param {number} delayMs - Delay in milliseconds from now
   * @param {Object} [options={}] - Additional options
   * @param {number} [options.volume=1.0] - Volume (0.0 to 1.0)
   * @param {*} [options.metadata=null] - Custom metadata to attach
   * @returns {number} Schedule ID (use to cancel)
   */
  schedule(bellType, delayMs, options = {}) {
    const { volume = 1.0, metadata = null } = options;

    const id = this.nextId++;
    const scheduleTime = this.context.currentTime + (delayMs / 1000);

    const scheduleInfo = {
      id,
      bellType,
      scheduleTime,
      delayMs,
      volume,
      metadata,
      sound: null,
      isScheduled: false,
      isCanceled: false
    };

    this.scheduledSounds.set(id, scheduleInfo);

    // Add to queue for processing
    this.queue.push(scheduleInfo);
    this.queue.sort((a, b) => a.scheduleTime - b.scheduleTime);

    // Start scheduler if not running
    if (!this.isRunning) {
      this.start();
    }

    eventBus.dispatch(EVENTS.BELL_SCHEDULED, {
      id,
      bellType,
      scheduleTime,
      delayMs,
      metadata
    });

    return id;
  }

  /**
   * Schedule multiple bells in sequence
   * @param {Array<Object>} bells - Array of {bellType, delayMs, options}
   * @returns {Array<number>} Array of schedule IDs
   */
  scheduleSequence(bells) {
    return bells.map(({ bellType, delayMs, options }) =>
      this.schedule(bellType, delayMs, options)
    );
  }

  /**
   * Schedule a bell to repeat at regular intervals
   * @param {string} bellType - 'big' or 'small'
   * @param {number} intervalMs - Interval in milliseconds
   * @param {number} [count=Infinity] - Number of repetitions
   * @param {Object} [options={}] - Additional options
   * @returns {Array<number>} Array of schedule IDs
   */
  scheduleRepeating(bellType, intervalMs, count = Infinity, options = {}) {
    const scheduleIds = [];
    const actualCount = isFinite(count) ? count : 100; // Cap at 100 for safety

    for (let i = 0; i < actualCount; i++) {
      const delayMs = intervalMs * (i + 1);
      const id = this.schedule(bellType, delayMs, options);
      scheduleIds.push(id);
    }

    return scheduleIds;
  }

  /**
   * Cancel a scheduled sound
   * @param {number} scheduleId - ID returned from schedule()
   * @returns {boolean} Whether cancellation was successful
   */
  cancel(scheduleId) {
    const scheduled = this.scheduledSounds.get(scheduleId);
    
    if (!scheduled) {
      return false;
    }

    scheduled.isCanceled = true;

    // Stop and cleanup if already playing
    if (scheduled.sound) {
      this.synthesizer.stop(scheduled.sound);
      this.synthesizer.cleanup(scheduled.sound);
    }

    // Remove from queue
    this.queue = this.queue.filter(item => item.id !== scheduleId);

    this.scheduledSounds.delete(scheduleId);

    return true;
  }

  /**
   * Cancel all scheduled sounds
   * @returns {number} Number of sounds canceled
   */
  cancelAll() {
    const count = this.scheduledSounds.size;

    this.scheduledSounds.forEach((_, id) => this.cancel(id));
    this.queue = [];

    return count;
  }

  /**
   * Cancel all scheduled sounds of a specific type
   * @param {string} bellType - 'big' or 'small'
   * @returns {number} Number of sounds canceled
   */
  cancelType(bellType) {
    let count = 0;

    const idsToCancel = [];
    this.scheduledSounds.forEach((scheduled, id) => {
      if (scheduled.bellType === bellType) {
        idsToCancel.push(id);
      }
    });

    idsToCancel.forEach(id => {
      if (this.cancel(id)) {
        count++;
      }
    });

    return count;
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this._scheduleLoop();
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Get information about scheduled sounds
   * @returns {Array<Object>} Array of schedule info
   */
  getScheduled() {
    return Array.from(this.scheduledSounds.values()).map(scheduled => ({
      id: scheduled.id,
      bellType: scheduled.bellType,
      scheduleTime: scheduled.scheduleTime,
      delayMs: scheduled.delayMs,
      timeUntil: (scheduled.scheduleTime - this.context.currentTime) * 1000,
      isScheduled: scheduled.isScheduled,
      metadata: scheduled.metadata
    }));
  }

  /**
   * Get count of scheduled sounds
   * @returns {number}
   */
  getScheduledCount() {
    return this.scheduledSounds.size;
  }

  /**
   * Check if scheduler has pending sounds
   * @returns {boolean}
   */
  hasPending() {
    return this.scheduledSounds.size > 0;
  }

  /**
   * Main scheduling loop
   * @private
   */
  _scheduleLoop() {
    if (!this.isRunning) {
      return;
    }

    this.checkInterval = setInterval(() => {
      this._processQueue();
    }, this.scheduleInterval);
  }

  /**
   * Process the scheduling queue
   * @private
   */
  _processQueue() {
    const currentTime = this.context.currentTime;
    const lookaheadTime = currentTime + (this.lookahead / 1000);

    // Process all items that should be scheduled within lookahead window
    while (
      this.queue.length > 0 &&
      this.queue[0].scheduleTime <= lookaheadTime
    ) {
      const item = this.queue.shift();

      if (item.isCanceled) {
        continue;
      }

      this._scheduleSound(item);
    }

    // Stop scheduler if no more pending sounds
    if (this.queue.length === 0 && this.scheduledSounds.size === 0) {
      this.stop();
    }
  }

  /**
   * Actually schedule a sound to play
   * @private
   * @param {Object} scheduleInfo - Schedule information object
   */
  _scheduleSound(scheduleInfo) {
    try {
      // Create volume node for this bell
      const volumeNode = this.context.createGain();
      volumeNode.gain.setValueAtTime(scheduleInfo.volume, scheduleInfo.scheduleTime);
      volumeNode.connect(this.destination);

      // Create and schedule bell
      const sound = scheduleInfo.bellType === BELL_TYPES.BIG
        ? this.synthesizer.createBigBell(scheduleInfo.scheduleTime, volumeNode)
        : this.synthesizer.createSmallBell(scheduleInfo.scheduleTime, volumeNode);

      scheduleInfo.sound = sound;
      scheduleInfo.isScheduled = true;

      // Emit bell ring event at scheduled time
      const delay = (scheduleInfo.scheduleTime - this.context.currentTime) * 1000;
      setTimeout(() => {
        if (!scheduleInfo.isCanceled) {
          eventBus.dispatch(EVENTS.BELL_RING, {
            id: scheduleInfo.id,
            bellType: scheduleInfo.bellType,
            metadata: scheduleInfo.metadata
          });
        }
      }, Math.max(0, delay));

      // Schedule cleanup after bell ends
      const cleanupDelay = ((sound.endTime - this.context.currentTime) * 1000) + 100;
      setTimeout(() => {
        this._cleanupSound(scheduleInfo.id);
      }, Math.max(0, cleanupDelay));

    } catch (error) {
      console.error('Error scheduling sound:', error);
      eventBus.dispatch(EVENTS.AUDIO_ERROR, {
        message: 'Failed to schedule bell sound',
        error: error.message,
        scheduleId: scheduleInfo.id
      });

      // Remove failed schedule
      this.scheduledSounds.delete(scheduleInfo.id);
    }
  }

  /**
   * Cleanup a finished sound
   * @private
   * @param {number} scheduleId - Schedule ID
   */
  _cleanupSound(scheduleId) {
    const scheduled = this.scheduledSounds.get(scheduleId);
    
    if (scheduled && scheduled.sound) {
      this.synthesizer.cleanup(scheduled.sound);
    }

    this.scheduledSounds.delete(scheduleId);
  }

  /**
   * Cleanup all resources
   */
  cleanup() {
    this.stop();
    this.cancelAll();
    
    if (this.destination && this.destination !== audioContextManager.getMasterGain()) {
      this.destination.disconnect();
    }
  }
}
