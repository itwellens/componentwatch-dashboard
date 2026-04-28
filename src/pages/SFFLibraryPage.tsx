import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch, ApiError } from '../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SFFCase {
  id: number
  name: string
  volume_liters: number | null
  build_count: number
  benchmark_count: number
}

interface BuildSummary {
  id: number
  cpu: string | null
  gpu: string | null
  ambient_temp_c: number | null
  case_id: number
  case_name: string
  volume_liters: number | null
  cb23_multi: number | null
  heaven_1080p_fps: number | null
  cpu_stress_max_c: number | null
  gpu_stress_max_c: number | null
  has_benchmarks: boolean
}

interface ThermalRow {
  component: string
  idle_min_c: number | null
  idle_max_c: number | null
  gaming_min_c: number | null
  gaming_max_c: number | null
  stress_min_c: number | null
  stress_max_c: number | null
  stress_power_w: number | null
}

interface BenchmarkRow {
  test_type: string
  resolution: string | null
  score: number | null
  fps: number | null
  max_power_w: number | null
}

interface BuildDetail {
  build: {
    id: number
    cpu: string | null
    cpu_cooler: string | null
    gpu: string | null
    psu: string | null
    motherboard: string | null
    memory: string | null
    storage_primary: string | null
    storage_secondary: string | null
    extra_components: string[] | null
    ambient_temp_c: number | null
    build_notes: string | null
    case_name: string
    volume_liters: number | null
    purchase_source: string | null
  }
  thermals: ThermalRow[]
  benchmarks: Record<string, BenchmarkRow[]>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RESOLUTION_ORDER = ['720p', '900p', '1080p', '1440p', '4k']

function tempRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return '—'
  if (min === max || max == null) return `${min}°C`
  return `${min}–${max}°C`
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-surface-alt px-3 py-2 min-w-[72px]">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className="text-sm font-semibold text-ink tabular-nums">{value}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detail panel
// ---------------------------------------------------------------------------

function BuildDetailPanel({ detail }: { detail: BuildDetail }) {
  const { build, thermals, benchmarks } = detail

  const componentRows = [
    ['Case',        `${build.case_name}${build.volume_liters ? ` (${build.volume_liters}L)` : ''}`],
    ['Motherboard', build.motherboard],
    ['CPU',         build.cpu],
    ['Cooler',      build.cpu_cooler],
    ['Memory',      build.memory],
    ['GPU',         build.gpu],
    ['PSU',         build.psu],
    ['Storage',     build.storage_primary],
    ['Storage 2',   build.storage_secondary],
  ].filter(([, v]) => v) as [string, string][]

  if (build.extra_components?.length) {
    componentRows.push(['Extras', build.extra_components.join(', ')])
  }

  const benchmarkOrder = ['cinebench_r23', 'cinebench_r24', 'heaven', 'furmark']
  const benchmarkLabels: Record<string, string> = {
    cinebench_r23: 'Cinebench R23',
    cinebench_r24: 'Cinebench R24',
    heaven: 'Unigine Heaven',
    furmark: 'Furmark',
  }

  return (
    <div className="space-y-6 pt-4 border-t border-line">

      {/* Components */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-3">
          Components
        </h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
          {componentRows.map(([label, value]) => (
            <div key={label} className="flex gap-2 text-sm">
              <dt className="w-24 shrink-0 text-ink-muted">{label}</dt>
              <dd className="text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Thermals */}
      {thermals.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-3">
            Thermals {build.ambient_temp_c != null && `(ambient ${build.ambient_temp_c}°C)`}
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-muted border-b border-line">
                <th className="pb-2 font-medium w-16">Part</th>
                <th className="pb-2 font-medium">Idle</th>
                <th className="pb-2 font-medium">Gaming</th>
                <th className="pb-2 font-medium">Stress</th>
                <th className="pb-2 font-medium text-right">Power</th>
              </tr>
            </thead>
            <tbody>
              {thermals.map(t => (
                <tr key={t.component} className="border-b border-line/50 last:border-0">
                  <td className="py-2 text-ink-muted uppercase text-xs font-medium">{t.component}</td>
                  <td className="py-2 tabular-nums">{tempRange(t.idle_min_c, t.idle_max_c)}</td>
                  <td className="py-2 tabular-nums">{tempRange(t.gaming_min_c, t.gaming_max_c)}</td>
                  <td className="py-2 tabular-nums">{tempRange(t.stress_min_c, t.stress_max_c)}</td>
                  <td className="py-2 tabular-nums text-right text-ink-muted">
                    {t.stress_power_w != null ? `${t.stress_power_w}w` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Benchmarks */}
      {Object.keys(benchmarks).length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-3">
            Benchmarks
          </h3>
          <div className="space-y-4">
            {benchmarkOrder.filter(k => benchmarks[k]).map(key => {
              const rows = benchmarks[key]
              const isCPU = key.startsWith('cinebench')

              if (isCPU) {
                const single = rows.find(r => r.test_type === 'cpu_single')
                const multi  = rows.find(r => r.test_type === 'cpu_multi')
                const power  = single?.max_power_w ?? multi?.max_power_w
                return (
                  <div key={key}>
                    <p className="text-xs text-ink-muted mb-2">{benchmarkLabels[key]}</p>
                    <div className="flex gap-3 flex-wrap">
                      {single && <StatBadge label="Single" value={String(single.score ?? '—')} />}
                      {multi  && <StatBadge label="Multi"  value={String(multi.score  ?? '—')} />}
                      {power  != null && <StatBadge label="Power" value={`${power}w`} />}
                    </div>
                  </div>
                )
              }

              // GPU benchmark — rows per resolution
              const sorted = [...rows].sort(
                (a, b) =>
                  RESOLUTION_ORDER.indexOf(a.resolution ?? '') -
                  RESOLUTION_ORDER.indexOf(b.resolution ?? '')
              )
              return (
                <div key={key}>
                  <p className="text-xs text-ink-muted mb-2">{benchmarkLabels[key]}</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-ink-muted border-b border-line">
                        <th className="pb-1.5 font-medium w-16">Res</th>
                        <th className="pb-1.5 font-medium">Score</th>
                        <th className="pb-1.5 font-medium">FPS</th>
                        <th className="pb-1.5 font-medium text-right">Power</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map(r => (
                        <tr key={r.resolution} className="border-b border-line/50 last:border-0">
                          <td className="py-1.5 text-ink-muted">{r.resolution}</td>
                          <td className="py-1.5 tabular-nums">{r.score ?? '—'}</td>
                          <td className="py-1.5 tabular-nums">{r.fps != null ? r.fps.toFixed(1) : '—'}</td>
                          <td className="py-1.5 tabular-nums text-right text-ink-muted">
                            {r.max_power_w != null ? `${r.max_power_w}w` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Build notes */}
      {build.build_notes && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-3">
            Build Notes
          </h3>
          <p className="text-sm text-ink leading-relaxed whitespace-pre-line">
            {build.build_notes}
          </p>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Build card
// ---------------------------------------------------------------------------

function BuildCard({
  build,
  isSelected,
  onSelect,
}: {
  build: BuildSummary
  isSelected: boolean
  detail: BuildDetail | null
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border p-4 transition-colors ${
        isSelected
          ? 'border-accent bg-accent/5'
          : 'border-line bg-surface hover:bg-surface-alt'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-ink truncate">{build.case_name}</p>
          {build.volume_liters && (
            <span className="text-xs text-ink-muted">{build.volume_liters}L</span>
          )}
          <p className="text-xs text-ink-muted mt-1 truncate">{build.cpu ?? '—'}</p>
          <p className="text-xs text-ink-muted truncate">{build.gpu ?? 'APU'}</p>
        </div>

        {build.has_benchmarks && (
          <div className="flex gap-2 shrink-0 flex-wrap justify-end">
            {build.cb23_multi != null && (
              <StatBadge label="CB23" value={build.cb23_multi.toLocaleString()} />
            )}
            {build.heaven_1080p_fps != null && (
              <StatBadge label="1080p" value={`${build.heaven_1080p_fps.toFixed(0)} fps`} />
            )}
            {build.cpu_stress_max_c != null && (
              <StatBadge label="CPU°" value={`${build.cpu_stress_max_c}°`} />
            )}
          </div>
        )}
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const PAGE_SIZE = 30

export default function SFFLibraryPage() {
  const { getToken } = useAuth()

  const [cases, setCases] = useState<SFFCase[]>([])
  const [builds, setBuilds] = useState<BuildSummary[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)

  const [search, setSearch] = useState('')
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null)
  const [benchmarksOnly, setBenchmarksOnly] = useState(false)

  const [selectedBuildId, setSelectedBuildId] = useState<number | null>(null)
  const [detail, setDetail] = useState<BuildDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchRef = useRef(search)
  searchRef.current = search

  // Fetch cases once
  useEffect(() => {
    apiFetch<{ cases: SFFCase[] }>('/api/sff/cases', { getToken })
      .then(d => setCases(d.cases))
      .catch(() => {})
  }, [getToken])

  const fetchBuilds = useCallback(async (
    newOffset: number,
    append: boolean,
  ) => {
    append ? setLoadingMore(true) : setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (searchRef.current) params.set('search', searchRef.current)
      if (selectedCaseId != null) params.set('case_id', String(selectedCaseId))
      if (benchmarksOnly) params.set('has_benchmarks', 'true')
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String(newOffset))

      const data = await apiFetch<{ builds: BuildSummary[]; total: number }>(
        `/api/sff/builds?${params}`,
        { getToken },
      )
      setBuilds(prev => append ? [...prev, ...data.builds] : data.builds)
      setTotal(data.total)
      setOffset(newOffset)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load builds.')
    } finally {
      append ? setLoadingMore(false) : setLoading(false)
    }
  }, [getToken, selectedCaseId, benchmarksOnly])

  // Refetch when filters change
  useEffect(() => {
    setSelectedBuildId(null)
    setDetail(null)
    fetchBuilds(0, false)
  }, [fetchBuilds])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedBuildId(null)
      setDetail(null)
      fetchBuilds(0, false)
    }, 400)
    return () => clearTimeout(timer)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch detail when a build is selected
  useEffect(() => {
    if (selectedBuildId == null) { setDetail(null); return }
    setLoadingDetail(true)
    apiFetch<BuildDetail>(`/api/sff/builds/${selectedBuildId}`, { getToken })
      .then(d => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setLoadingDetail(false))
  }, [selectedBuildId, getToken])

  function handleSelectBuild(id: number) {
    setSelectedBuildId(prev => prev === id ? null : id)
  }

  if (error) {
    return (
      <div className="rounded-xl border border-line bg-surface p-8 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button onClick={() => fetchBuilds(0, false)} className="mt-4 text-sm text-accent hover:underline">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1>SFF Library</h1>
        <p className="mt-1 text-ink-muted">
          {total > 0 ? `${total} real-world small-form-factor builds` : 'Community SFF build notes with real-world benchmarks and thermals.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">

        {/* Filter sidebar */}
        <aside className="space-y-5">
          {/* Search */}
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search CPU, GPU, case…"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent"
          />

          {/* Benchmarks toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={benchmarksOnly}
              onChange={e => setBenchmarksOnly(e.target.checked)}
              className="rounded border-line accent-accent"
            />
            <span className="text-sm text-ink">Benchmarks only</span>
          </label>

          {/* Cases list */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-2">
              Filter by case
            </p>
            <div className="space-y-0.5 max-h-[60vh] overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCaseId(null)}
                className={`w-full text-left rounded px-2 py-1.5 text-sm transition-colors ${
                  selectedCaseId == null
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-alt'
                }`}
              >
                All cases
              </button>
              {cases.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCaseId(prev => prev === c.id ? null : c.id)}
                  className={`w-full text-left rounded px-2 py-1.5 text-sm transition-colors ${
                    selectedCaseId === c.id
                      ? 'bg-accent/10 text-accent font-medium'
                      : 'text-ink-muted hover:text-ink hover:bg-surface-alt'
                  }`}
                >
                  <span className="truncate block">{c.name}</span>
                  {c.volume_liters && (
                    <span className="text-xs opacity-60">{c.volume_liters}L</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Build list */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-ink-muted text-sm">
              Loading…
            </div>
          ) : builds.length === 0 ? (
            <div className="rounded-xl border border-line bg-surface p-10 text-center">
              <p className="text-ink-muted text-sm">No builds match your filters.</p>
            </div>
          ) : (
            <>
              {builds.map(b => (
                <div key={b.id}>
                  <BuildCard
                    build={b}
                    isSelected={selectedBuildId === b.id}
                    detail={selectedBuildId === b.id ? detail : null}
                    onSelect={() => handleSelectBuild(b.id)}
                  />
                  {/* Inline detail panel */}
                  {selectedBuildId === b.id && (
                    <div className="rounded-b-xl border border-t-0 border-accent/30 bg-surface px-5 py-4">
                      {loadingDetail ? (
                        <p className="text-sm text-ink-muted py-4 text-center">Loading…</p>
                      ) : detail ? (
                        <BuildDetailPanel detail={detail} />
                      ) : null}
                    </div>
                  )}
                </div>
              ))}

              {/* Load more */}
              {offset + PAGE_SIZE < total && (
                <div className="pt-2 text-center">
                  <button
                    onClick={() => fetchBuilds(offset + PAGE_SIZE, true)}
                    disabled={loadingMore}
                    className="rounded-lg border border-line bg-surface px-5 py-2 text-sm font-medium text-ink hover:bg-surface-alt disabled:opacity-50 transition-colors"
                  >
                    {loadingMore ? 'Loading…' : `Load more (${total - offset - builds.length} remaining)`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
