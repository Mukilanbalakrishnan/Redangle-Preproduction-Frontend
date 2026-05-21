import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, Users, Calendar, Briefcase, CalendarCheck, FileText, Bell, LogOut
} from 'lucide-react'

const navItems = [
    { to: '/media/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/media/assigned-client', icon: Users, label: 'Assigned Client' },
    { to: '/media/event-schedule', icon: Calendar, label: 'Event Schedule' },
    { to: '/media/my-work', icon: Briefcase, label: 'My Work' },
    { to: '/media/attendance', icon: CalendarCheck, label: 'Attendance' },
    { to: '/media/leave-request', icon: FileText, label: 'Leave Request' },
    { to: '/media/notifications', icon: Bell, label: 'Notifications' },
]

export default function MediaSidebar() {
    const navigate = useNavigate()
    const location = useLocation()

    // Sub-pages that should keep "My Work" highlighted
    const myWorkSubPages = ['/media/upload-files', '/media/my-work-details']
    const isOnMyWorkSubPage = myWorkSubPages.some(p => location.pathname.startsWith(p))

    return (
        <aside
            className="flex flex-col fixed top-0 left-0 z-40"
            style={{
                width: 'var(--sidebar-width)',
                minHeight: '100vh',
                background: 'var(--sidebar-bg)',
            }}
        >
            <div className="px-5 pt-6 pb-6">
                <div className="flex items-center gap-2">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #5B5FC7)' }}
                    >
                        <span style={{ fontStyle: 'italic', fontWeight: 900 }}>ra</span>
                    </div>
                    <div>
                        <div className="font-extrabold text-xs tracking-widest uppercase" style={{ color: '#1a1a2e' }}>Red Angle</div>
                        <div className="text-xs tracking-widest uppercase" style={{ color: '#9ca3af', letterSpacing: '0.15em' }}>Studio</div>
                    </div>
                </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(0,0,0,0.1)', margin: '0 16px 12px' }} />

            <nav className="flex flex-col gap-1 px-3 flex-1">
                {navItems.map(({ to, icon: Icon, label }) => {
                    const forceActive = to === '/media/my-work' && isOnMyWorkSubPage
                    return (
                        <NavLink
                            key={to}
                            to={to}
                            className={() =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150`
                            }
                            style={({ isActive }) => {
                                const active = isActive || forceActive
                                return {
                                    color: active ? '#111827' : '#4B5563',
                                    background: active ? '#FFFFFF' : undefined,
                                    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : undefined,
                                }
                            }}
                        >
                            <Icon size={16} />
                            <span>{label}</span>
                        </NavLink>
                    )
                })}
            </nav>

            <div className="px-3 pb-6 pt-4">
                <div style={{ height: '1px', background: 'rgba(0,0,0,0.1)', marginBottom: '12px' }} />
                <button
                    onClick={() => {
                        localStorage.removeItem('ra_token')
                        localStorage.removeItem('ra_user')
                        navigate('/login')
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium w-full transition-all hover:bg-white hover:bg-opacity-50"
                    style={{ color: '#4B5563' }}
                >
                    <LogOut size={16} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    )
}
