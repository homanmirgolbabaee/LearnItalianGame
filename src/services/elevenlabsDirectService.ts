// src/services/elevenlabsDirectService.ts
// This is an alternative implementation that uses direct fetch calls
// instead of relying on the ElevenLabs library's internal methods

// ElevenLabs language codes
export const LANGUAGE_CODES = {
    ITALIAN: 'it',
    ENGLISH: 'en',
    SPANISH: 'es',
    FRENCH: 'fr',
    GERMAN: 'de',
  };
  
  // Store API key
  let apiKey: string | null = null;
  
  // Initialize with API key
  export const initElevenLabs = (key: string): void => {
    console.log('Initializing ElevenLabs direct service');
    apiKey = key;
  };
  
  // Function to play text using ElevenLabs TTS via direct API call
  export const playTextWithElevenLabs = async (
    text: string, 
    languageCode = LANGUAGE_CODES.ITALIAN,
    voiceId = 'antonio' // Default Italian voice
  ): Promise<void> => {
    console.log(`playTextWithElevenLabs called for text: "${text}" in language: ${languageCode}`);
    
    if (!apiKey) {
      console.error('ElevenLabs API key not set. Call initElevenLabs first.');
      
      // Try to get from localStorage
      const savedKey = localStorage.getItem('elevenLabsApiKey');
      if (savedKey) {
        console.log('Found API key in localStorage');
        apiKey = savedKey;
      } else {
        console.error('No API key found in localStorage');
        
        // Fall back to browser's speech synthesis
        useBrowserTTS(text, languageCode);
        return;
      }
    }
  
    try {
  // Voice map by language - these are sample voice IDs from ElevenLabs
      const voiceMap: Record<string, string> = {
        // Using actual ElevenLabs Voice IDs for premade voices
        [LANGUAGE_CODES.ITALIAN]: 'pNInz6obpgDQGcFmaJgB', // Using Adam for Italian
        [LANGUAGE_CODES.ENGLISH]: 'EXAVITQu4vr4xnSDxMaL', // Sam
        [LANGUAGE_CODES.SPANISH]: 'IKne3meq5aSn9XLyUdCD', // Nicole
        [LANGUAGE_CODES.FRENCH]: 'TxGEqnHWrfWFTfGW9XjX', // Josh
        [LANGUAGE_CODES.GERMAN]: 'VR6AewLTigWG4xSOukaG', // Rachel
      };
  
      // Get voice list from API first to find available voices
      try {
        console.log('Attempting to fetch available voices...');
        const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'xi-api-key': apiKey
          }
        });
        
        if (voicesResponse.ok) {
          const voicesData = await voicesResponse.json();
          
          if (voicesData.voices && voicesData.voices.length > 0) {
            console.log(`Found ${voicesData.voices.length} voices available`);
            
            // Use the first voice available if we can't find a language match
            let defaultVoiceId = voicesData.voices[0].voice_id;
            
            // Try to find an appropriate voice for the language
            const matchingVoice = voicesData.voices.find((voice: any) => {
              // Look for language tags or labels if available
              const labels = voice.labels || {};
              const description = voice.description || '';
              
              // Check if this voice is marked for our language
              return labels.language === languageCode || 
                    description.toLowerCase().includes(languageCode) ||
                    // For Italian specifically, look for "italian" in the description
                    (languageCode === LANGUAGE_CODES.ITALIAN && 
                     description.toLowerCase().includes('italian'));
            });
            
            if (matchingVoice) {
              console.log(`Found matching voice for ${languageCode}: ${matchingVoice.name} (${matchingVoice.voice_id})`);
              selectedVoice = matchingVoice.voice_id;
            } else {
              console.log(`No specific voice found for ${languageCode}, using ${voicesData.voices[0].name}`);
              selectedVoice = defaultVoiceId;
            }
          } else {
            console.warn('No voices found in account, using default voice');
          }
        } else {
          console.warn('Failed to fetch voices, using default voice');
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
        console.log('Using default voice from preset list');
      }
  
      console.log('Making direct API request to ElevenLabs...');
      
      // Direct API call to ElevenLabs
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`, {
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
            similarity_boost: 0.75
          }
        })
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`);
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
        console.error('Error stack:', error.stack);
      }
      
      // Fall back to browser's speech synthesis
      useBrowserTTS(text, languageCode);
    }
  };
  
  // Fallback to browser's speech synthesis
  const useBrowserTTS = (text: string, languageCode: string): void => {
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
      
      // Log available voices for debugging
      if (data.voices && data.voices.length > 0) {
        console.log('Available voices:');
        data.voices.forEach((voice: any, index: number) => {
          console.log(`Voice ${index + 1}: ID=${voice.voice_id}, Name=${voice.name || 'Unnamed'}`);
        });
      } else {
        console.warn('No voices available in this account');
      }
      
      return true;
    } catch (error) {
      console.error('Invalid ElevenLabs API key:', error);
      
      // Log more details about the error for debugging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
      }
      
      return false;
    }
  };
  
  // Get voices (simplified version)
  export const getVoices = async (): Promise<any[]> => {
    if (!apiKey) {
      console.error('ElevenLabs API key not set');
      return [];
    }
    
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  };