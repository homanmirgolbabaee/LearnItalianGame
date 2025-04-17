// src/components/QuizGenerator.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, RefreshCw, ThumbsUp, Key, AlertTriangle } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ItalianWord } from "@/data/italianWords";
import {
  fetchItalianWords,
  translateItalianWords,
  convertToolhouseResponseToItalianWords,
  setOpenAIApiKey
} from "@/services/toolhouseService";

interface QuizGeneratorProps {
  onGenerateQuiz: (words: ItalianWord[]) => void;
}

const QuizGenerator: React.FC<QuizGeneratorProps> = ({ onGenerateQuiz }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('openaiApiKey') || '');
  const [initialLoad, setInitialLoad] = useState(true);

  // Check for API key and automatically generate on first load
  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false);
      
      // Check if we have an API key, and if so, auto-generate words
      const savedApiKey = localStorage.getItem('openaiApiKey');
      if (savedApiKey) {
        generateQuiz();
      } else {
        // Show API key dialog on first load if no key is found
        setShowApiKeyDialog(true);
      }
    }
  }, [initialLoad]);

  const generateQuiz = async () => {
    // Check if API key is set
    if (!localStorage.getItem('openaiApiKey')) {
      setShowApiKeyDialog(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Fetch new Italian words
      const wordsResponse = await fetchItalianWords();
      
      if (!wordsResponse) {
        throw new Error("Failed to generate words. Please try again.");
      }
      
      // Immediately create initial flashcards with placeholder translations
      const initialWords = convertToolhouseResponseToItalianWords(wordsResponse);
      onGenerateQuiz(initialWords);
      
      // Extract the Italian words
      const italianWords = [
        wordsResponse.word_1,
        wordsResponse.word_2,
        wordsResponse.word_3
      ];
      
      // Show initial success message
      setSuccess("New Italian words generated! Fetching translations...");
      
      // Step 2: Translate the words
      const translations = await translateItalianWords(italianWords);
      
      // Step 3: Convert to ItalianWord format with translations
      const wordObjects = convertToolhouseResponseToItalianWords(
        wordsResponse,
        translations
      );
      
      // Update the flashcards with translations
      onGenerateQuiz(wordObjects);
      
      // Update success message
      setSuccess("Quiz generated successfully with 3 new Italian words!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError('Failed to generate quiz. Please check your OpenAI API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      setOpenAIApiKey(apiKey.trim());
      setShowApiKeyDialog(false);
      // Start generation once API key is set
      generateQuiz();
    } else {
      setError('Please enter a valid API key');
    }
  };

  return (
    <div className="mb-6 flex flex-col items-center">
      <div className="flex justify-center mb-2 w-full">
        <Button
          onClick={generateQuiz}
          disabled={isLoading}
          className="flex items-center gap-2 bg-italian-blue hover:bg-italian-accent text-white font-medium transition-all duration-200 transform hover:scale-105 w-full sm:w-auto"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating Words...
            </>
          ) : (
            <>
              <RefreshCw className="h-5 w-5" />
              Generate New Italian Words
            </>
          )}
        </Button>
      </div>
      
      <div className="mt-3 w-full max-w-md">
        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mt-2 bg-green-50 border-green-500">
            <ThumbsUp className="h-4 w-4 text-green-500" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* API Key Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter OpenAI API Key</DialogTitle>
            <DialogDescription>
              An OpenAI API key is required to generate Italian words with Toolhouse.ai. 
              Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">OpenAI Dashboard</a>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="openai-api-key" className="flex items-center gap-2">
                OpenAI API Key <Key className="h-3 w-3" />
              </Label>
              <Input
                id="openai-api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your OpenAI API key"
                className="col-span-3"
              />
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally and never sent to our servers.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApiKeyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApiKey} disabled={!apiKey.trim()}>
              Save & Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizGenerator;