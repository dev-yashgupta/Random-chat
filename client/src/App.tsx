import { useEffect, useRef } from 'react';
import { AppProvider, useApp } from './contexts/AppContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import LandingScreen from './components/LandingScreen.tsx';
import WaitingScreen from './components/WaitingScreen.tsx';
import ChatScreen from './components/ChatScreen.tsx';
import { useSocket } from './hooks/useSocket.ts';
import { generateUserId } from './utils/user.ts';

function AppContent() {
  const { state, setUserId, setError } = useApp();
  const { connect, disconnect, isConnected } = useSocket();
  const connectionAttemptedRef = useRef(false);

  // Initialize user ID on mount
  useEffect(() => {
    const userId = generateUserId();
    setUserId(userId);
  }, [setUserId]);

  // Connect to socket when user ID is available
  useEffect(() => {
    if (state.userId && !isConnected && !connectionAttemptedRef.current) {
      connectionAttemptedRef.current = true;
      connect(state.userId).catch(() => {
        connectionAttemptedRef.current = false; // Allow retry on failure
      });
    }
  }, [state.userId, isConnected]); // Include isConnected to reset attempt flag

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []); // Empty dependency array for cleanup only

  // Handle connection errors
  useEffect(() => {
    if (state.error) {
      console.error('App error:', state.error);
    }
  }, [state.error]);

  const renderScreen = () => {
    switch (state.screen) {
      case 'landing':
        return <LandingScreen />;
      case 'waiting':
        return <WaitingScreen />;
      case 'chatting':
        return <ChatScreen />;
      default:
        return <LandingScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${state.screen === 'chatting' ? 'h-screen flex flex-col' : 'container mx-auto px-4 py-8'}`}>
        {state.screen !== 'chatting' && (
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Random-chat
            </h1>
            <p className="text-gray-600">
              Connect with strangers instantly - Text or Video Chat
            </p>
            
            {/* Connection status indicator */}
            <div className="mt-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <span className={`w-2 h-2 rounded-full mr-1 ${
                  isConnected ? 'bg-green-400' : 'bg-red-400'
                }`}></span>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </header>
        )}

        {/* Error display */}
        {state.error && state.screen !== 'chatting' && (
          <div className="max-w-md mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error
                </h3>
                <div className="mt-1 text-sm text-red-700">
                  {state.error}
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => setError(null)}
                    className="text-sm text-red-800 hover:text-red-900 font-medium"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats display */}
        {state.stats.connectedUsers > 0 && state.screen !== 'chatting' && (
          <div className="max-w-md mx-auto mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-sm text-blue-800">
              <span className="font-medium">{state.stats.connectedUsers}</span> users online
              {state.stats.usersByMode.text > 0 && (
                <span className="ml-2">
                  💬 {state.stats.usersByMode.text}
                </span>
              )}
              {state.stats.usersByMode.video > 0 && (
                <span className="ml-2">
                  📹 {state.stats.usersByMode.video}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Main content */}
        {state.screen === 'chatting' ? (
          <div className="flex-1">
            {renderScreen()}
          </div>
        ) : (
          renderScreen()
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
