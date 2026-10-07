import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import { AppShell } from './components/AppShell'
import { EmptyState } from './components/EmptyState'
import { Loading } from './components/Loading'
import { isConfigured } from './lib/supabase'
import { emptyCopy, setupCopy } from './copy'
import Home from './pages/Home'
import Login from './pages/Login'
import Placeholder from './pages/Placeholder'
import Settings from './pages/Settings'

export default function App() {
  const { session, loading } = useAuth()

  if (!isConfigured) {
    return (
      <div className="flex min-h-dvh items-center px-5">
        <EmptyState title={setupCopy.title} body={setupCopy.body} />
      </div>
    )
  }
  if (loading) return <Loading fullscreen />
  if (!session) return <Login />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="companies" element={<Placeholder kicker="The roster" title="Companies" empty={emptyCopy.companies} />} />
        <Route path="stats" element={<Placeholder kicker="Season so far" title="Stats" empty={emptyCopy.stats} />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
