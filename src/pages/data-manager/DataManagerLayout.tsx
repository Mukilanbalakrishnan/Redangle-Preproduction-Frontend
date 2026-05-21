import { Outlet } from 'react-router-dom'
import DataManagerSidebar from './components/DataManagerSidebar'
import DataManagerTopbar from './components/DataManagerTopbar'

export default function DataManagerLayout() {
    return (
        <div className="min-h-screen bg-[#F0F2F5] flex">
            <DataManagerSidebar />
            <div className="flex-1 flex flex-col min-w-0" style={{ marginLeft: '280px' }}>
                <DataManagerTopbar />
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
