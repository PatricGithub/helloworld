import { HashRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { ClientBasePage } from './pages/ClientBasePage'
import { FollowUpsPage } from './pages/FollowUpsPage'
import { MenuPage } from './pages/MenuPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientBasePage />} />
          <Route path="/follow-ups" element={<FollowUpsPage />} />
          <Route path="/menu" element={<MenuPage />} />
        </Route>
      </Routes>
      <Toaster position="bottom-right" richColors />
    </HashRouter>
  )
}
