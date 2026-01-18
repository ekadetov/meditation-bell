/**
 * Audio Preloader - Pre-generates and caches bell sounds
 * Handles loading states and provides fallback for synthesis failures
 * @module audio/AudioPreloader
 */

import { eventBus } from '../core/EventBus.js';
import { EVENTS, BELL_TYPES, AUDIO_STATES } from '../config/constants.js';
import { audioContextManager } from './AudioContextManager.js';
import { BellSynthesizer } from './BellSynthesizer.js';

/**
 * Preloads and caches bell sounds for faster playback
 */
export class AudioPreloader {
  /**
   * Create an AudioPreloader
   */
  constructor() {
    /** @private {AudioContext|null} */
    this.context = null;

    /** @private {BellSynthesizer|null} */
    this.synthesizer = null;

    /** @private {Map<string, AudioBuffer>} Cached audio buffers */
    this.bufferCache = new Map();

    /** @private {string} Loading state */
    this.loadingState = AUDIO_STATES.IDLE;

    /** @private {Object} Loading progress */
    this.progress = {
      total: 0,
      loaded: 0,
      percentage: 0
    };

    /** @private {Array<string>} Bell types to preload */
    this.bellTypes = [BELL_TYPES.BIG, BELL_TYPES.SMALL];

    /** @private {Object|null} Error information */
    this.error = null;
  }

  /**
   * Initialize the audio preloader
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Initialize audio context
      this.context = await audioContextManager.initialize();
      this.synthesizer = new BellSynthesizer(this.context);

      this.loadingState = AUDIO_STATES.IDLE;
      
      eventBus.dispatch(EVENTS.AUDIO_LOADED, {
        state: this.loadingState,
        message: 'AudioPreloader initialized'
      });
    } catch (error) {
      this.loadingState = AUDIO_STATES.ERROR;
      this.error = {
        message: 'Failed to initialize AudioPreloader',
        error: error.message
      };

      eventBus.dispatch(EVENTS.AUDIO_ERROR, this.error);
      throw error;
    }
  }

  /**
   * Preload all bell sounds
   * @param {boolean} [force=false] - Force reload even if already loaded
   * @returns {Promise<void>}
   */
  async preload(force = false) {
    // Skip if already loaded (unless forcing)
    if (this.loadingState === AUDIO_STATES.READY && !force) {
      return;
    }

    // Skip if currently loading
    if (this.loadingState === AUDIO_STATES.LOADING) {
      return;
    }

    try {
      this.loadingState = AUDIO_STATES.LOADING;
      this.progress = {
        total: this.bellTypes.length,
        loaded: 0,
        percentage: 0
      };

      eventBus.dispatch(EVENTS.AUDIO_LOADING, {
        ...this.progress
      });

      // Clear existing cache if forcing reload
      if (force) {
        this.bufferCache.clear();
      }

      // Preload each bell type
      for (const bellType of this.bellTypes) {
        await this._preloadBell(bellType);
        
        this.progress.loaded++;
        this.progress.percentage = (this.progress.loaded / this.progress.total) * 100;

        eventBus.dispatch(EVENTS.AUDIO_LOADING, {
          ...this.progress,
          currentBell: bellType
        });
      }

      this.loadingState = AUDIO_STATES.READY;
      
      eventBus.dispatch(EVENTS.AUDIO_LOADED, {
        state: this.loadingState,
        buffers: Array.from(this.bufferCache.keys()),
        cacheSize: this.bufferCache.size
      });

    } catch (error) {
      this.loadingState = AUDIO_STATES.ERROR;
      this.error = {
        message: 'Failed to preload bell sounds',
        error: error.message
      };

      eventBus.dispatch(EVENTS.AUDIO_ERROR, this.error);
      throw error;
    }
  }

  /**
   * Preload a specific bell sound
   * @private
   * @param {string} bellType - 'big' or 'small'
   * @returns {Promise<AudioBuffer>}
   */
  async _preloadBell(bellType) {
    // Skip if already cached
    if (this.bufferCache.has(bellType)) {
      return this.bufferCache.get(bellType);
    }

    try {
      // Ensure we have context and synthesizer
      if (!this.context || !this.synthesizer) {
        await this.initialize();
      }

      // Render bell to buffer
      const buffer = await this.synthesizer.renderToBuffer(bellType);
      
      // Cache the buffer
      this.bufferCache.set(bellType, buffer);

      return buffer;
    } catch (error) {
      console.error(`Failed to preload ${bellType} bell:`, error);
      throw error;
    }
  }

  /**
   * Get a cached bell buffer
   * @param {string} bellType - 'big' or 'small'
   * @returns {AudioBuffer|null}
   */
  getBuffer(bellType) {
    return this.bufferCache.get(bellType) || null;
  }

  /**
   * Check if a bell buffer is cached
   * @param {string} bellType - 'big' or 'small'
   * @returns {boolean}
   */
  hasBuffer(bellType) {
    return this.bufferCache.has(bellType);
  }

  /**
   * Check if all bells are preloaded
   * @returns {boolean}
   */
  isReady() {
    return this.loadingState === AUDIO_STATES.READY &&
           this.bellTypes.every(type => this.bufferCache.has(type));
  }

  /**
   * Get loading state
   * @returns {string}
   */
  getState() {
    return this.loadingState;
  }

  /**
   * Get loading progress
   * @returns {Object}
   */
  getProgress() {
    return { ...this.progress };
  }

  /**
   * Get error information
   * @returns {Object|null}
   */
  getError() {
    return this.error ? { ...this.error } : null;
  }

  /**
   * Play a preloaded bell sound
   * @param {string} bellType - 'big' or 'small'
   * @param {GainNode} [destination=null] - Destination node
   * @param {number} [when=0] - When to play (AudioContext.currentTime)
   * @returns {AudioBufferSourceNode|null}
   */
  playBuffer(bellType, destination = null, when = 0) {
    const buffer = this.getBuffer(bellType);
    
    if (!buffer) {
      console.warn(`No buffer cached for ${bellType} bell`);
      return null;
    }

    if (!this.context) {
      console.error('AudioContext not initialized');
      return null;
    }

    try {
      const source = this.context.createBufferSource();
      source.buffer = buffer;

      const dest = destination || audioContextManager.getMasterGain() || this.context.destination;
      source.connect(dest);

      const startTime = when || this.context.currentTime;
      source.start(startTime);

      return source;
    } catch (error) {
      console.error('Failed to play buffer:', error);
      return null;
    }
  }

  /**
   * Clear the buffer cache
   * @param {string} [bellType=null] - Specific bell type to clear, or all if null
   */
  clearCache(bellType = null) {
    if (bellType) {
      this.bufferCache.delete(bellType);
    } else {
      this.bufferCache.clear();
    }

    if (this.bufferCache.size === 0) {
      this.loadingState = AUDIO_STATES.IDLE;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getCacheStats() {
    const stats = {
      cachedBells: Array.from(this.bufferCache.keys()),
      totalCached: this.bufferCache.size,
      totalSizeBytes: 0
    };

    this.bufferCache.forEach((buffer) => {
      // Rough estimate: channels * length * 4 bytes per sample (Float32)
      stats.totalSizeBytes += buffer.numberOfChannels * buffer.length * 4;
    });

    stats.totalSizeMB = (stats.totalSizeBytes / (1024 * 1024)).toFixed(2);

    return stats;
  }

  /**
   * Wait for preloading to complete
   * @param {number} [timeout=10000] - Timeout in milliseconds
   * @returns {Promise<void>}
   */
  async waitForReady(timeout = 10000) {
    if (this.isReady()) {
      return;
    }

    return new Promise((resolve, reject) => {
      const checkReady = () => {
        if (this.isReady()) {
          clearTimeout(timeoutId);
          resolve();
        } else if (this.loadingState === AUDIO_STATES.ERROR) {
          clearTimeout(timeoutId);
          reject(new Error(this.error?.message || 'Audio loading failed'));
        }
      };

      const timeoutId = setTimeout(() => {
        reject(new Error('Audio preload timeout'));
      }, timeout);

      // Check immediately
      checkReady();

      // Listen for loading events
      const unsubscribe = eventBus.on(EVENTS.AUDIO_LOADED, checkReady);

      // Cleanup listener on resolve/reject
      Promise.race([
        new Promise(r => setTimeout(r, timeout)),
        new Promise(r => { resolve = () => { unsubscribe(); r(); }; }),
        new Promise((_, r) => { reject = (e) => { unsubscribe(); r(e); }; })
      ]);
    });
  }

  /**
   * Cleanup and release resources
   */
  cleanup() {
    this.clearCache();
    this.synthesizer = null;
    this.context = null;
    this.loadingState = AUDIO_STATES.IDLE;
    this.error = null;
  }
}

// Export singleton instance
export const audioPreloader = new AudioPreloader();
