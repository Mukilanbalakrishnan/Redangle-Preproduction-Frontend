import { useState, useEffect } from 'react'
import { Briefcase, ChevronRight, ArrowLeft, Video, Play, Pause, Clock, Link2, CheckCircle, RefreshCw, UploadCloud } from 'lucide-react'
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
    if (s === 'approved') return 'Approved ✓'
    if (s === 'completed') return 'Submitted'
    if (s === 'rework') return 'Re-upload Needed'
    if (s === 'accepted') return 'Accepted'
    if (s === 'pending') return 'Pending Action'
    return status
}

export default function SaveTheVideo() {
    const [assignedProjects, setAssignedProjects] = useState<AssignedProject[]>([])
    const [selectedProject, setSelectedProject] = useState<AssignedProject | null>(null)
    const [loadingProjects, setLoadingProjects] = useState(true)
    const [uploadLink, setUploadLink] = useState('')
    const [submittingUpload, setSubmittingUpload] = useState(false)

    const getEmployeeId = () => {
        try {
            const user = JSON.parse(localStorage.getItem('ra_user') || '{}');
            return user.employee_id || localStorage.getItem('employee_id') || '';
        } catch {
            return localStorage.getItem('employee_id') || '';
        }
    };
    const employeeId = getEmployeeId();

    const fetchProjects = () => {
        setLoadingProjects(true)
        getEmployeeProjectsByType(employeeId, 'Save the Video')
            .then(res => {
                const filtered = res.data.data || []
                setAssignedProjects(filtered)
                if (selectedProject) {
                    const stillExists = filtered.find((p: AssignedProject) => p.id === selectedProject.id)
                    if (!stillExists) setSelectedProject(null)
                }
            })
            .catch(err => console.error('SaveTheVideo projects fetch error', err))
            .finally(() => setLoadingProjects(false))
    }

    useEffect(() => {
        if (employeeId) fetchProjects()
    }, [employeeId])

    const handleSelectProject = (proj: AssignedProject) => {
        setSelectedProject(proj)
        setUploadLink(proj.upload_link || '')
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
                previous.map(project =>
                    project.id === selectedProject.id ? updatedProject : project
                )
            )
            alert('Save the Video deliverable submitted successfully.')
        } catch (error) {
            console.error('SaveTheVideo upload submit error', error)
            alert('Failed to submit upload link. Please try again.')
        } finally {
            setSubmittingUpload(false)
        }
    }

    return (
        <div className="space-y-6 max-w-7xl pb-20 animate-in zoom-in-95 duration-300">
            {!selectedProject ? (
                <>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1 font-sans">Save the Video Workspace</h1>
                        <p className="text-sm text-gray-500 font-medium pb-2">Manage and design your accepted Save the Video projects</p>
                    </div>

                    {/* Top Section: Accepted Projects Table */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Briefcase size={18} className="text-purple-500" />
                                My Assigned Works
                            </h2>
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                                {assignedProjects.length} Project{assignedProjects.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Project ID</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Client Name</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loadingProjects ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-gray-400">
                                                Loading your projects...
                                            </td>
                                        </tr>
                                    ) : assignedProjects.length === 0 ? (
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
                                        assignedProjects.map(proj => {
                                            const date = new Date(proj.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                            return (
                                                <tr key={proj.id} className="transition-colors hover:bg-purple-50/50">
                                                    <td className="px-6 py-4 text-sm font-bold text-gray-900 border-l-4 border-transparent">
                                                        {proj.project_id}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-bold text-gray-800">{proj.project_name}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                                                        {date}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${statusBadge(proj.status)}`}>
                                                            {statusLabel(proj.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleSelectProject(proj)}
                                                            className="px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 ml-auto bg-white border border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-700"
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
                <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div>
                        <button 
                            onClick={() => setSelectedProject(null)}
                            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors mb-4"
                        >
                            <ArrowLeft size={16} /> Back to Works
                        </button>
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                Workspace: <span className="text-purple-600">{selectedProject.project_name}</span>
                            </h2>
                            {selectedProject.status === 'Rework' && selectedProject.admin_notes && (
                                <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                                    <span>Note:</span> {selectedProject.admin_notes}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Client Details */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
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

                        {/* Requirements & Action Buttons */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 mb-4">Client Requirements</h2>
                                <div className="bg-purple-50/50 p-4 rounded-2xl mb-6">
                                    <p className="text-[13px] text-gray-700 font-medium leading-relaxed">
                                        {selectedProject.admin_notes || "Create a cinematic 'Save the Video' deliverable. Please follow the standard 1-minute romantical template. Emphasize slow-motion clips and warm color grades."}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 mt-auto">
                                <button className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-[#2a2a2a] text-white px-4 py-3 rounded-xl text-xs font-bold hover:bg-black transition-colors shadow-sm">
                                    <Video size={16} /> Go to DaVinci
                                </button>
                                
                                <button className="flex-1 min-w-[100px] flex items-center justify-center gap-2 border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors shadow-sm">
                                    <Play size={16} /> Resume
                                </button>
                                <button className="flex-1 min-w-[100px] flex items-center justify-center gap-2 border border-amber-200 bg-amber-50 text-amber-700 px-4 py-3 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors shadow-sm">
                                    <Pause size={16} /> Pause
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-xl">
                                <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <UploadCloud size={16} className="text-purple-500" />
                                    Submit Final Video
                                </h2>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Paste the Google Drive or cloud link after finishing this Save the Video deliverable. Submitting marks this work as completed for CRM stage movement.
                                </p>
                            </div>

                            <span className={`inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-[11px] font-bold ${statusBadge(selectedProject.status)}`}>
                                {selectedProject.status?.toLowerCase() === 'completed' || selectedProject.upload_link
                                    ? <CheckCircle size={12} />
                                    : <Clock size={12} />}
                                {statusLabel(selectedProject.status)}
                            </span>
                        </div>

                        {selectedProject.upload_link && (
                            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
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

                        {selectedProject.status === 'Rework' && selectedProject.admin_notes && (
                            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                <p className="mb-1 text-xs font-bold text-amber-700">Re-upload Request</p>
                                <p className="text-xs text-amber-800">{selectedProject.admin_notes}</p>
                            </div>
                        )}

                        <div className="mt-5 flex flex-col gap-3 md:flex-row">
                            <input
                                type="url"
                                value={uploadLink}
                                onChange={event => setUploadLink(event.target.value)}
                                placeholder="https://drive.google.com/..."
                                className="min-w-0 flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-purple-500"
                            />
                            <button
                                onClick={handleSubmitUpload}
                                disabled={!uploadLink.trim() || submittingUpload}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
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
