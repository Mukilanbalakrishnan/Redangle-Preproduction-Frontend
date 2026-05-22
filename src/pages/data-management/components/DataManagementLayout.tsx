import { Outlet } from 'react-router-dom'
import DataManagementSidebar from './DataManagementSidebar'
import DataManagementTopbar from './DataManagementTopbar'

export default function DataManagementLayout() {
    return (
        <div className="flex min-h-screen bg-[#fafafb] font-sans">
            <DataManagementSidebar />
            <div className="flex-1 ml-[280px] flex flex-col min-h-screen">
                <DataManagementTopbar />
                <main className="flex-1 p-10 overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
