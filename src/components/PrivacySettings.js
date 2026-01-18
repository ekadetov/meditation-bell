/**
 * PrivacySettings Component
 * 
 * Provides GDPR-compliant privacy controls for user data.
 * Includes data collection toggles, retention settings, export, and deletion.
 */

import { preferencesStore } from '../storage/PreferencesStore.js';
import { dataPortability } from '../storage/DataPortability.js';
import { storageManager } from '../storage/StorageManager.js';

export class PrivacySettings extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.preferences = null;
    this.stats = null;
  }

  async connectedCallback() {
    await this.loadPreferences();
    await this.loadStats();
    this.render();
    this.setupEventListeners();
  }

  /**
   * Load preferences
   * @private
   */
  async loadPreferences() {
    try {
      const prefs = await preferencesStore.getAll();
      this.preferences = prefs?.privacy || {
        trackingEnabled: true,
        dataRetentionDays: 365
      };
    } catch (error) {
      console.error('[PrivacySettings] Failed to load preferences:', error);
      this.preferences = {
        trackingEnabled: true,
        dataRetentionDays: 365
      };
    }
  }

  /**
   * Load data statistics
   * @private
   */
  async loadStats() {
    try {
      this.stats = await dataPortability.getDataStatistics();
    } catch (error) {
      console.error('[PrivacySettings] Failed to load stats:', error);
    }
  }

  /**
   * Setup event listeners
   * @private
   */
  setupEventListeners() {
    this.shadowRoot.addEventListener('change', async (e) => {
      const target = e.target;
      
      // Tracking toggle
      if (target.id === 'tracking-toggle') {
        await this.updateTracking(target.checked);
      }
      
      // Retention select
      if (target.id === 'retention-select') {
        await this.updateRetention(parseInt(target.value, 10));
      }
    });
    
    this.shadowRoot.addEventListener('click', async (e) => {
      const target = e.target;
      
      // Export data button
      if (target.classList.contains('export-data-btn')) {
        await this.exportData();
      }
      
      // Export CSV button
      if (target.classList.contains('export-csv-btn')) {
        await this.exportCSV();
      }
      
      // Delete all data button
      if (target.classList.contains('delete-all-btn')) {
        await this.showDeleteConfirmation();
      }
      
      // Confirm delete button
      if (target.classList.contains('confirm-delete-btn')) {
        await this.deleteAllData();
      }
      
      // Cancel delete button
      if (target.classList.contains('cancel-delete-btn')) {
        this.hideDeleteConfirmation();
      }
    });
  }

  /**
   * Update tracking preference
   * @private
   * @param {boolean} enabled - Tracking enabled
   */
  async updateTracking(enabled) {
    try {
      await preferencesStore.set('privacy.trackingEnabled', enabled);
      this.preferences.trackingEnabled = enabled;
      this.showNotification(
        enabled ? 'Mood tracking and insights enabled' : 'Mood tracking and insights disabled'
      );
    } catch (error) {
      console.error('[PrivacySettings] Failed to update tracking:', error);
      this.showError('Failed to update tracking preference');
    }
  }

  /**
   * Update data retention
   * @private
   * @param {number} days - Retention days
   */
  async updateRetention(days) {
    try {
      await preferencesStore.set('privacy.dataRetentionDays', days);
      this.preferences.dataRetentionDays = days;
      this.showNotification(`Data retention set to ${days === 36500 ? 'forever' : days + ' days'}`);
    } catch (error) {
      console.error('[PrivacySettings] Failed to update retention:', error);
      this.showError('Failed to update retention preference');
    }
  }

  /**
   * Export all data as JSON
   * @private
   */
  async exportData() {
    try {
      await dataPortability.exportToFile();
      this.showNotification('Data exported successfully');
    } catch (error) {
      console.error('[PrivacySettings] Failed to export data:', error);
      this.showError('Failed to export data');
    }
  }

  /**
   * Export sessions as CSV
   * @private
   */
  async exportCSV() {
    try {
      await dataPortability.exportSessionsToCSV();
      this.showNotification('CSV exported successfully');
    } catch (error) {
      console.error('[PrivacySettings] Failed to export CSV:', error);
      this.showError('Failed to export CSV');
    }
  }

  /**
   * Show delete confirmation modal
   * @private
   */
  showDeleteConfirmation() {
    const modal = this.shadowRoot.querySelector('.delete-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  /**
   * Hide delete confirmation modal
   * @private
   */
  hideDeleteConfirmation() {
    const modal = this.shadowRoot.querySelector('.delete-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Delete all user data
   * @private
   */
  async deleteAllData() {
    try {
      await storageManager.clear('sessions');
      await storageManager.clear('insights');
      await storageManager.clear('preferences');
      
      this.hideDeleteConfirmation();
      this.showNotification('All data deleted');
      
      // Reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('[PrivacySettings] Failed to delete data:', error);
      this.showError('Failed to delete data');
    }
  }

  /**
   * Show notification
   * @private
   * @param {string} message - Message to show
   */
  showNotification(message) {
    const notification = this.shadowRoot.querySelector('.notification');
    if (notification) {
      notification.textContent = message;
      notification.classList.add('show');
      setTimeout(() => {
        notification.classList.remove('show');
      }, 3000);
    }
  }

  /**
   * Show error notification
   * @private
   * @param {string} message - Error message
   */
  showError(message) {
    const notification = this.shadowRoot.querySelector('.notification');
    if (notification) {
      notification.textContent = message;
      notification.classList.add('show', 'error');
      setTimeout(() => {
        notification.classList.remove('show', 'error');
      }, 3000);
    }
  }

  /**
   * Format file size
   * @private
   * @param {number} bytes - Bytes
   * @returns {string} Formatted size
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  render() {
    if (!this.preferences) {
      this.shadowRoot.innerHTML = '<div class="loading">Loading privacy settings...</div>';
      return;
    }
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .privacy-container {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .privacy-title {
          font-family: var(--font-serif, serif);
          font-size: 2rem;
          color: var(--color-text-primary, #1a1a1a);
          margin-bottom: var(--space-6, 2rem);
        }
        
        .section {
          background: var(--color-surface, #fff);
          border-radius: var(--radius-3, 12px);
          padding: var(--space-5, 1.75rem);
          box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.1));
          margin-bottom: var(--space-4, 1.5rem);
        }
        
        .section-title {
          font-size: 1.25rem;
          font-weight: var(--font-weight-semibold, 600);
          color: var(--color-text-primary, #1a1a1a);
          margin-bottom: var(--space-3, 1rem);
        }
        
        .section-description {
          font-size: 0.875rem;
          color: var(--color-text-secondary, #666);
          margin-bottom: var(--space-4, 1.5rem);
          line-height: 1.6;
        }
        
        .setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-3, 1rem) 0;
          border-bottom: 1px solid var(--color-border-light, #ddd);
        }
        
        .setting-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        
        .setting-label {
          font-weight: var(--font-weight-medium, 500);
          color: var(--color-text-primary, #1a1a1a);
        }
        
        .setting-help {
          font-size: 0.875rem;
          color: var(--color-text-tertiary, #999);
          margin-top: var(--space-1, 0.25rem);
        }
        
        .toggle-switch {
          position: relative;
          width: 50px;
          height: 26px;
        }
        
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--color-text-tertiary, #999);
          transition: 0.3s;
          border-radius: 26px;
        }
        
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background: white;
          transition: 0.3s;
          border-radius: 50%;
        }
        
        input:checked + .toggle-slider {
          background: var(--color-success, #27AE60);
        }
        
        input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }
        
        select {
          padding: var(--space-2, 0.5rem) var(--space-3, 1rem);
          border: 2px solid var(--color-border-light, #ddd);
          border-radius: var(--radius-2, 8px);
          font-size: 0.875rem;
          background: var(--color-background, #fafafa);
          cursor: pointer;
        }
        
        select:focus {
          outline: none;
          border-color: var(--color-primary, #2C5F7C);
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--space-3, 1rem);
          margin-top: var(--space-4, 1.5rem);
        }
        
        .stat-item {
          text-align: center;
        }
        
        .stat-value {
          font-size: 1.5rem;
          font-weight: var(--font-weight-bold, 700);
          color: var(--color-primary, #2C5F7C);
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: var(--color-text-secondary, #666);
          margin-top: var(--space-1, 0.25rem);
        }
        
        .button-group {
          display: flex;
          gap: var(--space-3, 1rem);
          flex-wrap: wrap;
        }
        
        .export-data-btn, .export-csv-btn {
          flex: 1;
          min-width: 200px;
          padding: var(--space-3, 1rem);
          background: var(--color-success, #27AE60);
          color: white;
          border: none;
          border-radius: var(--radius-2, 8px);
          cursor: pointer;
          font-weight: var(--font-weight-medium, 500);
          transition: all 0.2s ease;
        }
        
        .export-data-btn:hover, .export-csv-btn:hover {
          background: var(--color-success-dark, #229954);
          transform: translateY(-2px);
        }
        
        .delete-all-btn {
          width: 100%;
          padding: var(--space-3, 1rem);
          background: var(--color-error, #dc3545);
          color: white;
          border: none;
          border-radius: var(--radius-2, 8px);
          cursor: pointer;
          font-weight: var(--font-weight-medium, 500);
          transition: all 0.2s ease;
        }
        
        .delete-all-btn:hover {
          background: var(--color-error-dark, #bd2130);
        }
        
        .warning-box {
          background: var(--color-error-light, #fee);
          border: 2px solid var(--color-error, #dc3545);
          border-radius: var(--radius-2, 8px);
          padding: var(--space-3, 1rem);
          margin-bottom: var(--space-3, 1rem);
        }
        
        .warning-text {
          color: var(--color-error, #dc3545);
          font-weight: var(--font-weight-semibold, 600);
          margin-bottom: var(--space-2, 0.5rem);
        }
        
        .delete-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: var(--color-surface, #fff);
          border-radius: var(--radius-3, 12px);
          padding: var(--space-6, 2rem);
          max-width: 500px;
          width: 90%;
          box-shadow: var(--shadow-large, 0 20px 40px rgba(0,0,0,0.3));
        }
        
        .modal-title {
          font-size: 1.5rem;
          font-weight: var(--font-weight-bold, 700);
          color: var(--color-error, #dc3545);
          margin-bottom: var(--space-3, 1rem);
        }
        
        .modal-text {
          margin-bottom: var(--space-4, 1.5rem);
          line-height: 1.6;
        }
        
        .modal-buttons {
          display: flex;
          gap: var(--space-3, 1rem);
        }
        
        .confirm-delete-btn, .cancel-delete-btn {
          flex: 1;
          padding: var(--space-3, 1rem);
          border: none;
          border-radius: var(--radius-2, 8px);
          cursor: pointer;
          font-weight: var(--font-weight-medium, 500);
          transition: all 0.2s ease;
        }
        
        .confirm-delete-btn {
          background: var(--color-error, #dc3545);
          color: white;
        }
        
        .cancel-delete-btn {
          background: var(--color-background, #fafafa);
          color: var(--color-text-primary, #1a1a1a);
        }
        
        .notification {
          position: fixed;
          bottom: var(--space-6, 2rem);
          left: 50%;
          transform: translateX(-50%) translateY(100px);
          background: var(--color-success, #27AE60);
          color: white;
          padding: var(--space-3, 1rem) var(--space-5, 1.75rem);
          border-radius: var(--radius-2, 8px);
          box-shadow: var(--shadow-md, 0 4px 16px rgba(0,0,0,0.15));
          transition: transform 0.3s ease;
          z-index: 2000;
        }
        
        .notification.show {
          transform: translateX(-50%) translateY(0);
        }
        
        .notification.error {
          background: var(--color-error, #dc3545);
        }
        
        .privacy-notice {
          background: var(--color-primary-light, #e8f2f7);
          border-left: 4px solid var(--color-primary, #2C5F7C);
          padding: var(--space-4, 1.5rem);
          border-radius: var(--radius-2, 8px);
        }
        
        .privacy-notice a {
          color: var(--color-primary, #2C5F7C);
          font-weight: var(--font-weight-semibold, 600);
        }
        
        @media (max-width: 640px) {
          .privacy-title {
            font-size: 1.5rem;
          }
          
          .button-group {
            flex-direction: column;
          }
          
          .export-data-btn, .export-csv-btn {
            min-width: 100%;
          }
        }
      </style>
      
      <div class="privacy-container">
        <h2 class="privacy-title">Privacy & Data Settings</h2>
        
        <!-- Data Collection -->
        <div class="section">
          <h3 class="section-title">Data Collection</h3>
          <p class="section-description">
            Control what data is collected and stored locally on your device. All data stays on your device and is never sent to any servers.
          </p>
          
          <div class="setting-row">
            <div>
              <div class="setting-label">Enable Mood Tracking & Insights</div>
              <div class="setting-help">Track your mood before and after sessions to receive personalized insights</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="tracking-toggle" ${this.preferences.trackingEnabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        
        <!-- Data Retention -->
        <div class="section">
          <h3 class="section-title">Data Retention</h3>
          <p class="section-description">
            Choose how long to keep your meditation history. Older data will be automatically deleted.
          </p>
          
          <div class="setting-row">
            <div class="setting-label">Keep data for:</div>
            <select id="retention-select">
              <option value="30" ${this.preferences.dataRetentionDays === 30 ? 'selected' : ''}>30 days</option>
              <option value="60" ${this.preferences.dataRetentionDays === 60 ? 'selected' : ''}>60 days</option>
              <option value="90" ${this.preferences.dataRetentionDays === 90 ? 'selected' : ''}>90 days</option>
              <option value="180" ${this.preferences.dataRetentionDays === 180 ? 'selected' : ''}>180 days</option>
              <option value="365" ${this.preferences.dataRetentionDays === 365 ? 'selected' : ''}>1 year</option>
              <option value="36500" ${this.preferences.dataRetentionDays === 36500 ? 'selected' : ''}>Forever</option>
            </select>
          </div>
        </div>
        
        <!-- Data Summary -->
        ${this.stats ? `
          <div class="section">
            <h3 class="section-title">Your Data</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value">${this.stats.sessions}</div>
                <div class="stat-label">Sessions</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${this.stats.insights}</div>
                <div class="stat-label">Insights</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${this.formatSize(this.stats.totalSize)}</div>
                <div class="stat-label">Storage Used</div>
              </div>
            </div>
          </div>
        ` : ''}
        
        <!-- Export Data -->
        <div class="section">
          <h3 class="section-title">Export Your Data</h3>
          <p class="section-description">
            Download all your data in machine-readable formats for backup or transfer to another device.
          </p>
          
          <div class="button-group">
            <button class="export-data-btn">📥 Export All Data (JSON)</button>
            <button class="export-csv-btn">📊 Export Sessions (CSV)</button>
          </div>
        </div>
        
        <!-- Delete Data -->
        <div class="section">
          <h3 class="section-title">Delete All Data</h3>
          <div class="warning-box">
            <div class="warning-text">⚠️ Warning: This action cannot be undone!</div>
            <p style="font-size: 0.875rem; color: var(--color-text-secondary, #666);">
              This will permanently delete all your meditation sessions, insights, and preferences from this device.
            </p>
          </div>
          <button class="delete-all-btn">Delete All My Data</button>
        </div>
        
        <!-- Privacy Notice -->
        <div class="privacy-notice">
          <strong>Your Privacy Matters</strong><br>
          All your data is stored locally on your device. We never collect, transmit, or sell your personal information.
          <a href="#" target="_blank">Learn more about our privacy practices</a>
        </div>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <div class="delete-modal">
        <div class="modal-content">
          <h3 class="modal-title">⚠️ Confirm Deletion</h3>
          <p class="modal-text">
            Are you absolutely sure you want to delete all your data? This will permanently remove:
            <ul>
              <li>All meditation sessions</li>
              <li>All AI insights</li>
              <li>All preferences and settings</li>
            </ul>
            <strong>This action cannot be undone.</strong>
          </p>
          <div class="modal-buttons">
            <button class="cancel-delete-btn">Cancel</button>
            <button class="confirm-delete-btn">Yes, Delete Everything</button>
          </div>
        </div>
      </div>
      
      <!-- Notification Toast -->
      <div class="notification"></div>
    `;
  }
}

// Register the custom element
customElements.define('privacy-settings', PrivacySettings);
