import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useSocket } from '../hooks/useSocket';
import TextChat from './TextChat.tsx';
import VideoChat from './VideoChat.tsx';
import ReportModal from './ReportModal.tsx';

export default function ChatScreen() {
  const { state, setScreen } = useApp();
  const { nextPartner, endSession } = useSocket();
  const [showReportModal, setShowReportModal] = useState(false);

  const handleNext = () => {
    nextPartner();
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  const handleEndChat = () => {
    endSession();
  };

  const handleReportSubmit = (reason: string) => {
    // TODO: Implement report submission
    console.log('Report submitted:', reason);
    setShowReportModal(false);
  };

  const handleReportCancel = () => {
    setShowReportModal(false);
  };

  if (!state.mode) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">No chat mode selected</p>
        <button
          onClick={() => setScreen('landing')}
          className="mt-4 btn-primary"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-hidden">
        {state.mode === 'text' ? (
          <TextChat
            onNext={handleNext}
            onReport={handleReport}
            onEndChat={handleEndChat}
          />
        ) : (
          <VideoChat
            onNext={handleNext}
            onReport={handleReport}
            onEndChat={handleEndChat}
          />
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          onSubmit={handleReportSubmit}
          onCancel={handleReportCancel}
        />
      )}
    </div>
  );
}