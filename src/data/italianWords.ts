// src/data/italianWords.ts

// Define the interface for Italian word structure
export interface ItalianWord {
  id: number;
  italian: string;
  english: string;
  category: string;
  example?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  audioUrl?: string;
}

// Empty initial dataset - all words will be generated via Toolhouse
export const italianWords: ItalianWord[] = [];

// Function to get words by category - not needed for empty initial dataset
// but kept for API compatibility
export const getWordsByCategory = (category: string): ItalianWord[] => {
  return italianWords.filter(word => word.category === category);
};

// Function to get words by difficulty - not needed for empty initial dataset
// but kept for API compatibility
export const getWordsByDifficulty = (difficulty: "beginner" | "intermediate" | "advanced"): ItalianWord[] => {
  return italianWords.filter(word => word.difficulty === difficulty);
};