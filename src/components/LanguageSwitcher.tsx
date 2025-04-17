// src/components/LanguageSwitcher.tsx
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LANGUAGE_CODES } from '@/services/elevenLabsService';
import { GlobeIcon } from 'lucide-react';

interface LanguageSwitcherProps {
  onLanguageChange: (language: string) => void;
  selectedLanguage: string;
  disabled?: boolean;
}

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  onLanguageChange, 
  selectedLanguage = LANGUAGE_CODES.ITALIAN,
  disabled = false
}) => {
  // Language options with emoji flags
  const languages: LanguageOption[] = [
    { code: LANGUAGE_CODES.ITALIAN, name: 'Italian', flag: '🇮🇹' },
    { code: LANGUAGE_CODES.ENGLISH, name: 'English', flag: '🇬🇧' },
    { code: LANGUAGE_CODES.SPANISH, name: 'Spanish', flag: '🇪🇸' },
    { code: LANGUAGE_CODES.FRENCH, name: 'French', flag: '🇫🇷' },
    { code: LANGUAGE_CODES.GERMAN, name: 'German', flag: '🇩🇪' },
  ];

  const handleLanguageChange = (value: string) => {
    onLanguageChange(value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="language-selector" className="text-sm font-medium flex items-center">
        <GlobeIcon className="h-4 w-4 mr-1" />
        Language
      </Label>
      
      <Select 
        value={selectedLanguage} 
        onValueChange={handleLanguageChange}
        disabled={disabled}
      >
        <SelectTrigger id="language-selector" className="w-full">
          <SelectValue placeholder="Select a language" />
        </SelectTrigger>
        <SelectContent>
          {languages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <span>{language.flag} {language.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <p className="text-xs text-muted-foreground">
        The selected language will be used for text-to-speech.
      </p>
    </div>
  );
};

export default LanguageSwitcher;