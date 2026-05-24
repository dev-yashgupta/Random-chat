import { useState, useRef, useEffect } from 'react';
import { webrtcService } from '../services/webrtcService';
import { useApp } from '../contexts/AppContext';
import { useSocket } from '../hooks/useSocket';
import type { Message } from '../types';

interface VideoChatProps {
  onNext: () => void;
  onReport: () => void;
  onEndChat: () => void;
}

export default function VideoChat({ onNext, onReport, onEndChat }: VideoChatProps) {
  const { state } = useApp();
  const { sendMessage } = useSocket();

  const [isMuted, setIsMuted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'requesting' | 'granted' | 'denied'>('requesting');


  // Chat functionality
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize WebRTC and request media access
  useEffect(() => {
    let mounted = true;

    const initializeVideo = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        // Check if WebRTC is supported
        const isInsecure = window.location.protocol === 'http:' &&
          window.location.hostname !== 'localhost' &&
          window.location.hostname !== '127.0.0.1';

        if (!webrtcService.isSupported()) {
          if (isInsecure) {
            // On HTTP with IP address, WebRTC might be limited but we can still try to connect
            console.warn('WebRTC support limited on HTTP with IP address, enabling fallback mode');

            setPermissionStatus('granted');
            setIsInitializing(false);
            setError('Camera disabled for security (HTTP + IP address). You can see other users. Use localhost for camera access.');

            // Try to initialize peer connection anyway for receiving video
            try {
              webrtcService.initializePeerConnection();
            } catch (e) {
              console.warn('Could not initialize peer connection:', e);
            }

            return;
          } else {
            throw new Error('Video chat is not supported in this browser. Please use Chrome, Firefox, or Safari.');
          }
        }



        // Request camera and microphone access
        console.log('Requesting camera and microphone access...');
        const stream = await webrtcService.requestMediaAccess({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        if (!mounted) return;

        // Wait for video element to be ready and set stream
        const setVideoStream = () => {
          console.log('Checking video ref and stream...');
          console.log('localVideoRef.current:', !!localVideoRef.current);
          console.log('stream:', !!stream);
          console.log('stream tracks:', stream?.getTracks().length || 0);

          if (localVideoRef.current && stream) {
            console.log('Setting video stream to local video element');
            console.log('Stream tracks:', stream.getTracks().map(track => ({
              kind: track.kind,
              enabled: track.enabled,
              readyState: track.readyState
            })));

            localVideoRef.current.srcObject = stream;

            // Ensure video plays
            localVideoRef.current.play().then(() => {
              console.log('Local video started playing');
            }).catch(error => {
              console.error('Failed to play local video:', error);
            });

            console.log('Local video stream set successfully');
            return true;
          } else {
            console.error('Local video ref or stream not available');
            console.error('localVideoRef.current is null:', !localVideoRef.current);
            console.error('stream is null:', !stream);
            return false;
          }
        };

        // Try to set the stream with retry mechanism
        const trySetVideoStream = (attempts = 0) => {
          if (!mounted) return;

          if (setVideoStream()) {
            console.log('Video stream set successfully');
            return;
          }

          if (attempts < 10) { // Try up to 10 times
            console.log(`Video ref not ready, retrying... (attempt ${attempts + 1}/10)`);
            setTimeout(() => trySetVideoStream(attempts + 1), 100);
          } else {
            console.error('Failed to set video stream after 10 attempts');
          }
        };

        trySetVideoStream();

        // Initialize peer connection
        webrtcService.initializePeerConnection();

        setPermissionStatus('granted');
        setIsInitializing(false);

        console.log('Video chat initialized successfully');

      } catch (error) {
        console.error('Failed to initialize video chat:', error);

        if (!mounted) return;

        // Check if this is a browser with camera permission issue due to insecure context
        const isInsecure = window.location.protocol === 'http:' &&
          window.location.hostname !== 'localhost' &&
          window.location.hostname !== '127.0.0.1';

        if (error instanceof Error) {
          if (isInsecure) {
            // Enable fallback mode for any device using HTTP + IP address
            console.log('Camera access failed due to insecure context, enabling fallback mode');

            setPermissionStatus('granted');
            setIsInitializing(false);
            setError('Camera disabled for security (HTTP + IP address). You can see other users. Use localhost for camera access.');

            // Initialize peer connection for receiving video
            try {
              webrtcService.initializePeerConnection();
            } catch (e) {
              console.warn('Could not initialize peer connection:', e);
            }

            return;
          } else {
            setError(error.message);
          }
        } else {
          setError('Failed to initialize video chat. Please check your camera and microphone.');
        }

        setPermissionStatus('denied');
        setIsInitializing(false);
      }
    };

    initializeVideo();

    // Cleanup on unmount
    return () => {
      mounted = false;
      webrtcService.cleanup();
    };
  }, []);

  // Handle video element events
  useEffect(() => {
    const localVideo = localVideoRef.current;

    if (localVideo) {
      const handleLoadedMetadata = () => {
        console.log('Local video metadata loaded, dimensions:', localVideo.videoWidth, 'x', localVideo.videoHeight);
      };

      const handleCanPlay = () => {
        console.log('Local video can play');
      };

      localVideo.addEventListener('loadedmetadata', handleLoadedMetadata);
      localVideo.addEventListener('canplay', handleCanPlay);

      return () => {
        localVideo.removeEventListener('loadedmetadata', handleLoadedMetadata);
        localVideo.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, []);

  // Handle local stream updates when ref becomes available
  useEffect(() => {
    const localStream = webrtcService.getLocalStream();
    if (localStream && localVideoRef.current && !localVideoRef.current.srcObject) {
      console.log('Setting local stream in useEffect (fallback):', localStream);
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().then(() => {
        console.log('Local video playing from useEffect');
      }).catch(error => {
        console.error('Failed to play local video from useEffect:', error);
      });
    }
  }, [permissionStatus]); // Trigger when permission status changes

  // Additional effect to handle video element becoming available
  useEffect(() => {
    if (localVideoRef.current && permissionStatus === 'granted') {
      const localStream = webrtcService.getLocalStream();
      if (localStream && !localVideoRef.current.srcObject) {
        console.log('Video element now available, setting stream...');
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play().then(() => {
          console.log('Local video playing after element became available');
        }).catch(error => {
          console.error('Failed to play local video after element became available:', error);
        });
      }
    }
  }, [permissionStatus]); // Trigger when permission granted

  // Handle remote stream updates
  useEffect(() => {
    const remoteStream = webrtcService.getRemoteStream();
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Message handling functions
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    console.log('Sending message from video chat:', inputMessage.trim());
    sendMessage(inputMessage.trim());
    setInputMessage('');
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
        className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} mb-2`}
      >
        <div
          className={`max-w-xs px-3 py-2 rounded-lg text-sm ${message.isOwn
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-900 shadow-md'
            }`}
        >
          <p>{message.content}</p>
          <p
            className={`text-xs mt-1 ${message.isOwn ? 'text-blue-100' : 'text-gray-500'
              }`}
          >
            {formatMessageTime(message.timestamp)}
          </p>
        </div>
      </div>
    );
  };

  const toggleMute = () => {
    const newMutedState = webrtcService.toggleMute();
    setIsMuted(!newMutedState);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleRetryPermissions = async () => {
    setPermissionStatus('requesting');
    setError(null);

    try {
      const stream = await webrtcService.requestMediaAccess();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setPermissionStatus('granted');
    } catch (error) {
      console.error('Failed to get permissions:', error);
      setError(error instanceof Error ? error.message : 'Failed to access camera and microphone');
      setPermissionStatus('denied');
    }
  };

  // Debug function to manually start video
  const handleVideoClick = () => {
    if (localVideoRef.current && localVideoRef.current.paused) {
      localVideoRef.current.play().catch(error => {
        console.log('Manual video play failed (this is normal):', error);
      });
    }
  };

  // Show permission request screen
  if (permissionStatus === 'requesting' || isInitializing) {
    return (
      <div className="flex flex-col h-full bg-gray-900 items-center justify-center text-white">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold mb-4">Setting up video chat...</h2>
          <p className="text-gray-300 mb-6">
            We need access to your camera and microphone to start the video chat.
          </p>
          <div className="bg-blue-900 bg-opacity-50 rounded-lg p-4 text-sm">
            <p className="mb-2">📹 <strong>Camera:</strong> To show your video to your chat partner</p>
            <p className="mb-2">🎤 <strong>Microphone:</strong> To let your chat partner hear you</p>
            {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) &&
              window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && (
                <div className="mt-3 p-2 bg-yellow-900 bg-opacity-50 rounded text-xs">
                  <p className="font-semibold mb-1">📱 Mobile Users:</p>
                  <p>If camera permission is blocked, try Firefox mobile or enable insecure origins in Chrome.</p>
                </div>
              )}
          </div>
        </div>
      </div>
    );
  }

  // Show error screen
  if (permissionStatus === 'denied' || error) {
    return (
      <div className="flex flex-col h-full bg-gray-900 items-center justify-center text-white">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-4">Camera Access Required</h2>
          <p className="text-gray-300 mb-6">
            {error || 'Camera and microphone access is required for video chat.'}
          </p>

          <div className="space-y-4">
            <button
              onClick={handleRetryPermissions}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Try Again
            </button>

            <button
              onClick={onEndChat}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              End Chat
            </button>
          </div>

          <div className="mt-6 bg-yellow-900 bg-opacity-50 rounded-lg p-4 text-sm text-left">
            <h3 className="font-semibold mb-2">💡 How to enable camera access:</h3>
            <ul className="space-y-1 text-gray-300">
              <li>• Click the camera icon in your browser's address bar</li>
              <li>• Select "Allow" when prompted for camera/microphone</li>
              <li>• Refresh the page if needed</li>
              <li>• Make sure no other app is using your camera</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-900">
      {/* Left side - Video area */}
      <div className="flex-1 flex flex-col relative">
        {/* Remote video (main) */}
        <div className="flex-1 bg-gray-800 flex items-center justify-center relative">
          <video
            ref={remoteVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
          />

          {/* Placeholder when no remote video - only show if no remote stream */}
          {!webrtcService.getRemoteStream() && (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-800 bg-opacity-90">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-lg font-medium">Waiting for partner's video...</p>
                <p className="text-sm text-gray-300 mt-1">
                  Your partner will appear here once they enable their camera
                </p>
                {import.meta.env.DEV && (
                  <div className="mt-4 text-xs text-gray-400 bg-black bg-opacity-50 p-3 rounded max-w-sm mx-auto">
                    <p className="font-semibold mb-1">🔧 Debug Info:</p>
                    <p className="mb-1">Testing alone? You need 2 different browsers/devices</p>
                    <p>WebRTC connections don't work with yourself in the same browser</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Local video (picture-in-picture) */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden border-2 border-white shadow-lg">
            <video
              ref={localVideoRef}
              className="w-full h-full object-cover cursor-pointer"
              autoPlay
              playsInline
              muted
              onClick={handleVideoClick}
              onLoadedMetadata={() => console.log('Video metadata loaded')}
              onCanPlay={() => console.log('Video can play')}
              onPlay={() => console.log('Video started playing')}
              onError={(e) => console.error('Video error:', e)}
            />

            {/* You label */}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-10">
              You {isMuted && '🔇'}
            </div>


          </div>

          {/* Connection status */}
          <div className="absolute top-4 left-4">
            <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Connected</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 p-4">
          <div className="flex items-center justify-between">
            {/* Media controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleMute}
                className={`p-3 rounded-full transition-colors ${isMuted
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMuted ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  )}
                </svg>
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 transition-colors"
                title="Fullscreen"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={onNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
              <button
                onClick={onReport}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Report
              </button>
              <button
                onClick={onEndChat}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                End
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Chat area */}
      <div className="w-96 bg-white flex flex-col border-l border-gray-300">
        {/* Chat header */}
        <div className="bg-blue-500 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <div>
              <h3 className="font-semibold">Chat</h3>
              <p className="text-sm text-blue-100">
                Connected to stranger
                {isTyping && (
                  <span className="ml-2">
                    <span className="animate-pulse">typing...</span>
                  </span>
                )}
              </p>
            </div>
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
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={1000}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${inputMessage.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              Send
            </button>
          </div>

          {/* Character count */}
          <div className="mt-2 text-right">
            <span className={`text-xs ${inputMessage.length > 900 ? 'text-red-500' : 'text-gray-400'
              }`}>
              {inputMessage.length}/1000
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}