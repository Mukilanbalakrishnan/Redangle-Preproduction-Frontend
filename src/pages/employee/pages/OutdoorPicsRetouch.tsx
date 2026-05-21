import { useState, useEffect } from 'react'
import { Briefcase, ChevronRight, ArrowLeft, Video, Play, Pause, Clock } from 'lucide-react'
import { getEmployeeProjectsByType } from '../../../api/employee.api'

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

export default function OutdoorPicsRetouch() {
    const [assignedProjects, setAssignedProjects] = useState<AssignedProject[]>([])
    const [selectedProject, setSelectedProject] = useState<AssignedProject | null>(null)
    const [loadingProjects, setLoadingProjects] = useState(true)

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
        getEmployeeProjectsByType(employeeId, 'Retouching')
            .then(res => {
                const filtered = res.data.data || []
                setAssignedProjects(filtered)
                if (selectedProject) {
                    const stillExists = filtered.find((p: AssignedProject) => p.id === selectedProject.id)
                    if (!stillExists) setSelectedProject(null)
                }
            })
            .catch(err => console.error('OutdoorRetouch projects fetch error', err))
            .finally(() => setLoadingProjects(false))
    }

    useEffect(() => {
        if (employeeId) fetchProjects()
    }, [employeeId])

    const handleSelectProject = (proj: AssignedProject) => {
        setSelectedProject(proj)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className="space-y-6 max-w-[1600px] animate-in zoom-in-95 duration-300 pb-20">
            {!selectedProject ? (
                <>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1 font-sans">Retouching Workspace</h1>
                <p className="text-sm text-gray-500 font-medium pb-2">Manage and deliver your accepted Retouching assignments</p>
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
                                        {selectedProject.admin_notes || "Retouching assignment. Please edit the selected raw images according to the provided instructions. Ensure natural skin tones and remove distractions."}
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
                </div>
            )}
        </div>
    )
}
