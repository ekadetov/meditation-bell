/**
 * Audio Player - Manages bell sound playback with controls
 * Handles play, pause, stop, resume operations with progress tracking
 * @module audio/AudioPlayer
 */

import { eventBus } from '../core/EventBus.js';
import { EVENTS, BELL_TYPES } from '../config/constants.js';
import { audioContextManager } from './AudioContextManager.js';
import { BellSynthesizer } from './BellSynthesizer.js';

/**
 * Audio Player for bell sounds
 * Provides playback controls and progress tracking
 */
export class AudioPlayer {
  /**
   * Create an AudioPlayer
   * @param {AudioContext} audioContext - The Web Audio API context
   */
  constructor(audioContext) {
    /** @private {AudioContext} */
    this.context = audioContext || audioContextManager.getContext();

    /** @private {BellSynthesizer} */
    this.synthesizer = new BellSynthesizer(this.context);

    /** @private {Object|null} Currently playing bell sound */
    this.currentBell = null;

    /** @private {string|null} Current bell type */
    this.currentBellType = null;

    /** @private {boolean} Whether audio is currently playing */
    this.isPlaying = false;

    /** @private {boolean} Whether audio is paused */
    this.isPaused = false;

    /** @private {number} When the bell started playing (AudioContext time) */
    this.startTime = 0;

    /** @private {number} Pause offset in seconds */
    this.pauseOffset = 0;

    /** @private {number|null} Progress tracking interval ID */
    this.progressInterval = null;

    /** @private {number} Progress update interval in ms */
    this.progressUpdateInterval = 100;

    /** @private {GainNode} Volume control for player */
    this.volumeNode = this.context.createGain();
    this.volumeNode.connect(audioContextManager.getMasterGain() || this.context.destination);
    this.volumeNode.gain.setValueAtTime(1.0, this.context.currentTime);
  }

  /**
   * Play a bell sound
   * @param {string} bellType - 'big' or 'small'
   * @param {number} [volume=1.0] - Volume (0.0 to 1.0)
   * @returns {Promise<void>}
   */
  async play(bellType, volume = 1.0) {
    // Stop any currently playing bell
    if (this.isPlaying) {
      this.stop();
    }

    // Ensure audio context is running
    if (this.context.state === 'suspended') {
      await audioContextManager.resume();
    }

    try {
      this.currentBellType = bellType;
      this.startTime = this.context.currentTime;
      this.pauseOffset = 0;

      // Set volume
      this.setVolume(volume);

      // Create and play bell
      this.currentBell = bellType === BELL_TYPES.BIG
        ? this.synthesizer.createBigBell(this.startTime, this.volumeNode)
        : this.synthesizer.createSmallBell(this.startTime, this.volumeNode);

      this.isPlaying = true;
      this.isPaused = false;

      // Start progress tracking
      this._startProgressTracking();

      // Schedule end event
      this._scheduleEndEvent();

      // Emit started event
      eventBus.dispatch(EVENTS.AUDIO_STARTED, {
        bellType,
        duration: this.currentBell.duration,
        startTime: this.startTime
      });

    } catch (error) {
      console.error('Error playing bell:', error);
      eventBus.dispatch(EVENTS.AUDIO_ERROR, {
        message: 'Failed to play bell sound',
        error: error.message,
        bellType
      });
      throw error;
    }
  }

  /**
   * Pause the currently playing bell
   */
  pause() {
    if (!this.isPlaying || this.isPaused) {
      return;
    }

    this.isPaused = true;
    this.isPlaying = false;

    // Calculate pause offset
    this.pauseOffset = this.context.currentTime - this.startTime;

    // Stop the current bell
    if (this.currentBell) {
      this.synthesizer.stop(this.currentBell);
    }

    // Stop progress tracking
    this._stopProgressTracking();

    eventBus.dispatch(EVENTS.AUDIO_PAUSED, {
      bellType: this.currentBellType,
      pausedAt: this.pauseOffset,
      duration: this.currentBell?.duration || 0
    });
  }

  /**
   * Resume a paused bell
   * Note: Due to Web Audio API limitations, we restart from pause point
   */
  async resume() {
    if (!this.isPaused || !this.currentBellType) {
      return;
    }

    // Ensure audio context is running
    if (this.context.state === 'suspended') {
      await audioContextManager.resume();
    }

    // Restart the bell from pause point
    // Note: True pause/resume is complex with synthesized audio
    // This implementation restarts from the beginning
    // For better UX, consider using pre-rendered buffers
    await this.play(this.currentBellType);

    eventBus.dispatch(EVENTS.AUDIO_RESUMED, {
      bellType: this.currentBellType,
      resumedAt: this.pauseOffset
    });
  }

  /**
   * Stop the currently playing bell
   */
  stop() {
    if (!this.isPlaying && !this.isPaused) {
      return;
    }

    const bellType = this.currentBellType;

    // Stop the bell
    if (this.currentBell) {
      this.synthesizer.stop(this.currentBell);
      this.synthesizer.cleanup(this.currentBell);
      this.currentBell = null;
    }

    // Reset state
    this.isPlaying = false;
    this.isPaused = false;
    this.startTime = 0;
    this.pauseOffset = 0;
    this.currentBellType = null;

    // Stop progress tracking
    this._stopProgressTracking();

    eventBus.dispatch(EVENTS.AUDIO_STOPPED, {
      bellType
    });
  }

  /**
   * Set volume
   * @param {number} volume - Volume (0.0 to 1.0)
   * @param {number} [rampTime=0.01] - Fade duration in seconds
   */
  setVolume(volume, rampTime = 0.01) {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    const currentTime = this.context.currentTime;

    this.volumeNode.gain.cancelScheduledValues(currentTime);

    if (rampTime > 0) {
      this.volumeNode.gain.setValueAtTime(
        this.volumeNode.gain.value,
        currentTime
      );
      this.volumeNode.gain.linearRampToValueAtTime(
        clampedVolume,
        currentTime + rampTime
      );
    } else {
      this.volumeNode.gain.setValueAtTime(clampedVolume, currentTime);
    }

    eventBus.dispatch(EVENTS.VOLUME_CHANGE, {
      volume: clampedVolume,
      isMaster: false
    });
  }

  /**
   * Get current volume
   * @returns {number} Volume (0.0 to 1.0)
   */
  getVolume() {
    return this.volumeNode.gain.value;
  }

  /**
   * Get current playback progress
   * @returns {Object} Progress info {currentTime, duration, percentage}
   */
  getProgress() {
    if (!this.currentBell) {
      return {
        currentTime: 0,
        duration: 0,
        percentage: 0
      };
    }

    const currentTime = this.isPlaying
      ? this.context.currentTime - this.startTime
      : this.pauseOffset;

    const duration = this.currentBell.duration;
    const percentage = (currentTime / duration) * 100;

    return {
      currentTime: Math.min(currentTime, duration),
      duration,
      percentage: Math.min(percentage, 100)
    };
  }

  /**
   * Check if currently playing
   * @returns {boolean}
   */
  getIsPlaying() {
    return this.isPlaying;
  }

  /**
   * Check if paused
   * @returns {boolean}
   */
  getIsPaused() {
    return this.isPaused;
  }

  /**
   * Get current bell type
   * @returns {string|null}
   */
  getCurrentBellType() {
    return this.currentBellType;
  }

  /**
   * Start tracking playback progress
   * @private
   */
  _startProgressTracking() {
    this._stopProgressTracking(); // Clear any existing interval

    this.progressInterval = setInterval(() => {
      if (this.isPlaying) {
        const progress = this.getProgress();
        
        eventBus.dispatch(EVENTS.AUDIO_PROGRESS, {
          bellType: this.currentBellType,
          ...progress
        });

        // Auto-stop if we've exceeded duration
        if (progress.currentTime >= progress.duration) {
          this.stop();
        }
      }
    }, this.progressUpdateInterval);
  }

  /**
   * Stop tracking playback progress
   * @private
   */
  _stopProgressTracking() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Schedule the audio ended event
   * @private
   */
  _scheduleEndEvent() {
    if (!this.currentBell) {
      return;
    }

    const endTime = this.currentBell.endTime;
    const delay = (endTime - this.context.currentTime) * 1000;

    setTimeout(() => {
      if (this.isPlaying && this.currentBell) {
        this.stop();
        
        eventBus.dispatch(EVENTS.AUDIO_ENDED, {
          bellType: this.currentBellType,
          duration: this.currentBell.duration
        });
      }
    }, Math.max(0, delay));
  }

  /**
   * Cleanup and disconnect audio nodes
   */
  cleanup() {
    this.stop();
    
    if (this.volumeNode) {
      this.volumeNode.disconnect();
      this.volumeNode = null;
    }
  }
}
