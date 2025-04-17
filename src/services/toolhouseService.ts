// src/services/toolhouseService.ts
import { Toolhouse } from '@toolhouseai/sdk';
import OpenAI from 'openai';

// Define the response format from Toolhouse
export interface ToolhouseWordsResponse {
  word_1: string;
  word_2: string;
  word_3: string;
}

// Global settings
const TOOLHOUSE_API_KEY = "th-Iim4benuS8hMsDNCWAFtOrQknQa5P9EsprRiaTIHpP0";
const MODEL = "gpt-3.5-turbo";

// Set OpenAI API key (saved to localStorage)
export const setOpenAIApiKey = (key: string) => {
  localStorage.setItem('openaiApiKey', key);
  console.log('OpenAI API key saved to localStorage');
};

// Function to extract and validate JSON from various response formats
const extractAndValidateJSON = (responseText: string): ToolhouseWordsResponse => {
  console.log("Original LLM response:", responseText);
  
  // Check if empty
  if (!responseText || responseText.trim() === '') {
    console.log("Empty response detected, providing default words");
    // Return emergency fallback words
    return {
      word_1: "tavolo",
      word_2: "sedia", 
      word_3: "finestra"
    };
  }
  
  // Try to extract JSON if there's any in the response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const jsonStr = jsonMatch[0];
    console.log("Extracted JSON string:", jsonStr);
    
    try {
      const parsed = JSON.parse(jsonStr);
      console.log("Successfully parsed JSON:", parsed);
      
      // Validate if it has the expected structure
      if (parsed.word_1 && parsed.word_2 && parsed.word_3) {
        return parsed as ToolhouseWordsResponse;
      } else {
        console.log("JSON missing required fields");
      }
    } catch (error) {
      console.log("Error parsing extracted JSON:", error);
    }
  }
  
  // If we can parse words from text, build the JSON manually
  const italianWordPattern = /\b([A-Za-zÀ-ÖØ-öø-ÿ]+)\s*\(([^)]+)\)/g;
  const wordMatches = Array.from(responseText.matchAll(italianWordPattern));
  
  if (wordMatches.length >= 3) {
    console.log("Extracted words from text:", wordMatches);
    return {
      word_1: wordMatches[0][1],
      word_2: wordMatches[1][1],
      word_3: wordMatches[2][1]
    };
  }
  
  // Try to extract any Italian-looking words from the text
  const wordExtraction = responseText.match(/\b[A-Za-zÀ-ÖØ-öø-ÿ]{3,}\b/g);
  if (wordExtraction && wordExtraction.length >= 3) {
    console.log("Extracted potential Italian words:", wordExtraction);
    return {
      word_1: wordExtraction[0],
      word_2: wordExtraction[1],
      word_3: wordExtraction[2]
    };
  }
  
  // If all else fails, return fallback words
  console.log("Falling back to default Italian words");
  return {
    word_1: "pane",  // bread
    word_2: "acqua", // water
    word_3: "vino"   // wine
  };
};

// Function to fetch new Italian words from Toolhouse
export const fetchItalianWords = async (): Promise<ToolhouseWordsResponse> => {
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
    
    // Use a more explicit prompt to ensure proper JSON format
    const messages = [{
      "role": "user",
      "content": `Generate 3 Italian words and save them to my memory.
      
OUTPUT FORMAT (FOLLOW THIS EXACTLY):
{
  "word_1": "FirstItalianWord",
  "word_2": "SecondItalianWord",
  "word_3": "ThirdItalianWord"
}

RULES:
- Provide ONLY the JSON object with no additional text
- Use common Italian nouns that would be useful for a language learner
- Make sure the words are spelled correctly in Italian
- Do not include translations or explanations in your response`,
    }];
    
    console.log('Getting Toolhouse tools...');
    const tools = await toolhouse.getTools();
    
    console.log('Making first API call to OpenAI...');
    const chatCompletion = await client.chat.completions.create({
      messages,
      model: MODEL,
      tools,
      response_format: { type: "json_object" } // Force JSON response format
    });
    
    console.log('Running Toolhouse tools...');
    const openAiMessage = await toolhouse.runTools(chatCompletion);
    
    console.log('Making final API call to OpenAI...');
    const newMessages = [...messages, ...openAiMessage];
    const chatCompleted = await client.chat.completions.create({
      messages: newMessages,
      model: MODEL,
      tools,
      response_format: { type: "json_object" } // Force JSON response format
    });
    
    // Extract the response
    const content = chatCompleted.choices[0]?.message?.content || '';
    console.log('Raw content from Toolhouse/OpenAI:', content);
    
    // Parse the JSON response with our robust handler
    return extractAndValidateJSON(content);
    
  } catch (error) {
    console.error('Error fetching Italian words:', error);
    
    // Return default words if there's an error
    return {
      word_1: "albero", // tree
      word_2: "casa",   // house
      word_3: "libro"   // book
    };
  }
};

// Function to translate Italian words to English using OpenAI
export const translateItalianWords = async (
  words: string[]
): Promise<{[key: string]: string}> => {
  try {
    console.log('Translating Italian words:', words);
    
    // Get the API key from localStorage
    const apiKey = localStorage.getItem('openaiApiKey');
    
    if (!apiKey) {
      console.error('No OpenAI API key found');
      // Return default translations instead of throwing
      const defaultTranslations: {[key: string]: string} = {};
      words.forEach((word, index) => {
        // Emergency fallback translations for common words
        if (word === "tavolo") defaultTranslations[word] = "table";
        else if (word === "sedia") defaultTranslations[word] = "chair";
        else if (word === "finestra") defaultTranslations[word] = "window";
        else if (word === "pane") defaultTranslations[word] = "bread";
        else if (word === "acqua") defaultTranslations[word] = "water";
        else if (word === "vino") defaultTranslations[word] = "wine";
        else if (word === "albero") defaultTranslations[word] = "tree";
        else if (word === "casa") defaultTranslations[word] = "house";
        else if (word === "libro") defaultTranslations[word] = "book";
        else defaultTranslations[word] = `Italian word ${index+1}`;
      });
      return defaultTranslations;
    }
    
    // Initialize OpenAI client
    const client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
    
    const prompt = `Translate these Italian words to English:
    ${words.join(', ')}
    
    Return ONLY a JSON object with the Italian words as keys and English translations as values, like this:
    {
      "italiano": "italian",
      "parola": "word"
    }`;
    
    const completion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL,
      response_format: { type: 'json_object' } // Force JSON response format
    });
    
    const content = completion.choices[0]?.message?.content || '{}';
    console.log('Raw translation response:', content);
    
    try {
      const translations = JSON.parse(content);
      console.log('Parsed translations:', translations);
      
      // Check if we have all the translations
      const missingTranslations = words.filter(word => !translations[word]);
      if (missingTranslations.length > 0) {
        console.log('Missing translations for:', missingTranslations);
        
        // Add placeholder translations for missing words
        missingTranslations.forEach(word => {
          translations[word] = `${word} (in Italian)`;
        });
      }
      
      return translations;
    } catch (parseError) {
      console.error('Error parsing translation response:', parseError);
      
      // Create default translations
      const defaultTranslations: {[key: string]: string} = {};
      words.forEach(word => {
        defaultTranslations[word] = `${word} (in Italian)`;
      });
      return defaultTranslations;
    }
  } catch (error) {
    console.error('Error translating words:', error);
    
    // Create default translations in case of error
    const fallbackTranslations: {[key: string]: string} = {};
    words.forEach(word => {
      fallbackTranslations[word] = `${word} (in Italian)`;
    });
    return fallbackTranslations;
  }
};

// Function to convert Toolhouse response to ItalianWord format
export const convertToolhouseResponseToItalianWords = (
  response: ToolhouseWordsResponse,
  // Optional translations - if not provided, we'll use placeholders
  translations?: {[key: string]: string}
): any[] => {
  const words = [response.word_1, response.word_2, response.word_3];
  
  // Map the words to the ItalianWord format
  return words.map((word, index) => ({
    id: Date.now() + index, // Generate a unique ID
    italian: word,
    english: translations?.[word] || 'Translation loading...', 
    category: 'Generated',
    difficulty: 'intermediate',
    example: `Example: ${word}`, // Simple example
  }));
};