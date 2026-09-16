// The statements to paste into the PlanetScale console, one at a time.
export default function SqlOutput({
  prelude,
  statements,
  problems,
  mode,
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

          {publish && (
            <div className="problems">
              <p>
                Publishing is ON. Every value below goes live as a real benefit,
                including any still sitting at 0 because CMS has not released it.
              </p>
              {zeroed.length > 0 && (
                <p>Currently 0 and about to be published: {zeroed.join(', ')}.</p>
              )}
              <p className="hint">
                This default is temporary, for testing while the site has no
                visitors. It must go back to off before the site is public.
              </p>
            </div>
          )}

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

          <p className="hint">
            Run these top to bottom. Each is independent and safe to re-run.
          </p>

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
