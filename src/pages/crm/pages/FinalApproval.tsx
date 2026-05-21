import React, { useEffect, useRef, useState } from 'react'
import { Users, Check, AlertTriangle, RefreshCw, CheckCircle2, Clock, UserCheck, Eye, Download } from 'lucide-react'
import Badge from '../components/ui/Badge'
import axios from 'axios'
import { toast } from 'sonner'

type Client = {
  id: string
  serialNumber?: string
  name: string
  email: string
  phone: string
  location: string
  eventDate: string
  shootType: string
  status: string
  executive: string
  currentPhase?: string
  phaseStatus?: string
}

type ApprovedLink = {
  id: number
  project_type: string
  upload_link: string
}

const checklist = [
    { label: 'Image Quality', desc: 'Resolution and sharpness meet Standards' },
    { label: 'Color Correction', desc: 'Colors are accurate and consistant' },
    { label: 'Client Requirements Met', desc: 'All requested shots included' },
    { label: 'Exposure Balanced', desc: 'No over/under exposed images' },
    { label: 'Proper Cropping', desc: 'Composition and framing are correct' },
    { label: 'Watermarks Applied', desc: 'Studio branding on preview images' },
]

const mockEmployees = [
    { id: '1', name: 'Arjun Kumar', role: 'Save the Date' },
    { id: '2', name: 'Kavitha Rao', role: 'Save the Video' },
    { id: '3', name: 'Vikram Sinha', role: 'Candid' },
    { id: '4', name: 'Priya Sharma', role: 'Retouching' },
]

// Post-approval statuses
type ChangeStatus = 'none' | 'pending_client_approval' | 'changes_pending' | 'changes_completed' | 'client_approved'

const statusConfig: Record<ChangeStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    none: { label: '', color: '', bg: '', icon: <></> },
    pending_client_approval: { label: 'CRM review in progress', color: '#d97706', bg: '#fef3c7', icon: <Clock size={14} /> },
    changes_pending: { label: 'Changes pending', color: '#dc2626', bg: '#fee2e2', icon: <AlertTriangle size={14} /> },
    changes_completed: { label: 'Changes completed', color: '#7c3aed', bg: '#ede9fe', icon: <RefreshCw size={14} /> },
    client_approved: { label: 'Phase advanced', color: '#059669', bg: '#d1fae5', icon: <UserCheck size={14} /> },
}

export default function FinalApproval() {
    const API_URL = import.meta.env.VITE_API_URL

    // List View State
    const [view, setView] = useState<'list' | 'detail'>('list')
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [eventDateSearch, setEventDateSearch] = useState('')
    const [filterType, setFilterType] = useState('')
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)

    // Detail View State
    const [checked, setChecked] = useState<number[]>([])
    const [showReassign, setShowReassign] = useState(false)
    const [assignedTo, setAssignedTo] = useState('')
    const [changeStatus, setChangeStatus] = useState<ChangeStatus>('none')
    const [changeSource, setChangeSource] = useState<'crm' | 'client' | ''>('')
    const [changeNotes, setChangeNotes] = useState('')
    const [showChangeFlow, setShowChangeFlow] = useState(false)
    const [approving, setApproving] = useState(false)
    const [reworkNotes, setReworkNotes] = useState('')
    const [reviewLinks, setReviewLinks] = useState<ApprovedLink[]>([])
    const [detailLoading, setDetailLoading] = useState(false)
    const hasHydratedApprovalRef = useRef(false)

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await axios.get(`${API_URL}/dashboard/leads`);
                const formatted = (res.data.data || []).map((lead: any) => ({
                    id: String(lead.id),
                    serialNumber: lead.serialNumber,
                    name: lead.leadName ?? "Unknown Client",
                    email: lead.email ?? "-",
                    phone: lead.phone ?? "-",
                    location: lead.location ?? "-",
                    eventDate: lead.eventDate ? new Date(lead.eventDate).toLocaleDateString('en-GB') : "-",
                    shootType: lead.eventType ?? "-",
                    status: lead.status === "new" ? "New" : lead.status === "completed" ? "Completed" : "New",
                    executive: "Unassigned",
                    currentPhase: lead.currentPhase,
                    phaseStatus: lead.phaseStatus,
                })).filter((lead: Client) =>
                    lead.currentPhase === 'post_production' && lead.phaseStatus === 'submitted'
                );
                setClients(formatted);
            } catch (err) {
                console.error("Client fetch failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, [API_URL]);

    const getProjectId = (client: Client) => `CRM-${client.serialNumber || client.id}`

    const toStoredReviewStatus = (status: ChangeStatus) => {
        if (status === 'none') return 'pending_review'
        return status
    }

    const fromStoredReviewStatus = (status?: string): ChangeStatus => {
        if (!status || status === 'pending_review') return 'none'
        if (status === 'changes_pending' || status === 'changes_completed' || status === 'client_approved') {
            return status
        }
        return 'none'
    }

    const persistFinalApprovalState = async (
        client: Client,
        overrides?: {
            checked?: number[]
            reworkNotes?: string
            status?: ChangeStatus
            changeSource?: 'crm' | 'client' | ''
            changeNotes?: string
            assignedTo?: string
        }
    ) => {
        const projectId = getProjectId(client)
        const nextChangeSource = overrides?.changeSource ?? changeSource
        const nextChangeNotes = overrides?.changeNotes ?? changeNotes
        const nextAssignedTo = overrides?.assignedTo ?? assignedTo

        await axios.put(`${API_URL}/employee-projects/project/${encodeURIComponent(projectId)}/final-approval`, {
            checked_items: overrides?.checked ?? checked,
            rework_notes: overrides?.reworkNotes ?? reworkNotes,
            review_status: toStoredReviewStatus(overrides?.status ?? changeStatus),
            change_source: nextChangeSource || null,
            change_notes: nextChangeNotes || null,
            assigned_to: nextAssignedTo || null,
        })
    }

    useEffect(() => {
        if (view !== 'detail' || !selectedClient) return

        let cancelled = false
        hasHydratedApprovalRef.current = false
        setDetailLoading(true)

        const loadFinalApprovalDetail = async () => {
            const projectId = getProjectId(selectedClient)

            try {
                const [linksRes, approvalRes] = await Promise.all([
                    axios.get(`${API_URL}/employee-projects/project/${encodeURIComponent(projectId)}/approved-links`),
                    axios.get(`${API_URL}/employee-projects/project/${encodeURIComponent(projectId)}/final-approval`),
                ])

                if (cancelled) return

                setReviewLinks(linksRes.data?.data || [])

                const saved = approvalRes.data?.data
                setChecked(Array.isArray(saved?.checked_items) ? saved.checked_items.map((item: number) => Number(item)) : [])
                setReworkNotes(saved?.rework_notes || '')
                setChangeStatus(fromStoredReviewStatus(saved?.review_status))
                setChangeSource(saved?.change_source || '')
                setChangeNotes(saved?.change_notes || '')
                setAssignedTo(saved?.assigned_to || '')
            } catch (error) {
                if (cancelled) return
                console.error('Final approval detail fetch failed', error)
                setReviewLinks([])
                setChecked([])
                setReworkNotes('')
                setChangeStatus('none')
                setChangeSource('')
                setChangeNotes('')
                setAssignedTo('')
            } finally {
                if (!cancelled) {
                    hasHydratedApprovalRef.current = true
                    setDetailLoading(false)
                }
            }
        }

        loadFinalApprovalDetail()

        return () => {
            cancelled = true
        }
    }, [API_URL, selectedClient, view])

    useEffect(() => {
        if (view !== 'detail' || !selectedClient || !hasHydratedApprovalRef.current) return

        const timeoutId = window.setTimeout(() => {
            persistFinalApprovalState(selectedClient).catch((error) => {
                console.error('Auto-save final approval failed', error)
            })
        }, 500)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [API_URL, assignedTo, changeNotes, changeSource, changeStatus, checked, reworkNotes, selectedClient, view])

    const toggle = (i: number) => setChecked(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
    const progress = checked.length
    const isApproved = changeStatus !== 'none'

    const filtered = clients.filter(c => {
        const textMatch = (c.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (c.id ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (c.serialNumber ?? "").toLowerCase().includes(search.toLowerCase());
        const dateMatch = eventDateSearch ? c.eventDate === new Date(eventDateSearch).toLocaleDateString('en-GB') : true;
        const typeMatch = filterType ? c.shootType === filterType : true;
        const queueMatch = c.currentPhase === 'post_production' && c.phaseStatus === 'submitted';
        return textMatch && dateMatch && typeMatch && queueMatch;
    });

    const handleOpenClient = (client: Client) => {
        setSelectedClient(client);
        setView('detail');
    };

    const handleApproveAndAdvance = async () => {
        if (!selectedClient || approving) return;

        const leadId = selectedClient.serialNumber || selectedClient.id;

        try {
            setApproving(true);

            await axios.patch(`${API_URL}/crm/leads/${leadId}/phase-status`, {
                status: 'approved'
            });

            const advanceRes = await axios.patch(`${API_URL}/crm/leads/${leadId}/advance-phase`);
            const nextPhase = advanceRes.data?.data?.current_phase;
            const allPhasesComplete = advanceRes.data?.data?.allPhasesComplete;

            await persistFinalApprovalState(selectedClient, {
                status: 'client_approved',
                changeSource: 'crm',
            })

            setChangeStatus('client_approved');
            setChangeSource('crm');
            setClients(prev => prev.filter(client => (client.serialNumber || client.id) !== leadId));

            if (allPhasesComplete) {
                toast.success('CRM approved the phase and the flow is now complete.');
            } else {
                toast.success(`CRM approved successfully. Moved to ${nextPhase || 'the next phase'}.`);
            }
        } catch (error: any) {
            console.error('Approve and advance failed', error);
            toast.error(error?.response?.data?.message || 'Failed to approve and advance phase');
        } finally {
            setApproving(false);
        }
    };

    const handleDownloadReport = () => {
        if (filtered.length === 0) return;
        
        const headers = ['Lead ID', 'Client Name', 'E-mail ID', 'Event Date', 'Event Type', 'Status', 'Executive'];
        const csvRows = filtered.map(c => [
            c.serialNumber || c.id, c.name, c.email, c.eventDate, c.shootType, c.status, c.executive
        ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(","));

        const csvContent = [headers.join(","), ...csvRows].join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        const d = new Date();
        const dateStr = `${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}`;
        
        link.setAttribute("href", url);
        link.setAttribute("download", `final_approval_queue_${dateStr}.csv`);
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (view === 'detail') {
        return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Final Approval: {selectedClient?.name}</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Quality check before moving to the next phase</p>
                </div>
                <button onClick={() => setView('list')} className="crm-card flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50" style={{ color: '#374151' }}>
                    ← Back to list
                </button>
            </div>

            {detailLoading && (
                <div className="mb-5 rounded-xl border bg-white px-4 py-3 text-sm" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                    Loading saved final approval data...
                </div>
            )}

            {/* Post-approval change request banner */}
            {isApproved && (
                <div className="mb-5 rounded-xl p-4 flex items-center justify-between gap-4"
                    style={{ background: statusConfig[changeStatus].bg, border: `1px solid ${statusConfig[changeStatus].color}30` }}>
                    <div className="flex items-center gap-3">
                        <span style={{ color: statusConfig[changeStatus].color }}>{statusConfig[changeStatus].icon}</span>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: statusConfig[changeStatus].color }}>
                                Status: {statusConfig[changeStatus].label}
                            </p>
                            {changeSource && (
                                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                                    Updated by: <strong>{changeSource === 'crm' ? 'CRM Team' : 'Client'}</strong>
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {changeStatus === 'changes_pending' && (
                            <button
                                onClick={() => setChangeStatus('changes_completed')}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                                style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd' }}
                            >
                                <Check size={12} /> Mark Changes Completed
                            </button>
                        )}
                        {changeStatus === 'changes_completed' && (
                            <>
                                <button
                                    onClick={handleApproveAndAdvance}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                                    style={{ background: '#d1fae5', color: '#059669', border: '1px solid #6ee7b7' }}
                                >
                                    <UserCheck size={12} /> Approve & Move Phase
                                </button>
                                <button
                                    onClick={() => setChangeStatus('changes_pending')}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                                    style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
                                >
                                    <RefreshCw size={12} /> More Changes
                                </button>
                            </>
                        )}
                        {changeStatus === 'client_approved' && (
                            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                                style={{ background: '#d1fae5', color: '#059669' }}>
                                <CheckCircle2 size={12} /> Moved to next phase
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Change request notes popup */}
            {showChangeFlow && (
                <div className="mb-4 crm-card p-4">
                    <p className="text-sm font-semibold mb-2" style={{ color: '#111827' }}>
                        Change Request Details
                    </p>
                    <div className="flex gap-3 mb-3">
                        <button
                            onClick={() => setChangeSource('crm')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${changeSource === 'crm' ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600'}`}
                        >
                            CRM Team
                        </button>
                    </div>
                    <textarea
                        value={changeNotes}
                        onChange={e => setChangeNotes(e.target.value)}
                        placeholder="Describe the changes requested..."
                        rows={2}
                        className="w-full text-sm rounded-xl px-3 py-2 outline-none resize-none"
                        style={{ border: '1px solid #E5E7EB', background: '#fff' }}
                    />
                    <div className="flex gap-2 mt-2 justify-end">
                        <button
                            onClick={() => setShowChangeFlow(false)}
                            className="px-3 py-1.5 text-xs rounded-lg border text-gray-600"
                            style={{ borderColor: '#E5E7EB' }}
                        >
                            Close
                        </button>
                        <button
                            onClick={() => {
                                setChangeStatus('changes_pending')
                                setChangeSource('crm')
                                setShowChangeFlow(false)
                            }}
                            className="px-3 py-1.5 text-xs rounded-lg text-white font-semibold"
                            style={{ background: '#5B5FC7' }}
                        >
                            Save & Assign Rework
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-3 gap-5">
                {/* Left: photo review */}
                <div className="crm-card col-span-2 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">🔗</span>
                            <span className="text-sm font-semibold" style={{ color: '#374151' }}>Final Review Links</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: '#EDE9FE', color: '#5B5FC7' }}>{reviewLinks.length} Links</span>
                    </div>
                    <div className="flex flex-col gap-3 overflow-y-auto pr-2" style={{ maxHeight: '260px' }}>
                        {reviewLinks.length === 0 ? (
                            <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm" style={{ borderColor: '#E5E7EB', color: '#9CA3AF' }}>
                                No approved review links available for this project yet.
                            </div>
                        ) : reviewLinks.map((link) => (
                            <a key={link.id} href={link.upload_link} target="_blank" rel="noopener noreferrer" 
                                className="flex items-center justify-between p-3 rounded-xl border border-dashed transition-colors hover:bg-gray-50 flex-shrink-0"
                                style={{ borderColor: '#E5E7EB' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{link.project_type}</p>
                                        <p className="text-xs text-blue-500 hover:underline">View on Drive</p>
                                    </div>
                                </div>
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        ))}
                    </div>

                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid #F3F4F6' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <RefreshCw size={13} style={{ color: '#6B7280' }} />
                            <span className="text-sm font-semibold" style={{ color: '#111827' }}>Rework Notes (if needed)</span>
                        </div>
                        <textarea
                            value={reworkNotes}
                            onChange={(e) => setReworkNotes(e.target.value)}
                            className="w-full rounded-xl p-3 text-sm outline-none resize-none"
                            rows={3} style={{ border: '1px solid #E5E7EB', background: '#fff' }}
                            placeholder="Provide detailed instructions for corrections needed"
                        />
                    </div>
                </div>

                {/* Right: Review Checklist */}
                <div className="crm-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">☑</span>
                            <span className="text-sm font-semibold" style={{ color: '#111827' }}>Review Checklist</span>
                        </div>
                        <button 
                            onClick={() => setChecked(checked.length === checklist.length ? [] : checklist.map((_, i) => i))}
                            className="text-xs font-semibold px-2 py-1 rounded transition-colors hover:bg-indigo-50"
                            style={{ color: '#5B5FC7' }}>
                            {checked.length === checklist.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                    <div className="flex flex-col gap-3 mb-5">
                        {checklist.map((item, i) => (
                            <label key={i} className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={checked.includes(i)} onChange={() => toggle(i)}
                                    style={{ marginTop: '3px' }} />
                                <div>
                                    <div className="text-sm font-medium" style={{ color: '#111827' }}>{item.label}</div>
                                    <div className="text-xs" style={{ color: '#9CA3AF' }}>{item.desc}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                    <div>
                        <div className="flex items-center justify-between text-xs mb-2" style={{ color: '#6B7280' }}>
                            <span>Progress</span><span>{progress}/6</span>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: '#F3F4F6' }}>
                            <div className="h-2 rounded-full" style={{ width: `${(progress / 6) * 100}%`, background: '#5B5FC7', transition: 'width 0.3s' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom actions */}
            <div className="flex justify-end gap-3 mt-5 relative">
                <button className="crm-card px-5 py-2.5 text-sm font-medium" style={{ color: '#374151' }}>Cancel</button>

                {/* Reassign flow */}
                <div className="relative">
                    <button
                        onClick={() => setShowReassign(true)}
                        className="crm-card flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors"
                        style={{ color: '#374151', background: showReassign ? '#f3f4f6' : '#fff' }}
                    >
                        <Users size={14} /> {assignedTo ? `Reassign (${assignedTo})` : 'Reassign'}
                    </button>

                    {showReassign && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(17, 24, 39, 0.4)' }}>
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                                <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: '#E5E7EB' }}>
                                    <div>
                                        <h3 className="text-lg font-bold" style={{ color: '#111827' }}>Reassign Task</h3>
                                        <p className="text-xs text-gray-500 mt-1">Select specific editors for each type of deliverable</p>
                                    </div>
                                    <button onClick={() => setShowReassign(false)} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-xl">
                                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-6 grid grid-cols-2 gap-4 bg-gray-50/50">
                                    {['Save the Date', 'Save the Video', 'Candid', 'Retouching'].map((role) => (
                                        <div key={role} className="p-4 rounded-xl border bg-white flex flex-col gap-3 shadow-sm" style={{ borderColor: '#E5E7EB' }}>
                                            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#374151' }}>
                                                <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                    <Users size={12} />
                                                </div>
                                                {role} Editor
                                            </div>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    list={`editors-${role.replace(/\s+/g, '-')}`} 
                                                    placeholder={`Select ${role} editor...`}
                                                    className="text-sm w-full pl-3 pr-8 py-2.5 rounded-lg border outline-none transition-colors"
                                                    style={{ borderColor: '#E5E7EB', color: '#111827' }}
                                                    onFocus={(e) => e.target.style.borderColor = '#5B5FC7'}
                                                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                                                />
                                                <datalist id={`editors-${role.replace(/\s+/g, '-')}`}>
                                                    {mockEmployees.map(emp => (
                                                        <option key={emp.id} value={emp.name}>{emp.role}</option>
                                                    ))}
                                                    <option value="Suresh Kumar">External Freelancer</option>
                                                    <option value="Anita Desai">Lead Editor</option>
                                                </datalist>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 border-t flex justify-end gap-3 bg-white" style={{ borderColor: '#E5E7EB' }}>
                                    <button 
                                        onClick={() => setShowReassign(false)} 
                                        className="px-5 py-2.5 text-sm font-semibold rounded-xl border text-gray-700 hover:bg-gray-50 transition-colors"
                                        style={{ borderColor: '#E5E7EB' }}>
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={async () => { 
                                            // Call backend to trigger tracker step 9
                                            try {
                                                await axios.post(`${import.meta.env.VITE_API_URL}/api/crm/assign-editors/${selectedClient?.id}`)
                                                setAssignedTo('Multiple Editors'); 
                                                setShowReassign(false); 
                                                toast.success('Editors assigned successfully.'); 
                                            } catch (err) {
                                                console.error("Assign editors error", err)
                                            }
                                        }} 
                                        className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-opacity hover:opacity-90" 
                                        style={{ background: '#5B5FC7' }}>
                                        Confirm Reassignment
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleApproveAndAdvance}
                    disabled={isApproved || approving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium text-white transition-opacity disabled:opacity-50"
                    style={{ background: changeStatus === 'client_approved' ? '#059669' : isApproved ? '#10b981' : '#5B5FC7' }}
                >
                    {changeStatus === 'client_approved' ? <><CheckCircle2 size={16} /> Phase Advanced</> :
                        approving ? <><RefreshCw size={16} /> Approving...</> :
                            <>✓ Approve & Move to Next Phase</>}
                </button>
            </div>
        </div>
        )
    }

    return (
        <div>
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Final Approval Queue</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Manage projects awaiting final quality check</p>
                </div>
                <button 
                    onClick={handleDownloadReport}
                    className="crm-card flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" 
                    style={{ color: '#6B7280' }}
                    disabled={filtered.length === 0}
                >
                    <Download size={14} /> Download report
                </button>
            </div>

            {/* Search + Filter bar */}
            <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 flex-1"
                    style={{ background: '#F0EFFE', border: '1px solid #E0DFFE' }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2}>
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input type="text" placeholder="Search by client name or ID..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="bg-transparent outline-none text-sm flex-1" style={{ color: '#374151' }} />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: '#F0EFFE', border: '1px solid #E0DFFE', color: '#5B5FC7', cursor: 'pointer' }}>
                    <input type="date" className="bg-transparent outline-none flex-1 font-medium" value={eventDateSearch} onChange={(e) => setEventDateSearch(e.target.value)} />
                </div>
                <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm"
                    style={{ background: '#F0EFFE', border: '1px solid #E0DFFE', color: '#5B5FC7' }}>
                    <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-transparent outline-none font-medium text-[#5B5FC7] cursor-pointer"
                    >
                        <option value="">All Types</option>
                        <option value="Wedding">Wedding</option>
                        <option value="Corporate">Corporate</option>
                        <option value="Maternity">Maternity</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="crm-table-wrap">
                <table className="w-full">
                    <thead>
                        <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                            {['Lead ID', 'Client Name', 'E-mail ID', 'Event date', 'Event type', 'Review Status', 'Action'].map(h => (
                                <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="text-center px-5 py-12 text-sm" style={{ color: '#9CA3AF' }}>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                        <span>Loading approval queue...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center px-5 py-12 text-sm" style={{ color: '#9CA3AF' }}>
                                    <span>No clients found awaiting approval</span>
                                </td>
                            </tr>
                        ) : filtered.map((c, i) => (
                            <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}>
                                <td className="px-5 py-3 text-sm font-medium" style={{ color: '#5B5FC7' }}>{c.serialNumber || c.id}</td>
                                <td className="px-5 py-3 text-sm" style={{ color: '#111827' }}>
                                    <span className="hover:underline" style={{ color: '#5B5FC7', cursor: 'pointer' }} onClick={() => handleOpenClient(c)}>
                                        {c.name}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-sm" style={{ color: '#6B7280' }}>{c.email}</td>
                                <td className="px-5 py-3 text-sm" style={{ color: '#111827' }}>{c.eventDate}</td>
                                <td className="px-5 py-3 text-sm" style={{ color: '#111827' }}>{c.shootType}</td>
                                <td className="px-5 py-3"><Badge status="Pending Review" /></td>
                                <td className="px-5 py-3">
                                    <div className="flex gap-3" style={{ color: '#9CA3AF' }}>
                                        <button onClick={() => handleOpenClient(c)} className="hover:text-indigo-600 transition-colors">
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
