// The statements to paste into the PlanetScale console, one at a time.
export default function SqlOutput({
  prelude,
  statements,
  problems,
  mode,
  planId,
  onPlanIdChange,
}) {
  return (
    <>
      <h2>SQL</h2>

      {prelude.length > 0 && (
        <div className="prelude">
          <h3>Look up first</h3>
          {prelude.map((step) => (
            <div key={step.sql}>
              <pre>{step.sql}</pre>
              <p className="hint">{step.note}</p>
            </div>
          ))}
        </div>
      )}

      {problems.length > 0 ? (
        <div className="problems">
          <p>Fill these in before the statements are generated:</p>
          <ul>
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          {mode === 'new' && (
            <div className="field">
              <label htmlFor="planId">New plan id (from statement 2)</label>
              <input
                id="planId"
                type="number"
                step="1"
                value={planId}
                onChange={(e) => onPlanIdChange(e.target.value)}
              />
              <p className="hint">
                Until this is filled in, the join statements below show
                &lt;plan id&gt; rather than a real value.
              </p>
            </div>
          )}

          <ol className="statements">
            {statements.map((step) => (
              <li key={step.sql}>
                <pre>{step.sql}</pre>
                <p className="hint">{step.note}</p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(step.sql)}
                >
                  Copy
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
    </>
  )
}
