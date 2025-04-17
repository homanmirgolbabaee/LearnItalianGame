// src/components/DebugConsole.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LogMessage {
  id: number;
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: Date;
}

const DebugConsole: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const consoleEndRef = useRef<HTMLDivElement>(null);
  
  // Intercept console logs
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleInfo = console.info;
    
    let logId = 0;
    
    console.log = (...args) => {
      originalConsoleLog(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setLogs(prevLogs => [
        ...prevLogs, 
        { id: logId++, type: 'log', message, timestamp: new Date() }
      ]);
    };
    
    console.error = (...args) => {
      originalConsoleError(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setLogs(prevLogs => [
        ...prevLogs, 
        { id: logId++, type: 'error', message, timestamp: new Date() }
      ]);
    };
    
    console.warn = (...args) => {
      originalConsoleWarn(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setLogs(prevLogs => [
        ...prevLogs, 
        { id: logId++, type: 'warn', message, timestamp: new Date() }
      ]);
    };
    
    console.info = (...args) => {
      originalConsoleInfo(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setLogs(prevLogs => [
        ...prevLogs, 
        { id: logId++, type: 'info', message, timestamp: new Date() }
      ]);
    };
    
    // Restore original console methods on cleanup
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.info = originalConsoleInfo;
    };
  }, []);
  
  // Auto-scroll to bottom of console when new logs appear
  useEffect(() => {
    if (consoleEndRef.current && isOpen && !isMinimized) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen, isMinimized]);
  
  const clearLogs = () => {
    setLogs([]);
  };
  
  const toggleConsole = () => {
    setIsOpen(!isOpen);
    if (isMinimized) {
      setIsMinimized(false);
    }
  };
  
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.type === filter;
  });
  
  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-amber-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-300';
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };
  
  return (
    <>
      {/* Debug button */}
      <Button
        onClick={toggleConsole}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white"
        variant="outline"
        size="sm"
      >
        {isOpen ? 'Hide Debug' : 'Debug'}
      </Button>
      
      {/* Debug console */}
      {isOpen && (
        <div 
          className={`fixed bottom-16 right-4 z-50 bg-gray-900 text-white border border-gray-700 rounded-md shadow-lg ${
            isMinimized ? 'w-64 h-12' : 'w-[600px] h-[400px]'
          } transition-all duration-200 flex flex-col`}
        >
          {/* Console header */}
          <div className="flex justify-between items-center p-2 bg-gray-800 rounded-t-md">
            <div className="flex items-center">
              <span className="font-mono text-sm">Debug Console</span>
              <span className="ml-2 text-xs bg-gray-700 px-2 py-0.5 rounded-full">
                {logs.length} logs
              </span>
            </div>
            <div className="flex gap-1">
              <Button 
                onClick={clearLogs} 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
              >
                <RotateCcw size={14} />
              </Button>
              <Button 
                onClick={toggleMinimize} 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
              >
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </Button>
              <Button 
                onClick={toggleConsole} 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
              >
                <X size={14} />
              </Button>
            </div>
          </div>
          
          {/* Console filters */}
          {!isMinimized && (
            <div className="flex gap-2 p-2 bg-gray-800 border-t border-b border-gray-700">
              <Button
                onClick={() => setFilter('all')}
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="h-6 text-xs"
              >
                All
              </Button>
              <Button
                onClick={() => setFilter('log')}
                variant={filter === 'log' ? 'default' : 'outline'}
                size="sm"
                className="h-6 text-xs"
              >
                Log
              </Button>
              <Button
                onClick={() => setFilter('error')}
                variant={filter === 'error' ? 'default' : 'outline'}
                size="sm"
                className="h-6 text-xs"
              >
                Errors
              </Button>
              <Button
                onClick={() => setFilter('warn')}
                variant={filter === 'warn' ? 'default' : 'outline'}
                size="sm"
                className="h-6 text-xs"
              >
                Warnings
              </Button>
            </div>
          )}
          
          {/* Console content */}
          {!isMinimized && (
            <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No logs to display
                </div>
              ) : (
                <>
                  {filteredLogs.map(log => (
                    <div key={log.id} className="mb-1 border-b border-gray-800 pb-1">
                      <div className="flex items-start">
                        <span className="text-gray-500 mr-2">[{formatTime(log.timestamp)}]</span>
                        <span className={`uppercase font-bold mr-2 ${getLogTypeColor(log.type)}`}>
                          {log.type}
                        </span>
                        <span className="whitespace-pre-wrap break-words">{log.message}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={consoleEndRef} />
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default DebugConsole;