import { useEffect, useState } from 'react';
import {
  incrementWarning,
  completeSession as completeProctoringSession,
} from '../services/proctoringApi';

function useWindowProctoring({ sessionId } = {}) {
  const [warningCount, setWarningCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);
useEffect(() => {
  console.log("Session ID:", sessionId);
}, [sessionId]);
  useEffect(() => {
    let timeoutId = null;
    let terminationTimeoutId = null;

    const completeSession = async (status) => {
      if (!sessionId) return;

      try {
        const response = await completeProctoringSession(
          sessionId,
          status
        );
        console.log('Complete Session Response:', response);
      } catch (error) {
        console.error('Failed to complete session:', error);
      }
    };

    const reportWarning = async () => {
      if (!sessionId) {
        console.warn('No sessionId available');
        return;
      }

      try {
        const payload = await incrementWarning(sessionId);

        console.log('Warning API Response:', payload);

        if (payload?.warningCount !== undefined) {
          setWarningCount(payload.warningCount);
        }
      } catch (error) {
        console.error('Failed to report warning:', error);
      }
    };

    const enterFullscreen = async () => {
      try {
        if (
          !document.fullscreenElement &&
          document.documentElement.requestFullscreen
        ) {
          await document.documentElement.requestFullscreen();
        }
      } catch (error) {
        console.error(
          'Failed to enter fullscreen:',
          error
        );
      }
    };

    const startTerminationTimer = () => {
      if (!terminationTimeoutId) {
        terminationTimeoutId = setTimeout(() => {
          setIsTerminated(true);
          completeSession('ENDED');
        }, 15000);
      }
    };

    const stopTerminationTimer = () => {
      if (terminationTimeoutId) {
        clearTimeout(terminationTimeoutId);
        terminationTimeoutId = null;
      }
    };

    enterFullscreen();

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        await reportWarning();
      }
    };

    const handleFullscreenChange = async () => {
      if (!document.fullscreenElement) {
        await reportWarning();

        setShowWarningModal(true);
        startTerminationTimer();

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
          setShowWarningModal(false);
          enterFullscreen();
        }, 3000);
      } else {
        stopTerminationTimer();
      }
    };

    const handleWindowFocus = () => {
      setShowWarningModal(true);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        setShowWarningModal(false);
        enterFullscreen();
      }, 3000);
    };

    // DEBUG VERSION
    // Only block copy/paste/cut for now
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      if (
        e.ctrlKey &&
        ['c', 'v', 'x', 'a'].includes(key)
      ) {
        e.preventDefault();
      }
    };

    const preventDefaultAction = (e) => {
      e.preventDefault();
    };

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    document.addEventListener(
      'fullscreenchange',
      handleFullscreenChange
    );

    window.addEventListener(
      'focus',
      handleWindowFocus
    );

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    window.addEventListener(
      'copy',
      preventDefaultAction
    );

    window.addEventListener(
      'paste',
      preventDefaultAction
    );

    window.addEventListener(
      'cut',
      preventDefaultAction
    );

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );

      document.removeEventListener(
        'fullscreenchange',
        handleFullscreenChange
      );

      window.removeEventListener(
        'focus',
        handleWindowFocus
      );

      window.removeEventListener(
        'keydown',
        handleKeyDown
      );

      window.removeEventListener(
        'copy',
        preventDefaultAction
      );

      window.removeEventListener(
        'paste',
        preventDefaultAction
      );

      window.removeEventListener(
        'cut',
        preventDefaultAction
      );

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (terminationTimeoutId) {
        clearTimeout(terminationTimeoutId);
      }
    };
  }, [sessionId]);

  const completeSessionManual = async (status) => {
    if (!sessionId) return;

    try {
      await completeProctoringSession(
        sessionId,
        status
      );
    } catch (error) {
      console.error(error);
    }
  };

  return {
    warningCount,
    showWarningModal,
    isTerminated,
    completeSession: completeSessionManual,
  };
}

export default useWindowProctoring;