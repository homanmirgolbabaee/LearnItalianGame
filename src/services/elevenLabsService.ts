// src/services/elevenLabsService.ts
import { ElevenLabsClient } from 'elevenlabs';
import { getElevenLabsApiKey } from '@/config/env';

// ElevenLabs language codes
export const LANGUAGE_CODES = {
  ITALIAN: 'it',
  ENGLISH: 'en',
  SPANISH: 'es',
  FRENCH: 'fr',
  GERMAN: 'de',
  // Add more languages as needed
};

// Create and configure the ElevenLabs client
let elevenLabsClient: ElevenLabsClient | null = null;

// Initialize the ElevenLabs client
export const initElevenLabs = (apiKey?: string): ElevenLabsClient => {
  console.log('initElevenLabs called');
  
  // If no apiKey is provided, try to get it from env or localStorage
  const key = apiKey || getElevenLabsApiKey();
  
  if (!key) {
    console.error('No ElevenLabs API key provided or found in environment/localStorage');
    throw new Error('ElevenLabs API key is required. Please provide an API key.');
  }
  
  console.log('API key found, length:', key.length);
  
  if (!elevenLabsClient) {
    console.log('Creating new ElevenLabs client instance');
    try {
      elevenLabsClient = new ElevenLabsClient({
        apiKey: key
      });
      console.log('ElevenLabs client created successfully');
    } catch (error) {
      console.error('Error creating ElevenLabs client:', error);
      throw error;
    }
  } else {
    console.log('Using existing ElevenLabs client instance');
  }
  
  return elevenLabsClient;
};

// Function to play text using ElevenLabs TTS
export const playTextWithElevenLabs = async (
  text: string, 
  languageCode = LANGUAGE_CODES.ITALIAN,
  voiceId = 'antonio' // Default Italian voice
): Promise<void> => {
  console.log(`playTextWithElevenLabs called for text: "${text}" in language: ${languageCode}`);
  
  if (!elevenLabsClient) {
    console.error('ElevenLabs client not initialized. Call initElevenLabs first.');
    
    // Try to initialize with key from localStorage
    const savedKey = localStorage.getItem('elevenLabsApiKey');
    if (savedKey) {
      console.log('Attempting to initialize ElevenLabs with saved key');
      try {
        initElevenLabs(savedKey);
        console.log('ElevenLabs initialized successfully with saved key');
      } catch (error) {
        console.error('Failed to initialize ElevenLabs with saved key:', error);
        return;
      }
    } else {
      console.error('No API key found in localStorage');
      return;
    }
  }

  try {
    console.log('ElevenLabs client exists, proceeding with TTS conversion');
    
    // Map for voice selection based on language
    const voiceMap: Record<string, string> = {
      [LANGUAGE_CODES.ITALIAN]: 'antonio',
      [LANGUAGE_CODES.ENGLISH]: 'adam',
      [LANGUAGE_CODES.SPANISH]: 'bella',
      [LANGUAGE_CODES.FRENCH]: 'emma',
      [LANGUAGE_CODES.GERMAN]: 'hans',
    };

    // Use language-specific voice if available
    const selectedVoice = voiceId || voiceMap[languageCode] || 'antonio';
    console.log(`Using voice ID: ${selectedVoice}`);

    console.log('Making API request to ElevenLabs...');
    // Get audio stream from ElevenLabs
    const audioStream = await elevenLabsClient.textToSpeech.convert({
      text,
      voice_id: selectedVoice,
      model_id: 'eleven_multilingual_v2', // Use multilingual model for language support
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    });
    console.log('Received audio stream from ElevenLabs');

    // Create an audio blob and play it
    console.log('Creating audio blob...');
    const audioBlob = new Blob([await audioStream.arrayBuffer()], { type: 'audio/mpeg' });
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
      console.error('Error stack:', error.stack);
    }
    
    console.log('Falling back to browser speech synthesis');
    // Fallback to browser's speech synthesis if ElevenLabs fails
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageCode === LANGUAGE_CODES.ITALIAN ? 'it-IT' : 'en-US';
    
    // Add event listeners for debugging
    utterance.onstart = () => console.log('Fallback TTS started');
    utterance.onend = () => console.log('Fallback TTS ended');
    utterance.onerror = (e) => console.error('Fallback TTS error:', e);
    
    speechSynthesis.speak(utterance);
    console.log('Fallback TTS request sent');
  }
};

// Function to check if the API key is valid
export const isValidApiKey = async (apiKey: string): Promise<boolean> => {
  console.log('Validating API key...');
  
  if (!apiKey || apiKey.trim() === '') {
    console.error('API key is empty or null');
    return false;
  }
  
  console.log('API key length:', apiKey.length);
  
  try {
    console.log('Creating temporary ElevenLabs client for validation');
    const client = new ElevenLabsClient({
      apiKey
    });
    
    console.log('Client created, making test API call to validate key');
    // Try to fetch voices to validate the API key
    console.log('Fetching voices from ElevenLabs...');
    const voices = await client.voices.getAll();
    console.log('Successfully fetched voices. Count:', voices.length);
    
    // Log the voices for debugging
    if (voices && voices.length > 0) {
      console.log('Available voices:');
      voices.forEach((voice, index) => {
        if (voice.voice_id) {
          console.log(`Voice ${index + 1}: ID=${voice.voice_id}, Name=${voice.name || 'Unnamed'}`);
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error('Invalid ElevenLabs API key:', error);
    
    // Log more details about the error for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error. Check your internet connection.');
    }
    
    // Check if it's an authentication error
    if (error instanceof Error && 
        (error.message.includes('401') || 
         error.message.includes('unauthorized') || 
         error.message.includes('authentication'))) {
      console.error('Authentication error. The API key is likely invalid.');
    }
    
    return false;
  }
};