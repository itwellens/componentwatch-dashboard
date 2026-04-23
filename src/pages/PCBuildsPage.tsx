import { useUser } from '@clerk/clerk-react'

export default function PCBuildsPage() {
  const { user } = useUser()
  const firstName = user?.firstName ?? user?.primaryEmailAddress?.emailAddress?.split('@')[0] ?? 'there'

  return (
    <div className="space-y-10">
      <div>
        <h1>Welcome, {firstName}.</h1>
        <p className="mt-2 text-ink-muted">
          Track prices and stock for your PC build across Newegg, Best Buy, eBay, and Amazon.
        </p>
      </div>

      {/* Empty-state card — will become the build list / watchlist table in Phase 2 */}
      <div className="rounded-xl border border-line bg-surface p-10 text-center">
        <h2 className="text-xl font-medium text-ink">No builds yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
          Import a build from PCPartPicker or start tracking individual components.
          Alerts fire when prices drop, stock returns, or products hit your target price.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            disabled
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white opacity-50"
            title="Coming in Phase 2"
          >
            Import from PCPartPicker
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

      {/* Small dev-only hint so you know this page is rendering and API plumbing exists */}
      {import.meta.env.DEV && (
        <div className="rounded-lg border border-dashed border-line bg-surface p-4 text-xs text-ink-faint">
          <span className="font-medium text-ink-muted">Dev note:</span>{' '}
          API client is wired at <code>src/lib/api.ts</code>. First real endpoint
          call lands in Phase 2, after the backend adds Clerk JWT verification.
        </div>
      )}
    </div>
  )
}
