import { Outlet } from 'react-router-dom'
import OperationalManagerSidebar from './components/OperationalManagerSidebar'
import OperationalManagerTopbar from './components/OperationalManagerTopbar'

export default function OperationalManagerLayout() {
    return (
        <div className="flex min-h-screen" style={{ background: 'var(--content-bg)' }}>
            <OperationalManagerSidebar />
            <div className="flex flex-col flex-1" style={{ marginLeft: '280px' }}>
                <OperationalManagerTopbar />
                <main
                    className="flex-1 overflow-auto"
                    style={{ marginTop: 'var(--topbar-height)', padding: '24px' }}
                >
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
