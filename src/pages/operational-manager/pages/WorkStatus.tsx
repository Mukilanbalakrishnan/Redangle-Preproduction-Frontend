import { useEffect, useState } from 'react'
import { RefreshCw, Search, ExternalLink, CheckCircle2, Clock, AlertTriangle, Upload, Filter } from 'lucide-react'
import axios from 'axios'

type Assignment = {
    id: number
    project_id: string
    project_name: string
    project_type: string
    employee_id: string
    employee_name?: string
    status: string
    upload_link?: string
    upload_notes?: string
    admin_notes?: string
    updated_at?: string
}

type GroupedProject = {
    project_id: string
    project_name: string
    assignments: Assignment[]
    progress: { completed: number; total: number; percent: number }
    overallStatus: string
}

const POST_TYPES = ['Traditional Video Editing', 'Retouch Editing', 'Album Design', 'Candid Video Editing']

const TYPE_LABELS: Record<string, { short: string; color: string; bg: string }> = {
    'Traditional Video Editing': { short: 'Traditional Video', color: '#4f46e5', bg: '#EEF2FF' },
    'Retouch Editing': { short: 'Retouch', color: '#0891b2', bg: '#ECFEFF' },
    'Album Design': { short: 'Album Design', color: '#7c3aed', bg: '#F5F3FF' },
    'Candid Video Editing': { short: 'Candid Video', color: '#db2777', bg: '#FDF2F8' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
    pending: { label: 'Pending', color: '#d97706', bg: '#FFFBEB', border: '#FDE68A', icon: Clock },
    accepted: { label: 'Accepted', color: '#2563eb', bg: '#EFF6FF', border: '#BFDBFE', icon: Clock },
    completed: { label: 'Submitted', color: '#7c3aed', bg: '#F5F3FF', border: '#DDD6FE', icon: Upload },
    approved: { label: 'Approved', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: CheckCircle2 },
    rework: { label: 'Rework', color: '#dc2626', bg: '#FEF2F2', border: '#FECACA', icon: AlertTriangle },
}

const TABS = ['All', 'In Progress', 'Completed', 'Rework'] as const
type Tab = typeof TABS[number]

const getStatusConfig = (status: string) => {
    const key = status.toLowerCase().replace(/\s+/g, '')
    if (key.includes('rework')) return STATUS_CONFIG.rework
    if (key === 'approved') return STATUS_CONFIG.approved
    if (key === 'completed') return STATUS_CONFIG.completed
    if (key === 'accepted') return STATUS_CONFIG.accepted
    return STATUS_CONFIG.pending
}

export default function WorkStatus() {
    const [groups, setGroups] = useState<GroupedProject[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [tab, setTab] = useState<Tab>('All')

    const fetchData = async () => {
        try {
            setLoading(true)
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/employee-projects/all`)
            const all: Assignment[] = (res.data?.data || []).filter(
                (a: Assignment) => POST_TYPES.includes(a.project_type)
            )

            // Group by project_id
            const map = new Map<string, Assignment[]>()
            for (const a of all) {
                const arr = map.get(a.project_id) || []
                arr.push(a)
                map.set(a.project_id, arr)
            }

            const grouped: GroupedProject[] = Array.from(map.entries()).map(([pid, assignments]) => {
                const completed = assignments.filter(
                    a => ['completed', 'approved'].includes(a.status.toLowerCase()) || Boolean(a.upload_link)
                ).length
                const total = assignments.length
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0

                const hasRework = assignments.some(a => a.status.toLowerCase().includes('rework'))
                const allApproved = assignments.length > 0 && assignments.every(a => a.status.toLowerCase() === 'approved')
                const overallStatus = hasRework ? 'rework' : allApproved ? 'completed' : 'in_progress'

                return {
                    project_id: pid,
                    project_name: assignments[0]?.project_name || pid,
                    assignments,
                    progress: { completed, total, percent },
                    overallStatus,
                }
            })

            // Sort: rework first, then in-progress, then completed
            grouped.sort((a, b) => {
                const order: Record<string, number> = { rework: 0, in_progress: 1, completed: 2 }
                return (order[a.overallStatus] ?? 1) - (order[b.overallStatus] ?? 1)
            })

            setGroups(grouped)
        } catch (err) {
            console.error('Failed to load work status', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const filtered = groups.filter(g => {
        // Tab filter
        if (tab === 'In Progress' && g.overallStatus !== 'in_progress') return false
        if (tab === 'Completed' && g.overallStatus !== 'completed') return false
        if (tab === 'Rework' && g.overallStatus !== 'rework') return false

        // Search
        const q = search.trim().toLowerCase()
        if (!q) return true
        return (
            g.project_name.toLowerCase().includes(q) ||
            g.project_id.toLowerCase().includes(q) ||
            g.assignments.some(a => (a.employee_name || '').toLowerCase().includes(q))
        )
    })

    const tabCounts = {
        All: groups.length,
        'In Progress': groups.filter(g => g.overallStatus === 'in_progress').length,
        Completed: groups.filter(g => g.overallStatus === 'completed').length,
        Rework: groups.filter(g => g.overallStatus === 'rework').length,
    }

    const formatDate = (d?: string) => {
        if (!d) return ''
        try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) } catch { return '' }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Work Status</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>
                        Track editor submissions and approval progress across all post-production projects
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 bg-white rounded-xl border border-gray-100"
                    style={{ color: '#6B7280' }}
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Tabs + Search */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 pt-5 pb-4">
                    <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
                        {TABS.map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                                style={{
                                    background: tab === t ? '#fff' : 'transparent',
                                    color: tab === t ? '#7c3aed' : '#6B7280',
                                    boxShadow: tab === t ? '0 1px 3px rgba(124,58,237,0.12)' : 'none',
                                }}
                            >
                                {t}
                                <span
                                    className="ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                                    style={{
                                        background: tab === t ? '#EDE9FE' : '#F3F4F6',
                                        color: tab === t ? '#7c3aed' : '#9CA3AF',
                                    }}
                                >
                                    {tabCounts[t]}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ background: '#F0EFFE', border: '1px solid #E0DFFE' }}>
                        <Search size={14} style={{ color: '#9CA3AF' }} />
                        <input
                            type="text"
                            placeholder="Search by client, project ID, or editor..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-transparent outline-none text-sm flex-1 w-56"
                            style={{ color: '#374151' }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-6">
                    {loading ? (
                        <div className="text-center py-16 text-gray-400 text-sm">Loading work status...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 space-y-2">
                            <Filter size={32} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-semibold">No projects found</p>
                            <p className="text-gray-400 text-sm">
                                {tab !== 'All' ? 'Try switching to a different tab.' : 'No post-production assignments yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filtered.map(group => (
                                <div
                                    key={group.project_id}
                                    className="rounded-2xl border overflow-hidden transition-all hover:shadow-sm"
                                    style={{ borderColor: group.overallStatus === 'rework' ? '#FECACA' : group.overallStatus === 'completed' ? '#A7F3D0' : '#E5E7EB' }}
                                >
                                    {/* Project Header */}
                                    <div className="flex items-center justify-between px-5 py-4" style={{ background: '#FAFAFA' }}>
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <p className="text-sm font-bold" style={{ color: '#111827' }}>{group.project_name}</p>
                                                <p className="text-[11px] font-medium" style={{ color: '#9CA3AF' }}>{group.project_id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-5">
                                            {/* Progress */}
                                            <div className="min-w-[160px]">
                                                <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mb-1">
                                                    <span>{group.progress.completed}/{group.progress.total} editors</span>
                                                    <span>{group.progress.percent}%</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${group.progress.percent}%`,
                                                            background: group.overallStatus === 'rework'
                                                                ? '#ef4444'
                                                                : group.overallStatus === 'completed'
                                                                    ? '#059669'
                                                                    : '#7c3aed',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            {/* Overall badge */}
                                            <span
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                                                style={{
                                                    color: group.overallStatus === 'rework' ? '#dc2626' : group.overallStatus === 'completed' ? '#059669' : '#7c3aed',
                                                    background: group.overallStatus === 'rework' ? '#FEF2F2' : group.overallStatus === 'completed' ? '#ECFDF5' : '#F5F3FF',
                                                    borderColor: group.overallStatus === 'rework' ? '#FECACA' : group.overallStatus === 'completed' ? '#A7F3D0' : '#DDD6FE',
                                                }}
                                            >
                                                {group.overallStatus === 'rework' && <AlertTriangle size={11} />}
                                                {group.overallStatus === 'completed' && <CheckCircle2 size={11} />}
                                                {group.overallStatus === 'in_progress' && <Clock size={11} />}
                                                {group.overallStatus === 'rework' ? 'Needs Rework' : group.overallStatus === 'completed' ? 'All Approved' : 'In Progress'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Editor Rows */}
                                    <div className="divide-y divide-gray-50">
                                        {group.assignments.map(a => {
                                            const typeInfo = TYPE_LABELS[a.project_type] || { short: a.project_type, color: '#6B7280', bg: '#F3F4F6' }
                                            const statusInfo = getStatusConfig(a.status)
                                            const StatusIcon = statusInfo.icon

                                            return (
                                                <div key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        {/* Avatar */}
                                                        <div
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                                                            style={{ background: typeInfo.bg, color: typeInfo.color }}
                                                        >
                                                            {(a.employee_name || a.employee_id || '?').slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {a.employee_name || a.employee_id}
                                                            </p>
                                                            <span
                                                                className="inline-block rounded-md px-2 py-0.5 text-[10px] font-bold mt-0.5"
                                                                style={{ background: typeInfo.bg, color: typeInfo.color }}
                                                            >
                                                                {typeInfo.short}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-5">
                                                        {/* Upload link */}
                                                        {a.upload_link && (
                                                            <a
                                                                href={a.upload_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                                                            >
                                                                <ExternalLink size={11} /> View upload
                                                            </a>
                                                        )}

                                                        {/* Date */}
                                                        {a.updated_at && (
                                                            <span className="text-[11px] text-gray-400 font-medium min-w-[50px] text-right">
                                                                {formatDate(a.updated_at)}
                                                            </span>
                                                        )}

                                                        {/* Status */}
                                                        <span
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border min-w-[90px] justify-center"
                                                            style={{ color: statusInfo.color, background: statusInfo.bg, borderColor: statusInfo.border }}
                                                        >
                                                            <StatusIcon size={11} />
                                                            {statusInfo.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
