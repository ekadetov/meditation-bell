/**
 * Storage Manager - Abstract interface for localStorage and IndexedDB
 * Provides automatic fallback: IndexedDB → localStorage → memory
 * @module storage/StorageManager
 */

import { eventBus } from '../core/EventBus.js';
import { EVENTS } from '../config/constants.js';

/**
 * Storage types in order of preference
 * @enum {string}
 */
export const STORAGE_TYPE = {
  INDEXED_DB: 'indexeddb',
  LOCAL_STORAGE: 'localstorage',
  MEMORY: 'memory'
};

/**
 * Storage Manager class
 * Manages data persistence with automatic fallback
 */
export class StorageManager {
  /**
   * @param {string} dbName - Database name
   * @param {number} version - Database version
   */
  constructor(dbName = 'MeditationBellDB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.storageType = null;
    this.memoryStore = new Map();
    this.initPromise = null;
  }

  /**
   * Initialize storage
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._attemptInitialization();
    return this.initPromise;
  }

  /**
   * Attempt to initialize storage with fallback
   * @private
   * @returns {Promise<void>}
   */
  async _attemptInitialization() {
    // Try IndexedDB first
    try {
      await this._initIndexedDB();
      this.storageType = STORAGE_TYPE.INDEXED_DB;
      console.log('✓ Using IndexedDB for storage');
      return;
    } catch (error) {
      console.warn('IndexedDB initialization failed:', error.message);
    }

    // Try localStorage as fallback
    try {
      this._initLocalStorage();
      this.storageType = STORAGE_TYPE.LOCAL_STORAGE;
      console.log('✓ Using localStorage for storage');
      return;
    } catch (error) {
      console.warn('localStorage initialization failed:', error.message);
    }

    // Use memory storage as last resort
    this.storageType = STORAGE_TYPE.MEMORY;
    console.warn('⚠ Using in-memory storage (data will not persist)');
    
    eventBus.dispatch(EVENTS.ERROR, {
      type: 'storage',
      message: 'Using temporary in-memory storage. Data will not persist across sessions.'
    });
  }

  /**
   * Initialize IndexedDB
   * @private
   * @returns {Promise<void>}
   */
  _initIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = window.indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(new Error('IndexedDB open failed'));
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('startTime', 'startTime', { unique: false });
          sessionStore.createIndex('mode', 'mode', { unique: false });
        }

        if (!db.objectStoreNames.contains('insights')) {
          const insightsStore = db.createObjectStore('insights', { keyPath: 'id' });
          insightsStore.createIndex('createdAt', 'createdAt', { unique: false });
          insightsStore.createIndex('category', 'category', { unique: false });
        }
      };
    });
  }

  /**
   * Initialize localStorage
   * @private
   * @throws {Error} If localStorage is not available or quota exceeded
   */
  _initLocalStorage() {
    if (!window.localStorage) {
      throw new Error('localStorage not supported');
    }

    // Test localStorage availability
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
    } catch (error) {
      throw new Error('localStorage quota exceeded or not available');
    }
  }

  /**
   * Get data from storage
   * @param {string} storeName - Store name (preferences, sessions, insights)
   * @param {string} key - Item key
   * @returns {Promise<*>} Retrieved data
   */
  async get(storeName, key) {
    await this.initialize();

    switch (this.storageType) {
      case STORAGE_TYPE.INDEXED_DB:
        return this._getIndexedDB(storeName, key);
      
      case STORAGE_TYPE.LOCAL_STORAGE:
        return this._getLocalStorage(storeName, key);
      
      case STORAGE_TYPE.MEMORY:
        return this._getMemory(storeName, key);
      
      default:
        throw new Error('Storage not initialized');
    }
  }

  /**
   * Get all items from a store
   * @param {string} storeName - Store name
   * @returns {Promise<Array>} All items
   */
  async getAll(storeName) {
    await this.initialize();

    switch (this.storageType) {
      case STORAGE_TYPE.INDEXED_DB:
        return this._getAllIndexedDB(storeName);
      
      case STORAGE_TYPE.LOCAL_STORAGE:
        return this._getAllLocalStorage(storeName);
      
      case STORAGE_TYPE.MEMORY:
        return this._getAllMemory(storeName);
      
      default:
        throw new Error('Storage not initialized');
    }
  }

  /**
   * Save data to storage
   * @param {string} storeName - Store name
   * @param {*} data - Data to save (must have id/key property)
   * @returns {Promise<void>}
   */
  async set(storeName, data) {
    await this.initialize();

    switch (this.storageType) {
      case STORAGE_TYPE.INDEXED_DB:
        return this._setIndexedDB(storeName, data);
      
      case STORAGE_TYPE.LOCAL_STORAGE:
        return this._setLocalStorage(storeName, data);
      
      case STORAGE_TYPE.MEMORY:
        return this._setMemory(storeName, data);
      
      default:
        throw new Error('Storage not initialized');
    }
  }

  /**
   * Delete item from storage
   * @param {string} storeName - Store name
   * @param {string} key - Item key
   * @returns {Promise<void>}
   */
  async delete(storeName, key) {
    await this.initialize();

    switch (this.storageType) {
      case STORAGE_TYPE.INDEXED_DB:
        return this._deleteIndexedDB(storeName, key);
      
      case STORAGE_TYPE.LOCAL_STORAGE:
        return this._deleteLocalStorage(storeName, key);
      
      case STORAGE_TYPE.MEMORY:
        return this._deleteMemory(storeName, key);
      
      default:
        throw new Error('Storage not initialized');
    }
  }

  /**
   * Clear all data from a store
   * @param {string} storeName - Store name
   * @returns {Promise<void>}
   */
  async clear(storeName) {
    await this.initialize();

    switch (this.storageType) {
      case STORAGE_TYPE.INDEXED_DB:
        return this._clearIndexedDB(storeName);
      
      case STORAGE_TYPE.LOCAL_STORAGE:
        return this._clearLocalStorage(storeName);
      
      case STORAGE_TYPE.MEMORY:
        return this._clearMemory(storeName);
      
      default:
        throw new Error('Storage not initialized');
    }
  }

  /**
   * Query items from store with filter
   * @param {string} storeName - Store name
   * @param {Function} filterFn - Filter function (item => boolean)
   * @returns {Promise<Array>} Filtered items
   */
  async query(storeName, filterFn) {
    const allItems = await this.getAll(storeName);
    return allItems.filter(filterFn);
  }

  /**
   * Get storage quota information
   * @returns {Promise<Object>} Quota info {usage, quota, available}
   */
  async getQuota() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0),
        usagePercent: estimate.quota ? (estimate.usage / estimate.quota * 100).toFixed(2) : 0
      };
    }
    return { usage: 0, quota: 0, available: 0, usagePercent: 0 };
  }

  // ==================== IndexedDB Methods ====================

  /**
   * Get from IndexedDB
   * @private
   */
  _getIndexedDB(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('IndexedDB get failed'));
    });
  }

  /**
   * Get all from IndexedDB
   * @private
   */
  _getAllIndexedDB(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error('IndexedDB getAll failed'));
    });
  }

  /**
   * Set to IndexedDB
   * @private
   */
  _setIndexedDB(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('IndexedDB set failed'));
    });
  }

  /**
   * Delete from IndexedDB
   * @private
   */
  _deleteIndexedDB(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('IndexedDB delete failed'));
    });
  }

  /**
   * Clear IndexedDB store
   * @private
   */
  _clearIndexedDB(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('IndexedDB clear failed'));
    });
  }

  // ==================== localStorage Methods ====================

  /**
   * Get from localStorage
   * @private
   */
  _getLocalStorage(storeName, key) {
    const fullKey = `${this.dbName}_${storeName}_${key}`;
    const data = window.localStorage.getItem(fullKey);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Get all from localStorage
   * @private
   */
  _getAllLocalStorage(storeName) {
    const prefix = `${this.dbName}_${storeName}_`;
    const items = [];
    
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const data = window.localStorage.getItem(key);
        if (data) {
          items.push(JSON.parse(data));
        }
      }
    }
    
    return items;
  }

  /**
   * Set to localStorage
   * @private
   */
  _setLocalStorage(storeName, data) {
    const key = data.id || data.key;
    if (!key) {
      throw new Error('Data must have id or key property');
    }
    
    const fullKey = `${this.dbName}_${storeName}_${key}`;
    window.localStorage.setItem(fullKey, JSON.stringify(data));
  }

  /**
   * Delete from localStorage
   * @private
   */
  _deleteLocalStorage(storeName, key) {
    const fullKey = `${this.dbName}_${storeName}_${key}`;
    window.localStorage.removeItem(fullKey);
  }

  /**
   * Clear localStorage store
   * @private
   */
  _clearLocalStorage(storeName) {
    const prefix = `${this.dbName}_${storeName}_`;
    const keysToRemove = [];
    
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => window.localStorage.removeItem(key));
  }

  // ==================== Memory Methods ====================

  /**
   * Get from memory
   * @private
   */
  _getMemory(storeName, key) {
    const storeKey = `${storeName}_${key}`;
    return this.memoryStore.get(storeKey) || null;
  }

  /**
   * Get all from memory
   * @private
   */
  _getAllMemory(storeName) {
    const items = [];
    for (const [key, value] of this.memoryStore.entries()) {
      if (key.startsWith(`${storeName}_`)) {
        items.push(value);
      }
    }
    return items;
  }

  /**
   * Set to memory
   * @private
   */
  _setMemory(storeName, data) {
    const key = data.id || data.key;
    if (!key) {
      throw new Error('Data must have id or key property');
    }
    
    const storeKey = `${storeName}_${key}`;
    this.memoryStore.set(storeKey, data);
  }

  /**
   * Delete from memory
   * @private
   */
  _deleteMemory(storeName, key) {
    const storeKey = `${storeName}_${key}`;
    this.memoryStore.delete(storeKey);
  }

  /**
   * Clear memory store
   * @private
   */
  _clearMemory(storeName) {
    const keysToDelete = [];
    for (const key of this.memoryStore.keys()) {
      if (key.startsWith(`${storeName}_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.memoryStore.delete(key));
  }
}

// Export singleton instance
export const storageManager = new StorageManager();
