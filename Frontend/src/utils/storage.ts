import { ShortenedUrl } from '../types';
import { logger } from './logger';

const STORAGE_KEY = 'affordmed_shortened_urls';

export const storageUtils = {
  saveUrls(urls: ShortenedUrl[]): void {
    try {
      const serializedUrls = urls.map(url => ({
        ...url,
        createdAt: url.createdAt.toISOString(),
        expiresAt: url.expiresAt.toISOString(),
        clicks: url.clicks.map(click => ({
          ...click,
          timestamp: click.timestamp.toISOString()
        }))
      }));
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedUrls));
      logger.info('URLs saved to localStorage', { count: urls.length });
    } catch (error) {
      logger.error('Failed to save URLs to localStorage', error);
    }
  },

  loadUrls(): ShortenedUrl[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      const urls = parsed.map((url: any) => ({
        ...url,
        createdAt: new Date(url.createdAt),
        expiresAt: new Date(url.expiresAt),
        clicks: url.clicks.map((click: any) => ({
          ...click,
          timestamp: new Date(click.timestamp)
        }))
      }));

      logger.info('URLs loaded from localStorage', { count: urls.length });
      return urls;
    } catch (error) {
      logger.error('Failed to load URLs from localStorage', error);
      return [];
    }
  },

  clearUrls(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      logger.info('URLs cleared from localStorage');
    } catch (error) {
      logger.error('Failed to clear URLs from localStorage', error);
    }
  }
};