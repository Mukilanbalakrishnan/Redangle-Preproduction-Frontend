import { useEffect, useMemo, useState } from 'react'
import {
    ArrowLeft,
    Check,
    Clock,
    Download,
    ExternalLink,
    Eye,
    FileText,
    RotateCcw,
    Search,
    Send,
    ShieldCheck,
    User,
} from 'lucide-react'
import axios from 'axios'
import RawDataDelivery from './RawDataDelivery'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

export type QCWorkflowPhase = 'pre_production' | 'post_production' | 'event' | 'all'

interface CrmQCCheckProps {
    workflowPhase?: QCWorkflowPhase
    title?: string
    description?: string
}

type EditorProject = {
    id: number
    project_id: string
    project_name: string
    project_type: string
    employee_id: string
    employee_name?: string
    status: string
    upload_link?: string | null
    admin_notes?: string | null
    updated_at?: string
}

type ApprovalGroup = {
    id: string
    project_id: string
    project_name: string
    project_type: string
    stageLabel: string
    items: EditorProject[]
    status: string
    statusLabel: string
    submittedCount: number
    pendingCount: number
    approvedCount: number
}

const preProductionTypes = ['Save the Date', 'Save the Video', 'Retouching']
const postProductionTypes = [
    'Traditional Video Editing',
    'Retouch Editing',
    'Album Design',
    'Candid Video Editing',
]
const editorTypes = [...preProductionTypes, ...postProductionTypes]

const roleLabels: Record<string, string> = {
    'Save the Date': 'Save the Date Post',
    'Save the Video': 'Save the Video',
    Retouching: 'Retouch',
    'Traditional Video Editing': 'Traditional Video Editor',
    'Retouch Editing': 'Retouch Editor',
    'Album Design': 'Album Designer',
    'Candid Video Editing': 'Candid Video Editor',
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
    Pending: { bg: '#FEF3C7', text: '#B45309', label: 'Assigned' },
    Accepted: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Accepted' },
    'In Progress': { bg: '#DBEAFE', text: '#1D4ED8', label: 'In Progress' },
    Completed: { bg: '#EDE9FE', text: '#6D28D9', label: 'QC Pending' },
    Approved: { bg: '#D1FAE5', text: '#047857', label: 'Approved' },
    Rework: { bg: '#FEE2E2', text: '#DC2626', label: 'Re-upload Requested' },
}

const reviewStatuses = ['Completed', 'Approved', 'Rework']
const statuses = ['All Status', ...reviewStatuses]

const getPhaseTypes = (phase: QCWorkflowPhase) => {
    if (phase === 'pre_production') return preProductionTypes
    if (phase === 'post_production') return postProductionTypes
    if (phase === 'event') return []
    return editorTypes
}

const formatDate = (value?: string) => {
    if (!value) return '—'
    try {
        return new Date(value).toLocaleString()
    } catch {
        return '—'
    }
}

const getGroupStatus = (items: EditorProject[]) => {
    const approved = items.filter(item => item.status === 'Approved').length
    const pending = items.filter(item => item.status === 'Completed').length
    const rework = items.filter(item => item.status === 'Rework').length

    if (items.length > 0 && approved === items.length) return { status: 'Approved', label: 'Approved' }
    if (pending > 0) return { status: 'Completed', label: 'QC Pending' }
    if (rework > 0) return { status: 'Rework', label: 'Re-upload Requested' }
    return { status: items[0]?.status || 'Pending', label: statusStyles[items[0]?.status || 'Pending']?.label || 'Pending' }
}

const getStageApprovalLabel = (projectType: string, phase: QCWorkflowPhase) => {
    if (phase === 'pre_production' || preProductionTypes.includes(projectType)) return 'Pre-production Phase 2'
    if (phase === 'post_production' || postProductionTypes.includes(projectType)) return 'Post-production'
    if (phase === 'event') return 'Event'
    return 'Stage Approval'
}

export default function CrmQCCheck({
    workflowPhase = 'all',
    title,
    description,
}: CrmQCCheckProps = {}) {
    const [projects, setProjects] = useState<EditorProject[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('All Status')
    const [selectedGroup, setSelectedGroup] = useState<ApprovalGroup | null>(null)
    const [selectedProject, setSelectedProject] = useState<EditorProject | null>(null)
    const [reviewNotes, setReviewNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [completionMessage, setCompletionMessage] = useState('')
    const [deliveryProjectId, setDeliveryProjectId] = useState<string | null>(null)
    const [deliverySentProjectIds, setDeliverySentProjectIds] = useState<string[]>([])

    const allowedTypes = useMemo(() => getPhaseTypes(workflowPhase), [workflowPhase])

    const fetchProjects = async () => {
        setLoading(true)
        try {
            const res = await axios.get(`${API_URL}/employee-projects/all`)
            if (res.data?.success) {
                setProjects(res.data.data || [])
            }
        } catch (error) {
            console.error('CRM QC editor projects fetch failed:', error)
            setProjects([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProjects()
    }, [])

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase()
        return projects.filter((project) => {
            if (!allowedTypes.includes(project.project_type)) return false
            if (!project.upload_link && !reviewStatuses.includes(project.status)) return false

            const matchesSearch = !query ||
                String(project.id).includes(query) ||
                (project.project_id || '').toLowerCase().includes(query) ||
                (project.project_name || '').toLowerCase().includes(query) ||
                (project.project_type || '').toLowerCase().includes(query) ||
                (project.employee_name || project.employee_id || '').toLowerCase().includes(query)

            const matchesStatus = statusFilter === 'All Status' || project.status === statusFilter

            return matchesSearch && matchesStatus
        })
    }, [allowedTypes, projects, search, statusFilter])

    const groupedApprovals = useMemo(() => {
        const groups = new Map<string, EditorProject[]>()
        for (const project of filtered) {
            const key = `${project.project_id || project.project_name}-${getStageApprovalLabel(project.project_type, workflowPhase)}`
            groups.set(key, [...(groups.get(key) || []), project])
        }

        return Array.from(groups.entries()).map(([id, items]) => {
            const first = items[0]
            const groupStatus = getGroupStatus(items)
            const pendingCount = items.filter(item => item.status === 'Completed').length
            const approvedCount = items.filter(item => item.status === 'Approved').length
            return {
                id,
                project_id: first.project_id,
                project_name: first.project_name,
                project_type: first.project_type,
                stageLabel: getStageApprovalLabel(first.project_type, workflowPhase),
                items,
                status: groupStatus.status,
                statusLabel: groupStatus.label,
                submittedCount: items.filter(item => Boolean(item.upload_link)).length,
                pendingCount,
                approvedCount,
            }
        })
    }, [filtered, workflowPhase])

    const handleReviewProject = async (project: EditorProject, status: 'Approved' | 'Rework') => {
        setSubmitting(true)
        try {
            await axios.put(`${API_URL}/employee-projects/${project.id}/review`, {
                status,
                admin_notes: status === 'Rework' ? reviewNotes : reviewNotes || undefined,
            })

            setSelectedProject(null)
            setSelectedGroup(null)
            setReviewNotes('')
            await fetchProjects()
        } catch (error) {
            console.error('CRM QC review failed:', error)
            alert('Failed to update QC review status')
        } finally {
            setSubmitting(false)
        }
    }

    const handleReview = async (status: 'Approved' | 'Rework') => {
        if (!selectedProject) return
        await handleReviewProject(selectedProject, status)
    }

    const handleApproveAll = async (group: ApprovalGroup) => {
        const pendingItems = group.items.filter(item => item.status === 'Completed')
        if (pendingItems.length === 0 || submitting) return

        setSubmitting(true)
        try {
            await Promise.all(pendingItems.map(item =>
                axios.put(`${API_URL}/employee-projects/${item.id}/review`, {
                    status: 'Approved',
                    admin_notes: reviewNotes || undefined,
                })
            ))

            setSelectedProject(null)
            setReviewNotes('')
            await fetchProjects()
            setSelectedGroup({
                ...group,
                items: group.items.map(item => pendingItems.some(pending => pending.id === item.id) ? { ...item, status: 'Approved' } : item),
                pendingCount: 0,
                approvedCount: group.items.length,
                status: 'Approved',
                statusLabel: 'Approved',
            })
            setCompletionMessage('QC approval is complete. Send the approved delivery to the client to unlock the next stage.')
        } catch (error) {
            console.error('CRM QC approve all failed:', error)
            alert('Failed to approve all pending submissions')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDownloadReport = () => {
        if (groupedApprovals.length === 0) return

        const headers = ['Project ID', 'Client', 'Stage Approval', 'Submissions', 'Pending', 'Approved', 'Status']
        const rows = groupedApprovals.map((row) => [
            row.project_id,
            row.project_name,
            row.stageLabel,
            row.items.length,
            row.pendingCount,
            row.approvedCount,
            row.statusLabel,
        ].map((value) => `"${String(value || '').replace(/"/g, '""')}"`).join(','))

        const blob = new Blob(['\ufeff' + [headers.join(','), ...rows].join('\n')], {
            type: 'text/csv;charset=utf-8;',
        })
        const link = document.createElement('a')
        const date = new Date()
        link.href = URL.createObjectURL(blob)
        link.download = `crm_editor_qc_${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}.csv`
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    if (loading) {
        return <div className="p-10 text-gray-500">Loading editor QC submissions...</div>
    }

    if (deliveryProjectId) {
        return (
            <RawDataDelivery
                projectId={deliveryProjectId}
                mode="final"
                onBack={() => setDeliveryProjectId(null)}
                onSent={() => {
                    setDeliverySentProjectIds((prev) =>
                        prev.includes(deliveryProjectId) ? prev : [...prev, deliveryProjectId]
                    )
                    setDeliveryProjectId(null)
                    setCompletionMessage('Delivery details sent to client successfully.')
                }}
            />
        )
    }

    if (selectedGroup && !selectedProject) {
        const groupStyle = statusStyles[selectedGroup.status] || { bg: '#F3F4F6', text: '#6B7280', label: selectedGroup.statusLabel }
        const canApproveAll = selectedGroup.pendingCount > 0
        const canSendDelivery = workflowPhase === 'pre_production' || workflowPhase === 'post_production' || workflowPhase === 'event'
        const deliveryAlreadySent = deliverySentProjectIds.includes(selectedGroup.project_id)

        return (
            <div>
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{selectedGroup.stageLabel}</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Client: {selectedGroup.project_name} · Lead ID: {selectedGroup.project_id}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleApproveAll(selectedGroup)}
                            disabled={!canApproveAll || submitting}
                            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Check size={16} /> Approve All
                        </button>
                        <button
                            onClick={() => {
                                setSelectedGroup(null)
                                setReviewNotes('')
                                setCompletionMessage('')
                            }}
                            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                    </div>
                </div>

                {completionMessage && (
                    <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-sm font-bold text-emerald-800">Stage approval complete</p>
                                <p className="mt-1 text-sm text-emerald-700">{completionMessage}</p>
                            </div>
                            {canSendDelivery && (
                                <button
                                    onClick={() => setDeliveryProjectId(selectedGroup.project_id)}
                                    disabled={deliveryAlreadySent}
                                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white ${
                                        deliveryAlreadySent
                                            ? 'cursor-not-allowed bg-emerald-600 opacity-80'
                                            : 'bg-indigo-600 hover:bg-indigo-700'
                                    }`}
                                >
                                    {deliveryAlreadySent ? (
                                        <>
                                            <Check size={15} /> Sent to Client
                                        </>
                                    ) : (
                                        <>
                                            <Send size={15} /> Send to Client
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className="mb-5 grid grid-cols-4 gap-4">
                    <div className="crm-card bg-white p-5">
                        <p className="text-xs font-medium text-gray-500">Stage</p>
                        <p className="mt-1 text-lg font-bold text-gray-900">{selectedGroup.stageLabel}</p>
                    </div>
                    <div className="crm-card bg-white p-5">
                        <p className="text-xs font-medium text-gray-500">Submissions</p>
                        <p className="mt-1 text-lg font-bold text-gray-900">{selectedGroup.items.length}</p>
                    </div>
                    <div className="crm-card bg-white p-5">
                        <p className="text-xs font-medium text-gray-500">QC Pending</p>
                        <p className="mt-1 text-lg font-bold text-purple-600">{selectedGroup.pendingCount}</p>
                    </div>
                    <div className="crm-card bg-white p-5">
                        <p className="text-xs font-medium text-gray-500">Status</p>
                        <span
                            className="mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold"
                            style={{ background: groupStyle.bg, color: groupStyle.text }}
                        >
                            {selectedGroup.statusLabel}
                        </span>
                    </div>
                </div>

                <div className="mb-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <label className="mb-2 block text-xs font-bold text-gray-500">Approval Notes</label>
                    <textarea
                        value={reviewNotes}
                        onChange={(event) => setReviewNotes(event.target.value)}
                        rows={3}
                        placeholder="Optional notes for approve all, or required notes when requesting re-upload from an individual approval..."
                        className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-indigo-400"
                    />
                </div>

                <div className="grid gap-4">
                    {selectedGroup.items.map((item) => {
                        const itemStyle = statusStyles[item.status] || { bg: '#F3F4F6', text: '#6B7280', label: item.status }
                        const canReview = item.status === 'Completed'
                        const approvalLabel = `${roleLabels[item.project_type] || item.project_type} Approval`
                        return (
                            <div key={item.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{approvalLabel}</p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Editor: <span className="font-semibold text-gray-700">{item.employee_name || item.employee_id}</span>
                                            <span className="text-gray-400"> · {item.employee_id} · Updated: {formatDate(item.updated_at)}</span>
                                        </p>
                                    </div>
                                    <span
                                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                                        style={{ background: itemStyle.bg, color: itemStyle.text }}
                                    >
                                        {itemStyle.label}
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    {item.upload_link ? (
                                        <a
                                            href={item.upload_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-100"
                                        >
                                            <ExternalLink size={14} /> Open Work
                                        </a>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-4 py-2 text-xs font-medium text-gray-400">
                                            <FileText size={14} /> No upload
                                        </span>
                                    )}
                                    <button
                                        onClick={() => {
                                            setSelectedProject(item)
                                            setReviewNotes('')
                                            setCompletionMessage('')
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-4 py-2 text-xs font-bold text-purple-600 hover:bg-purple-100"
                                    >
                                        <Eye size={14} /> View Submission
                                    </button>
                                    <button
                                        onClick={() => handleReviewProject(item, 'Approved')}
                                        disabled={!canReview || submitting}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <Check size={14} /> Approve
                                    </button>
                                </div>

                                {item.admin_notes && (
                                    <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-800">{item.admin_notes}</p>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    if (selectedProject) {
        const statusStyle = statusStyles[selectedProject.status] || { bg: '#F3F4F6', text: '#6B7280', label: selectedProject.status }
        const canReview = selectedProject.status === 'Completed'

        return (
            <div>
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {roleLabels[selectedProject.project_type] || selectedProject.project_type} QC
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Lead ID: {selectedProject.project_id?.replace('CRM-', '')} · Client: {selectedProject.project_name}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedProject(null)
                            setReviewNotes('')
                        }}
                        className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                </div>

                <div className="mb-6 grid gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <User size={16} />
                            </div>
                            <h2 className="text-sm font-bold text-gray-900">Editor Details</h2>
                        </div>
                        <div className="grid gap-4">
                            <div>
                                <p className="text-xs font-semibold text-gray-400">Employee</p>
                                <p className="mt-1 text-sm font-bold text-gray-900">
                                    {selectedProject.employee_name || selectedProject.employee_id}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400">Role</p>
                                <p className="mt-1 text-sm font-bold text-gray-900">
                                    {roleLabels[selectedProject.project_type] || selectedProject.project_type}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                <Clock size={16} />
                            </div>
                            <h2 className="text-sm font-bold text-gray-900">Submission Status</h2>
                        </div>
                        <div className="grid gap-4">
                            <div>
                                <p className="text-xs font-semibold text-gray-400">Status</p>
                                <span
                                    className="mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-bold"
                                    style={{ background: statusStyle.bg, color: statusStyle.text }}
                                >
                                    {statusStyle.label}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400">Last Updated</p>
                                <p className="mt-1 text-sm font-bold text-gray-900">{formatDate(selectedProject.updated_at)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6 grid gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-sm font-bold text-gray-900">Uploaded Work</h2>
                        {selectedProject.upload_link ? (
                            <a
                                href={selectedProject.upload_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-100"
                            >
                                <ExternalLink size={16} /> Open Submitted Link
                            </a>
                        ) : (
                            <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-400">No editor upload link has been submitted yet.</p>
                        )}
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-sm font-bold text-gray-900">Previous QC Notes</h2>
                        {selectedProject.admin_notes ? (
                            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{selectedProject.admin_notes}</p>
                        ) : (
                            <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-400">No QC notes recorded.</p>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-sm font-bold text-gray-900">QC Decision</h2>
                    <textarea
                        value={reviewNotes}
                        onChange={(event) => setReviewNotes(event.target.value)}
                        rows={3}
                        placeholder="Add QC notes or re-upload instructions..."
                        className="mb-4 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-indigo-400"
                    />
                    {!canReview && (
                        <p className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
                            Approval actions unlock after the editor submits an upload link and the status becomes QC Pending.
                        </p>
                    )}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => handleReview('Approved')}
                            disabled={!canReview || submitting}
                            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Check size={16} /> Approve
                        </button>
                        <button
                            onClick={() => handleReview('Rework')}
                            disabled={!canReview || submitting || !reviewNotes.trim()}
                            className="flex items-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <RotateCcw size={16} /> Request Re-upload
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ShieldCheck size={20} className="text-indigo-500" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{title ?? 'Editor QC Checking'}</h1>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {description ?? 'Review and approve editor submissions'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex w-96 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
                    <Search size={15} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by ID, client, editor, or role..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative rounded-xl shadow-sm">
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className="cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium outline-none hover:bg-gray-50"
                            style={{ color: '#4B5563' }}
                        >
                            {statuses.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </div>
                    <button
                        onClick={handleDownloadReport}
                        disabled={groupedApprovals.length === 0}
                        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Download size={15} /> Download report
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Lead ID</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Stage Approval</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Client</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Submissions</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedApprovals.map((row, index) => {
                            const statusStyle = statusStyles[row.status] || { bg: '#F3F4F6', text: '#6B7280', label: row.status }
                            return (
                                <tr key={row.id} className={`border-b border-gray-50 hover:bg-gray-50 ${index === groupedApprovals.length - 1 ? 'border-0' : ''}`}>
                                    <td className="px-6 py-4 text-sm font-bold text-indigo-600">{row.project_id?.replace('CRM-', '')}</td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-semibold text-gray-900">{row.stageLabel}</p>
                                        <p className="text-xs text-gray-400">
                                            {Array.from(new Set(row.items.map(item => `${roleLabels[item.project_type] || item.project_type} Approval`))).join(', ')}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-gray-900">{row.project_name}</p>
                                        <p className="text-xs text-gray-400">{row.project_id}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-semibold text-gray-900">{row.items.length} approval{row.items.length !== 1 ? 's' : ''}</p>
                                        <p className="text-xs text-gray-400">{row.pendingCount} pending · {row.approvedCount} approved</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className="rounded-full px-2.5 py-1 text-xs font-semibold"
                                            style={{ background: statusStyle.bg, color: statusStyle.text }}
                                        >
                                            {row.statusLabel}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => {
                                                setSelectedGroup(row)
                                                setReviewNotes('')
                                                setCompletionMessage('')
                                            }}
                                            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                        >
                                            <Eye size={14} /> View Collection
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                        {groupedApprovals.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                                    No editor QC submissions found for this section.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
