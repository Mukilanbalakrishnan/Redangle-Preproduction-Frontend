import { useState, useEffect } from 'react'
import { Briefcase, RotateCcw, ExternalLink, AlertCircle, CheckCircle, Eye, ArrowLeft, Search, User, CalendarDays, MapPin, Palette, Shirt, FileText } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

/* ───── Types ───── */
interface Lead {
    lead_employee_id: number
    lead_id: number
    lead_code: string
    name: string
    type: string
    task_name: string
    priority: string
    deadline: string
    description: string
    flow_stage?: string
    request_source?: string
    stage_path?: string
    accepted?: boolean
    upload_link?: string
    upload_notes?: string
    admin_notes?: string
    status?: string
}

interface EventDetails {
    client_name: string
    email: string
    phone: string
    contact_person_name: string
    contact_person_number: string
    event_type: string
    event_location: string
    preferred_date: string
    preferred_time: string
    budget_range: string
    priority_level: string
    services: string[]
    deliverables: string[]
    meeting_type: string
    meeting_details: string
    client_requirements: string
}

interface CreativeDetails {
    costume_type: string
    color_preferences: string[]
    costume_requirements: string
    event_theme: string
    mood_description: string
    location_name: string
    location_type: string
    google_map_link: string
    reference_images: string[]
    client_approved: boolean
}

interface EmployeeTaskPageProps {
    title: string
    icon: React.ReactNode
    filterType?: string
}

/* ───── Helpers ───── */
const getPriorityStyle = (p: string) => {
    switch (p?.toLowerCase()) {
        case 'high': return 'bg-red-50 text-red-700'
        case 'medium': return 'bg-orange-50 text-orange-700'
        case 'low': return 'bg-green-50 text-green-700'
        default: return 'bg-gray-50 text-gray-600'
    }
}

const getStageStyle = (stage?: string) => {
    const normalized = (stage || '').toLowerCase()
    if (normalized.includes('event')) return 'bg-blue-50 text-blue-700 border-blue-100'
    if (normalized.includes('pre-production')) return 'bg-purple-50 text-purple-700 border-purple-100'
    return 'bg-gray-50 text-gray-600 border-gray-100'
}

const formatDate = (d: string) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) }
    catch { return d }
}

const normalizeRoleKey = (role?: string) =>
    (role || '').toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()

const getSubmissionState = (data: Partial<Lead> | any, role?: string) => {
    const normalizedRole = normalizeRoleKey(role)

    if (normalizedRole === 'save the date') {
        const uploadLink = data?.save_the_date_drive_link || data?.upload_link || ''
        const uploadNotes = data?.save_the_date_upload_notes || data?.upload_notes || ''
        const status = data?.save_the_date_submission_status || data?.status || (uploadLink ? 'Submitted' : '')
        return { uploadLink, uploadNotes, status, isSubmitted: status.toLowerCase() === 'submitted' || !!uploadLink }
    }

    if (normalizedRole === 'retouch') {
        const uploadLink = data?.retouch_drive_link || data?.upload_link || ''
        const uploadNotes = data?.retouch_upload_notes || data?.upload_notes || ''
        const status = data?.retouch_submission_status || data?.status || (uploadLink ? 'Submitted' : '')
        return { uploadLink, uploadNotes, status, isSubmitted: status.toLowerCase() === 'submitted' || !!uploadLink }
    }

    if (normalizedRole === 'save the video') {
        const uploadLink = data?.save_the_video_drive_link || data?.upload_link || ''
        const uploadNotes = data?.save_the_video_upload_notes || data?.upload_notes || ''
        const status = data?.save_the_video_submission_status || data?.status || (uploadLink ? 'Submitted' : '')
        return { uploadLink, uploadNotes, status, isSubmitted: status.toLowerCase() === 'submitted' || !!uploadLink }
    }

    const uploadLink = data?.upload_link || data?.drive_link || ''
    const uploadNotes = data?.upload_notes || ''
    const status = data?.status || (uploadLink ? 'Submitted' : '')
    return { uploadLink, uploadNotes, status, isSubmitted: status.toLowerCase() === 'submitted' || !!uploadLink }
}

/* ───── Component ───── */
export default function EmployeeTaskPage({ title, icon, filterType }: EmployeeTaskPageProps) {
    const [view, setView] = useState<'list' | 'detail'>('list')
    const [leads, setLeads] = useState<Lead[]>([])
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    const [activeTab, setActiveTab] = useState<'client-details' | 'submit-work' | 'rework'>('client-details')

    // Client detail data
    const [eventDetails, setEventDetails] = useState<EventDetails | null>(null)
    const [creativeDetails, setCreativeDetails] = useState<CreativeDetails | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)

    // Submit work form
    const [driveLink, setDriveLink] = useState('')
    const [uploadNotes, setUploadNotes] = useState('')
    const [uploadSuccess, setUploadSuccess] = useState(false)

    /* ── Data Fetch ── */
    useEffect(() => {
        const raw = localStorage.getItem('ra_user')
        if (!raw) { setLoading(false); return }
        const user = JSON.parse(raw)
        const empId = user?.employee_id
        if (!empId) { setLoading(false); return }

        fetch(`${API_URL}/employee/${empId}/assigned-projects`)
            .then(r => r.json())
            .then(result => {
                if (result.success) {
                    let data: Lead[] = result.data || []
                    if (filterType) {
                        data = data.filter((p: Lead) => {
                            const task = (p.task_name || '').toLowerCase();
                            const type = filterType.toLowerCase();
                            return task.includes(type) || task.includes('additional staff') || task.includes('additional-staff');
                        })
                    }
                    setLeads(data)
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [filterType])

    const filtered = leads.filter(l =>
        (l.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.lead_code || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.type || '').toLowerCase().includes(search.toLowerCase())
    )

    /* ── Fetch Client Details ── */
    const fetchClientDetails = async (leadId: number | string, taskName?: string) => {
        setDetailLoading(true)
        try {
            const eventRes = await axios.get(`${API_URL}/event-details/${leadId}`)
            const eventData = eventRes.data?.data || eventRes.data
            const submission = getSubmissionState(eventData, filterType)

            setDriveLink(submission.uploadLink)
            setUploadNotes(submission.uploadNotes)
            setUploadSuccess(submission.isSubmitted)
            setSelectedLead(prev => prev ? {
                ...prev,
                upload_link: submission.uploadLink || prev.upload_link,
                upload_notes: submission.uploadNotes || prev.upload_notes,
                status: submission.status || prev.status
            } : prev)

            if (eventData?.client_name) {
                let services = eventData.services || []
                if (typeof services === 'string') try { services = JSON.parse(services) } catch { /* */ }
                let deliverables = eventData.deliverables || []
                if (typeof deliverables === 'string') try { deliverables = JSON.parse(deliverables) } catch { /* */ }
                setEventDetails({
                    client_name: eventData.client_name || '',
                    email: eventData.email || '',
                    phone: eventData.phone || '',
                    contact_person_name: eventData.contact_person_name || '',
                    contact_person_number: eventData.contact_person_number || '',
                    event_type: eventData.event_type || '',
                    event_location: eventData.event_location || '',
                    preferred_date: eventData.preferred_date || '',
                    preferred_time: eventData.preferred_time || '',
                    budget_range: eventData.budget_range || '',
                    priority_level: eventData.priority_level || '',
                    services: Array.isArray(services) ? services : [],
                    deliverables: Array.isArray(deliverables) ? deliverables : [],
                    meeting_type: eventData.meeting_type || '',
                    meeting_details: eventData.meeting_details || '',
                    client_requirements: eventData.client_requirements || ''
                })
            }
        } catch (err) { console.error('Event details fetch failed', err) }

        try {
            const creativeRes = await axios.get(`${API_URL}/creative-confirmation/${leadId}`)
            const cData = creativeRes.data?.data
            if (cData) {
                let colors = cData.color_preferences || []
                if (typeof colors === 'string') try { colors = JSON.parse(colors) } catch { /* */ }
                setCreativeDetails({
                    costume_type: cData.costume_type || '',
                    color_preferences: Array.isArray(colors) ? colors : [],
                    costume_requirements: cData.costume_requirements || '',
                    event_theme: cData.event_theme || '',
                    mood_description: cData.mood_description || '',
                    location_name: cData.location_name || '',
                    location_type: cData.location_type || '',
                    google_map_link: cData.google_map_link || '',
                    reference_images: cData.reference_images || [],
                    client_approved: cData.client_approved || false
                })
            }
        } catch (err) { console.error('Creative details fetch failed', err) }

        try {
            const statusRes = await axios.get(`${API_URL}/assign-team/${leadId}/status`)
            if (statusRes.data?.success && statusRes.data.data && Array.isArray(statusRes.data.data.accepted_assignments)) {
                const userRaw = localStorage.getItem('ra_user')
                const user = userRaw ? JSON.parse(userRaw) : null
                if (user) {
                    const numericId = parseInt(String(user.employee_id).replace(/\D/g, ''), 10)
                    const currentTaskName = taskName || selectedLead?.task_name || ''
                    const taskKey = currentTaskName
                        .toLowerCase()
                        .replace(/[_-]+/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '')
                    const assignmentKey = `${numericId}:${taskKey}`
                    const isNowAccepted = statusRes.data.data.accepted_assignments.includes(assignmentKey)
                    setSelectedLead(prev => prev ? { ...prev, accepted: isNowAccepted } : null)
                    setLeads(prev => prev.map(l => l.lead_id === Number(leadId) ? { ...l, accepted: isNowAccepted } : l))
                }
            }
        } catch (err) { console.error("Assignment status fetch failed", err) }

        setDetailLoading(false)
    }

    /* ── Actions ── */
    const handleViewLead = (lead: Lead) => {
        const submission = getSubmissionState(lead, filterType)
        setSelectedLead(lead)
        setActiveTab('client-details')
        setView('detail')
        setDriveLink(submission.uploadLink)
        setUploadNotes(submission.uploadNotes)
        setUploadSuccess(submission.isSubmitted)
        setEventDetails(null)
        setCreativeDetails(null)
        fetchClientDetails(lead.lead_id, lead.task_name)
    }

    const handleBackToList = () => {
        setView('list')
        setSelectedLead(null)
        setActiveTab('client-details')
    }

    const handleAccept = async (lead: Lead) => {
        try {
            const raw = localStorage.getItem('ra_user')
            const user = raw ? JSON.parse(raw) : null
            const empCode = user?.employee_id
            const numericId = parseInt((empCode || '').replace(/\D/g, ''), 10)
            await fetch(`${API_URL}/assign-team/${lead.lead_id}/accept`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: numericId, taskName: lead.task_name })
            })
            const updatedLead = { ...lead, accepted: true }
            setLeads(prev => prev.map(l => l.lead_employee_id === lead.lead_employee_id ? updatedLead : l))
            setSelectedLead(updatedLead)
        } catch (err) {
            console.error('Accept error:', err)
        }
    }

    const handleSubmitWork = async () => {
        if (!selectedLead || !driveLink) return
        try {
            const response = await fetch(`${API_URL}/event-details/${selectedLead.lead_id}/upload`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    drive_link: driveLink,
                    upload_notes: uploadNotes,
                    uploader_role: filterType || 'employee'
                })
            })
            const result = await response.json()
            if (!response.ok || !result?.success) {
                throw new Error(result?.message || 'Failed to submit work')
            }

            const submission = getSubmissionState(result.data, filterType)
            const updatedLead = {
                ...selectedLead,
                upload_link: submission.uploadLink || driveLink,
                upload_notes: submission.uploadNotes || uploadNotes,
                status: submission.status || 'Submitted'
            }

            setUploadSuccess(true)
            setSelectedLead(updatedLead)
            setLeads(prev => prev.map(l => l.lead_id === selectedLead.lead_id ? { ...l, ...updatedLead } : l))
        } catch (err) {
            console.error('Submit work error:', err)
        }
    }

    /* ═══════════════════════════════════════════
       LIST VIEW
    ═══════════════════════════════════════════ */
    if (view === 'list') {
        return (
            <div>
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            {icon} {title}
                        </h1>
                        <p className="text-sm text-gray-500">Manage your {title.toLowerCase()} assignments</p>
                    </div>
                </div>

                <div className="relative mb-4 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name, code, or type..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-100"
                    />
                </div>

                {loading ? (
                    <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
                ) : filtered.length === 0 ? (
                    <p className="text-sm text-gray-400 py-8 text-center bg-white rounded-xl border border-gray-100">No assigned projects</p>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Lead Code</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Client</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Request Stage</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Task</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Event Type</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Deadline</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Priority</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(lead => (
                                    <tr key={lead.lead_employee_id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 font-medium text-amber-600">{lead.lead_code || `LD-${lead.lead_id}`}</td>
                                        <td className="px-4 py-3 text-gray-900">{lead.name}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStageStyle(lead.flow_stage)}`}>
                                                {lead.flow_stage || 'Workflow'}
                                            </span>
                                            <p className="mt-1 text-[11px] text-gray-400">{lead.request_source || 'Assignment'}</p>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{lead.task_name}</td>
                                        <td className="px-4 py-3 text-gray-600">{lead.type}</td>
                                        <td className="px-4 py-3 text-gray-600">{lead.deadline ? formatDate(lead.deadline) : '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getPriorityStyle(lead.priority)}`}>
                                                {lead.priority || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {lead.accepted ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700">
                                                    <CheckCircle size={12} /> Accepted
                                                </span>
                                            ) : (
                                                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-50 text-yellow-700">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleViewLead(lead)}
                                                className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 px-3 py-1.5 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                                            >
                                                <Eye size={13} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )
    }

    /* ═══════════════════════════════════════════
       DETAIL VIEW
    ═══════════════════════════════════════════ */
    if (!selectedLead) return null

    const detailTabs = [
        { id: 'client-details' as const, label: 'Client Details', icon: Eye },
        { id: 'submit-work' as const, label: 'Submit Work', icon: Briefcase },
        { id: 'rework' as const, label: 'Rework', icon: RotateCcw },
    ]

    /* ── Render Client Details ── */
    const renderClientDetails = () => {
        if (detailLoading) {
            return <p className="text-sm text-gray-400 py-8 text-center">Loading client details...</p>
        }

        return (
            <div className="space-y-6">
                {/* Client Information */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <User size={16} className="text-gray-500" />
                        <h3 className="text-sm font-bold text-gray-900">Client Information</h3>
                        {selectedLead.accepted && (
                            <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700">
                                <CheckCircle size={12} /> Accepted
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Lead ID', val: selectedLead.lead_code || `LD-${selectedLead.lead_id}` },
                            { label: 'Client Name', val: eventDetails?.client_name || selectedLead.name },
                            { label: 'Email', val: eventDetails?.email || '—' },
                            { label: 'Phone', val: eventDetails?.phone || '—' },
                            { label: 'Contact Person', val: eventDetails?.contact_person_name || '—' },
                            { label: 'Contact Number', val: eventDetails?.contact_person_number || '—' },
                        ].map(({ label, val }) => (
                            <div key={label} className="bg-gray-50 rounded-lg p-3">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{label}</p>
                                <p className="text-sm font-semibold text-gray-900">{val || '—'}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Event Details */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarDays size={16} className="text-gray-500" />
                        <h3 className="text-sm font-bold text-gray-900">Event Details</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        {[
                            { label: 'Event Type', val: eventDetails?.event_type || selectedLead.type },
                            { label: 'Event Date', val: formatDate(eventDetails?.preferred_date || selectedLead.deadline) },
                            { label: 'Event Time', val: eventDetails?.preferred_time || '—' },
                            { label: 'Outdoor Location', val: eventDetails?.event_location || '—' },
                            { label: 'Priority Level', val: eventDetails?.priority_level || selectedLead.priority || '—' },
                            { label: 'Meeting Type', val: eventDetails?.meeting_type || '—' },
                            { label: 'Your Role', val: selectedLead.task_name || '—' },
                        ].map(({ label, val }) => (
                            <div key={label} className="bg-gray-50 rounded-lg p-3">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{label}</p>
                                <p className="text-sm font-semibold text-gray-900">{val || '—'}</p>
                            </div>
                        ))}
                    </div>

                    {/* Services */}
                    {eventDetails?.services && eventDetails.services.length > 0 && (
                        <div className="mb-3">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Services</p>
                            <div className="flex flex-wrap gap-2">
                                {eventDetails.services.map((s, i) => (
                                    <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Deliverables */}
                    {eventDetails?.deliverables && eventDetails.deliverables.length > 0 && (
                        <div className="mb-3">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Deliverables</p>
                            <div className="flex flex-wrap gap-2">
                                {eventDetails.deliverables.map((d, i) => (
                                    <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">{d}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Meeting Details */}
                    {eventDetails?.meeting_details && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Meeting Details</p>
                            <p className="text-sm text-gray-700">{eventDetails.meeting_details}</p>
                        </div>
                    )}
                </div>

                {/* Client Requirements */}
                {eventDetails?.client_requirements && (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText size={16} className="text-gray-500" />
                            <h3 className="text-sm font-bold text-gray-900">Client Requirements</h3>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">{eventDetails.client_requirements}</p>
                    </div>
                )}

                {/* Creative Confirmation - Costume & Concept */}
                {creativeDetails && (
                    <div className="grid grid-cols-2 gap-6">
                        {/* Costume Details */}
                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Shirt size={16} className="text-gray-500" />
                                <h3 className="text-sm font-bold text-gray-900">Costume Details</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Costume Type</p>
                                    <p className="text-sm font-semibold text-gray-900">{creativeDetails.costume_type || '—'}</p>
                                </div>
                                {creativeDetails.color_preferences.length > 0 && (
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Color Preferences</p>
                                        <div className="flex flex-wrap gap-2">
                                            {creativeDetails.color_preferences.map((c, i) => (
                                                <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {creativeDetails.costume_requirements && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Special Requirements</p>
                                        <p className="text-sm text-gray-700">{creativeDetails.costume_requirements}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Concept Details */}
                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Palette size={16} className="text-gray-500" />
                                <h3 className="text-sm font-bold text-gray-900">Concept Details</h3>
                                {creativeDetails.client_approved && (
                                    <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                                        <CheckCircle size={10} /> Client Approved
                                    </span>
                                )}
                            </div>
                            <div className="space-y-3">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Event Theme</p>
                                    <p className="text-sm font-semibold text-gray-900">{creativeDetails.event_theme || '—'}</p>
                                </div>
                                {creativeDetails.mood_description && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Mood Description</p>
                                        <p className="text-sm text-gray-700">{creativeDetails.mood_description}</p>
                                    </div>
                                )}
                                {creativeDetails.reference_images && creativeDetails.reference_images.length > 0 && (
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Reference Images</p>
                                        <div className="flex flex-wrap gap-2">
                                            {creativeDetails.reference_images.map((img, i) => (
                                                <img key={i} src={`${API_URL?.replace('/api', '')}/uploads/${img}`} alt={`ref-${i}`}
                                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Location Details */}
                {creativeDetails && (creativeDetails.location_name || creativeDetails.location_type) && (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin size={16} className="text-gray-500" />
                            <h3 className="text-sm font-bold text-gray-900">Location Details</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Location Name</p>
                                <p className="text-sm font-semibold text-gray-900">{creativeDetails.location_name || '—'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Location Type</p>
                                <p className="text-sm font-semibold text-gray-900">{creativeDetails.location_type || '—'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Google Map</p>
                                {creativeDetails.google_map_link ? (
                                    <a href={creativeDetails.google_map_link} target="_blank" rel="noreferrer"
                                        className="text-sm font-semibold text-blue-600 hover:underline truncate block">
                                        View on Map ↗
                                    </a>
                                ) : (
                                    <p className="text-sm font-semibold text-gray-900">—</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    /* ── Render Submit Work ── */
    const renderSubmitWork = () => {
        if (uploadSuccess) {
            return (
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                    <CheckCircle size={40} className="text-green-600 mx-auto mb-3" />
                    <p className="text-green-700 font-semibold text-lg">Work submitted successfully!</p>
                    <p className="text-green-600 text-sm mt-1">Your submission has been recorded</p>
                    {selectedLead.upload_link && (
                        <a
                            href={selectedLead.upload_link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:underline"
                        >
                            <ExternalLink size={14} /> Open submitted link
                        </a>
                    )}
                    {selectedLead.upload_notes && (
                        <p className="mt-3 text-sm text-green-700">{selectedLead.upload_notes}</p>
                    )}
                </div>
            )
        }

        return (
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-1">Submit Work</h3>
                <p className="text-sm text-gray-500 mb-5">{selectedLead.name} — {selectedLead.task_name}</p>

                {selectedLead.upload_link && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5">
                        <p className="text-xs font-semibold text-blue-700 mb-1">Previously Submitted:</p>
                        <a href={selectedLead.upload_link} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            <ExternalLink size={12} /> {selectedLead.upload_link}
                        </a>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Google Drive Link *</label>
                        <input
                            value={driveLink} onChange={e => setDriveLink(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-100"
                            placeholder="https://drive.google.com/..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes (optional)</label>
                        <textarea
                            value={uploadNotes} onChange={e => setUploadNotes(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-100"
                            rows={3}
                            placeholder="Any additional notes about your work..."
                        />
                    </div>
                    <button
                        onClick={handleSubmitWork}
                        disabled={!driveLink}
                        className="px-6 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Submit Work
                    </button>
                </div>
            </div>
        )
    }

    /* ── Render Rework ── */
    const renderRework = () => {
        if (!selectedLead.admin_notes && selectedLead.status?.toLowerCase() !== 'rework') {
            return (
                <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm text-center">
                    <RotateCcw size={32} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No rework requests for this assignment</p>
                </div>
            )
        }

        return (
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={16} className="text-red-600" />
                        <p className="text-sm font-semibold text-red-700">Rework Required</p>
                    </div>
                    {selectedLead.admin_notes && (
                        <p className="text-sm text-red-600"><strong>Admin Notes:</strong> {selectedLead.admin_notes}</p>
                    )}
                </div>

                <h3 className="text-sm font-bold text-gray-900 mb-3">Re-submit your work</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Updated Drive Link *</label>
                        <input
                            value={driveLink} onChange={e => setDriveLink(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-100"
                            placeholder="https://drive.google.com/..."
                        />
                    </div>
                    <button
                        onClick={handleSubmitWork}
                        disabled={!driveLink}
                        className="px-6 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Re-submit Work
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div>
            {/* Header with back button */}
            <div className="flex items-center gap-3 mb-5">
                <button
                    onClick={handleBackToList}
                    className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                    title="Back to list"
                >
                    <ArrowLeft size={16} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {icon} {selectedLead.name}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {selectedLead.lead_code || `LD-${selectedLead.lead_id}`} • {selectedLead.type} • {selectedLead.task_name}
                    </p>
                </div>
                <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full ${getPriorityStyle(selectedLead.priority)}`}>
                    {selectedLead.priority || '—'}
                </span>
            </div>

            <div className="mb-5 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getStageStyle(selectedLead.flow_stage)}`}>
                        {selectedLead.flow_stage || 'Workflow Stage'}
                    </span>
                    <p className="text-sm font-semibold text-gray-900">
                        Request from {selectedLead.request_source || 'assignment flow'}
                    </p>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                    {selectedLead.stage_path || `${selectedLead.type} -> ${selectedLead.task_name}`}
                </p>
            </div>

            {/* If NOT accepted — show assignment details + accept button */}
            {!selectedLead.accepted ? (
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-base font-bold text-gray-900 mb-4">Assignment Details</h3>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Lead ID</p>
                            <p className="text-sm font-semibold text-gray-900">{selectedLead.lead_code || `LD-${selectedLead.lead_id}`}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Event Type</p>
                            <p className="text-sm font-semibold text-gray-900">{selectedLead.type}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Deadline</p>
                            <p className="text-sm font-semibold text-gray-900">{selectedLead.deadline ? formatDate(selectedLead.deadline) : '—'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Your Role</p>
                            <p className="text-sm font-semibold text-gray-900">{selectedLead.task_name}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Request Stage</p>
                            <p className="text-sm font-semibold text-gray-900">{selectedLead.flow_stage || '—'}</p>
                        </div>
                    </div>
                    {selectedLead.description && (
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-4">{selectedLead.description}</p>
                    )}
                    <button
                        onClick={() => handleAccept(selectedLead)}
                        className="px-6 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
                    >
                        ✓ Accept Assignment
                    </button>
                </div>
            ) : (
                /* ACCEPTED — show tabs */
                <>
                    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
                        {detailTabs.map(tab => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                            ? 'bg-white text-amber-700 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon size={14} />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    {activeTab === 'client-details' && renderClientDetails()}
                    {activeTab === 'submit-work' && renderSubmitWork()}
                    {activeTab === 'rework' && renderRework()}
                </>
            )}
        </div>
    )
}
