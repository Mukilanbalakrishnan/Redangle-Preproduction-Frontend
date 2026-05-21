import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'

export default function AdminLayout() {
    return (
        <div className="min-h-screen bg-neutral-50 flex font-sans text-gray-900 selection:bg-purple-200 selection:text-purple-900">
            <AdminSidebar />
            <div className="flex-1 ml-[280px] flex flex-col min-h-screen relative">
                <AdminTopbar />
                <div className="flex-1 p-8 h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
