// src/components/ToolhouseDiagnostics.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle, Key } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OpenAI from 'openai';
import { Toolhouse } from '@toolhouseai/sdk';

const ToolhouseDiagnostics: React.FC = () => {
  const [openaiApiKey, setOpenaiApiKey] = useState(localStorage.getItem('openaiApiKey') || '');
  const [toolhouseApiKey, setToolhouseApiKey] = useState("th-Iim4benuS8hMsDNCWAFtOrQknQa5P9EsprRiaTIHpP0");
  const [metadataId, setMetadataId] = useState("daniele");
  const [isLoading, setIsLoading] = useState(false);
  const [openaiTestResult, setOpenaiTestResult] = useState<{success: boolean; message: string} | null>(null);
  const [toolhouseTestResult, setToolhouseTestResult] = useState<{success: boolean; message: string} | null>(null);
  const [integrationTestResult, setIntegrationTestResult] = useState<{success: boolean; message: string; data?: any} | null>(null);
  const [responseData, setResponseData] = useState<string>('');
  const [activeTab, setActiveTab] = useState('openai');
  const [model, setModel] = useState('gpt-3.5-turbo');

  // Save OpenAI API key
  const saveOpenaiApiKey = () => {
    if (openaiApiKey.trim()) {
      localStorage.setItem('openaiApiKey', openaiApiKey.trim());
      // Test immediately after saving
      testOpenaiConnection();
    }
  };

  // Test OpenAI API connection
  const testOpenaiConnection = async () => {
    setIsLoading(true);
    setOpenaiTestResult(null);
    
    try {
      console.log('Testing OpenAI API connection...');
      
      // Create OpenAI client
      const client = new OpenAI({
        apiKey: openaiApiKey.trim(),
        dangerouslyAllowBrowser: true
      });
      
      // Make a simple test request
      const completion = await client.chat.completions.create({
        messages: [{ role: 'user', content: 'Say "OpenAI connection successful"' }],
        model: model,
        max_tokens: 10
      });
      
      const response = completion.choices[0]?.message?.content || '';
      console.log('OpenAI test response:', response);
      
      setOpenaiTestResult({
        success: true,
        message: 'OpenAI API connection successful!'
      });
      
      // Update localStorage
      localStorage.setItem('openaiApiKey', openaiApiKey.trim());
    } catch (error) {
      console.error('OpenAI API connection test failed:', error);
      
      // Get detailed error message
      let errorMessage = 'Connection failed';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setOpenaiTestResult({
        success: false,
        message: `OpenAI API connection failed: ${errorMessage}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test Toolhouse SDK
  const testToolhouseConnection = async () => {
    setIsLoading(true);
    setToolhouseTestResult(null);
    
    try {
      console.log('Testing Toolhouse connection...');
      
      // Initialize Toolhouse client
      const toolhouse = new Toolhouse({
        apiKey: toolhouseApiKey,
        metadata: {
          "id": metadataId,
          "timezone": "0"
        }
      });
      
      // Try to get tools - this will verify the connection
      const tools = await toolhouse.getTools();
      console.log('Toolhouse tools retrieved:', tools);
      
      setToolhouseTestResult({
        success: true,
        message: `Toolhouse connection successful! Retrieved ${Array.isArray(tools) ? tools.length : 'unknown number of'} tools.`
      });
    } catch (error) {
      console.error('Toolhouse connection test failed:', error);
      
      // Get detailed error message
      let errorMessage = 'Connection failed';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setToolhouseTestResult({
        success: false,
        message: `Toolhouse connection failed: ${errorMessage}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test full integration with the new prompt format
  const testIntegration = async () => {
    setIsLoading(true);
    setIntegrationTestResult(null);
    setResponseData('');
    
    try {
      console.log('Testing full Toolhouse + OpenAI integration...');
      
      // Initialize clients
      const toolhouse = new Toolhouse({
        apiKey: toolhouseApiKey,
        metadata: {
          "id": metadataId,
          "timezone": "0"
        }
      });
      
      const client = new OpenAI({
        apiKey: openaiApiKey,
        dangerouslyAllowBrowser: true
      });
      
      // Use the updated prompt format
      const messages = [{
        "role": "user",
        "content": `Strictly List 3 Italian words then save it to my memory, make sure the 3 Italian words are not present in my memory so im always learning a new set of words with its translations in English.
EXPECTED OUTPUT FORMAT (IMPORTANT):
    { "italian": "FirstWord", "english": "FirstTranslation" },
    { "italian": "SecondWord", "english": "SecondTranslation" },
    { "italian": "ThirdWord", "english": "ThirdTranslation" }
IMPORTANT RULES:
- DO NOT add any explanation or text ONLY the numbered list.`,
      }];
      
      // Get tools
      console.log('Getting Toolhouse tools...');
      const tools = await toolhouse.getTools();
      console.log('Got tools:', tools);
      
      // First API call
      console.log('Making first API call to OpenAI...');
      const chatCompletion = await client.chat.completions.create({
        messages,
        model: model,
        tools,
        response_format: { type: "json_object" } // Force JSON response format
      });
      console.log('First completion:', chatCompletion);
      
      // Run tools
      console.log('Running Toolhouse tools...');
      const openAiMessage = await toolhouse.runTools(chatCompletion);
      console.log('Tool execution result:', openAiMessage);
      
      // Final API call
      console.log('Making final API call to OpenAI...');
      const newMessages = [...messages, ...openAiMessage];
      const chatCompleted = await client.chat.completions.create({
        messages: newMessages,
        model: model,
        tools,
        response_format: { type: "json_object" } // Force JSON response format
      });
      
      // Extract the response
      const content = chatCompleted.choices[0]?.message?.content || '';
      console.log('Final response:', content);
      
      // Update state with results
      setResponseData(content);
      
      // Parse JSON if possible
      try {
        // Try to extract array of word pairs
        const arrayMatch = content.match(/\[\s*{[\s\S]*}\s*\]/);
        if (arrayMatch) {
          const cleanedJson = arrayMatch[0];
          const parsed = JSON.parse(cleanedJson);
          
          if (Array.isArray(parsed) && parsed.length > 0) {
            const validItems = parsed.filter(item => 
              item.italian && item.english
            );
            
            if (validItems.length > 0) {
              setIntegrationTestResult({
                success: true,
                message: 'Integration test successful! Parsed word data:',
                data: validItems.slice(0, 3)
              });
              return;
            }
          }
        }
        
        // Try to extract individual JSON objects
        const itemMatches = [...content.matchAll(/{\s*"italian"\s*:\s*"([^"]+)"\s*,\s*"english"\s*:\s*"([^"]+)"\s*}/g)];
        if (itemMatches.length > 0) {
          const data = itemMatches.map(match => ({
            italian: match[1],
            english: match[2]
          })).slice(0, 3);
          
          setIntegrationTestResult({
            success: true,
            message: 'Integration test successful! Extracted word data:',
            data: data
          });
          return;
        }
        
        // If we can't parse properly, show the raw response
        setIntegrationTestResult({
          success: true,
          message: 'Received response, but need to analyze result format. See raw output below.',
        });
      } catch (error) {
        console.error('Error processing response:', error);
        
        // Show response even if parsing failed
        setIntegrationTestResult({
          success: true,
          message: 'Received response, but could not process it. See raw output below.',
        });
      }
    } catch (error) {
      console.error('Integration test failed:', error);
      
      // Get detailed error message
      let errorMessage = 'Integration test failed';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setIntegrationTestResult({
        success: false,
        message: `Integration test failed: ${errorMessage}`
      });
      
      // If we have partial response data, still show it
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const respData = (error as any).response?.data;
        if (respData) {
          setResponseData(JSON.stringify(respData, null, 2));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Toolhouse.ai & OpenAI API Diagnostics</CardTitle>
          <CardDescription>
            Test your integration with Toolhouse.ai and OpenAI API to generate Italian words
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="openai">OpenAI API</TabsTrigger>
              <TabsTrigger value="toolhouse">Toolhouse SDK</TabsTrigger>
              <TabsTrigger value="integration">Full Integration</TabsTrigger>
            </TabsList>
            
            {/* OpenAI API Tab */}
            <TabsContent value="openai" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai-api-key">OpenAI API Key</Label>
                <div className="flex gap-2">
                  <Input 
                    id="openai-api-key"
                    type="password"
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="Enter your OpenAI API key"
                  />
                  <Button onClick={saveOpenaiApiKey}>Save</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">OpenAI Dashboard</a>
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model-select">Model</Label>
                <Input 
                  id="model-select"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="OpenAI model name"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: gpt-3.5-turbo, gpt-4o-mini, or gpt-4 if you have access
                </p>
              </div>
              
              {openaiTestResult && (
                <Alert variant={openaiTestResult.success ? "default" : "destructive"}>
                  {openaiTestResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertTitle>{openaiTestResult.success ? "Success" : "Error"}</AlertTitle>
                  <AlertDescription>{openaiTestResult.message}</AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            {/* Toolhouse Tab */}
            <TabsContent value="toolhouse" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="toolhouse-api-key">Toolhouse API Key</Label>
                <Input 
                  id="toolhouse-api-key"
                  type="text"
                  value={toolhouseApiKey}
                  onChange={(e) => setToolhouseApiKey(e.target.value)}
                  placeholder="Enter your Toolhouse API key"
                />
                <p className="text-xs text-muted-foreground">
                  Default key: th-Iim4benuS8hMsDNCWAFtOrQknQa5P9EsprRiaTIHpP0
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="metadata-id">Metadata ID</Label>
                <Input 
                  id="metadata-id"
                  type="text"
                  value={metadataId}
                  onChange={(e) => setMetadataId(e.target.value)}
                  placeholder="Enter your metadata ID"
                />
                <p className="text-xs text-muted-foreground">
                  Default ID: daniele
                </p>
              </div>
              
              {toolhouseTestResult && (
                <Alert variant={toolhouseTestResult.success ? "default" : "destructive"}>
                  {toolhouseTestResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertTitle>{toolhouseTestResult.success ? "Success" : "Error"}</AlertTitle>
                  <AlertDescription>{toolhouseTestResult.message}</AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            {/* Integration Tab */}
            <TabsContent value="integration" className="space-y-4">
              <div className="space-y-4">
                <p>This test will run the full integration between Toolhouse.ai and OpenAI to generate Italian words with translations.</p>
                
                {integrationTestResult && (
                  <Alert variant={integrationTestResult.success ? "default" : "destructive"}>
                    {integrationTestResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertTitle>{integrationTestResult.success ? "Success" : "Error"}</AlertTitle>
                    <AlertDescription>{integrationTestResult.message}</AlertDescription>
                  </Alert>
                )}
                
                {integrationTestResult?.data && (
                  <div className="mt-4 p-4 bg-slate-100 rounded-md">
                    <h4 className="text-sm font-medium mb-2">Parsed Response:</h4>
                    <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-64">
                      {JSON.stringify(integrationTestResult.data, null, 2)}
                    </pre>
                  </div>
                )}
                
                {responseData && (
                  <div className="mt-4">
                    <Label htmlFor="response-data">Raw Response</Label>
                    <Textarea 
                      id="response-data"
                      value={responseData}
                      readOnly
                      rows={6}
                      className="font-mono text-xs"
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-end gap-2">
          <Button onClick={() => {
            if (activeTab === 'openai') {
              localStorage.setItem('openaiApiKey', openaiApiKey);
            }
            setActiveTab('openai');
          }} variant="outline">
            Reset
          </Button>
          
          <Button 
            onClick={() => {
              if (activeTab === 'openai') testOpenaiConnection();
              else if (activeTab === 'toolhouse') testToolhouseConnection();
              else if (activeTab === 'integration') testIntegration();
            }}
            disabled={isLoading || (activeTab === 'openai' && !openaiApiKey.trim())}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>Run {activeTab === 'openai' ? 'OpenAI' : activeTab === 'toolhouse' ? 'Toolhouse' : 'Integration'} Test</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
export default ToolhouseDiagnostics;