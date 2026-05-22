import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
    Bell,
    Calendar,
    CalendarOff,
    Camera,
    CheckSquare,
    ChevronDown,
    DownloadCloud,
    ImageIcon,
    LayoutDashboard,
    LogOut,
    PartyPopper,
} from 'lucide-react'

type LeafItem = { to: string; icon: any; label: string }
type GroupItem = {
    key: string
    icon: any
    label: string
    color: string
    basePath: string
    children: LeafItem[]
}

const topItems: LeafItem[] = [
    { to: '/data-manager/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
]

const groupChildren = (basePath: string, includePixoffice: boolean): LeafItem[] => {
    const children: LeafItem[] = [
        { to: `${basePath}/incoming-data`, icon: DownloadCloud, label: 'Incoming Raw Data' },
        { to: `${basePath}/verification`, icon: CheckSquare, label: 'Verification' },
    ]

    if (includePixoffice) {
        children.push({ to: `${basePath}/pixoffice`, icon: ImageIcon, label: 'Pixoffice' })
        children.push({ to: `${basePath}/pixstudio`, icon: ImageIcon, label: 'Pixstudio' })
    }

    return children
}

const groups: GroupItem[] = [
    {
        key: 'pre-production',
        icon: Camera,
        label: 'Pre-production',
        color: '#2563eb',
        basePath: '/data-manager/pre-production',
        children: groupChildren('/data-manager/pre-production', false),
    },
    {
        key: 'event',
        icon: PartyPopper,
        label: 'Event',
        color: '#059669',
        basePath: '/data-manager/event',
        children: groupChildren('/data-manager/event', true),
    },
]

const bottomItems: LeafItem[] = [
    { to: '/data-manager/notification', icon: Bell, label: 'Notification' },
    { to: '/data-manager/attendance', icon: Calendar, label: 'Attendance' },
    { to: '/data-manager/leave-request', icon: CalendarOff, label: 'Leave Request' },
]

export default function DataManagerSidebar() {
    const location = useLocation()
    const navigate = useNavigate()

    const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {}
        for (const group of groups) {
            initial[group.key] = location.pathname.startsWith(group.basePath)
        }
        if (!Object.values(initial).some(Boolean)) {
            initial['pre-production'] = true
            initial.event = true
        }
        return initial
    })

    const toggle = (key: string) =>
        setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

    const renderLeaf = ({ to, icon: Icon, label }: LeafItem, indent = false) => (
        <NavLink
            key={to}
            to={to}
            className={`flex items-center rounded-xl transition-all duration-150 ${indent
                ? 'gap-2.5 px-3 py-2 text-[13px] font-medium'
                : 'mb-1 gap-3 px-4 py-3 text-sm font-semibold'
                }`}
            style={({ isActive }) => ({
                color: isActive ? '#7c3aed' : indent ? '#6B7280' : '#374151',
                background: isActive ? '#fff' : undefined,
                boxShadow: isActive ? '0 1px 3px rgba(124,58,237,0.1)' : undefined,
            })}
        >
            <Icon size={indent ? 14 : 18} />
            <span>{label}</span>
        </NavLink>
    )

    return (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col overflow-y-auto border-r border-purple-100 bg-[#F8F6FF]">
            <div className="flex-shrink-0 cursor-pointer px-5 pb-4 pt-6" onClick={() => navigate('/data-manager/dashboard')}>
                <div className="flex items-center gap-2">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #5B5FC7)' }}
                    >
                        <span style={{ fontStyle: 'italic', fontWeight: 900 }}>ra</span>
                    </div>
                    <div>
                        <div className="text-xs font-extrabold uppercase tracking-widest text-gray-900">Red Angle</div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-400">Data Manager</div>
                    </div>
                </div>
            </div>

            <div className="mx-4 mb-2 h-px bg-purple-200/50" />

            <nav className="flex-1 overflow-y-auto px-3" style={{ scrollbarWidth: 'none' }}>
                {topItems.map(item => renderLeaf(item))}

                {groups.map(group => {
                    const Icon = group.icon
                    const isOpen = !!expanded[group.key]
                    const isGroupActive = location.pathname.startsWith(group.basePath)

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
