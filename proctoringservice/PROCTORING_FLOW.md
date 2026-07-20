# Proctoring Service – Full Flow Documentation

## 1. Project Purpose

This application is a lightweight React + Vite exam proctoring demo. It simulates a candidate journey from a landing page to a single-question assessment page, while monitoring browser behavior to detect possible cheating or exam misuse.

The main goal is to:

- start a test from a welcome screen
- enforce a fullscreen exam experience
- monitor window switching and fullscreen exit events
- send warning activity to a backend endpoint
- terminate the exam automatically if the candidate stays outside fullscreen for a defined time window

---

## 2. Application Entry Flow

### Route Configuration

The app is mounted in `App.jsx` and uses `react-router-dom`.

Routes:

- `/` → `LandingPage`
- `/test` → `TestPage`

### Routing Flow

1. User opens the application.
2. The browser loads the root route `/`.
3. `LandingPage` displays the start screen.
4. On clicking the “Start test” button, the app navigates to `/test`.

---

## 3. Landing Page Flow

### File

- `src/pages/LandingPage.jsx`

### Behavior

- Displays a welcome card with the title “Ready to begin your test?”
- Shows a subtitle describing the exam flow
- Provides a single CTA button: “Start test”

### Result

When the button is clicked:

- `useNavigate()` sends the user to `/test`

---

## 4. Test Page Flow

### File

- `src/pages/TestPage.jsx`

### Behavior

The test page is a simple one-question multiple-choice form.

#### UI Elements

- Question: “Which library is used to build this UI?”
- Options:
  - React
  - Vue
  - Angular
  - Svelte
- A timer shown in the top-right area of the form
- An “End Exam” button to submit the assessment

### State Variables

- `selected`: stores the selected answer
- `submitted`: indicates whether the exam is completed
- `timeLeft`: countdown timer value, initialized to 120 seconds
- `showConfirm`: shows the final confirmation modal before exam submission

### Exam Completion Flow

1. User selects one option.
2. User clicks “End Exam”.
3. A confirmation modal appears.
4. If the user confirms:
   - `handleEndExam()` runs
   - `submitted` becomes `true`
   - `showConfirm` closes
   - `completeSession('SUCCESS')` is called to update the backend session status

### Timeout Flow

If the timer reaches `0`:

- `handleEndExam()` is invoked automatically
- the exam is marked as complete
- the session status is updated as `SUCCESS`

---

## 5. Proctoring Hook Flow

### File

- `src/hooks/useWindowProctoring.js`

This hook is the heart of the proctoring logic.

### Constants

- `SESSION_ID = 'dummy-session-001'`
- `WARNING_ENDPOINT = 'http://localhost:3006/proctoring/warnings'`

### Responsibilities

The hook monitors:

- fullscreen mode changes
- window blur/focus transitions
- keyboard shortcuts that may bypass the exam environment
- copy/paste/context menu actions

It also sends session status updates to the backend.

---

## 6. Fullscreen Enforcement Flow

### On Hook Mount

When `useWindowProctoring()` is first executed:

1. The hook attempts to enter fullscreen immediately using `document.documentElement.requestFullscreen()`.
2. This makes the test page launch in fullscreen mode, helping enforce exam integrity.

### Fullscreen Change Event

The hook listens to the `fullscreenchange` event.

#### If the user leaves fullscreen mode

- `warningCount` increases by 1
- the warning modal is shown
- a 15-second termination timer is started
- after 3 seconds, the app tries to re-enter fullscreen automatically

#### If the user returns to fullscreen mode

- the termination timer is stopped

---

## 7. Window Blur / Focus Detection Flow

### Blur Event

When the user switches away from the browser window:

1. `warningCount` increments by 1.
2. A POST request is sent to:
   - `http://localhost:3006/proctoring/warnings`
3. The request body includes:
   - `sessionId`
   - `eventType: 'WINDOW_SWITCH'`
4. If the backend responds with a `warningCount`, that value is updated in local state.

### Focus Event

When the window regains focus:

- the warning modal is shown
- the modal auto-closes after 3 seconds
- the app attempts to re-enter fullscreen

---

## 8. Keyboard and Input Restriction Flow

The hook intercepts several keys and input actions:

### Disabled Keys / Actions

- `Escape` is prevented
- `Ctrl + C` and `Ctrl + V` are prevented
- `Alt + Tab` is prevented
- right-click context menu is prevented
- copy and paste are prevented

### Why this matters

This makes the candidate experience more controlled and reduces the chance of leaving the exam environment or copying content.

---

## 9. Termination Logic Flow

### Automatic Termination Rule

If the candidate leaves fullscreen mode and remains out for more than 15 seconds:

1. `setIsTerminated(true)` is called
2. `completeSession('ENDED')` is sent to the backend
3. The UI renders a termination view with the message:
   - “Your exam has been automatically terminated because you remained out of full-screen mode for more than 15 seconds.”

### On Terminated Screen

Once the exam is terminated:

- the test page no longer allows the candidate to continue
- the UI displays a locked exam-terminated message

---

## 10. Backend API Interaction Flow

### Warning Reporting API

Endpoint:

- `POST http://localhost:3006/proctoring/warnings`

Purpose:

- record window-switch or suspicious activity
- return updated warning count if available

### Session Status API

Endpoint:

- `PUT http://localhost:3006/proctoring/session/dummy-session-001/status`

Purpose:

- update exam status to:
  - `SUCCESS` when the candidate submits normally
  - `ENDED` when the exam is auto-terminated

---

## 11. End-to-End User Flow

### Happy Path

1. User lands on the welcome screen.
2. User clicks “Start test”.
3. The app enters fullscreen mode.
4. The question is shown.
5. User answers and clicks “End Exam”.
6. Confirmation pop-up appears.
7. User confirms submission.
8. Session status is sent as `SUCCESS`.

### Warning Path

1. User switches to another window or exits fullscreen.
2. Proctoring hook records the event.
3. Warning modal appears.
4. The app tries to restore fullscreen.
5. Warning count increases.

### Termination Path

1. User remains out of fullscreen mode for too long.
2. The system waits for 15 seconds.
3. The exam is automatically marked as terminated.
4. The UI shows the termination message.

---

## 12. Full Flow Summary

The full flow of this proctoring service can be understood as:

1. Landing page starts the test session
2. Test page loads the exam UI
3. `useWindowProctoring()` activates monitoring immediately
4. Fullscreen is enforced and browser activity is watched
5. Warning events are posted to the backend
6. The exam is submitted normally or auto-terminated
7. Session status is updated through the backend API

---

## 13. Implementation Notes

This is a demo implementation and uses a dummy session ID:

- `dummy-session-001`

It is intentionally simple and focuses on the core client-side proctoring flow rather than a full enterprise exam system.
