import { Outlet } from 'react-router-dom'
import { SignedIn, UserButton } from '@clerk/clerk-react'
import AppSwitcher from './AppSwitcher'

/**
 * Layout for publicly accessible pages (no auth required).
 * Shows the same header as ProtectedLayout but with a "Sign in" link
 * instead of UserButton when the user is not authenticated.
 */
export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-surface-alt">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-content items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <a href="/" className="text-ink font-semibold tracking-tight hover:text-ink">
              ComponentWatch
            </a>
            <AppSwitcher />
          </div>
          <SignedIn>
            <UserButton appearance={{ elements: { avatarBox: 'h-8 w-8' } }} />
          </SignedIn>
          {/* SignedOut handled by showing nothing — clean for a public page */}
        </div>
      </header>
      <main className="mx-auto max-w-content px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
