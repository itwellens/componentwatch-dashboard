import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import SignInPage from './pages/SignInPage'
import EngineeringPage from './pages/EngineeringPage'
import PCBuildsPage from './pages/PCBuildsPage'
import SFFLibraryPage from './pages/SFFLibraryPage'
import ProtectedLayout from './components/ProtectedLayout'
import PublicLayout from './components/PublicLayout'

/**
 * Route structure:
 *   /sign-in           — public, Clerk-hosted sign-in form
 *   /                  — redirects to /pc-builds by default (PC side launches first)
 *   /engineering       — protected, engineering dashboard
 *   /pc-builds         — protected, PC builds dashboard
 *
 * The <SignedIn> / <SignedOut> gates handle the public/protected split.
 * ProtectedLayout adds the header with UserButton + nav.
 */
export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/sign-in/*" element={<SignInPage />} />

      {/* Protected routes — wrapped in header layout */}
      <Route
        element={
          <>
            <SignedIn>
              <ProtectedLayout />
            </SignedIn>
            <SignedOut>
              <Navigate to="/sign-in" replace />
            </SignedOut>
          </>
        }
      >
        <Route path="/" element={<Navigate to="/pc-builds" replace />} />
        <Route path="/engineering" element={<EngineeringPage />} />
        <Route path="/pc-builds" element={<PCBuildsPage />} />
      </Route>

      {/* Public SFF Library — accessible without sign-in */}
      <Route element={<PublicLayout />}>
        <Route path="/sff-library" element={<SFFLibraryPage />} />
      </Route>

      {/* Unknown route → go home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
