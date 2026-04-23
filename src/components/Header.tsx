import { UserButton } from '@clerk/clerk-react'
import AppSwitcher from './AppSwitcher'

/**
 * Top navigation bar.
 * Left: wordmark.
 * Center: Engineering / PC Builds app switcher.
 * Right: Clerk UserButton (avatar + menu).
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-content items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <a href="/" className="text-ink font-semibold tracking-tight hover:text-ink">
            ComponentWatch
          </a>
          <AppSwitcher />
        </div>

        <UserButton
          appearance={{
            elements: {
              // Slightly shrink Clerk's default avatar to fit the compact header
              avatarBox: 'h-8 w-8',
            },
          }}
        />
      </div>
    </header>
  )
}
