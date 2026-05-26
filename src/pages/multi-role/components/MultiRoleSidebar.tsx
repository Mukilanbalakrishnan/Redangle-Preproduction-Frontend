import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useMemo } from 'react'
import {
    LayoutDashboard, Camera, Video, Briefcase, Users, Calendar, ChevronDown,
    LogOut, Image, Film, Palette, CalendarCheck, FileText, Bell, Plane, Clock
} from 'lucide-react'

interface NavSection {
    id: string
    label: string
    icon: React.ElementType
    color: string
    items: { to: string; icon: React.ElementType; label: string }[]
}

const sections: NavSection[] = [
    {
        id: 'photographer',
        label: 'Photographer',
        icon: Camera,
        color: '#2563eb',
        items: [
            { to: '/multi-role/photographer/assigned-client', icon: Users, label: 'Assigned Client' },
            { to: '/multi-role/photographer/event-schedule', icon: Calendar, label: 'Event Scheduler' },
            { to: '/multi-role/photographer/works', icon: Briefcase, label: 'Works' },
        ],
    },
    {
        id: 'videographer',
        label: 'Videographer',
        icon: Video,
        color: '#059669',
        items: [
            { to: '/multi-role/videographer/assigned-client', icon: Users, label: 'Assigned Client' },
            { to: '/multi-role/videographer/event-schedule', icon: Calendar, label: 'Event Scheduler' },
            { to: '/multi-role/videographer/works', icon: Briefcase, label: 'Works' },
        ],
    },
    {
        id: 'drone',
        label: 'Drone (Event-only)',
        icon: Plane,
        color: '#0d9488',
        items: [
            { to: '/multi-role/drone/assigned-client', icon: Users, label: 'Assigned Client' },
            { to: '/multi-role/drone/event-schedule', icon: Calendar, label: 'Event Scheduler' },
            { to: '/multi-role/drone/works', icon: Briefcase, label: 'Works' },
        ],
    },
    {
        id: 'employee',
        label: 'Roles',
        icon: Briefcase,
        color: '#d97706',
        items: [
            { to: '/multi-role/employee/save-the-date', icon: Image, label: 'Save the Date' },
            { to: '/multi-role/employee/save-the-video', icon: Film, label: 'Save the Video' },
            { to: '/multi-role/employee/retouch', icon: Palette, label: 'Retouch' },
            { to: '/multi-role/employee/traditional-video', icon: Video, label: 'Traditional Video' },
            { to: '/multi-role/employee/candid-video', icon: Film, label: 'Candid Video' },
        ],
    },
    {
        id: 'retouch',
        label: 'Retouch',
        icon: Camera,
        color: '#7c3aed',
        items: [
            { to: '/multi-role/traditional-photo/assigned-client', icon: Users, label: 'Assigned Client' },
            { to: '/multi-role/traditional-photo/works', icon: Briefcase, label: 'Works' },
        ],
    },
    {
        id: 'album-design',
        label: 'Album Designer',
        icon: Image,
        color: '#9333ea',
        items: [
            { to: '/multi-role/album-design/assigned-client', icon: Users, label: 'Assigned Client' },
            { to: '/multi-role/album-design/works', icon: Briefcase, label: 'Works' },
        ],
    },
]

export default function MultiRoleSidebar() {
    const navigate = useNavigate()
    const location = useLocation()

    const filteredSections = useMemo(() => {
        const rawUser = localStorage.getItem('ra_user')
        const user = rawUser ? JSON.parse(rawUser) : null
        const userRoles: string[] = user?.roles || (user?.role ? [user.role] : [])
        const uRoles = userRoles.map(r => r.toLowerCase().trim())

        const showPhotographer = uRoles.includes('photographer')
        const showVideographer = uRoles.includes('videographer')
        const showDrone = uRoles.includes('drone')
        const showSaveTheDate = uRoles.includes('employee-1') || uRoles.includes('save the date post')
        const showSaveTheVideo = uRoles.includes('employee-2') || uRoles.includes('save the date video')
        const showRetouch = uRoles.includes('employee-4') || uRoles.includes('retouch photo') || uRoles.includes('retouch')
        const showTraditionalVideo = uRoles.includes('traditional-video-editor') || uRoles.includes('traditional video editor')
        const showTraditionalPhoto = uRoles.includes('retouch-editor') || uRoles.includes('traditional-photo-editor') || uRoles.includes('traditional photo editor') || uRoles.includes('retouch editor')
        const showAlbumDesign = uRoles.includes('album-designer') || uRoles.includes('album designer')
        const showCandidVideo = uRoles.includes('candid-video-editor') || uRoles.includes('candid video editor')

        return sections.map(section => {
            if (section.id === 'photographer' && !showPhotographer) return null
            if (section.id === 'videographer' && !showVideographer) return null
            if (section.id === 'drone' && !showDrone) return null
            if (section.id === 'retouch' && !showTraditionalPhoto) return null
            if (section.id === 'album-design' && !showAlbumDesign) return null
            if (section.id === 'employee') {
                const items = section.items.filter(item => {
                    if (item.to.includes('save-the-date')) return showSaveTheDate
                    if (item.to.includes('save-the-video')) return showSaveTheVideo
                    if (item.to.includes('retouch')) return showRetouch
                    if (item.to.includes('traditional-video')) return showTraditionalVideo
                    if (item.to.includes('candid-video')) return showCandidVideo
                    return true
                })
                if (items.length === 0) return null
                return { ...section, items }
            }
            return section
        }).filter(Boolean) as NavSection[]
    }, [])

    const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
        // Expand the section that contains the current path
        const initial: Record<string, boolean> = {}
        filteredSections.forEach(s => {
            initial[s.id] = s.items.some(i => location.pathname.startsWith(i.to))
        })
        // If none matched (e.g. on dashboard), expand all
        if (!Object.values(initial).some(Boolean)) {
            filteredSections.forEach(s => { initial[s.id] = true })
        }
        return initial
    })

    const toggle = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
    }

    return (
        <aside className="w-[280px] bg-[#F8F6FF] flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-20 border-r border-purple-100">
            {/* Logo */}
            <div className="px-5 pt-6 pb-4 cursor-pointer" onClick={() => navigate('/multi-role/dashboard')}>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #5B5FC7)' }}>
                        <span style={{ fontStyle: 'italic', fontWeight: 900 }}>ra</span>
                    </div>
                    <div>
                        <div className="font-extrabold text-xs tracking-widest uppercase text-gray-900">Red Angle</div>
                        <div className="text-[10px] tracking-widest uppercase text-gray-400">Multi-Role</div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-purple-200/50 mx-4 mb-2" />

            <nav className="flex-1 px-3 overflow-y-auto">
                {/* Dashboard link */}
                <NavLink
                    to="/multi-role/dashboard"
                    end
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-1"
                    style={({ isActive }) => ({
                        color: isActive ? '#7c3aed' : '#374151',
                        background: isActive ? '#fff' : undefined,
                        boxShadow: isActive ? '0 1px 3px rgba(124,58,237,0.1)' : undefined,
                    })}
                >
                    <LayoutDashboard size={18} />
                    Dashboard
                </NavLink>

                {/* Common Photography/Video/Drone/Employee Client Flow */}
                {filteredSections.length > 0 && (
                    <>
                        <NavLink
                            to="/multi-role/clients"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-1"
                            style={({ isActive }) => ({
                                color: isActive ? '#7c3aed' : '#374151',
                                background: isActive ? '#fff' : undefined,
                                boxShadow: isActive ? '0 1px 3px rgba(124,58,237,0.1)' : undefined,
                            })}
                        >
                            <Users size={18} />
                            Clients
                        </NavLink>
                        
                        <NavLink
                            to="/multi-role/time-tracker"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-4"
                            style={({ isActive }) => ({
                                color: isActive ? '#7c3aed' : '#374151',
                                background: isActive ? '#fff' : undefined,
                                boxShadow: isActive ? '0 1px 3px rgba(124,58,237,0.1)' : undefined,
                            })}
                        >
                            <Clock size={18} />
                            Time Tracker
                        </NavLink>
                    </>
                )}

                {/* Role sections */}
                {filteredSections.map((section) => {
                    const SectionIcon = section.icon
                    const sectionActive = section.items.some(i => location.pathname.startsWith(i.to))

                    return (
                        <div key={section.id} className="mb-4">
                            <div className={`flex items-center w-full px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider mb-2 ${sectionActive ? 'text-gray-900' : 'text-gray-500'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: `${section.color}15` }}>
                                        <SectionIcon size={13} style={{ color: section.color }} />
                                    </div>
                                    {section.label}
                                </div>
                            </div>

                            <div className="ml-6 pl-4 border-l-2 border-purple-100 space-y-0.5 pb-1">
                                {section.items.map(({ to, icon: Icon, label }) => (
                                    <NavLink
                                        key={to}
                                        to={to}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all"
                                        style={({ isActive }) => ({
                                            color: isActive ? '#7c3aed' : '#6B7280',
                                            background: isActive ? '#fff' : undefined,
                                            boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.04)' : undefined,
                                        })}
                                    >
                                        <Icon size={14} />
                                        {label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    )
                })}

                {/* Common pages divider */}
                <div className="h-px bg-purple-200/50 mx-1 my-3" />

                {/* Common pages */}
                {[
                    { to: '/multi-role/attendance', icon: CalendarCheck, label: 'Attendance' },
                    { to: '/multi-role/leave-request', icon: FileText, label: 'Leave Request' },
                    { to: '/multi-role/notifications', icon: Bell, label: 'Notifications' },
                ].map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-0.5"
                        style={({ isActive }) => ({
                            color: isActive ? '#7c3aed' : '#6B7280',
                            background: isActive ? '#fff' : undefined,
                            boxShadow: isActive ? '0 1px 3px rgba(124,58,237,0.1)' : undefined,
                        })}
                    >
                        <Icon size={16} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className="px-3 pb-6 pt-2">
                <div className="h-px bg-purple-200/50 mb-3" />
                <button
                    onClick={() => {
                        localStorage.removeItem('ra_token')
                        localStorage.removeItem('ra_user')
                        localStorage.removeItem('ra_active_role')
                        navigate('/login')
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium w-full text-gray-500 hover:bg-white hover:text-gray-700 transition-all"
                >
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </aside>
    )
}
