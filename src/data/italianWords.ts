
// Mock data for Italian flashcards
export interface ItalianWord {
  id: number;
  italian: string;
  english: string;
  category: string;
  example?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  audioUrl?: string; // In a real app, this would point to actual audio files
}

export const italianWords: ItalianWord[] = [
  {
    id: 1,
    italian: "Ciao",
    english: "Hello",
    category: "Greetings",
    example: "Ciao, come stai?",
    difficulty: "beginner",
    audioUrl: "ciao.mp3"
  },
  {
    id: 2,
    italian: "Grazie",
    english: "Thank you",
    category: "Courtesy",
    example: "Grazie mille!",
    difficulty: "beginner",
    audioUrl: "grazie.mp3"
  },
  {
    id: 3,
    italian: "Arrivederci",
    english: "Goodbye",
    category: "Greetings",
    example: "Arrivederci, a domani!",
    difficulty: "beginner",
    audioUrl: "arrivederci.mp3"
  },
  {
    id: 4,
    italian: "Per favore",
    english: "Please",
    category: "Courtesy",
    example: "Un caffè, per favore.",
    difficulty: "beginner",
    audioUrl: "per-favore.mp3"
  },
  {
    id: 5,
    italian: "Mi scusi",
    english: "Excuse me",
    category: "Courtesy",
    example: "Mi scusi, dov'è il bagno?",
    difficulty: "beginner",
    audioUrl: "mi-scusi.mp3"
  },
  {
    id: 6,
    italian: "Buongiorno",
    english: "Good morning",
    category: "Greetings",
    example: "Buongiorno, come va?",
    difficulty: "beginner",
    audioUrl: "buongiorno.mp3"
  },
  {
    id: 7,
    italian: "Buonasera",
    english: "Good evening",
    category: "Greetings",
    example: "Buonasera a tutti!",
    difficulty: "beginner",
    audioUrl: "buonasera.mp3"
  },
  {
    id: 8,
    italian: "Piacere",
    english: "Nice to meet you",
    category: "Greetings",
    example: "Piacere, mi chiamo Marco.",
    difficulty: "beginner",
    audioUrl: "piacere.mp3"
  },
  {
    id: 9,
    italian: "Come stai?",
    english: "How are you?",
    category: "Greetings",
    example: "Ciao, come stai oggi?",
    difficulty: "beginner",
    audioUrl: "come-stai.mp3"
  },
  {
    id: 10,
    italian: "Sì",
    english: "Yes",
    category: "Basic Words",
    example: "Sì, per favore.",
    difficulty: "beginner",
    audioUrl: "si.mp3"
  },
  {
    id: 11,
    italian: "No",
    english: "No",
    category: "Basic Words",
    example: "No, grazie.",
    difficulty: "beginner",
    audioUrl: "no.mp3"
  },
  {
    id: 12,
    italian: "Acqua",
    english: "Water",
    category: "Food & Drink",
    example: "Vorrei dell'acqua, per favore.",
    difficulty: "beginner",
    audioUrl: "acqua.mp3"
  }
];

// Function to get words by category
export const getWordsByCategory = (category: string): ItalianWord[] => {
  return italianWords.filter(word => word.category === category);
};

// Function to get words by difficulty
export const getWordsByDifficulty = (difficulty: "beginner" | "intermediate" | "advanced"): ItalianWord[] => {
  return italianWords.filter(word => word.difficulty === difficulty);
};
