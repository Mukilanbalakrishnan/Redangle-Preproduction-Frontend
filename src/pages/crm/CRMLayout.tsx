import { Outlet } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'

export default function CRMLayout() {
    return (
        <div className="flex min-h-screen" style={{ background: 'var(--content-bg)' }}>
            <Sidebar />
            <div
                className="flex flex-col flex-1"
                style={{ marginLeft: '280px' }}
            >
                <Topbar />
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
