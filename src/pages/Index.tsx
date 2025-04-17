// src/pages/Index.tsx
import { useState, useEffect, useMemo } from "react";
import { italianWords, getWordsByCategory } from "@/data/italianWords";
import FlashCard from "@/components/FlashCard";
import QuizProgress from "@/components/QuizProgress";
import CategorySelector from "@/components/CategorySelector";
import CardCounter from "@/components/CardCounter";
import ElevenLabsConfig from "@/components/ElevenLabsConfig";
import ElevenLabsTtsTest from "@/components/ElevenLabsTtsTest";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Settings, AlertTriangle, Bug } from "lucide-react";
import { initElevenLabs } from "@/services/simpleElevenLabsService";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [completedCards, setCompletedCards] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showElevenLabsConfig, setShowElevenLabsConfig] = useState(false);
  const [useElevenLabs, setUseElevenLabs] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("main");
  const [debugMode, setDebugMode] = useState(false);

  // Enable debug mode in development or if debug parameter is in URL
  useEffect(() => {
    const isDevelopment = import.meta.env.MODE === 'development';
    const hasDebugParam = window.location.search.includes('debug=true');
    setDebugMode(isDevelopment || hasDebugParam);
    
    // Log debug status
    console.log(`Debug mode: ${isDevelopment || hasDebugParam ? 'enabled' : 'disabled'}`);
    console.log(`Environment: ${import.meta.env.MODE}`);
  }, []);

  // Check for saved API key on component mount
  useEffect(() => {
    console.log('Index component mounted, checking for saved API key');
    const savedApiKey = localStorage.getItem('elevenLabsApiKey');
    if (savedApiKey) {
      console.log('Found saved API key, initializing ElevenLabs');
      setHasApiKey(true);
      try {
        initElevenLabs(savedApiKey);
        console.log('ElevenLabs initialized successfully');
        setUseElevenLabs(true);
      } catch (error) {
        console.error('Failed to initialize ElevenLabs:', error);
        setHasApiKey(false);
        setUseElevenLabs(false);
      }
    } else {
      console.log('No saved API key found');
    }
  }, []);

  // Get unique categories from all words
  const categories = useMemo(() => {
    const categoriesSet = new Set(italianWords.map(word => word.category));
    return Array.from(categoriesSet);
  }, []);

  // Filter words based on selected category
  const filteredWords = useMemo(() => {
    if (!selectedCategory) return italianWords;
    return getWordsByCategory(selectedCategory);
  }, [selectedCategory]);

  const handleNextCard = () => {
    // Mark current card as completed if not already
    if (!completedCards.includes(currentCardIndex)) {
      setCompletedCards([...completedCards, currentCardIndex]);
    }
    
    // Move to next card or loop back to beginning if at the end
    setCurrentCardIndex((prevIndex) => 
      prevIndex === filteredWords.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrevCard = () => {
    // Move to previous card or loop to the end if at the beginning
    setCurrentCardIndex((prevIndex) => 
      prevIndex === 0 ? filteredWords.length - 1 : prevIndex - 1
    );
  };

  const restartQuiz = () => {
    setCurrentCardIndex(0);
    setCompletedCards([]);
  };

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    setCurrentCardIndex(0);
    setCompletedCards([]);
  };

  const handleCloseConfig = () => {
    setShowElevenLabsConfig(false);
    // Check if API key was added during config
    const savedApiKey = localStorage.getItem('elevenLabsApiKey');
    setHasApiKey(!!savedApiKey);
  };

  const handleToggleElevenLabs = (enabled: boolean) => {
    setUseElevenLabs(enabled);
    
    if (enabled && !hasApiKey) {
      setShowElevenLabsConfig(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-italian-white to-italian-cream flex flex-col py-8 px-4">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-italian-blue font-serif">Presto - Italian Flashcards</h1>
        <p className="text-gray-600 mt-2">Master Italian one word at a time</p>
        
        <div className="mt-4 flex justify-center">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch 
                id="use-elevenlabs" 
                checked={useElevenLabs}
                onCheckedChange={handleToggleElevenLabs}
                disabled={!hasApiKey}
              />
              <Label htmlFor="use-elevenlabs" className="flex items-center gap-1">
                ElevenLabs TTS
                {!hasApiKey && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>API key required</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </Label>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setShowElevenLabsConfig(true)}
            >
              <Settings className="h-4 w-4" />
              Configure API
            </Button>
            
            {debugMode && (
              <Button
                variant="outline"
                size="sm"
                className={`flex items-center gap-1 ${activeTab === "debug" ? "bg-amber-100" : ""}`}
                onClick={() => setActiveTab(activeTab === "debug" ? "main" : "debug")}
              >
                <Bug className="h-4 w-4" />
                {activeTab === "debug" ? "Hide Debug" : "Show Debug"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl mx-auto">
        <TabsList className={`w-full mb-4 ${!debugMode ? "hidden" : ""}`}>
          <TabsTrigger value="main" className="flex-1">Flashcards</TabsTrigger>
          {debugMode && (
            <TabsTrigger value="debug" className="flex-1">Diagnostic Tools</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="main" className="space-y-4">
          <div className="max-w-md mx-auto w-full">
            <CategorySelector
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategoryChange}
            />
          </div>

          <QuizProgress 
            current={completedCards.length}
            total={filteredWords.length}
          />

          <div className="flex-1 flex flex-col justify-center items-center">
            {filteredWords.length > 0 ? (
              <>
                <CardCounter 
                  currentIndex={currentCardIndex} 
                  totalCards={filteredWords.length} 
                />
                <FlashCard 
                  word={filteredWords[currentCardIndex]} 
                  useElevenLabs={useElevenLabs && hasApiKey}
                />
                
                <div className="flex justify-center mt-8 gap-4">
                  <Button 
                    onClick={handlePrevCard}
                    className="btn-italian"
                    variant="outline"
                  >
                    <ArrowLeft className="mr-1" size={18} /> Previous
                  </Button>
                  
                  <Button 
                    onClick={handleNextCard}
                    className="btn-italian"
                  >
                    Next <ArrowRight className="ml-1" size={18} />
                  </Button>
                </div>
                
                {completedCards.length === filteredWords.length && filteredWords.length > 0 && (
                  <div className="mt-8 text-center">
                    <p className="text-xl text-italian-green font-medium mb-4">
                      Ottimo! You've completed all cards!
                    </p>
                    <Button 
                      onClick={restartQuiz}
                      className="btn-italian bg-italian-green"
                    >
                      Restart Quiz
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-8 bg-italian-white rounded-lg shadow-md">
                <p className="text-xl text-italian-blue">No cards found in this category.</p>
                <Button 
                  onClick={() => handleCategoryChange(null)}
                  className="btn-italian mt-4"
                >
                  Show All Cards
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        {debugMode && (
          <TabsContent value="debug" className="space-y-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4 text-italian-blue">ElevenLabs TTS Diagnostics</h2>
              <ElevenLabsTtsTest />
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4 text-italian-blue">Debug Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">ElevenLabs Status</h3>
                  <div className="bg-gray-100 p-3 rounded">
                    <p><strong>API Key Set:</strong> {hasApiKey ? "Yes" : "No"}</p>
                    <p><strong>TTS Enabled:</strong> {useElevenLabs ? "Yes" : "No"}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Environment</h3>
                  <div className="bg-gray-100 p-3 rounded">
                    <p><strong>Mode:</strong> {import.meta.env.MODE}</p>
                    <p><strong>Debug Mode:</strong> {debugMode ? "Enabled" : "Disabled"}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>Click on a card to flip it and reveal the translation.</p>
        <p className="mt-1">Use the audio button to hear the pronunciation.</p>
      </footer>

      {/* ElevenLabs Configuration Dialog */}
      <ElevenLabsConfig 
        isOpen={showElevenLabsConfig}
        onClose={handleCloseConfig}
      />
    </div>
  );
};

export default Index;