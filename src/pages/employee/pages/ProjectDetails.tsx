import { useState } from 'react'
import { User, Calendar, FileText, Clock, ArrowLeft, Link2, CheckCircle, RefreshCw, Check } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'

const API_URL = import.meta.env.VITE_API_URL

export type ProjectFull = {
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

type ProjectDetailsProps = {
    onBack: () => void
    data: ProjectFull
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

export default function ProjectDetails({ onBack, data }: ProjectDetailsProps) {
    const [currentStatus, setCurrentStatus] = useState(data.status)
    const [accepting, setAccepting] = useState(false)

    const assignedDate = new Date(data.created_at).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric'
    })

    const handleAccept = async () => {
        setAccepting(true)
        try {
            const res = await axios.put(`${API_URL}/employee-projects/${data.id}/status`, {
                status: 'Accepted'
            })
            if (res.data?.success) {
                toast.success('Assignment accepted successfully')
                setCurrentStatus('Accepted')
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to accept assignment')
        } finally {
            setAccepting(false)
        }
    }

    return (
        <div className="max-w-5xl">
            <button
                onClick={onBack}
                className="mb-4 flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors text-gray-700"
            >
                <ArrowLeft size={16} /> Back to Assigned Projects
            </button>

            <div className="space-y-6 max-w-5xl relative">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Project Details</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Project ID: {data.project_id}
                    </p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold ${statusBadge(currentStatus)}`}>
                    {statusLabel(currentStatus)}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Client Information */}
                <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-8">
                        <User size={18} className="text-purple-500" />
                        Client Information
                    </h2>
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-700">Client Name</span>
                            <span className="text-sm font-medium text-gray-900">{data.project_name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-700">Project Type</span>
                            <span className="text-[10px] font-bold px-4 py-1.5 rounded-full bg-[#E0F2E9] text-[#2E7D51]">
                                {data.project_type}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-700">Assigned On</span>
                            <span className="text-xs font-bold text-gray-600 flex items-center gap-2">
                                <Calendar size={16} className="text-gray-500" />
                                {assignedDate}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Task Information */}
                <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-8">
                        <FileText size={18} className="text-purple-500" />
                        Task Information
                    </h2>
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-700">Assigned Task</span>
                            <span className="bg-[#E0F2E9] text-[#2E7D51] px-4 py-1.5 rounded-full text-[10px] font-bold">
                                {data.project_type}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-700">Current Status</span>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold ${statusBadge(currentStatus)}`}>
                                {statusLabel(currentStatus)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-700">Employee ID</span>
                            <span className="text-xs font-bold text-gray-600 flex items-center gap-2">
                                <Clock size={14} className="text-orange-400" />
                                {data.employee_id}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Link (if submitted) */}
            {data.upload_link && (
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Link2 size={18} className="text-purple-500" />
                        Submitted Work Link
                    </h2>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                        <Link2 size={14} className="text-purple-500 shrink-0" />
                        <a
                            href={data.upload_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-purple-600 underline truncate"
                        >
                            {data.upload_link}
                        </a>
                    </div>
                </div>
            )}

            {/* Admin Notes (rework) */}
            {currentStatus === 'Rework' && data.admin_notes && (
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl shadow-sm">
                    <h2 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                        <RefreshCw size={16} className="text-amber-600" />
                        Re-upload Notes from Admin
                    </h2>
                    <p className="text-sm text-amber-700 font-medium">{data.admin_notes}</p>
                </div>
            )}

            {/* Approved banner */}
            {currentStatus === 'Approved' && (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl shadow-sm flex items-center gap-3">
                    <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                    <p className="text-sm font-bold text-emerald-700">
                        Your work has been approved by the admin! Great job.
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
                <button
                    onClick={onBack}
                    className="bg-white border text-gray-800 border-gray-200 px-6 py-3 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm"
                >
                    Back to Projects
                </button>

                {/* Accept Assignment Button */}
                {currentStatus.toLowerCase() === 'pending' && (
                    <button
                        onClick={handleAccept}
                        disabled={accepting}
                        className="bg-purple-600 text-white px-6 py-3 flex items-center gap-2 rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <Check size={16} />
                        {accepting ? 'Accepting...' : 'Accept assignment'}
                    </button>
                )}
            </div>
            </div>
        </div>
    )
}
