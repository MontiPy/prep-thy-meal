/**
 * Meal Timing Utilities
 * Support for meal scheduling and intermittent fasting windows
 */

/**
 * Parse time string to minutes since midnight
 * @param {string} timeStr - Time string (HH:MM format, 24-hour)
 * @returns {number} Minutes since midnight
 */
export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;

  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;

  return hours * 60 + minutes;
};

/**
 * Convert minutes since midnight to time string
 * @param {number} minutes - Minutes since midnight
 * @returns {string} Time string (HH:MM format)
 */
export const minutesToTimeString = (minutes) => {
  if (minutes === null || minutes === undefined) return '';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Calculate hours between two times
 * Handles day wrapping (e.g., 22:00 to 06:00 = 8 hours)
 * @param {number} startMinutes - Start time in minutes
 * @param {number} endMinutes - End time in minutes
 * @returns {number} Hours between
 */
export const calculateHoursBetween = (startMinutes, endMinutes) => {
  if (startMinutes === null || endMinutes === null) return null;

  let diff = endMinutes - startMinutes;

  // Handle day wrapping
  if (diff <= 0) {
    diff += 24 * 60;
  }

  return Math.round((diff / 60) * 10) / 10;
};

/**
 * Detect intermittent fasting window
 * Returns the eating and fasting window durations
 * @param {Array} mealTimes - Array of meal times (minutes since midnight)
 * @returns {Object} Fasting window info
 */
export const detectFastingWindow = (mealTimes) => {
  if (!mealTimes || mealTimes.length === 0) {
    return {
      eatingWindow: null,
      fastingWindow: null,
      detected: false,
    };
  }

  const validTimes = mealTimes.filter(t => t !== null && t !== undefined);
  if (validTimes.length < 2) {
    return {
      eatingWindow: null,
      fastingWindow: null,
      detected: false,
    };
  }

  validTimes.sort((a, b) => a - b);

  const firstMeal = validTimes[0];
  const lastMeal = validTimes[validTimes.length - 1];

  const eatingWindow = calculateHoursBetween(firstMeal, lastMeal);
  const fastingWindow = 24 - eatingWindow;

  return {
    eatingWindow,
    fastingWindow,
    detected: true,
    firstMealTime: minutesToTimeString(firstMeal),
    lastMealTime: minutesToTimeString(lastMeal),
  };
};

/**
 * Get common intermittent fasting protocols
 * @returns {Object} IF protocols with descriptions
 */
export const getIFProtocols = () => {
  return {
    '16:8': {
      name: '16:8 (Leangains)',
      fastingWindow: 16,
      eatingWindow: 8,
      description: '16 hours fasting, 8 hours eating',
      exampleSchedule: 'Noon - 8 PM eating window',
    },
    '18:6': {
      name: '18:6',
      fastingWindow: 18,
      eatingWindow: 6,
      description: '18 hours fasting, 6 hours eating',
      exampleSchedule: 'Noon - 6 PM eating window',
    },
    '20:4': {
      name: '20:4 (OMAD prep)',
      fastingWindow: 20,
      eatingWindow: 4,
      description: '20 hours fasting, 4 hours eating',
      exampleSchedule: '4 PM - 8 PM eating window',
    },
    '23:1': {
      name: '23:1 (OMAD)',
      fastingWindow: 23,
      eatingWindow: 1,
      description: '23 hours fasting, 1 hour eating',
      exampleSchedule: 'Single meal per day',
    },
    '5:2': {
      name: '5:2 (Eat-Stop-Eat variant)',
      fastingWindow: null,
      eatingWindow: null,
      description: '5 days normal eating, 2 days very light',
      exampleSchedule: 'Normal meals 5 days, light meals 2 days',
    },
  };
};

/**
 * Check if meal timing fits within IF window
 * @param {string} mealTime - Meal time (HH:MM)
 * @param {string} eatingWindowStart - Start of eating window (HH:MM)
 * @param {string} eatingWindowEnd - End of eating window (HH:MM)
 * @returns {boolean} True if meal is within window
 */
export const isMealWithinWindow = (mealTime, eatingWindowStart, eatingWindowEnd) => {
  const mealMin = parseTimeToMinutes(mealTime);
  const startMin = parseTimeToMinutes(eatingWindowStart);
  const endMin = parseTimeToMinutes(eatingWindowEnd);

  if (mealMin === null || startMin === null || endMin === null) {
    return null;
  }

  // Handle day wrapping
  if (startMin > endMin) {
    return mealMin >= startMin || mealMin <= endMin;
  }

  return mealMin >= startMin && mealMin <= endMin;
};

/**
 * Get meal distribution suggestions for IF protocol
 * @param {string} protocol - Protocol type ('16:8', '18:6', etc.)
 * @param {string} eatingWindowStart - Start time (HH:MM)
 * @returns {Array} Suggested meal times
 */
export const getSuggestedMealTimes = (protocol, eatingWindowStart) => {
  const protocols = getIFProtocols();
  const config = protocols[protocol];

  if (!config || config.eatingWindow === null) {
    return [];
  }

  const startMin = parseTimeToMinutes(eatingWindowStart);
  if (startMin === null) return [];

  const endMin = startMin + config.eatingWindow * 60;
  const windowDuration = config.eatingWindow * 60;

  // Suggest meal times spread throughout eating window
  const mealCount = Math.min(3, Math.ceil(config.eatingWindow / 4)); // Max 3 meals, 1 every 4 hours
  const suggestions = [];

  for (let i = 0; i < mealCount; i++) {
    const mealMin = startMin + (windowDuration / (mealCount + 1)) * (i + 1);
    const adjustedMin = mealMin % (24 * 60); // Handle day wrapping

    suggestions.push({
      time: minutesToTimeString(Math.round(adjustedMin)),
      meal: ['Breakfast', 'Lunch', 'Dinner', 'Snack'][i] || `Meal ${i + 1}`,
    });
  }

  return suggestions;
};

/**
 * Validate meal timing schedule
 * @param {Object} mealTimings - Object with meal times
 * @returns {Object} Validation result
 */
export const validateMealTimings = (mealTimings) => {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (!mealTimings || Object.keys(mealTimings).length === 0) {
    results.warnings.push('No meal times specified');
    return results;
  }

  const times = Object.values(mealTimings)
    .map(t => (typeof t === 'string' ? parseTimeToMinutes(t) : t))
    .filter(t => t !== null);

  if (times.length === 0) {
    results.errors.push('No valid meal times found');
    results.valid = false;
    return results;
  }

  // Check for duplicate times
  const uniqueTimes = new Set(times);
  if (uniqueTimes.size < times.length) {
    results.warnings.push('Multiple meals scheduled at same time');
  }

  // Check if times make sense chronologically
  const sorted = [...times].sort((a, b) => a - b);
  if (sorted[sorted.length - 1] - sorted[0] > 16 * 60) {
    results.warnings.push('Meals span over 16 hours (consider spreading them out)');
  }

  return results;
};
