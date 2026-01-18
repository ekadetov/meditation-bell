/**
 * SessionManager
 *
 * Manages meditation session lifecycle including mood tracking,
 * session saving, and insight generation.
 */

import { sessionStore, insightsStore, preferencesStore } from '../storage/index.js';
import { moodTracker, ambientDetector, patternDetector, insightGenerator } from '../ai/index.js';
import { eventBus } from './EventBus.js';
import { EVENTS } from '../config/constants.js';

export class SessionManager {
  constructor() {
    this.currentSessionId = null;
    this.sessionStartTime = null;
    this.sessionMode = null;
    this.sessionConfig = null;
    this.bellsRung = 0;
    this.sessionCount = 0;
  }

  /**
   * Start a new session with mood tracking
   * @param {string} mode - Session mode
   * @param {Object} config - Mode configuration
   * @returns {Promise<void>}
   */
  async startSession(mode, config) {
    this.currentSessionId = `session-${Date.now()}`;
    this.sessionStartTime = Date.now();
    this.sessionMode = mode;
    this.sessionConfig = config;
    this.bellsRung = 0;

    console.log('[SessionManager] Session started:', this.currentSessionId);

    // Check if tracking is enabled
    const prefs = await preferencesStore.getAll();
    const trackingEnabled = prefs?.privacy?.trackingEnabled !== false;

    if (trackingEnabled) {
      // Show pre-session mood modal
      this.showMoodModal('How are you feeling right now?', true);
    }
  }

  /**
   * End current session
   * @returns {Promise<void>}
   */
  async endSession() {
    if (!this.currentSessionId) return;

    console.log('[SessionManager] Session ending:', this.currentSessionId);

    // Check if tracking is enabled
    const prefs = await preferencesStore.getAll();
    const trackingEnabled = prefs?.privacy?.trackingEnabled !== false;

    if (trackingEnabled) {
      // Show post-session mood modal
      this.showMoodModal('How do you feel after your meditation?', false);
    } else {
      // Save session without mood tracking
      await this.saveSession();
    }
  }

  /**
   * Show mood check modal
   * @param {string} question - Question to ask
   * @param {boolean} isPreSession - Is this before the session?
   * @private
   */
  showMoodModal(question, isPreSession) {
    const modal = document.createElement('mood-check-modal');
    modal.setAttribute('question', question);

    modal.addEventListener('mood-selected', async (e) => {
      const { mood, emoji, label } = e.detail;
      console.log('[SessionManager] Mood selected:', mood, emoji, label);

      if (isPreSession) {
        // Record pre-session mood
        moodTracker.startSession(this.currentSessionId);
        moodTracker.recordPreMood(mood);
      } else {
        // Record post-session mood and save
        moodTracker.recordPostMood(mood);
        await this.saveSession();
      }
    });

    modal.addEventListener('mood-skipped', async () => {
      console.log('[SessionManager] Mood tracking skipped');

      if (!isPreSession) {
        // If skipped post-session, still save without mood
        await this.saveSession();
      }
    });

    document.body.appendChild(modal);
  }

  /**
   * Save session to storage
   * @private
   */
  async saveSession() {
    if (!this.currentSessionId) return;

    try {
      const duration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
      const context = ambientDetector.getCurrentContext();
      const moodData = moodTracker.getCurrentMoodData();

      const session = await sessionStore.createSession({
        startTime: this.sessionStartTime,
        endTime: Date.now(),
        duration,
        mode: this.sessionMode,
        modeConfig: this.sessionConfig,
        bellsRung: this.bellsRung,
        ...moodData,
        context
      });

      console.log('[SessionManager] Session saved:', session.id);

      // Increment session count and check for insight generation
      this.sessionCount++;
      if (this.sessionCount % 3 === 0) {
        await this.generateInsights();
      }

      // Reset session
      this.currentSessionId = null;
      this.sessionStartTime = null;
      this.sessionMode = null;
      this.sessionConfig = null;
      this.bellsRung = 0;

      // Dispatch event
      eventBus.dispatch(EVENTS.SESSION_SAVED, session);
    } catch (error) {
      console.error('[SessionManager] Failed to save session:', error);
    }
  }

  /**
   * Generate insights from patterns
   * @private
   */
  async generateInsights() {
    try {
      // Load all sessions for pattern analysis
      const sessions = await sessionStore.getAllSessions();
      patternDetector.loadSessions(sessions);
      const patterns = patternDetector.detectAll();

      // Generate insights
      const newInsights = insightGenerator.generateAll(patterns);

      // Save new insights
      for (const insight of newInsights) {
        try {
          await insightsStore.createInsight(insight);
          console.log('[SessionManager] Insight created:', insight.title);
          eventBus.dispatch(EVENTS.INSIGHT_GENERATED, insight);
        } catch (error) {
          // Insight might already exist (duplicate), continue
          console.log('[SessionManager] Insight skipped (duplicate):', insight.title);
        }
      }

      // Show insights if any were created
      if (newInsights.length > 0) {
        this.showInsightsDashboard();
      }
    } catch (error) {
      console.error('[SessionManager] Failed to generate insights:', error);
    }
  }

  /**
   * Show insights dashboard
   * @private
   */
  showInsightsDashboard() {
    // Create a notification or modal to show insights
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: linear-gradient(135deg, #2C5F7C 0%, #4A7C95 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      cursor: pointer;
      z-index: 1000;
      max-width: 300px;
      animation: slideInRight 0.3s ease-out;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="font-size: 2rem;">✨</div>
        <div>
          <strong style="display: block; margin-bottom: 0.5rem;">New Insights Available!</strong>
          <small>Click to view your personalized insights</small>
        </div>
      </div>
    `;

    notification.addEventListener('click', () => {
      notification.remove();
      // Navigate to insights view (handled by AppShell)
      eventBus.dispatch('SHOW_INSIGHTS', {});
    });

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  /**
   * Record a bell ring
   */
  recordBellRing() {
    this.bellsRung++;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
