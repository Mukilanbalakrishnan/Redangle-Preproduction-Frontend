import { useState, useEffect, useMemo } from 'react'
import { Eye, RefreshCw, Search } from 'lucide-react'
import ProjectDetails, { type ProjectFull } from './ProjectDetails'
import { getEmployeeProjects } from '../../../api/employee.api'

function statusStyle(status: string) {
    const s = status.toLowerCase()
    if (s === 'approved') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    if (s === 'completed') return 'bg-teal-100 text-teal-700 border-teal-200'
    if (s === 'rework') return 'bg-amber-100 text-amber-700 border-amber-200'
    if (s === 'accepted') return 'bg-indigo-100 text-indigo-700 border-indigo-200'
    if (s === 'pending') return 'bg-blue-100 text-blue-700 border-blue-200'
    return 'bg-gray-100 text-gray-600 border-gray-200'
}

function statusLabel(status: string) {
    const s = status.toLowerCase()
    if (s === 'approved') return 'Approved ✓'
    if (s === 'completed') return 'Submitted'
    if (s === 'rework') return 'Re-upload'
    if (s === 'accepted') return 'Accepted'
    if (s === 'pending') return 'Pending Action'
    return status
}

export default function AssignedProjects() {
    const [view, setView] = useState<'list' | 'details'>('list')
    const [selectedProject, setSelectedProject] = useState<ProjectFull | null>(null)
    const [projects, setProjects] = useState<ProjectFull[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    const getEmployeeId = () => {
        try {
            const user = JSON.parse(localStorage.getItem('ra_user') || '{}');
            return user.employee_id || localStorage.getItem('employee_id') || '';
        } catch {
            return localStorage.getItem('employee_id') || '';
        }
    };
    const employeeId = getEmployeeId();

    useEffect(() => {
        if (!employeeId) { setLoading(false); return }
        getEmployeeProjects(employeeId)
            .then(res => setProjects(res.data.data || []))
            .catch(() => setError('Failed to load projects. Please try again.'))
            .finally(() => setLoading(false))
    }, [employeeId])

    const filteredProjects = useMemo(() => {
        const q = searchTerm.trim().toLowerCase()
        if (!q) return projects
        return projects.filter(project =>
            project.project_id.toLowerCase().includes(q) ||
            project.project_name.toLowerCase().includes(q) ||
            project.project_type.toLowerCase().includes(q) ||
            project.status.toLowerCase().includes(q)
        )
    }, [projects, searchTerm])

    if (view === 'details' && selectedProject) {
        return (
            <ProjectDetails
                data={selectedProject}
                onBack={() => setView('list')}
            />
        )
    }

    return (
        <div className="max-w-6xl">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Assigned Projects</h1>
                    <p className="text-sm text-gray-500 mt-1">View and open all projects assigned to you</p>
                </div>
                <button
                    onClick={() => {
                        setLoading(true)
                        getEmployeeProjects(employeeId)
                            .then(res => setProjects(res.data.data || []))
                            .finally(() => setLoading(false))
                    }}
                    className="crm-card flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 bg-white text-gray-600"
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            <div className="flex gap-4 mb-6 relative">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by project, client, type, or status..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-purple-50 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-purple-200 transition-all placeholder-gray-500"
                    />
                </div>
            </div>

            <div className="crm-card bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-900">All Assigned Projects</h2>
                    {!loading && (
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                            {filteredProjects.length} Project{filteredProjects.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-16 text-gray-400 text-sm">
                        Loading your projects...
                    </div>
                ) : error ? (
                    <div className="text-center py-16 text-red-400 text-sm">{error}</div>
                ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-16 space-y-2">
                        <p className="text-gray-500 font-semibold">No projects assigned yet</p>
                        <p className="text-gray-400 text-sm">
                            You'll see projects here once an admin, CRM, or event coordinator
                            assigns you via the Assign Editor page.
                        </p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-6 py-4 text-xs font-bold text-indigo-600">Project ID</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-indigo-600">Client Name</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-indigo-600">Project Type</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-indigo-600">Assigned Date</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-indigo-600">Status</th>
                                <th className="text-right px-6 py-4 text-xs font-bold text-indigo-600">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.map(project => (
                                <tr key={project.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-indigo-600">{project.project_id}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{project.project_name}</td>
                                    <td className="px-6 py-4 text-xs font-medium text-gray-500">{project.project_type}</td>
                                    <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                                        {new Date(project.created_at).toLocaleDateString('en-GB', {
                                            day: '2-digit', month: 'short', year: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${statusStyle(project.status)}`}>
                                            {statusLabel(project.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => {
                                                setSelectedProject(project)
                                                setView('details')
                                            }}
                                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                        >
                                            <Eye size={14} /> View
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
