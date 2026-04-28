import { NavLink } from 'react-router-dom'

/**
 * The two-app split is a core product decision (see handoff section 12 #1).
 * One account, two distinct surfaces: Engineering (B2B) and PC Builds (consumer).
 * This switcher is the top-level navigation between them.
 */
export default function AppSwitcher() {
  return (
    <nav className="flex items-center gap-1 rounded-lg bg-surface-alt p-1">
      <NavLink
        to="/pc-builds"
        className={({ isActive }) =>
          [
            'rounded-md px-3 py-1 text-sm font-medium transition-colors',
            isActive
              ? 'bg-surface text-ink shadow-sm'
              : 'text-ink-muted hover:text-ink',
          ].join(' ')
        }
      >
        PC Builds
      </NavLink>
      <NavLink
        to="/engineering"
        className={({ isActive }) =>
          [
            'rounded-md px-3 py-1 text-sm font-medium transition-colors',
            isActive
              ? 'bg-surface text-ink shadow-sm'
              : 'text-ink-muted hover:text-ink',
          ].join(' ')
        }
      >
        Engineering
      </NavLink>
      <NavLink
        to="/sff-library"
        className={({ isActive }) =>
          [
            'rounded-md px-3 py-1 text-sm font-medium transition-colors',
            isActive
              ? 'bg-surface text-ink shadow-sm'
              : 'text-ink-muted hover:text-ink',
          ].join(' ')
        }
      >
        SFF Library
      </NavLink>
    </nav>
  )
}
