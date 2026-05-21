import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
    Bell,
    Calendar,
    CalendarOff,
    ChevronDown,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    Users,
    Wand2,
} from 'lucide-react'

type LeafItem = { to: string; icon: any; label: string; activePaths?: string[] }
type GroupItem = {
    key: string
    icon: any
    label: string
    color: string
    children: LeafItem[]
}

const topItems: LeafItem[] = [
    { to: '/operational-manager/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
]

const groups: GroupItem[] = [
    {
        key: 'post-production',
        icon: Wand2,
        label: 'Post-production',
        color: '#d97706',
        children: [
            {
                to: '/operational-manager/client',
                icon: Users,
                label: 'Client',
                activePaths: ['/operational-manager/client', '/operational-manager/assign-editor'],
            },
            { to: '/operational-manager/work-status', icon: ClipboardList, label: 'Work Status' },
        ],
    },
]

const bottomItems: LeafItem[] = [
    { to: '/operational-manager/notifications', icon: Bell, label: 'Notifications' },
    { to: '/operational-manager/attendance', icon: Calendar, label: 'Attendance' },
    { to: '/operational-manager/leave-request', icon: CalendarOff, label: 'Leave Request' },
]

export default function OperationalManagerSidebar() {
    const navigate = useNavigate()
    const location = useLocation()

    const [expanded, setExpanded] = useState<Record<string, boolean>>(() => ({
        'post-production': true,
    }))

    const toggle = (key: string) =>
        setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

    const renderLeaf = ({ to, icon: Icon, label, activePaths }: LeafItem, indent = false) => (
        <NavLink
            key={to}
            to={to}
            className={`flex items-center rounded-xl transition-all duration-150 ${indent
                ? 'gap-2.5 px-3 py-2 text-[13px] font-medium'
                : 'mb-1 gap-3 px-4 py-3 text-sm font-semibold'
                }`}
            style={({ isActive }) => {
                const forcedActive = activePaths?.some(path => location.pathname.startsWith(path))
                const active = isActive || forcedActive
                return {
                    color: active ? '#7c3aed' : indent ? '#6B7280' : '#374151',
                    background: active ? '#fff' : undefined,
                    boxShadow: active ? '0 1px 3px rgba(124,58,237,0.1)' : undefined,
                }
            }}
        >
            <Icon size={indent ? 14 : 18} />
            <span>{label}</span>
        </NavLink>
    )

    return (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col overflow-y-auto border-r border-purple-100 bg-[#F8F6FF]">
            <div className="flex-shrink-0 cursor-pointer px-5 pb-4 pt-6" onClick={() => navigate('/operational-manager/dashboard')}>
                <div className="flex items-center gap-2">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #5B5FC7)' }}
                    >
                        <span style={{ fontStyle: 'italic', fontWeight: 900 }}>ra</span>
                    </div>
                    <div>
                        <div className="text-xs font-extrabold uppercase tracking-widest text-gray-900">Red Angle</div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-400">Post-production</div>
                    </div>
                </div>
            </div>

            <div className="mx-4 mb-2 h-px bg-purple-200/50" />

            <nav className="flex-1 overflow-y-auto px-3" style={{ scrollbarWidth: 'none' }}>
                {topItems.map(item => renderLeaf(item))}

                {groups.map(group => {
                    const Icon = group.icon
                    const isOpen = !!expanded[group.key]
                    const isGroupActive = group.children.some(child =>
                        location.pathname.startsWith(child.to) ||
                        child.activePaths?.some(path => location.pathname.startsWith(path))
                    )

                    return (
                        <div key={group.key} className="mt-1">
                            <button
                                type="button"
                                onClick={() => toggle(group.key)}
                                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all ${isGroupActive ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                                        style={{ backgroundColor: `${group.color}15` }}
                                    >
                                        <Icon size={15} style={{ color: group.color }} />
                                    </div>
                                    {group.label}
                                </div>
                                <ChevronDown
                                    size={14}
                                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {isOpen && (
                                <div className="ml-6 space-y-0.5 border-l-2 border-purple-100 pb-1 pl-4">
                                    {group.children.map(child => renderLeaf(child, true))}
                                </div>
                            )}
                        </div>
                    )
                })}

                <div className="mx-1 my-3 h-px bg-purple-200/50" />
                {bottomItems.map(item => renderLeaf(item))}
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
