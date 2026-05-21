import { useState, useEffect } from 'react'
import { Clock, ArrowRight, Link2, CheckCircle, RefreshCw } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

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

type FilterKey = 'all' | 'inProgress' | 'completed' | 'rework'

function UploadLinkModal({ project, onClose, onSubmit }: {
    project: Project
    onClose: () => void
    onSubmit: (link: string) => void
}) {
    const [link, setLink] = useState(project.upload_link || '')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!link.trim()) return
        setLoading(true)
        await onSubmit(link.trim())
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-7 w-[480px] shadow-xl">
                <h2 className="text-base font-bold text-gray-900 mb-1">Submit Completed Work</h2>
                <p className="text-xs text-gray-500 mb-5">Paste the drive / cloud link to your finished deliverable for <span className="font-semibold text-purple-600">{project.project_type}</span></p>

                {project.admin_notes && (
                    <div className="mb-5 rounded-xl p-4 bg-amber-50 border border-amber-200">
                        <p className="text-xs font-bold text-amber-700 mb-1">📝 Admin Notes (Re-upload Request)</p>
                        <p className="text-xs text-amber-800">{project.admin_notes}</p>
                    </div>
                )}

                <label className="block text-xs font-semibold text-gray-700 mb-2">Upload Link</label>
                <input
                    type="url"
                    value={link}
                    onChange={e => setLink(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 mb-6"
                />
                <div className="flex gap-3 justify-end">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium border hover:bg-gray-50">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={!link.trim() || loading}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Submitting...' : 'Submit Work ✓'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function statusStyle(status: string) {
    const s = status.toLowerCase()
    if (s === 'completed') return { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed', icon: <CheckCircle size={12} /> }
    if (s === 'approved') return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approved ✓', icon: <CheckCircle size={12} /> }
    if (s === 'rework') return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Re-upload Needed', icon: <RefreshCw size={12} /> }
    if (s === 'pending') return { bg: 'bg-blue-100', text: 'text-blue-600', label: 'In Progress', icon: <Clock size={12} /> }
    return { bg: 'bg-gray-100', text: 'text-gray-600', label: status, icon: null }
}

export default function MyWork() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [uploadModal, setUploadModal] = useState<Project | null>(null)
    const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

    const getEmployeeId = () => {
        try {
            const user = JSON.parse(localStorage.getItem('ra_user') || '{}')
            return user.employee_id || localStorage.getItem('employee_id') || ''
        } catch {
            return localStorage.getItem('employee_id') || ''
        }
    }
    const employeeId = getEmployeeId()

    const fetchProjects = async () => {
        if (!employeeId) { setLoading(false); return }
        try {
            const res = await axios.get(`${API_URL}/employee-projects/employee/${employeeId}`)
            setProjects(res.data.data || [])
        } catch (err) {
            console.error('Failed to fetch my work', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchProjects() }, [employeeId])

    const handleSubmitLink = async (link: string) => {
        if (!uploadModal) return
        try {
            await axios.put(`${API_URL}/employee-projects/${uploadModal.id}/submit-link`, { upload_link: link })
            setProjects(prev => prev.map(p => p.id === uploadModal.id ? { ...p, status: 'Completed', upload_link: link } : p))
            setUploadModal(null)
        } catch {
            alert('Failed to submit link. Please try again.')
        }
    }

    const counts = {
        total: projects.length,
        inProgress: projects.filter(p => p.status === 'Pending').length,
        completed: projects.filter(p => ['Completed', 'Approved'].includes(p.status)).length,
        rework: projects.filter(p => p.status === 'Rework').length,
    }

    const handleCardClick = (key: FilterKey) => {
        setActiveFilter(prev => prev === key ? 'all' : key)
    }

    const filteredProjects = projects.filter(p => {
        if (activeFilter === 'inProgress') return p.status === 'Pending'
        if (activeFilter === 'completed') return ['Completed', 'Approved'].includes(p.status)
        if (activeFilter === 'rework') return p.status === 'Rework'
        return true
    })

    const cards: {
        key: FilterKey
        label: string
        count: number
    }[] = [
        {
            key: 'all',
            label: 'Total Tasks',
            count: counts.total,
        },
        {
            key: 'inProgress',
            label: 'In Progress',
            count: counts.inProgress,
        },
        {
            key: 'completed',
            label: 'Completed',
            count: counts.completed,
        },
        {
            key: 'rework',
            label: 'Re-upload Needed',
            count: counts.rework,
        },
    ]

    const activeCardLabel = cards.find(c => c.key === activeFilter)?.label

    return (
        <div className="space-y-6 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">My Work</h1>
                <p className="text-sm text-gray-500 mt-1">Manage and track your assigned creative tasks</p>
            </div>

            <div className="grid grid-cols-4 gap-4">
                {cards.map(card => {
                    const isActive = activeFilter === card.key
                    return (
                        <button
                            key={card.key}
                            onClick={() => handleCardClick(card.key)}
                            className="crm-card p-5 flex flex-col gap-3 text-left transition-colors hover:bg-gray-50"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500">{card.label}</p>
                                    <p className="text-2xl font-bold mt-1 text-gray-900">{card.count}</p>
                                </div>
                                <span className={`h-10 w-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-purple-100 text-purple-600' : 'bg-gray-50 text-gray-400'}`}>
                                    {card.key === 'completed' ? <CheckCircle size={17} /> : card.key === 'rework' ? <RefreshCw size={17} /> : <Clock size={17} />}
                                </span>
                            </div>
                            <p className={`text-xs font-medium ${isActive ? 'text-purple-600' : 'text-gray-500'}`}>
                                {isActive ? 'Selected filter' : 'Click to filter'}
                            </p>
                        </button>
                    )
                })}
            </div>

            {activeFilter !== 'all' && (
                <div className="flex items-center gap-3 py-2 px-4 bg-white border border-gray-100 rounded-xl">
                    <span className="text-sm text-gray-500 font-medium">
                        Filtered by: <span className="font-bold text-gray-800">{activeCardLabel}</span>
                    </span>
                    <span className="text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-0.5 rounded-full font-semibold">
                        {filteredProjects.length} task{filteredProjects.length !== 1 ? 's' : ''}
                    </span>
                    <button
                        onClick={() => setActiveFilter('all')}
                        className="ml-auto text-xs text-purple-600 hover:text-purple-800 font-bold underline underline-offset-2"
                    >
                        Clear filter
                    </button>
                </div>
            )}

            {loading ? (
                <div className="text-center py-16 text-gray-400">Loading your projects...</div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    {activeFilter === 'all'
                        ? 'No projects assigned yet.'
                        : `No tasks found for "${activeCardLabel}".`
                    }
                </div>
            ) : (
                <div className="crm-card bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-6 py-4 text-xs font-bold text-indigo-600">Project ID</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-indigo-600">Client Name</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-indigo-600">Task</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-indigo-600">Assigned Date</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-indigo-600">Status</th>
                                <th className="text-right px-6 py-4 text-xs font-bold text-indigo-600">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.map(project => {
                                const style = statusStyle(project.status)
                                const canSubmit = ['Pending', 'Rework'].includes(project.status)
                                return (
                                    <tr key={project.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-indigo-600">{project.project_id}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{project.project_name}</td>
                                        <td className="px-6 py-4 text-xs font-medium text-gray-500">{project.project_type}</td>
                                        <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                                            {new Date(project.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${style.bg} ${style.text}`}>
                                                {style.icon} {style.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {canSubmit ? (
                                                <button
                                                    onClick={() => setUploadModal(project)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                                >
                                                    {project.status === 'Rework' ? <RefreshCw size={14} /> : <ArrowRight size={14} />}
                                                    {project.status === 'Rework' ? 'Re-submit' : 'Submit'}
                                                </button>
                                            ) : project.upload_link ? (
                                                <a
                                                    href={project.upload_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                                                >
                                                    <Link2 size={14} /> Link
                                                </a>
                                            ) : (
                                                <span className="text-xs font-medium text-gray-400">No action</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {uploadModal && (
                <UploadLinkModal
                    project={uploadModal}
                    onClose={() => setUploadModal(null)}
                    onSubmit={handleSubmitLink}
                />
            )}
        </div>
    )
}
