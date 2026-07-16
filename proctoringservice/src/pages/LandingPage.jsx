import { useNavigate } from 'react-router-dom'

function LandingPage() {
  const navigate = useNavigate()

  return (
    <main className="landing-page">
      <section className="landing-card">
        <p className="eyebrow">Proctoring service</p>
        <h1>Ready to begin your test?</h1>
        <p className="subtitle">
          This simple setup guides candidates from a welcome screen to a single
          multiple-choice assessment.
        </p>

        <button type="button" className="btn btn-primary" onClick={() => navigate('/test')}>
          Start test
        </button>
      </section>
    </main>
  )
}

export default LandingPage
