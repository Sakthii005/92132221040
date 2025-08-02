export interface ShortenedUrl {
  id: string;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  expiresAt: Date;
  validityMinutes: number;
  clicks: ClickAnalytic[];
}

export interface ClickAnalytic {
  timestamp: Date;
  source: string;
  location: string;
  userAgent?: string;
}

export interface UrlFormData {
  originalUrl: string;
  validityMinutes: number;
  customShortcode: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}