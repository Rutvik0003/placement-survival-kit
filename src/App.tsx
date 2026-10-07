import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import { AppShell } from './components/AppShell'
import { EmptyState } from './components/EmptyState'
import { Loading } from './components/Loading'
import { isConfigured } from './lib/supabase'
import { setupCopy } from './copy'
import Home from './pages/Home'
import Companies from './pages/Companies'
import CompanyDetail from './pages/CompanyDetail'
import EventDetail from './pages/EventDetail'
import Login from './pages/Login'

// Less-used screens load on demand (the service worker still caches them for offline use).
const CompanyForm = lazy(() => import('./pages/CompanyForm'))
const EventForm = lazy(() => import('./pages/EventForm'))
const CheckIn = lazy(() => import('./pages/CheckIn'))
const Season = lazy(() => import('./pages/Season'))
const Graveyard = lazy(() => import('./pages/Graveyard'))
const Badges = lazy(() => import('./pages/Badges'))
const Offer = lazy(() => import('./pages/Offer'))
const Wrapped = lazy(() => import('./pages/Wrapped'))
const Settings = lazy(() => import('./pages/Settings'))

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
        <Route path="companies" element={<Companies />} />
        <Route path="companies/new" element={<CompanyForm />} />
        <Route path="companies/:id" element={<CompanyDetail />} />
        <Route path="companies/:id/edit" element={<CompanyForm key="edit" />} />
        <Route path="events/new" element={<EventForm />} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="events/:id/edit" element={<EventForm key="edit" />} />
        <Route path="checkin/:id" element={<CheckIn />} />
        <Route path="season" element={<Season />} />
        <Route path="graveyard" element={<Graveyard />} />
        <Route path="badges" element={<Badges />} />
        <Route path="offer/:id" element={<Offer />} />
        <Route path="wrapped" element={<Wrapped />} />
        <Route path="stats" element={<Navigate to="/season" replace />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
