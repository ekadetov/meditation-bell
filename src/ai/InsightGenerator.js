/**
 * Insight Generator - Generates personalized insights from patterns
 * @module ai/InsightGenerator
 */

import { ambientDetector } from './AmbientDetector.js';
import { patternDetector } from './PatternDetector.js';

/**
 * Insight Generator class
 * Creates human-readable insights from detected patterns
 */
export class InsightGenerator {
  /**
   * Generate all insights from patterns
   * @param {Object} patterns - Detected patterns
   * @param {Array} sessions - Session data
   * @returns {Array} Generated insights
   */
  generateAll(patterns, sessions = []) {
    const insights = [];

    // Peak time insights
    insights.push(...this.generatePeakTimeInsights(patterns.peakTimes));

    // Duration insights
    insights.push(...this.generateDurationInsights(patterns.durationPatterns));

    // Mood insights
    insights.push(...this.generateMoodInsights(patterns.moodPatterns));

    // Streak insights
    insights.push(...this.generateStreakInsights(patterns.streaks));

    // Consistency insights
    insights.push(...this.generateConsistencyInsights(patterns.consistency));

    // Filter out null insights and those with low confidence
    return insights
      .filter(insight => insight !== null && insight.confidence >= 0.6)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate peak time insights
   * @param {Object} peakTimes - Peak times data
   * @returns {Array} Insights
   */
  generatePeakTimeInsights(peakTimes) {
    const insights = [];

    if (peakTimes.topHours.length > 0) {
      const topHour = peakTimes.topHours[0];
      
      if (topHour.count >= 3) {
        insights.push({
          type: 'pattern',
          category: 'time_preference',
          confidence: Math.min(0.9, 0.6 + (topHour.count / 20)), // Higher count = higher confidence
          title: 'Your Peak Meditation Time',
          message: `You meditate most effectively at ${topHour.timeLabel}. Your mood improves by ${Math.abs(topHour.avgMoodDelta).toFixed(1)} points on average during this time.`,
          data: { hour: topHour.hour, count: topHour.count, moodDelta: topHour.avgMoodDelta }
        });
      }

      // Insight about morning meditation
      const morningHours = peakTimes.topHours.filter(h => h.hour >= 5 && h.hour < 12);
      if (morningHours.length > 0 && morningHours[0].count >= 3) {
        insights.push({
          type: 'pattern',
          category: 'morning_practice',
          confidence: 0.75,
          title: 'Morning Meditation Routine',
          message: `You've established a morning meditation practice! Morning sessions help you start the day with clarity and calm.`,
          data: { morningCount: morningHours[0].count }
        });
      }

      // Insight about evening meditation
      const eveningHours = peakTimes.topHours.filter(h => h.hour >= 17 && h.hour < 21);
      if (eveningHours.length > 0 && eveningHours[0].count >= 3) {
        insights.push({
          type: 'pattern',
          category: 'evening_practice',
          confidence: 0.75,
          title: 'Evening Wind-Down Ritual',
          message: `Evening meditation at ${ambientDetector.formatHour(eveningHours[0].hour)} helps you transition from work to relaxation.`,
          data: { eveningHour: eveningHours[0].hour }
        });
      }
    }

    return insights;
  }

  /**
   * Generate duration insights
   * @param {Object} durationPatterns - Duration patterns
   * @returns {Array} Insights
   */
  generateDurationInsights(durationPatterns) {
    const insights = [];

    if (durationPatterns.totalSessions >= 5) {
      const prefMinutes = Math.round(durationPatterns.preferredDuration / 60);
      
      insights.push({
        type: 'pattern',
        category: 'duration_preference',
        confidence: durationPatterns.consistency,
        title: 'Your Preferred Session Length',
        message: `You typically meditate for about ${prefMinutes} minutes. This consistent practice helps build a sustainable habit.`,
        data: { preferredDuration: durationPatterns.preferredDuration }
      });

      // Suggest gradual increase if sessions are short
      if (prefMinutes < 10 && durationPatterns.consistency > 0.7) {
        insights.push({
          type: 'suggestion',
          category: 'duration_increase',
          confidence: 0.7,
          title: 'Ready for a Challenge?',
          message: `You've been consistent with ${prefMinutes}-minute sessions. Try gradually increasing to ${prefMinutes + 2}-${prefMinutes + 5} minutes to deepen your practice.`,
          data: { currentDuration: prefMinutes, suggestedDuration: prefMinutes + 5 }
        });
      }

      // Congratulate on longer sessions
      if (prefMinutes >= 20) {
        insights.push({
          type: 'achievement',
          category: 'long_sessions',
          confidence: 0.9,
          title: 'Deep Practice Achieved',
          message: `${prefMinutes}-minute sessions show real commitment! You're experiencing the benefits of sustained meditation.`,
          data: { duration: prefMinutes }
        });
      }
    }

    return insights;
  }

  /**
   * Generate mood insights
   * @param {Object} moodPatterns - Mood patterns
   * @returns {Array} Insights
   */
  generateMoodInsights(moodPatterns) {
    const insights = [];

    if (moodPatterns.totalSessionsWithMood >= 5) {
      // Overall mood improvement
      if (moodPatterns.avgImprovement > 1) {
        insights.push({
          type: 'achievement',
          category: 'mood_improvement',
          confidence: 0.85,
          title: 'Meditation is Working!',
          message: `Your mood improves by ${moodPatterns.avgImprovement.toFixed(1)} points on average after meditation. That's a ${moodPatterns.improvementRate}% improvement rate!`,
          data: { avgImprovement: moodPatterns.avgImprovement, improvementRate: moodPatterns.improvementRate }
        });
      }

      // Best time for mood improvement
      if (moodPatterns.bestTimeForMood) {
        const timeLabel = moodPatterns.bestTimeForMood.charAt(0).toUpperCase() + 
                         moodPatterns.bestTimeForMood.slice(1);
        
        insights.push({
          type: 'pattern',
          category: 'best_mood_time',
          confidence: 0.8,
          title: `${timeLabel} Sessions Boost Your Mood Most`,
          message: `${timeLabel} meditation sessions provide the greatest mood improvement for you. Consider prioritizing this time when you need a mental reset.`,
          data: { bestTime: moodPatterns.bestTimeForMood }
        });
      }

      // Best duration for mood
      if (moodPatterns.bestDurationForMood) {
        const minutes = Math.round(moodPatterns.bestDurationForMood / 60);
        
        insights.push({
          type: 'suggestion',
          category: 'optimal_duration',
          confidence: 0.75,
          title: 'Your Optimal Session Length',
          message: `${minutes}-minute sessions seem to be your sweet spot for mood improvement. Try to maintain this duration when possible.`,
          data: { optimalDuration: moodPatterns.bestDurationForMood }
        });
      }

      // High pre-meditation stress pattern
      if (moodPatterns.avgPreMood < 5) {
        insights.push({
          type: 'pattern',
          category: 'stress_pattern',
          confidence: 0.7,
          title: 'Meditation as Stress Relief',
          message: `You often start meditation feeling stressed (average mood: ${moodPatterns.avgPreMood.toFixed(1)}/10). The good news: meditation consistently helps you feel better!`,
          data: { avgPreMood: moodPatterns.avgPreMood }
        });
      }
    }

    return insights;
  }

  /**
   * Generate streak insights
   * @param {Object} streaks - Streak data
   * @returns {Array} Insights
   */
  generateStreakInsights(streaks) {
    const insights = [];

    // Current streak achievements
    if (streaks.currentStreak >= 3) {
      const confidence = Math.min(1.0, 0.7 + (streaks.currentStreak / 30));
      const emoji = streaks.currentStreak >= 7 ? '🎉' : streaks.currentStreak >= 5 ? '🌟' : '🙂';
      
      insights.push({
        type: 'achievement',
        category: 'streak',
        confidence,
        title: `${streaks.currentStreak}-Day Streak! ${emoji}`,
        message: `You've meditated ${streaks.currentStreak} days in a row! Consistency is key to building a lasting practice.`,
        data: { currentStreak: streaks.currentStreak }
      });
    }

    // Milestone streaks
    if (streaks.currentStreak >= 7 && streaks.currentStreak < 14) {
      insights.push({
        type: 'encouragement',
        category: 'streak_milestone',
        confidence: 0.9,
        title: 'One Week Strong!',
        message: `Seven days of consistent practice! You're well on your way to making meditation a habit. Keep going!`,
        data: { streak: streaks.currentStreak }
      });
    }

    if (streaks.currentStreak >= 30) {
      insights.push({
        type: 'achievement',
        category: 'streak_milestone',
        confidence: 1.0,
        title: '30-Day Meditation Master!',
        message: `Incredible! A full month of daily meditation. This level of commitment transforms lives. 🏆`,
        data: { streak: streaks.currentStreak }
      });
    }

    // Longest streak (if different from current)
    if (streaks.longestStreak > streaks.currentStreak && streaks.longestStreak >= 5) {
      insights.push({
        type: 'encouragement',
        category: 'streak_record',
        confidence: 0.75,
        title: 'You Can Beat Your Record!',
        message: `Your longest streak was ${streaks.longestStreak} days. You've done it before - you can do it again!`,
        data: { longestStreak: streaks.longestStreak, currentStreak: streaks.currentStreak }
      });
    }

    return insights;
  }

  /**
   * Generate consistency insights
   * @param {Object} consistency - Consistency data
   * @returns {Array} Insights
   */
  generateConsistencyInsights(consistency) {
    const insights = [];

    if (consistency.totalRecentSessions >= 7) {
      // High consistency
      if (consistency.weeklyFrequency >= 5) {
        insights.push({
          type: 'achievement',
          category: 'consistency',
          confidence: 0.9,
          title: 'Highly Consistent Practice',
          message: `You're meditating ${consistency.weeklyFrequency.toFixed(1)} times per week! This regular practice is transformative.`,
          data: { weeklyFrequency: consistency.weeklyFrequency }
        });
      }

      // Regular days pattern
      if (consistency.regularDays.length >= 3) {
        const dayNames = consistency.regularDays.map(d => 
          ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]
        );
        
        insights.push({
          type: 'pattern',
          category: 'regular_schedule',
          confidence: 0.8,
          title: 'Established Routine',
          message: `You consistently meditate on ${dayNames.join(', ')}. This predictable schedule makes your practice sustainable.`,
          data: { regularDays: consistency.regularDays }
        });
      }

      // Suggest improvement if consistency is low
      if (consistency.weeklyFrequency < 3 && consistency.consistency < 50) {
        insights.push({
          type: 'suggestion',
          category: 'consistency_improvement',
          confidence: 0.7,
          title: 'Build More Consistency',
          message: `Try setting a specific time each day for meditation. Even 5 minutes daily is more beneficial than longer, irregular sessions.`,
          data: { currentFrequency: consistency.weeklyFrequency }
        });
      }
    }

    return insights;
  }

  /**
   * Generate encouragement insight
   * @param {number} totalSessions - Total number of sessions
   * @returns {Object|null} Insight
   */
  generateEncouragement(totalSessions) {
    if (totalSessions === 0) {
      return {
        type: 'encouragement',
        category: 'getting_started',
        confidence: 1.0,
        title: 'Begin Your Journey',
        message: `Welcome! Starting a meditation practice is a gift to yourself. Even a few minutes can make a difference.`,
        data: {}
      };
    }

    if (totalSessions === 1) {
      return {
        type: 'encouragement',
        category: 'first_session',
        confidence: 1.0,
        title: 'Great Start!',
        message: `You've completed your first session! The hardest part is beginning. Keep going!`,
        data: { totalSessions: 1 }
      };
    }

    if (totalSessions === 10) {
      return {
        type: 'achievement',
        category: 'milestone',
        confidence: 1.0,
        title: '10 Sessions Completed!',
        message: `Ten sessions is a significant milestone. You're building a meaningful practice!`,
        data: { totalSessions: 10 }
      };
    }

    if (totalSessions === 50) {
      return {
        type: 'achievement',
        category: 'milestone',
        confidence: 1.0,
        title: '50 Sessions - Half Century!',
        message: `Fifty meditation sessions! You're well on your way to mastery. 🎯`,
        data: { totalSessions: 50 }
      };
    }

    if (totalSessions === 100) {
      return {
        type: 'achievement',
        category: 'milestone',
        confidence: 1.0,
        title: '100 Sessions - Century Mark!',
        message: `One hundred meditation sessions! This is dedication. You've truly transformed your practice into a lifestyle. 🏆`,
        data: { totalSessions: 100 }
      };
    }

    return null;
  }
}

// Export singleton instance
export const insightGenerator = new InsightGenerator();
