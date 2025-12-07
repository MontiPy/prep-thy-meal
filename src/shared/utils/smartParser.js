/**
 * Smart Parser for Nutrition Text
 * Uses heuristics and regex to extract nutrition data from unstructured text.
 * Acts as a "client-side AI" for parsing copied text.
 * Enhanced to handle OCR text artifacts and multiple label formats.
 */

/**
 * Clean common OCR artifacts in nutrition text
 * @param {string} text - Raw text (potentially from OCR)
 * @returns {string} - Cleaned text
 */
const cleanOCRTextArtifacts = (text) => {
  let cleaned = text;

  // Common OCR number confusions
  cleaned = cleaned.replace(/\bO(?=\d)/g, '0');  // O before digit → 0
  cleaned = cleaned.replace(/(?<=\d)O\b/g, '0'); // O after digit → 0
  cleaned = cleaned.replace(/\bl(?=\d)/g, '1');  // l before digit → 1
  cleaned = cleaned.replace(/(?<=\d)l\b/g, '1'); // l after digit → 1
  cleaned = cleaned.replace(/\bS(?=\d)/g, '5');  // S before digit → 5
  cleaned = cleaned.replace(/\bB\b/g, '8');      // Standalone B → 8

  // Fix common word artifacts
  cleaned = cleaned.replace(/\bprotein\s*s\b/gi, 'proteins');
  cleaned = cleaned.replace(/\bcal\s*o\s*ries\b/gi, 'calories');
  cleaned = cleaned.replace(/\bcarb\s*o\s*hydrates?\b/gi, 'carbohydrates');

  return cleaned;
};

/**
 * Calculate confidence score for parsed nutrition data
 * @param {Object} result - Parsed nutrition data
 * @returns {Object} - Confidence scores for each field
 */
const calculateConfidence = (result) => {
  const confidence = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    servingSize: 0,
    overall: 0
  };

  // Calories confidence (typically 50-2000 kcal per serving is reasonable)
  if (result.calories > 0) {
    if (result.calories >= 20 && result.calories <= 2000) {
      confidence.calories = 0.9;
    } else if (result.calories > 2000 && result.calories <= 5000) {
      confidence.calories = 0.5; // Possible but unusual
    } else if (result.calories < 20 && result.calories > 0) {
      confidence.calories = 0.6; // Low but possible for very small servings
    }
  }

  // Protein confidence (typically 0-100g per serving)
  if (result.protein >= 0 && result.protein <= 100) {
    confidence.protein = 0.9;
  } else if (result.protein > 100) {
    confidence.protein = 0.3; // Unlikely unless pure protein powder
  }

  // Carbs confidence (typically 0-200g per serving)
  if (result.carbs >= 0 && result.carbs <= 200) {
    confidence.carbs = 0.9;
  } else if (result.carbs > 200) {
    confidence.carbs = 0.4;
  }

  // Fat confidence (typically 0-100g per serving)
  if (result.fat >= 0 && result.fat <= 100) {
    confidence.fat = 0.9;
  } else if (result.fat > 100) {
    confidence.fat = 0.4;
  }

  // Serving size confidence
  if (result.servingSize > 0 && result.servingSize <= 1000) {
    confidence.servingSize = 0.9;
  } else if (result.servingSize > 1000) {
    confidence.servingSize = 0.5;
  }

  // Validate calorie calculation (4-4-9 rule: protein*4 + carbs*4 + fat*9)
  if (result.calories > 0 && result.protein >= 0 && result.carbs >= 0 && result.fat >= 0) {
    const calculatedCalories = (result.protein * 4) + (result.carbs * 4) + (result.fat * 9);
    const diff = Math.abs(result.calories - calculatedCalories);
    const percentDiff = calculatedCalories > 0 ? (diff / calculatedCalories) * 100 : 100;

    if (percentDiff <= 10) {
      // Calorie breakdown matches well
      confidence.overall = 0.95;
    } else if (percentDiff <= 25) {
      confidence.overall = 0.7;
    } else {
      confidence.overall = 0.5; // Suspicious mismatch
    }
  } else {
    // Calculate overall as average of individual confidences
    const scores = [confidence.calories, confidence.protein, confidence.carbs, confidence.fat];
    const validScores = scores.filter(s => s > 0);
    confidence.overall = validScores.length > 0
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length
      : 0;
  }

  return confidence;
};

export const parseNutritionText = (text, options = {}) => {
  if (!text) return null;

  // Clean OCR artifacts if enabled (default: true)
  const cleanOCR = options.cleanOCR !== false;
  const cleanedText = cleanOCR ? cleanOCRTextArtifacts(text) : text;

  const result = {
    name: '',
    servingSize: 100,
    servingUnit: 'g',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  const lowerText = cleanedText.toLowerCase();

  // 1. Extract Macros (most robust part)
  // Matches: "165 kcal", "165 calories", "31g protein", "31 g p", "Protein: 31"
  
  // Calories
  const calMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*(?:kcal|calories|cals|cal)/i) ||
                   lowerText.match(/(?:energy|calories)[:\s]+(\d+(?:\.\d+)?)/i);
  if (calMatch) result.calories = parseFloat(calMatch[1]);

  // Protein - enhanced to handle FDA label format
  const proMatch = lowerText.match(/(?:total\s+)?protein\s+(\d+(?:\.\d+)?)\s*g/i) ||  // "Protein 4 g"
                   lowerText.match(/(\d+(?:\.\d+)?)\s*g?\s*(?:protein|prot)\b/i) ||  // "4g protein"
                   lowerText.match(/(?:protein|prot)[:\s]+(\d+(?:\.\d+)?)/i);  // "Protein: 4"
  if (proMatch) result.protein = parseFloat(proMatch[1]);

  // Carbs - enhanced to handle "Total Carbohydrate" format
  const carbMatch = lowerText.match(/(?:total\s+)?(?:carbohydrate|carbs|carb)s?\s+(\d+(?:\.\d+)?)\s*g/i) ||  // "Total Carbohydrate 26 g"
                    lowerText.match(/(\d+(?:\.\d+)?)\s*g?\s*(?:carbs|carbohydrate|carb)\b/i) ||  // "26g carbs"
                    lowerText.match(/(?:carbohydrate|carbs|carb)s?[:\s]+(\d+(?:\.\d+)?)/i);  // "Carbs: 26"
  if (carbMatch) result.carbs = parseFloat(carbMatch[1]);

  // Fat - enhanced to handle "Total Fat" format
  const fatMatch = lowerText.match(/(?:total\s+)?fat\s+(\d+(?:\.\d+)?)\s*g/i) ||  // "Total Fat 1 g"
                   lowerText.match(/(\d+(?:\.\d+)?)\s*g?\s*(?:fat|fats)\b/i) ||  // "1g fat"
                   lowerText.match(/(?:fat|fats)[:\s]+(\d+(?:\.\d+)?)/i);  // "Fat: 1"
  if (fatMatch) result.fat = parseFloat(fatMatch[1]);

  // 2. Extract Serving Size
  // Matches: "100g", "1 cup", "1 scoop (30g)"
  
  // Try to find gram weight first
  const weightMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*(?:g|ml)\b/i);
  if (weightMatch) {
    result.servingSize = parseFloat(weightMatch[1]);
    result.servingUnit = lowerText.includes('ml') ? 'ml' : 'g';
  } else {
    // Check for unit types
    const unitMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*(?:cup|tbsp|tsp|oz|ounce|slice|piece|scoop)/i);
    if (unitMatch) {
      result.servingSize = parseFloat(unitMatch[1]);
      result.servingUnit = 'unit';
      result.servingLabel = unitMatch[0]; // e.g., "1 scoop"
    }
  }

  // 3. Extract Name (Heuristic: usually at the start, before numbers)
  // Split by newline or comma, take first part that isn't just numbers/macros
  const lines = cleanedText.split(/[\n,]/);
  for (const line of lines) {
    const cleanLine = line.trim();
    // If line has letters and isn't just a macro label
    if (cleanLine.length > 2 && !cleanLine.match(/^(calories|protein|carbs|fat|kcal|nutrition|facts|serving|size|amount|per|total)/i)) {
      // Strip out numbers if they look like macros
      const namePart = cleanLine.replace(/(\d+(?:\.\d+)?)\s*(?:g|kcal|cal|%|mg|mcg)/gi, '').trim();
      if (namePart.length > 2 && !/^\d+$/.test(namePart)) {
        result.name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        break;
      }
    }
  }

  // Calculate confidence scores
  const confidence = calculateConfidence(result);

  // Return result with confidence scores if requested
  if (options.includeConfidence) {
    return {
      ...result,
      confidence
    };
  }

  return result;
};
