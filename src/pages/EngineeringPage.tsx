import { useUser } from '@clerk/clerk-react'

export default function EngineeringPage() {
  const { user } = useUser()
  const firstName = user?.firstName ?? user?.primaryEmailAddress?.emailAddress?.split('@')[0] ?? 'there'

  return (
    <div className="space-y-10">
      <div>
        <h1>Engineering workspace</h1>
        <p className="mt-2 text-ink-muted">
          Monitor electronic components across DigiKey, Mouser, LCSC, and Arrow.
        </p>
      </div>

      {/* Empty-state card — becomes the BOM / component table in Phase 2 */}
      <div className="rounded-xl border border-line bg-surface p-10 text-center">
        <h2 className="text-xl font-medium text-ink">No components tracked yet, {firstName}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
          Upload a BOM (CSV or XLSX) to start tracking. Alerts fire when critical
          parts go EOL, stock drops below your threshold, or prices change.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            disabled
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white opacity-50"
            title="Coming in Phase 2"
          >
            Upload BOM
          </button>
          <button
            disabled
            className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink opacity-50"
            title="Coming in Phase 2"
          >
            Add a component
          </button>
        </div>
      </div>
    </div>
  )
}
