/**
 * Session Store - Manages meditation session history
 * @module storage/SessionStore
 */

import { storageManager } from './StorageManager.js';
import { eventBus } from '../core/EventBus.js';
import { EVENTS } from '../config/constants.js';

const STORE_NAME = 'sessions';
const DATA_RETENTION_DAYS = 90; // Default retention policy

/**
 * Generate UUID v4
 * @returns {string} UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Meditation Session data model
 * @typedef {Object} MeditationSession
 * @property {string} id - UUID
 * @property {number} startTime - Unix timestamp (ms)
 * @property {number} endTime - Unix timestamp (ms)
 * @property {number} duration - Seconds
 * @property {string} mode - 'periodic'|'random'|'hourly'|'reminder'
 * @property {Object} modeConfig - Mode-specific configuration
 * @property {number} bellsRung - Count of bells during session
 * @property {Object|null} moodPre - Pre-session mood {score: 1-10, emoji: string}
 * @property {Object|null} moodPost - Post-session mood
 * @property {number|null} moodDelta - moodPost.score - moodPre.score
 * @property {Object} context - Ambient context {timeOfDay, dayOfWeek, etc.}
 * @property {string|null} notes - Optional user notes
 * @property {Array<string>} tags - Optional tags
 */

/**
 * Session Store class
 * Manages meditation session history with querying and statistics
 */
export class SessionStore {
  constructor() {
    this.sessions = null;
    this.loadPromise = null;
  }

  /**
   * Initialize and load sessions
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._loadSessions();
    return this.loadPromise;
  }

  /**
   * Load sessions from storage
   * @private
   * @returns {Promise<void>}
   */
  async _loadSessions() {
    try {
      this.sessions = await storageManager.getAll(STORE_NAME);
      
      // Apply retention policy
      await this._applyRetentionPolicy();
      
      console.log(`✓ Loaded ${this.sessions.length} meditation sessions`);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      this.sessions = [];
    }
  }

  /**
   * Create a new meditation session
   * @param {Object} sessionData - Session data
   * @returns {Promise<MeditationSession>} Created session
   */
  async createSession(sessionData) {
    await this.initialize();

    const session = {
      id: generateUUID(),
      startTime: sessionData.startTime || Date.now(),
      endTime: sessionData.endTime || Date.now(),
      duration: sessionData.duration || 0,
      mode: sessionData.mode || 'periodic',
      modeConfig: sessionData.modeConfig || {},
      bellsRung: sessionData.bellsRung || 0,
      moodPre: sessionData.moodPre || null,
      moodPost: sessionData.moodPost || null,
      moodDelta: this._calculateMoodDelta(sessionData.moodPre, sessionData.moodPost),
      context: sessionData.context || this._createDefaultContext(),
      notes: sessionData.notes || null,
      tags: sessionData.tags || []
    };

    // Validate session
    this._validateSession(session);

    // Save to storage
    await storageManager.set(STORE_NAME, session);
    
    // Add to local cache
    this.sessions.push(session);

    // Emit event
    eventBus.dispatch(EVENTS.SESSION_SAVED, { session });

    return session;
  }

  /**
   * Get session by ID
   * @param {string} id - Session ID
   * @returns {Promise<MeditationSession|null>}
   */
  async getSession(id) {
    await this.initialize();
    return this.sessions.find(s => s.id === id) || null;
  }

  /**
   * Get all sessions
   * @returns {Promise<MeditationSession[]>}
   */
  async getAllSessions() {
    await this.initialize();
    return [...this.sessions];
  }

  /**
   * Query sessions with filter
   * @param {Object} options - Query options
   * @param {number} options.startDate - Start date (Unix timestamp)
   * @param {number} options.endDate - End date (Unix timestamp)
   * @param {string} options.mode - Filter by mode
   * @param {Function} options.filter - Custom filter function
   * @returns {Promise<MeditationSession[]>}
   */
  async querySessions(options = {}) {
    await this.initialize();

    let results = [...this.sessions];

    // Filter by date range
    if (options.startDate) {
      results = results.filter(s => s.startTime >= options.startDate);
    }
    if (options.endDate) {
      results = results.filter(s => s.startTime <= options.endDate);
    }

    // Filter by mode
    if (options.mode) {
      results = results.filter(s => s.mode === options.mode);
    }

    // Apply custom filter
    if (options.filter && typeof options.filter === 'function') {
      results = results.filter(options.filter);
    }

    return results;
  }

  /**
   * Get sessions for date range
   * @param {number} days - Number of days to look back
   * @returns {Promise<MeditationSession[]>}
   */
  async getRecentSessions(days = 30) {
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    return this.querySessions({ startDate });
  }

  /**
   * Update session (e.g., add post-session mood)
   * @param {string} id - Session ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<MeditationSession>}
   */
  async updateSession(id, updates) {
    await this.initialize();

    const index = this.sessions.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error(`Session ${id} not found`);
    }

    const session = { ...this.sessions[index], ...updates };
    
    // Recalculate mood delta if mood changed
    if (updates.moodPre || updates.moodPost) {
      session.moodDelta = this._calculateMoodDelta(session.moodPre, session.moodPost);
    }

    // Validate updated session
    this._validateSession(session);

    // Save to storage
    await storageManager.set(STORE_NAME, session);
    
    // Update local cache
    this.sessions[index] = session;

    return session;
  }

  /**
   * Delete session
   * @param {string} id - Session ID
   * @returns {Promise<void>}
   */
  async deleteSession(id) {
    await this.initialize();

    const index = this.sessions.findIndex(s => s.id === id);
    if (index !== -1) {
      await storageManager.delete(STORE_NAME, id);
      this.sessions.splice(index, 1);
      
      eventBus.dispatch(EVENTS.DATA_DELETED, { type: 'session', id });
    }
  }

  /**
   * Delete all sessions
   * @returns {Promise<void>}
   */
  async deleteAllSessions() {
    await this.initialize();
    
    await storageManager.clear(STORE_NAME);
    this.sessions = [];
    
    eventBus.dispatch(EVENTS.DATA_DELETED, { type: 'all_sessions' });
  }

  /**
   * Get statistics from sessions
   * @param {Object} options - Query options (same as querySessions)
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(options = {}) {
    const sessions = await this.querySessions(options);

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalMinutes: 0,
        totalHours: 0,
        averageDuration: 0,
        averageMoodDelta: 0,
        currentStreak: 0,
        longestStreak: 0,
        sessionsByMode: {},
        moodImprovementRate: 0
      };
    }

    // Calculate basic stats
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration / 60), 0);
    const avgDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;

    // Calculate mood stats
    const sessionsWithMood = sessions.filter(s => s.moodDelta !== null);
    const avgMoodDelta = sessionsWithMood.length > 0
      ? sessionsWithMood.reduce((sum, s) => sum + s.moodDelta, 0) / sessionsWithMood.length
      : 0;
    const moodImprovementRate = sessionsWithMood.length > 0
      ? sessionsWithMood.filter(s => s.moodDelta > 0).length / sessionsWithMood.length
      : 0;

    // Sessions by mode
    const sessionsByMode = sessions.reduce((acc, s) => {
      acc[s.mode] = (acc[s.mode] || 0) + 1;
      return acc;
    }, {});

    // Calculate streaks
    const { currentStreak, longestStreak } = this._calculateStreaks(sessions);

    return {
      totalSessions: sessions.length,
      totalMinutes: Math.round(totalMinutes),
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      averageDuration: Math.round(avgDuration),
      averageMoodDelta: Math.round(avgMoodDelta * 10) / 10,
      currentStreak,
      longestStreak,
      sessionsByMode,
      moodImprovementRate: Math.round(moodImprovementRate * 100)
    };
  }

  /**
   * Calculate mood delta
   * @private
   * @param {Object|null} moodPre 
   * @param {Object|null} moodPost 
   * @returns {number|null}
   */
  _calculateMoodDelta(moodPre, moodPost) {
    if (!moodPre || !moodPost) return null;
    if (typeof moodPre.score !== 'number' || typeof moodPost.score !== 'number') return null;
    return moodPost.score - moodPre.score;
  }

  /**
   * Create default context
   * @private
   * @returns {Object}
   */
  _createDefaultContext() {
    const now = new Date();
    return {
      timeOfDay: this._getTimeOfDay(now.getHours()),
      dayOfWeek: now.getDay(), // 0-6
      hour: now.getHours(),
      timestamp: Date.now()
    };
  }

  /**
   * Get time of day category
   * @private
   * @param {number} hour - 0-23
   * @returns {string}
   */
  _getTimeOfDay(hour) {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Validate session data
   * @private
   * @param {MeditationSession} session 
   * @throws {Error} If validation fails
   */
  _validateSession(session) {
    if (!session.id) throw new Error('Session must have an ID');
    if (!session.startTime) throw new Error('Session must have startTime');
    if (!session.endTime) throw new Error('Session must have endTime');
    if (session.endTime < session.startTime) throw new Error('endTime must be after startTime');
    if (session.duration < 0) throw new Error('Duration must be positive');
    
    const validModes = ['periodic', 'random', 'hourly', 'reminder'];
    if (!validModes.includes(session.mode)) {
      throw new Error(`Invalid mode: ${session.mode}`);
    }

    if (session.moodPre && (session.moodPre.score < 1 || session.moodPre.score > 10)) {
      throw new Error('Mood score must be between 1 and 10');
    }
    if (session.moodPost && (session.moodPost.score < 1 || session.moodPost.score > 10)) {
      throw new Error('Mood score must be between 1 and 10');
    }
  }

  /**
   * Calculate meditation streaks
   * @private
   * @param {MeditationSession[]} sessions 
   * @returns {Object} {currentStreak, longestStreak}
   */
  _calculateStreaks(sessions) {
    if (sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Sort sessions by start time
    const sorted = [...sessions].sort((a, b) => a.startTime - b.startTime);

    // Group sessions by day
    const dayMap = new Map();
    sorted.forEach(session => {
      const day = new Date(session.startTime).toDateString();
      if (!dayMap.has(day)) {
        dayMap.set(day, []);
      }
      dayMap.get(day).push(session);
    });

    const days = Array.from(dayMap.keys()).sort();
    
    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    for (let i = days.length - 1; i >= 0; i--) {
      const day = days[i];
      const expectedDay = i === days.length - 1 
        ? (day === today || day === yesterday ? day : null)
        : new Date(new Date(days[i + 1]).getTime() - 24 * 60 * 60 * 1000).toDateString();
      
      if (expectedDay === null) break;
      if (day !== expectedDay) break;
      
      currentStreak++;
    }

    // Calculate longest streak
    let longestStreak = 0;
    let streak = 1;
    
    for (let i = 1; i < days.length; i++) {
      const prevDate = new Date(days[i - 1]);
      const currDate = new Date(days[i]);
      const diffDays = Math.floor((currDate - prevDate) / (24 * 60 * 60 * 1000));
      
      if (diffDays === 1) {
        streak++;
      } else {
        longestStreak = Math.max(longestStreak, streak);
        streak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, streak);

    return { currentStreak, longestStreak };
  }

  /**
   * Apply data retention policy
   * Delete sessions older than retention period
   * @private
   * @param {number} retentionDays - Days to retain
   * @returns {Promise<void>}
   */
  async _applyRetentionPolicy(retentionDays = DATA_RETENTION_DAYS) {
    const cutoffDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    const toDelete = this.sessions.filter(s => s.startTime < cutoffDate);

    if (toDelete.length > 0) {
      console.log(`Applying retention policy: deleting ${toDelete.length} old sessions`);
      
      for (const session of toDelete) {
        await storageManager.delete(STORE_NAME, session.id);
      }

      this.sessions = this.sessions.filter(s => s.startTime >= cutoffDate);
    }
  }
}

// Export singleton instance
export const sessionStore = new SessionStore();
