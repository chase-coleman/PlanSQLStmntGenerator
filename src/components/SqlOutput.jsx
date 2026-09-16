// The statements to paste into the PlanetScale console, one at a time.
export default function SqlOutput({
  prelude,
  statements,
  problems,
  mode,
  planId,
  onPlanIdChange,
  publish,
  onPublishChange,
  zeroed,
  publishLater,
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
          <div className="field field-checkbox">
            <input
              id="publish"
              type="checkbox"
              checked={publish}
              onChange={(e) => onPublishChange(e.target.checked)}
            />
            <label htmlFor="publish">
              All benefits confirmed — publish this plan
            </label>
          </div>
          <p className="hint">
            Leave this off while any benefit is still unpublished by CMS.
            Because every column is NOT NULL, an unknown value is entered as 0,
            and a published plan shows those zeros to beneficiaries as real
            benefits.
          </p>

          {!publish && zeroed.length > 0 && (
            <div className="reminder">
              <p>
                Currently 0, which may just mean not yet published:{' '}
                {zeroed.join(', ')}.
              </p>
              <p className="hint">
                A reminder, not an error — 0 is a real value for premium,
                giveback, doctor visit and coinsurance.
              </p>
            </div>
          )}

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

          {publishLater && (
            <div className="prelude">
              <h3>Publish later</h3>
              <pre>{publishLater.sql}</pre>
              <p className="hint">{publishLater.note}</p>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(publishLater.sql)}
              >
                Copy
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
