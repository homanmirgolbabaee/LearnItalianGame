// src/services/simpleElevenLabsService.ts

// ElevenLabs language codes
export const LANGUAGE_CODES = {
  ITALIAN: 'it',
  ENGLISH: 'en',
  SPANISH: 'es',
  FRENCH: 'fr',
  GERMAN: 'de',
};

// Store API key globally
let apiKey: string | null = null;

// Cache for voices by language
const voiceCache: Record<string, any> = {};

// Initialize with API key
export const initElevenLabs = (key: string): void => {
  console.log('Initializing ElevenLabs service with API key');
  apiKey = key;
};

// Function to fetch available voices
export const getAvailableVoices = async (): Promise<any[]> => {
  if (!apiKey) {
    console.error('ElevenLabs API key not set. Call initElevenLabs first.');
    return [];
  }
  
  try {
    console.log('Fetching available voices from ElevenLabs');
    
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.status}`);
    }
    
    const data = await response.json();
    const voices = data.voices || [];
    
    console.log(`Successfully fetched ${voices.length} voices`);
    
    // Update the voice cache
    if (voices.length > 0) {
      // Cache voices by likely language (based on labels)
      voices.forEach((voice: any) => {
        const labels = voice.labels || {};
        
        // Cache general purpose voices for all languages
        if (!voiceCache.general) voiceCache.general = [];
        voiceCache.general.push(voice);
        
        // Cache by specific language if available
        if (labels.language) {
          if (!voiceCache[labels.language]) voiceCache[labels.language] = [];
          voiceCache[labels.language].push(voice);
        }
        
        // Check description for language hints
        const description = (voice.description || '').toLowerCase();
        
        if (description.includes('italian') || description.includes('italiano')) {
          if (!voiceCache[LANGUAGE_CODES.ITALIAN]) voiceCache[LANGUAGE_CODES.ITALIAN] = [];
          voiceCache[LANGUAGE_CODES.ITALIAN].push(voice);
        }
        
        if (description.includes('english')) {
          if (!voiceCache[LANGUAGE_CODES.ENGLISH]) voiceCache[LANGUAGE_CODES.ENGLISH] = [];
          voiceCache[LANGUAGE_CODES.ENGLISH].push(voice);
        }
      });
      
      console.log('Voice cache updated:', Object.keys(voiceCache));
    }
    
    return voices;
  } catch (error) {
    console.error('Error fetching voices:', error);
    return [];
  }
};

// Get the best voice for a language
const getBestVoiceForLanguage = (languageCode: string): string | null => {
  // Check if we have a cached voice for this language
  if (voiceCache[languageCode] && voiceCache[languageCode].length > 0) {
    const voice = voiceCache[languageCode][0];
    console.log(`Using cached ${languageCode} voice: ${voice.name} (${voice.voice_id})`);
    return voice.voice_id;
  }
  
  // Otherwise use a general voice if available
  if (voiceCache.general && voiceCache.general.length > 0) {
    const voice = voiceCache.general[0];
    console.log(`Using general voice for ${languageCode}: ${voice.name} (${voice.voice_id})`);
    return voice.voice_id;
  }
  
  console.warn(`No voice found for language: ${languageCode}`);
  return null;
};

// Function to play text using ElevenLabs TTS
export const playTextWithElevenLabs = async (
  text: string, 
  languageCode = LANGUAGE_CODES.ITALIAN
): Promise<void> => {
  console.log(`Playing text with ElevenLabs: "${text}" (${languageCode})`);
  
  if (!apiKey) {
    console.error('ElevenLabs API key not set. Call initElevenLabs first.');
    // Try to get from localStorage
    const savedKey = localStorage.getItem('elevenLabsApiKey');
    if (savedKey) {
      console.log('Found API key in localStorage');
      apiKey = savedKey;
    } else {
      console.error('No API key found in localStorage');
      useBrowserTTS(text, languageCode);
      return;
    }
  }

  try {
    // If voice cache is empty, fetch voices first
    if (Object.keys(voiceCache).length === 0) {
      await getAvailableVoices();
    }
    
    // Get appropriate voice for this language
    let voiceId = getBestVoiceForLanguage(languageCode);
    
    // If no voice found for specific language, try to get any available voice
    if (!voiceId && voiceCache.general && voiceCache.general.length > 0) {
      voiceId = voiceCache.general[0].voice_id;
    }
    
    // If still no voice, fetch voices and try again
    if (!voiceId) {
      await getAvailableVoices();
      voiceId = getBestVoiceForLanguage(languageCode);
    }
    
    // Final fallback - if still no voice, use browser TTS
    if (!voiceId) {
      console.warn('No voices available, falling back to browser TTS');
      useBrowserTTS(text, languageCode);
      return;
    }
    
    console.log(`Using voice ID: ${voiceId} for language: ${languageCode}`);
    
    // Adjust the model based on language
    const model_id = languageCode !== LANGUAGE_CODES.ENGLISH 
      ? 'eleven_multilingual_v2'   // Use multilingual for non-English
      : 'eleven_monolingual_v1';   // Use monolingual for English
      
    console.log(`Using model: ${model_id}`);
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: model_id,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }
    
    console.log('Received audio data from ElevenLabs');
    
    // Get audio data as blob
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    console.log(`Created audio URL: ${audioUrl}`);
    
    const audio = new Audio(audioUrl);
    
    // Add event listeners for debugging
    audio.onloadeddata = () => console.log('Audio loaded');
    audio.onplay = () => console.log('Audio playback started');
    audio.onended = () => {
      console.log('Audio playback ended');
      URL.revokeObjectURL(audioUrl);
    };
    audio.onerror = (e) => console.error('Audio playback error:', e);
    
    console.log('Attempting to play audio...');
    await audio.play();
    console.log('Audio playback initiated');
  } catch (error) {
    console.error('Error playing audio with ElevenLabs:', error);
    
    // Log more details if it's a network error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
    
    // Fall back to browser's speech synthesis
    useBrowserTTS(text, languageCode);
  }
};

// Fallback to browser's speech synthesis
export const useBrowserTTS = (text: string, languageCode: string): void => {
  console.log(`Falling back to browser speech synthesis for language: ${languageCode}`);
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Map language code to browser language code
  const langMap: Record<string, string> = {
    [LANGUAGE_CODES.ITALIAN]: 'it-IT',
    [LANGUAGE_CODES.ENGLISH]: 'en-US',
    [LANGUAGE_CODES.SPANISH]: 'es-ES',
    [LANGUAGE_CODES.FRENCH]: 'fr-FR',
    [LANGUAGE_CODES.GERMAN]: 'de-DE',
  };
  
  utterance.lang = langMap[languageCode] || 'en-US';
  
  // Add event listeners for debugging
  utterance.onstart = () => console.log('Browser TTS started');
  utterance.onend = () => console.log('Browser TTS ended');
  utterance.onerror = (e) => console.error('Browser TTS error:', e);
  
  speechSynthesis.speak(utterance);
  console.log('Browser TTS request sent');
};

// Function to check if the API key is valid
export const isValidApiKey = async (keyToCheck: string): Promise<boolean> => {
  console.log('Validating API key...');
  
  if (!keyToCheck || keyToCheck.trim() === '') {
    console.error('API key is empty or null');
    return false;
  }
  
  console.log('API key length:', keyToCheck.length);
  
  try {
    // Try a simple API call to check if the key is valid
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': keyToCheck
      }
    });
    
    if (!response.ok) {
      console.error(`API validation failed with status: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    console.log('Successfully fetched voices. Count:', data.voices?.length);
    return true;
  } catch (error) {
    console.error('Invalid ElevenLabs API key:', error);
    return false;
  }
};