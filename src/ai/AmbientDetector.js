/**
 * Ambient Context Detector - Detects environmental context
 * @module ai/AmbientDetector
 */

/**
 * Time of day categories
 */
const TIME_OF_DAY = {
  MORNING: 'morning',    // 5:00-11:59
  AFTERNOON: 'afternoon', // 12:00-16:59
  EVENING: 'evening',     // 17:00-20:59
  NIGHT: 'night'          // 21:00-4:59
};

/**
 * Day type categories
 */
const DAY_TYPE = {
  WEEKDAY: 'weekday',
  WEEKEND: 'weekend'
};

/**
 * Ambient Detector class
 * Provides simple context detection without external sensors
 */
export class AmbientDetector {
  /**
   * Get current ambient context
   * @returns {Object} Context object
   */
  getCurrentContext() {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    return {
      timestamp: Date.now(),
      hour,
      dayOfWeek,
      timeOfDay: this.getTimeOfDay(hour),
      dayType: this.getDayType(dayOfWeek),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      dayName: this.getDayName(dayOfWeek)
    };
  }

  /**
   * Get time of day category
   * @param {number} hour - Hour (0-23)
   * @returns {string} Time of day category
   */
  getTimeOfDay(hour) {
    if (hour >= 5 && hour < 12) return TIME_OF_DAY.MORNING;
    if (hour >= 12 && hour < 17) return TIME_OF_DAY.AFTERNOON;
    if (hour >= 17 && hour < 21) return TIME_OF_DAY.EVENING;
    return TIME_OF_DAY.NIGHT;
  }

  /**
   * Get day type (weekday/weekend)
   * @param {number} dayOfWeek - 0-6
   * @returns {string} Day type
   */
  getDayType(dayOfWeek) {
    return (dayOfWeek === 0 || dayOfWeek === 6) 
      ? DAY_TYPE.WEEKEND 
      : DAY_TYPE.WEEKDAY;
  }

  /**
   * Get day name
   * @param {number} dayOfWeek - 0-6
   * @returns {string} Day name
   */
  getDayName(dayOfWeek) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }

  /**
   * Format hour for display
   * @param {number} hour - Hour (0-23)
   * @returns {string} Formatted time (e.g., "7 AM", "3 PM")
   */
  formatHour(hour) {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  }

  /**
   * Detect if user is likely stressed based on context
   * (Simple heuristic - can be enhanced with mood data)
   * @param {Object} context - Context object
   * @param {Object} lastSession - Last meditation session
   * @returns {Object} Stress indicators
   */
  detectStressIndicators(context, lastSession = null) {
    const indicators = {
      isStressed: false,
      confidence: 0,
      reasons: []
    };

    // Late night meditation might indicate stress/insomnia
    if (context.timeOfDay === TIME_OF_DAY.NIGHT) {
      indicators.reasons.push('Late night meditation');
      indicators.confidence += 0.2;
    }

    // No meditation today on a weekday
    if (context.dayType === DAY_TYPE.WEEKDAY && !lastSession) {
      indicators.reasons.push('No meditation today');
      indicators.confidence += 0.1;
    }

    // Long time since last session (>3 days)
    if (lastSession && (context.timestamp - lastSession.endTime) > 3 * 24 * 60 * 60 * 1000) {
      indicators.reasons.push('Long time since last meditation');
      indicators.confidence += 0.3;
    }

    indicators.isStressed = indicators.confidence >= 0.3;
    
    return indicators;
  }

  /**
   * Get optimal meditation time recommendation based on context
   * @param {Object} context - Current context
   * @returns {Object} Recommendation
   */
  getOptimalTimeRecommendation(context) {
    const recommendations = {
      [TIME_OF_DAY.MORNING]: {
        message: 'Morning is a great time for meditation - start your day with clarity',
        confidence: 0.9
      },
      [TIME_OF_DAY.AFTERNOON]: {
        message: 'Afternoon meditation can help reset your energy for the rest of the day',
        confidence: 0.7
      },
      [TIME_OF_DAY.EVENING]: {
        message: 'Evening meditation helps transition from work mode to relaxation',
        confidence: 0.8
      },
      [TIME_OF_DAY.NIGHT]: {
        message: 'Night meditation can prepare you for restful sleep',
        confidence: 0.7
      }
    };

    return recommendations[context.timeOfDay];
  }
}

// Export singleton instance
export const ambientDetector = new AmbientDetector();

// Export constants
export { TIME_OF_DAY, DAY_TYPE };
