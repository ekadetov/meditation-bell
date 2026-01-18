/**
 * AudioContext Manager - Singleton for managing Web Audio API context
 * Handles browser autoplay policies and provides master gain control
 * @module audio/AudioContextManager
 */

import { eventBus } from '../core/EventBus.js';
import { EVENTS, AUDIO_STATES } from '../config/constants.js';

/**
 * Singleton class for managing the Web Audio API AudioContext
 * Ensures only one AudioContext exists and handles lifecycle management
 */
export class AudioContextManager {
  /**
   * Private constructor - use getInstance() instead
   * @private
   */
  constructor() {
    if (AudioContextManager.instance) {
      return AudioContextManager.instance;
    }

    /** @private {AudioContext|null} The Web Audio API context */
    this.context = null;

    /** @private {GainNode|null} Master volume control */
    this.masterGain = null;

    /** @private {string} Current state of the audio context */
    this.state = AUDIO_STATES.IDLE;

    /** @private {boolean} Whether user interaction has occurred */
    this.hasUserInteraction = false;

    /** @private {Array<Function>} Callbacks waiting for context ready */
    this.readyCallbacks = [];

    AudioContextManager.instance = this;
  }

  /**
   * Get the singleton instance
   * @returns {AudioContextManager}
   */
  static getInstance() {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }

  /**
   * Initialize the AudioContext
   * Should be called early in application lifecycle
   * @returns {Promise<AudioContext>}
   */
  async initialize() {
    if (this.context) {
      return this.context;
    }

    try {
      // Create AudioContext (use webkitAudioContext for Safari compatibility)
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      
      if (!AudioContextClass) {
        throw new Error('Web Audio API is not supported in this browser');
      }

      this.context = new AudioContextClass();
      
      // Create master gain node
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.masterGain.gain.setValueAtTime(1.0, this.context.currentTime);

      // Update state
      this.state = this.context.state === 'running' 
        ? AUDIO_STATES.READY 
        : AUDIO_STATES.SUSPENDED;

      // Handle state changes
      this.context.addEventListener('statechange', () => {
        this._handleStateChange();
      });

      // Emit initialization event
      eventBus.dispatch(EVENTS.AUDIO_LOADED, {
        state: this.state,
        sampleRate: this.context.sampleRate,
        baseLatency: this.context.baseLatency
      });

      return this.context;
    } catch (error) {
      this.state = AUDIO_STATES.ERROR;
      eventBus.dispatch(EVENTS.AUDIO_ERROR, {
        message: 'Failed to initialize AudioContext',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Resume the AudioContext after user interaction
   * Required by browser autoplay policies
   * @returns {Promise<void>}
   */
  async resume() {
    if (!this.context) {
      await this.initialize();
    }

    if (this.context.state === 'suspended') {
      try {
        await this.context.resume();
        this.hasUserInteraction = true;
        this.state = AUDIO_STATES.READY;
        
        eventBus.dispatch(EVENTS.AUDIO_CONTEXT_READY, {
          state: this.state,
          currentTime: this.context.currentTime
        });

        // Execute queued callbacks
        this.readyCallbacks.forEach(callback => callback());
        this.readyCallbacks = [];
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
        eventBus.dispatch(EVENTS.AUDIO_ERROR, {
          message: 'Failed to resume AudioContext',
          error: error.message
        });
      }
    }
  }

  /**
   * Suspend the AudioContext to save resources
   * @returns {Promise<void>}
   */
  async suspend() {
    if (this.context && this.context.state === 'running') {
      try {
        await this.context.suspend();
        this.state = AUDIO_STATES.SUSPENDED;
        
        eventBus.dispatch(EVENTS.AUDIO_CONTEXT_SUSPENDED, {
          state: this.state
        });
      } catch (error) {
        console.error('Failed to suspend AudioContext:', error);
      }
    }
  }

  /**
   * Close the AudioContext and cleanup resources
   * @returns {Promise<void>}
   */
  async close() {
    if (this.context) {
      try {
        // Disconnect master gain
        if (this.masterGain) {
          this.masterGain.disconnect();
          this.masterGain = null;
        }

        await this.context.close();
        this.context = null;
        this.state = AUDIO_STATES.CLOSED;
        this.hasUserInteraction = false;
        this.readyCallbacks = [];
      } catch (error) {
        console.error('Failed to close AudioContext:', error);
      }
    }
  }

  /**
   * Get the AudioContext instance
   * @returns {AudioContext|null}
   */
  getContext() {
    return this.context;
  }

  /**
   * Get the master gain node
   * @returns {GainNode|null}
   */
  getMasterGain() {
    return this.masterGain;
  }

  /**
   * Get current audio context time (for precise scheduling)
   * @returns {number} Current time in seconds
   */
  getCurrentTime() {
    return this.context ? this.context.currentTime : 0;
  }

  /**
   * Get current state
   * @returns {string}
   */
  getState() {
    return this.state;
  }

  /**
   * Check if AudioContext is ready for playback
   * @returns {boolean}
   */
  isReady() {
    return this.context && this.state === AUDIO_STATES.READY;
  }

  /**
   * Wait for AudioContext to be ready
   * @returns {Promise<void>}
   */
  whenReady() {
    return new Promise((resolve) => {
      if (this.isReady()) {
        resolve();
      } else {
        this.readyCallbacks.push(resolve);
      }
    });
  }

  /**
   * Set master volume
   * @param {number} volume - Volume level (0.0 to 1.0)
   * @param {number} [rampTime=0.01] - Fade duration in seconds
   */
  setMasterVolume(volume, rampTime = 0.01) {
    if (!this.masterGain || !this.context) {
      return;
    }

    const clampedVolume = Math.max(0, Math.min(1, volume));
    const currentTime = this.context.currentTime;

    // Cancel any scheduled parameter changes
    this.masterGain.gain.cancelScheduledValues(currentTime);

    if (rampTime > 0) {
      this.masterGain.gain.setValueAtTime(
        this.masterGain.gain.value,
        currentTime
      );
      this.masterGain.gain.linearRampToValueAtTime(
        clampedVolume,
        currentTime + rampTime
      );
    } else {
      this.masterGain.gain.setValueAtTime(clampedVolume, currentTime);
    }

    eventBus.dispatch(EVENTS.VOLUME_CHANGE, {
      volume: clampedVolume,
      isMaster: true
    });
  }

  /**
   * Get current master volume
   * @returns {number} Volume level (0.0 to 1.0)
   */
  getMasterVolume() {
    return this.masterGain ? this.masterGain.gain.value : 0;
  }

  /**
   * Handle AudioContext state changes
   * @private
   */
  _handleStateChange() {
    if (!this.context) {
      return;
    }

    const oldState = this.state;
    
    switch (this.context.state) {
      case 'running':
        this.state = AUDIO_STATES.READY;
        break;
      case 'suspended':
        this.state = AUDIO_STATES.SUSPENDED;
        break;
      case 'closed':
        this.state = AUDIO_STATES.CLOSED;
        break;
    }

    // Emit event if state actually changed
    if (oldState !== this.state) {
      const eventName = this.state === AUDIO_STATES.READY
        ? EVENTS.AUDIO_CONTEXT_READY
        : EVENTS.AUDIO_CONTEXT_SUSPENDED;

      eventBus.dispatch(eventName, {
        oldState,
        newState: this.state,
        currentTime: this.context.currentTime
      });
    }
  }

  /**
   * Get audio context information for debugging
   * @returns {Object}
   */
  getDebugInfo() {
    if (!this.context) {
      return { initialized: false };
    }

    return {
      initialized: true,
      state: this.state,
      contextState: this.context.state,
      sampleRate: this.context.sampleRate,
      currentTime: this.context.currentTime,
      baseLatency: this.context.baseLatency,
      outputLatency: this.context.outputLatency,
      hasUserInteraction: this.hasUserInteraction,
      masterVolume: this.getMasterVolume()
    };
  }
}

// Export singleton instance
export const audioContextManager = AudioContextManager.getInstance();
