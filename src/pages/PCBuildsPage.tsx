import { useState, useEffect, useCallback } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'
import { apiFetch, ApiError } from '../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BuildSummary {
  id: number
  name: string
  item_count: number
  pcpartpicker_url: string | null
  target_budget: number | null
  created_at: string
}

interface ListingInfo {
  retailer_slug: string
  retailer_display: string
  price: number | null
  in_stock: boolean | null
  stock_text: string | null
  buy_url: string
  last_polled: string | null
}

interface BuildItem {
  item_id: number
  category: string
  quantity: number
  target_price: number | null
  canonical_name: string
  brand: string | null
  image_url: string | null
  placeholder: boolean
  listings: ListingInfo[]
  best_price: number | null
  best_price_retailer: string | null
}

interface BuildDetail {
  build: BuildSummary
  items: BuildItem[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  gpu: 'GPU', cpu: 'CPU', ram: 'RAM', ssd: 'SSD', hdd: 'HDD',
  mobo: 'Motherboard', psu: 'PSU', case: 'Case', cooler: 'Cooler',
  monitor: 'Monitor', keyboard: 'Keyboard', mouse: 'Mouse', other: 'Other',
}

function fmt(price: number | null | undefined): string {
  if (price == null) return '—'
  return `$${price.toFixed(2)}`
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ImportForm({ onSuccess }: { onSuccess: () => void }) {
  const { getToken } = useAuth()
  const [name, setName] = useState('')
  const [markup, setMarkup] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !markup.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await apiFetch('/api/builds/import-markup', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), markup: markup.trim() }),
        getToken,
      })
      setName('')
      setMarkup('')
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Import failed. Check the markup and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink mb-1">Build name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="My Gaming Rig"
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink mb-1">
          PCPartPicker markup
        </label>
        <p className="text-xs text-ink-muted mb-2">
          On your PCPartPicker build page, click <strong>Markup</strong> → copy the text → paste it here.
        </p>
        <textarea
          value={markup}
          onChange={e => setMarkup(e.target.value)}
          placeholder="Paste your PCPartPicker markup here..."
          rows={8}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent font-mono"
          required
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || !name.trim() || !markup.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Importing…' : 'Import build'}
        </button>
      </div>
    </form>
  )
}

function ListingRow({ listing }: { listing: ListingInfo }) {
  return (
    <div className="flex items-center justify-between py-2 border-t border-line first:border-t-0">
      <div className="flex items-center gap-3">
        <span className="text-sm text-ink-muted w-24 shrink-0">{listing.retailer_display}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          listing.in_stock
            ? 'bg-green-50 text-green-700'
            : listing.in_stock === false
            ? 'bg-red-50 text-red-600'
            : 'bg-surface-alt text-ink-muted'
        }`}>
          {listing.in_stock ? 'In Stock' : listing.in_stock === false ? 'Out of Stock' : 'Unknown'}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-ink tabular-nums">
          {fmt(listing.price)}
        </span>
        <a
          href={listing.buy_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
            listing.in_stock
              ? 'bg-accent text-white hover:bg-accent-hover'
              : 'border border-line text-ink-muted hover:text-ink'
          }`}
        >
          Buy
        </a>
      </div>
    </div>
  )
}

function BuildItemRow({ item }: { item: BuildItem }) {
  const [expanded, setExpanded] = useState(false)
  const hasListings = item.listings.length > 0
  const categoryLabel = CATEGORY_LABELS[item.category] ?? item.category

  return (
    <div className="border border-line rounded-xl bg-surface overflow-hidden">
      <button
        onClick={() => hasListings && setExpanded(e => !e)}
        className={`w-full flex items-center gap-4 p-4 text-left ${hasListings ? 'hover:bg-surface-alt transition-colors' : ''}`}
      >
        {/* Category badge */}
        <span className="shrink-0 text-xs font-medium text-ink-muted bg-surface-alt border border-line rounded-md px-2 py-1 w-24 text-center">
          {categoryLabel}
        </span>

        {/* Name + placeholder warning */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink truncate">{item.canonical_name}</p>
          {item.brand && <p className="text-xs text-ink-muted">{item.brand}</p>}
          {item.placeholder && (
            <p className="text-xs text-amber-600 mt-0.5">Placeholder — no live listings yet</p>
          )}
        </div>

        {/* Best price */}
        <div className="shrink-0 text-right">
          {item.best_price != null ? (
            <>
              <p className="text-sm font-semibold text-ink tabular-nums">{fmt(item.best_price)}</p>
              <p className="text-xs text-ink-muted">{item.best_price_retailer}</p>
            </>
          ) : (
            <p className="text-sm text-ink-muted">No price</p>
          )}
        </div>

        {/* Expand chevron */}
        {hasListings && (
          <span className="shrink-0 text-ink-muted text-xs ml-1">
            {expanded ? '▲' : '▼'}
          </span>
        )}
      </button>

      {/* Expanded listings */}
      {expanded && hasListings && (
        <div className="px-4 pb-4 pt-0">
          <div className="border-t border-line pt-2">
            {item.listings.map(l => (
              <ListingRow key={`${l.retailer_slug}-${l.buy_url}`} listing={l} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BuildCard({
  build,
  isSelected,
  onSelect,
}: {
  build: BuildSummary
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border p-5 transition-colors ${
        isSelected
          ? 'border-accent bg-accent/5'
          : 'border-line bg-surface hover:bg-surface-alt'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-ink">{build.name}</p>
          <p className="text-xs text-ink-muted mt-0.5">
            {build.item_count} component{build.item_count !== 1 ? 's' : ''}
            {build.pcpartpicker_url && ' · PCPartPicker import'}
          </p>
        </div>
        <span className="text-ink-muted text-xs">
          {new Date(build.created_at).toLocaleDateString()}
        </span>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PCBuildsPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const firstName = user?.firstName ?? user?.primaryEmailAddress?.emailAddress?.split('@')[0] ?? 'there'

  const [builds, setBuilds] = useState<BuildSummary[]>([])
  const [selectedBuild, setSelectedBuild] = useState<BuildDetail | null>(null)
  const [loadingBuilds, setLoadingBuilds] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)

  const fetchBuilds = useCallback(async () => {
    setLoadingBuilds(true)
    setError(null)
    try {
      const data = await apiFetch<{ builds: BuildSummary[] }>('/api/builds', { getToken })
      setBuilds(data.builds)
      // Auto-select the first build if there is one
      if (data.builds.length > 0 && selectedBuild === null) {
        fetchBuildDetail(data.builds[0].id)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load builds.')
    } finally {
      setLoadingBuilds(false)
    }
  }, [getToken]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBuildDetail = useCallback(async (buildId: number) => {
    setLoadingDetail(true)
    try {
      const data = await apiFetch<BuildDetail>(`/api/builds/${buildId}`, { getToken })
      setSelectedBuild(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load build detail.')
    } finally {
      setLoadingDetail(false)
    }
  }, [getToken])

  useEffect(() => {
    fetchBuilds()
  }, [fetchBuilds])

  function handleImportSuccess() {
    setShowImport(false)
    setSelectedBuild(null)
    fetchBuilds()
  }

  // ---- Loading state ----
  if (loadingBuilds) {
    return (
      <div className="flex items-center justify-center py-24 text-ink-muted text-sm">
        Loading builds…
      </div>
    )
  }

  // ---- Error state ----
  if (error) {
    return (
      <div className="rounded-xl border border-line bg-surface p-8 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchBuilds}
          className="mt-4 text-sm text-accent hover:underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Welcome, {firstName}.</h1>
          <p className="mt-1 text-ink-muted">
            Track prices and stock for your PC build across Newegg, Best Buy, eBay, and Amazon.
          </p>
        </div>
        <button
          onClick={() => setShowImport(v => !v)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          {showImport ? 'Cancel' : 'Import from PCPartPicker'}
        </button>
      </div>

      {/* Import form (slide in when open) */}
      {showImport && (
        <div className="rounded-xl border border-line bg-surface p-6">
          <h2 className="text-base font-medium text-ink mb-4">Import a PCPartPicker build</h2>
          <ImportForm onSuccess={handleImportSuccess} />
        </div>
      )}

      {/* Empty state */}
      {builds.length === 0 && !showImport && (
        <div className="rounded-xl border border-line bg-surface p-12 text-center">
          <h2 className="text-xl font-medium text-ink">No builds yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
            Import a build from PCPartPicker to start tracking prices across retailers.
            Alerts fire when prices drop, stock returns, or products hit your target price.
          </p>
          <button
            onClick={() => setShowImport(true)}
            className="mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            Import from PCPartPicker
          </button>
        </div>
      )}

      {/* Builds list + detail */}
      {builds.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">

          {/* Build list sidebar */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide px-1 mb-3">
              Your builds
            </p>
            {builds.map(b => (
              <BuildCard
                key={b.id}
                build={b}
                isSelected={selectedBuild?.build.id === b.id}
                onSelect={() => fetchBuildDetail(b.id)}
              />
            ))}
          </div>

          {/* Build detail */}
          <div>
            {loadingDetail && (
              <div className="flex items-center justify-center py-16 text-ink-muted text-sm">
                Loading…
              </div>
            )}

            {!loadingDetail && selectedBuild && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">{selectedBuild.build.name}</h2>
                    {selectedBuild.build.pcpartpicker_url && (
                      <a
                        href={selectedBuild.build.pcpartpicker_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline"
                      >
                        View on PCPartPicker ↗
                      </a>
                    )}
                  </div>
                  {/* Total across all best prices */}
                  {(() => {
                    const total = selectedBuild.items.reduce(
                      (sum, item) => sum + (item.best_price ?? 0) * item.quantity,
                      0
                    )
                    const hasAny = selectedBuild.items.some(i => i.best_price != null)
                    return hasAny ? (
                      <div className="text-right">
                        <p className="text-xs text-ink-muted">Current best total</p>
                        <p className="text-xl font-semibold text-ink tabular-nums">{fmt(total)}</p>
                      </div>
                    ) : null
                  })()}
                </div>

                {selectedBuild.items.length === 0 ? (
                  <p className="text-sm text-ink-muted">No items in this build.</p>
                ) : (
                  selectedBuild.items.map(item => (
                    <BuildItemRow key={item.item_id} item={item} />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
