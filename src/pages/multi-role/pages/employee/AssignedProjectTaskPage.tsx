import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle,
    ExternalLink,
    Eye,
    FileText,
    Link2,
    MapPin,
    Palette,
    RefreshCw,
    RotateCcw,
    Search,
    Shirt,
    UploadCloud,
    User,
} from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

type AssignedProject = {
    id: number
    project_id: string
    project_name: string
    project_type: string
    employee_id: string
    status: string
    upload_link?: string
    upload_notes?: string
    admin_notes?: string
    created_at: string
    updated_at?: string
}

type EventDetails = {
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

type CreativeDetails = {
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

type Props = {
    title: string
    projectType: string
    icon: ReactNode
    description: string
    listMode?: 'assigned' | 'works'
    roleLabel?: string
}

type DetailTab = 'client-details' | 'upload' | 'rework'

const statusClass = (status: string) => {
    const normalized = status.toLowerCase().trim()
    if (normalized === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    if (normalized === 'completed') return 'bg-indigo-50 text-indigo-700 border-indigo-100'
    if (normalized === 'rework') return 'bg-red-50 text-red-700 border-red-100'
    if (normalized === 'accepted') return 'bg-green-50 text-green-700 border-green-100'
    return 'bg-amber-50 text-amber-700 border-amber-100'
}

const statusLabel = (status: string) => {
    const normalized = status.toLowerCase().trim()
    if (normalized === 'approved') return 'CRM Verified'
    if (normalized === 'completed') return 'Submitted to CRM'
    if (normalized === 'rework') return 'Re-upload Needed'
    if (normalized === 'accepted') return 'Accepted'
    return 'Pending Acceptance'
}

const formatDate = (value?: string) => {
    if (!value) return '-'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
}

const getEmployeeId = () => {
    try {
        const user = JSON.parse(localStorage.getItem('ra_user') || '{}')
        return user.employee_id || localStorage.getItem('employee_id') || ''
    } catch {
        return localStorage.getItem('employee_id') || ''
    }
}

const isCompletedWork = (project: AssignedProject) => {
    const status = project.status.toLowerCase().trim()
    return status === 'completed' || status === 'approved'
}

const getLeadKeyFromProjectId = (projectId: string) =>
    projectId.replace(/^CRM-/i, '').trim()

const normalizeStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.map(String)
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value)
            return Array.isArray(parsed) ? parsed.map(String) : []
        } catch {
            return value ? [value] : []
        }
    }
    return []
}

export default function AssignedProjectTaskPage({
    title,
    projectType,
    icon,
    description,
    listMode = 'assigned',
    roleLabel = title,
}: Props) {
    const employeeId = getEmployeeId()
    const [projects, setProjects] = useState<AssignedProject[]>([])
    const [selectedProject, setSelectedProject] = useState<AssignedProject | null>(null)
    const [view, setView] = useState<'list' | 'detail'>('list')
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [driveLink, setDriveLink] = useState('')
    const [uploadNotes, setUploadNotes] = useState('')
    const [activeTab, setActiveTab] = useState<DetailTab>('client-details')
    const [eventDetails, setEventDetails] = useState<EventDetails | null>(null)
    const [creativeDetails, setCreativeDetails] = useState<CreativeDetails | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)

    const fetchProjects = async () => {
        if (!employeeId) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const res = await axios.get(
                `${API_URL}/employee-projects/employee/${employeeId}/type/${encodeURIComponent(projectType)}`
            )
            setProjects((res.data?.data || []).map((project: AssignedProject) => ({
                ...project,
                status: String(project.status || 'Pending').trim(),
            })))
        } catch (error) {
            console.error(`${projectType} projects fetch failed`, error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProjects()
    }, [employeeId, projectType])

    const openProject = (project: AssignedProject) => {
        setSelectedProject(project)
        setDriveLink(project.upload_link || '')
        setUploadNotes(project.upload_notes || '')
        setEventDetails(null)
        setCreativeDetails(null)
        setActiveTab('client-details')
        setView('detail')
        fetchClientDetails(project)
    }

    const updateLocalProject = (updated: AssignedProject) => {
        setSelectedProject(updated)
        setProjects(previous => previous.map(project => project.id === updated.id ? updated : project))
    }

    const handleAccept = async () => {
        if (!selectedProject) return
        try {
            setSubmitting(true)
            const res = await axios.put(`${API_URL}/employee-projects/${selectedProject.id}/status`, {
                status: 'Accepted',
            })
            const acceptedProject = {
                ...selectedProject,
                ...(res.data?.data || {}),
                status: 'Accepted',
            }
            updateLocalProject(acceptedProject)
            setSelectedProject(null)
            setActiveTab('client-details')
            setView('list')
        } catch (error) {
            console.error('Accept assignment failed', error)
            alert('Failed to accept assignment. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleSubmitWork = async () => {
        if (!selectedProject || !driveLink.trim()) return
        try {
            setSubmitting(true)
            const res = await axios.put(`${API_URL}/employee-projects/${selectedProject.id}/submit-link`, {
                upload_link: driveLink.trim(),
                upload_notes: uploadNotes.trim(),
            })
            updateLocalProject(res.data?.data || {
                ...selectedProject,
                upload_link: driveLink.trim(),
                upload_notes: uploadNotes.trim(),
                status: 'Completed',
            })
        } catch (error) {
            console.error('Submit work failed', error)
            alert('Failed to submit work. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const fetchClientDetails = async (project: AssignedProject) => {
        const leadKey = getLeadKeyFromProjectId(project.project_id)
        if (!leadKey) return

        setDetailLoading(true)
        try {
            const eventRes = await axios.get(`${API_URL}/event-details/${encodeURIComponent(leadKey)}`)
            const eventData = eventRes.data?.data || eventRes.data
            if (eventData?.client_name) {
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
                    services: normalizeStringArray(eventData.services),
                    deliverables: normalizeStringArray(eventData.deliverables),
                    meeting_type: eventData.meeting_type || '',
                    meeting_details: eventData.meeting_details || '',
                    client_requirements: eventData.client_requirements || '',
                })
            }
        } catch (error) {
            console.error('Event details fetch failed', error)
        }

        try {
            const creativeRes = await axios.get(`${API_URL}/creative-confirmation/${encodeURIComponent(leadKey)}`)
            const creativeData = creativeRes.data?.data
            if (creativeData) {
                setCreativeDetails({
                    costume_type: creativeData.costume_type || '',
                    color_preferences: normalizeStringArray(creativeData.color_preferences),
                    costume_requirements: creativeData.costume_requirements || '',
                    event_theme: creativeData.event_theme || '',
                    mood_description: creativeData.mood_description || '',
                    location_name: creativeData.location_name || '',
                    location_type: creativeData.location_type || '',
                    google_map_link: creativeData.google_map_link || '',
                    reference_images: normalizeStringArray(creativeData.reference_images),
                    client_approved: Boolean(creativeData.client_approved),
                })
            }
        } catch (error) {
            console.error('Creative details fetch failed', error)
        } finally {
            setDetailLoading(false)
        }
    }

    const modeProjects = projects.filter(project =>
        listMode === 'works' ? isCompletedWork(project) : !isCompletedWork(project)
    )

    const filteredProjects = modeProjects
        .filter(project => {
            const query = search.trim().toLowerCase()
            if (!query) return true
            return (
                project.project_name.toLowerCase().includes(query) ||
                project.project_id.toLowerCase().includes(query) ||
                project.status.toLowerCase().trim().includes(query)
            )
        })
        .sort((a, b) => {
            const aTime = new Date(a.created_at || 0).getTime()
            const bTime = new Date(b.created_at || 0).getTime()
            if (bTime !== aTime) return bTime - aTime
            return Number(b.id || 0) - Number(a.id || 0)
        })

    const listTitle = `${roleLabel} — ${listMode === 'works' ? 'Works' : 'Assigned Clients'}`
    const listDescription = listMode === 'works'
        ? `Completed ${roleLabel.toLowerCase()} client works`
        : `Manage your ${roleLabel.toLowerCase()} assignments`

    const renderClientDetails = (project: AssignedProject) => {
        if (detailLoading) {
            return <p className="text-sm text-gray-400 py-8 text-center">Loading client details...</p>
        }

        return (
            <div className="space-y-6">
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
                            { label: 'Lead ID', val: project.project_id },
                            { label: 'Client Name', val: eventDetails?.client_name || project.project_name },
                            { label: 'Email', val: eventDetails?.email || '-' },
                            { label: 'Phone', val: eventDetails?.phone || '-' },
                            { label: 'Contact Person', val: eventDetails?.contact_person_name || '-' },
                            { label: 'Contact Number', val: eventDetails?.contact_person_number || '-' },
                        ].map(({ label, val }) => (
                            <div key={label} className="bg-gray-50 rounded-lg p-3">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{label}</p>
                                <p className="text-sm font-semibold text-gray-900">{val || '-'}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarDays size={16} className="text-gray-500" />
                        <h3 className="text-sm font-bold text-gray-900">Event Details</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        {[
                            { label: 'Event Type', val: eventDetails?.event_type || '-' },
                            { label: 'Event Date', val: formatDate(eventDetails?.preferred_date) },
                            { label: 'Event Time', val: eventDetails?.preferred_time || '-' },
                            { label: 'Outdoor Location', val: eventDetails?.event_location || '-' },
                            { label: 'Priority Level', val: eventDetails?.priority_level || '-' },
                            { label: 'Meeting Type', val: eventDetails?.meeting_type || '-' },
                            { label: 'Task', val: project.project_type },
                        ].map(({ label, val }) => (
                            <div key={label} className="bg-gray-50 rounded-lg p-3">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{label}</p>
                                <p className="text-sm font-semibold text-gray-900">{val || '-'}</p>
                            </div>
                        ))}
                    </div>

                    {eventDetails?.services && eventDetails.services.length > 0 && (
                        <div className="mb-3">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Services</p>
                            <div className="flex flex-wrap gap-2">
                                {eventDetails.services.map((service, index) => (
                                    <span key={`${service}-${index}`} className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                        {service}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {eventDetails?.deliverables && eventDetails.deliverables.length > 0 && (
                        <div className="mb-3">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Deliverables</p>
                            <div className="flex flex-wrap gap-2">
                                {eventDetails.deliverables.map((deliverable, index) => (
                                    <span key={`${deliverable}-${index}`} className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                        {deliverable}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {eventDetails?.meeting_details && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Meeting Details</p>
                            <p className="text-sm text-gray-700">{eventDetails.meeting_details}</p>
                        </div>
                    )}
                </div>

                {eventDetails?.client_requirements && (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText size={16} className="text-gray-500" />
                            <h3 className="text-sm font-bold text-gray-900">Client Requirements</h3>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">{eventDetails.client_requirements}</p>
                    </div>
                )}

                {creativeDetails && (
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Shirt size={16} className="text-gray-500" />
                                <h3 className="text-sm font-bold text-gray-900">Costume Details</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Costume Type</p>
                                    <p className="text-sm font-semibold text-gray-900">{creativeDetails.costume_type || '-'}</p>
                                </div>
                                {creativeDetails.color_preferences.length > 0 && (
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Color Preferences</p>
                                        <div className="flex flex-wrap gap-2">
                                            {creativeDetails.color_preferences.map((color, index) => (
                                                <span key={`${color}-${index}`} className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                                    {color}
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
                                    <p className="text-sm font-semibold text-gray-900">{creativeDetails.event_theme || '-'}</p>
                                </div>
                                {creativeDetails.mood_description && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Mood Description</p>
                                        <p className="text-sm text-gray-700">{creativeDetails.mood_description}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {creativeDetails && (creativeDetails.location_name || creativeDetails.location_type) && (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin size={16} className="text-gray-500" />
                            <h3 className="text-sm font-bold text-gray-900">Location Details</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Location Name</p>
                                <p className="text-sm font-semibold text-gray-900">{creativeDetails.location_name || '-'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Location Type</p>
                                <p className="text-sm font-semibold text-gray-900">{creativeDetails.location_type || '-'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Google Map</p>
                                {creativeDetails.google_map_link ? (
                                    <a href={creativeDetails.google_map_link} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline truncate block">
                                        View on Map
                                    </a>
                                ) : (
                                    <p className="text-sm font-semibold text-gray-900">-</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    if (view === 'detail' && selectedProject) {
        const selectedStatus = selectedProject.status.toLowerCase().trim()
        const canUpload = ['accepted', 'rework', 'completed'].includes(selectedStatus)
        const isPending = selectedStatus === 'pending'

        return (
            <div>
                <div className="mb-5 flex items-center gap-3">
                    <button
                        onClick={() => {
                            setView('list')
                            setSelectedProject(null)
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                            {icon} {selectedProject.project_name}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {selectedProject.project_id} - {selectedProject.project_type}
                        </p>
                    </div>
                    <span className={`ml-auto rounded-full border px-3 py-1 text-xs font-bold ${statusClass(selectedProject.status)}`}>
                        {statusLabel(selectedProject.status)}
                    </span>
                </div>

                <div className="mb-5 rounded-2xl border border-purple-100 bg-purple-50/70 p-4">
                    <p className="text-sm font-semibold text-gray-900">Operational Manager assignment</p>
                    <p className="mt-1 text-sm text-gray-600">{description}</p>
                </div>

                {isPending ? (
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="text-base font-bold text-gray-900">Accept this work?</h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Accepting confirms this assignment is in your queue and unlocks the upload junction for CRM verification.
                        </p>

                        <div className="mt-5 grid grid-cols-3 gap-4">
                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="text-[10px] font-bold uppercase text-gray-400">Client</p>
                                <p className="mt-1 text-sm font-semibold text-gray-900">{selectedProject.project_name}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="text-[10px] font-bold uppercase text-gray-400">Assigned</p>
                                <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(selectedProject.created_at)}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="text-[10px] font-bold uppercase text-gray-400">Role</p>
                                <p className="mt-1 text-sm font-semibold text-gray-900">{selectedProject.project_type}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleAccept}
                            disabled={submitting}
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                            <CheckCircle size={15} /> {submitting ? 'Accepting...' : 'Accept Assignment'}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
                            {[
                                { id: 'client-details' as const, label: 'Client Details', icon: Eye },
                                { id: 'upload' as const, label: 'Upload', icon: UploadCloud },
                                { id: 'rework' as const, label: 'Rework', icon: RotateCcw },
                            ].map(tab => {
                                const TabIcon = tab.icon
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                            ? 'bg-white text-purple-700 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        <TabIcon size={14} />
                                        {tab.label}
                                    </button>
                                )
                            })}
                        </div>

                        {activeTab === 'client-details' && (
                            renderClientDetails(selectedProject)
                        )}

                        {activeTab === 'upload' && (
                            <div>
                                {selectedStatus === 'approved' ? (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                                        <CheckMark />
                                        <p className="text-green-700 font-semibold mt-2">CRM verified this work.</p>
                                    </div>
                                ) : selectedProject.upload_link && selectedStatus !== 'rework' ? (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                                        <CheckMark />
                                        <p className="text-green-700 font-semibold mt-2">Upload submitted successfully!</p>
                                        <a
                                            href={selectedProject.upload_link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:underline"
                                        >
                                            <ExternalLink size={14} /> Open submitted link
                                        </a>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                        <h3 className="text-base font-bold text-gray-900 mb-4">Submit Work</h3>
                                        <p className="text-sm text-gray-500 mb-4">{selectedProject.project_name} - {selectedProject.project_id}</p>

                                        <div className="space-y-4">
                                            {selectedProject.upload_link && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                    <p className="text-xs font-semibold text-blue-700 mb-1">Previously Submitted:</p>
                                                    <a href={selectedProject.upload_link} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                                        <ExternalLink size={12} /> {selectedProject.upload_link}
                                                    </a>
                                                </div>
                                            )}
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Google Drive Link *</label>
                                            <div className="flex flex-col gap-3 md:flex-row">
                                                <input
                                                    value={driveLink}
                                                    onChange={event => setDriveLink(event.target.value)}
                                                    disabled={!canUpload}
                                                    className="min-w-0 flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:bg-gray-50"
                                                    placeholder="https://drive.google.com/..."
                                                />
                                                <button
                                                    onClick={handleSubmitWork}
                                                    disabled={!driveLink.trim() || submitting || !canUpload}
                                                    className="px-6 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                                                >
                                                    {submitting ? <RefreshCw size={15} className="animate-spin" /> : <Link2 size={15} />}
                                                    {selectedStatus === 'rework' ? 'Re-submit Work' : 'Submit Work'}
                                                </button>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                                                <textarea
                                                    value={uploadNotes}
                                                    onChange={event => setUploadNotes(event.target.value)}
                                                    disabled={!canUpload}
                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:bg-gray-50"
                                                    rows={3}
                                                    placeholder="Additional notes about your work..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'rework' && (
                            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                <h3 className="text-base font-bold text-gray-900 mb-4">Rework Requests</h3>
                                {selectedStatus === 'rework' ? (
                                    <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                                        <p className="text-sm font-bold text-red-700">Rework requested by CRM</p>
                                        <p className="mt-2 text-sm text-red-700">
                                            {selectedProject.admin_notes || 'CRM requested an updated upload. Please submit the corrected link from the Upload tab.'}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 py-4 text-center">
                                        Rework requests for completed uploads will appear here.
                                    </p>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        )
    }

    return (
        <div>
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                        {icon} {listTitle}
                    </h1>
                    <p className="text-sm text-gray-500">{listDescription}</p>
                </div>
            </div>

            <div className="relative mb-4 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    placeholder="Search by client, code, or status..."
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-purple-100"
                />
            </div>

            {loading ? (
                <p className="rounded-xl border border-gray-100 bg-white py-8 text-center text-sm text-gray-400">Loading assignments...</p>
            ) : filteredProjects.length === 0 ? (
                <p className="rounded-xl border border-gray-100 bg-white py-8 text-center text-sm text-gray-400">
                    No {listMode === 'works' ? 'completed works' : 'assigned clients'} found.
                </p>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-100 bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Lead Code</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Client</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Task</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Assigned</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProjects.map(project => (
                                <tr key={project.id} className="hover:bg-gray-50/60">
                                    <td className="px-4 py-3 font-semibold text-purple-600">{project.project_id}</td>
                                    <td className="px-4 py-3 text-gray-900">{project.project_name}</td>
                                    <td className="px-4 py-3 text-gray-600">{project.project_type}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                        <span className="inline-flex items-center gap-1">
                                            <CalendarDays size={13} /> {formatDate(project.created_at)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(project.status)}`}>
                                            {statusLabel(project.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {listMode === 'works' && project.upload_link && (
                                                <button
                                                    type="button"
                                                    onClick={() => window.open(project.upload_link, '_blank', 'noopener,noreferrer')}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                                                >
                                                    <ExternalLink size={13} /> Files
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openProject(project)}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100"
                                            >
                                                <Eye size={13} /> View
                                            </button>
                                        </div>
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

function CheckMark() {
    return (
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        </div>
    )
}
