import { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useSocket } from '../hooks/useSocket';
import type { Message } from '../types';

interface TextChatProps {
  onNext: () => void;
  onReport: () => void;
  onEndChat: () => void;
}

export default function TextChat({ onNext, onReport, onEndChat }: TextChatProps) {
  const { state } = useApp();
  const { sendMessage } = useSocket();
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    console.log('=== FRONTEND: handleSendMessage called ===');
    console.log('Sending message:', inputMessage.trim());
    console.log('Session ID:', state.sessionId);
    console.log('Partner ID:', state.partnerId);
    console.log('Component instance ID:', Math.random().toString(36).substr(2, 9));
    
    sendMessage(inputMessage.trim());
    setInputMessage('');
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    
    // Handle typing indicator
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      // In a real implementation, you'd send typing indicator to partner
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false);
    }
  };

  const formatMessageTime = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message: Message) => {
    return (
      <div
        key={message.id}
        className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            message.isOwn
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-900'
          }`}
        >
          <p className="text-sm">{message.content}</p>
          <p
            className={`text-xs mt-1 ${
              message.isOwn ? 'text-blue-100' : 'text-gray-500'
            }`}
          >
            {formatMessageTime(message.timestamp)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <div>
            <h3 className="font-semibold text-gray-900">Text Chat</h3>
            <p className="text-sm text-gray-500">
              Connected to stranger
              {partnerTyping && (
                <span className="ml-2 text-blue-600">
                  <span className="animate-pulse">typing...</span>
                </span>
              )}
            </p>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onNext}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            title="Find new partner"
          >
            Next
          </button>
          <button
            onClick={onReport}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            title="Report user"
          >
            Report
          </button>
          <button
            onClick={onEndChat}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            title="End chat"
          >
            End
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {state.messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="mb-4">
              <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.471L3 21l2.471-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">Start the conversation!</p>
            <p className="text-sm">
              Say hello to your chat partner. Be friendly and respectful.
            </p>
            {import.meta.env.DEV && (
              <div className="mt-4 text-xs text-gray-400 bg-gray-100 p-2 rounded">
                <p>Debug: Session ID: {state.sessionId || 'None'}</p>
                <p>Partner ID: {state.partnerId || 'None'}</p>
                <p>Messages: {state.messages.length}</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {state.messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={1000}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              inputMessage.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Send
          </button>
        </div>
        
        {/* Character count */}
        <div className="mt-2 text-right">
          <span className={`text-xs ${
            inputMessage.length > 900 ? 'text-red-500' : 'text-gray-400'
          }`}>
            {inputMessage.length}/1000
          </span>
        </div>
      </div>
    </div>
  );
}