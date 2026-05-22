import { Outlet } from 'react-router-dom'
import EventCoordinatorSidebar from './components/EventCoordinatorSidebar'
import EventCoordinatorTopbar from './components/EventCoordinatorTopbar'

export default function EventCoordinatorLayout() {
    return (
        <div className="flex min-h-screen" style={{ background: 'var(--content-bg)' }}>
            <EventCoordinatorSidebar />
            <div
                className="flex flex-col flex-1"
                style={{ marginLeft: '280px' }}
            >
                <EventCoordinatorTopbar />
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
