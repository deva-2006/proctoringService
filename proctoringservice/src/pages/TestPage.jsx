import { useState } from 'react'

const options = ['React', 'Vue', 'Angular', 'Svelte']

function TestPage() {
  const [selected, setSelected] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
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

          <button type="submit" className="btn btn-primary" disabled={!selected}>
            Submit answer
          </button>
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
      </section>
    </main>
  )
}

export default TestPage
