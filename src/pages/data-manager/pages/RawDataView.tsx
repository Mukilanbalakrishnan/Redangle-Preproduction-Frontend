import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Calendar, Camera, Video, CheckCircle, RotateCcw, Image as ImageIcon, Send, Users, Link2, HardDrive, MapPin, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { createNotification } from '../../../api/notification.api'
const API_URL = import.meta.env.VITE_API_URL

const safeParseJSON = (str: string | null) => {
    if (!str) return null
    try {
        return JSON.parse(str)
    } catch {
        return null
    }
}

export const renderClipLink = (val: string) => {
    if (!val) return '—'
    const isUrl = val.startsWith('http') || val.startsWith('/uploads') || val.includes('.') || val.includes('/')
    if (isUrl) {
        const href = val.startsWith('http') ? val : `${API_URL.replace('/api', '')}${val.startsWith('/') ? '' : '/'}${val}`
        const isImage = val.match(/\.(jpeg|jpg|gif|png|webp|bmp|tif|tiff)$/i)
        const isVideo = val.match(/\.(mp4|webm|mov|ogg|avi|wmv|mkv)$/i)

        if (isImage) {
            return (
                <a href={href} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-all shadow-sm group relative shrink-0">
                    <img src={href} alt="Clip" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImageIcon size={16} className="text-white" />
                    </div>
                </a>
            )
        }
        
        if (isVideo) {
            return (
                <a href={href} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-pink-400 transition-all shadow-sm group relative shrink-0">
                    <video src={href} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Video size={16} className="text-white" />
                    </div>
                </a>
            )
        }

        return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 underline truncate block max-w-[150px]" title={val}>View Clip ↗</a>
    }
    return <span className="truncate max-w-[150px] inline-block" title={val}>{val}</span>
}

export const ShootDetailsViewer = ({ details, clientName }: { details: any, clientName?: string }) => {
    if (!details) return null
    
    const sDate = details.shootDate || details.shoot_date
    const sName = details.shootName || details.shoot_name
    const sLoc = details.location || details.shoot_location
    const sClient = details.clientName || details.client_name || clientName
    const sCard = details.cardType || details.card_type
    const sService = details.service || details.service_name
    const sCount = details.count || details.media_count || 0
    const sCr3Count = details.cr3Count
    const sCr3Mode = details.cr3_mode
    const sFirstClip = details.firstClip || details.first_clip
    const sLastClip = details.lastClip || details.last_clip

    let countDisplay = String(sCount)
    if (sCr3Count) countDisplay = `${sCount} (CR3: ${sCr3Count})`
    else if (sCr3Mode === 'with_cr3') countDisplay = `${sCount} (CR3 Included)`
    else if (sCr3Mode === 'without_cr3') countDisplay = `${sCount} (No CR3)`

    return (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 shadow-sm mb-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-200 pb-2">Submitted Details</h3>
            <div className="space-y-2 text-xs">
                {sDate && <div className="flex justify-between items-start gap-2"><span className="text-gray-500 shrink-0">Date:</span> <span className="font-bold text-gray-900 text-right">{sDate}</span></div>}
                {sName && <div className="flex justify-between items-start gap-2"><span className="text-gray-500 shrink-0">Shoot:</span> <span className="font-bold text-gray-900 text-right">{sName}</span></div>}
                {sLoc && <div className="flex justify-between items-start gap-2"><span className="text-gray-500 shrink-0">Location:</span> <span className="font-bold text-gray-900 text-right">{sLoc}</span></div>}
                {sClient && <div className="flex justify-between items-start gap-2"><span className="text-gray-500 shrink-0">Client Name:</span> <span className="font-bold text-gray-900 text-right">{sClient}</span></div>}
                {sCard && <div className="flex justify-between items-start gap-2"><span className="text-gray-500 shrink-0">Card Type:</span> <span className="font-bold text-gray-900 text-right">{sCard}</span></div>}
                {sService && <div className="flex justify-between items-start gap-2"><span className="text-gray-500 shrink-0">Service:</span> <span className="font-bold text-gray-900 text-right">{sService}</span></div>}
                <div className="flex justify-between items-start gap-2"><span className="text-gray-500 shrink-0">Count:</span> <span className="font-bold text-gray-900 text-right">{countDisplay}</span></div>

                {(sFirstClip || sLastClip) && (
                    <div className="pt-2 mt-2 border-t border-gray-200 space-y-1.5">
                        {sFirstClip && (
                            <div className="flex justify-between items-center gap-2">
                                <span className="text-gray-500 shrink-0">First Clip:</span>
                                {renderClipLink(sFirstClip)}
                            </div>
                        )}
                        {sLastClip && (
                            <div className="flex justify-between items-center gap-2">
                                <span className="text-gray-500 shrink-0">Last Clip:</span>
                                {renderClipLink(sLastClip)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}



export default function RawDataView({ onBack, data, apiBasePath = '/data-manager', isCrmContext = false, onCrmVerify, onSendToClient, onAssignEditingTeam }: { onBack: () => void, data: any, apiBasePath?: string, isCrmContext?: boolean, onCrmVerify?: (leadId: string | number, clientName: string) => void, onSendToClient?: () => void, onAssignEditingTeam?: () => void }) {
    const navigate = useNavigate()
    const [submitting, setSubmitting] = useState(false)
    const [assignments, setAssignments] = useState<any[]>([])
    const [serverFilePath, setServerFilePath] = useState(data.rawData?.file_path || '')
    const [isSavingPath, setIsSavingPath] = useState(false)
    const rawData = data.rawData || {}
    
    const currentPhase = String(data.currentPhase ?? rawData.current_phase ?? '').trim().toLowerCase()
    const preProductionStep = String(data.preProductionStep ?? rawData.pre_production_step ?? 'shoot').trim().toLowerCase()
    const isEventPhase = currentPhase === 'event'
    const shouldAssignEditingTeam = isCrmContext && currentPhase === 'pre_production' && preProductionStep === 'editing'

    const leadId = rawData.external_lead_id || rawData.id || data.id

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const res = await fetch(`${API_URL}/employee-projects/project/CRM-${rawData.lead_serial_number || leadId}`)
                const result = await res.json()
                if (result.success) {
                    setAssignments(result.data || [])
                }
            } catch (error) {
                console.error('Failed to fetch assignments:', error)
            }
        }
        fetchAssignments()
    }, [leadId, rawData.lead_serial_number])

    useEffect(() => {
        setServerFilePath(data.rawData?.file_path || '')
    }, [data.rawData?.file_path])

    const handleUpdateFilePath = async () => {
        if (!leadId) return;
        setIsSavingPath(true);
        try {
            const res = await fetch(`${API_URL}/assign-team/${leadId}/resources`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_path: serverFilePath })
            });
            const result = await res.json();
            if (result.success) {
                toast.success('Server file path updated successfully');
            } else {
                toast.error(result.message || 'Failed to update file path');
            }
        } catch (error) {
            console.error('Update file path error:', error);
            toast.error('Connection error while updating file path');
        } finally {
            setIsSavingPath(false);
        }
    };

    const formatDate = (d?: string) => {
        if (!d) return '—'
        const date = new Date(d)
        if (isNaN(date.getTime())) return '—'
        return date.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        })
    }

    const photographer = data.photographerName || data.photographer || rawData.photographer_name || rawData.photographer || null
    const videographer = data.videographerName || data.videographer || rawData.videographer_name || rawData.videographer || null
    const drone = isEventPhase ? (data.droneName || data.drone || rawData.drone_name || rawData.drone || null) : null
    
    const rawStaff = rawData.additional_staff || data.additional_staff || rawData.event_additional_staff || data.event_additional_staff || []
    const parsedStaff = typeof rawStaff === 'string' ? (() => { try { return JSON.parse(rawStaff) } catch { return [] } })() : rawStaff
    const additionalStaff = Array.isArray(parsedStaff) ? parsedStaff : []

    const parseFreelancer = (entry: string) => {
        let displayName = entry;
        let phone = '';
        if (entry.includes('::')) {
            const rawNamePart = entry.split('::')[0];
            if (rawNamePart.startsWith('FREELANCE_')) {
                const withoutPrefix = rawNamePart.replace('FREELANCE_', '');
                const parts = withoutPrefix.split('_');
                if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) {
                    phone = parts.pop() || '';
                }
                displayName = parts.join(' ');
            } else {
                displayName = rawNamePart;
            }
        }
        return { displayName, phone };
    };

    const photographerStaff = additionalStaff.filter((entry: string) => {
        if (!entry.includes('::')) return true;
        const role = entry.split('::')[1]?.toLowerCase() || '';
        return role.includes('photograph') || role.includes('photo');
    })

    const videographerStaff = additionalStaff.filter((entry: string) => {
        if (!entry.includes('::')) return true;
        const role = entry.split('::')[1]?.toLowerCase() || '';
        return role.includes('videograph') || role.includes('video') || role.includes('cinematograph');
    })

    const droneStaff = additionalStaff.filter((entry: string) => {
        if (!entry.includes('::')) return true;
        const role = entry.split('::')[1]?.toLowerCase() || '';
        return role.includes('drone') || role.includes('pilot');
    })
    const numImages = data.numImages ?? rawData.num_images ?? 0
    const numVideos = data.numVideos ?? rawData.num_videos ?? 0
    const photoDrive = data.drive_link ?? rawData.drive_link ?? null
    const videoDrive = data.video_drive_link ?? rawData.video_drive_link ?? null
    const dronePhotoDrive = isEventPhase ? (data.drone_photo_drive_link ?? rawData.drone_photo_drive_link ?? null) : null
    const droneVideoDrive = isEventPhase ? (data.drone_video_drive_link ?? rawData.drone_video_drive_link ?? null) : null
    
    const photoDetails = safeParseJSON(rawData.upload_notes)
    const videoDetails = safeParseJSON(rawData.video_upload_notes)
    const dronePhotoDetails = safeParseJSON(rawData.drone_upload_notes)
    const droneVideoDetails = safeParseJSON(rawData.drone_video_upload_notes)

    const bestShootDate = photoDetails?.shootDate || photoDetails?.shoot_date || videoDetails?.shootDate || videoDetails?.shoot_date || dronePhotoDetails?.shootDate || dronePhotoDetails?.shoot_date || data.date
    const bestShootName = photoDetails?.shootName || photoDetails?.shoot_name || videoDetails?.shootName || videoDetails?.shoot_name || dronePhotoDetails?.shootName || dronePhotoDetails?.shoot_name || data.shootTitle || rawData.event_type
    const bestLocation = photoDetails?.location || photoDetails?.shoot_location || videoDetails?.location || videoDetails?.shoot_location || dronePhotoDetails?.location || dronePhotoDetails?.shoot_location || data.eventLocation || rawData.event_location
    const bestClientName = photoDetails?.clientName || photoDetails?.client_name || videoDetails?.clientName || videoDetails?.client_name || dronePhotoDetails?.clientName || dronePhotoDetails?.client_name || rawData.client || data.client || rawData.client_name
    const bestService = photoDetails?.service || photoDetails?.service_name || videoDetails?.service || videoDetails?.service_name || dronePhotoDetails?.service || dronePhotoDetails?.service_name || (Array.isArray(rawData.services) ? rawData.services.join(', ') : rawData.services) || (Array.isArray(data.services) ? data.services.join(', ') : data.services)

    const preProductionLinks = [
        { label: 'Save the Date', href: rawData.save_the_date_drive_link, notes: rawData.save_the_date_upload_notes },
        { label: 'Save the Video', href: rawData.save_the_video_drive_link, notes: rawData.save_the_video_upload_notes },
        { label: 'Retouch', href: rawData.retouch_drive_link, notes: rawData.retouch_upload_notes },
    ].filter(item => Boolean(item.href))

    const hardDiskDeliveries = [
        { role: 'Photographer', employee: photographer, date: rawData.photo_hard_disk_delivery_date, received: Boolean(rawData.photo_hard_disk_received) },
        { role: 'Videographer', employee: videographer, date: rawData.video_hard_disk_delivery_date, received: Boolean(rawData.video_hard_disk_received) },
        { role: 'Drone Operator', employee: drone, date: isEventPhase ? rawData.drone_hard_disk_delivery_date : null, received: Boolean(rawData.drone_hard_disk_received) },
    ].filter(item => Boolean(item.date))

    const photoHardDisk = hardDiskDeliveries.find(h => h.role === 'Photographer')
    const videoHardDisk = hardDiskDeliveries.find(h => h.role === 'Videographer')
    const droneHardDisk = hardDiskDeliveries.find(h => h.role === 'Drone Operator')
    const hasPendingHardDisk = hardDiskDeliveries.some(item => !item.received)

    const displayId = data.serialNumber || rawData.lead_serial_number || leadId
    const verificationStatus = String(data.status ?? rawData.media_status ?? '').trim().toLowerCase()
    const isCrmVerified = verificationStatus === 'crm_verified' || verificationStatus === 'harddisk_closed'
    const isDmVerified = verificationStatus === 'verified' || isCrmVerified
    const verificationDone = isCrmContext ? isCrmVerified : isDmVerified

    const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false)
    const [reuploadRemarks, setReuploadRemarks] = useState('')
    const [actionTargetRole, setActionTargetRole] = useState<string | null>(null)
    const [localApprovedRoles, setLocalApprovedRoles] = useState<string[]>([])

    useEffect(() => {
        if (isCrmContext) return
        const approved = []
        if (rawData.photo_approved || data.photo_approved) approved.push('photographer')
        if (rawData.video_approved || data.video_approved) approved.push('videographer')
        if (rawData.drone_approved || data.drone_approved) approved.push('drone')
        setLocalApprovedRoles(approved)
    }, [rawData.photo_approved, data.photo_approved, rawData.video_approved, data.video_approved, rawData.drone_approved, data.drone_approved, isCrmContext])

    const getRolesNeeded = () => {
        const needed = []
        if (photoDetails || photoDrive || photographer) needed.push('photographer')
        if (videoDetails || videoDrive || videographer) needed.push('videographer')
        if (isEventPhase && (dronePhotoDetails || droneVideoDetails || dronePhotoDrive || droneVideoDrive || drone)) needed.push('drone')
        return needed.length > 0 ? needed : ['all'] // fallback for pre-production if no roles matched
    }

    const handleLocalApprove = async (role: string) => {
        const needed = getRolesNeeded()
        const newApproved = [...localApprovedRoles, role]
        setLocalApprovedRoles(newApproved)
        
        try {
            await fetch(`${API_URL}${apiBasePath}/${leadId}/partial-approve`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role })
            })
        } catch (e) {
            console.error('Failed partial approve', e)
        }
        
        const allApproved = needed.every(r => newApproved.includes(r))
        if (allApproved || needed.includes('all')) {
            handleAction('verify', role)
        }
    }

    const handleAction = async (action: 'verify' | 'request-reupload', role: string | null = null) => {
        if (action === 'request-reupload' && !isReuploadModalOpen) {
            setActionTargetRole(role)
            setIsReuploadModalOpen(true)
            return
        }

        setSubmitting(true)
        try {
            const endpoint = action === 'verify' && isCrmContext ? 'crm-verify' : action
            
            let remarks = reuploadRemarks
            if (action === 'request-reupload' && actionTargetRole) {
                remarks = `[${actionTargetRole.toUpperCase()}] ${remarks}`
            }

            const res = await fetch(`${API_URL}${apiBasePath}/${leadId}/${endpoint}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: action === 'request-reupload' ? JSON.stringify({ remarks, role: actionTargetRole }) : undefined
            })
            const result = await res.json()
            if (result.success) {
                toast.success(action === 'verify' ? 'Files verified successfully' : 'Re-upload requested successfully')
                setIsReuploadModalOpen(false)
                
                if (action === 'request-reupload' && actionTargetRole) {
                    await createNotification({
                        type: 'reupload_request',
                        title: 'Rework Requested',
                        detail: `Data Manager requested rework for lead ${data.serialNumber || rawData.lead_serial_number || leadId}. Remarks: ${reuploadRemarks}`,
                        lead_id: leadId,
                        from_role: 'data_manager',
                        target_roles: [actionTargetRole]
                    }).catch(console.error)
                }

                setReuploadRemarks('')
                setActionTargetRole(null)

                if (action === 'verify') {
                    if (isCrmContext) {
                        await fetch(`${API_URL}/stage/update`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ external_lead_id: leadId, stage_name: 'crm_verified' })
                        }).catch(console.error)

                        if (onCrmVerify) {
                            onCrmVerify(leadId, rawData.client || data.client)
                            return 
                        }
                    } else {
                        await fetch(`${API_URL}/stage/update`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ external_lead_id: leadId, stage_name: 'data_manager_verification' })
                        }).catch(console.error)
                    }
                }

                if (action === 'request-reupload' && isCrmContext) {
                    toast.success('Sent back to Data Manager for re-upload')
                }

                if (action === 'verify' && !isCrmContext) {
                    const verificationUrl = isEventPhase ? '/data-manager/event/verification' : '/data-manager/pre-production/verification'
                    navigate(verificationUrl)
                } else {
                    onBack()
                }
            } else {
                toast.error(result.message || `Failed to ${action}`)
            }
        } catch (error) {
            console.error(`Error performing action ${action}:`, error)
            toast.error('An unexpected error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    const markHardDiskReceived = async () => {
        setSubmitting(true)
        try {
            const res = await fetch(`${API_URL}${apiBasePath}/${leadId}/hard-disk-received`, {
                method: 'PATCH'
            })
            const result = await res.json()
            if (result.success) {
                toast.success('Hard disk marked as received')
                onBack()
            } else {
                toast.error(result.message || 'Failed to mark hard disk as received')
            }
        } catch (error) {
            console.error('Error marking hard disk received:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    // Reusable UI Components for Left/Right Boxes
    const DetailSection = ({ title, value }: { title: string, value: any }) => (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</span>
            <span className="text-sm font-semibold text-gray-900">{value || '—'}</span>
        </div>
    )



    return (
        <div className="max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Digital Submission Review</h1>
                    <p className="text-sm text-gray-500 mt-1">Lead ID: {displayId} &nbsp;·&nbsp; Client: {rawData.client || data.client}</p>
                </div>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors text-gray-700 bg-white shadow-sm"
                >
                    <ArrowLeft size={16} /> Back
                </button>
            </div>

            {/* TOP BOX: Client Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                    <User size={18} className="text-indigo-600" />
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Client & Shoot Details</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Calendar size={16} /></div>
                        <DetailSection title="Date" value={formatDate(bestShootDate)} />
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Camera size={16} /></div>
                        <DetailSection title="Shoot Type" value={bestShootName} />
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><MapPin size={16} /></div>
                        <DetailSection title="Location" value={bestLocation} />
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Briefcase size={16} /></div>
                        <DetailSection title="Service" value={bestService} />
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><User size={16} /></div>
                        <DetailSection title="Client Name" value={bestClientName} />
                    </div>
                </div>
            </div>

            {/* SPLIT BOXES: Photography (Left) vs Videography (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                
                {/* LEFT BOX: Photography Details */}
                <div className="bg-white rounded-xl border-t-4 border-t-blue-500 border-x border-b border-gray-200 p-6 shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                            <ImageIcon size={22} className="text-blue-500" /> Photography Details
                        </h2>
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                            {numImages} Photos
                        </span>
                    </div>

                    <div className="space-y-6 flex-grow">
                        {/* Team Member */}
                        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm border border-gray-200 shrink-0">
                                    <User size={18} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Assigned Photographer</div>
                                    <div className="text-sm font-bold text-gray-900">{photographer || 'Unassigned'}</div>
                                </div>
                            </div>
                            
                            {photographerStaff.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Freelancer</div>
                                    <div className="flex flex-col gap-2">
                                        {photographerStaff.map((entry: string, i: number) => {
                                            const { displayName, phone } = parseFreelancer(entry);
                                            return (
                                                <div key={i} className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg border border-blue-100/60">
                                                    <div>
                                                        <div className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">Name</div>
                                                        <div className="text-xs font-bold text-blue-900 capitalize leading-none">{displayName}</div>
                                                    </div>
                                                    {phone && (
                                                        <div className="text-right">
                                                            <div className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">Mobile Number</div>
                                                            <div className="text-xs font-bold text-blue-900 leading-none">{phone}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submitted Details from JSON */}
                        <ShootDetailsViewer details={photoDetails} clientName={rawData.client || data.client} />

                        {/* Media Links / Previews */}
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Submitted Media Link</span>
                            
                            {photoDrive ? (
                                <a href={photoDrive} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4 transition-colors">
                                    <Link2 size={16} /> Google Drive Link ↗
                                </a>
                            ) : <p className="text-sm text-gray-400 italic">No drive link provided.</p>}
                        </div>

                        {/* Hard Disk Status */}
                        {photoHardDisk && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 mt-auto">
                                <div className="flex items-center gap-2">
                                    <HardDrive size={16} className="text-gray-500" />
                                    <span className="text-xs font-bold text-gray-700">Hard Disk Delivery</span>
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${photoHardDisk.received ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {photoHardDisk.received ? 'RECEIVED' : 'PENDING'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Verification Actions */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        {verificationDone ? (
                            <div className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm border border-emerald-100">
                                <CheckCircle size={18} /> {isCrmVerified ? 'CRM Verified' : 'Data Manager Verified'}
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                {localApprovedRoles.includes('photographer') ? (
                                    <button
                                        disabled
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-blue-700 bg-blue-50 border border-blue-100 opacity-60 cursor-not-allowed"
                                    >
                                        <CheckCircle size={16} /> Approved
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleLocalApprove('photographer')}
                                        disabled={submitting}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 shadow-sm"
                                        style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                                    >
                                        <CheckCircle size={16} /> Approve Photos
                                    </button>
                                )}
                                <button
                                    onClick={() => handleAction('request-reupload', 'photographer')}
                                    disabled={submitting}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                    <RotateCcw size={16} /> Re-upload
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT BOX: Videography Details */}
                <div className="bg-white rounded-xl border-t-4 border-t-pink-500 border-x border-b border-gray-200 p-6 shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-pink-800 flex items-center gap-2">
                            <Video size={22} className="text-pink-500" /> Videography Details
                        </h2>
                        <span className="px-3 py-1 bg-pink-50 text-pink-700 text-xs font-bold rounded-full border border-pink-100">
                            {numVideos} Videos
                        </span>
                    </div>

                    <div className="space-y-6 flex-grow">
                        {/* Team Member */}
                        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-pink-600 shadow-sm border border-gray-200 shrink-0">
                                    <User size={18} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Assigned Videographer</div>
                                    <div className="text-sm font-bold text-gray-900">{videographer || 'Unassigned'}</div>
                                </div>
                            </div>

                            {videographerStaff.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Freelancer</div>
                                    <div className="flex flex-col gap-2">
                                        {videographerStaff.map((entry: string, i: number) => {
                                            const { displayName, phone } = parseFreelancer(entry);
                                            return (
                                                <div key={i} className="flex items-center justify-between p-2.5 bg-pink-50 rounded-lg border border-pink-100/60">
                                                    <div>
                                                        <div className="text-[9px] font-bold text-pink-400 uppercase tracking-wider mb-0.5">Name</div>
                                                        <div className="text-xs font-bold text-pink-900 capitalize leading-none">{displayName}</div>
                                                    </div>
                                                    {phone && (
                                                        <div className="text-right">
                                                            <div className="text-[9px] font-bold text-pink-400 uppercase tracking-wider mb-0.5">Mobile Number</div>
                                                            <div className="text-xs font-bold text-pink-900 leading-none">{phone}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submitted Details from JSON */}
                        <ShootDetailsViewer details={videoDetails} clientName={rawData.client || data.client} />

                        {/* Media Links / Previews */}
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Submitted Media Link</span>
                            
                            {videoDrive ? (
                                <a href={videoDrive} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-pink-600 hover:text-pink-800 bg-pink-50 p-3 rounded-lg border border-pink-100 mb-4 transition-colors">
                                    <Link2 size={16} /> Google Drive Link ↗
                                </a>
                            ) : <p className="text-sm text-gray-400 italic">No drive link provided.</p>}
                        </div>

                        {/* Hard Disk Status */}
                        {videoHardDisk && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 mt-auto">
                                <div className="flex items-center gap-2">
                                    <HardDrive size={16} className="text-gray-500" />
                                    <span className="text-xs font-bold text-gray-700">Hard Disk Delivery</span>
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${videoHardDisk.received ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {videoHardDisk.received ? 'RECEIVED' : 'PENDING'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Verification Actions */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        {verificationDone ? (
                            <div className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm border border-emerald-100">
                                <CheckCircle size={18} /> {isCrmVerified ? 'CRM Verified' : 'Data Manager Verified'}
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                {localApprovedRoles.includes('videographer') ? (
                                    <button
                                        disabled
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-pink-700 bg-pink-50 border border-pink-100 opacity-60 cursor-not-allowed"
                                    >
                                        <CheckCircle size={16} /> Approved
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleLocalApprove('videographer')}
                                        disabled={submitting}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 shadow-sm"
                                        style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}
                                    >
                                        <CheckCircle size={16} /> Approve Videos
                                    </button>
                                )}
                                <button
                                    onClick={() => handleAction('request-reupload', 'videographer')}
                                    disabled={submitting}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                    <RotateCcw size={16} /> Re-upload
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* DRONE BOX (Conditional) */}
            {isEventPhase && (dronePhotoDetails || droneVideoDetails || dronePhotoDrive || droneVideoDrive || drone) && (
                <div className="bg-white rounded-xl border-t-4 border-t-teal-500 border-x border-b border-gray-200 p-6 shadow-sm mb-6 flex flex-col md:w-1/2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-teal-800 flex items-center gap-2">
                            <Camera size={22} className="text-teal-500" /> Drone Operator Details
                        </h2>
                    </div>

                    <div className="space-y-6 flex-grow">
                        {/* Team Member */}
                        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-teal-600 shadow-sm border border-gray-200 shrink-0">
                                    <User size={18} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Assigned Drone Operator</div>
                                    <div className="text-sm font-bold text-gray-900">{drone || 'Unassigned'}</div>
                                </div>
                            </div>

                            {droneStaff.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Freelancer</div>
                                    <div className="flex flex-col gap-2">
                                        {droneStaff.map((entry: string, i: number) => {
                                            const { displayName, phone } = parseFreelancer(entry);
                                            return (
                                                <div key={i} className="flex items-center justify-between p-2.5 bg-teal-50 rounded-lg border border-teal-100/60">
                                                    <div>
                                                        <div className="text-[9px] font-bold text-teal-400 uppercase tracking-wider mb-0.5">Name</div>
                                                        <div className="text-xs font-bold text-teal-900 capitalize leading-none">{displayName}</div>
                                                    </div>
                                                    {phone && (
                                                        <div className="text-right">
                                                            <div className="text-[9px] font-bold text-teal-400 uppercase tracking-wider mb-0.5">Mobile Number</div>
                                                            <div className="text-xs font-bold text-teal-900 leading-none">{phone}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submitted Details from JSON */}
                        {dronePhotoDetails && <ShootDetailsViewer details={dronePhotoDetails} clientName={rawData.client || data.client} />}
                        {droneVideoDetails && <ShootDetailsViewer details={droneVideoDetails} clientName={rawData.client || data.client} />}

                        {/* Media Links / Previews */}
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Submitted Media</span>
                            
                            <div className="flex gap-3 mb-4">
                                {dronePhotoDrive && (
                                    <a href={dronePhotoDrive} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-800 bg-teal-50 p-3 rounded-lg border border-teal-100 transition-colors">
                                        <Link2 size={16} /> Photos Drive ↗
                                    </a>
                                )}
                                {droneVideoDrive && (
                                    <a href={droneVideoDrive} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-800 bg-teal-50 p-3 rounded-lg border border-teal-100 transition-colors">
                                        <Link2 size={16} /> Videos Drive ↗
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Hard Disk Status */}
                        {droneHardDisk && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-2">
                                    <HardDrive size={16} className="text-gray-500" />
                                    <span className="text-xs font-bold text-gray-700">Hard Disk Delivery</span>
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${droneHardDisk.received ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {droneHardDisk.received ? 'RECEIVED' : 'PENDING'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Verification Actions */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        {verificationDone ? (
                            <div className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm border border-emerald-100">
                                <CheckCircle size={18} /> {isCrmVerified ? 'CRM Verified' : 'Data Manager Verified'}
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                {localApprovedRoles.includes('drone') ? (
                                    <button
                                        disabled
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-teal-700 bg-teal-50 border border-teal-100 opacity-60 cursor-not-allowed"
                                    >
                                        <CheckCircle size={16} /> Approved
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleLocalApprove('drone')}
                                        disabled={submitting}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 shadow-sm"
                                        style={{ background: 'linear-gradient(135deg, #14b8a6, #0f766e)' }}
                                    >
                                        <CheckCircle size={16} /> Approve Drone
                                    </button>
                                )}
                                <button
                                    onClick={() => handleAction('request-reupload', 'drone')}
                                    disabled={submitting}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                    <RotateCcw size={16} /> Re-upload
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* PRE-PRODUCTION LINKS (if any) */}
            {preProductionLinks.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
                    <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider border-b pb-2">Pre-Production Links</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {preProductionLinks.map((link, idx) => (
                            <a key={idx} href={link.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg text-purple-600 shadow-sm">
                                        <Link2 size={18} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-purple-900">{link.label} Drive</div>
                                        <div className="text-[10px] text-purple-600 mt-0.5">{link.notes || 'No notes provided'}</div>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* BOTTOM PROJECT LEVEL RESOURCES */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
                
                {/* Editor Assignments & Resources */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wider border-b pb-2">
                        <Users size={16} className="text-indigo-600" /> Editor Assignment & Server Infrastructure
                    </h2>
                    
                    <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 mb-6">
                        <h3 className="text-xs font-bold text-indigo-900 mb-3 uppercase tracking-wider">Production Server File Path</h3>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={serverFilePath}
                                    onChange={(e) => setServerFilePath(e.target.value)}
                                    placeholder="e.g. //SERVER-01/PROJECTS/2024/CLIENT-NAME"
                                    className="w-full bg-white border border-indigo-200 rounded-lg px-4 py-2.5 text-sm font-medium text-indigo-900 placeholder:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all shadow-sm"
                                />
                            </div>
                            <button
                                onClick={handleUpdateFilePath}
                                disabled={isSavingPath}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap flex items-center justify-center min-w-[120px]"
                            >
                                {isSavingPath ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Path'}
                            </button>
                        </div>
                    </div>

                    {assignments.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Active Editing Assignments</h3>
                            <div className="overflow-hidden rounded-xl border border-gray-200">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50">
                                        <tr className="text-[10px] font-bold text-gray-500 uppercase">
                                            <th className="p-3">Role</th>
                                            <th className="p-3">Editor</th>
                                            <th className="p-3">Accepted At</th>
                                            <th className="p-3">Deadline</th>
                                            <th className="p-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {assignments.map((asgn, idx) => (
                                            <tr key={idx} className="text-sm bg-white">
                                                <td className="p-3 font-bold text-gray-900">{asgn.project_type}</td>
                                                <td className="p-3 text-gray-600">{asgn.employee_name || asgn.employee_id}</td>
                                                <td className="p-3 text-gray-500">{formatDate(asgn.accepted_at)}</td>
                                                <td className="p-3 text-gray-500">{formatDate(asgn.deadline)} {asgn.deadline_time || ''}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${asgn.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                        asgn.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                                                        asgn.status === 'Accepted' ? 'bg-indigo-100 text-indigo-700' :
                                                        'bg-gray-100 text-gray-600'}`}>
                                                        {asgn.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Final Actions / Next Steps */}
                <div className="space-y-6">
                    {/* General Hard Disk Override (if needed) */}
                    {hasPendingHardDisk && !isCrmContext && (
                        <div className="bg-orange-50 rounded-xl border border-orange-200 p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-orange-900 mb-2">Pending Hard Disks</h3>
                            <p className="text-xs text-orange-700 mb-4">Not all expected hard disks have been received for this project.</p>
                            <button
                                onClick={markHardDiskReceived}
                                disabled={submitting}
                                className="w-full py-2.5 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 transition-colors disabled:opacity-50 shadow-sm"
                            >
                                Mark All as Received
                            </button>
                        </div>
                    )}

                    {/* Next Workflow Steps */}
                    {((shouldAssignEditingTeam && onAssignEditingTeam) || (isCrmContext && isCrmVerified && onSendToClient)) && (
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-lg">
                            <h2 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">Next Workflow Step</h2>
                            <p className="text-xs text-gray-400 mb-5">Proceed to the next phase of the project lifecycle.</p>
                            
                            {shouldAssignEditingTeam && onAssignEditingTeam ? (
                                <button
                                    onClick={onAssignEditingTeam}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold text-white transition-transform hover:scale-[1.02] bg-indigo-600 hover:bg-indigo-500 shadow-md"
                                >
                                    <Users size={18} /> Proceed to Assign Editors
                                </button>
                            ) : isCrmContext && isCrmVerified && onSendToClient && (
                                <button
                                    onClick={onSendToClient}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold text-white transition-transform hover:scale-[1.02] bg-emerald-600 hover:bg-emerald-500 shadow-md"
                                >
                                    <Send size={18} /> Send Package to Client
                                </button>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* Re-upload Modal */}
            {isReuploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md animate-in zoom-in-95 duration-200 rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center gap-3 text-red-600 border-b border-gray-100 pb-4">
                            <RotateCcw size={24} />
                            <h3 className="text-lg font-bold">Request Re-upload {actionTargetRole ? <span className="uppercase text-sm bg-red-100 px-2 py-1 rounded ml-2">{actionTargetRole}</span> : ''}</h3>
                        </div>
                        <p className="mb-4 text-sm text-gray-600 leading-relaxed">
                            Please describe what needs to be fixed or re-uploaded. This message will be sent to the assigned {actionTargetRole || 'team member'}.
                        </p>
                        <textarea
                            value={reuploadRemarks}
                            onChange={(e) => setReuploadRemarks(e.target.value)}
                            placeholder="e.g. Missing RAW files for the reception, or drive link is not accessible..."
                            className="mb-6 min-h-32 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setIsReuploadModalOpen(false)
                                    setReuploadRemarks('')
                                    setActionTargetRole(null)
                                }}
                                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAction('request-reupload')}
                                disabled={submitting || !reuploadRemarks.trim()}
                                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700 active:scale-95 disabled:opacity-50 shadow-md shadow-red-200"
                            >
                                {submitting ? 'Sending...' : 'Send Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
