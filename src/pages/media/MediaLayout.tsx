import { Outlet } from 'react-router-dom'
import MediaSidebar from './components/MediaSidebar'
import MediaTopbar from './components/MediaTopbar'

export default function MediaLayout() {
    return (
        <div className="flex min-h-screen" style={{ background: 'var(--content-bg)' }}>
            <MediaSidebar />
            <div
                className="flex flex-col flex-1"
                style={{ marginLeft: 'var(--sidebar-width)' }}
            >
                <MediaTopbar />
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
