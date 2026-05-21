import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Compass, Camera, Film, Download, FileText, IndianRupee, Bell, LogOut } from 'lucide-react'

const navItems = [
    { name: 'Dashboard', path: '/client/dashboard', icon: LayoutDashboard },
    { name: 'Tracker', path: '/client/tracker', icon: Compass },
    { name: 'Quotation', path: '/client/quotation', icon: FileText },
    { name: 'Invoice', path: '/client/invoice', icon: IndianRupee },
    { name: 'Preproduction', path: '/client/preproduction', icon: Camera },
    { name: 'Postproduction', path: '/client/postproduction', icon: Film },
    { name: 'Delivery', path: '/client/delivery', icon: Download },
    { name: 'Notifications', path: '/client/notifications', icon: Bell },
]

export default function ClientSidebar() {
    const location = useLocation()
    const navigate = useNavigate()

    const handleLogout = () => {
        localStorage.removeItem('ra_token')
        localStorage.removeItem('ra_user')
        navigate('/login')
    }

    return (
        <aside className="w-[var(--sidebar-width)] h-screen fixed left-0 top-0 flex flex-col z-40" style={{ backgroundColor: 'rgba(218, 210, 242, 1)' }}>
            {/* Logo Area */}
            <div className="h-[var(--topbar-height)] flex items-center px-6 border-b border-indigo-900/10 pt-4 pb-2">
                <img src="/red_angle_logo.png" alt="RED ANGLE STUDIO" className="h-[32px] w-auto object-contain cursor-pointer" onClick={() => navigate('/client/dashboard')} />
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path)
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative
                                ${isActive
                                    ? 'bg-white text-[#5B5FC7] shadow-sm'
                                    : 'hover:bg-white/40 hover:text-indigo-950 text-indigo-900/70'
                                }
                            `}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full shadow-sm" style={{ backgroundColor: '#5B5FC7' }}></div>
                            )}
                            <Icon
                                size={18}
                                className={isActive ? 'text-[#5B5FC7]' : 'text-indigo-900/50 group-hover:text-indigo-900'}
                            />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-indigo-900/10 mb-2">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-900/70 hover:bg-red-50 hover:text-red-600 transition-all group"
                >
                    <LogOut
                        size={18}
                        className="text-indigo-900/50 group-hover:text-red-600 transition-colors"
                    />
                    Logout
                </button>
            </div>
        </aside>
    )
}
