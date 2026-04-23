import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'
import './index.css'

// Read the Clerk publishable key from env at build time.
// Vite exposes env vars prefixed with VITE_ to client code.
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error(
    'Missing VITE_CLERK_PUBLISHABLE_KEY. ' +
    'Copy .env.example to .env.local and set the key from your Clerk dashboard.'
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      // Clerk needs to know which routes are public vs protected.
      // Sign-in / sign-up pages are handled by the /sign-in route.
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
