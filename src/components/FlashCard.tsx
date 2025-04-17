// src/components/FlashCard.tsx
import { useState, useEffect } from "react";
import { ItalianWord } from "@/data/italianWords";
import { Volume2, Loader2 } from "lucide-react";
import { playTextWithElevenLabs, LANGUAGE_CODES } from "@/services/simpleElevenLabsService";
import { Button } from "@/components/ui/button";

interface FlashCardProps {
  word: ItalianWord;
  useElevenLabs?: boolean;
}

const FlashCard = ({ word, useElevenLabs = false }: FlashCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const playAudio = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card from flipping when clicking the audio button
    
    if (isPlaying) {
      console.log("Already playing audio, ignoring click");
      return; // Prevent multiple clicks
    }
    
    console.log(`Attempting to play Italian audio: "${word.italian}" using ${useElevenLabs ? "ElevenLabs" : "Browser TTS"}`);
    setIsPlaying(true);
    
    try {
      if (useElevenLabs) {
        console.log("Using ElevenLabs for TTS");
        // Use ElevenLabs TTS with Italian language code
        await playTextWithElevenLabs(
          word.italian, 
          LANGUAGE_CODES.ITALIAN
        );
        console.log("ElevenLabs playback completed");
      } else {
        console.log("Using browser's built-in TTS");
        // Fallback to browser's built-in TTS
        const utterance = new SpeechSynthesisUtterance(word.italian);
        utterance.lang = "it-IT";
        
        // Add event listeners for debugging
        utterance.onstart = () => console.log("Browser TTS started");
        utterance.onend = () => console.log("Browser TTS ended");
        utterance.onerror = (e) => console.error("Browser TTS error:", e);
        
        speechSynthesis.speak(utterance);
        console.log("Browser TTS request sent");
      }
    } catch (error) {
      console.error("Error playing audio:", error);
    } finally {
      console.log("Setting isPlaying to false");
      setIsPlaying(false);
    }
  };

  const playEnglishAudio = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card from flipping
    
    if (isPlaying) {
      console.log("Already playing audio, ignoring click");
      return; // Prevent multiple clicks
    }
    
    console.log(`Attempting to play English audio: "${word.english}" using ${useElevenLabs ? "ElevenLabs" : "Browser TTS"}`);
    setIsPlaying(true);
    
    try {
      if (useElevenLabs) {
        console.log("Using ElevenLabs for English TTS");
        // Use ElevenLabs TTS for English - explicitly use English language code
        await playTextWithElevenLabs(
          word.english,
          LANGUAGE_CODES.ENGLISH
        );
        console.log("English ElevenLabs playback completed");
      } else {
        console.log("Using browser's built-in TTS for English");
        // Fallback to browser's built-in TTS
        const utterance = new SpeechSynthesisUtterance(word.english);
        utterance.lang = "en-US";
        
        // Add event listeners for debugging
        utterance.onstart = () => console.log("English Browser TTS started");
        utterance.onend = () => console.log("English Browser TTS ended");
        utterance.onerror = (e) => console.error("English Browser TTS error:", e);
        
        speechSynthesis.speak(utterance);
        console.log("English Browser TTS request sent");
      }
    } catch (error) {
      console.error("Error playing English audio:", error);
    } finally {
      console.log("Setting isPlaying to false");
      setIsPlaying(false);
    }
  };

  return (
    <div 
      className="w-64 h-96 perspective-1000 cursor-pointer mx-auto"
      onClick={handleFlip}
    >
      <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
        {/* Front of card (Italian word) */}
        <div className="flashcard-front bg-italian-cream border-4 border-italian-gold flex flex-col justify-between">
          <div className="text-right">
            <span className="inline-block bg-italian-green text-white text-xs px-2 py-1 rounded-full">
              {word.category}
            </span>
          </div>
          
          <div className="text-center flex-1 flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-2 text-italian-blue font-serif">{word.italian}</h2>
            {word.example && (
              <p className="text-sm italic text-gray-600 mt-2">"{word.example}"</p>
            )}
          </div>
          
          <div className="flex justify-center mt-4">
            <Button 
              className="bg-italian-blue text-white p-2 rounded-full hover:bg-italian-accent transition-colors"
              onClick={playAudio}
              disabled={isPlaying}
              aria-label="Pronounce word"
              variant="ghost"
              size="icon"
            >
              {isPlaying ? 
                <Loader2 size={20} className="animate-spin" /> : 
                <Volume2 size={20} />
              }
            </Button>
          </div>
        </div>
        
        {/* Back of card (English translation) */}
        <div className="flashcard-back bg-italian-white border-4 border-italian-green flex flex-col justify-center">
          <div className="text-center">
            <h3 className="text-xl text-gray-600 mb-1">Translation</h3>
            <p className="text-3xl font-bold text-italian-blue font-serif">{word.english}</p>
            
            <div className="mt-4">
              <Button 
                className="bg-italian-blue text-white p-2 rounded-full hover:bg-italian-accent transition-colors"
                onClick={playEnglishAudio}
                disabled={isPlaying}
                aria-label="Pronounce English translation"
                variant="ghost"
                size="icon"
              >
                {isPlaying ? 
                  <Loader2 size={20} className="animate-spin" /> : 
                  <Volume2 size={20} />
                }
              </Button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-500 text-sm">Tap to flip back</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashCard;