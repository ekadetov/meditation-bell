/**
 * Audio System - Main audio system integration
 * Coordinates all audio components and connects to timer engine
 * @module audio/AudioSystem
 */

import { eventBus } from '../core/EventBus.js';
import { EVENTS, BELL_TYPES } from '../config/constants.js';
import { audioContextManager } from './AudioContextManager.js';
import { audioPreloader } from './AudioPreloader.js';
import { AudioPlayer } from './AudioPlayer.js';
import { AudioScheduler } from './AudioScheduler.js';
import { VolumeController } from './VolumeController.js';

/**
 * Unified audio system that integrates all audio components
 */
export class AudioSystem {
  /**
   * Create an AudioSystem
   */
  constructor() {
    /** @private {AudioPlayer|null} */
    this.player = null;

    /** @private {AudioScheduler|null} */
    this.scheduler = null;

    /** @private {VolumeController|null} */
    this.volumeController = null;

    /** @private {boolean} */
    this.initialized = false;

    /** @private {boolean} */
    this.hasUserInteraction = false;

    /** @private {Array<Function>} */
    this.cleanupHandlers = [];
  }

  /**
   * Initialize the audio system
   * @param {Object} [options={}] - Initialization options
   * @param {boolean} [options.preload=true] - Whether to preload bells
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    if (this.initialized) {
      return;
    }

    const { preload = true } = options;

    try {
      // Initialize audio context
      await audioContextManager.initialize();
      
      // Initialize preloader
      await audioPreloader.initialize();

      // Create audio components
      const context = audioContextManager.getContext();
      this.player = new AudioPlayer(context);
      this.scheduler = new AudioScheduler(context);
      this.volumeController = new VolumeController(context);

      // Preload bell sounds if requested
      if (preload) {
        await audioPreloader.preload();
      }

      // Set up event listeners
      this._setupEventListeners();

      this.initialized = true;

      eventBus.dispatch(EVENTS.AUDIO_LOADED, {
        message: 'Audio system initialized successfully',
        hasPreloadedBells: preload
      });

    } catch (error) {
      console.error('Failed to initialize audio system:', error);
      eventBus.dispatch(EVENTS.AUDIO_ERROR, {
        message: 'Failed to initialize audio system',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Enable audio after user interaction
   * Required by browser autoplay policies
   * @returns {Promise<void>}
   */
  async enableAudio() {
    try {
      await audioContextManager.resume();
      this.hasUserInteraction = true;

      eventBus.dispatch(EVENTS.AUDIO_CONTEXT_READY, {
        message: 'Audio enabled after user interaction'
      });
    } catch (error) {
      console.error('Failed to enable audio:', error);
      eventBus.dispatch(EVENTS.AUDIO_ERROR, {
        message: 'Failed to enable audio',
        error: error.message
      });
    }
  }

  /**
   * Play a bell sound
   * @param {string} bellType - 'big' or 'small'
   * @param {Object} [options={}] - Playback options
   * @returns {Promise<void>}
   */
  async playBell(bellType, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Ensure audio is enabled
    if (!this.hasUserInteraction) {
      await this.enableAudio();
    }

    const volume = options.volume !== undefined 
      ? options.volume 
      : this.volumeController.getEffectiveVolume(bellType);

    await this.player.play(bellType, volume);
  }

  /**
   * Schedule a bell sound
   * @param {string} bellType - 'big' or 'small'
   * @param {number} delayMs - Delay in milliseconds
   * @param {Object} [options={}] - Scheduling options
   * @returns {number} Schedule ID
   */
  scheduleBell(bellType, delayMs, options = {}) {
    if (!this.initialized) {
      throw new Error('Audio system not initialized');
    }

    const volume = options.volume !== undefined 
      ? options.volume 
      : this.volumeController.getEffectiveVolume(bellType);

    return this.scheduler.schedule(bellType, delayMs, {
      ...options,
      volume
    });
  }

  /**
   * Cancel a scheduled bell
   * @param {number} scheduleId - Schedule ID
   * @returns {boolean}
   */
  cancelScheduledBell(scheduleId) {
    return this.scheduler ? this.scheduler.cancel(scheduleId) : false;
  }

  /**
   * Cancel all scheduled bells
   * @returns {number} Number canceled
   */
  cancelAllScheduledBells() {
    return this.scheduler ? this.scheduler.cancelAll() : 0;
  }

  /**
   * Stop currently playing bell
   */
  stopPlayback() {
    if (this.player) {
      this.player.stop();
    }
  }

  /**
   * Set master volume
   * @param {number} volume - Volume (0.0 to 1.0)
   * @param {number} [fadeDuration] - Fade duration
   */
  setMasterVolume(volume, fadeDuration) {
    if (this.volumeController) {
      this.volumeController.setMasterVolume(volume, fadeDuration);
    }
  }

  /**
   * Set volume for a bell type
   * @param {string} bellType - 'big' or 'small'
   * @param {number} volume - Volume (0.0 to 1.0)
   */
  setBellVolume(bellType, volume) {
    if (this.volumeController) {
      this.volumeController.setBellVolume(bellType, volume);
    }
  }

  /**
   * Mute audio
   * @param {number} [fadeDuration] - Fade duration
   */
  mute(fadeDuration) {
    if (this.volumeController) {
      this.volumeController.mute(fadeDuration);
    }
  }

  /**
   * Unmute audio
   * @param {number} [fadeDuration] - Fade duration
   */
  unmute(fadeDuration) {
    if (this.volumeController) {
      this.volumeController.unmute(fadeDuration);
    }
  }

  /**
   * Toggle mute
   * @param {number} [fadeDuration] - Fade duration
   */
  toggleMute(fadeDuration) {
    if (this.volumeController) {
      this.volumeController.toggleMute(fadeDuration);
    }
  }

  /**
   * Get audio system status
   * @returns {Object}
   */
  getStatus() {
    return {
      initialized: this.initialized,
      hasUserInteraction: this.hasUserInteraction,
      contextState: audioContextManager.getState(),
      preloaderState: audioPreloader.getState(),
      preloaderReady: audioPreloader.isReady(),
      isPlaying: this.player ? this.player.getIsPlaying() : false,
      scheduledCount: this.scheduler ? this.scheduler.getScheduledCount() : 0,
      volume: {
        master: this.volumeController ? this.volumeController.getMasterVolume() : 1.0,
        isMuted: this.volumeController ? this.volumeController.getIsMuted() : false
      }
    };
  }

  /**
   * Set up event listeners for timer integration
   * @private
   */
  _setupEventListeners() {
    // Listen for bell ring events from timer
    const unsubBellRing = eventBus.on(EVENTS.BELL_RING, async (data) => {
      const { bellType = BELL_TYPES.BIG } = data;
      try {
        await this.playBell(bellType);
      } catch (error) {
        console.error('Error playing bell from timer event:', error);
      }
    });

    this.cleanupHandlers.push(unsubBellRing);

    // Listen for timer complete events
    const unsubTimerComplete = eventBus.on(EVENTS.TIMER_COMPLETE, async (data) => {
      const { bellType = BELL_TYPES.BIG } = data;
      try {
        await this.playBell(bellType);
      } catch (error) {
        console.error('Error playing bell on timer complete:', error);
      }
    });

    this.cleanupHandlers.push(unsubTimerComplete);
  }

  /**
   * Cleanup and release resources
   */
  async cleanup() {
    // Unsubscribe from events
    this.cleanupHandlers.forEach(handler => handler());
    this.cleanupHandlers = [];

    // Stop and cleanup components
    if (this.player) {
      this.player.cleanup();
      this.player = null;
    }

    if (this.scheduler) {
      this.scheduler.cleanup();
      this.scheduler = null;
    }

    this.volumeController = null;

    audioPreloader.cleanup();
    await audioContextManager.close();

    this.initialized = false;
    this.hasUserInteraction = false;
  }
}

// Export singleton instance
export const audioSystem = new AudioSystem();
