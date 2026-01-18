/**
 * Suggestion Engine - Provides smart recommendations
 * @module ai/SuggestionEngine
 */

import { ambientDetector } from './AmbientDetector.js';

/**
 * Suggestion Engine class
 * Generates personalized suggestions for meditation sessions
 */
export class SuggestionEngine {
  /**
   * Get session suggestions based on patterns and context
   * @param {Object} patterns - Detected patterns
   * @param {Object} context - Current ambient context
   * @returns {Object} Suggestions
   */
  getSuggestions(patterns, context) {
    return {
      timing: this.suggestTiming(patterns, context),
      duration: this.suggestDuration(patterns, context),
      intervals: this.suggestIntervals(patterns),
      reminders: this.suggestReminders(patterns)
    };
  }

  /**
   * Suggest optimal timing for meditation
   * @param {Object} patterns - Detected patterns
   * @param {Object} context - Current ambient context
   * @returns {Object} Timing suggestion
   */
  suggestTiming(patterns, context) {
    const suggestions = [];

    // Current time suggestion
    const currentTimeRec = ambientDetector.getOptimalTimeRecommendation(context);
    if (currentTimeRec) {
      suggestions.push({
        type: 'now',
        confidence: currentTimeRec.confidence,
        message: currentTimeRec.message,
        data: { timeOfDay: context.timeOfDay }
      });
    }

    // Based on peak times
    if (patterns.peakTimes && patterns.peakTimes.topHours.length > 0) {
      const topHour = patterns.peakTimes.topHours[0];
      const currentHour = context.hour;

      // Suggest peak time if it's coming up soon
      const hourDiff = (topHour.hour - currentHour + 24) % 24;
      if (hourDiff > 0 && hourDiff <= 3) {
        suggestions.push({
          type: 'peak_time',
          confidence: 0.85,
          message: `Your most effective meditation time (${topHour.timeLabel}) is coming up soon.`,
          data: { suggestedHour: topHour.hour, hoursUntil: hourDiff }
        });
      }

      // Remind if user usually meditates at this time
      if (Math.abs(currentHour - topHour.hour) <= 1 && topHour.count >= 5) {
        suggestions.push({
          type: 'reminder',
          confidence: 0.9,
          message: `You typically meditate around this time. Ready for your session?`,
          data: { usualHour: topHour.hour }
        });
      }
    }

    // Haven't meditated today
    if (patterns.streaks && patterns.streaks.currentStreak > 0) {
      const today = new Date().toDateString();
      const meditatedToday = patterns.streaks.streakDates.includes(today);
      
      if (!meditatedToday) {
        suggestions.push({
          type: 'streak_protection',
          confidence: 0.95,
          message: `Don't break your ${patterns.streaks.currentStreak}-day streak! Meditate today to keep it going.`,
          data: { currentStreak: patterns.streaks.currentStreak }
        });
      }
    }

    // Sort by confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence)[0] || null;
  }

  /**
   * Suggest optimal duration
   * @param {Object} patterns - Detected patterns
   * @param {Object} context - Current ambient context
   * @returns {Object} Duration suggestion
   */
  suggestDuration(patterns, context) {
    let suggestedDuration = 300; // Default 5 minutes
    let confidence = 0.5;
    let message = 'Start with a 5-minute session.';

    // Based on preferred duration
    if (patterns.durationPatterns && patterns.durationPatterns.preferredDuration > 0) {
      const prefMinutes = Math.round(patterns.durationPatterns.preferredDuration / 60);
      suggestedDuration = patterns.durationPatterns.preferredDuration;
      confidence = patterns.durationPatterns.consistency;
      message = `Based on your history, try a ${prefMinutes}-minute session.`;
    }

    // Based on mood improvement
    if (patterns.moodPatterns && patterns.moodPatterns.bestDurationForMood) {
      const bestMinutes = Math.round(patterns.moodPatterns.bestDurationForMood / 60);
      
      if (patterns.moodPatterns.avgImprovement > 1.5) {
        suggestedDuration = patterns.moodPatterns.bestDurationForMood;
        confidence = 0.85;
        message = `${bestMinutes}-minute sessions give you the best mood improvement.`;
      }
    }

    // Adjust for time of day
    if (context.timeOfDay === 'morning' && suggestedDuration > 900) {
      // Suggest slightly shorter in morning
      const adjustedMinutes = Math.max(5, Math.round(suggestedDuration / 60) - 5);
      message += ` Morning sessions can be shorter but still effective.`;
      suggestedDuration = adjustedMinutes * 60;
    }

    if (context.timeOfDay === 'night' && suggestedDuration < 600) {
      // Suggest slightly longer at night
      const adjustedMinutes = Math.min(20, Math.round(suggestedDuration / 60) + 5);
      message += ` Evening sessions can be longer to help you unwind.`;
      suggestedDuration = adjustedMinutes * 60;
    }

    return {
      duration: suggestedDuration,
      minutes: Math.round(suggestedDuration / 60),
      confidence,
      message
    };
  }

  /**
   * Suggest bell intervals
   * @param {Object} patterns - Detected patterns
   * @returns {Object} Interval suggestions
   */
  suggestIntervals(patterns) {
    const totalSessions = patterns.durationPatterns?.totalSessions || 0;
    const avgDuration = patterns.durationPatterns?.avgDuration || 300;
    const avgMinutes = Math.round(avgDuration / 60);

    // Beginner (< 10 sessions)
    if (totalSessions < 10) {
      return {
        smallBellInterval: 3,
        bigBellInterval: 10,
        confidence: 0.7,
        message: 'As a beginner, start with shorter intervals (3 min small bells, 10 min big bells).'
      };
    }

    // Intermediate (10-30 sessions)
    if (totalSessions < 30) {
      return {
        smallBellInterval: 5,
        bigBellInterval: 15,
        confidence: 0.75,
        message: 'With some experience, try 5-minute small bells and 15-minute big bells.'
      };
    }

    // Advanced (30+ sessions)
    // Scale intervals based on typical session length
    const smallBellInterval = Math.min(10, Math.max(5, Math.floor(avgMinutes / 3)));
    const bigBellInterval = Math.min(30, Math.max(10, Math.floor(avgMinutes / 2)));

    return {
      smallBellInterval,
      bigBellInterval,
      confidence: 0.85,
      message: `Based on your ${avgMinutes}-minute sessions, try ${smallBellInterval}-min small bells and ${bigBellInterval}-min big bells.`
    };
  }

  /**
   * Suggest reminder times
   * @param {Object} patterns - Detected patterns
   * @returns {Object} Reminder suggestions
   */
  suggestReminders(patterns) {
    const suggestions = [];

    if (!patterns.peakTimes || patterns.peakTimes.topHours.length === 0) {
      return {
        times: ['07:00', '12:00', '20:00'],
        confidence: 0.5,
        message: 'Try morning, noon, and evening reminders to find what works best.'
      };
    }

    // Suggest top 3 peak hours
    patterns.peakTimes.topHours.slice(0, 3).forEach(peak => {
      const hour = peak.hour.toString().padStart(2, '0');
      suggestions.push(`${hour}:00`);
    });

    // Add one additional time if user meditates regularly
    if (patterns.consistency && patterns.consistency.weeklyFrequency >= 4) {
      // Find a gap in their schedule
      const existingHours = patterns.peakTimes.topHours.map(p => p.hour);
      const morningHour = existingHours.find(h => h >= 6 && h < 12);
      const eveningHour = existingHours.find(h => h >= 18 && h < 22);

      if (!morningHour && suggestions.length < 4) {
        suggestions.push('07:00');
      } else if (!eveningHour && suggestions.length < 4) {
        suggestions.push('20:00');
      }
    }

    return {
      times: suggestions,
      confidence: 0.8,
      message: 'These reminder times align with when you typically meditate.'
    };
  }

  /**
   * Get contextual suggestion (what to do right now)
   * @param {Object} patterns - Detected patterns
   * @param {Object} context - Current context
   * @param {Object|null} lastSession - Last meditation session
   * @returns {Object|null} Suggestion
   */
  getContextualSuggestion(patterns, context, lastSession = null) {
    // Check if it's a good time to meditate now
    const timeSinceLastSession = lastSession 
      ? (Date.now() - lastSession.endTime) / (1000 * 60 * 60) // hours
      : Infinity;

    // Haven't meditated today
    if (timeSinceLastSession > 12) {
      const durationSuggestion = this.suggestDuration(patterns, context);
      
      return {
        action: 'meditate_now',
        confidence: 0.85,
        title: 'Time to Meditate',
        message: `It's been ${Math.floor(timeSinceLastSession)} hours since your last session. ${durationSuggestion.message}`,
        data: {
          suggestedDuration: durationSuggestion.duration,
          timeSinceLastSession: Math.floor(timeSinceLastSession)
        }
      };
    }

    // Streak protection
    if (patterns.streaks && patterns.streaks.currentStreak >= 3 && timeSinceLastSession > 18) {
      return {
        action: 'protect_streak',
        confidence: 0.95,
        title: 'Protect Your Streak!',
        message: `You're on a ${patterns.streaks.currentStreak}-day streak! Meditate today to keep it alive.`,
        data: {
          currentStreak: patterns.streaks.currentStreak,
          hoursRemaining: 24 - (timeSinceLastSession % 24)
        }
      };
    }

    // Peak time opportunity
    if (patterns.peakTimes && patterns.peakTimes.topHours.length > 0) {
      const topHour = patterns.peakTimes.topHours[0];
      
      if (Math.abs(context.hour - topHour.hour) <= 1) {
        return {
          action: 'peak_time',
          confidence: 0.8,
          title: 'Your Best Time to Meditate',
          message: `${ambientDetector.formatHour(topHour.hour)} is your most effective meditation time. Perfect timing!`,
          data: {
            peakHour: topHour.hour
          }
        };
      }
    }

    return null;
  }
}

// Export singleton instance
export const suggestionEngine = new SuggestionEngine();
