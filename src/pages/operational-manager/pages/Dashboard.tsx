import { useState, useEffect } from 'react'
import { ClipboardList, Users, CheckCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
    updated_at?: string
}

type Lead = {
    id: string
    serialNumber?: string
    name: string
    eventDate: string
    shootType: string
}

const POST_TYPES = ['Traditional Video Editing', 'Retouch Editing', 'Album Design', 'Candid Video Editing']

const formatDate = (value?: string | null) => {
    if (!value) return '—'
    try { return new Date(value).toLocaleDateString('en-GB') } catch { return '—' }
}

export default function OperationalManagerDashboard() {
    const navigate = useNavigate()
    const [userName, setUserName] = useState('Operational Manager')
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ total: 0, activeEditors: 0, completed: 0, inProgress: 0, rework: 0 })
    const [recentLeads, setRecentLeads] = useState<{ lead: Lead; assignments: Assignment[]; progress: { completed: number; total: number; percent: number }; status: string }[]>([])

    useEffect(() => {
        try {
            const stored = localStorage.getItem('ra_user')
            if (stored) {
                const user = JSON.parse(stored)
                if (user.name) setUserName(user.name)
            }
        } catch { /* fallback */ }
    }, [])

    const fetchDashboard = async () => {
        try {
            setLoading(true)
            const [leadRes, assignmentRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/dashboard/leads`),
                axios.get(`${import.meta.env.VITE_API_URL}/employee-projects/all`).catch(() => null),
            ])

            // Post-production leads
            const postLeads: Lead[] = (leadRes.data?.data || [])
                .filter((lead: any) => lead.currentPhase === 'post_production')
                .map((lead: any) => ({
                    id: String(lead.id),
                    serialNumber: lead.serialNumber,
                    name: lead.leadName ?? 'Unknown',
                    eventDate: formatDate(lead.eventDate),
                    shootType: lead.eventType ?? '-',
                }))

            // Group assignments by project_id
            const allAssignments: Assignment[] = (assignmentRes?.data?.data || []).filter(
                (a: Assignment) => POST_TYPES.includes(a.project_type)
            )
            const grouped = new Map<string, Assignment[]>()
            for (const a of allAssignments) {
                const arr = grouped.get(a.project_id) || []
                arr.push(a)
                grouped.set(a.project_id, arr)
            }

            // Stats
            const uniqueEditors = new Set(allAssignments.filter(a =>
                !['approved'].includes(a.status.toLowerCase())
            ).map(a => a.employee_id))

            let completedProjects = 0
            let inProgressProjects = 0
            let reworkProjects = 0

            grouped.forEach(assignments => {
                const hasRework = assignments.some(a => a.status.toLowerCase().includes('rework'))
                const allApproved = assignments.length > 0 && assignments.every(a => a.status.toLowerCase() === 'approved')
                if (hasRework) reworkProjects++
                else if (allApproved) completedProjects++
                else inProgressProjects++
            })

            setStats({
                total: postLeads.length,
                activeEditors: uniqueEditors.size,
                completed: completedProjects,
                inProgress: inProgressProjects,
                rework: reworkProjects,
            })

            // Recent leads with progress
            const recent = postLeads.slice(0, 8).map(lead => {
                const assignments = grouped.get(`CRM-${lead.serialNumber || lead.id}`) || []
                const done = assignments.filter(a =>
                    ['completed', 'approved'].includes(a.status.toLowerCase()) || Boolean(a.upload_link)
                ).length
                const total = assignments.length
                const percent = total > 0 ? Math.round((done / total) * 100) : 0
                const hasRework = assignments.some(a => a.status.toLowerCase().includes('rework'))
                const allApproved = assignments.length > 0 && assignments.every(a => a.status.toLowerCase() === 'approved')

                return {
                    lead,
                    assignments,
                    progress: { completed: done, total, percent },
                    status: assignments.length === 0 ? 'unassigned' : hasRework ? 'rework' : allApproved ? 'approved' : 'in_progress',
                }
            })

            setRecentLeads(recent)
        } catch (err) {
            console.error('Dashboard fetch failed', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchDashboard() }, [])

    const cards = [
        { title: 'Total Projects', value: stats.total, icon: ClipboardList, color: '#7c3aed', bg: '#EDE9FE' },
        { title: 'Active Editors', value: stats.activeEditors, icon: Users, color: '#0891b2', bg: '#ECFEFF' },
        { title: 'Completed', value: stats.completed, icon: CheckCircle, color: '#059669', bg: '#D1FAE5' },
        { title: 'In Progress', value: stats.inProgress, icon: Clock, color: '#d97706', bg: '#FEF3C7' },
    ]

    const statusBadge = (status: string) => {
        const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
            unassigned: { label: 'Awaiting editors', color: '#9CA3AF', bg: '#F9FAFB', border: '#E5E7EB' },
            in_progress: { label: 'In Progress', color: '#7c3aed', bg: '#F5F3FF', border: '#DDD6FE' },
            approved: { label: 'All Approved', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
            rework: { label: 'Rework', color: '#dc2626', bg: '#FEF2F2', border: '#FECACA' },
        }
        const s = map[status] || map.in_progress
        return (
            <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
                style={{ color: s.color, background: s.bg, borderColor: s.border }}
            >
                {status === 'approved' && <CheckCircle size={11} />}
                {status === 'rework' && <AlertTriangle size={11} />}
                {status === 'in_progress' && <Clock size={11} />}
                {s.label}
            </span>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Welcome, {userName}</h1>
                    <p className="text-sm text-gray-500 mt-1">Post-production assignment and progress overview</p>
                </div>
                <button
                    onClick={fetchDashboard}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 bg-white rounded-xl border border-gray-100"
                    style={{ color: '#6B7280' }}
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-4 gap-5 mb-6">
                {cards.map(card => (
                    <div key={card.title} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium" style={{ color: '#6B7280' }}>{card.title}</p>
                                <p className="text-2xl font-bold mt-1.5" style={{ color: '#111827' }}>
                                    {loading ? '—' : card.value}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
                                <card.icon size={20} style={{ color: card.color }} />
                            </div>
                        </div>
                        <p className="text-[11px] font-medium mt-2" style={{ color: '#16a34a' }}>
                            ↗ Live
                        </p>
                    </div>
                ))}
            </div>

            {/* Rework Alert */}
            {stats.rework > 0 && (
                <div
                    className="flex items-center gap-3 px-5 py-3.5 rounded-2xl mb-6 border"
                    style={{ background: '#FEF2F2', borderColor: '#FECACA' }}
                >
                    <AlertTriangle size={16} style={{ color: '#dc2626' }} />
                    <p className="text-sm font-medium" style={{ color: '#dc2626' }}>
                        {stats.rework} project{stats.rework !== 1 ? 's' : ''} require rework attention
                    </p>
                    <button
                        onClick={() => navigate('/operational-manager/work-status')}
                        className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: '#dc2626', color: '#fff' }}
                    >
                        View Details
                    </button>
                </div>
            )}

            {/* Recent Activity Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">Recent Post-production Projects</h2>
                        <p className="text-[11px] text-gray-400 mt-0.5">Latest clients in the post-production pipeline</p>
                    </div>
                    <button
                        onClick={() => navigate('/operational-manager/client')}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-50"
                        style={{ color: '#7c3aed' }}
                    >
                        View All →
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
                ) : recentLeads.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                        <p className="text-gray-500 font-semibold">No post-production projects yet</p>
                        <p className="text-gray-400 text-sm">Projects will appear once leads reach the post-production phase.</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr style={{ background: '#FAFAFA' }}>
                                {['Client', 'Event Type', 'Event Date', 'Editors', 'Progress', 'Status'].map(h => (
                                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {recentLeads.map(({ lead, assignments, progress, status }) => (
                                <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors" style={{ borderTop: '1px solid #F3F4F6' }}>
                                    <td className="px-5 py-3">
                                        <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                                        <p className="text-[11px] text-gray-400">{lead.serialNumber || lead.id}</p>
                                    </td>
                                    <td className="px-5 py-3 text-sm" style={{ color: '#111827' }}>{lead.shootType}</td>
                                    <td className="px-5 py-3 text-sm" style={{ color: '#6B7280' }}>{lead.eventDate}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {assignments.length === 0 ? (
                                                <span className="text-xs text-gray-400">—</span>
                                            ) : (
                                                assignments.map(a => (
                                                    <span key={a.id} className="rounded-md bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                                                        {a.project_type.replace(' Editing', '').replace(' Design', '')}
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        {assignments.length > 0 ? (
                                            <div className="min-w-[120px]">
                                                <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 mb-1">
                                                    <span>{progress.completed}/{progress.total}</span>
                                                    <span>{progress.percent}%</span>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${progress.percent}%`,
                                                            background: status === 'rework' ? '#ef4444' : status === 'approved' ? '#059669' : '#7c3aed',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3">{statusBadge(status)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
