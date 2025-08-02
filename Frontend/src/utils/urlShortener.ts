import { ShortenedUrl, ClickAnalytic } from '../types';
import { logger } from './logger';

export const urlShortenerUtils = {
  generateShortCode(length: number = 6): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  createShortenedUrl(
    originalUrl: string,
    validityMinutes: number,
    customShortcode?: string,
    existingCodes: string[] = []
  ): ShortenedUrl {
    let shortCode = customShortcode?.trim() || '';
    
    if (!shortCode) {
      do {
        shortCode = this.generateShortCode();
      } while (existingCodes.includes(shortCode.toLowerCase()));
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + validityMinutes * 60 * 1000);
    
    const shortenedUrl: ShortenedUrl = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalUrl,
      shortCode,
      createdAt: now,
      expiresAt,
      validityMinutes,
      clicks: []
    };

    logger.info('Created shortened URL', {
      shortCode,
      originalUrl,
      validityMinutes,
      expiresAt: expiresAt.toISOString()
    });

    return shortenedUrl;
  },

  isExpired(url: ShortenedUrl): boolean {
    return new Date() > url.expiresAt;
  },

  recordClick(url: ShortenedUrl): ClickAnalytic {
    const click: ClickAnalytic = {
      timestamp: new Date(),
      source: document.referrer || 'direct',
      location: this.getApproximateLocation(),
      userAgent: navigator.userAgent
    };

    url.clicks.push(click);
    
    logger.info('Recorded click', {
      shortCode: url.shortCode,
      source: click.source,
      location: click.location
    });

    return click;
  },

  getApproximateLocation(): string {
    // In a real application, you'd use a geolocation service
    // For this demo, we'll simulate location data
    const locations = [
      'New York, NY',
      'Los Angeles, CA',
      'Chicago, IL',
      'Houston, TX',
      'Phoenix, AZ',
      'Philadelphia, PA',
      'San Antonio, TX',
      'San Diego, CA',
      'Dallas, TX',
      'San Jose, CA'
    ];
    
    return locations[Math.floor(Math.random() * locations.length)];
  },

  getShortUrl(shortCode: string): string {
    return `${window.location.origin}/${shortCode}`;
  }
};