import { useState, useEffect } from 'react'
import { ArrowLeft, Tag, User, Camera, Calendar, Clock, FileText, Image, ExternalLink, AlertCircle, Play, Pause, Square, Upload, CheckCircle2, Link2, Video, Send } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import { useMediaRole } from '../../../hooks/useMediaRole'
import { getCreativePlanning } from '../../../api/creativePlanning.api'
import { getCreativeConfirmation } from '../../../api/creativeConfirmation.api'

const API_URL = import.meta.env.VITE_API_URL

interface TaskInfo {
    leadCode: string
    leadId: number
    leadEmployeeId: number
    name: string
    type: string
    deadline: string
    priority: string
    description: string
    estimatedDuration: string
}

interface UploadData {
    drive_link: string | null
    video_drive_link?: string | null
    drone_photo_drive_link?: string | null
    drone_video_drive_link?: string | null
    camera_used: string | null
    video_camera_used?: string | null
    drone_camera_used?: string | null
    drone_video_camera_used?: string | null
    num_images: number | null
    num_videos?: number | null
    drone_num_images?: number | null
    drone_num_videos?: number | null
    upload_notes: string | null
    video_upload_notes?: string | null
    drone_upload_notes?: string | null
    drone_video_upload_notes?: string | null
}

interface EventStatus {
    external_lead_id: string
    event_status: 'not_started' | 'started' | 'paused' | 'ended'
    event_started_at: string | null
    event_paused_at: string | null
    event_ended_at: string | null
    event_started_by: string | null
}

const normalizeTaskKey = (taskName?: string) =>
    (taskName || '')
        .toLowerCase()
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

const getPriorityStyle = (s: string) => {
    switch (s?.toLowerCase()) {
        case 'high': return { background: '#FCE4EC', color: '#C2185B' }
        case 'medium': return { background: '#FFF3E0', color: '#E65100' }
        case 'low': return { background: '#E8F5E9', color: '#2E7D32' }
        default: return { background: '#F3F4F6', color: '#6B7280' }
    }
}

export default function MyWorkDetails() {
    const navigate = useNavigate()
    const location = useLocation()
    const {
        employeeId,
        role,
        userName,
        isPhotographer,
        isVideographer,
        isDrone,
        isMultiRole,
        hasPhotographerRole,
        hasVideographerRole,
        hasDroneRole,
        fromRole
    } = useMediaRole()
    const numericEmployeeId = employeeId ? parseInt(String(employeeId).replace(/\D/g, ''), 10) : NaN
    const basePath = location.pathname.startsWith('/multi-role/drone') ? '/multi-role/drone' : '/media'
    const taskInfo = (location.state as TaskInfo) || null
    const [uploadData, setUploadData] = useState<UploadData | null>(null)
    const [completedStages, setCompletedStages] = useState<string[]>([])
    const [assignmentAccepted, setAssignmentAccepted] = useState(false)
    const [creativePlanning, setCreativePlanning] = useState<any>(null)
    const [creativeConfirmation, setCreativeConfirmation] = useState<any>(null)
    const [eventStatus, setEventStatus] = useState<EventStatus | null>(null)
    const [uploadForm, setUploadForm] = useState({
        photoDriveLink: '',
        videoDriveLink: '',
        equipmentUsed: '',
        numImages: '',
        numVideos: '',
        notes: '',
    })
    const [uploadSubmitting, setUploadSubmitting] = useState(false)
    const [isAcceptSubmitting, setIsAcceptSubmitting] = useState(false)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const showImageUpload = isPhotographer || isDrone || (isMultiRole && (hasPhotographerRole || hasDroneRole))
    const showVideoUpload = isVideographer || isDrone || (isMultiRole && (hasVideographerRole || hasDroneRole))
    const allowsDualUpload = showImageUpload && showVideoUpload
    const uploadSectionTitle = allowsDualUpload
        ? 'Upload Photos / Videos'
        : showVideoUpload
            ? 'Upload Videos'
            : 'Upload Photos'
    const uploadFieldHelpText = allowsDualUpload
        ? 'Add the photo and video Google Drive folders for this assignment.'
        : showVideoUpload
            ? 'Add the video Google Drive folder for this assignment.'
            : 'Add the photo Google Drive folder for this assignment.'
    const photoDriveLabel = isDrone ? 'Drone Photo Drive Link' : 'Photo Drive Link'
    const videoDriveLabel = isDrone ? 'Drone Video Drive Link' : 'Video Drive Link'
    const imageCountLabel = isDrone ? 'Drone Images' : 'Images'
    const videoCountLabel = isDrone ? 'Drone Videos' : 'Videos'
    const requiredLinkReady = showImageUpload && !showVideoUpload
        ? Boolean(uploadForm.photoDriveLink)
        : showVideoUpload && !showImageUpload
            ? Boolean(uploadForm.videoDriveLink)
            : Boolean(uploadForm.photoDriveLink || uploadForm.videoDriveLink)
    const resolvedPhotoDrive = isDrone ? uploadData?.drone_photo_drive_link : uploadData?.drive_link
    const resolvedVideoDrive = isDrone ? uploadData?.drone_video_drive_link : uploadData?.video_drive_link
    const resolvedEquipment = isDrone
        ? (uploadData?.drone_camera_used || uploadData?.drone_video_camera_used || null)
        : (uploadData?.camera_used || uploadData?.video_camera_used || null)
    const resolvedNumImages = isDrone ? uploadData?.drone_num_images : uploadData?.num_images
    const resolvedNumVideos = isDrone ? uploadData?.drone_num_videos : uploadData?.num_videos
    const resolvedNotes = isDrone
        ? (uploadData?.drone_upload_notes || uploadData?.drone_video_upload_notes || null)
        : (uploadData?.upload_notes || uploadData?.video_upload_notes || null)
    const hasUpload = Boolean(resolvedPhotoDrive || resolvedVideoDrive)
    const assignmentTaskName = taskInfo?.name || (isDrone ? 'Drone Coverage' : showVideoUpload && !showImageUpload ? 'Videography' : 'Photography')

    const fetchDetails = () => {
        if (!taskInfo?.leadId) { setLoading(false); return }
        setLoading(true)
        Promise.all([
            fetch(`${API_URL}/event-details/${taskInfo.leadId}`).then(r => r.json()),
            fetch(`${API_URL}/stage/${taskInfo.leadId}`).then(r => r.json()),
            employeeId ? fetch(`${API_URL}/assign-team/${taskInfo.leadId}/status`).then(r => r.json()) : Promise.resolve(null),
            fetch(`${API_URL}/event-coordinator/event/${taskInfo.leadId}/status`)
                .then(r => r.json())
                .catch(() => null),
            getCreativePlanning(String(taskInfo.leadId)).catch(() => null),
            getCreativeConfirmation(String(taskInfo.leadId)).catch(() => null)
        ])
            .then(([eventRes, stageRes, assignRes, eventStatusRes, cpRes, ccRes]) => {
                if (eventRes.success && eventRes.data) {
                    setUploadData({
                        drive_link: eventRes.data.drive_link || null,
                        video_drive_link: eventRes.data.video_drive_link || null,
                        drone_photo_drive_link: eventRes.data.drone_photo_drive_link || null,
                        drone_video_drive_link: eventRes.data.drone_video_drive_link || null,
                        camera_used: eventRes.data.camera_used || null,
                        video_camera_used: eventRes.data.video_camera_used || null,
                        drone_camera_used: eventRes.data.drone_camera_used || null,
                        drone_video_camera_used: eventRes.data.drone_video_camera_used || null,
                        num_images: eventRes.data.num_images || null,
                        num_videos: eventRes.data.num_videos || null,
                        drone_num_images: eventRes.data.drone_num_images || null,
                        drone_num_videos: eventRes.data.drone_num_videos || null,
                        upload_notes: eventRes.data.upload_notes || null,
                        video_upload_notes: eventRes.data.video_upload_notes || null,
                        drone_upload_notes: eventRes.data.drone_upload_notes || null,
                        drone_video_upload_notes: eventRes.data.drone_video_upload_notes || null,
                    })
                    const photoLink = isDrone ? (eventRes.data.drone_photo_drive_link || '') : (eventRes.data.drive_link || '')
                    const videoLink = isDrone ? (eventRes.data.drone_video_drive_link || '') : (eventRes.data.video_drive_link || '')
                    const initialEquipment = isDrone
                        ? (eventRes.data.drone_camera_used || eventRes.data.drone_video_camera_used || '')
                        : showVideoUpload && !showImageUpload
                            ? (eventRes.data.video_camera_used || '')
                            : showImageUpload && !showVideoUpload
                                ? (eventRes.data.camera_used || '')
                                : (eventRes.data.camera_used || eventRes.data.video_camera_used || '')
                    const initialNotes = isDrone
                        ? (eventRes.data.drone_upload_notes || eventRes.data.drone_video_upload_notes || '')
                        : showVideoUpload && !showImageUpload
                            ? (eventRes.data.video_upload_notes || '')
                            : showImageUpload && !showVideoUpload
                                ? (eventRes.data.upload_notes || '')
                                : (eventRes.data.upload_notes || eventRes.data.video_upload_notes || '')
                    setUploadForm({
                        photoDriveLink: photoLink,
                        videoDriveLink: videoLink,
                        equipmentUsed: initialEquipment,
                        numImages: String(isDrone ? (eventRes.data.drone_num_images || '') : (eventRes.data.num_images || '')),
                        numVideos: String(isDrone ? (eventRes.data.drone_num_videos || '') : (eventRes.data.num_videos || '')),
                        notes: initialNotes,
                    })
                }
                if (stageRes.success && stageRes.data?.completed_stages) {
                    // array_agg can return [null] if no rows, so we filter
                    const stages = stageRes.data.completed_stages.filter(Boolean)
                    setCompletedStages(stages)
                }
                if (assignRes?.success && assignRes.data && Array.isArray(assignRes.data.accepted_assignments)) {
                    const assignmentKey = `${numericEmployeeId}:${normalizeTaskKey(assignmentTaskName)}`
                    setAssignmentAccepted(!Number.isNaN(numericEmployeeId) && assignRes.data.accepted_assignments.includes(assignmentKey))
                } else {
                    setAssignmentAccepted(false)
                }
                if (eventStatusRes?.success && eventStatusRes.data) {
                    setEventStatus(eventStatusRes.data)
                } else {
                    setEventStatus(null)
                }
                if (cpRes?.data?.data || cpRes?.data) setCreativePlanning(cpRes?.data?.data || cpRes?.data)
                if (ccRes?.data?.data || ccRes?.data) setCreativeConfirmation(ccRes?.data?.data || ccRes?.data)
            })
            .catch(err => console.error('Fetch error:', err))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchDetails()
    }, [taskInfo?.leadId, employeeId, numericEmployeeId, showImageUpload, showVideoUpload, assignmentTaskName])

    const handleEventAction = async (action: 'start' | 'pause' | 'end') => {
        if (!taskInfo?.leadId) return
        if (!assignmentAccepted) {
            toast.error('Accept the assignment from Assigned Client before using event actions')
            return
        }

        setActionLoading(true)
        try {
            await axios.patch(`${API_URL}/event-coordinator/event/${taskInfo.leadId}/${action}`, {
                started_by: userName,
                paused_by: userName,
                ended_by: userName,
                role: role || 'Photographer',
            })

            const statusRes = await axios.get(`${API_URL}/event-coordinator/event/${taskInfo.leadId}/status`)
            if (statusRes.data?.success) {
                setEventStatus(statusRes.data.data)
            }

            const labels = { start: 'started', pause: 'paused', end: 'ended' }
            toast.success(`Event ${labels[action]} successfully`)
            fetchDetails()
        } catch (e: any) {
            console.error(`Error trying to ${action} event`, e)
            toast.error(e?.response?.data?.message || `Failed to ${action} event`)
        } finally {
            setActionLoading(false)
        }
    }

    const handleUploadSubmit = async () => {
        if (!taskInfo?.leadId) {
            toast.error('No lead ID found for this task')
            return
        }
        if (!assignmentAccepted) {
            toast.error('Accept the assignment before sending files')
            return
        }
        if (!eventEnded) {
            toast.error('Upload is available only after the event is ended')
            return
        }

        if (!showImageUpload && !showVideoUpload) {
            toast.error('No upload type is enabled for this role')
            return
        }
        if (showImageUpload && !showVideoUpload && !uploadForm.photoDriveLink) {
            toast.error('Please provide the photo drive link')
            return
        }
        if (showVideoUpload && !showImageUpload && !uploadForm.videoDriveLink) {
            toast.error('Please provide the video drive link')
            return
        }
        if (showImageUpload && showVideoUpload && !uploadForm.photoDriveLink && !uploadForm.videoDriveLink) {
            toast.error('Please provide at least one drive link')
            return
        }

        setUploadSubmitting(true)
        try {
            const res = await fetch(`${API_URL}/event-details/${taskInfo.leadId}/upload`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    drive_link: showImageUpload ? uploadForm.photoDriveLink : '',
                    video_drive_link: showVideoUpload ? uploadForm.videoDriveLink : '',
                    camera_used: showImageUpload ? uploadForm.equipmentUsed : '',
                    video_camera_used: showVideoUpload ? uploadForm.equipmentUsed : '',
                    num_images: parseInt(uploadForm.numImages) || 0,
                    num_videos: parseInt(uploadForm.numVideos) || 0,
                    upload_notes: showImageUpload ? uploadForm.notes : '',
                    video_upload_notes: showVideoUpload ? uploadForm.notes : '',
                    uploader_role: isDrone ? 'drone' : (isMultiRole ? 'multi-role' : (fromRole || 'photographer')),
                })
            })
            const result = await res.json()
            if (result.success) {
                toast.success('Files sent to Data Manager successfully')
                fetchDetails()
            } else {
                toast.error(result.message || 'Failed to submit upload details')
            }
        } catch (err) {
            console.error('Upload submit error:', err)
            toast.error('Failed to submit upload details')
        } finally {
            setUploadSubmitting(false)
        }
    }

    const handleAcceptAssignment = async () => {
        if (!employeeId || Number.isNaN(numericEmployeeId)) {
            toast.error('Unable to determine your employee ID');
            return;
        }
        setIsAcceptSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/assign-team/${taskInfo.leadId}/accept`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: numericEmployeeId, taskName: assignmentTaskName })
            });
            const result = await res.json();
            if (result.success) {
                toast.success('Assignment accepted successfully');
                setAssignmentAccepted(true);
                fetchDetails();
            } else {
                toast.error(result.message || 'Failed to accept assignment');
            }
        } catch (error) {
            console.error('Failed to accept assignment', error);
            toast.error('Failed to accept assignment');
        } finally {
            setIsAcceptSubmitting(false);
        }
    };



    if (!taskInfo) {
        return (
            <div>
                <button onClick={() => navigate(`${basePath}/my-work`)} className="flex items-center gap-1.5 text-sm font-medium hover:text-purple-700 transition-colors mb-4" style={{ color: '#6B7280' }}><ArrowLeft size={16} /> Back to My Work</button>
                <div className="crm-card p-10 text-center">
                    <AlertCircle size={32} className="mx-auto mb-3" style={{ color: '#9CA3AF' }} />
                    <p className="text-sm font-medium" style={{ color: '#6B7280' }}>No task data found. Please navigate from My Work.</p>
                </div>
            </div>
        )
    }

    const currentEventStatus =
        eventStatus?.event_status ||
        (completedStages.includes('shoot_completed')
            ? 'ended'
            : completedStages.includes('event_started')
                ? 'started'
                : 'not_started')
    const eventEnded = currentEventStatus === 'ended'
    const canUpload = assignmentAccepted && eventEnded
    const totalFiles = (parseInt(uploadForm.numImages) || 0) + (parseInt(uploadForm.numVideos) || 0)

    const getStatusBadge = () => {
        switch (currentEventStatus) {
            case 'started':
                return { label: 'In Progress', color: '#059669', bg: '#ECFDF5' }
            case 'paused':
                return { label: 'Paused', color: '#D97706', bg: '#FFFBEB' }
            case 'ended':
                return { label: 'Event Ended', color: '#DC2626', bg: '#FEF2F2' }
            default:
                return { label: 'Not Started', color: '#6B7280', bg: '#F3F4F6' }
        }
    }

    const statusBadge = getStatusBadge()

    return (
        <div>
            <button onClick={() => navigate(`${basePath}/my-work`)} className="flex items-center gap-1.5 text-sm font-medium hover:text-purple-700 transition-colors mb-4" style={{ color: '#6B7280' }}>
                <ArrowLeft size={16} /> Back to My Work
            </button>

            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Task Details</h1>
                    <p className="text-sm mt-1" style={{ color: '#6B7280' }}>{taskInfo.leadCode} — {taskInfo.type}</p>
                </div>
                <span className="crm-badge" style={getPriorityStyle(taskInfo.priority)}>{taskInfo.priority}</span>
            </div>

            <div className="crm-card p-4 mb-5">
                <div className="grid grid-cols-5 gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#F5F3FF', color: '#5B5FC7' }}><Tag size={14} /></div>
                        <div><p className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>Lead ID</p><p className="text-sm font-semibold" style={{ color: '#111827' }}>{taskInfo.leadCode}</p></div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#E8F0FE', color: '#1565C0' }}><User size={14} /></div>
                        <div><p className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>Client Name</p><p className="text-sm font-semibold" style={{ color: '#111827' }}>{taskInfo.name}</p></div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FCE4EC', color: '#C2185B' }}><Camera size={14} /></div>
                        <div><p className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>Event Type</p><p className="text-sm font-semibold" style={{ color: '#111827' }}>{taskInfo.type}</p></div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FFF3E0', color: '#E65100' }}><Calendar size={14} /></div>
                        <div><p className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>Deadline</p><p className="text-sm font-semibold" style={{ color: '#111827' }}>{taskInfo.deadline || '—'}</p></div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#E8F5E9', color: '#2E7D32' }}><Clock size={14} /></div>
                        <div><p className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>Duration</p><p className="text-sm font-semibold" style={{ color: '#111827' }}>{taskInfo.estimatedDuration ? `${taskInfo.estimatedDuration}h` : '—'}</p></div>
                    </div>
                </div>
            </div>

            {taskInfo.description && (
                <div className="crm-card p-5 mb-5">
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: '#111827' }}>
                        <FileText size={14} style={{ color: '#5B5FC7' }} /> Description
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#4B5563' }}>{taskInfo.description}</p>
                </div>
            )}

            {creativeConfirmation && (() => {
                const colors = Array.isArray(creativeConfirmation.color_preferences) ? creativeConfirmation.color_preferences : (typeof creativeConfirmation.color_preferences === 'string' ? JSON.parse(creativeConfirmation.color_preferences || '[]') : []);
                const images = Array.isArray(creativeConfirmation.reference_images) ? creativeConfirmation.reference_images : (typeof creativeConfirmation.reference_images === 'string' ? JSON.parse(creativeConfirmation.reference_images || '[]') : []);
                return (
                    <div className="crm-card p-5 mb-5">
                        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: '#111827' }}>
                            <Sparkles size={16} className="text-purple-600" /> Creative Confirmation Details
                        </h3>

                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Costume Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="p-3 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <p className="text-xs text-gray-500 mb-1">Costume Type</p>
                                    <p className="text-sm font-semibold text-gray-900">{creativeConfirmation.costume_type || '—'}</p>
                                </div>
                                <div className="p-3 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <p className="text-xs text-gray-500 mb-1">Color Preferences</p>
                                    <p className="text-sm font-semibold text-gray-900">{colors.length > 0 ? colors.join(', ') : '—'}</p>
                                </div>
                                <div className="p-3 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <p className="text-xs text-gray-500 mb-1">Special Requirements</p>
                                    <p className="text-sm font-semibold text-gray-900">{creativeConfirmation.costume_requirements || '—'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Concept Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <p className="text-xs text-gray-500 mb-1">Event Theme</p>
                                    <p className="text-sm font-semibold text-gray-900">{creativeConfirmation.event_theme || '—'}</p>
                                </div>
                                <div className="p-3 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <p className="text-xs text-gray-500 mb-1">Mood Description</p>
                                    <p className="text-sm font-semibold text-gray-900">{creativeConfirmation.mood_description || '—'}</p>
                                </div>
                            </div>
                            {images.length > 0 && (
                                <div className="mt-3 p-3 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <p className="text-xs text-gray-500 mb-2">Reference Images</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {images.map((img: string, i: number) => (
                                            <a key={i} href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${img}`} target="_blank" rel="noreferrer">
                                                <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${img}`} className="w-14 h-14 object-cover rounded-md border" alt="ref" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Location & Status</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="p-3 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <p className="text-xs text-gray-500 mb-1">Location Name</p>
                                    <p className="text-sm font-semibold text-gray-900">{creativeConfirmation.location_name || '—'}</p>
                                </div>
                                <div className="p-3 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <p className="text-xs text-gray-500 mb-1">Location Type</p>
                                    <p className="text-sm font-semibold text-gray-900">{creativeConfirmation.location_type || '—'}</p>
                                </div>
                                <div className="p-3 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <p className="text-xs text-gray-500 mb-1">Google Map Link</p>
                                    {creativeConfirmation.google_map_link ? (
                                        <a href={creativeConfirmation.google_map_link} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline truncate block">View Map</a>
                                    ) : <p className="text-sm font-semibold text-gray-900">—</p>}
                                </div>
                                <div className="p-3 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <p className="text-xs text-gray-500 mb-1">Client Approved</p>
                                    <p className="text-sm font-semibold text-gray-900">{creativeConfirmation.client_approved ? 'Yes' : 'No'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {creativePlanning && (() => {
                const getArr = (val: any) => {
                    if (Array.isArray(val)) return val;
                    if (typeof val === 'string') {
                        try { return JSON.parse(val); } catch (e) { return []; }
                    }
                    return [];
                };
                const equipment = getArr(creativePlanning.equipment_required);
                const lighting = getArr(creativePlanning.lighting_setup);
                const props = getArr(creativePlanning.props_required);

                return (
                    <div className="crm-card p-5 mb-5">
                        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: '#111827' }}>
                            <Sparkles size={16} className="text-blue-600" /> Creative Planning Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <div className="p-3 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                <p className="text-xs text-gray-500 mb-2">Equipment Required</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {equipment.length > 0 ? equipment.map((e: string, i: number) => <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-[10px] font-bold border border-purple-100">{e}</span>) : <span className="text-sm font-semibold text-gray-900">—</span>}
                                </div>
                            </div>
                            <div className="p-3 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                <p className="text-xs text-gray-500 mb-2">Lighting Setup</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {lighting.length > 0 ? lighting.map((l: string, i: number) => <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold border border-blue-100">{l}</span>) : <span className="text-sm font-semibold text-gray-900">—</span>}
                                </div>
                            </div>
                            <div className="p-3 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                <p className="text-xs text-gray-500 mb-2">Props Required</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {props.length > 0 ? props.map((p: string, i: number) => <span key={i} className="px-2 py-1 bg-orange-50 text-orange-700 rounded-md text-[10px] font-bold border border-orange-100">{p}</span>) : <span className="text-sm font-semibold text-gray-900">—</span>}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                <p className="text-xs text-gray-500 mb-1">Event List</p>
                                <p className="text-sm font-semibold text-gray-900 whitespace-pre-wrap">{creativePlanning.event_list || '—'}</p>
                            </div>
                            <div className="p-3 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                <p className="text-xs text-gray-500 mb-1">Special Notes</p>
                                <p className="text-sm font-semibold text-gray-900 whitespace-pre-wrap">{creativePlanning.special_notes || '—'}</p>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <div className="crm-card p-5 mb-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                        <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>Event Actions</h3>
                        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                            Manage event start, pause, end, and post-event upload from this task.
                        </p>
                    </div>
                    <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: statusBadge.bg, color: statusBadge.color }}
                    >
                        <CheckCircle2 size={12} />
                        {statusBadge.label}
                    </span>
                </div>

                {!assignmentAccepted ? (
                    <div className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: '#9A3412' }}>
                                Assignment not accepted yet.
                            </p>
                            <p className="text-xs mt-1" style={{ color: '#C2410C' }}>
                                Please accept the assignment to unlock event start, pause, end, and upload actions.
                            </p>
                        </div>
                        <button
                            onClick={handleAcceptAssignment}
                            disabled={isAcceptSubmitting}
                            className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                            style={{ background: '#D97706' }}
                        >
                            {isAcceptSubmitting ? 'Accepting...' : 'Accept Assignment'}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center gap-3">
                            {(currentEventStatus === 'not_started' || currentEventStatus === 'paused') && (
                                <button
                                    onClick={() => handleEventAction('start')}
                                    disabled={actionLoading}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                                    style={{ background: '#16A34A' }}
                                >
                                    <Play size={14} />
                                    {currentEventStatus === 'paused' ? 'Resume Event' : 'Event Started'}
                                </button>
                            )}

                            {currentEventStatus === 'started' && (
                                <button
                                    onClick={() => handleEventAction('pause')}
                                    disabled={actionLoading}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                                    style={{ background: '#D97706' }}
                                >
                                    <Pause size={14} />
                                    Event Paused
                                </button>
                            )}

                            {(currentEventStatus === 'started' || currentEventStatus === 'paused') && (
                                <button
                                    onClick={() => handleEventAction('end')}
                                    disabled={actionLoading}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                                    style={{ background: '#DC2626' }}
                                >
                                    <Square size={14} />
                                    Event Ended
                                </button>
                            )}

                            {canUpload && (
                                <span
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
                                    style={{ background: '#F5F3FF', color: '#5B5FC7' }}
                                >
                                    <Upload size={13} />
                                    Upload form unlocked below
                                </span>
                            )}
                        </div>

                        {(eventStatus?.event_started_at || eventStatus?.event_paused_at || eventStatus?.event_ended_at) && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                                {eventStatus?.event_started_at && (
                                    <div className="rounded-xl p-3" style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                                        <p className="text-[10px] font-medium uppercase" style={{ color: '#9CA3AF' }}>Started At</p>
                                        <p className="text-sm font-semibold mt-1" style={{ color: '#111827' }}>
                                            {new Date(eventStatus.event_started_at).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                                {eventStatus?.event_paused_at && (
                                    <div className="rounded-xl p-3" style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                                        <p className="text-[10px] font-medium uppercase" style={{ color: '#9CA3AF' }}>Paused At</p>
                                        <p className="text-sm font-semibold mt-1" style={{ color: '#111827' }}>
                                            {new Date(eventStatus.event_paused_at).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                                {eventStatus?.event_ended_at && (
                                    <div className="rounded-xl p-3" style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                                        <p className="text-[10px] font-medium uppercase" style={{ color: '#9CA3AF' }}>Ended At</p>
                                        <p className="text-sm font-semibold mt-1" style={{ color: '#111827' }}>
                                            {new Date(eventStatus.event_ended_at).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {(canUpload || hasUpload) && (
                <div className="crm-card p-5">
                    <div className="mb-5">
                        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: '#111827' }}>
                            <Upload size={14} style={{ color: '#7C3AED' }} /> Upload Footages / Images
                        </h3>

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                            <div className="lg:col-span-3 flex flex-col gap-5">
                                <div className="rounded-xl p-5" style={{ background: '#FCFCFD', border: '1px solid #E5E7EB' }}>
                                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3" style={{ color: '#111827' }}>
                                        {showImageUpload && !showVideoUpload ? (
                                            <Camera size={15} style={{ color: '#7C3AED' }} />
                                        ) : showVideoUpload && !showImageUpload ? (
                                            <Video size={15} style={{ color: '#7C3AED' }} />
                                        ) : (
                                            <Upload size={15} style={{ color: '#7C3AED' }} />
                                        )}
                                        {uploadSectionTitle}
                                    </h4>
                                    <p className="text-xs mb-4" style={{ color: '#6B7280' }}>
                                        {uploadFieldHelpText}
                                    </p>

                                    <div className={`grid gap-4 mb-4 ${allowsDualUpload ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                        {showImageUpload && (
                                            <div className="relative">
                                                <label className="block text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>{photoDriveLabel}</label>
                                                <Link2 size={16} className="absolute left-3 top-[42px] -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                                                <input
                                                    type="url"
                                                    value={uploadForm.photoDriveLink}
                                                    onChange={(e) => setUploadForm(prev => ({ ...prev, photoDriveLink: e.target.value }))}
                                                    placeholder={isDrone ? 'https://drive.google.com/drive/folders/...drone-photos' : 'https://drive.google.com/drive/folders/...photos'}
                                                    disabled={!canUpload}
                                                    className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-medium outline-none disabled:opacity-60"
                                                    style={{ borderColor: '#E5E7EB', color: '#111827' }}
                                                />
                                            </div>
                                        )}

                                        {showVideoUpload && (
                                            <div className="relative">
                                                <label className="block text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>{videoDriveLabel}</label>
                                                <Link2 size={16} className="absolute left-3 top-[42px] -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                                                <input
                                                    type="url"
                                                    value={uploadForm.videoDriveLink}
                                                    onChange={(e) => setUploadForm(prev => ({ ...prev, videoDriveLink: e.target.value }))}
                                                    placeholder={isDrone ? 'https://drive.google.com/drive/folders/...drone-videos' : 'https://drive.google.com/drive/folders/...videos'}
                                                    disabled={!canUpload}
                                                    className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-medium outline-none disabled:opacity-60"
                                                    style={{ borderColor: '#E5E7EB', color: '#111827' }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>Equipment Used</label>
                                            <input
                                                type="text"
                                                value={uploadForm.equipmentUsed}
                                                onChange={(e) => setUploadForm(prev => ({ ...prev, equipmentUsed: e.target.value }))}
                                                placeholder={showVideoUpload && !showImageUpload ? 'e.g., Sony A7S III' : 'e.g., Canon R5'}
                                                disabled={!canUpload}
                                                className="w-full px-3 py-2.5 border rounded-xl text-sm font-medium outline-none disabled:opacity-60"
                                                style={{ borderColor: '#E5E7EB', color: '#111827' }}
                                            />
                                        </div>
                                        <div className={`grid gap-3 ${allowsDualUpload ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                            {showImageUpload && (
                                                <div>
                                                    <label className="block text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>
                                                        {imageCountLabel}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={uploadForm.numImages}
                                                        onChange={(e) => setUploadForm(prev => ({ ...prev, numImages: e.target.value }))}
                                                        disabled={!canUpload}
                                                        className="w-full px-3 py-2.5 border rounded-xl text-sm font-medium outline-none disabled:opacity-60"
                                                        style={{ borderColor: '#E5E7EB', color: '#111827' }}
                                                    />
                                                </div>
                                            )}
                                            {showVideoUpload && (
                                                <div>
                                                    <label className="block text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>
                                                        {videoCountLabel}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={uploadForm.numVideos}
                                                        onChange={(e) => setUploadForm(prev => ({ ...prev, numVideos: e.target.value }))}
                                                        disabled={!canUpload}
                                                        className="w-full px-3 py-2.5 border rounded-xl text-sm font-medium outline-none disabled:opacity-60"
                                                        style={{ borderColor: '#E5E7EB', color: '#111827' }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>Notes</label>
                                        <textarea
                                            rows={4}
                                            value={uploadForm.notes}
                                            onChange={(e) => setUploadForm(prev => ({ ...prev, notes: e.target.value }))}
                                            placeholder="Any notes for Data Manager..."
                                            disabled={!canUpload}
                                            className="w-full px-3 py-2.5 border rounded-xl text-sm resize-none font-medium outline-none disabled:opacity-60"
                                            style={{ borderColor: '#E5E7EB', color: '#111827' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-2 flex flex-col gap-5">
                                <div className="rounded-xl p-5" style={{ background: '#FCFCFD', border: '1px solid #E5E7EB' }}>
                                    <h4 className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Submission Summary</h4>
                                    <div className="space-y-3">
                                        {showImageUpload && (
                                            <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #F3F4F6' }}>
                                                <span className="text-xs font-medium" style={{ color: '#6B7280' }}>{photoDriveLabel}</span>
                                                <span className="text-xs font-semibold" style={{ color: uploadForm.photoDriveLink ? '#2E7D32' : '#9CA3AF' }}>
                                                    {uploadForm.photoDriveLink ? 'Provided' : 'Not provided'}
                                                </span>
                                            </div>
                                        )}
                                        {showVideoUpload && (
                                            <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #F3F4F6' }}>
                                                <span className="text-xs font-medium" style={{ color: '#6B7280' }}>{videoDriveLabel}</span>
                                                <span className="text-xs font-semibold" style={{ color: uploadForm.videoDriveLink ? '#2E7D32' : '#9CA3AF' }}>
                                                    {uploadForm.videoDriveLink ? 'Provided' : 'Not provided'}
                                                </span>
                                            </div>
                                        )}
                                        {showImageUpload && (
                                            <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #F3F4F6' }}>
                                                <span className="text-xs font-medium" style={{ color: '#6B7280' }}>{imageCountLabel}</span>
                                                <span className="text-xs font-semibold" style={{ color: '#111827' }}>{parseInt(uploadForm.numImages) || 0}</span>
                                            </div>
                                        )}
                                        {showVideoUpload && (
                                            <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #F3F4F6' }}>
                                                <span className="text-xs font-medium" style={{ color: '#6B7280' }}>{videoCountLabel}</span>
                                                <span className="text-xs font-semibold" style={{ color: '#111827' }}>{parseInt(uploadForm.numVideos) || 0}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Total Files</span>
                                            <span className="text-xs font-semibold" style={{ color: '#111827' }}>{totalFiles}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleUploadSubmit}
                                    disabled={!canUpload || uploadSubmitting || !requiredLinkReady}
                                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                                    style={{ background: '#5B5FC7', color: '#fff' }}
                                >
                                    <Send size={16} />
                                    {uploadSubmitting ? 'Sending...' : 'Send to Data Manager'}
                                </button>

                                {!canUpload && (
                                    <div className="rounded-xl px-4 py-3 text-xs" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#6B7280' }}>
                                        Upload is enabled only after:
                                        {` `}
                                        1. assignment is accepted
                                        {` `}
                                        2. event is ended
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: '#111827' }}>
                        <Image size={14} style={{ color: '#5B5FC7' }} /> Uploaded Files
                    </h3>

                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-sm" style={{ color: '#9CA3AF' }}>Loading upload details...</p>
                        </div>
                    ) : hasUpload ? (
                        <div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {resolvedPhotoDrive && (
                                    <div className="rounded-xl p-4" style={{ background: '#F5F3FF', border: '1px solid #EDE9FE' }}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#EDE9FE', color: '#5B5FC7' }}>
                                                    <Camera size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold" style={{ color: '#111827' }}>{isDrone ? 'Drone Photo Drive Folder' : 'Photo Drive Folder'}</p>
                                                    <p className="text-xs truncate" style={{ color: '#6B7280' }}>{resolvedPhotoDrive}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={resolvedPhotoDrive}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80 shrink-0"
                                                style={{ background: '#5B5FC7', color: '#fff' }}
                                            >
                                                <ExternalLink size={12} /> Open
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {resolvedVideoDrive && (
                                    <div className="rounded-xl p-4" style={{ background: '#EEF6FF', border: '1px solid #DBEAFE' }}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#DBEAFE', color: '#2563EB' }}>
                                                    <Video size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold" style={{ color: '#111827' }}>{isDrone ? 'Drone Video Drive Folder' : 'Video Drive Folder'}</p>
                                                    <p className="text-xs truncate" style={{ color: '#6B7280' }}>{resolvedVideoDrive}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={resolvedVideoDrive}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80 shrink-0"
                                                style={{ background: '#2563EB', color: '#fff' }}
                                            >
                                                <ExternalLink size={12} /> Open
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-4 gap-3 mb-4">
                                <div className="rounded-xl p-3 text-center" style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                                    <Image size={18} className="mx-auto mb-1.5" style={{ color: '#7C3AED' }} />
                                    <p className="text-lg font-bold" style={{ color: '#111827' }}>{resolvedNumImages ?? 0}</p>
                                    <p className="text-[10px] font-medium" style={{ color: '#6B7280' }}>{imageCountLabel}</p>
                                </div>

                                <div className="rounded-xl p-3 text-center" style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                                    <Video size={18} className="mx-auto mb-1.5" style={{ color: '#C2185B' }} />
                                    <p className="text-lg font-bold" style={{ color: '#111827' }}>{resolvedNumVideos ?? 0}</p>
                                    <p className="text-[10px] font-medium" style={{ color: '#6B7280' }}>{videoCountLabel}</p>
                                </div>

                                <div className="rounded-xl p-3 text-center" style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                                    <Camera size={18} className="mx-auto mb-1.5" style={{ color: '#E65100' }} />
                                    <p className="text-xs font-bold truncate" style={{ color: '#111827' }}>{resolvedEquipment || '—'}</p>
                                    <p className="text-[10px] font-medium" style={{ color: '#6B7280' }}>{isDrone ? 'Drone Equipment' : 'Camera'}</p>
                                </div>
                                <div className="rounded-xl p-3 text-center" style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                                    <FileText size={18} className="mx-auto mb-1.5" style={{ color: '#2E7D32' }} />
                                    <p className="text-lg font-bold" style={{ color: '#111827' }}>{(resolvedNumImages ?? 0) + (resolvedNumVideos ?? 0)}</p>
                                    <p className="text-[10px] font-medium" style={{ color: '#6B7280' }}>Total Files</p>
                                </div>
                            </div>

                            {resolvedNotes && (
                                <div className="rounded-xl p-4" style={{ background: '#FFFBEB', border: '1px solid #FEF3C7' }}>
                                    <p className="text-xs font-semibold mb-1" style={{ color: '#92400E' }}>{isDrone ? 'Drone Upload Notes' : 'Upload Notes'}</p>
                                    <p className="text-sm" style={{ color: '#78350F' }}>{resolvedNotes}</p>
                                </div>
                            )}

                            <div className="mt-4">
                                <p className="text-xs font-semibold mb-3" style={{ color: '#374151' }}>File Previews</p>
                                <div className="grid grid-cols-4 gap-3">
                                    {Array.from({ length: Math.min((resolvedNumImages ?? 0), 8) || 4 }).map((_, i) => (
                                        <div key={i} className="rounded-xl flex flex-col items-center justify-center py-5" style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                                            <Image size={20} style={{ color: '#D1D5DB' }} />
                                            <p className="text-[10px] mt-1.5 font-medium" style={{ color: '#9CA3AF' }}>
                                                {`IMG_${String(i + 1).padStart(3, '0')}`}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-center mt-2" style={{ color: '#9CA3AF' }}>
                                    Previews are placeholders — actual files are in the linked drive folders
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 rounded-xl" style={{ background: '#F9FAFB', border: '1px dashed #E5E7EB' }}>
                            <Image size={32} className="mx-auto mb-3" style={{ color: '#D1D5DB' }} />
                            <p className="text-sm font-medium mb-1" style={{ color: '#6B7280' }}>No files uploaded yet</p>
                            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>Use the upload form above to attach the drive link to this task.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
