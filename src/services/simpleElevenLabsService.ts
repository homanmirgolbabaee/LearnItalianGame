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
      
      // Log available voices for debugging
      if (voices.length > 0) {
        console.log('Available voices:');
        voices.forEach((voice: any, index: number) => {
          console.log(`Voice ${index + 1}: ID=${voice.voice_id}, Name=${voice.name || 'Unnamed'}`);
        });
      } else {
        console.warn('No voices available in this account');
      }
      
      return voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
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
      // First fetch available voices to get the best voice
      const voices = await getAvailableVoices();
      if (voices.length === 0) {
        throw new Error('No voices available');
      }
      
      // Select the first voice as default
      let voiceId = voices[0].voice_id;
      console.log(`Using default voice: ${voices[0].name} (${voiceId})`);
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
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
    console.log('Falling back to browser speech synthesis');
    
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