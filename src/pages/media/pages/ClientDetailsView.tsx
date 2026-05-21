import { useState, useEffect } from 'react'
import axios from 'axios'
import { User, Calendar, Camera, FileText, Clock, ArrowLeft, Phone, Mail, MapPin, Briefcase, Package, CheckCircle, Sparkles } from 'lucide-react'
import { getEventDetailsByLeadId } from '../../../api/eventDetails.api'
import { createNotification } from '../../../api/notification.api'
import { toast } from 'sonner'
import { useMediaRole } from '../../../hooks/useMediaRole'
import { getCreativePlanning } from '../../../api/creativePlanning.api'
import { getCreativeConfirmation } from '../../../api/creativeConfirmation.api'
import { getAssignTeam } from '../../../api/assignTeam.api'

type ClientDetailsViewProps = {
    onBack: () => void;
    client: {
        id: string;
        name: string;
        eventType: string;
        location: string;
        date: string;
        status: string;
        lead_id?: string;
        task_name?: string;
        accepted?: boolean;
    };
}

const getStatusStyle = (s: string) => {
    switch (s?.toLowerCase()) {
        case 'pending': return { background: '#FFF3E0', color: '#E65100' };
        case 'in progress': return { background: '#E8F0FE', color: '#1565C0' };
        case 'completed': return { background: '#E8F5E9', color: '#2E7D32' };
        default: return { background: '#F3F4F6', color: '#6B7280' };
    }
}



export default function ClientDetailsView({ onBack, client }: ClientDetailsViewProps) {
    const { fromRole, role, employeeId, isDrone } = useMediaRole()
    const [eventDetails, setEventDetails] = useState<any>(null)
    const [creativePlanning, setCreativePlanning] = useState<any>(null)
    const [creativeConfirmation, setCreativeConfirmation] = useState<any>(null)
    const [shootLocations, setShootLocations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [showQueryModal, setShowQueryModal] = useState(false)
    const [queryText, setQueryText] = useState('')
    const [isQuerySubmitting, setIsQuerySubmitting] = useState(false)
    const [isAccepted, setIsAccepted] = useState(client.accepted || false)
    const numericEmployeeId = employeeId ? parseInt(String(employeeId).replace(/\D/g, ''), 10) : NaN
    const rolePhotoDrive = isDrone ? eventDetails?.drone_photo_drive_link : eventDetails?.drive_link
    const roleVideoDrive = isDrone ? eventDetails?.drone_video_drive_link : eventDetails?.video_drive_link
    const roleEquipment = isDrone
        ? (eventDetails?.drone_camera_used || eventDetails?.drone_video_camera_used)
        : (eventDetails?.camera_used || eventDetails?.video_camera_used)
    const roleTotalFiles = isDrone
        ? ((eventDetails?.drone_num_images || 0) + (eventDetails?.drone_num_videos || 0))
        : ((eventDetails?.raw_images || eventDetails?.num_images || 0) + (eventDetails?.raw_videos || eventDetails?.num_videos || 0))
    const assignmentTaskName = client.task_name || (isDrone
        ? 'Drone Coverage'
        : fromRole === 'videographer'
            ? 'Videography'
            : 'Photography')

    const handleRaiseQuery = async () => {
        if (!queryText.trim()) return;
        setIsQuerySubmitting(true);
        try {
            await createNotification({
                type: 'query',
                title: `Query raised regarding lead ${client.id}`,
                detail: queryText,
                lead_id: client.lead_id ? Number(client.lead_id) : undefined,
                from_role: fromRole,
                from_name: role,
                target_roles: ['admin', 'post-production-crm']
            });
            toast.success('Query submitted successfully');
            setShowQueryModal(false);
            setQueryText('');
        } catch (error) {
            console.error('Failed to raise query', error);
            toast.error('Failed to submit query');
        } finally {
            setIsQuerySubmitting(false);
        }
    };

    const handleAcceptAssignment = async () => {
        const lookupId = client.lead_id || client.id;
        if (!lookupId) return;
        try {
            await axios.patch(`${import.meta.env.VITE_API_URL}/assign-team/${lookupId}/accept`, {
                employeeId: numericEmployeeId,
                taskName: assignmentTaskName
            });
            setIsAccepted(true);
            toast.success('Assignment accepted successfully');
        } catch (error) {
            console.error('Failed to accept assignment', error);
            toast.error('Failed to accept assignment');
        }
    };

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const lookupId = client.lead_id || client.id
                const res = await getEventDetailsByLeadId(lookupId)

                setEventDetails(res.data)

                try {
                    const [cpRes, ccRes, assignTeamRes] = await Promise.all([
                        getCreativePlanning(String(lookupId)),
                        getCreativeConfirmation(String(lookupId)),
                        getAssignTeam(String(lookupId))
                    ])
                    setCreativePlanning(cpRes?.data?.data || cpRes?.data)
                    setCreativeConfirmation(ccRes?.data?.data || ccRes?.data)
                    if (assignTeamRes?.data?.data) {
                        setShootLocations(assignTeamRes.data.data.shoot_locations || [])
                    } else if (assignTeamRes?.data) {
                        setShootLocations(assignTeamRes.data.shoot_locations || [])
                    }
                } catch (cpErr) {
                    console.error("Failed to fetch creative or assignment details", cpErr)
                }

            } catch (err) {
                console.error("Failed to fetch event details", err)
            } finally {
                setLoading(false)
            }
        }
        fetchDetails()

        // Removed fetchAcceptedStatus
    }, [client.id, client.lead_id, employeeId, numericEmployeeId, assignmentTaskName])

    return (
        <div className="w-full max-w-[1400px]">
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm font-medium hover:text-purple-700 transition-colors mb-4"
                style={{ color: '#6B7280' }}
            >
                <ArrowLeft size={16} /> Back to Leads
            </button>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Client Details</h1>
                    <p className="text-sm mt-1 font-medium" style={{ color: '#6B7280' }}>{client.id} · {client.name}</p>
                </div>
                <span className="crm-badge" style={getStatusStyle(client.status)}>
                    {client.status}
                </span>
            </div>

            {!isAccepted && (
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-5 text-center">
                    <h2 className="text-lg font-bold text-gray-900 mb-2">New Assignment</h2>
                    <p className="text-sm text-gray-500 mb-4">You have been assigned to this project as a {assignmentTaskName}. Please review the details and accept the assignment.</p>
                    <button
                        onClick={handleAcceptAssignment}
                        className="px-6 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors inline-flex items-center gap-2 shadow-sm"
                    >
                        <CheckCircle size={16} /> Accept Assignment
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                <div className="crm-card p-6 relative">
                    <h2 className="text-sm font-semibold flex items-center gap-2 mb-5" style={{ color: '#111827' }}>
                        <User size={16} style={{ color: '#5B5FC7' }} /> Client Information
                    </h2>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#F3F4F6' }}>
                                <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>Client Name</span>
                                <span className="text-sm font-semibold" style={{ color: '#111827' }}>{eventDetails?.client_name || client.name}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#F3F4F6' }}>
                                <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#6B7280' }}><Phone size={14} /> Phone Number</span>
                                <span className="text-sm font-semibold" style={{ color: '#111827' }}>{eventDetails?.phone || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#F3F4F6' }}>
                                <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#6B7280' }}><Mail size={14} /> Email</span>
                                <span className="text-sm font-semibold truncate max-w-[200px]" style={{ color: '#111827' }}>{eventDetails?.email || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#F3F4F6' }}>
                                <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>Contact Person</span>
                                <span className="text-sm font-semibold" style={{ color: '#111827' }}>{eventDetails?.contact_person_name || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#F3F4F6' }}>
                                <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>Contact Number</span>
                                <span className="text-sm font-semibold" style={{ color: '#111827' }}>{eventDetails?.contact_person_number || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#F3F4F6' }}>
                                <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>Event Type</span>
                                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: '#E0F2E9', color: '#2E7D51' }}>{eventDetails?.event_type || client.eventType}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#F3F4F6' }}>
                                <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>Event Date</span>
                                <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: '#111827' }}>
                                    <Calendar size={14} style={{ color: '#6B7280' }} /> {eventDetails?.preferred_date || client.date || '—'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#F3F4F6' }}>
                                <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>Event Time</span>
                                <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: '#111827' }}>
                                    <Clock size={14} style={{ color: '#6B7280' }} /> {eventDetails?.preferred_time || '—'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2" style={{ borderColor: '#F3F4F6' }}>
                                <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#6B7280' }}><MapPin size={14} /> Location</span>
                                <span className="text-sm font-semibold" style={{ color: '#111827' }}>{eventDetails?.event_location || client.location || '—'}</span>
                            </div>

                            {eventDetails?.services && eventDetails.services.length > 0 && (
                                <div className="mt-4 pt-4 border-t" style={{ borderColor: '#F3F4F6' }}>
                                    <span className="text-xs font-semibold flex items-center gap-1.5 mb-2" style={{ color: '#6B7280' }}>
                                        <Briefcase size={14} /> Services
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {eventDetails.services.map((s: string, i: number) => (
                                            <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-md border" style={{ background: '#F5F3FF', color: '#5B5FC7', borderColor: '#E5E7EB' }}>{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {eventDetails?.deliverables && eventDetails.deliverables.length > 0 && (
                                <div className="mt-4 pt-4 border-t" style={{ borderColor: '#F3F4F6' }}>
                                    <span className="text-xs font-semibold flex items-center gap-1.5 mb-2" style={{ color: '#6B7280' }}>
                                        <Package size={14} /> Deliverables
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {eventDetails.deliverables.map((d: string, i: number) => (
                                            <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-md border" style={{ background: '#E8F0FE', color: '#1565C0', borderColor: '#E5E7EB' }}>{d}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {eventDetails?.meeting_type && (
                                <div className="mt-4 pt-4 border-t" style={{ borderColor: '#F3F4F6' }}>
                                    <span className="text-xs font-semibold mb-2 block" style={{ color: '#6B7280' }}>Meeting Preference</span>
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-md border" style={{ background: '#FFF3E0', color: '#E65100', borderColor: '#FFE0B2' }}>{eventDetails.meeting_type}</span>
                                    {eventDetails.meeting_details && (
                                        <p className="text-xs mt-2 font-medium" style={{ color: '#4B5563' }}>{eventDetails.meeting_details}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-5">
                    <div className="crm-card p-6">
                        <h2 className="text-sm font-semibold flex items-center gap-2 mb-5" style={{ color: '#111827' }}>
                            <Camera size={16} style={{ color: '#E65100' }} /> Raw Data Received
                        </h2>

                        <div className="border rounded-xl p-5 mb-5 bg-gray-50 bg-opacity-50 flex flex-col items-center justify-center text-center" style={{ borderColor: '#E5E7EB', minHeight: '120px' }}>
                            {rolePhotoDrive || roleVideoDrive ? (
                                <>
                                    <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
                                        <CheckCircle size={24} />
                                    </div>
                                    <h3 className="text-sm font-bold mb-1" style={{ color: '#111827' }}>Files Uploaded</h3>
                                    <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Drive link has been provided</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center" style={{ background: '#FFF3E0', color: '#E65100' }}>
                                        <Clock size={24} />
                                    </div>
                                    <h3 className="text-sm font-bold mb-1" style={{ color: '#111827' }}>Waiting for Files</h3>
                                    <p className="text-xs font-medium" style={{ color: '#6B7280' }}>No drive link provided yet</p>
                                </>
                            )}
                        </div>

                        {(rolePhotoDrive || roleVideoDrive) && (
                            <div className="space-y-3 mb-5">
                                <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#F3F4F6' }}>
                                    <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>Total Files</span>
                                    <span className="text-sm font-semibold" style={{ color: '#111827' }}>
                                        {roleTotalFiles}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#F3F4F6' }}>
                                    <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>{isDrone ? 'Drone Equipment' : 'Camera Used'}</span>
                                    <span className="text-sm font-semibold" style={{ color: '#111827' }}>{roleEquipment || '—'}</span>
                                </div>
                            </div>
                        )}

                        <button
                            className="w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: '#F5F3FF', color: '#5B5FC7' }}
                            disabled={!(rolePhotoDrive || roleVideoDrive)}
                            onClick={() => (rolePhotoDrive || roleVideoDrive) && window.open(roleVideoDrive || rolePhotoDrive, '_blank')}
                        >
                            <Sparkles size={14} /> View Drive Folder
                        </button>
                    </div>

                    <div className="crm-card p-6">
                        <h2 className="text-sm font-semibold flex items-center gap-2 mb-5" style={{ color: '#111827' }}>
                            <Sparkles size={16} style={{ color: '#1565C0' }} /> Shoot Details
                        </h2>
                        <div className="flex justify-between items-center py-3 border-b" style={{ borderColor: '#F3F4F6' }}>
                            <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>Event Type</span>
                            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold">{eventDetails?.event_type || client.eventType || '—'}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b" style={{ borderColor: '#F3F4F6' }}>
                            <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>Shoot Date</span>
                            <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#E65100' }}>
                                <Clock size={14} /> {eventDetails?.preferred_date || client.date || '—'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>Location</span>
                            <span className="text-xs font-bold" style={{ color: '#111827' }}>{eventDetails?.event_location || client.location || '—'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {creativeConfirmation && (() => {
                const colors = Array.isArray(creativeConfirmation.color_preferences) ? creativeConfirmation.color_preferences : (typeof creativeConfirmation.color_preferences === 'string' ? JSON.parse(creativeConfirmation.color_preferences || '[]') : []);
                const images = Array.isArray(creativeConfirmation.reference_images) ? creativeConfirmation.reference_images : (typeof creativeConfirmation.reference_images === 'string' ? JSON.parse(creativeConfirmation.reference_images || '[]') : []);
                return (
                    <div className="crm-card p-6 mb-6">
                        <h2 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: '#111827' }}>
                            <Sparkles size={16} className="text-purple-600" /> Creative Confirmation Details
                        </h2>

                        <div className="mb-4">
                            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Costume Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <p className="text-xs text-gray-500 mb-1">Costume Type</p>
                                    <p className="text-sm font-semibold text-gray-900">{creativeConfirmation.costume_type || '—'}</p>
                                </div>
                                <div className="p-4 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <p className="text-xs text-gray-500 mb-1">Color Preferences</p>
                                    <p className="text-sm font-semibold text-gray-900">{colors.length > 0 ? colors.join(', ') : '—'}</p>
                                </div>
                                <div className="p-4 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <p className="text-xs text-gray-500 mb-1">Special Requirements</p>
                                    <p className="text-sm font-semibold text-gray-900">{creativeConfirmation.costume_requirements || '—'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Concept Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <p className="text-xs text-gray-500 mb-1">Event Theme</p>
                                    <p className="text-sm font-semibold text-gray-900">{creativeConfirmation.event_theme || '—'}</p>
                                </div>
                                <div className="p-4 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <p className="text-xs text-gray-500 mb-1">Mood Description</p>
                                    <p className="text-sm font-semibold text-gray-900">{creativeConfirmation.mood_description || '—'}</p>
                                </div>
                            </div>
                            {images.length > 0 && (
                                <div className="mt-4 p-4 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <p className="text-xs text-gray-500 mb-2">Reference Images</p>
                                    <div className="flex gap-3 flex-wrap">
                                        {images.map((img: string, i: number) => (
                                            <a key={i} href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${img}`} target="_blank" rel="noreferrer">
                                                <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${img}`} className="w-16 h-16 object-cover rounded-md border" alt="ref" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Location & Status</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <p className="text-xs text-gray-500 mb-1">Location Name</p>
                                    <p className="text-sm font-semibold text-gray-900">{creativeConfirmation.location_name || '—'}</p>
                                </div>
                                <div className="p-4 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <p className="text-xs text-gray-500 mb-1">Location Type</p>
                                    <p className="text-sm font-semibold text-gray-900">{creativeConfirmation.location_type || '—'}</p>
                                </div>
                                <div className="p-4 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                    <p className="text-xs text-gray-500 mb-1">Google Map Link</p>
                                    {creativeConfirmation.google_map_link ? (
                                        <a href={creativeConfirmation.google_map_link} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline truncate block">View Map</a>
                                    ) : <p className="text-sm font-semibold text-gray-900">—</p>}
                                </div>
                                <div className="p-4 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
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
                    <div className="crm-card p-6 mb-6">
                        <h2 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: '#111827' }}>
                            <Sparkles size={16} className="text-blue-600" /> Creative Planning Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="p-4 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                <p className="text-xs text-gray-500 mb-2">Equipment Required</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {equipment.length > 0 ? equipment.map((e: string, i: number) => <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-[10px] font-bold border border-purple-100">{e}</span>) : <span className="text-sm font-semibold text-gray-900">—</span>}
                                </div>
                            </div>
                            <div className="p-4 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                <p className="text-xs text-gray-500 mb-2">Lighting Setup</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {lighting.length > 0 ? lighting.map((l: string, i: number) => <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold border border-blue-100">{l}</span>) : <span className="text-sm font-semibold text-gray-900">—</span>}
                                </div>
                            </div>
                            <div className="p-4 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                <p className="text-xs text-gray-500 mb-2">Props Required</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {props.length > 0 ? props.map((p: string, i: number) => <span key={i} className="px-2 py-1 bg-orange-50 text-orange-700 rounded-md text-[10px] font-bold border border-orange-100">{p}</span>) : <span className="text-sm font-semibold text-gray-900">—</span>}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                <p className="text-xs text-gray-500 mb-1">Event List</p>
                                <p className="text-sm font-semibold text-gray-900 whitespace-pre-wrap">{creativePlanning.event_list || '—'}</p>
                            </div>
                            <div className="p-4 rounded-xl" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                <p className="text-xs text-gray-500 mb-1">Special Notes</p>
                                <p className="text-sm font-semibold text-gray-900 whitespace-pre-wrap">{creativePlanning.special_notes || '—'}</p>
                            </div>
                        </div>
                    </div>
                );
            })()}


            {/* Shoot Locations Section */}
            <div className="crm-card p-6 mb-6">
                <h2 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: '#111827' }}>
                    <MapPin size={16} className="text-purple-600" /> Shoot Locations
                </h2>
                {shootLocations && shootLocations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {shootLocations.map((loc: any, idx: number) => (
                            <div key={idx} className="p-4 rounded-xl flex items-start justify-between gap-4" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB' }}>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-gray-500 mb-1">Location {idx + 1}</p>
                                    <p className="text-sm font-bold text-gray-900">{loc.label || `Location ${idx + 1}`}</p>
                                    {loc.time && (
                                        <p className="mt-2 text-xs font-semibold text-gray-700">Time: {loc.time}</p>
                                    )}
                                    {loc.concept && (
                                        <p className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">{loc.concept}</p>
                                    )}
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
                ) : (
                    <div className="p-4 rounded-xl text-sm font-medium text-center" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB', color: '#9CA3AF' }}>
                        No shoot locations assigned yet.
                    </div>
                )}
            </div>


            <div className="crm-card p-6 mb-6">
                <h2 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: '#111827' }}>
                    <FileText size={16} style={{ color: '#2E7D32' }} /> Client Requirements
                </h2>
                <div className="p-4 rounded-xl text-sm font-medium" style={{ background: '#FAFAFA', border: '1px solid #E5E7EB', color: '#4B5563' }}>
                    {eventDetails?.client_requirements || 'No client requirements specified.'}
                </div>
            </div>

            <div
                className="sticky bottom-0 z-20 flex justify-end gap-3 mt-6 pt-4"
                style={{
                    background: 'rgba(255,255,255,0.96)',
                    backdropFilter: 'blur(8px)',
                    borderTop: '1px solid #F3F4F6'
                }}
            >
                <button
                    type="button"
                    onClick={() => setShowQueryModal(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    Raise Query
                </button>

            </div>

            {showQueryModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Raise a Query</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Send a question or clarify details regarding lead {client.id} ({client.name}). This will notify the Admin and CRM team.
                        </p>
                        <textarea
                            value={queryText}
                            onChange={(e) => setQueryText(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-h-[120px] mb-4"
                            placeholder="Type your query here..."
                        ></textarea>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowQueryModal(false); setQueryText(''); }}
                                className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRaiseQuery}
                                disabled={isQuerySubmitting || !queryText.trim()}
                                className="px-5 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isQuerySubmitting ? 'Sending...' : 'Submit Query'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
