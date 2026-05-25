import { useState, useEffect } from 'react'
import { Upload, RotateCcw, Search, Eye, Camera, ArrowLeft, CheckCircle, User, CalendarDays, MapPin, Palette, Shirt, FileText } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

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
    work_saved?: boolean
    upload_complete?: boolean
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
    drive_link?: string
    camera_used?: string
    num_images?: number
    upload_notes?: string
    photo_delivery_method?: string
    photo_hard_disk_delivery_date?: string
    photo_upload_phase?: string
    event_status?: string
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

const isPhotographerTask = (taskName?: string) => {
    const normalized = (taskName || '').toLowerCase()
    return normalized.includes('photography') || normalized.includes('photographer') || normalized.includes('additional staff') || normalized.includes('additional-staff')
}

const getAssignmentPhase = (stage?: string) => {
    const normalized = (stage || '').toLowerCase()
    if (normalized.includes('event')) return 'event'
    if (normalized.includes('pre-production')) return 'pre_production'
    return ''
}

export default function PhotographerAssignedClient() {
    const [view, setView] = useState<'list' | 'detail'>('list')
    const [leads, setLeads] = useState<Lead[]>([])
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    const [activeTab, setActiveTab] = useState<'client-details' | 'my-work' | 'upload' | 'rework'>('client-details')

    // Client detail data
    const [eventDetails, setEventDetails] = useState<EventDetails | null>(null)
    const [creativeDetails, setCreativeDetails] = useState<CreativeDetails | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [shootLocations, setShootLocations] = useState<any[]>([])

    // Upload form state
    const [driveLink, setDriveLink] = useState('')
    const [deliveryMethod, setDeliveryMethod] = useState<'drive_link' | 'hard_disk'>('drive_link')
    const [hardDiskDeliveryDate, setHardDiskDeliveryDate] = useState('')
    const [cameraUsed, setCameraUsed] = useState('')
    const [numImages, setNumImages] = useState('')
    const [uploadNotes, setUploadNotes] = useState('')
    const [uploadSuccess, setUploadSuccess] = useState(false)

    // Removed timer states and effects

    useEffect(() => {
        const raw = localStorage.getItem('ra_user')
        if (!raw) return
        const user = JSON.parse(raw)
        const empId = user?.employee_id
        if (!empId) return

        fetch(`${API_URL}/employee/${empId}/assigned-projects`)
            .then(r => r.json())
            .then(result => {
                if (result.success) {
                    setLeads((result.data || []).filter((lead: Lead) => {
                        return isPhotographerTask(lead.task_name)
                    }))
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const filtered = leads.filter(l =>
        l.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.lead_code?.toLowerCase().includes(search.toLowerCase()) ||
        l.type?.toLowerCase().includes(search.toLowerCase())
    )

    // Fetch full client details when entering detail view
    const fetchClientDetails = async (leadId: number | string, flowStage?: string, taskName?: string) => {
        setDetailLoading(true)
        try {
            // Fetch event details
            const eventRes = await axios.get(`${API_URL}/event-details/${leadId}`)
            const eventData = eventRes.data?.data || eventRes.data
            if (eventData && eventData.client_name) {
                let services = eventData.services || []
                if (typeof services === 'string') try { services = JSON.parse(services) } catch { }
                let deliverables = eventData.deliverables || []
                if (typeof deliverables === 'string') try { deliverables = JSON.parse(deliverables) } catch { }

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
                    client_requirements: eventData.client_requirements || '',
                    event_status: eventData.event_status || ''
                })

                const existingLink = eventData.drive_link || ''
                const existingDeliveryMethod = eventData.photo_delivery_method || (eventData.photo_hard_disk_delivery_date ? 'hard_disk' : 'drive_link')
                const existingHardDiskDate = eventData.photo_hard_disk_delivery_date || ''
                const uploadPhase = eventData.photo_upload_phase || ''
                const assignmentPhase = getAssignmentPhase(flowStage || selectedLead?.flow_stage)
                const linkBelongsToAssignment = Boolean(existingLink) && (!uploadPhase || !assignmentPhase || uploadPhase === assignmentPhase)
                const hardDiskBelongsToAssignment = Boolean(existingHardDiskDate) && Boolean(uploadPhase) && (!assignmentPhase || uploadPhase === assignmentPhase)
                const existingCamera = eventData.camera_used || ''
                const existingImages = eventData.num_images || 0
                const existingNotes = eventData.upload_notes || ''
                if (linkBelongsToAssignment || hardDiskBelongsToAssignment) {
                    setDeliveryMethod(existingDeliveryMethod === 'hard_disk' ? 'hard_disk' : 'drive_link')
                    setDriveLink(linkBelongsToAssignment ? existingLink : '')
                    setHardDiskDeliveryDate(hardDiskBelongsToAssignment && existingHardDiskDate ? String(existingHardDiskDate).slice(0, 10) : '')
                    setCameraUsed(existingCamera)
                    setNumImages(String(existingImages))
                    setUploadNotes(existingNotes)
                    setUploadSuccess(true)
                }
            }
        } catch (err) { console.error("Event details fetch failed", err) }

        try {
            // Fetch creative confirmation
            const creativeRes = await axios.get(`${API_URL}/creative-confirmation/${leadId}`)
            const cData = creativeRes.data?.data
            if (cData) {
                let colors = cData.color_preferences || []
                if (typeof colors === 'string') try { colors = JSON.parse(colors) } catch { }
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
        } catch (err) { console.error("Creative details fetch failed", err) }

        try {
            const assignRes = await axios.get(`${API_URL}/assign-team/${leadId}`)
            const aData = assignRes.data?.data || assignRes.data
            if (aData) {
                setShootLocations(aData.shoot_locations || [])
            }
        } catch (err) { console.error("Assign team details fetch failed", err) }

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

    const handleViewLead = (lead: Lead) => {
        setSelectedLead(lead)
        setActiveTab('client-details')
        setView('detail')
        setDriveLink('')
        setDeliveryMethod('drive_link')
        setHardDiskDeliveryDate('')
        setCameraUsed('')
        setNumImages('')
        setUploadNotes('')
        setUploadSuccess(false)
        setEventDetails(null)
        setCreativeDetails(null); setShootLocations([])
        fetchClientDetails(lead.lead_id, lead.flow_stage, lead.task_name)
    }

    const handleBackToList = () => {
        setView('list')
        setSelectedLead(null)
        setActiveTab('client-details')
    }

    // Removed handleAccept and handleStageUpdate

    const handleUploadSubmit = async () => {
        if (!selectedLead) return
        if (deliveryMethod === 'drive_link' && !driveLink) return
        if (deliveryMethod === 'hard_disk' && !hardDiskDeliveryDate) return
        try {
            await fetch(`${API_URL}/event-details/${selectedLead.lead_id}/upload`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    drive_link: deliveryMethod === 'drive_link' ? driveLink : '',
                    camera_used: cameraUsed,
                    num_images: Number(numImages) || 0,
                    num_videos: 0,
                    upload_notes: uploadNotes,
                    delivery_method: deliveryMethod,
                    hard_disk_delivery_date: deliveryMethod === 'hard_disk' ? hardDiskDeliveryDate : '',
                    uploader_role: 'photographer'
                })
            })
            setUploadSuccess(true)
            setLeads(prev => prev.map(l => l.lead_id === selectedLead.lead_id ? { ...l, upload_complete: true } : l))
            await fetchClientDetails(selectedLead.lead_id, selectedLead.flow_stage)
        } catch (err) {
            console.error('Upload error:', err)
        }
    }

    // Helper: format date nicely
    const formatDate = (d: string) => {
        if (!d) return '—'
        try {
            return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
        } catch { return d }
    }

    // ────────────────────────────────────────────
    // VIEW: LIST — Show all assigned leads
    // ────────────────────────────────────────────
    if (view === 'list') {
        return (
            <div>
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Camera size={20} className="text-blue-600" /> Photographer — Assigned Clients
                        </h1>
                        <p className="text-sm text-gray-500">Manage your photography assignments</p>
                    </div>
                </div>

                <div className="relative mb-4 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name, code, or type..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                    />
                </div>

                {loading ? (
                    <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
                ) : filtered.length === 0 ? (
                    <p className="text-sm text-gray-400 py-8 text-center">No assigned clients found</p>
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
                                        <td className="px-4 py-3 font-medium text-purple-600">{lead.lead_code || `LD-${lead.lead_id}`}</td>
                                        <td className="px-4 py-3 text-gray-900">{lead.name}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStageStyle(lead.flow_stage)}`}>
                                                {lead.flow_stage || 'Workflow'}
                                            </span>
                                            <p className="mt-1 text-[11px] text-gray-400">{lead.request_source || 'Assignment'}</p>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{lead.task_name}</td>
                                        <td className="px-4 py-3 text-gray-600">{lead.type}</td>
                                        <td className="px-4 py-3 text-gray-600">{lead.deadline || '—'}</td>
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
                                                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
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

    // ────────────────────────────────────────────
    // VIEW: DETAIL — Single lead with accept / tabs
    // ────────────────────────────────────────────
    if (!selectedLead) return null

    const detailTabs = [
        { id: 'client-details' as const, label: 'Client Details', icon: Eye },
        { id: 'upload' as const, label: 'Upload', icon: Upload },
        { id: 'rework' as const, label: 'Rework', icon: RotateCcw },
    ]
    const uploadLocked = getAssignmentPhase(selectedLead.flow_stage) === 'event' && String(eventDetails?.event_status || '').toLowerCase() !== 'ended'

    // ── Render the full client details section ──
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
                        <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700">
                            <CheckCircle size={12} /> Accepted
                        </span>
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
                            { label: 'Task', val: selectedLead.task_name || '—' },
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
                                    <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                        {s}
                                    </span>
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
                                    <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                        {d}
                                    </span>
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
                                                <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                                    {c}
                                                </span>
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
                                                <img
                                                    key={i}
                                                    src={`${API_URL?.replace('/api', '')}/uploads/${img}`}
                                                    alt={`ref-${i}`}
                                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                                />
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

                {/* Shoot Locations Section */}
                {shootLocations && shootLocations.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin size={16} className="text-purple-600" />
                            <h3 className="text-sm font-bold text-gray-900">Shoot Locations</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {shootLocations.map((loc: any, idx: number) => (
                                <div key={idx} className="p-4 rounded-xl flex items-start justify-between gap-4" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs text-gray-500 mb-1">Location {idx + 1}</p>
                                        <p className="text-sm font-bold text-gray-900">{loc.label || `Location ${idx+1}`}</p>
                                        {loc.time && <p className="mt-2 text-xs font-semibold text-gray-700">Time: {loc.time}</p>}
                                        {loc.concept && <p className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">{loc.concept}</p>}
                                    </div>
                                    {loc.link && (
                                        <a
                                            href={loc.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold border border-purple-200 transition-colors shrink-0"
                                        >
                                            View Location
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
                        <Camera size={20} className="text-blue-600" />
                        {selectedLead.name}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {selectedLead.lead_code || `LD-${selectedLead.lead_id}`} • {selectedLead.type} • {selectedLead.task_name}
                    </p>
                </div>
                <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full ${getPriorityStyle(selectedLead.priority)}`}>
                    {selectedLead.priority || '—'}
                </span>
            </div>

            <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
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

            
            {/* ACCEPTED — show tabs */}
            <>
                {!selectedLead.accepted && (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-5 text-center">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">New Assignment</h2>
                        <p className="text-sm text-gray-500 mb-4">You have been assigned to this project as a {selectedLead.task_name}. Please review the details and accept the assignment.</p>
                        <button
                            onClick={async () => {
                                try {
                                    const raw = localStorage.getItem('ra_user')
                                    const user = raw ? JSON.parse(raw) : null
                                    if (!user) return
                                    const numericId = parseInt(String(user.employee_id).replace(/\D/g, ''), 10)
                                    await axios.patch(`${API_URL}/assign-team/${selectedLead.lead_id}/accept`, {
                                        employeeId: numericId,
                                        taskName: selectedLead.task_name
                                    })
                                    setSelectedLead({...selectedLead, accepted: true})
                                    setLeads(prev => prev.map(l => l.lead_id === selectedLead.lead_id ? { ...l, accepted: true } : l))
                                } catch (e) {
                                    console.error(e)
                                }
                            }}
                            className="px-6 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors inline-flex items-center gap-2 shadow-sm"
                        >
                            <CheckCircle size={16} /> Accept Assignment
                        </button>
                    </div>
                )}
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
                    {detailTabs.map(tab => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-white text-purple-700 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Icon size={14} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                {/* Client Details Tab */}
                {activeTab === 'client-details' && renderClientDetails()}

                {/* My Work Tab Removed */}

                {/* Upload Tab */}
                {activeTab === 'upload' && (
                    <div>
                        {uploadLocked ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
                                <Upload className="mx-auto mb-3 text-amber-600" size={28} />
                                <p className="font-semibold text-amber-800">Upload unlocks after Event Tracking is ended.</p>
                                <p className="mt-1 text-sm text-amber-700">Go to Time Tracker and click End Event Tracking after all event dates are completed.</p>
                            </div>
                        ) : uploadSuccess ? (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                                <CheckMark />
                                <p className="text-green-700 font-semibold mt-2">
                                    {deliveryMethod === 'hard_disk' ? 'Hard disk delivery submitted successfully!' : 'Upload submitted successfully!'}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                <h3 className="text-base font-bold text-gray-900 mb-4">Deliver Photos</h3>
                                <p className="text-sm text-gray-500 mb-4">{selectedLead.name} — {selectedLead.lead_code}</p>
                                <div className="mb-5 grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => setDeliveryMethod('hard_disk')}
                                        className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${deliveryMethod === 'hard_disk' ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                                        Hard Disk
                                        <span className="block text-xs font-medium text-gray-500">Send delivery date to Data Manager</span>
                                    </button>
                                    <button type="button" onClick={() => setDeliveryMethod('drive_link')}
                                        className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${deliveryMethod === 'drive_link' ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                                        Upload Drive Link
                                        <span className="block text-xs font-medium text-gray-500">Share a Google Drive folder</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {deliveryMethod === 'drive_link' ? (
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Google Drive Link *</label>
                                            <input value={driveLink} onChange={e => setDriveLink(e.target.value)}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                                                placeholder="https://drive.google.com/..." />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Hard Disk Delivery Date *</label>
                                            <input type="date" value={hardDiskDeliveryDate} onChange={e => setHardDiskDeliveryDate(e.target.value)}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-100" />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Camera Used</label>
                                        <input value={cameraUsed} onChange={e => setCameraUsed(e.target.value)}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                                            placeholder="Canon EOS R5" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Number of Images</label>
                                        <input type="number" value={numImages} onChange={e => setNumImages(e.target.value)}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                                            placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                                        <input value={uploadNotes} onChange={e => setUploadNotes(e.target.value)}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-100"
                                            placeholder="Additional notes..." />
                                    </div>
                                </div>
                                <button
                                    onClick={handleUploadSubmit}
                                    disabled={deliveryMethod === 'drive_link' ? !driveLink : !hardDiskDeliveryDate}
                                    className="mt-4 px-6 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Send to Data Manager
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Rework Tab */}
                {activeTab === 'rework' && (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <h3 className="text-base font-bold text-gray-900 mb-4">Rework Requests</h3>
                        <p className="text-sm text-gray-400 py-4 text-center">
                            Rework requests for completed uploads will appear here.
                        </p>
                    </div>
                )}
            </>
        </div>
    )
}

function CheckMark() {
    return (
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        </div>
    )
}


