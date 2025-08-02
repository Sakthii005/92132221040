import { ValidationResult } from '../types';

export const validationUtils = {
  validateUrl(url: string): ValidationResult {
    const errors: string[] = [];
    
    if (!url.trim()) {
      errors.push('URL is required');
    } else {
      try {
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          errors.push('URL must use http or https protocol');
        }
      } catch {
        errors.push('Please enter a valid URL');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateValidityPeriod(minutes: number): ValidationResult {
    const errors: string[] = [];
    
    if (minutes <= 0) {
      errors.push('Validity period must be a positive number');
    } else if (minutes > 10080) { // 7 days
      errors.push('Validity period cannot exceed 7 days (10080 minutes)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateShortcode(shortcode: string, existingCodes: string[]): ValidationResult {
    const errors: string[] = [];
    
    if (shortcode.trim()) {
      if (shortcode.length < 3) {
        errors.push('Shortcode must be at least 3 characters long');
      } else if (shortcode.length > 20) {
        errors.push('Shortcode cannot exceed 20 characters');
      } else if (!/^[a-zA-Z0-9_-]+$/.test(shortcode)) {
        errors.push('Shortcode can only contain letters, numbers, hyphens, and underscores');
      } else if (existingCodes.includes(shortcode.toLowerCase())) {
        errors.push('This shortcode is already in use');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};