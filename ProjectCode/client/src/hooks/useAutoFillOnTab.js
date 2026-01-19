import { useCallback } from 'react';

/**
 * Hook that returns an onKeyDown handler for auto-filling empty fields with default values on Tab.
 *
 * @param {Object} options
 * @param {Function} options.setValue - Function to set field value: (fieldName, value) => void
 * @param {Object} options.defaultValues - Object mapping field names to their default values
 * @returns {Function} onKeyDown handler to attach to input fields
 *
 * @example
 * const defaultValues = { name: 'New Event', time: '8:00 AM' };
 * const handleAutoFill = useAutoFillOnTab({
 *   setValue: (field, value) => setFormData(prev => ({ ...prev, [field]: value })),
 *   defaultValues
 * });
 *
 * <TextField name="name" onKeyDown={handleAutoFill} />
 */
export const useAutoFillOnTab = ({ setValue, defaultValues = {} }) => {
  return useCallback((event) => {
    if (event.key !== 'Tab') return;

    const input = event.target;
    const fieldName = input.name;
    const currentValue = input.value;

    // Only auto-fill if empty
    if (currentValue && currentValue.trim() !== '') return;

    // Skip date inputs and selects
    if (input.type === 'date' || input.role === 'combobox') return;

    const defaultValue = defaultValues[fieldName] || input.placeholder;
    if (!defaultValue) return;

    event.preventDefault();
    setValue(fieldName, defaultValue);
  }, [setValue, defaultValues]);
};

export default useAutoFillOnTab;
