import { useEffect, useState } from 'react'

const SESSION_ID = 'dummy-session-001'
const WARNING_ENDPOINT = 'http://localhost:3006/proctoring/warnings'

function useWindowProctoring() {
  const [warningCount, setWarningCount] = useState(0)
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [isTerminated, setIsTerminated] = useState(false)

  useEffect(() => {
    let timeoutId = null
    let terminationTimeoutId = null

    const completeSession = async (status) => {
      try {
        await fetch(`http://localhost:3006/proctoring/session/${SESSION_ID}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        })
      } catch(error) {
        console.error('Failed to update session status:', error)
      }
    }

    const startTerminationTimer = () => {
      if (!terminationTimeoutId) {
        terminationTimeoutId = window.setTimeout(() => {
          setIsTerminated(true)
          completeSession('ENDED')
        }, 15000)
      }
    }

    const stopTerminationTimer = () => {
      if (terminationTimeoutId) {
        window.clearTimeout(terminationTimeoutId)
        terminationTimeoutId = null
      }
    }

    const enterFullscreen = async () => {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen()
        }
      } catch (error) {
        console.error('Failed to enter fullscreen:', error)
      }
    }

    enterFullscreen()

    const handleWindowBlur = async () => {
      setWarningCount((prev) => prev + 1)
      try {
        const response = await fetch(WARNING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: SESSION_ID,
            eventType: 'WINDOW_SWITCH',
          }),
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const payload = await response.json()

        if (payload?.data?.warningCount !== undefined) {
          setWarningCount(payload.data.warningCount)
        }
      } catch (error) {
        console.error('Failed to report window switch', error)
      }
    }

    const handleWindowFocus = () => {
      setShowWarningModal(true)
      
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }

      timeoutId = window.setTimeout(() => {
        setShowWarningModal(false)
        enterFullscreen()
      }, 3000)
    }

    const handleKeyDown = (e) => {
      // Prevent Escape
      if (e.key === 'Escape') {
        e.preventDefault()
      }
      
      // Prevent Ctrl+C and Ctrl+V
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V')) {
        e.preventDefault()
      }
      
      // Prevent Alt+Tab and Shift+Alt+Tab
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault()
      }
    }

    const preventDefaultAction = (e) => {
      e.preventDefault()
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setWarningCount((prev) => prev + 1)
        setShowWarningModal(true)
        startTerminationTimer()
        
        if (timeoutId) {
          window.clearTimeout(timeoutId)
        }
        
        timeoutId = window.setTimeout(() => {
          setShowWarningModal(false)
          enterFullscreen()
        }, 3000)
      } else {
        stopTerminationTimer()
      }
    }

    const enforceFullscreen = async () => {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen && !showWarningModal) {
        try {
          await document.documentElement.requestFullscreen()
        } catch (e) {
          // Silently fail if not a valid user gesture yet
        }
      }
    }

    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('contextmenu', preventDefaultAction)
    window.addEventListener('copy', preventDefaultAction)
    window.addEventListener('paste', preventDefaultAction)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('click', enforceFullscreen)
    document.addEventListener('keydown', enforceFullscreen)

    return () => {
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('contextmenu', preventDefaultAction)
      window.removeEventListener('copy', preventDefaultAction)
      window.removeEventListener('paste', preventDefaultAction)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('click', enforceFullscreen)
      document.removeEventListener('keydown', enforceFullscreen)

      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [])

  const completeSessionManual = async (status) => {
    try {
      await fetch(`http://localhost:3006/proctoring/session/${SESSION_ID}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
    } catch(error) {
      console.error('Failed to update session status manually:', error)
    }
  }

  return {
    warningCount,
    showWarningModal,
    isTerminated,
    completeSession: completeSessionManual
  }
}

export default useWindowProctoring
