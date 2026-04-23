import { SignIn } from '@clerk/clerk-react'

/**
 * Hosts Clerk's prebuilt <SignIn /> component.
 *
 * Sign-in methods (email/password, Google, GitHub) are enabled in the
 * Clerk Dashboard > User & Authentication > Email, Phone, Username
 * and Social Connections. No code needed here — Clerk auto-renders
 * whatever is enabled on the dashboard.
 *
 * The routing="path" + path="/sign-in" tells Clerk to use pathname-based
 * routing for its internal sub-routes (verification codes, etc.), which
 * matches how React Router handles the rest of the app.
 */
export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-alt px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            ComponentWatch
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Monitor prices and stock across every retailer you care about.
          </p>
        </div>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-in"
          appearance={{
            elements: {
              // Blend Clerk's card into the page shell instead of floating it
              rootBox: 'w-full',
              card: 'shadow-sm border border-line',
            },
          }}
        />
      </div>
    </div>
  )
}
