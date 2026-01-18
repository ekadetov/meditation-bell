/**
 * Application-wide constants
 * @module config/constants
 */

/**
 * Event names for the Event Bus
 * @constant
 */
export const EVENTS = {
  // Timer events
  TIMER_START: 'timer:start',
  TIMER_PAUSE: 'timer:pause',
  TIMER_RESUME: 'timer:resume',
  TIMER_STOP: 'timer:stop',
  TIMER_TICK: 'timer:tick',
  TIMER_COMPLETE: 'timer:complete',
  
  // Bell events
  BELL_RING: 'bell:ring',
  BELL_START: 'bell:start',
  BELL_END: 'bell:end',
  BELL_SCHEDULED: 'bell:scheduled',
  
  // Audio events
  AUDIO_STARTED: 'audio:started',
  AUDIO_PROGRESS: 'audio:progress',
  AUDIO_ENDED: 'audio:ended',
  AUDIO_PAUSED: 'audio:paused',
  AUDIO_RESUMED: 'audio:resumed',
  AUDIO_STOPPED: 'audio:stopped',
  AUDIO_ERROR: 'audio:error',
  AUDIO_LOADED: 'audio:loaded',
  AUDIO_LOADING: 'audio:loading',
  AUDIO_CONTEXT_READY: 'audio:context-ready',
  AUDIO_CONTEXT_SUSPENDED: 'audio:context-suspended',
  VOLUME_CHANGE: 'audio:volume-change',
  MUTE_CHANGE: 'audio:mute-change',
  
  // State events
  STATE_CHANGED: 'state:changed',
  PREFERENCES_UPDATED: 'preferences:updated',
  PREFERENCES_CHANGED: 'preferences:changed',
  VIEW_CHANGE: 'view:change',
  
  // Storage events
  SESSION_SAVED: 'storage:session-saved',
  SESSION_LOADED: 'storage:session-loaded',
  DATA_EXPORTED: 'storage:data-exported',
  DATA_DELETED: 'storage:data-deleted',
  
  // AI events
  MOOD_TRACKED: 'ai:mood-tracked',
  MOOD_ANALYZED: 'ai:mood-analyzed',
  INSIGHT_GENERATED: 'ai:insight-generated',
  PATTERN_DETECTED: 'ai:pattern-detected',
  
  // Network events
  SYNC_STARTED: 'sync:started',
  SYNC_COMPLETE: 'sync:completed',
  SYNC_ERROR: 'sync:error',
  
  // Error events
  ERROR_OCCURRED: 'error:occurred',
  ERROR: 'error'
};

/**
 * Timer modes
 * @constant
 */
export const TIMER_MODES = {
  PERIODIC: 'periodic',
  RANDOM: 'random',
  REMINDER: 'reminder',
  HOURLY: 'hourly'
};

/**
 * Timer states
 * @constant
 */
export const TIMER_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  STOPPED: 'stopped'
};

/**
 * Bell types
 * @constant
 */
export const BELL_TYPES = {
  BIG: 'big',
  SMALL: 'small'
};

/**
 * Audio file paths
 * @constant
 */
export const AUDIO_PATHS = {
  BIG_BELL: '/audio/big-bell.mp3',
  SMALL_BELL: '/audio/small-bell.mp3'
};

/**
 * Timing constants (in milliseconds unless noted)
 * @constant
 */
export const TIMING = {
  TICK_INTERVAL: 100,           // How often to emit tick events (ms)
  MIN_INTERVAL: 1,              // Minimum timer interval (minutes)
  MAX_INTERVAL: 120,            // Maximum timer interval (minutes)
  DRIFT_THRESHOLD: 10,          // Acceptable drift threshold (ms)
  RAF_FALLBACK_INTERVAL: 16,    // Fallback if RAF not available (ms)
  AUDIO_LOOKAHEAD: 100,         // Audio scheduling lookahead (ms)
  AUDIO_SCHEDULE_INTERVAL: 25   // How often to check scheduling (ms)
};

/**
 * Bell sound synthesis parameters
 * @constant
 */
export const BELL_PARAMS = {
  BIG_BELL: {
    fundamentalFreq: 220,        // A3 in Hz
    duration: 47,                // seconds
    harmonics: [1, 2.76, 4.83, 6.59],  // Bell-like harmonic ratios
    gains: [1.0, 0.5, 0.25, 0.15],
    attack: 0.01,                // ADSR envelope (seconds)
    decay: 0.5,
    sustain: 0.3,
    release: 47,
    reverbMix: 0.3,
    reverbTime: 0.03
  },
  SMALL_BELL: {
    fundamentalFreq: 880,        // A5 in Hz
    duration: 32,                // seconds
    harmonics: [1, 2.76, 4.83, 6.59],
    gains: [1.0, 0.4, 0.2, 0.1],
    attack: 0.005,
    decay: 0.3,
    sustain: 0.25,
    release: 32,
    reverbMix: 0.2,
    reverbTime: 0.02
  }
};

/**
 * Audio context states
 * @constant
 */
export const AUDIO_STATES = {
  SUSPENDED: 'suspended',
  RUNNING: 'running',
  CLOSED: 'closed',
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error'
};

/**
 * Validation limits
 * @constant
 */
export const LIMITS = {
  MIN_VOLUME: 0,
  MAX_VOLUME: 1,
  MIN_PERIODIC_INTERVAL: 1,     // minutes
  MAX_PERIODIC_INTERVAL: 120,   // minutes
  MIN_RANDOM_INTERVAL: 1,       // minutes
  MAX_RANDOM_INTERVAL: 120,     // minutes
  MAX_REMINDER_TIMES: 24,
  MAX_NOTE_LENGTH: 5000,        // characters
  MAX_TAG_LENGTH: 50,           // characters
  MAX_TAGS_PER_SESSION: 10
};

/**
 * Local storage keys
 * @constant
 */
export const STORAGE_KEYS = {
  PREFERENCES: 'awakening-bell:preferences',
  VERSION: 'awakening-bell:version',
  ONBOARDING_COMPLETE: 'awakening-bell:onboarding-complete'
};

/**
 * IndexedDB configuration
 * @constant
 */
export const DB_CONFIG = {
  NAME: 'awakening-bell-db',
  VERSION: 1,
  STORES: {
    SESSIONS: 'sessions',
    INSIGHTS: 'insights',
    AUDIO_CACHE: 'audioCache',
    AI_MODELS: 'aiModels'
  }
};

/**
 * Application version
 * @constant
 */
export const APP_VERSION = '1.0.0';

/**
 * Theme options
 * @constant
 */
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

/**
 * View identifiers
 * @constant
 */
export const VIEWS = {
  TIMER: 'timer',
  HISTORY: 'history',
  INSIGHTS: 'insights',
  SETTINGS: 'settings'
};
