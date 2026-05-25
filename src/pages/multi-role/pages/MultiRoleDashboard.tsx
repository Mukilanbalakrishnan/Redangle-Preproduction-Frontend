import { useState, useEffect, useMemo } from 'react'
import { Download, Camera, Video, Briefcase, Plane, Image as ImageIcon, Palette } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

interface AssignedProject {
    lead_employee_id?: number | string
    lead_id?: number
    lead_code?: string
    name?: string
    type?: string
    task_name?: string
    priority?: string
    deadline?: string
    description?: string
    accepted?: boolean
    status?: string
    upload_link?: string
}

const getPriorityStyle = (priority: string) => {
    switch (priority?.toLowerCase()) {
        case 'high': return { background: '#FCE4EC', color: '#C2185B' }
        case 'medium': return { background: '#FFF3E0', color: '#E65100' }
        case 'low': return { background: '#E8F5E9', color: '#2E7D32' }
        default: return { background: '#F3F4F6', color: '#6B7280' }
    }
}

const formatDeadline = (d?: string) => {
    if (!d) return '—'
    try {
        const dt = new Date(d)
        if (isNaN(dt.getTime())) return d
        return dt.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch { return d }
}

// Split "Save the Date Post, Retouch" -> ["Save the Date Post", "Retouch"]
const splitTaskNames = (task_name?: string): string[] =>
    (task_name || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)

type RoleCard = {
    label: string
    taskKey: string          // canonical task label
    matchTokens: string[]    // lowercase tokens that identify this role in task_name
    icon: any
    color: string
    bg: string
    borderColor: string
}

export default function MultiRoleDashboard() {
    const [assigned, setAssigned] = useState<AssignedProject[]>([])
    const [loading, setLoading] = useState(true)
    const currentUser = useMemo(() => {
        const rawUser = localStorage.getItem('ra_user')
        return rawUser ? JSON.parse(rawUser) : null
    }, [])

    useEffect(() => {
        const employeeId = currentUser?.employee_id
        if (!employeeId) { setLoading(false); return }

        Promise.all([
            fetch(`${API_URL}/employee/${employeeId}/assigned-projects`).then(r => r.json()).catch(() => ({ success: false, data: [] })),
            fetch(`${API_URL}/employee-projects/employee/${employeeId}`).then(r => r.json()).catch(() => ({ success: false, data: [] })),
        ])
            .then(([legacyResult, projectResult]) => {
                const legacyAssignments: AssignedProject[] = legacyResult.success ? legacyResult.data || [] : []
                const postProductionAssignments: AssignedProject[] = projectResult.success
                    ? (projectResult.data || []).map((project: any) => ({
                        lead_employee_id: `assigned-${project.id}`,
                        lead_id: Number(String(project.project_id || '').replace(/^CRM-/, '').replace(/\D/g, '')) || undefined,
                        lead_code: String(project.project_id || '').replace(/^CRM-/, '') || project.project_id,
                        name: project.project_name,
                        type: 'Post-production',
                        task_name: project.project_type,
                        priority: '',
                        deadline: project.created_at,
                        description: project.admin_notes || '',
                        flow_stage: 'Post-production',
                        request_source: 'Operational Manager',
                        stage_path: `Post-production -> ${project.project_type}`,
                        accepted: String(project.status || '').toLowerCase() !== 'pending',
                        status: project.status,
                        upload_link: project.upload_link,
                    }))
                    : []

                setAssigned([...postProductionAssignments, ...legacyAssignments])
            })
            .catch(err => console.error('Assigned projects fetch error:', err))
            .finally(() => setLoading(false))
    }, [currentUser?.employee_id])

    // Build the list of role cards the current user should see
    const roleCards: RoleCard[] = useMemo(() => {
        const rawUser = localStorage.getItem('ra_user')
        const user = rawUser ? JSON.parse(rawUser) : null
        const userRoles: string[] = user?.roles || (user?.role ? [user.role] : [])
        const uRoles = userRoles.map(r => r.toLowerCase().trim())

        const cards: RoleCard[] = []

        if (uRoles.includes('photographer')) {
            cards.push({
                label: 'Photographer', taskKey: 'Photography',
                matchTokens: ['photography', 'photographer'],
                icon: Camera, color: '#2563eb', bg: '#EFF6FF', borderColor: '#BFDBFE'
            })
        }
        if (uRoles.includes('videographer')) {
            cards.push({
                label: 'Videographer', taskKey: 'Videography',
                matchTokens: ['videography', 'videographer'],
                icon: Video, color: '#059669', bg: '#ECFDF5', borderColor: '#A7F3D0'
            })
        }
        if (uRoles.includes('drone')) {
            cards.push({
                label: 'Drone', taskKey: 'Drone Coverage',
                matchTokens: ['drone coverage', 'drone'],
                icon: Plane, color: '#0d9488', bg: '#F0FDFA', borderColor: '#99F6E4'
            })
        }
        if (uRoles.some(r => r === 'employee-1' || r.includes('save the date post') || r === 'save the date')) {
            cards.push({
                label: 'Save the Date', taskKey: 'Save the Date',
                matchTokens: ['save the date post', 'save the date'],
                icon: ImageIcon, color: '#d946ef', bg: '#FDF4FF', borderColor: '#F0ABFC'
            })
        }
        if (uRoles.some(r => r === 'employee-2' || r.includes('save the date video') || r.includes('save the video'))) {
            cards.push({
                label: 'Save the Date Video', taskKey: 'Save the Date Video',
                matchTokens: ['save the date video', 'save the video'],
                icon: Video, color: '#8b5cf6', bg: '#F5F3FF', borderColor: '#C4B5FD'
            })
        }
        if (uRoles.some(r => r === 'employee-4' || r.includes('retouch'))) {
            cards.push({
                label: 'Retouch', taskKey: 'Retouch',
                matchTokens: ['retouch'],
                icon: Palette, color: '#ec4899', bg: '#FDF2F8', borderColor: '#FBCFE8'
            })
        }
        if (uRoles.some(r => r.includes('traditional video editor') || r === 'traditional-video-editor')) {
            cards.push({
                label: 'Traditional Video', taskKey: 'Traditional Video Editing',
                matchTokens: ['traditional video editing', 'traditional video'],
                icon: Video, color: '#4f46e5', bg: '#EEF2FF', borderColor: '#C7D2FE'
            })
        }
        if (uRoles.some(r => r.includes('retouch editor') || r === 'retouch-editor' || r.includes('traditional photo editor') || r === 'traditional-photo-editor')) {
            cards.push({
                label: 'Retouch', taskKey: 'Retouch Editing',
                matchTokens: ['retouch editing', 'traditional photo editing', 'traditional photo'],
                icon: Camera, color: '#0891b2', bg: '#ECFEFF', borderColor: '#A5F3FC'
            })
        }
        if (uRoles.some(r => r.includes('album designer') || r === 'album-designer')) {
            cards.push({
                label: 'Album Design', taskKey: 'Album Design',
                matchTokens: ['album design'],
                icon: ImageIcon, color: '#7c3aed', bg: '#F5F3FF', borderColor: '#DDD6FE'
            })
        }
        if (uRoles.some(r => r.includes('candid video editor') || r === 'candid-video-editor')) {
            cards.push({
                label: 'Candid Video', taskKey: 'Candid Video Editing',
                matchTokens: ['candid video editing', 'candid video'],
                icon: Video, color: '#db2777', bg: '#FDF2F8', borderColor: '#FBCFE8'
            })
        }
        // fallback for generic employee roles
        if (cards.length === 0 && uRoles.some(r => r.startsWith('employee'))) {
            cards.push({
                label: 'Employee', taskKey: 'Media Event',
                matchTokens: ['media event'],
                icon: Briefcase, color: '#d97706', bg: '#FFFBEB', borderColor: '#FDE68A'
            })
        }

        return cards
    }, [])

    // Compute per-role counts by splitting each project's task_name into tokens
    // and matching any of the card's matchTokens. This handles the comma-separated
    // task_name (e.g. "Save the Date Post, Retouch") that the backend returns.
    const roleCounts = useMemo(() => {
        const counts: Record<string, { total: number, accepted: number, pending: number }> = {}
        for (const card of roleCards) counts[card.taskKey] = { total: 0, accepted: 0, pending: 0 }

        for (const p of assigned) {
            const tokens = splitTaskNames(p.task_name).map(t => t.toLowerCase())
            if (tokens.length === 0) continue
            for (const card of roleCards) {
                const hit = tokens.some(t => card.matchTokens.some(m => t === m || t.includes(m)))
                if (!hit) continue
                counts[card.taskKey].total++
                if (p.accepted) counts[card.taskKey].accepted++
                else counts[card.taskKey].pending++
            }
        }
        return counts
    }, [assigned, roleCards])

    // Recent projects: de-duplicate by lead_id, sort by created order (API already
    // returns DESC by created_at), limit to 5. Each entry represents a lead the
    // current user is assigned to — across all their roles.
    const recentProjects = useMemo(() => {
        const seen = new Set<number | string>()
        const out: AssignedProject[] = []
        for (const p of assigned) {
            const key = p.lead_id ?? p.lead_code ?? p.lead_employee_id
            if (key == null) continue
            if (seen.has(key)) continue
            seen.add(key)
            out.push(p)
            if (out.length >= 5) break
        }
        return out
    }, [assigned])

    // Upcoming shoots: projects whose deadline (event_date) is today or in the
    // future. If deadline is missing we still surface not-yet-accepted work so
    // the panel doesn't look empty when the only signal is the assignment.
    const upcomingShoots = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const withDeadline = assigned.filter(p => {
            if (!p.deadline) return false
            const d = new Date(p.deadline)
            if (isNaN(d.getTime())) return false
            return d >= today
        })
        if (withDeadline.length > 0) {
            return [...withDeadline]
                .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
                .slice(0, 5)
        }
        // Fallback: show pending (not-yet-accepted) assignments when no deadlines are set
        return assigned.filter(p => !p.accepted).slice(0, 5)
    }, [assigned])

    const emptyAssignmentMessage = currentUser?.employee_id
        ? `No projects are assigned to ${currentUser?.name || 'this user'} (${currentUser.employee_id}). This dashboard only shows work saved against the logged-in employee id.`
        : 'No employee id was found for the logged-in user, so assigned projects cannot be loaded.'

    return (
        <div>
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h1 className="text-lg font-bold text-gray-900">Multi-Role Dashboard</h1>
                    <p className="text-sm text-gray-500">Aggregated overview across all your roles</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow transition-all">
                    <Download size={14} /> Download report
                </button>
            </div>

            {/* Role summary cards — with per-role lead counts */}
            <div className={`grid gap-4 mb-6 ${roleCards.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {roleCards.map(({ label, taskKey, icon: Icon, color, bg, borderColor }) => {
                    const rc = roleCounts[taskKey] || { total: 0, accepted: 0, pending: 0 }
                    return (
                        <div key={label} className="bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow"
                            style={{ borderColor }}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                                    <Icon size={20} style={{ color }} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                                    <p className="text-xs text-gray-400">Active role</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                                    <p className="text-lg font-bold" style={{ color }}>{loading ? '...' : rc.total}</p>
                                    <p className="text-[10px] text-gray-400 font-medium">Assigned</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-2.5 text-center">
                                    <p className="text-lg font-bold text-green-700">{loading ? '...' : rc.accepted}</p>
                                    <p className="text-[10px] text-gray-400 font-medium">Accepted</p>
                                </div>
                                <div className="bg-yellow-50 rounded-lg p-2.5 text-center">
                                    <p className="text-lg font-bold text-yellow-700">{loading ? '...' : rc.pending}</p>
                                    <p className="text-[10px] text-gray-400 font-medium">Pending</p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Recent Projects & Upcoming */}
            <div className="grid grid-cols-2 gap-5">
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <p className="text-sm font-semibold mb-4 text-gray-900">Recent Projects</p>
                    <div className="flex flex-col gap-3">
                        {loading ? (
                            <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
                        ) : recentProjects.length === 0 ? (
                            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center">
                                <p className="text-sm font-semibold text-amber-800">No recent projects</p>
                                <p className="mt-1 text-xs leading-5 text-amber-700">{emptyAssignmentMessage}</p>
                            </div>
                        ) : (
                            recentProjects.map((p, i) => (
                                <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-gray-50 bg-gray-50/50">
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                            {p.name || '—'}{p.task_name ? ` — ${p.task_name}` : ''}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {p.lead_code || (p.lead_id ? `EXT-${p.lead_id}` : '')}
                                            {p.deadline ? ` • ${formatDeadline(p.deadline)}` : ''}
                                        </p>
                                    </div>
                                    {p.priority && (
                                        <span className="text-[11px] font-semibold px-2 py-1 rounded-full shrink-0 ml-2"
                                            style={getPriorityStyle(p.priority)}>
                                            {p.priority}
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <p className="text-sm font-semibold mb-4 text-gray-900">Upcoming Shoots</p>
                    <div className="flex flex-col gap-3">
                        {loading ? (
                            <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
                        ) : upcomingShoots.length === 0 ? (
                            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center">
                                <p className="text-sm font-semibold text-amber-800">No upcoming shoots</p>
                                <p className="mt-1 text-xs leading-5 text-amber-700">{emptyAssignmentMessage}</p>
                            </div>
                        ) : (
                            upcomingShoots.map((shoot, i) => (
                                <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-gray-50 bg-gray-50/50">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600 font-bold text-sm shrink-0">
                                            {(shoot.name || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-medium text-gray-900 truncate">{shoot.name || '—'}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                {shoot.type || ''}{shoot.deadline ? ` • ${formatDeadline(shoot.deadline)}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold text-purple-600 shrink-0 ml-2">
                                        {shoot.lead_code || (shoot.lead_id ? `EXT-${shoot.lead_id}` : '')}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
