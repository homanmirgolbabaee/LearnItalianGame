// src/components/ElevenLabsTtsTest.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { playTextWithElevenLabs, LANGUAGE_CODES, isValidApiKey } from '@/services/simpleElevenLabsService';
import { Volume2, AlertCircle, Loader2, Check, X } from 'lucide-react';

const ElevenLabsTtsTest: React.FC = () => {
  const [testText, setTestText] = useState('Ciao, come stai?');
  const [isPlaying, setIsPlaying] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTestClick = async () => {
    if (!testText.trim()) {
      setError('Please enter some text to test');
      return;
    }

    setIsPlaying(true);
    setError(null);

    try {
      console.log(`Test: Playing "${testText}" with ElevenLabs TTS`);
      await playTextWithElevenLabs(testText, LANGUAGE_CODES.ITALIAN);
      console.log('Test: Playback completed successfully');
    } catch (err) {
      console.error('Test: Error playing audio:', err);
      setError('Failed to play audio. Check the debug console for details.');
    } finally {
      setIsPlaying(false);
    }
  };

  const validateApiKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      console.log('Test: Validating API key');
      const isValid = await isValidApiKey(apiKey);
      setIsApiKeyValid(isValid);
      
      if (isValid) {
        console.log('Test: API key is valid');
        localStorage.setItem('elevenLabsApiKey', apiKey);
      } else {
        console.log('Test: API key is invalid');
        setError('The API key appears to be invalid');
      }
    } catch (err) {
      console.error('Test: Error validating API key:', err);
      setIsApiKeyValid(false);
      setError('Error validating API key. Check the debug console.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>ElevenLabs TTS Test</CardTitle>
        <CardDescription>
          Test the ElevenLabs text-to-speech integration
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="api-key">ElevenLabs API Key</Label>
          <div className="flex space-x-2">
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your ElevenLabs API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button onClick={validateApiKey} disabled={isValidating}>
              {isValidating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Validate'
              )}
            </Button>
          </div>
          
          {isApiKeyValid !== null && (
            <div className="flex items-center mt-1">
              {isApiKeyValid ? (
                <>
                  <Check className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-500">API key is valid</span>
                </>
              ) : (
                <>
                  <X className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-xs text-red-500">API key is invalid</span>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="test-text">Test Text</Label>
          <Input
            id="test-text"
            placeholder="Enter text to speak"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
          />
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleTestClick} 
          disabled={isPlaying}
          className="w-full"
        >
          {isPlaying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Playing...
            </>
          ) : (
            <>
              <Volume2 className="mr-2 h-4 w-4" />
              Test Speech
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ElevenLabsTtsTest;