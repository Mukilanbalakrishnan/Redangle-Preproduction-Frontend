import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, Users, CalendarCheck, Briefcase,
    Mail, Database, LogOut, Bell, ShieldCheck,
    Camera, Wand2, PartyPopper, ChevronDown
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
    { to: '/crm/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/crm/client', icon: Users, label: 'Client' },
    { to: '/crm/work-tracking', icon: Briefcase, label: 'Work Tracking' },
    { to: '/crm/client-delivery', icon: Mail, label: 'Client delivery' },
    { to: '/crm/attendance', icon: CalendarCheck, label: 'Attendance' },
]

const splitRoleConfigs: Record<string, { label: string; stageLabel: string; items: LeafItem[] }> = {
    '/pre-production-crm': {
        label: 'Pre-production CRM',
        stageLabel: 'Pre-production',
        items: [
            { to: '/pre-production-crm/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/pre-production-crm/work-tracking', icon: Briefcase, label: 'Work Tracking' },
            { to: '/pre-production-crm/client', icon: Users, label: 'Assign Client' },
            { to: '/pre-production-crm/raw-data', icon: Database, label: 'Raw Data' },
            { to: '/pre-production-crm/qc-check', icon: ShieldCheck, label: 'QC Checking' },
            { to: '/pre-production-crm/attendance', icon: CalendarCheck, label: 'Attendance Tracking' },
            { to: '/pre-production-crm/notifications', icon: Bell, label: 'Notification' },
        ],
    },
    '/post-production-crm': {
        label: 'Post-production CRM',
        stageLabel: 'Post-production',
        items: [
            { to: '/post-production-crm/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/post-production-crm/work-tracking', icon: Briefcase, label: 'Work Tracking' },
            { to: '/post-production-crm/client', icon: Users, label: 'Assign Client' },
            { to: '/post-production-crm/event-raw-data', icon: Database, label: 'Event Raw Data' },
            { to: '/post-production-crm/qc-check', icon: ShieldCheck, label: 'QC Checking' },
            { to: '/post-production-crm/attendance', icon: CalendarCheck, label: 'Attendance Tracking' },
            { to: '/post-production-crm/notifications', icon: Bell, label: 'Notification' },
        ],
    },
}

const getSplitRoleConfig = (pathname: string) => {
    const base = Object.keys(splitRoleConfigs).find(path => pathname.startsWith(path))
    return base ? { base, ...splitRoleConfigs[base] } : null
}

const groups: GroupItem[] = [
    {
        key: 'pre-production',
        icon: Camera,
        label: 'Pre-production',
        color: '#2563eb',
        basePath: '/crm/pre-production',
        children: [
            { to: '/crm/pre-production/client', icon: Users, label: 'Client' },
            { to: '/crm/pre-production/raw-data', icon: Database, label: 'Raw Data' },
            { to: '/crm/pre-production/qc-check', icon: ShieldCheck, label: 'QC Checking' },
        ],
    },
    {
        key: 'post-production',
        icon: Wand2,
        label: 'Post-production',
        color: '#d97706',
        basePath: '/crm/post-production',
        children: [
            { to: '/crm/post-production/qc-check', icon: ShieldCheck, label: 'QC Checking' },
        ],
    },
    {
        key: 'event',
        icon: PartyPopper,
        label: 'Event',
        color: '#059669',
        basePath: '/crm/event',
        children: [
            { to: '/crm/event/raw-data', icon: Database, label: 'Raw Data' },
            { to: '/crm/event/qc-check', icon: ShieldCheck, label: 'QC Checking' },
        ],
    },
]

const bottomItems: LeafItem[] = [
    { to: '/crm/notifications', icon: Bell, label: 'Notifications' },
]

export default function Sidebar() {
    const navigate = useNavigate()
    const location = useLocation()
    const splitConfig = getSplitRoleConfig(location.pathname)

    // Default each group's expanded state to true if the active route lives in it.
    const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {}
        for (const g of groups) {
            initial[g.key] = location.pathname.startsWith(g.basePath)
        }
        if (!Object.values(initial).some(Boolean)) {
            for (const g of groups) {
                initial[g.key] = true
            }
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
                : 'gap-3 px-4 py-3 text-sm font-semibold mb-1'
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

    if (splitConfig) {
        return (
            <aside
                className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col overflow-y-auto border-r border-purple-100 bg-[#F8F6FF]"
            >
                <div className="px-5 pt-6 pb-4 flex-shrink-0 cursor-pointer" onClick={() => navigate(`${splitConfig.base}/dashboard`)}>
                    <div className="flex items-center gap-2">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #5B5FC7)' }}
                        >
                            <span style={{ fontStyle: 'italic', fontWeight: 900 }}>ra</span>
                        </div>
                        <div>
                            <div className="font-extrabold text-xs tracking-widest uppercase text-gray-900">Red Angle</div>
                            <div className="text-[10px] tracking-widest uppercase text-gray-400">{splitConfig.stageLabel}</div>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-purple-200/50 mx-4 mb-2" />

                <nav className="flex-1 px-3 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    {splitConfig.items.map(item => renderLeaf(item))}
                </nav>

                <div className="px-3 pb-6 pt-2 flex-shrink-0">
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
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        )
    }

    return (
        <aside
            className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col overflow-y-auto border-r border-purple-100 bg-[#F8F6FF]"
        >
            {/* Logo */}
            <div className="px-5 pt-6 pb-4 flex-shrink-0 cursor-pointer" onClick={() => navigate('/crm/dashboard')}>
                <div className="flex items-center gap-2">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #5B5FC7)' }}
                    >
                        <span style={{ fontStyle: 'italic', fontWeight: 900 }}>ra</span>
                    </div>
                    <div>
                        <div className="font-extrabold text-xs tracking-widest uppercase text-gray-900">Red Angle</div>
                        <div className="text-[10px] tracking-widest uppercase text-gray-400">CRM</div>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-purple-200/50 mx-4 mb-2" />

            {/* Navigation — scrollable */}
            <nav className="flex-1 px-3 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
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

                <div className="h-px bg-purple-200/50 mx-1 my-3" />

                {bottomItems.map(item => renderLeaf(item))}
            </nav>

            {/* Logout — always pinned at bottom */}
            <div className="px-3 pb-6 pt-2 flex-shrink-0">
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
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    )
}
