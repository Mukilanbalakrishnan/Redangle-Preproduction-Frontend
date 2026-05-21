import { Outlet } from 'react-router-dom'
import MultiRoleSidebar from './components/MultiRoleSidebar'
import MultiRoleTopbar from './components/MultiRoleTopbar'

export default function MultiRoleLayout() {
    return (
        <div className="min-h-screen bg-[#F0F2F5] flex">
            <MultiRoleSidebar />
            <div className="flex-1 flex flex-col min-w-0" style={{ marginLeft: '280px' }}>
                <MultiRoleTopbar />
                <main className="flex-1 p-6 overflow-y-auto">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
