/**
 * Bell Sound Synthesizer - Creates realistic meditation bell sounds
 * Uses Web Audio API to synthesize Big Bell and Small Bell sounds
 * @module audio/BellSynthesizer
 */

import { BELL_PARAMS, BELL_TYPES } from '../config/constants.js';

/**
 * Synthesizes realistic meditation bell sounds using Web Audio API
 * Creates complex tones with harmonics, ADSR envelopes, and reverb
 */
export class BellSynthesizer {
  /**
   * Create a BellSynthesizer
   * @param {AudioContext} audioContext - The Web Audio API context
   */
  constructor(audioContext) {
    if (!audioContext) {
      throw new Error('AudioContext is required');
    }

    /** @private {AudioContext} */
    this.context = audioContext;
  }

  /**
   * Create a big bell sound (deep, resonant, gong-like, ~47 seconds)
   * @param {number} [startTime=0] - When to start playing (AudioContext.currentTime)
   * @param {GainNode} [destination=null] - Destination node (defaults to context.destination)
   * @returns {Object} Bell sound object with oscillators, gain, and duration
   */
  createBigBell(startTime = 0, destination = null) {
    return this._createBell(BELL_PARAMS.BIG_BELL, startTime, destination);
  }

  /**
   * Create a small bell sound (lighter, brighter, crystal bowl, ~32 seconds)
   * @param {number} [startTime=0] - When to start playing (AudioContext.currentTime)
   * @param {GainNode} [destination=null] - Destination node (defaults to context.destination)
   * @returns {Object} Bell sound object with oscillators, gain, and duration
   */
  createSmallBell(startTime = 0, destination = null) {
    return this._createBell(BELL_PARAMS.SMALL_BELL, startTime, destination);
  }

  /**
   * Create a bell sound with specified parameters
   * @private
   * @param {Object} params - Bell parameters from BELL_PARAMS
   * @param {number} startTime - When to start (AudioContext.currentTime)
   * @param {GainNode|null} destination - Destination node
   * @returns {Object} Bell sound object
   */
  _createBell(params, startTime, destination) {
    const {
      fundamentalFreq,
      duration,
      harmonics,
      gains,
      attack,
      decay,
      sustain,
      release,
      reverbMix,
      reverbTime
    } = params;

    const actualStartTime = startTime || this.context.currentTime;
    const dest = destination || this.context.destination;

    // Create master gain for this bell
    const masterGain = this.context.createGain();
    masterGain.gain.setValueAtTime(0, actualStartTime);
    
    // Arrays to track all audio nodes for cleanup
    const oscillators = [];
    const gainNodes = [];
    const filters = [];

    // Create oscillators for each harmonic
    harmonics.forEach((harmonic, index) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      const filter = this.context.createBiquadFilter();

      // Set oscillator frequency and type
      osc.type = 'sine';
      osc.frequency.setValueAtTime(
        fundamentalFreq * harmonic,
        actualStartTime
      );

      // Add subtle frequency vibrato for realism
      const lfo = this.context.createOscillator();
      const lfoGain = this.context.createGain();
      lfo.frequency.setValueAtTime(4.5, actualStartTime);
      lfoGain.gain.setValueAtTime(0.5, actualStartTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(actualStartTime);
      lfo.stop(actualStartTime + duration);

      // Configure low-pass filter for warmth
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(
        fundamentalFreq * harmonic * 2,
        actualStartTime
      );
      filter.Q.setValueAtTime(1.0, actualStartTime);

      // ADSR envelope for this harmonic
      const harmonicGain = gains[index] || 0.1;
      
      // Attack
      gain.gain.setValueAtTime(0, actualStartTime);
      gain.gain.linearRampToValueAtTime(
        harmonicGain,
        actualStartTime + attack
      );

      // Decay
      gain.gain.exponentialRampToValueAtTime(
        harmonicGain * sustain,
        actualStartTime + attack + decay
      );

      // Sustain (hold at sustain level)
      gain.gain.exponentialRampToValueAtTime(
        harmonicGain * sustain * 0.5,
        actualStartTime + duration * 0.5
      );

      // Release (long decay tail)
      gain.gain.exponentialRampToValueAtTime(
        0.0001, // exponentialRamp needs value > 0
        actualStartTime + duration
      );

      // Connect audio graph: oscillator -> filter -> gain -> master
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      // Start and stop the oscillator
      osc.start(actualStartTime);
      osc.stop(actualStartTime + duration);

      // Track nodes for cleanup
      oscillators.push(osc);
      gainNodes.push(gain);
      filters.push(filter);
    });

    // Create reverb effect using delay network
    const reverbGain = this.context.createGain();
    reverbGain.gain.setValueAtTime(reverbMix, actualStartTime);

    const delay1 = this.context.createDelay(5.0);
    const delay2 = this.context.createDelay(5.0);
    const delay3 = this.context.createDelay(5.0);
    
    delay1.delayTime.setValueAtTime(reverbTime, actualStartTime);
    delay2.delayTime.setValueAtTime(reverbTime * 1.41, actualStartTime);
    delay3.delayTime.setValueAtTime(reverbTime * 1.73, actualStartTime);

    const feedback1 = this.context.createGain();
    const feedback2 = this.context.createGain();
    const feedback3 = this.context.createGain();
    
    feedback1.gain.setValueAtTime(0.4, actualStartTime);
    feedback2.gain.setValueAtTime(0.37, actualStartTime);
    feedback3.gain.setValueAtTime(0.33, actualStartTime);

    // Connect reverb network
    masterGain.connect(delay1);
    delay1.connect(feedback1);
    feedback1.connect(delay1); // Feedback loop
    delay1.connect(delay2);
    delay2.connect(feedback2);
    feedback2.connect(delay2); // Feedback loop
    delay2.connect(delay3);
    delay3.connect(feedback3);
    feedback3.connect(delay3); // Feedback loop
    
    // Mix reverb with dry signal
    masterGain.connect(reverbGain);
    delay1.connect(reverbGain);
    delay2.connect(reverbGain);
    delay3.connect(reverbGain);
    
    reverbGain.connect(dest);

    // Apply overall envelope to master gain
    masterGain.gain.linearRampToValueAtTime(1.0, actualStartTime + attack);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, actualStartTime + duration);

    return {
      type: params === BELL_PARAMS.BIG_BELL ? BELL_TYPES.BIG : BELL_TYPES.SMALL,
      oscillators,
      gainNodes,
      filters,
      masterGain,
      reverbGain,
      delays: [delay1, delay2, delay3],
      feedbacks: [feedback1, feedback2, feedback3],
      duration,
      startTime: actualStartTime,
      endTime: actualStartTime + duration
    };
  }

  /**
   * Stop a bell sound immediately
   * @param {Object} bellSound - Bell sound object from createBigBell/createSmallBell
   */
  stop(bellSound) {
    if (!bellSound) {
      return;
    }

    const now = this.context.currentTime;

    // Stop all oscillators
    if (bellSound.oscillators) {
      bellSound.oscillators.forEach(osc => {
        try {
          osc.stop(now);
        } catch (e) {
          // Oscillator may already be stopped
        }
      });
    }

    // Fade out master gain quickly
    if (bellSound.masterGain) {
      bellSound.masterGain.gain.cancelScheduledValues(now);
      bellSound.masterGain.gain.setValueAtTime(bellSound.masterGain.gain.value, now);
      bellSound.masterGain.gain.linearRampToValueAtTime(0, now + 0.1);
    }
  }

  /**
   * Create a bell sound and get an AudioBuffer for caching
   * Renders the bell sound offline for faster playback
   * @param {string} bellType - 'big' or 'small'
   * @returns {Promise<AudioBuffer>}
   */
  async renderToBuffer(bellType) {
    const params = bellType === BELL_TYPES.BIG 
      ? BELL_PARAMS.BIG_BELL 
      : BELL_PARAMS.SMALL_BELL;

    // Create offline context for rendering
    const offlineContext = new OfflineAudioContext(
      2, // stereo
      params.duration * this.context.sampleRate,
      this.context.sampleRate
    );

    // Create bell in offline context
    const tempSynth = new BellSynthesizer(offlineContext);
    const bellSound = bellType === BELL_TYPES.BIG
      ? tempSynth.createBigBell(0, offlineContext.destination)
      : tempSynth.createSmallBell(0, offlineContext.destination);

    // Render to buffer
    const buffer = await offlineContext.startRendering();
    
    // Cleanup
    this.stop(bellSound);

    return buffer;
  }

  /**
   * Cleanup and disconnect all audio nodes
   * @param {Object} bellSound - Bell sound object to cleanup
   */
  cleanup(bellSound) {
    if (!bellSound) {
      return;
    }

    // Disconnect all nodes
    [
      ...bellSound.oscillators,
      ...bellSound.gainNodes,
      ...bellSound.filters,
      ...bellSound.delays,
      ...bellSound.feedbacks,
      bellSound.masterGain,
      bellSound.reverbGain
    ].forEach(node => {
      if (node) {
        try {
          node.disconnect();
        } catch (e) {
          // Node may already be disconnected
        }
      }
    });
  }
}
