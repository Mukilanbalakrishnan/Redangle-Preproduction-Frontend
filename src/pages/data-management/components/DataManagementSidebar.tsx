import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard,
    DownloadCloud,
    CheckSquare,
    Database,
    Send,
    Link as LinkIcon,
    Users,
    Activity,
    Calendar,
    CalendarOff,
    Bell,
    LogOut
} from 'lucide-react'

const navItems = [
    {
        title: 'Dashboard',
        path: '/data-management/dashboard',
        icon: <LayoutDashboard size={20} />
    },
    {
        title: 'Receiver Footage',
        path: '/data-management/receive-footage',
        icon: <DownloadCloud size={20} />
    },
    {
        title: 'QC Validation',
        path: '/data-management/qc-validation',
        icon: <CheckSquare size={20} />
    },
    {
        title: 'Server Storage',
        path: '/data-management/server-storage',
        icon: <Database size={20} />
    },
    {
        title: 'Client Delivery',
        path: '/data-management/client-delivery',
        icon: <Send size={20} />
    },
    {
        title: 'Link Sharing',
        path: '/data-management/link-sharing',
        icon: <LinkIcon size={20} />
    },
    {
        title: 'Team Sharing',
        path: '/data-management/team-sharing',
        icon: <Users size={20} />
    },
    {
        title: 'Process Status',
        path: '/data-management/process-status',
        icon: <Activity size={20} />
    },
    {
        title: 'Attendance',
        path: '/data-management/attendance',
        icon: <Calendar size={20} />
    },
    {
        title: 'Leave Request',
        path: '/data-management/leave-request',
        icon: <CalendarOff size={20} />
    },
    {
        title: 'Leave Management',
        path: '/data-management/leave-management',
        icon: <CalendarOff size={20} />
    },
    {
        title: 'Notifications',
        path: '/data-management/notifications',
        icon: <Bell size={20} />
    }
]

export default function DataManagementSidebar() {
    const location = useLocation()
    const navigate = useNavigate()

    return (
        <aside className="w-[280px] bg-[#dfd5f6] flex flex-col h-screen fixed left-0 top-0 overflow-y-auto">
            {/* Logo area */}
            <div className="p-8 pb-10">
                <div className="flex items-center gap-2">
                    <div className="text-black font-bold text-3xl tracking-tighter flex items-center">
                        <span className="bg-black text-white w-10 h-10 rounded-lg flex items-center justify-center mr-1">r</span>
                        <span className="text-black rounded-lg w-10 h-10 flex items-center justify-center -ml-4 mix-blend-multiply border-4 border-black box-border">o</span>
                    </div>
                    <div className="leading-none pt-1">
                        <div className="text-[14px] font-black tracking-widest text-[#000000]">RED ANGLE</div>
                        <div className="text-[10px] tracking-[0.3em] text-gray-800 font-semibold mt-0.5">STUDIO</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 mt-2">
                {navItems.map((item) => {
                    const isActive = location.pathname.includes(item.path)
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-4 px-6 py-4 rounded-xl text-[14px] font-bold transition-all ${isActive
                                ? 'bg-white text-black shadow-sm'
                                : 'text-gray-800 hover:bg-white/50 hover:text-black font-semibold'
                                }`}
                        >
                            <span className={isActive ? 'text-black' : 'text-gray-700'}>{item.icon}</span>
                            {item.title}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 mt-auto mb-4">
                <button
                    onClick={() => {
                        localStorage.removeItem('ra_token')
                        localStorage.removeItem('ra_user')
                        navigate('/login')
                    }}
                    className="flex items-center gap-4 px-6 py-4 w-full rounded-xl text-[14px] font-semibold text-gray-800 hover:bg-white/50 transition-all text-left"
                >
                    <LogOut size={20} className="text-gray-700" />
                    Logout
                </button>
            </div>
        </aside>
    )
}
