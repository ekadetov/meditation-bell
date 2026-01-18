/**
 * Mood Tracker - Tracks user mood before and after meditation
 * @module ai/MoodTracker
 */

import { eventBus } from '../core/EventBus.js';
import { EVENTS } from '../config/constants.js';

/**
 * Mood emojis mapped to scores
 */
export const MOOD_EMOJIS = {
  1: '😫', // Very stressed/anxious
  2: '😟', // Stressed
  3: '😕', // Somewhat stressed
  4: '😐', // Neutral-negative
  5: '😶', // Neutral
  6: '🙂', // Slightly positive
  7: '😊', // Positive
  8: '😄', // Happy
  9: '😁', // Very happy
  10: '🤩' // Excellent/Peaceful
};

/**
 * Mood labels for scores
 */
export const MOOD_LABELS = {
  1: 'Very Stressed',
  2: 'Stressed',
  3: 'Somewhat Stressed',
  4: 'Neutral',
  5: 'Calm',
  6: 'Relaxed',
  7: 'Peaceful',
  8: 'Happy',
  9: 'Very Happy',
  10: 'Blissful'
};

/**
 * Mood Tracker class
 * Manages pre and post-session mood tracking
 */
export class MoodTracker {
  constructor() {
    this.currentSession = null;
    this.preMood = null;
    this.postMood = null;
  }

  /**
   * Start tracking a new session
   * @param {string} sessionId - Session ID
   */
  startSession(sessionId) {
    this.currentSession = sessionId;
    this.preMood = null;
    this.postMood = null;
  }

  /**
   * Record pre-session mood
   * @param {number} score - Mood score (1-10)
   * @param {string} method - 'emoji' or 'slider'
   * @returns {Object} Mood data
   */
  recordPreMood(score, method = 'slider') {
    if (!this.currentSession) {
      throw new Error('No active session. Call startSession() first.');
    }

    if (score < 1 || score > 10) {
      throw new Error('Mood score must be between 1 and 10');
    }

    this.preMood = {
      score: Math.round(score),
      emoji: MOOD_EMOJIS[Math.round(score)],
      label: MOOD_LABELS[Math.round(score)],
      method,
      timestamp: Date.now()
    };

    eventBus.dispatch(EVENTS.MOOD_TRACKED, {
      type: 'pre',
      mood: this.preMood,
      sessionId: this.currentSession
    });

    return this.preMood;
  }

  /**
   * Record post-session mood
   * @param {number} score - Mood score (1-10)
   * @param {string} method - 'emoji' or 'slider'
   * @returns {Object} Mood data with delta
   */
  recordPostMood(score, method = 'slider') {
    if (!this.currentSession) {
      throw new Error('No active session. Call startSession() first.');
    }

    if (score < 1 || score > 10) {
      throw new Error('Mood score must be between 1 and 10');
    }

    this.postMood = {
      score: Math.round(score),
      emoji: MOOD_EMOJIS[Math.round(score)],
      label: MOOD_LABELS[Math.round(score)],
      method,
      timestamp: Date.now()
    };

    // Calculate mood delta
    const delta = this.preMood 
      ? this.postMood.score - this.preMood.score 
      : null;

    const result = {
      ...this.postMood,
      delta
    };

    eventBus.dispatch(EVENTS.MOOD_TRACKED, {
      type: 'post',
      mood: result,
      sessionId: this.currentSession
    });

    return result;
  }

  /**
   * Get current mood data for session
   * @returns {Object} Mood data {pre, post, delta}
   */
  getCurrentMoodData() {
    return {
      preMood: this.preMood,
      postMood: this.postMood,
      moodDelta: this.getMoodDelta()
    };
  }

  /**
   * Get mood delta (improvement)
   * @returns {number|null} Mood change
   */
  getMoodDelta() {
    if (!this.preMood || !this.postMood) {
      return null;
    }
    return this.postMood.score - this.preMood.score;
  }

  /**
   * Get mood improvement percentage
   * @returns {number|null} Percentage improvement
   */
  getMoodImprovementPercent() {
    const delta = this.getMoodDelta();
    if (delta === null || !this.preMood) return null;
    
    // Calculate as percentage of possible improvement
    const possibleImprovement = 10 - this.preMood.score;
    if (possibleImprovement === 0) return 0;
    
    return Math.round((delta / possibleImprovement) * 100);
  }

  /**
   * Get mood improvement message
   * @returns {string|null} Human-readable message
   */
  getMoodImprovementMessage() {
    const delta = this.getMoodDelta();
    if (delta === null) return null;

    if (delta > 3) return 'Significant improvement! 🎉';
    if (delta > 1) return 'Nice improvement! 😊';
    if (delta === 1) return 'Slight improvement 🙂';
    if (delta === 0) return 'Mood stable';
    if (delta === -1) return 'Slight decrease';
    return 'Mood decreased';
  }

  /**
   * Reset session
   */
  endSession() {
    this.currentSession = null;
    this.preMood = null;
    this.postMood = null;
  }

  /**
   * Analyze mood patterns from historical data
   * @param {Array} sessions - Array of meditation sessions with mood data
   * @returns {Object} Mood analysis
   */
  analyzeMoodPatterns(sessions) {
    const sessionsWithMood = sessions.filter(s => 
      s.moodPre && s.moodPost && s.moodDelta !== null
    );

    if (sessionsWithMood.length === 0) {
      return {
        avgPreMood: 0,
        avgPostMood: 0,
        avgImprovement: 0,
        improvementRate: 0,
        bestTimeForImprovement: null
      };
    }

    // Calculate averages
    const avgPreMood = sessionsWithMood.reduce((sum, s) => 
      sum + s.moodPre.score, 0
    ) / sessionsWithMood.length;

    const avgPostMood = sessionsWithMood.reduce((sum, s) => 
      sum + s.moodPost.score, 0
    ) / sessionsWithMood.length;

    const avgImprovement = sessionsWithMood.reduce((sum, s) => 
      sum + s.moodDelta, 0
    ) / sessionsWithMood.length;

    const improvementRate = sessionsWithMood.filter(s => 
      s.moodDelta > 0
    ).length / sessionsWithMood.length;

    // Find best time for mood improvement
    const byTimeOfDay = sessionsWithMood.reduce((acc, s) => {
      const timeOfDay = s.context?.timeOfDay || 'unknown';
      if (!acc[timeOfDay]) {
        acc[timeOfDay] = [];
      }
      acc[timeOfDay].push(s.moodDelta);
      return acc;
    }, {});

    let bestTime = null;
    let bestAvgImprovement = -Infinity;

    for (const [timeOfDay, deltas] of Object.entries(byTimeOfDay)) {
      const avg = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
      if (avg > bestAvgImprovement) {
        bestAvgImprovement = avg;
        bestTime = timeOfDay;
      }
    }

    return {
      avgPreMood: Math.round(avgPreMood * 10) / 10,
      avgPostMood: Math.round(avgPostMood * 10) / 10,
      avgImprovement: Math.round(avgImprovement * 10) / 10,
      improvementRate: Math.round(improvementRate * 100),
      bestTimeForImprovement: bestTime,
      totalSessions: sessionsWithMood.length
    };
  }

  /**
   * Get emoji for score
   * @param {number} score - Mood score (1-10)
   * @returns {string} Emoji
   */
  static getEmojiForScore(score) {
    return MOOD_EMOJIS[Math.round(score)] || '😐';
  }

  /**
   * Get label for score
   * @param {number} score - Mood score (1-10)
   * @returns {string} Label
   */
  static getLabelForScore(score) {
    return MOOD_LABELS[Math.round(score)] || 'Neutral';
  }

  /**
   * Get score from emoji
   * @param {string} emoji - Emoji
   * @returns {number|null} Score
   */
  static getScoreFromEmoji(emoji) {
    for (const [score, e] of Object.entries(MOOD_EMOJIS)) {
      if (e === emoji) return parseInt(score);
    }
    return null;
  }
}

// Export singleton instance
export const moodTracker = new MoodTracker();
