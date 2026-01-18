/**
 * Default configuration values
 * @module config/defaults
 */

import { TIMER_MODES, BELL_TYPES, THEMES } from './constants.js';

/**
 * Default user preferences
 * @constant
 */
export const DEFAULT_PREFERENCES = {
  version: '1.0.0',
  
  // Appearance
  theme: THEMES.AUTO,
  highContrast: false,
  reduceMotion: false,
  fontSize: 'medium',
  
  // Audio settings
  audio: {
    bellType: BELL_TYPES.BIG,
    volume: 0.8,
    bigBellVolume: 0.8,
    smallBellVolume: 0.8,
    muted: false,
    fadeIn: true,
    fadeOut: true,
    fadeDuration: 200,
    preloadAudio: true,
    useSynthesis: true,          // Use synthesized bells vs audio files
    audioQuality: 'high'          // 'low' | 'medium' | 'high'
  },
  
  // Timer defaults
  timer: {
    defaultMode: TIMER_MODES.PERIODIC,
    periodicInterval: 5,           // minutes
    randomMinInterval: 2,          // minutes
    randomMaxInterval: 10,         // minutes
    reminderTimes: [],             // HH:MM format
    hourlyEnabled: false,
    autoStart: false,
    endNotification: true
  },
  
  // AI features
  ai: {
    enabled: true,
    moodTracking: true,
    insightsEnabled: true,
    suggestionsEnabled: true,
    voiceCommands: false,
    dataSharing: 'anonymous'       // 'none' | 'anonymous' | 'full'
  },
  
  // Privacy
  privacy: {
    cloudSync: false,
    analytics: false,
    errorReporting: true,
    dataRetentionDays: 90
  },
  
  // Accessibility
  accessibility: {
    screenReaderMode: false,
    keyboardShortcuts: true,
    visualBellIndicator: true,
    hapticFeedback: true
  },
  
  // Metadata
  createdAt: Date.now(),
  updatedAt: Date.now()
};

/**
 * Default timer configurations for each mode
 * @constant
 */
export const DEFAULT_TIMER_CONFIG = {
  [TIMER_MODES.PERIODIC]: {
    smallBellInterval: 5,          // minutes
    bigBellInterval: 15            // minutes (0 = disabled)
  },
  [TIMER_MODES.RANDOM]: {
    minInterval: 2,                // minutes
    maxInterval: 10,               // minutes
    bellType: 'random'             // 'big' | 'small' | 'random'
  },
  [TIMER_MODES.REMINDER]: {
    times: [],                     // Array of HH:MM strings
    recurring: true,               // Repeat daily
    bellType: BELL_TYPES.BIG
  },
  [TIMER_MODES.HOURLY]: {
    enabled: true,
    bellType: BELL_TYPES.BIG,
    onlyDuringHours: null          // { start: '09:00', end: '21:00' } or null
  }
};

/**
 * Default application state
 * @constant
 */
export const DEFAULT_STATE = {
  // Timer state
  timer: {
    isActive: false,
    isPaused: false,
    currentMode: TIMER_MODES.PERIODIC,
    elapsedSeconds: 0,
    nextBellAt: null,
    config: DEFAULT_TIMER_CONFIG[TIMER_MODES.PERIODIC]
  },
  
  // Audio state
  audio: {
    isPlaying: false,
    currentBell: null,
    volume: 0.8,
    isMuted: false,
    loadingState: 'idle'           // 'idle' | 'loading' | 'ready' | 'error'
  },
  
  // UI state
  ui: {
    currentView: 'timer',
    theme: THEMES.AUTO,
    isMenuOpen: false,
    notifications: []
  },
  
  // User state
  user: {
    preferences: DEFAULT_PREFERENCES,
    meditationStreak: 0,
    totalSessions: 0,
    totalMinutes: 0
  },
  
  // AI state
  ai: {
    currentMood: null,
    recentInsights: [],
    isAnalyzing: false,
    modelLoadStatus: 'not-loaded' // 'not-loaded' | 'loading' | 'ready' | 'error'
  }
};
