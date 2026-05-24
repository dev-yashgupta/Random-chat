import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext.tsx';
import { useSocket } from '../hooks/useSocket.ts';
import type { ChatMode } from '../types/index.ts';

export default function LandingScreen() {
  const { state } = useApp();
  const { joinQueue, isConnected } = useSocket();
  const [selectedMode, setSelectedMode] = useState<ChatMode | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Reset starting state when screen changes away from landing
  useEffect(() => {
    if (state.screen !== 'landing') {
      setIsStarting(false);
    }
  }, [state.screen]);

  const handleModeSelect = (mode: ChatMode) => {
    setSelectedMode(mode);
  };

  const handleStartChat = async () => {
    if (!selectedMode || !termsAccepted || !isConnected || isStarting) {
      return;
    }

    setIsStarting(true);
    
    try {
      joinQueue(selectedMode);
      // Don't reset isStarting here - let the screen change handle it
    } catch (error) {
      console.error('Failed to start chat:', error);
      setIsStarting(false);
    }
  };

  const canStartChat = selectedMode && termsAccepted && isConnected && !isStarting;

  return (
    <div className="max-w-md mx-auto">
      {/* Main card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-900">
          Choose Chat Mode
        </h2>
        
        {/* Mode selection */}
        <div className="space-y-4 mb-6">
          <button
            onClick={() => handleModeSelect('text')}
            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedMode === 'text'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-3">
              <span className="text-2xl">💬</span>
              <div className="text-left">
                <div className="font-semibold">Text Chat</div>
                <div className="text-sm opacity-75">
                  Chat with strangers using text messages
                </div>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => handleModeSelect('video')}
            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedMode === 'video'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-3">
              <span className="text-2xl">📹</span>
              <div className="text-left">
                <div className="font-semibold">Video Chat</div>
                <div className="text-sm opacity-75">
                  Face-to-face conversations with video and audio
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Terms and conditions */}
        <div className="mb-6">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <div className="text-sm text-gray-600">
              <span>I agree to the </span>
              <button className="text-primary-600 hover:text-primary-700 underline">
                Terms of Service
              </button>
              <span> and </span>
              <button className="text-primary-600 hover:text-primary-700 underline">
                Privacy Policy
              </button>
              <span>. I confirm that I am 18+ years old.</span>
            </div>
          </label>
        </div>

        {/* Start button */}
        <button
          onClick={handleStartChat}
          disabled={!canStartChat}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
            canStartChat
              ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isStarting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Starting...</span>
            </div>
          ) : (
            'Start Chat'
          )}
        </button>

        {/* Connection status warning */}
        {!isConnected && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-yellow-800">
                Connecting to server...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Important Notice</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Conversations are not recorded or monitored</li>
          <li>• Be respectful and follow community guidelines</li>
          <li>• You can report inappropriate behavior</li>
          <li>• Click "Next" to skip to a new conversation</li>
          <li>• Your privacy and safety are important to us</li>
        </ul>
      </div>

      {/* Statistics */}
      {state.stats.connectedUsers > 0 && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center space-x-4 text-sm text-gray-600 bg-white rounded-full px-4 py-2 shadow-sm">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>{state.stats.connectedUsers} online</span>
            </div>
            {state.stats.usersByMode.text > 0 && (
              <div className="flex items-center space-x-1">
                <span>💬</span>
                <span>{state.stats.usersByMode.text}</span>
              </div>
            )}
            {state.stats.usersByMode.video > 0 && (
              <div className="flex items-center space-x-1">
                <span>📹</span>
                <span>{state.stats.usersByMode.video}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}