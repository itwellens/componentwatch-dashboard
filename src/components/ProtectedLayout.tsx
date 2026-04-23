import { Outlet } from 'react-router-dom'
import Header from './Header'

/**
 * Layout for all authenticated pages.
 * Provides the sticky header; children render in the <Outlet/>.
 * The auth gate itself lives in App.tsx (SignedIn/SignedOut from Clerk).
 */
export default function ProtectedLayout() {
  return (
    <div className="min-h-screen bg-surface-alt">
      <Header />
      <main className="mx-auto max-w-content px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
