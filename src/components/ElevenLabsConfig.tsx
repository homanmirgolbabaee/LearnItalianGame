// src/components/ElevenLabsConfig.tsx
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { initElevenLabs, isValidApiKey } from '@/services/simpleElevenLabsService';
import { InfoIcon, CheckCircle, XCircle } from 'lucide-react';

interface ElevenLabsConfigProps {
  isOpen: boolean;
  onClose: () => void;
}

const ElevenLabsConfig: React.FC<ElevenLabsConfigProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isValidKey, setIsValidKey] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load saved API key on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('elevenLabsApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      validateApiKey(savedApiKey);
    }
  }, []);

  const validateApiKey = async (key: string) => {
    setIsLoading(true);
    const valid = await isValidApiKey(key);
    setIsValidKey(valid);
    setIsLoading(false);
    return valid;
  };

  const handleSave = async () => {
    console.log('Saving API key...');
    setIsLoading(true);
    
    try {
      console.log('Validating API key...');
      const isValid = await validateApiKey(apiKey);
      console.log('API key validation result:', isValid);
      
      if (isValid) {
        console.log('API key is valid, saving to localStorage');
        localStorage.setItem('elevenLabsApiKey', apiKey);
        
        try {
          console.log('Initializing ElevenLabs with the new API key');
          initElevenLabs(apiKey);
          console.log('ElevenLabs initialized successfully');
          onClose();
        } catch (error) {
          console.error('Failed to initialize ElevenLabs:', error);
          alert('API key was saved but there was an error initializing ElevenLabs. Please try again.');
        }
      } else {
        console.warn('API key validation failed');
        alert('The API key appears to be invalid. Please check and try again.');
      }
    } catch (error) {
      console.error('Error during API key saving process:', error);
      alert('An error occurred while saving the API key. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (isValidKey === null) return null;
    return isValidKey ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ElevenLabs API Configuration</DialogTitle>
          <DialogDescription>
            Enter your ElevenLabs API key to enable high-quality multilingual text-to-speech.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="api-key" className="flex items-center gap-2">
              API Key {getStatusIcon()}
            </Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your ElevenLabs API key"
              className="col-span-3"
            />
            
            <div className="flex items-start mt-2 text-xs text-muted-foreground">
              <InfoIcon className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
              <p>
                You can get your API key from the{' '}
                <a 
                  href="https://elevenlabs.io/app/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-italian-blue underline"
                >
                  ElevenLabs dashboard
                </a>. 
                Your API key is stored locally and never sent to our servers.
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading || !apiKey}>
            {isLoading ? 'Verifying...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ElevenLabsConfig;