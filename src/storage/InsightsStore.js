/**
 * Insights Store - Manages AI-generated insights
 * @module storage/InsightsStore
 */

import { storageManager } from './StorageManager.js';
import { eventBus } from '../core/EventBus.js';
import { EVENTS } from '../config/constants.js';

const STORE_NAME = 'insights';
const INSIGHT_EXPIRATION_DAYS = 30; // Insights expire after 30 days

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
 * AI Insight data model
 * @typedef {Object} AIInsight
 * @property {string} id - UUID
 * @property {string} type - 'pattern'|'suggestion'|'achievement'|'encouragement'
 * @property {string} category - Specific category (e.g., 'time_preference', 'streak')
 * @property {number} confidence - 0.0-1.0 confidence score
 * @property {string} title - Insight title
 * @property {string} message - Insight message
 * @property {Object} data - Supporting data
 * @property {number} createdAt - Creation timestamp
 * @property {number|null} expiresAt - Expiration timestamp (null = never expires)
 * @property {boolean} isRead - Whether user has seen this insight
 * @property {boolean} isDismissed - Whether user has dismissed this insight
 * @property {number|null} readAt - When insight was read
 */

/**
 * Insights Store class
 * Manages AI-generated insights with categorization and lifecycle management
 */
export class InsightsStore {
  constructor() {
    this.insights = null;
    this.loadPromise = null;
  }

  /**
   * Initialize and load insights
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._loadInsights();
    return this.loadPromise;
  }

  /**
   * Load insights from storage
   * @private
   * @returns {Promise<void>}
   */
  async _loadInsights() {
    try {
      this.insights = await storageManager.getAll(STORE_NAME);
      
      // Remove expired insights
      await this._cleanupExpired();
      
      console.log(`✓ Loaded ${this.insights.length} insights`);
    } catch (error) {
      console.error('Failed to load insights:', error);
      this.insights = [];
    }
  }

  /**
   * Create a new insight
   * @param {Object} insightData - Insight data
   * @returns {Promise<AIInsight>} Created insight
   */
  async createInsight(insightData) {
    await this.initialize();

    const insight = {
      id: generateUUID(),
      type: insightData.type || 'pattern',
      category: insightData.category || 'general',
      confidence: insightData.confidence || 0.8,
      title: insightData.title || 'Insight',
      message: insightData.message || '',
      data: insightData.data || {},
      createdAt: Date.now(),
      expiresAt: insightData.expiresAt || (Date.now() + INSIGHT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000),
      isRead: false,
      isDismissed: false,
      readAt: null
    };

    // Validate insight
    this._validateInsight(insight);

    // Check for duplicates
    if (await this._isDuplicate(insight)) {
      console.log('Duplicate insight detected, skipping');
      return null;
    }

    // Save to storage
    await storageManager.set(STORE_NAME, insight);
    
    // Add to local cache
    this.insights.push(insight);

    // Emit event
    eventBus.dispatch(EVENTS.INSIGHT_GENERATED, { insight });

    return insight;
  }

  /**
   * Get insight by ID
   * @param {string} id - Insight ID
   * @returns {Promise<AIInsight|null>}
   */
  async getInsight(id) {
    await this.initialize();
    return this.insights.find(i => i.id === id) || null;
  }

  /**
   * Get all insights
   * @param {Object} options - Filter options
   * @returns {Promise<AIInsight[]>}
   */
  async getAllInsights(options = {}) {
    await this.initialize();

    let results = [...this.insights];

    // Filter by type
    if (options.type) {
      results = results.filter(i => i.type === options.type);
    }

    // Filter by category
    if (options.category) {
      results = results.filter(i => i.category === options.category);
    }

    // Filter by read status
    if (options.isRead !== undefined) {
      results = results.filter(i => i.isRead === options.isRead);
    }

    // Filter by dismissed status
    if (options.isDismissed !== undefined) {
      results = results.filter(i => i.isDismissed === options.isDismissed);
    }

    // Filter active (not expired, not dismissed)
    if (options.activeOnly) {
      const now = Date.now();
      results = results.filter(i => 
        !i.isDismissed && 
        (!i.expiresAt || i.expiresAt > now)
      );
    }

    // Sort by creation date (newest first)
    results.sort((a, b) => b.createdAt - a.createdAt);

    return results;
  }

  /**
   * Get unread insights
   * @returns {Promise<AIInsight[]>}
   */
  async getUnreadInsights() {
    return this.getAllInsights({ isRead: false, isDismissed: false, activeOnly: true });
  }

  /**
   * Mark insight as read
   * @param {string} id - Insight ID
   * @returns {Promise<AIInsight>}
   */
  async markAsRead(id) {
    await this.initialize();

    const index = this.insights.findIndex(i => i.id === id);
    if (index === -1) {
      throw new Error(`Insight ${id} not found`);
    }

    const insight = {
      ...this.insights[index],
      isRead: true,
      readAt: Date.now()
    };

    await storageManager.set(STORE_NAME, insight);
    this.insights[index] = insight;

    return insight;
  }

  /**
   * Dismiss insight
   * @param {string} id - Insight ID
   * @returns {Promise<void>}
   */
  async dismissInsight(id) {
    await this.initialize();

    const index = this.insights.findIndex(i => i.id === id);
    if (index === -1) {
      throw new Error(`Insight ${id} not found`);
    }

    const insight = {
      ...this.insights[index],
      isDismissed: true
    };

    await storageManager.set(STORE_NAME, insight);
    this.insights[index] = insight;
  }

  /**
   * Delete insight
   * @param {string} id - Insight ID
   * @returns {Promise<void>}
   */
  async deleteInsight(id) {
    await this.initialize();

    const index = this.insights.findIndex(i => i.id === id);
    if (index !== -1) {
      await storageManager.delete(STORE_NAME, id);
      this.insights.splice(index, 1);
    }
  }

  /**
   * Delete all insights
   * @returns {Promise<void>}
   */
  async deleteAllInsights() {
    await this.initialize();
    
    await storageManager.clear(STORE_NAME);
    this.insights = [];
  }

  /**
   * Validate insight data
   * @private
   * @param {AIInsight} insight 
   * @throws {Error} If validation fails
   */
  _validateInsight(insight) {
    if (!insight.id) throw new Error('Insight must have an ID');
    if (!insight.type) throw new Error('Insight must have a type');
    if (!insight.title) throw new Error('Insight must have a title');
    if (!insight.message) throw new Error('Insight must have a message');
    
    const validTypes = ['pattern', 'suggestion', 'achievement', 'encouragement'];
    if (!validTypes.includes(insight.type)) {
      throw new Error(`Invalid insight type: ${insight.type}`);
    }

    if (insight.confidence < 0 || insight.confidence > 1) {
      throw new Error('Confidence must be between 0 and 1');
    }
  }

  /**
   * Check if insight is a duplicate
   * @private
   * @param {AIInsight} newInsight 
   * @returns {Promise<boolean>}
   */
  async _isDuplicate(newInsight) {
    // Check for same category within recent insights
    const recentCutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // Last 7 days
    
    const similar = this.insights.find(existing => 
      existing.category === newInsight.category &&
      existing.type === newInsight.type &&
      existing.createdAt > recentCutoff &&
      !existing.isDismissed
    );

    return !!similar;
  }

  /**
   * Clean up expired insights
   * @private
   * @returns {Promise<void>}
   */
  async _cleanupExpired() {
    const now = Date.now();
    const expired = this.insights.filter(i => i.expiresAt && i.expiresAt < now);

    if (expired.length > 0) {
      console.log(`Cleaning up ${expired.length} expired insights`);
      
      for (const insight of expired) {
        await storageManager.delete(STORE_NAME, insight.id);
      }

      this.insights = this.insights.filter(i => !i.expiresAt || i.expiresAt >= now);
    }
  }

  /**
   * Get insights statistics
   * @returns {Promise<Object>}
   */
  async getStatistics() {
    await this.initialize();

    const total = this.insights.length;
    const byType = this.insights.reduce((acc, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1;
      return acc;
    }, {});
    
    const byCategory = this.insights.reduce((acc, i) => {
      acc[i.category] = (acc[i.category] || 0) + 1;
      return acc;
    }, {});

    const unread = this.insights.filter(i => !i.isRead).length;
    const dismissed = this.insights.filter(i => i.isDismissed).length;
    const avgConfidence = total > 0
      ? this.insights.reduce((sum, i) => sum + i.confidence, 0) / total
      : 0;

    return {
      total,
      unread,
      dismissed,
      byType,
      byCategory,
      avgConfidence: Math.round(avgConfidence * 100) / 100
    };
  }
}

// Export singleton instance
export const insightsStore = new InsightsStore();
