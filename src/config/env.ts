// src/config/env.ts
// Helper function to load environment variables

/**
 * Gets environment variables with a fallback value
 */
export const getEnv = (key: string, fallback = ''): string => {
    if (import.meta.env[`VITE_${key}`]) {
      return import.meta.env[`VITE_${key}`] as string;
    }
    return fallback;
  };
  
  /**
   * Gets the ElevenLabs API key from environment or local storage
   */
  export const getElevenLabsApiKey = (): string => {
    // First check localStorage (user setting takes precedence)
    const localStorageKey = localStorage.getItem('elevenLabsApiKey');
    if (localStorageKey) {
      return localStorageKey;
    }
  
    // Then fall back to environment variable
    return getEnv('ELEVENLABS_API_KEY', '');
  };
  
  /**
   * Checks if ElevenLabs is configured (either via localStorage or environment)
   */
  export const isElevenLabsConfigured = (): boolean => {
    return !!getElevenLabsApiKey();
  };