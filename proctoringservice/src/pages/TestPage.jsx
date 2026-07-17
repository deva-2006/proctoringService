import { useState, useEffect } from 'react'
import useWindowProctoring from '../hooks/useWindowProctoring'

const options = ['React', 'Vue', 'Angular', 'Svelte']

function TestPage() {
  const [selected, setSelected] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(120)
  const [showConfirm, setShowConfirm] = useState(false)
  const { warningCount, showWarningModal, isTerminated, completeSession } = useWindowProctoring()

  useEffect(() => {
    if (submitted || isTerminated || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [submitted, isTerminated, timeLeft])

  useEffect(() => {
    if (timeLeft === 0 && !submitted && !isTerminated) {
      handleEndExam()
    }
  }, [timeLeft, submitted, isTerminated])

  if (isTerminated) {
    return (
      <main className="test-page">
        <section className="test-card" style={{ borderColor: '#ef4444' }}>
          <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>🛑 Exam Terminated</h1>
          <p className="subtitle" style={{ fontSize: '1.1rem' }}>
            Your exam has been automatically terminated because you remained out of full-screen mode for more than 15 seconds.
          </p>
        </section>
      </main>
    )
  }

  const handleEndExam = async () => {
    setSubmitted(true)
    setShowConfirm(false)
    await completeSession('SUCCESS')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setShowConfirm(true)
  }

  return (
    <main className="test-page">
      <section className="test-card">
        <p className="eyebrow">Proctoring test</p>
        <h1>Single question assessment</h1>
        <p className="subtitle">
          This page is intentionally simple and focused on one multiple-choice question.
        </p>

        <form onSubmit={handleSubmit} className="question-form">
          <fieldset>
            <legend>Which library is used to build this UI?</legend>
            <div className="options">
              {options.map((option) => (
                <label key={option} className="option-card">
                  <input
                    type="radio"
                    name="answer"
                    value={option}
                    checked={selected === option}
                    onChange={(event) => setSelected(event.target.value)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: timeLeft <= 30 ? '#ef4444' : 'inherit' }}>
              Time Remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#ef4444', color: 'white' }}>
              End Exam
            </button>
          </div>
        </form>

        {submitted && (
          <div className="feedback">
            <h2>Answer received</h2>
            <p>
              {selected === 'React'
                ? 'Correct! This page is built with React.'
                : `You selected ${selected}.`}
            </p>
          </div>
        )}

        {showConfirm && (
          <div className="warning-modal confirm-modal" role="alertdialog" aria-live="assertive">
            <h2>Submit Exam?</h2>
            <p>Are you sure you want to end and submit the exam?</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
              <button className="btn btn-danger" onClick={handleEndExam} style={{ backgroundColor: '#ef4444', color: 'white' }}>
                Yes, End Exam
              </button>
              <button className="btn" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {showWarningModal && !showConfirm && (
          <div className="warning-modal" role="alertdialog" aria-live="assertive">
            <h2>⚠️ Exam Warning</h2>
            <p>You left the exam window or exited full-screen mode.</p>
            <p>This activity has been recorded.</p>
            <p>Warning Count: {warningCount}</p>
            <p>Please stay on the exam page for the remainder of the examination.</p>
            <p>This message will close automatically in 3 seconds.</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default TestPage
