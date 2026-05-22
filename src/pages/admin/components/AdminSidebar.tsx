import { NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard,
    CalendarCheck,
    BarChart3,
    FileCheck2,
    LogOut,
    FileText,
    Bell,
    Badge,
    CalendarDays
} from 'lucide-react'

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Badge, label: 'Employee', path: '/admin/employee' },
    { icon: BarChart3, label: 'Tracking', path: '/admin/tracking' },
    { icon: CalendarCheck, label: 'Attendance', path: '/admin/attendance' },
    { icon: CalendarDays, label: 'My Attendance', path: '/admin/my-attendance' },
    { icon: FileCheck2, label: 'Leave Approval', path: '/admin/leave-approval' },
    { icon: FileText, label: 'Reports', path: '/admin/reports' },
    { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
]

export default function AdminSidebar() {
    const navigate = useNavigate()

    return (
        <aside className="w-[280px] bg-[#dfd5f6] h-screen fixed left-0 top-0 flex flex-col rounded-r-3xl z-20 shadow-sm border-r border-[#d4c5f0]">
            {/* Logo area */}
            <div className="p-8 pb-6 border-b border-[#d4c5f0]/50 sticky top-0 bg-[#dfd5f6] rounded-tr-3xl z-10">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/admin/dashboard')}>
                    <img src="/red_angle_logo.png" alt="RED ANGLE STUDIO" className="h-[40px] w-auto object-contain" />
                </div>
            </div>

            {/* Navigation links - scrollable area */}
            <nav className="flex-1 px-6 py-6 overflow-y-auto hidden-scrollbar space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 font-bold text-[13px] ${isActive
                                    ? 'bg-white text-gray-900 shadow-md transform scale-[1.02] border border-white/50'
                                    : 'text-gray-700 hover:bg-white/50 hover:text-gray-900 hover:shadow-sm'
                                }`
                            }
                        >
                            <Icon size={18} strokeWidth={2.5} className="shrink-0" />
                            <span className="truncate">{item.label}</span>
                        </NavLink>
                    )
                })}
            </nav>

            {/* Logout button area - sticky bottom */}
            <div className="p-6 border-t border-[#d4c5f0]/50 sticky bottom-0 bg-[#dfd5f6] rounded-br-3xl z-10">
                <button
                    onClick={() => {
                        localStorage.removeItem('ra_token')
                        localStorage.removeItem('ra_user')
                        navigate('/login')
                    }}
                    className="flex items-center gap-4 px-5 py-3.5 w-full rounded-2xl transition-all duration-300 font-bold text-[13px] text-gray-700 hover:bg-white/50 hover:text-red-600 hover:shadow-sm group"
                >
                    <LogOut size={18} strokeWidth={2.5} className="group-hover:text-red-600 transition-colors shrink-0" />
                    Logout
                </button>
            </div>
        </aside>
    )
}
