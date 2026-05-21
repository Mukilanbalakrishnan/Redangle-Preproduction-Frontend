import { useEffect, useMemo, useState } from 'react'
import {
    ArrowLeft,
    Briefcase,
    CheckCircle,
    ChevronRight,
    Clock,
    Link2,
    Pause,
    Play,
    RefreshCw,
    Search,
    UploadCloud,
    Video,
    type LucideIcon,
} from 'lucide-react'
import { getEmployeeProjectsByType, submitProjectLink } from '../../../api/employee.api'

type AssignedProject = {
    id: number
    project_id: string
    project_name: string
    project_type: string
    status: string
    created_at: string
    upload_link?: string
    admin_notes?: string
}

type WorkspaceProps = {
    title: string
    subtitle: string
    projectType: string
    defaultRequirements: string
    submitLabel: string
    toolLabel?: string
    icon?: LucideIcon
}

const statusOrder = ['pending', 'accepted', 'completed', 'approved']

function statusBadge(status: string) {
    const s = status.toLowerCase()
    if (s === 'approved') return 'bg-emerald-100 text-emerald-700'
    if (s === 'completed') return 'bg-teal-100 text-teal-700'
    if (s === 'rework') return 'bg-amber-100 text-amber-700'
    if (s === 'accepted') return 'bg-indigo-100 text-indigo-700'
    return 'bg-blue-100 text-blue-700'
}

function statusLabel(status: string) {
    const s = status.toLowerCase()
    if (s === 'approved') return 'Approved'
    if (s === 'completed') return 'Submitted'
    if (s === 'rework') return 'Re-upload Needed'
    if (s === 'accepted') return 'Accepted'
    if (s === 'pending') return 'Pending Action'
    return status
}

function progressIndex(status: string) {
    const normalized = status.toLowerCase()
    if (normalized === 'rework') return 1
    const index = statusOrder.indexOf(normalized)
    return index >= 0 ? index : 0
}

function getEmployeeId() {
    try {
        const user = JSON.parse(localStorage.getItem('ra_user') || '{}')
        return user.employee_id || localStorage.getItem('employee_id') || ''
    } catch {
        return localStorage.getItem('employee_id') || ''
    }
}

function ProgressTracker({ project }: { project: AssignedProject }) {
    const currentIndex = progressIndex(project.status)
    const steps = [
        { key: 'pending', label: 'Assigned' },
        { key: 'accepted', label: 'Accepted' },
        { key: 'completed', label: 'Submitted' },
        { key: 'approved', label: 'Approved' },
    ]

    return (
        <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <CheckCircle size={16} className="text-purple-500" />
                        Progress Tracking
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                        Track this deliverable from assignment through approval.
                    </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-[11px] font-bold ${statusBadge(project.status)}`}>
                    {project.status.toLowerCase() === 'rework' ? <RefreshCw size={12} /> : <Clock size={12} />}
                    {statusLabel(project.status)}
                </span>
            </div>

            <div className="mb-5 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                    className="h-full rounded-full bg-purple-600 transition-all"
                    style={{ width: `${Math.round((currentIndex / (steps.length - 1)) * 100)}%` }}
                />
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {steps.map((step, index) => {
                    const done = index <= currentIndex
                    const isCurrent = index === currentIndex
                    return (
                        <div
                            key={step.key}
                            className={[
                                'rounded-xl border p-4',
                                done ? 'border-purple-200 bg-purple-50' : 'border-gray-100 bg-gray-50',
                            ].join(' ')}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <p className={`text-xs font-bold ${done ? 'text-purple-700' : 'text-gray-500'}`}>
                                    {step.label}
                                </p>
                                <span className={`h-2.5 w-2.5 rounded-full ${done ? 'bg-purple-600' : 'bg-gray-300'}`} />
                            </div>
                            <p className="mt-2 text-[11px] font-medium text-gray-500">
                                {isCurrent ? 'Current step' : done ? 'Completed' : 'Pending'}
                            </p>
                        </div>
                    )
                })}
            </div>

            {project.status.toLowerCase() === 'rework' && project.admin_notes && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="mb-1 text-xs font-bold text-amber-700">Re-upload Request</p>
                    <p className="text-xs text-amber-800">{project.admin_notes}</p>
                </div>
            )}
        </div>
    )
}

export default function EmployeeProjectWorkspace({
    title,
    subtitle,
    projectType,
    defaultRequirements,
    submitLabel,
    toolLabel = 'Go to DaVinci',
    icon: Icon = Briefcase,
}: WorkspaceProps) {
    const employeeId = getEmployeeId()
    const [assignedProjects, setAssignedProjects] = useState<AssignedProject[]>([])
    const [selectedProject, setSelectedProject] = useState<AssignedProject | null>(null)
    const [loadingProjects, setLoadingProjects] = useState(true)
    const [uploadLink, setUploadLink] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [submittingUpload, setSubmittingUpload] = useState(false)

    const fetchProjects = () => {
        if (!employeeId) {
            setLoadingProjects(false)
            return
        }

        setLoadingProjects(true)
        getEmployeeProjectsByType(employeeId, projectType)
            .then(res => {
                const projects = res.data.data || []
                setAssignedProjects(projects)
                if (selectedProject) {
                    const updated = projects.find((project: AssignedProject) => project.id === selectedProject.id)
                    setSelectedProject(updated || null)
                    setUploadLink(updated?.upload_link || '')
                }
            })
            .catch(err => console.error(`${projectType} projects fetch error`, err))
            .finally(() => setLoadingProjects(false))
    }

    useEffect(() => {
        fetchProjects()
    }, [employeeId, projectType])

    const handleSelectProject = (project: AssignedProject) => {
        setSelectedProject(project)
        setUploadLink(project.upload_link || '')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSubmitUpload = async () => {
        if (!selectedProject || !uploadLink.trim() || submittingUpload) return

        const nextLink = uploadLink.trim()

        try {
            setSubmittingUpload(true)
            const response = await submitProjectLink(selectedProject.id, nextLink)
            const updatedProject = {
                ...selectedProject,
                ...(response.data?.data || {}),
                status: 'Completed',
                upload_link: nextLink,
            }

            setSelectedProject(updatedProject)
            setAssignedProjects(previous =>
                previous.map(project => project.id === selectedProject.id ? updatedProject : project)
            )
            alert(`${submitLabel} submitted successfully.`)
        } catch (error) {
            console.error(`${projectType} upload submit error`, error)
            alert('Failed to submit upload link. Please try again.')
        } finally {
            setSubmittingUpload(false)
        }
    }

    const filteredProjects = useMemo(() => {
        const q = searchTerm.trim().toLowerCase()
        if (!q) return assignedProjects
        return assignedProjects.filter(project =>
            project.project_id.toLowerCase().includes(q) ||
            project.project_name.toLowerCase().includes(q) ||
            project.status.toLowerCase().includes(q)
        )
    }, [assignedProjects, searchTerm])

    return (
        <div className="max-w-6xl animate-in zoom-in-95 duration-300 pb-20">
            {!selectedProject ? (
                <>
                    <div className="mb-6">
                        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                    </div>

                    <div className="flex gap-4 mb-6 relative">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search by project, client, or status..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-purple-50 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-purple-200 transition-all placeholder-gray-500"
                            />
                        </div>
                    </div>

                    <div className="crm-card bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Icon size={18} className="text-purple-500" />
                                My Assigned Works
                            </h2>
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                                {filteredProjects.length} Project{filteredProjects.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="px-6 py-4 text-xs font-bold text-indigo-600">Project ID</th>
                                        <th className="px-6 py-4 text-xs font-bold text-indigo-600">Client Name</th>
                                        <th className="px-6 py-4 text-xs font-bold text-indigo-600">Assigned Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-indigo-600">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-indigo-600 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingProjects ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-gray-400">
                                                Loading your projects...
                                            </td>
                                        </tr>
                                    ) : filteredProjects.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="bg-gray-50 p-4 rounded-full mb-3">
                                                        <Briefcase size={24} className="text-gray-300" />
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-600">No assigned projects found</p>
                                                    <p className="text-xs text-gray-400 mt-1">New assignments will appear here immediately, including pending ones.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProjects.map(project => {
                                            const date = new Date(project.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                            return (
                                                <tr key={project.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-bold text-indigo-600">
                                                        {project.project_id}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-bold text-gray-800">{project.project_name}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                                                        {date}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${statusBadge(project.status)}`}>
                                                            {statusLabel(project.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleSelectProject(project)}
                                                            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ml-auto bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                                        >
                                                            View <ChevronRight size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="mb-6">
                        <button
                            onClick={() => setSelectedProject(null)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors text-gray-700 mb-4"
                        >
                            <ArrowLeft size={16} /> Back to Works
                        </button>
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                Workspace: <span className="text-purple-600">{selectedProject.project_name}</span>
                            </h2>
                            {selectedProject.status === 'Rework' && selectedProject.admin_notes && (
                                <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                                    <span>Note:</span> {selectedProject.admin_notes}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 mb-5 flex items-center gap-2">
                                    <Clock size={16} className="text-purple-500" />
                                    Project & Client Details
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Client / Couple Name</p>
                                        <p className="text-sm font-bold text-gray-900">{selectedProject.project_name}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Assigned On</p>
                                            <p className="text-[13px] font-bold text-gray-800">
                                                {new Date(selectedProject.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Project ID</p>
                                            <p className="text-[13px] font-bold text-purple-600">{selectedProject.project_id}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 mb-4">Client Requirements</h2>
                                <div className="bg-purple-50/50 p-4 rounded-xl mb-6">
                                    <p className="text-[13px] text-gray-700 font-medium leading-relaxed">
                                        {selectedProject.admin_notes || defaultRequirements}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mt-auto">
                                <button className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-[#2a2a2a] text-white px-4 py-3 rounded-lg text-xs font-bold hover:bg-black transition-colors shadow-sm">
                                    <Video size={16} /> {toolLabel}
                                </button>

                                <button className="flex-1 min-w-[100px] flex items-center justify-center gap-2 border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors shadow-sm">
                                    <Play size={16} /> Resume
                                </button>
                                <button className="flex-1 min-w-[100px] flex items-center justify-center gap-2 border border-amber-200 bg-amber-50 text-amber-700 px-4 py-3 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors shadow-sm">
                                    <Pause size={16} /> Pause
                                </button>
                            </div>
                        </div>
                    </div>

                    <ProgressTracker project={selectedProject} />

                    <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-xl">
                                <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <UploadCloud size={16} className="text-purple-500" />
                                    Upload Junction
                                </h2>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Paste the Google Drive or cloud link after finishing this deliverable. Submitting marks the work as completed for manager review.
                                </p>
                            </div>
                        </div>

                        {selectedProject.upload_link && (
                            <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                                <p className="mb-2 text-xs font-bold text-emerald-700">Submitted Link</p>
                                <a
                                    href={selectedProject.upload_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 truncate text-sm font-semibold text-emerald-700 underline underline-offset-2"
                                >
                                    <Link2 size={14} />
                                    {selectedProject.upload_link}
                                </a>
                            </div>
                        )}

                        <div className="mt-5 flex flex-col gap-3 md:flex-row">
                            <input
                                type="url"
                                value={uploadLink}
                                onChange={event => setUploadLink(event.target.value)}
                                placeholder="https://drive.google.com/..."
                                className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-purple-500"
                            />
                            <button
                                onClick={handleSubmitUpload}
                                disabled={!uploadLink.trim() || submittingUpload}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submittingUpload ? (
                                    <>
                                        <RefreshCw size={15} className="animate-spin" />
                                        Submitting...
                                    </>
                                ) : selectedProject.status === 'Rework' || selectedProject.upload_link ? (
                                    <>
                                        <RefreshCw size={15} />
                                        Re-submit Work
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud size={15} />
                                        Submit Work
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
