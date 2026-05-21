import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Briefcase, CheckCircle, Clock, Folder, RefreshCw } from 'lucide-react'
import { getEmployeeProjects } from '../../../api/employee.api'
import { getEmployeeRole, getRoleConfig } from '../employeeRoleConfig'

type Project = {
    id: number
    project_id: string
    project_name: string
    project_type: string
    employee_id: string
    status: string
    upload_link?: string
    admin_notes?: string
    created_at: string
}

const editorRolePaths: Record<string, { assigned: string; works: string }> = {
    'traditional-video-editor': {
        assigned: '/employee/traditional-video/assigned-client',
        works: '/employee/traditional-video/works',
    },
    'retouch-editor': {
        assigned: '/employee/traditional-photo/assigned-client',
        works: '/employee/traditional-photo/works',
    },
    'album-designer': {
        assigned: '/employee/album-design/assigned-client',
        works: '/employee/album-design/works',
    },
    'candid-video-editor': {
        assigned: '/employee/candid-video/assigned-client',
        works: '/employee/candid-video/works',
    },
}

const getEmployeeId = () => {
    try {
        const user = JSON.parse(localStorage.getItem('ra_user') || '{}')
        return user.employee_id || localStorage.getItem('employee_id') || ''
    } catch {
        return localStorage.getItem('employee_id') || ''
    }
}

const statusBadge = (status: string) => {
    const normalized = status.toLowerCase()
    if (normalized === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    if (normalized === 'completed') return 'bg-indigo-50 text-indigo-700 border-indigo-100'
    if (normalized === 'rework') return 'bg-red-50 text-red-700 border-red-100'
    if (normalized === 'accepted') return 'bg-green-50 text-green-700 border-green-100'
    return 'bg-amber-50 text-amber-700 border-amber-100'
}

const statusLabel = (status: string) => {
    const normalized = status.toLowerCase()
    if (normalized === 'approved') return 'CRM Verified'
    if (normalized === 'completed') return 'Submitted to CRM'
    if (normalized === 'rework') return 'Re-upload Needed'
    if (normalized === 'accepted') return 'Accepted'
    return 'Pending Acceptance'
}

const formatDate = (value?: string) => {
    if (!value) return '-'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
}

function DashboardStat({
    title,
    value,
    subtitle,
    icon,
}: {
    title: string
    value: string
    subtitle: string
    icon: React.ReactNode
}) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{title}</p>
                    <p className="mt-2 text-2xl font-black text-gray-900">{value}</p>
                    <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    {icon}
                </div>
            </div>
        </div>
    )
}

export default function Dashboard() {
    const navigate = useNavigate()
    const role = getEmployeeRole()
    const config = getRoleConfig(role)
    const rolePaths = editorRolePaths[role]
    const employeeId = getEmployeeId()

    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!employeeId) {
            setLoading(false)
            return
        }

        getEmployeeProjects(employeeId)
            .then(res => setProjects(res.data.data || []))
            .catch(err => console.error('Dashboard fetch error', err))
            .finally(() => setLoading(false))
    }, [employeeId])

    const stats = useMemo(() => {
        const completed = projects.filter(project => ['completed', 'approved'].includes(project.status.toLowerCase())).length
        return {
            assigned: projects.length,
            pending: projects.filter(project => project.status.toLowerCase() === 'pending').length,
            active: projects.filter(project => ['accepted', 'rework'].includes(project.status.toLowerCase())).length,
            completed,
        }
    }, [projects])

    const recentProjects = useMemo(() => {
        return [...projects]
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            .slice(0, 5)
    }, [projects])

    const defaultListPath = rolePaths?.assigned || '/employee/assigned-projects'
    const worksPath = rolePaths?.works || '/employee/my-work'

    return (
        <div>
            <div className="mb-5 flex items-start justify-between">
                <div>
                    <h1 className="text-lg font-bold text-gray-900">{config.roleLabel} Dashboard</h1>
                    <p className="text-sm text-gray-500">Overview of your assigned clients and completed works</p>
                </div>
                {rolePaths && (
                    <button
                        onClick={() => navigate(defaultListPath)}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:text-purple-700 hover:shadow"
                    >
                        Open Assigned Client <ArrowRight size={15} />
                    </button>
                )}
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <DashboardStat
                    title="Assigned Clients"
                    value={loading ? '-' : String(stats.assigned)}
                    subtitle="Total assignments"
                    icon={<Folder size={20} />}
                />
                <DashboardStat
                    title="Pending"
                    value={loading ? '-' : String(stats.pending)}
                    subtitle="Awaiting acceptance"
                    icon={<Clock size={20} />}
                />
                <DashboardStat
                    title="Active"
                    value={loading ? '-' : String(stats.active)}
                    subtitle="Accepted or rework"
                    icon={<RefreshCw size={20} />}
                />
                <DashboardStat
                    title="Works"
                    value={loading ? '-' : String(stats.completed)}
                    subtitle="Submitted or verified"
                    icon={<CheckCircle size={20} />}
                />
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                        <Briefcase size={16} className="text-gray-500" />
                        Recent Assignments
                    </h2>
                    <div className="flex items-center gap-2">
                        {rolePaths && (
                            <button
                                onClick={() => navigate(worksPath)}
                                className="text-xs font-semibold text-gray-500 transition-colors hover:text-purple-700"
                            >
                                Works
                            </button>
                        )}
                        <button
                            onClick={() => navigate(defaultListPath)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700"
                        >
                            View All <ArrowRight size={13} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p className="py-8 text-center text-sm text-gray-400">Loading assignments...</p>
                ) : recentProjects.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-400">No assignments found.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-100 bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Lead Code</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Client</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Task</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Assigned</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentProjects.map(project => (
                                <tr key={project.id} className="hover:bg-gray-50/60">
                                    <td className="px-4 py-3 font-semibold text-purple-600">{project.project_id}</td>
                                    <td className="px-4 py-3 text-gray-900">{project.project_name}</td>
                                    <td className="px-4 py-3 text-gray-600">{project.project_type}</td>
                                    <td className="px-4 py-3 text-gray-600">{formatDate(project.created_at)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadge(project.status)}`}>
                                            {statusLabel(project.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => navigate(['completed', 'approved'].includes(project.status.toLowerCase()) ? worksPath : defaultListPath)}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 transition-colors hover:bg-purple-100"
                                        >
                                            View <ArrowRight size={13} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
