// src/services/toolhouseService.ts
import { Toolhouse } from '@toolhouseai/sdk';
import OpenAI from 'openai';

// Define the response format from Toolhouse
export interface ItalianWordResponse {
  italian: string;
  english: string;
}

// Global settings
const TOOLHOUSE_API_KEY = "th-Iim4benuS8hMsDNCWAFtOrQknQa5P9EsprRiaTIHpP0";
const MODEL = "gpt-3.5-turbo";

// Set OpenAI API key (saved to localStorage)
export const setOpenAIApiKey = (key: string) => {
  localStorage.setItem('openaiApiKey', key);
  console.log('OpenAI API key saved to localStorage');
};

// For offline mode
let useOfflineMode = false;
export const setOfflineMode = (value: boolean) => {
  useOfflineMode = value;
};

// Function to extract and validate JSON from various response formats
const extractAndValidateJSON = (responseText: string): ItalianWordResponse[] => {
  console.log("Original LLM response:", responseText);
  
  // Check if empty
  if (!responseText || responseText.trim() === '') {
    console.log("Empty response detected, providing default words");
    // Return emergency fallback words
    return [
      { italian: "tavolo", english: "table" },
      { italian: "sedia", english: "chair" }, 
      { italian: "finestra", english: "window" }
    ];
  }
  
  // Try various approaches to extract Italian-English pairs
  
  // 1. Try to find an array in the response with proper JSON syntax
  try {
    // Look for array-like patterns in the text [...]
    const arrayMatch = responseText.match(/\[\s*{[\s\S]*}\s*\]/);
    if (arrayMatch) {
      const cleanedJson = arrayMatch[0];
      console.log("Found JSON array:", cleanedJson);
      
      try {
        const parsed = JSON.parse(cleanedJson);
        console.log("Successfully parsed JSON array:", parsed);
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Validate that each item has italian and english fields
          const validItems = parsed.filter(item => 
            typeof item === 'object' && 
            item !== null && 
            'italian' in item && 
            'english' in item
          );
          
          if (validItems.length > 0) {
            return validItems.slice(0, 3);
          }
        }
      } catch (parseError) {
        console.log("Error parsing extracted array:", parseError);
      }
    }
  } catch (error) {
    console.log("Error in array extraction:", error);
  }
  
  // 2. Try to find individual JSON objects
  try {
    const itemMatches = responseText.match(/{\s*"italian"\s*:\s*"([^"]+)"\s*,\s*"english"\s*:\s*"([^"]+)"\s*}/g);
    if (itemMatches && itemMatches.length > 0) {
      console.log("Found individual JSON objects:", itemMatches);
      const result = [];
      
      for (const jsonStr of itemMatches) {
        try {
          const obj = JSON.parse(jsonStr);
          if (obj.italian && obj.english) {
            result.push(obj);
          }
        } catch (e) {
          console.log("Error parsing individual JSON object:", e);
        }
      }
      
      if (result.length > 0) {
        return result.slice(0, 3);
      }
    }
  } catch (error) {
    console.log("Error in individual JSON extraction:", error);
  }
  
  // 3. Try to find "italian" and "english" key-value pairs
  try {
    const pairs = [];
    const italianMatches = responseText.match(/"italian"\s*:\s*"([^"]+)"/g);
    const englishMatches = responseText.match(/"english"\s*:\s*"([^"]+)"/g);
    
    if (italianMatches && englishMatches && italianMatches.length === englishMatches.length) {
      for (let i = 0; i < italianMatches.length; i++) {
        const italian = italianMatches[i].match(/"italian"\s*:\s*"([^"]+)"/)[1];
        const english = englishMatches[i].match(/"english"\s*:\s*"([^"]+)"/)[1];
        
        if (italian && english) {
          pairs.push({ italian, english });
        }
      }
      
      if (pairs.length > 0) {
        return pairs.slice(0, 3);
      }
    }
  } catch (error) {
    console.log("Error in key-value extraction:", error);
  }
  
  // 4. Try a more flexible approach - look for word pairs
  try {
    const wordPattern = /["']?([A-Za-zÀ-ÖØ-öø-ÿ]+)["']?\s*:\s*["']?([A-Za-zÀ-ÖØ-öø-ÿ]+)["']?/g;
    const matches = [...responseText.matchAll(wordPattern)];
    
    if (matches.length >= 3) {
      console.log("Found word pairs using flexible pattern:", matches);
      return matches.slice(0, 3).map(match => ({
        italian: match[1],
        english: match[2]
      }));
    }
  } catch (error) {
    console.log("Error in flexible word pair extraction:", error);
  }
  
  // If all else fails, return fallback words
  console.log("All parsing attempts failed, returning default words");
  return [
    { italian: "pane", english: "bread" },
    { italian: "acqua", english: "water" },
    { italian: "vino", english: "wine" }
  ];
};

// Function to fetch new Italian words from Toolhouse
export const fetchItalianWords = async (): Promise<ItalianWordResponse[]> => {
  // If offline mode is enabled, return default words
  if (useOfflineMode) {
    console.log('Offline mode enabled, returning default words');
    return [
      { italian: "albero", english: "tree" },
      { italian: "casa", english: "house" },
      { italian: "libro", english: "book" }
    ];
  }

  try {
    console.log('Fetching new Italian words...');
    
    // Get the API key from localStorage
    const apiKey = localStorage.getItem('openaiApiKey');
    
    if (!apiKey) {
      console.error('No OpenAI API key found');
      throw new Error('OpenAI API key is required');
    }
    
    // Initialize Toolhouse client
    const toolhouse = new Toolhouse({
      apiKey: TOOLHOUSE_API_KEY,
      metadata: {
        "id": "daniele",
        "timezone": "0"
      }
    });
    
    console.log('Toolhouse client initialized');
    
    // Initialize OpenAI client
    const client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
    
    console.log('OpenAI client initialized');
    
    // Updated prompt to match the new format
    // Include the word "json" to allow for json_object response format
    const messages = [{
      "role": "user",
      "content": `Strictly List 3 Italian words then save it to my memory, make sure the 3 Italian words are not present in my memory so I'm always learning a new set of words with its translations in English.

Please return the result as a JSON array in the following format:
[
    { "italian": "FirstWord", "english": "FirstTranslation" },
    { "italian": "SecondWord", "english": "SecondTranslation" },
    { "italian": "ThirdWord", "english": "ThirdTranslation" }
]

IMPORTANT RULES:
- DO NOT add any explanation or text, ONLY the JSON array.
- Each word should be a common Italian noun useful for beginners.`,
    }];
    
    console.log('Getting Toolhouse tools...');
    const tools = await toolhouse.getTools();
    
    console.log('Making first API call to OpenAI...');
    const chatCompletion = await client.chat.completions.create({
      messages,
      model: MODEL,
      tools,
      // response_format is optional now since we're more flexible with parsing
    });
    
    console.log('Running Toolhouse tools...');
    const openAiMessage = await toolhouse.runTools(chatCompletion);
    
    console.log('Making final API call to OpenAI...');
    const newMessages = [...messages, ...openAiMessage];
    const chatCompleted = await client.chat.completions.create({
      messages: newMessages,
      model: MODEL,
      tools,
      // response_format is optional now since we're more flexible with parsing
    });
    
    // Extract the response
    const content = chatCompleted.choices[0]?.message?.content || '';
    console.log('Raw content from Toolhouse/OpenAI:', content);
    
    // Parse the JSON response with our robust handler
    return extractAndValidateJSON(content);
    
  } catch (error) {
    console.error('Error fetching Italian words:', error);
    
    // Return default words if there's an error
    return [
      { italian: "albero", english: "tree" },
      { italian: "casa", english: "house" },
      { italian: "libro", english: "book" }
    ];
  }
};

// Function to convert Italian word responses to ItalianWord format
export const convertToItalianWords = (
  wordResponses: ItalianWordResponse[]
): any[] => {
  // Map the words to the ItalianWord format
  return wordResponses.map((word, index) => ({
    id: Date.now() + index, // Generate a unique ID
    italian: word.italian,
    english: word.english, 
    category: 'Generated',
    difficulty: 'intermediate',
    example: `Example: ${word.italian}`, // Simple example
  }));
};