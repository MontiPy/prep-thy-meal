/**
 * OCR Service for extracting text from nutrition label images
 * Uses Tesseract.js for offline, privacy-first text recognition
 *
 * NOTE: Tesseract.js is dynamically imported to reduce initial bundle size
 */

let worker = null;
let tesseractModule = null;

/**
 * Dynamically import Tesseract.js (lazy load on first use)
 */
async function loadTesseract() {
  if (tesseractModule) return tesseractModule;

  tesseractModule = await import('tesseract.js');
  return tesseractModule;
}

/**
 * Initialize Tesseract worker (lazy initialization)
 */
async function initializeWorker() {
  if (worker) return worker;

  // Dynamic import of Tesseract
  const { createWorker } = await loadTesseract();

  worker = await createWorker('eng', 1);

  return worker;
}

/**
 * Preprocess image for better OCR accuracy
 * @param {File|Blob} imageFile - The image file to preprocess
 * @returns {Promise<string>} - Base64 data URL of preprocessed image
 */
async function preprocessImage(imageFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Resize if image is too large (max 2000px width/height)
        const maxDimension = 2000;
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Enhance contrast for better OCR
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Simple contrast enhancement
        const factor = 1.2; // Contrast multiplier
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));     // Red
          data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)); // Green
          data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)); // Blue
        }

        ctx.putImageData(imageData, 0, 0);

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Clean OCR text artifacts and common errors
 * @param {string} text - Raw OCR text
 * @returns {string} - Cleaned text
 */
function cleanOCRText(text) {
  let cleaned = text;

  // Common OCR corrections
  cleaned = cleaned.replace(/\bO(?=\d)/g, '0'); // O followed by digit → 0
  cleaned = cleaned.replace(/(?<=\d)O\b/g, '0'); // O after digit → 0
  cleaned = cleaned.replace(/\bl(?=\d)/g, '1'); // l followed by digit → 1
  cleaned = cleaned.replace(/(?<=\d)l\b/g, '1'); // l after digit → 1
  cleaned = cleaned.replace(/\bS(?=\d)/g, '5'); // S followed by digit → 5

  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');

  return cleaned.trim();
}

/**
 * Extract text from nutrition label image using OCR
 * @param {File|Blob|string} image - Image file, blob, or data URL
 * @param {Function} onProgress - Optional callback for progress updates (0-1)
 * @returns {Promise<Object>} Result object with success status, extracted text, and confidence
 */
export async function extractTextFromImage(image, onProgress = null) {
  try {
    // Preprocess image if it's a file/blob
    let imageToProcess = image;
    if (image instanceof File || image instanceof Blob) {
      imageToProcess = await preprocessImage(image);
    }

    // Initialize worker
    const tesseractWorker = await initializeWorker();

    // Set up progress tracking
    if (onProgress) {
      await tesseractWorker.setParameters({
        tessjs_create_pdf: '0',
      });
    }

    // Perform OCR
    const { data } = await tesseractWorker.recognize(imageToProcess, {
      rotateAuto: true, // Auto-rotate to correct orientation
    });

    // Clean OCR artifacts
    const cleanedText = cleanOCRText(data.text);

    // Calculate average confidence
    const avgConfidence = data.confidence / 100; // Convert to 0-1 range

    return {
      success: true,
      text: cleanedText,
      rawText: data.text,
      confidence: avgConfidence,
      error: null
    };

  } catch (error) {
    console.error('OCR Error:', error);
    return {
      success: false,
      text: null,
      rawText: null,
      confidence: 0,
      error: error.message || 'Failed to extract text from image'
    };
  }
}

/**
 * Terminate the Tesseract worker to free up resources
 */
export async function terminateWorker() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

/**
 * Extract nutrition data from image (combines OCR + parsing)
 * @param {File|Blob|string} image - Image file, blob, or data URL
 * @param {Function} parser - Parsing function (e.g., from smartParser.js)
 * @param {Function} onProgress - Optional callback for progress updates
 * @returns {Promise<Object>} Parsed nutrition data with confidence scores
 */
export async function extractNutritionFromImage(image, parser, onProgress = null) {
  try {
    // Step 1: Extract text from image
    if (onProgress) onProgress({ stage: 'ocr', progress: 0 });

    const ocrResult = await extractTextFromImage(image, (progress) => {
      if (onProgress) onProgress({ stage: 'ocr', progress });
    });

    if (!ocrResult.success || !ocrResult.text) {
      return {
        success: false,
        data: null,
        confidence: 0,
        error: ocrResult.error || 'No text found in image'
      };
    }

    if (onProgress) onProgress({ stage: 'parsing', progress: 0.5 });

    // Step 2: Parse extracted text
    const parsedData = parser(ocrResult.text);

    if (!parsedData || Object.keys(parsedData).length === 0) {
      return {
        success: false,
        data: null,
        confidence: ocrResult.confidence,
        error: 'Could not find nutrition information in extracted text',
        extractedText: ocrResult.text
      };
    }

    if (onProgress) onProgress({ stage: 'complete', progress: 1 });

    // Return parsed data with confidence scores
    return {
      success: true,
      data: parsedData,
      confidence: ocrResult.confidence,
      extractedText: ocrResult.text,
      error: null
    };

  } catch (error) {
    console.error('Nutrition extraction error:', error);
    return {
      success: false,
      data: null,
      confidence: 0,
      error: error.message || 'Failed to extract nutrition data from image'
    };
  }
}

export default {
  extractTextFromImage,
  extractNutritionFromImage,
  terminateWorker
};
