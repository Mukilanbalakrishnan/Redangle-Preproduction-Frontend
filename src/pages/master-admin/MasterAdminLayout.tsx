import { Outlet } from 'react-router-dom'
import MasterAdminSidebar from './components/MasterAdminSidebar'
import MasterAdminTopbar from './components/MasterAdminTopbar'

export default function MasterAdminLayout() {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--content-bg)' }}>
      <MasterAdminSidebar />
      <div className="flex flex-1 flex-col" style={{ marginLeft: '280px' }}>
        <MasterAdminTopbar />
        <main className="flex-1 overflow-auto" style={{ marginTop: 'var(--topbar-height)', padding: '24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
