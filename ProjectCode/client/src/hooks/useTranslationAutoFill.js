import { useState, useCallback, useRef, useEffect } from 'react';
import { translateText, detectLanguage } from '../utils/translate';

/**
 * Hook that provides auto-translation for paired bilingual form fields.
 * When text is entered in one field, a translation suggestion is generated
 * for the paired field. On Tab or focus, the translation auto-fills if the target is empty.
 *
 * @param {Object} options
 * @param {Function} options.setValue - Function to set field value: (fieldName, value) => void
 * @param {Function} options.getValue - Function to get field value: (fieldName) => string
 * @param {Array} options.fieldPairs - Array of [englishField, chineseField] pairs
 * @param {number} options.debounceMs - Debounce delay in ms (default: 500)
 * @returns {Object} { handleKeyDown, handleBlur, translations, isTranslating }
 *
 * @example
 * const { handleKeyDown, handleBlur, translations, isTranslating } = useTranslationAutoFill({
 *   setValue: (field, value) => setFormData(prev => ({ ...prev, [field]: value })),
 *   getValue: (field) => formData[field],
 *   fieldPairs: [
 *     ['name', 'chinese_name'],
 *     ['description', 'chinese_description']
 *   ]
 * });
 *
 * <TextField
 *   name="chinese_name"
 *   value={formData.chinese_name}
 *   placeholder={translations.chinese_name || '中文名称'}
 *   onKeyDown={handleKeyDown}
 *   onBlur={handleBlur}
 * />
 */
export const useTranslationAutoFill = ({
  setValue,
  getValue,
  fieldPairs = [],
  debounceMs = 500
}) => {
  // Store translation suggestions for each field
  const [translations, setTranslations] = useState({});
  // Track which fields are currently being translated
  const [isTranslating, setIsTranslating] = useState(false);
  // Debounce timers
  const debounceTimers = useRef({});
  // Track last translated values to avoid duplicate translations
  const lastTranslated = useRef({});

  // Build field mapping for quick lookups
  const fieldMap = useRef({});
  useEffect(() => {
    const map = {};
    fieldPairs.forEach(([enField, zhField]) => {
      map[enField] = { pair: zhField, isEnglish: true };
      map[zhField] = { pair: enField, isEnglish: false };
    });
    fieldMap.current = map;
  }, [fieldPairs]);

  /**
   * Trigger translation for a field's paired field
   */
  const triggerTranslation = useCallback(async (sourceField, sourceValue) => {
    const mapping = fieldMap.current[sourceField];
    if (!mapping) return;

    const { pair: targetField, isEnglish } = mapping;

    // Don't translate empty values
    if (!sourceValue || !sourceValue.trim()) {
      setTranslations(prev => {
        const next = { ...prev };
        delete next[targetField];
        return next;
      });
      return;
    }

    // Don't re-translate if value hasn't changed
    if (lastTranslated.current[sourceField] === sourceValue) {
      return;
    }

    // Determine source and target languages
    const fromLang = isEnglish ? 'en' : 'zh';
    const toLang = isEnglish ? 'zh' : 'en';

    // Auto-detect might override for mixed content
    const detectedLang = detectLanguage(sourceValue);

    // If detected language matches target, user might be typing in wrong field
    // In that case, don't generate a suggestion
    if (detectedLang === toLang) {
      return;
    }

    setIsTranslating(true);
    try {
      const translated = await translateText(sourceValue, fromLang, toLang);

      // Only set translation if it's different from source
      if (translated && translated !== sourceValue) {
        lastTranslated.current[sourceField] = sourceValue;
        setTranslations(prev => ({
          ...prev,
          [targetField]: translated
        }));
      }
    } catch (error) {
      console.warn('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  }, []);

  /**
   * Handle blur event - trigger translation with debounce
   */
  const handleBlur = useCallback((event) => {
    const input = event.target;
    const fieldName = input.name;
    const currentValue = input.value;

    // Clear any existing debounce timer for this field
    if (debounceTimers.current[fieldName]) {
      clearTimeout(debounceTimers.current[fieldName]);
    }

    // Set new debounce timer
    debounceTimers.current[fieldName] = setTimeout(() => {
      triggerTranslation(fieldName, currentValue);
    }, debounceMs);
  }, [triggerTranslation, debounceMs]);

  /**
   * Handle key down - on Tab, auto-fill empty target field with translation
   */
  const handleKeyDown = useCallback((event) => {
    if (event.key !== 'Tab') return;

    const input = event.target;
    const fieldName = input.name;
    const currentValue = input.value;

    const mapping = fieldMap.current[fieldName];

    // If we have a translation suggestion for this field and it's empty, auto-fill
    if (translations[fieldName] && (!currentValue || !currentValue.trim())) {
      event.preventDefault();
      setValue(fieldName, translations[fieldName]);

      // Clear the used translation
      setTranslations(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
      return;
    }

    // If leaving a source field with content, trigger translation for target
    if (mapping && currentValue && currentValue.trim()) {
      const targetField = mapping.pair;
      const targetValue = getValue(targetField);

      // Only trigger if target is empty
      if (!targetValue || !targetValue.trim()) {
        triggerTranslation(fieldName, currentValue);
      }
    }
  }, [translations, setValue, getValue, triggerTranslation]);

  /**
   * Handle focus - if entering an empty field with a translation, show it
   * Can be used to auto-fill on focus instead of Tab
   */
  const handleFocus = useCallback((event) => {
    const input = event.target;
    const fieldName = input.name;
    const currentValue = input.value;

    // If field is empty and we have a translation, user might want to use it
    // The translation is shown as placeholder, user can Tab to accept
    if (translations[fieldName] && (!currentValue || !currentValue.trim())) {
      // Translation is already in state, will show as placeholder
    }
  }, [translations]);

  /**
   * Clear translation for a specific field
   */
  const clearTranslation = useCallback((fieldName) => {
    setTranslations(prev => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  /**
   * Clear all translations
   */
  const clearAllTranslations = useCallback(() => {
    setTranslations({});
    lastTranslated.current = {};
  }, []);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, []);

  return {
    handleKeyDown,
    handleBlur,
    handleFocus,
    translations,
    isTranslating,
    clearTranslation,
    clearAllTranslations
  };
};

export default useTranslationAutoFill;
