// Developer verification: the exact payload the SQL generator will read.
export default function CurrentValues({ values }) {
  return (
    <>
      <h2>Current Values</h2>
      <pre>{JSON.stringify(values, null, 2)}</pre>
    </>
  )
}
