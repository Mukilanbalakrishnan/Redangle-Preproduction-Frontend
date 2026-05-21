import { Outlet } from 'react-router-dom'
import EmployeeSidebar from './components/EmployeeSidebar'
import EmployeeTopbar from './components/EmployeeTopbar'

export default function EmployeeLayout() {
    return (
        <div className="min-h-screen bg-[#F0F2F5] flex">
            <EmployeeSidebar />
            <div className="flex-1 flex flex-col min-w-0" style={{ marginLeft: '280px' }}>
                <EmployeeTopbar />
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
