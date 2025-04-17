// src/App.tsx
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { initElevenLabs } from "@/services/simpleElevenLabsService";
import { getElevenLabsApiKey } from "@/config/env";
import DebugConsole from "@/components/DebugConsole";

const queryClient = new QueryClient();

const App = () => {
  const [isDebugMode, setIsDebugMode] = useState(false);

  // Enable debug mode in development
  useEffect(() => {
    const isDevelopment = import.meta.env.MODE === 'development';
    setIsDebugMode(isDevelopment || window.location.search.includes('debug=true'));
  }, []);

  // Initialize ElevenLabs on app startup if API key is available
  useEffect(() => {
    console.log('App component mounted, checking for ElevenLabs API key');
    const apiKey = getElevenLabsApiKey();
    
    if (apiKey) {
      console.log('API key found, initializing ElevenLabs');
      try {
        initElevenLabs(apiKey);
        console.log("ElevenLabs initialized successfully");
      } catch (error) {
        console.error("Failed to initialize ElevenLabs:", error);
      }
    } else {
      console.log('No API key found, ElevenLabs will not be initialized');
    }
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        
        {/* Debug console - always added but only shown in debug mode */}
        {isDebugMode && <DebugConsole />}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;