/**
 * Preferences Store - Manages user preferences with localStorage
 * @module storage/PreferencesStore
 */

import { storageManager } from './StorageManager.js';
import { DEFAULT_PREFERENCES } from '../config/defaults.js';
import { eventBus } from '../core/EventBus.js';
import { EVENTS } from '../config/constants.js';

const STORE_NAME = 'preferences';
const PREFERENCES_KEY = 'user_preferences';
const SCHEMA_VERSION = '1.0.0';

/**
 * Preferences Store class
 * Handles saving/loading user preferences with validation and migration
 */
export class PreferencesStore {
  constructor() {
    this.preferences = null;
    this.loadPromise = null;
  }

  /**
   * Initialize and load preferences
   * @returns {Promise<Object>} Loaded preferences
   */
  async initialize() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._loadPreferences();
    return this.loadPromise;
  }

  /**
   * Load preferences from storage
   * @private
   * @returns {Promise<Object>}
   */
  async _loadPreferences() {
    try {
      const stored = await storageManager.get(STORE_NAME, PREFERENCES_KEY);
      
      if (stored) {
        // Validate and migrate if needed
        const validated = this._validateSchema(stored);
        const migrated = this._migrateIfNeeded(validated);
        this.preferences = migrated;
        
        console.log('✓ Preferences loaded from storage');
      } else {
        // No stored preferences, use defaults
        this.preferences = this._createDefaultPreferences();
        await this.save();
        
        console.log('✓ Created default preferences');
      }
      
      return this.preferences;
    } catch (error) {
      console.error('Failed to load preferences:', error);
      
      // Fallback to defaults on error
      this.preferences = this._createDefaultPreferences();
      
      eventBus.dispatch(EVENTS.ERROR, {
        type: 'preferences',
        message: 'Failed to load preferences, using defaults'
      });
      
      return this.preferences;
    }
  }

  /**
   * Get all preferences
   * @returns {Promise<Object>} Current preferences
   */
  async getAll() {
    if (!this.preferences) {
      await this.initialize();
    }
    return { ...this.preferences };
  }

  /**
   * Get a specific preference value
   * @param {string} path - Dot-notation path (e.g., 'audio.volume')
   * @returns {Promise<*>} Preference value
   */
  async get(path) {
    const prefs = await this.getAll();
    
    const keys = path.split('.');
    let value = prefs;
    
    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[key];
    }
    
    return value;
  }

  /**
   * Set a preference value
   * @param {string} path - Dot-notation path
   * @param {*} value - New value
   * @returns {Promise<void>}
   */
  async set(path, value) {
    if (!this.preferences) {
      await this.initialize();
    }

    const keys = path.split('.');
    const newPrefs = { ...this.preferences };
    
    let current = newPrefs;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    
    // Update timestamp
    newPrefs.updatedAt = Date.now();
    
    this.preferences = newPrefs;
    await this.save();
    
    // Emit preference changed event
    eventBus.dispatch(EVENTS.PREFERENCES_CHANGED, {
      path,
      value,
      preferences: { ...this.preferences }
    });
  }

  /**
   * Update multiple preferences at once
   * @param {Object} updates - Object with preference updates
   * @returns {Promise<void>}
   */
  async update(updates) {
    if (!this.preferences) {
      await this.initialize();
    }

    const newPrefs = this._deepMerge(this.preferences, updates);
    newPrefs.updatedAt = Date.now();
    
    this.preferences = newPrefs;
    await this.save();
    
    eventBus.dispatch(EVENTS.PREFERENCES_CHANGED, {
      updates,
      preferences: { ...this.preferences }
    });
  }

  /**
   * Save preferences to storage
   * @returns {Promise<void>}
   */
  async save() {
    if (!this.preferences) {
      throw new Error('No preferences to save');
    }

    try {
      const toSave = {
        key: PREFERENCES_KEY,
        ...this.preferences
      };
      
      await storageManager.set(STORE_NAME, toSave);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      
      eventBus.dispatch(EVENTS.ERROR, {
        type: 'preferences',
        message: 'Failed to save preferences'
      });
      
      throw error;
    }
  }

  /**
   * Reset preferences to defaults
   * @returns {Promise<void>}
   */
  async reset() {
    this.preferences = this._createDefaultPreferences();
    await this.save();
    
    eventBus.dispatch(EVENTS.PREFERENCES_CHANGED, {
      reset: true,
      preferences: { ...this.preferences }
    });
  }

  /**
   * Export preferences as JSON
   * @returns {Promise<string>} JSON string
   */
  async export() {
    const prefs = await this.getAll();
    return JSON.stringify(prefs, null, 2);
  }

  /**
   * Import preferences from JSON
   * @param {string} jsonString - JSON string
   * @returns {Promise<void>}
   */
  async import(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      const validated = this._validateSchema(imported);
      
      this.preferences = validated;
      this.preferences.updatedAt = Date.now();
      
      await this.save();
      
      eventBus.dispatch(EVENTS.PREFERENCES_CHANGED, {
        imported: true,
        preferences: { ...this.preferences }
      });
    } catch (error) {
      console.error('Failed to import preferences:', error);
      throw new Error('Invalid preferences format');
    }
  }

  /**
   * Create default preferences object
   * @private
   * @returns {Object}
   */
  _createDefaultPreferences() {
    return {
      ...DEFAULT_PREFERENCES,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  /**
   * Validate preferences schema
   * @private
   * @param {Object} prefs - Preferences to validate
   * @returns {Object} Validated preferences with defaults filled in
   */
  _validateSchema(prefs) {
    // Merge with defaults to ensure all fields exist
    const validated = this._deepMerge(this._createDefaultPreferences(), prefs);
    
    // Validate critical fields
    if (typeof validated.audio.volume !== 'number' || validated.audio.volume < 0 || validated.audio.volume > 1) {
      validated.audio.volume = 0.8;
    }
    
    if (typeof validated.timer.periodicInterval !== 'number' || validated.timer.periodicInterval < 1) {
      validated.timer.periodicInterval = 5;
    }
    
    if (typeof validated.privacy.dataRetentionDays !== 'number' || validated.privacy.dataRetentionDays < 1) {
      validated.privacy.dataRetentionDays = 90;
    }
    
    return validated;
  }

  /**
   * Migrate preferences if version changed
   * @private
   * @param {Object} prefs - Preferences to migrate
   * @returns {Object} Migrated preferences
   */
  _migrateIfNeeded(prefs) {
    const currentVersion = prefs.version || '0.0.0';
    
    if (currentVersion === SCHEMA_VERSION) {
      return prefs;
    }
    
    console.log(`Migrating preferences from ${currentVersion} to ${SCHEMA_VERSION}`);
    
    // Add migration logic here as schema evolves
    // For now, just update version and merge with new defaults
    const migrated = this._deepMerge(this._createDefaultPreferences(), prefs);
    migrated.version = SCHEMA_VERSION;
    
    return migrated;
  }

  /**
   * Deep merge two objects
   * @private
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  _deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this._deepMerge(target[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }
}

// Export singleton instance
export const preferencesStore = new PreferencesStore();
