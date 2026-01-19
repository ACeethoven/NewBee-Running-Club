/**
 * Translation utility for English/Chinese text
 * Uses MyMemory API (free tier: 1000 words/day)
 */

import { commonTranslations } from '../data/commonTranslations';

// Cache for API translations to reduce duplicate calls
const translationCache = new Map();

/**
 * Detect if text is primarily Chinese
 * @param {string} text - Text to analyze
 * @returns {'zh'|'en'} - Detected language
 */
export const detectLanguage = (text) => {
  if (!text) return 'en';

  // Count Chinese characters (CJK Unified Ideographs)
  const chineseChars = text.match(/[\u4e00-\u9fff]/g);
  const chineseCount = chineseChars ? chineseChars.length : 0;

  // If more than 30% of characters are Chinese, consider it Chinese
  const totalChars = text.replace(/\s/g, '').length;
  return totalChars > 0 && (chineseCount / totalChars) > 0.3 ? 'zh' : 'en';
};

/**
 * Check common translations cache first
 * @param {string} text - Text to look up
 * @param {string} targetLang - Target language ('en' or 'zh')
 * @returns {string|null} - Cached translation or null
 */
const checkCommonTranslations = (text, targetLang) => {
  const normalizedText = text.trim().toLowerCase();

  for (const [en, zh] of Object.entries(commonTranslations)) {
    if (targetLang === 'zh' && en.toLowerCase() === normalizedText) {
      return zh;
    }
    if (targetLang === 'en' && zh === text.trim()) {
      return en;
    }
  }
  return null;
};

/**
 * Translate text between English and Chinese using MyMemory API
 * @param {string} text - Text to translate
 * @param {'en'|'zh'} from - Source language
 * @param {'en'|'zh'} to - Target language
 * @returns {Promise<string>} - Translated text or original if failed
 */
export const translateText = async (text, from, to) => {
  if (!text || !text.trim()) return '';

  const trimmedText = text.trim();

  // Check common translations first (fast, no API call)
  const commonTranslation = checkCommonTranslations(trimmedText, to);
  if (commonTranslation) {
    return commonTranslation;
  }

  // Check cache
  const cacheKey = `${trimmedText}:${from}:${to}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  // Map language codes for MyMemory API
  const langMap = {
    'en': 'en',
    'zh': 'zh-CN'
  };

  try {
    const params = new URLSearchParams({
      q: trimmedText,
      langpair: `${langMap[from]}|${langMap[to]}`
    });

    const response = await fetch(
      `https://api.mymemory.translated.net/get?${params}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.warn('Translation API returned non-OK status:', response.status);
      return trimmedText;
    }

    const data = await response.json();

    // Check for valid translation response
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText;

      // Don't cache if it's just returning the same text (failed translation)
      if (translated.toLowerCase() !== trimmedText.toLowerCase()) {
        translationCache.set(cacheKey, translated);
      }

      return translated;
    }

    // Fallback to original text if translation failed
    return trimmedText;
  } catch (error) {
    console.warn('Translation API error:', error.message);
    return trimmedText;
  }
};

/**
 * Auto-detect source language and translate
 * @param {string} text - Text to translate
 * @returns {Promise<{translation: string, detectedLang: string, targetLang: string}>}
 */
export const autoTranslate = async (text) => {
  const detectedLang = detectLanguage(text);
  const targetLang = detectedLang === 'zh' ? 'en' : 'zh';

  const translation = await translateText(text, detectedLang, targetLang);

  return {
    translation,
    detectedLang,
    targetLang
  };
};

export default translateText;
