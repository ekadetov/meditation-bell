/**
 * Data Portability - Export/Import functionality
 * @module storage/DataPortability
 */

import { storageManager } from './StorageManager.js';
import { preferencesStore } from './PreferencesStore.js';
import { sessionStore } from './SessionStore.js';
import { insightsStore } from './InsightsStore.js';
import { eventBus } from '../core/EventBus.js';
import { EVENTS, APP_VERSION } from '../config/constants.js';

/**
 * Data Portability class
 * Handles data export and import in GDPR-compliant format
 */
export class DataPortability {
  /**
   * Export all user data to JSON
   * @returns {Promise<Object>} Exported data object
   */
  async exportData() {
    try {
      const [preferences, sessions, insights] = await Promise.all([
        preferencesStore.getAll(),
        sessionStore.getAllSessions(),
        insightsStore.getAllInsights()
      ]);

      const quota = await storageManager.getQuota();

      const exportData = {
        version: APP_VERSION,
        exportedAt: new Date().toISOString(),
        metadata: {
          totalSessions: sessions.length,
          totalInsights: insights.length,
          storageUsage: quota
        },
        preferences,
        sessions,
        insights
      };

      eventBus.dispatch(EVENTS.DATA_EXPORTED, {
        recordCount: sessions.length + insights.length + 1
      });

      return exportData;
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export data');
    }
  }

  /**
   * Export data as JSON file download
   * @returns {Promise<void>}
   */
  async exportToFile() {
    const data = await this.exportData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meditation-bell-data-${Date.now()}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Import data from JSON object
   * @param {Object} importData - Data to import
   * @param {Object} options - Import options
   * @param {boolean} options.merge - Merge with existing data (default: false)
   * @param {boolean} options.validateOnly - Only validate, don't import (default: false)
   * @returns {Promise<Object>} Import summary
   */
  async importData(importData, options = {}) {
    const { merge = false, validateOnly = false } = options;

    // Validate import data
    const validation = this._validateImportData(importData);
    if (!validation.valid) {
      throw new Error(`Invalid import data: ${validation.errors.join(', ')}`);
    }

    if (validateOnly) {
      return {
        valid: true,
        summary: this._generateImportSummary(importData)
      };
    }

    try {
      // If not merging, clear existing data first
      if (!merge) {
        await this._clearAllData();
      }

      // Import preferences
      if (importData.preferences) {
        await preferencesStore.import(JSON.stringify(importData.preferences));
      }

      // Import sessions
      let sessionsImported = 0;
      if (importData.sessions && Array.isArray(importData.sessions)) {
        for (const session of importData.sessions) {
          try {
            await sessionStore.createSession(session);
            sessionsImported++;
          } catch (error) {
            console.warn('Failed to import session:', session.id, error);
          }
        }
      }

      // Import insights
      let insightsImported = 0;
      if (importData.insights && Array.isArray(importData.insights)) {
        for (const insight of importData.insights) {
          try {
            await insightsStore.createInsight(insight);
            insightsImported++;
          } catch (error) {
            console.warn('Failed to import insight:', insight.id, error);
          }
        }
      }

      const summary = {
        success: true,
        preferencesImported: importData.preferences ? 1 : 0,
        sessionsImported,
        insightsImported,
        totalRecords: sessionsImported + insightsImported + (importData.preferences ? 1 : 0)
      };

      eventBus.dispatch(EVENTS.SESSION_LOADED, summary);

      return summary;
    } catch (error) {
      console.error('Import failed:', error);
      throw new Error('Failed to import data');
    }
  }

  /**
   * Import data from JSON file
   * @param {File} file - JSON file
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import summary
   */
  async importFromFile(file, options = {}) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const jsonString = event.target.result;
          const importData = JSON.parse(jsonString);
          const summary = await this.importData(importData, options);
          resolve(summary);
        } catch (error) {
          reject(new Error('Failed to parse import file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      reader.readAsText(file);
    });
  }

  /**
   * Validate import data structure
   * @private
   * @param {Object} data - Data to validate
   * @returns {Object} Validation result
   */
  _validateImportData(data) {
    const errors = [];

    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Data must be an object'] };
    }

    if (!data.version) {
      errors.push('Missing version field');
    }

    if (!data.exportedAt) {
      errors.push('Missing exportedAt field');
    }

    // Validate preferences
    if (data.preferences && typeof data.preferences !== 'object') {
      errors.push('Preferences must be an object');
    }

    // Validate sessions
    if (data.sessions) {
      if (!Array.isArray(data.sessions)) {
        errors.push('Sessions must be an array');
      } else {
        data.sessions.forEach((session, index) => {
          if (!session.id) errors.push(`Session ${index} missing id`);
          if (!session.startTime) errors.push(`Session ${index} missing startTime`);
          if (!session.mode) errors.push(`Session ${index} missing mode`);
        });
      }
    }

    // Validate insights
    if (data.insights) {
      if (!Array.isArray(data.insights)) {
        errors.push('Insights must be an array');
      } else {
        data.insights.forEach((insight, index) => {
          if (!insight.id) errors.push(`Insight ${index} missing id`);
          if (!insight.type) errors.push(`Insight ${index} missing type`);
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate import summary
   * @private
   * @param {Object} data - Import data
   * @returns {Object} Summary
   */
  _generateImportSummary(data) {
    return {
      version: data.version,
      exportedAt: data.exportedAt,
      preferencesCount: data.preferences ? 1 : 0,
      sessionsCount: data.sessions ? data.sessions.length : 0,
      insightsCount: data.insights ? data.insights.length : 0,
      totalRecords: (data.preferences ? 1 : 0) + 
                    (data.sessions ? data.sessions.length : 0) + 
                    (data.insights ? data.insights.length : 0)
    };
  }

  /**
   * Clear all data
   * @private
   * @returns {Promise<void>}
   */
  async _clearAllData() {
    await Promise.all([
      sessionStore.deleteAllSessions(),
      insightsStore.deleteAllInsights()
      // Note: We don't clear preferences as they're usually kept
    ]);
  }

  /**
   * Export sessions as CSV
   * @returns {Promise<string>} CSV string
   */
  async exportSessionsCSV() {
    const sessions = await sessionStore.getAllSessions();
    
    if (sessions.length === 0) {
      return 'No sessions to export';
    }

    // CSV header
    const headers = [
      'Date',
      'Start Time',
      'Duration (minutes)',
      'Mode',
      'Bells Rung',
      'Pre Mood',
      'Post Mood',
      'Mood Change',
      'Time of Day',
      'Notes'
    ];

    // CSV rows
    const rows = sessions.map(session => {
      const date = new Date(session.startTime);
      const duration = Math.round(session.duration / 60);
      
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        duration,
        session.mode,
        session.bellsRung,
        session.moodPre ? session.moodPre.score : '',
        session.moodPost ? session.moodPost.score : '',
        session.moodDelta !== null ? session.moodDelta : '',
        session.context?.timeOfDay || '',
        session.notes ? `"${session.notes.replace(/"/g, '""')}"` : ''
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Export sessions as CSV file download
   * @returns {Promise<void>}
   */
  async exportSessionsToCSV() {
    const csvString = await this.exportSessionsCSV();
    const blob = new Blob([csvString], { type: 'text/csv' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meditation-sessions-${Date.now()}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Get data statistics
   * @returns {Promise<Object>} Statistics
   */
  async getDataStatistics() {
    const [preferences, sessions, insights, quota] = await Promise.all([
      preferencesStore.getAll(),
      sessionStore.getAllSessions(),
      insightsStore.getAllInsights(),
      storageManager.getQuota()
    ]);

    const stats = await sessionStore.getStatistics();

    return {
      preferences: {
        exists: !!preferences,
        createdAt: preferences?.createdAt,
        updatedAt: preferences?.updatedAt
      },
      sessions: {
        total: sessions.length,
        totalMinutes: stats.totalMinutes,
        oldestSession: sessions.length > 0 ? sessions[0].startTime : null,
        newestSession: sessions.length > 0 ? sessions[sessions.length - 1].startTime : null
      },
      insights: {
        total: insights.length,
        unread: insights.filter(i => !i.isRead).length
      },
      storage: quota
    };
  }
}

// Export singleton instance
export const dataPortability = new DataPortability();
