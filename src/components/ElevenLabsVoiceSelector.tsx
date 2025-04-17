// src/components/ElevenLabsVoiceSelector.tsx
import React, { useState, useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { LANGUAGE_CODES } from '@/services/elevenLabsService';

interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  language?: string;
}

interface VoiceSelectorProps {
  onVoiceSelect: (voiceId: string) => void;
  selectedLanguage: string;
  disabled?: boolean;
}

const ElevenLabsVoiceSelector: React.FC<VoiceSelectorProps> = ({ 
  onVoiceSelect, 
  selectedLanguage,
  disabled = false
}) => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Default voices in case API call fails
  const defaultVoices: Record<string, Voice[]> = {
    [LANGUAGE_CODES.ITALIAN]: [
      { voice_id: 'antonio', name: 'Antonio (Italian)', language: 'Italian' },
      { voice_id: 'giovanni', name: 'Giovanni (Italian)', language: 'Italian' },
    ],
    [LANGUAGE_CODES.ENGLISH]: [
      { voice_id: 'adam', name: 'Adam (English)', language: 'English' },
      { voice_id: 'rachel', name: 'Rachel (English)', language: 'English' },
    ],
    [LANGUAGE_CODES.SPANISH]: [
      { voice_id: 'bella', name: 'Bella (Spanish)', language: 'Spanish' },
      { voice_id: 'pedro', name: 'Pedro (Spanish)', language: 'Spanish' },
    ],
    [LANGUAGE_CODES.FRENCH]: [
      { voice_id: 'emma', name: 'Emma (French)', language: 'French' },
    ],
    [LANGUAGE_CODES.GERMAN]: [
      { voice_id: 'hans', name: 'Hans (German)', language: 'German' },
    ]
  };

  // Fetch voices from ElevenLabs API
  useEffect(() => {
    const fetchVoices = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, you would fetch voices from ElevenLabs API
        // For now, we'll just use the default voices with a delay to simulate API call
        setTimeout(() => {
          const languageVoices = defaultVoices[selectedLanguage] || defaultVoices[LANGUAGE_CODES.ENGLISH];
          setVoices(languageVoices);
          
          // Set default voice for the language
          if (languageVoices.length > 0) {
            setSelectedVoice(languageVoices[0].voice_id);
            onVoiceSelect(languageVoices[0].voice_id);
          }
          
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Failed to fetch voices:', err);
        setError('Failed to load voices');
        setIsLoading(false);
        
        // Fall back to default voices
        const languageVoices = defaultVoices[selectedLanguage] || defaultVoices[LANGUAGE_CODES.ENGLISH];
        setVoices(languageVoices);
        
        if (languageVoices.length > 0) {
          setSelectedVoice(languageVoices[0].voice_id);
          onVoiceSelect(languageVoices[0].voice_id);
        }
      }
    };

    fetchVoices();
  }, [selectedLanguage]);

  const handleVoiceChange = (value: string) => {
    setSelectedVoice(value);
    onVoiceSelect(value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="voice-selector" className="text-sm font-medium">
        Voice
        {isLoading && <Loader2 className="h-4 w-4 ml-2 inline animate-spin" />}
      </Label>
      
      <Select 
        value={selectedVoice} 
        onValueChange={handleVoiceChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger id="voice-selector" className="w-full">
          <SelectValue placeholder="Select a voice" />
        </SelectTrigger>
        <SelectContent>
          {voices.map((voice) => (
            <SelectItem key={voice.voice_id} value={voice.voice_id}>
              {voice.name}
            </SelectItem>
          ))}
          {voices.length === 0 && !isLoading && (
            <SelectItem value="none" disabled>
              No voices available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
};

export default ElevenLabsVoiceSelector;