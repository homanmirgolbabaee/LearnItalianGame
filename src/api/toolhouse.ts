// src/api/toolhouse.ts
// This would typically be a server-side file in Next.js, Express or similar

import { Toolhouse } from '@toolhouseai/sdk';
import OpenAI from 'openai';

// NOTE: This file is for reference and would need to be implemented
// in your actual backend service, not in the frontend React app

const MODEL = 'llama-3.3-70b-versatile';

export async function generateItalianWords() {
  try {
    const toolhouse = new Toolhouse({
      apiKey: process.env.TOOLHOUSE_API_KEY || "th-Iim4benuS8hMsDNCWAFtOrQknQa5P9EsprRiaTIHpP0",
      metadata: {
        "id": "daniele",
        "timezone": "0"
      }
    });
    
    const client = new OpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQCLOUD_API_KEY,
    });
    
    const messages = [{
      "role": "user",
      "content": "Stricly List 3 Italian words then save it to my memory, make sure the 3 Italian words are not present in my memory so im always learning a new set of words.\nEXPECTED OUTPUT FORMAT (IMPORTANT):\n{\n  \"word_1\": \"FirstWord\",\n  \"word_2\": \"SecondWord\",\n  \"word_3\": \"ThirdWord\"\n}\nIMPORTANT RULES:\n- DO NOT add any explanation or text ONLY the numbered list.",
    }];
    
    const tools = await toolhouse.getTools();
    
    const chatCompletion = await client.chat.completions.create({
      messages,
      model: MODEL,
      tools
    });
    
    const openAiMessage = await toolhouse.runTools(chatCompletion);
    const newMessages = [...messages, ...openAiMessage];
    
    const chatCompleted = await client.chat.completions.create({
      messages: newMessages,
      model: MODEL,
      tools
    });
    
    // Extract the response
    const content = chatCompleted.choices[0]?.message?.content || '';
    
    // Parse the JSON response
    try {
      // Extract JSON from the response if it's wrapped in text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      const wordsObj = JSON.parse(jsonStr);
      
      return {
        success: true,
        data: wordsObj
      };
    } catch (parseError) {
      console.error('Error parsing JSON from LLM response:', parseError);
      console.log('Raw content:', content);
      
      return {
        success: false,
        error: 'Failed to parse response from language model'
      };
    }
  } catch (error) {
    console.error('Error generating Italian words:', error);
    
    return {
      success: false,
      error: 'Failed to generate Italian words'
    };
  }
}

// Function to translate Italian words to English
export async function translateWords(italianWords: string[]) {
  try {
    // This would typically use a translation API or another LLM call
    // For this example, we'll use a predefined map
    
    const client = new OpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQCLOUD_API_KEY,
    });
    
    const prompt = `Translate the following Italian words to English:
    ${italianWords.join(', ')}
    
    Return ONLY a JSON object with the Italian words as keys and English translations as values, like this:
    {
      "italiano": "italian",
      "parola": "word"
    }`;
    
    const completion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL,
      response_format: { type: 'json_object' }
    });
    
    const content = completion.choices[0]?.message?.content || '{}';
    const translations = JSON.parse(content);
    
    return {
      success: true,
      translations
    };
  } catch (error) {
    console.error('Error translating words:', error);
    
    return {
      success: false,
      error: 'Failed to translate Italian words'
    };
  }
}