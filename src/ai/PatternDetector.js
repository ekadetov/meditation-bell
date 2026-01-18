/**
 * Pattern Detector - Analyzes meditation patterns
 * @module ai/PatternDetector
 */

import { ambientDetector } from './AmbientDetector.js';

/**
 * Pattern Detector class
 * Detects behavioral patterns in meditation sessions
 */
export class PatternDetector {
  constructor() {
    this.sessions = [];
  }

  /**
   * Load sessions for analysis
   * @param {Array} sessions - Meditation sessions
   */
  loadSessions(sessions) {
    this.sessions = sessions.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Detect all patterns
   * @returns {Object} All detected patterns
   */
  detectAll() {
    if (this.sessions.length === 0) {
      return this._getEmptyPatterns();
    }

    return {
      peakTimes: this.detectPeakTimes(),
      durationPatterns: this.detectDurationPatterns(),
      moodPatterns: this.detectMoodPatterns(),
      streaks: this.detectStreaks(),
      consistency: this.detectConsistency(),
      preferences: this.detectPreferences()
    };
  }

  /**
   * Detect peak meditation times
   * @returns {Object} Peak times analysis
   */
  detectPeakTimes() {
    // Group sessions by hour of day
    const hourCounts = new Array(24).fill(0);
    const hourMoodImprovements = new Array(24).fill(null).map(() => []);
    const hourDurations = new Array(24).fill(null).map(() => []);
    
    this.sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourCounts[hour]++;
      hourDurations[hour].push(session.duration);
      
      if (session.moodDelta !== null) {
        hourMoodImprovements[hour].push(session.moodDelta);
      }
    });
    
    // Calculate scores for each hour
    const peaks = hourCounts.map((count, hour) => {
      if (count === 0) return null;

      const avgMoodDelta = hourMoodImprovements[hour].length > 0
        ? hourMoodImprovements[hour].reduce((a, b) => a + b, 0) / hourMoodImprovements[hour].length
        : 0;
      
      const avgDuration = hourDurations[hour].reduce((a, b) => a + b, 0) / hourDurations[hour].length;
      
      // Weighted score: frequency (60%) + mood improvement (30%) + duration (10%)
      const score = (count / this.sessions.length) * 0.6 + 
                    (avgMoodDelta / 10) * 0.3 + 
                    (avgDuration / 1800) * 0.1; // Normalize to 30min sessions
      
      return {
        hour,
        count,
        avgMoodDelta: Math.round(avgMoodDelta * 10) / 10,
        avgDuration: Math.round(avgDuration),
        score,
        timeLabel: ambientDetector.formatHour(hour)
      };
    }).filter(p => p !== null)
      .sort((a, b) => b.score - a.score);
    
    return {
      topHours: peaks.slice(0, 3),
      distribution: hourCounts,
      allHours: peaks
    };
  }

  /**
   * Detect duration patterns
   * @returns {Object} Duration patterns
   */
  detectDurationPatterns() {
    if (this.sessions.length === 0) {
      return {
        preferredDuration: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        consistency: 0
      };
    }

    const durations = this.sessions.map(s => s.duration);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    // Find most common duration range (5-minute buckets)
    const buckets = {};
    durations.forEach(d => {
      const bucket = Math.floor(d / 300) * 5; // 5-minute buckets
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });
    
    const preferredBucket = Object.entries(buckets)
      .sort((a, b) => b[1] - a[1])[0];
    
    const preferredDuration = preferredBucket 
      ? parseInt(preferredBucket[0]) * 60 
      : Math.round(avg);

    // Calculate consistency (inverse of standard deviation)
    const variance = durations.reduce((sum, d) => 
      sum + Math.pow(d - avg, 2), 0
    ) / durations.length;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 1 - (stdDev / avg));

    return {
      preferredDuration: Math.round(preferredDuration),
      avgDuration: Math.round(avg),
      minDuration: Math.round(min),
      maxDuration: Math.round(max),
      consistency: Math.round(consistency * 100) / 100,
      totalSessions: this.sessions.length
    };
  }

  /**
   * Detect mood patterns
   * @returns {Object} Mood patterns
   */
  detectMoodPatterns() {
    const sessionsWithMood = this.sessions.filter(s => 
      s.moodPre && s.moodPost && s.moodDelta !== null
    );

    if (sessionsWithMood.length === 0) {
      return {
        avgPreMood: 0,
        avgPostMood: 0,
        avgImprovement: 0,
        improvementRate: 0,
        bestTimeForMood: null,
        bestDurationForMood: null
      };
    }

    // Overall mood stats
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

    // Best time of day for mood improvement
    const byTimeOfDay = {};
    sessionsWithMood.forEach(s => {
      const timeOfDay = s.context?.timeOfDay || 'unknown';
      if (!byTimeOfDay[timeOfDay]) {
        byTimeOfDay[timeOfDay] = [];
      }
      byTimeOfDay[timeOfDay].push(s.moodDelta);
    });

    let bestTime = null;
    let bestTimeImprovement = -Infinity;

    for (const [time, deltas] of Object.entries(byTimeOfDay)) {
      const avg = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
      if (avg > bestTimeImprovement) {
        bestTimeImprovement = avg;
        bestTime = time;
      }
    }

    // Best duration for mood improvement (5-minute buckets)
    const byDuration = {};
    sessionsWithMood.forEach(s => {
      const bucket = Math.floor(s.duration / 300) * 5;
      if (!byDuration[bucket]) {
        byDuration[bucket] = [];
      }
      byDuration[bucket].push(s.moodDelta);
    });

    let bestDuration = null;
    let bestDurationImprovement = -Infinity;

    for (const [duration, deltas] of Object.entries(byDuration)) {
      if (deltas.length < 2) continue; // Need at least 2 samples
      const avg = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
      if (avg > bestDurationImprovement) {
        bestDurationImprovement = avg;
        bestDuration = parseInt(duration);
      }
    }

    return {
      avgPreMood: Math.round(avgPreMood * 10) / 10,
      avgPostMood: Math.round(avgPostMood * 10) / 10,
      avgImprovement: Math.round(avgImprovement * 10) / 10,
      improvementRate: Math.round(improvementRate * 100),
      bestTimeForMood: bestTime,
      bestDurationForMood: bestDuration ? bestDuration * 60 : null,
      totalSessionsWithMood: sessionsWithMood.length
    };
  }

  /**
   * Detect streaks
   * @returns {Object} Streak information
   */
  detectStreaks() {
    if (this.sessions.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        streakDates: []
      };
    }

    // Group sessions by day
    const dayMap = new Map();
    this.sessions.forEach(session => {
      const day = new Date(session.startTime).toDateString();
      if (!dayMap.has(day)) {
        dayMap.set(day, []);
      }
      dayMap.get(day).push(session);
    });

    const days = Array.from(dayMap.keys()).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
    
    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    // Check if user has meditated today or yesterday
    if (days.includes(today) || days.includes(yesterday)) {
      const startDay = days.includes(today) ? today : yesterday;
      let checkDate = new Date(startDay);
      
      while (days.includes(checkDate.toDateString())) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let streak = 1;
    
    for (let i = 1; i < days.length; i++) {
      const prevDate = new Date(days[i - 1]);
      const currDate = new Date(days[i]);
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
      
      if (diffDays === 1) {
        streak++;
      } else {
        longestStreak = Math.max(longestStreak, streak);
        streak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, streak);

    return {
      currentStreak,
      longestStreak,
      streakDates: days
    };
  }

  /**
   * Detect consistency patterns
   * @returns {Object} Consistency metrics
   */
  detectConsistency() {
    if (this.sessions.length < 7) {
      return {
        weeklyFrequency: this.sessions.length,
        consistency: 0,
        regularDays: [],
        missedDays: 0
      };
    }

    // Analyze last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentSessions = this.sessions.filter(s => s.startTime >= thirtyDaysAgo);
    
    // Days of week distribution
    const dayOfWeekCounts = new Array(7).fill(0);
    recentSessions.forEach(s => {
      const dayOfWeek = new Date(s.startTime).getDay();
      dayOfWeekCounts[dayOfWeek]++;
    });

    // Find regular days (practiced on > 50% of those days)
    const regularDays = [];
    const daysInMonth = 30;
    const weeksInMonth = daysInMonth / 7;
    
    dayOfWeekCounts.forEach((count, day) => {
      const expectedOccurrences = Math.floor(weeksInMonth);
      if (count >= expectedOccurrences / 2) {
        regularDays.push(day);
      }
    });

    // Calculate consistency score
    const weeklyFrequency = recentSessions.length / 4; // Average per week over 30 days
    const consistencyScore = Math.min(1, weeklyFrequency / 7); // Perfect = daily

    return {
      weeklyFrequency: Math.round(weeklyFrequency * 10) / 10,
      consistency: Math.round(consistencyScore * 100),
      regularDays,
      missedDays: Math.max(0, 30 - recentSessions.length),
      totalRecentSessions: recentSessions.length
    };
  }

  /**
   * Detect user preferences
   * @returns {Object} User preferences
   */
  detectPreferences() {
    if (this.sessions.length === 0) {
      return {
        preferredMode: null,
        preferredTimeOfDay: null,
        preferredDayType: null
      };
    }

    // Mode preferences
    const modeCounts = {};
    this.sessions.forEach(s => {
      modeCounts[s.mode] = (modeCounts[s.mode] || 0) + 1;
    });
    const preferredMode = Object.entries(modeCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Time of day preferences
    const timeOfDayCounts = {};
    this.sessions.forEach(s => {
      const timeOfDay = s.context?.timeOfDay || 'unknown';
      timeOfDayCounts[timeOfDay] = (timeOfDayCounts[timeOfDay] || 0) + 1;
    });
    const preferredTimeOfDay = Object.entries(timeOfDayCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Day type preferences (weekday vs weekend)
    let weekdayCount = 0;
    let weekendCount = 0;
    this.sessions.forEach(s => {
      const dayOfWeek = new Date(s.startTime).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendCount++;
      } else {
        weekdayCount++;
      }
    });
    const preferredDayType = weekdayCount > weekendCount ? 'weekday' : 'weekend';

    return {
      preferredMode,
      preferredTimeOfDay,
      preferredDayType,
      modeCounts,
      timeOfDayCounts
    };
  }

  /**
   * Get empty patterns object
   * @private
   * @returns {Object}
   */
  _getEmptyPatterns() {
    return {
      peakTimes: { topHours: [], distribution: new Array(24).fill(0), allHours: [] },
      durationPatterns: { preferredDuration: 0, avgDuration: 0, minDuration: 0, maxDuration: 0, consistency: 0 },
      moodPatterns: { avgPreMood: 0, avgPostMood: 0, avgImprovement: 0, improvementRate: 0 },
      streaks: { currentStreak: 0, longestStreak: 0, streakDates: [] },
      consistency: { weeklyFrequency: 0, consistency: 0, regularDays: [], missedDays: 0 },
      preferences: { preferredMode: null, preferredTimeOfDay: null, preferredDayType: null }
    };
  }
}

// Export singleton instance
export const patternDetector = new PatternDetector();
