/**
 * Volume Controller - Manages volume with smooth transitions
 * Provides master volume, per-bell-type volume, and mute functionality
 * @module audio/VolumeController
 */

import { eventBus } from '../core/EventBus.js';
import { EVENTS, BELL_TYPES } from '../config/constants.js';
import { audioContextManager } from './AudioContextManager.js';

/**
 * Controls volume levels with smooth fade transitions
 */
export class VolumeController {
  /**
   * Create a VolumeController
   * @param {AudioContext} audioContext - The Web Audio API context
   */
  constructor(audioContext) {
    /** @private {AudioContext} */
    this.context = audioContext || audioContextManager.getContext();

    /** @private {number} Master volume (0.0 to 1.0) */
    this.masterVolume = 1.0;

    /** @private {Object} Per-bell-type volumes */
    this.bellVolumes = {
      [BELL_TYPES.BIG]: 0.8,
      [BELL_TYPES.SMALL]: 0.8
    };

    /** @private {boolean} Whether audio is muted */
    this.isMuted = false;

    /** @private {number} Volume before mute (for restore) */
    this.volumeBeforeMute = 1.0;

    /** @private {number} Default fade duration (seconds) */
    this.defaultFadeDuration = 0.2;
  }

  /**
   * Set master volume
   * @param {number} volume - Volume (0.0 to 1.0)
   * @param {number} [fadeDuration] - Fade duration in seconds
   */
  setMasterVolume(volume, fadeDuration) {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    const fadeTime = fadeDuration !== undefined ? fadeDuration : this.defaultFadeDuration;

    this.masterVolume = clampedVolume;

    // Update audio context master gain
    audioContextManager.setMasterVolume(
      this.isMuted ? 0 : clampedVolume,
      fadeTime
    );

    eventBus.dispatch(EVENTS.VOLUME_CHANGE, {
      type: 'master',
      volume: clampedVolume,
      isMuted: this.isMuted
    });
  }

  /**
   * Get master volume
   * @returns {number} Volume (0.0 to 1.0)
   */
  getMasterVolume() {
    return this.masterVolume;
  }

  /**
   * Set volume for a specific bell type
   * @param {string} bellType - 'big' or 'small'
   * @param {number} volume - Volume (0.0 to 1.0)
   */
  setBellVolume(bellType, volume) {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    if (this.bellVolumes.hasOwnProperty(bellType)) {
      this.bellVolumes[bellType] = clampedVolume;

      eventBus.dispatch(EVENTS.VOLUME_CHANGE, {
        type: 'bell',
        bellType,
        volume: clampedVolume
      });
    }
  }

  /**
   * Get volume for a specific bell type
   * @param {string} bellType - 'big' or 'small'
   * @returns {number} Volume (0.0 to 1.0)
   */
  getBellVolume(bellType) {
    return this.bellVolumes[bellType] || 0.8;
  }

  /**
   * Get effective volume for a bell (master * bell-type * mute)
   * @param {string} bellType - 'big' or 'small'
   * @returns {number} Effective volume (0.0 to 1.0)
   */
  getEffectiveVolume(bellType) {
    if (this.isMuted) {
      return 0;
    }

    const bellVolume = this.getBellVolume(bellType);
    return this.masterVolume * bellVolume;
  }

  /**
   * Mute audio
   * @param {number} [fadeDuration] - Fade duration in seconds
   */
  mute(fadeDuration) {
    if (this.isMuted) {
      return;
    }

    this.isMuted = true;
    this.volumeBeforeMute = this.masterVolume;

    const fadeTime = fadeDuration !== undefined ? fadeDuration : this.defaultFadeDuration;

    audioContextManager.setMasterVolume(0, fadeTime);

    eventBus.dispatch(EVENTS.MUTE_CHANGE, {
      isMuted: true,
      volumeBeforeMute: this.volumeBeforeMute
    });
  }

  /**
   * Unmute audio
   * @param {number} [fadeDuration] - Fade duration in seconds
   */
  unmute(fadeDuration) {
    if (!this.isMuted) {
      return;
    }

    this.isMuted = false;

    const fadeTime = fadeDuration !== undefined ? fadeDuration : this.defaultFadeDuration;

    audioContextManager.setMasterVolume(this.volumeBeforeMute, fadeTime);

    eventBus.dispatch(EVENTS.MUTE_CHANGE, {
      isMuted: false,
      restoredVolume: this.volumeBeforeMute
    });
  }

  /**
   * Toggle mute state
   * @param {number} [fadeDuration] - Fade duration in seconds
   */
  toggleMute(fadeDuration) {
    if (this.isMuted) {
      this.unmute(fadeDuration);
    } else {
      this.mute(fadeDuration);
    }
  }

  /**
   * Check if muted
   * @returns {boolean}
   */
  getIsMuted() {
    return this.isMuted;
  }

  /**
   * Fade in (from 0 to current master volume)
   * @param {number} [duration=0.5] - Fade duration in seconds
   * @returns {Promise<void>}
   */
  async fadeIn(duration = 0.5) {
    const targetVolume = this.masterVolume;

    // Set volume to 0 first
    audioContextManager.setMasterVolume(0, 0);

    // Unmute if muted
    if (this.isMuted) {
      this.isMuted = false;
    }

    // Fade to target
    audioContextManager.setMasterVolume(targetVolume, duration);

    // Wait for fade to complete
    return new Promise(resolve => {
      setTimeout(resolve, duration * 1000);
    });
  }

  /**
   * Fade out (from current to 0)
   * @param {number} [duration=0.5] - Fade duration in seconds
   * @param {boolean} [muteAfter=false] - Whether to mute after fade
   * @returns {Promise<void>}
   */
  async fadeOut(duration = 0.5, muteAfter = false) {
    audioContextManager.setMasterVolume(0, duration);

    // Wait for fade to complete
    await new Promise(resolve => {
      setTimeout(resolve, duration * 1000);
    });

    if (muteAfter) {
      this.isMuted = true;
    }
  }

  /**
   * Crossfade between two volumes
   * @param {number} fromVolume - Starting volume (0.0 to 1.0)
   * @param {number} toVolume - Ending volume (0.0 to 1.0)
   * @param {number} [duration=0.5] - Crossfade duration in seconds
   * @returns {Promise<void>}
   */
  async crossfade(fromVolume, toVolume, duration = 0.5) {
    const from = Math.max(0, Math.min(1, fromVolume));
    const to = Math.max(0, Math.min(1, toVolume));

    // Set starting volume
    audioContextManager.setMasterVolume(from, 0);
    this.masterVolume = from;

    // Fade to target
    audioContextManager.setMasterVolume(to, duration);
    this.masterVolume = to;

    // Wait for crossfade to complete
    return new Promise(resolve => {
      setTimeout(resolve, duration * 1000);
    });
  }

  /**
   * Set default fade duration
   * @param {number} duration - Duration in seconds
   */
  setDefaultFadeDuration(duration) {
    this.defaultFadeDuration = Math.max(0, duration);
  }

  /**
   * Get default fade duration
   * @returns {number} Duration in seconds
   */
  getDefaultFadeDuration() {
    return this.defaultFadeDuration;
  }

  /**
   * Reset all volumes to defaults
   * @param {Object} [defaults={}] - Default values
   */
  reset(defaults = {}) {
    this.masterVolume = defaults.master || 1.0;
    this.bellVolumes[BELL_TYPES.BIG] = defaults.bigBell || 0.8;
    this.bellVolumes[BELL_TYPES.SMALL] = defaults.smallBell || 0.8;
    this.isMuted = defaults.muted || false;

    audioContextManager.setMasterVolume(
      this.isMuted ? 0 : this.masterVolume,
      0
    );

    eventBus.dispatch(EVENTS.VOLUME_CHANGE, {
      type: 'reset',
      masterVolume: this.masterVolume,
      bellVolumes: { ...this.bellVolumes },
      isMuted: this.isMuted
    });
  }

  /**
   * Get all volume settings
   * @returns {Object} Volume settings
   */
  getSettings() {
    return {
      master: this.masterVolume,
      bigBell: this.bellVolumes[BELL_TYPES.BIG],
      smallBell: this.bellVolumes[BELL_TYPES.SMALL],
      isMuted: this.isMuted,
      defaultFadeDuration: this.defaultFadeDuration
    };
  }

  /**
   * Apply volume settings
   * @param {Object} settings - Volume settings to apply
   * @param {number} [fadeDuration] - Fade duration in seconds
   */
  applySettings(settings, fadeDuration) {
    if (settings.master !== undefined) {
      this.setMasterVolume(settings.master, fadeDuration);
    }

    if (settings.bigBell !== undefined) {
      this.setBellVolume(BELL_TYPES.BIG, settings.bigBell);
    }

    if (settings.smallBell !== undefined) {
      this.setBellVolume(BELL_TYPES.SMALL, settings.smallBell);
    }

    if (settings.isMuted !== undefined && settings.isMuted !== this.isMuted) {
      this.toggleMute(fadeDuration);
    }

    if (settings.defaultFadeDuration !== undefined) {
      this.setDefaultFadeDuration(settings.defaultFadeDuration);
    }
  }
}
