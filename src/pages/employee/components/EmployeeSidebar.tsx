import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { ReactNode } from 'react'
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    Paperclip,
    Calendar,
    CalendarOff,
    Bell,
    LogOut,
    ChevronDown,
    Briefcase,
} from 'lucide-react'
import { getEmployeeRole, getRoleConfig } from '../employeeRoleConfig'

const editorSections: Record<string, { label: string; color: string; items: { title: string; path: string; icon: ReactNode }[] }> = {
    'traditional-video-editor': {
        label: 'Traditional Video',
        color: '#7c3aed',
        items: [
            { title: 'Assigned Client', path: '/employee/traditional-video/assigned-client', icon: <Users size={14} /> },
            { title: 'Works', path: '/employee/traditional-video/works', icon: <Briefcase size={14} /> },
        ],
    },
    'retouch-editor': {
        label: 'Retouch',
        color: '#7c3aed',
        items: [
            { title: 'Assigned Client', path: '/employee/traditional-photo/assigned-client', icon: <Users size={14} /> },
            { title: 'Works', path: '/employee/traditional-photo/works', icon: <Briefcase size={14} /> },
        ],
    },
    'album-designer': {
        label: 'Album Designer',
        color: '#9333ea',
        items: [
            { title: 'Assigned Client', path: '/employee/album-design/assigned-client', icon: <Users size={14} /> },
            { title: 'Works', path: '/employee/album-design/works', icon: <Briefcase size={14} /> },
        ],
    },
    'candid-video-editor': {
        label: 'Candid Video',
        color: '#7c3aed',
        items: [
            { title: 'Assigned Client', path: '/employee/candid-video/assigned-client', icon: <Users size={14} /> },
            { title: 'Works', path: '/employee/candid-video/works', icon: <Briefcase size={14} /> },
        ],
    },
}

export default function EmployeeSidebar() {
    const location = useLocation()
    const navigate = useNavigate()
    const role = getEmployeeRole()
    const config = getRoleConfig(role)
    const editorSection = editorSections[role]
    const [roleOpen, setRoleOpen] = useState(true)

    const navItems = [
        {
            title: 'Dashboard',
            path: '/employee/dashboard',
            icon: <LayoutDashboard size={20} />
        },
        ...(!editorSection ? [{
            title: 'Assigned Projects',
            path: '/employee/assigned-projects',
            icon: <Users size={20} />
        },
        {
            title: 'My Work',
            path: '/employee/my-work',
            icon: <CalendarCheck size={20} />
        },
        {
            title: config.specialPage.title,
            path: config.specialPage.path,
            icon: config.specialPage.icon
        }] : []),
        {
            title: 'Rework Request',
            path: '/employee/rework-request',
            icon: <Paperclip size={20} />
        },
        {
            title: 'My Attendance',
            path: '/employee/attendance',
            icon: <Calendar size={20} />
        },
        {
            title: 'Leave Request',
            path: '/employee/leave-request',
            icon: <CalendarOff size={20} />
        },
        {
            title: 'Notifications',
            path: '/employee/notifications',
            icon: <Bell size={20} />
        }
    ]

    return (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col overflow-y-auto border-r border-purple-100 bg-[#F8F6FF]">
            <div className="flex-shrink-0 cursor-pointer px-5 pb-4 pt-6" onClick={() => navigate('/employee/dashboard')}>
                <div className="flex items-center gap-2">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #5B5FC7)' }}
                    >
                        <span style={{ fontStyle: 'italic', fontWeight: 900 }}>ra</span>
                    </div>
                    <div>
                        <div className="text-xs font-extrabold uppercase tracking-widest text-gray-900">Red Angle</div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-400">Studio</div>
                    </div>
                </div>
            </div>

            <div className="mx-4 mb-2 h-px bg-purple-200/50" />

            <nav className="flex-1 overflow-y-auto px-3" style={{ scrollbarWidth: 'none' }}>
                {navItems.map((item) => {
                    const isActive = location.pathname.includes(item.path)
                    const link = (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all"
                            style={{
                                color: isActive ? '#7c3aed' : '#374151',
                                background: isActive ? '#fff' : undefined,
                                boxShadow: isActive ? '0 1px 3px rgba(124,58,237,0.1)' : undefined,
                            }}
                        >
                            <span>{item.icon}</span>
                            {item.title}
                        </Link>
                    )

                    if (!editorSection || item.path !== '/employee/dashboard') return link

                    const sectionActive = editorSection.items.some(sectionItem => location.pathname.startsWith(sectionItem.path))

                    return (
                        <div key={`${item.path}-with-editor-section`}>
                            {link}
                            <div className="mb-1">
                                <button
                                    onClick={() => setRoleOpen(prev => !prev)}
                                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all ${sectionActive ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${editorSection.color}15` }}>
                                            <Briefcase size={15} style={{ color: editorSection.color }} />
                                        </div>
                                        {editorSection.label}
                                    </div>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${roleOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {roleOpen && (
                                    <div className="ml-6 space-y-0.5 border-l-2 border-purple-100 pb-1 pl-4">
                                        {editorSection.items.map(sectionItem => {
                                            const childActive = location.pathname.startsWith(sectionItem.path)
                                            return (
                                                <Link
                                                    key={sectionItem.path}
                                                    to={sectionItem.path}
                                                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all"
                                                    style={{
                                                        color: childActive ? '#7c3aed' : '#6B7280',
                                                        background: childActive ? '#fff' : undefined,
                                                        boxShadow: childActive ? '0 1px 2px rgba(0,0,0,0.04)' : undefined,
                                                    }}
                                                >
                                                    {sectionItem.icon}
                                                    {sectionItem.title}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </nav>

            <div className="flex-shrink-0 px-3 pb-6 pt-2">
                <div className="mb-3 h-px bg-purple-200/50" />
                <button
                    onClick={() => {
                        localStorage.removeItem('ra_token')
                        localStorage.removeItem('ra_user')
                        localStorage.removeItem('ra_active_role')
                        navigate('/login')
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 transition-all hover:bg-white hover:text-gray-700"
                >
                    <LogOut size={16} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    )
}
