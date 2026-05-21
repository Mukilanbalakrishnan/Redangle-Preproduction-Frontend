import { useState } from 'react'
import { ArrowLeft, User, Calendar, Camera, Video, CheckCircle, RotateCcw, Image as ImageIcon, Send, Users } from 'lucide-react'
import { toast } from 'sonner'

const API_URL = import.meta.env.VITE_API_URL

export default function RawDataView({ onBack, data, apiBasePath = '/data-manager', isCrmContext = false, onCrmVerify, onSendToClient, onAssignEditingTeam }: { onBack: () => void, data: any, apiBasePath?: string, isCrmContext?: boolean, onCrmVerify?: (leadId: string | number, clientName: string) => void, onSendToClient?: () => void, onAssignEditingTeam?: () => void }) {
    const [submitting, setSubmitting] = useState(false)
    const rawData = data.rawData || {}
    // Drone belongs only to the live event phase. Prefer the normalized flag from the
    // parent list view; otherwise fall back to explicit current_phase metadata only.
    const currentPhase = String(data.currentPhase ?? rawData.current_phase ?? '').trim().toLowerCase()
    const preProductionStep = String(data.preProductionStep ?? rawData.pre_production_step ?? 'shoot').trim().toLowerCase()
    const isEventPhase = currentPhase === 'event'
    const shouldAssignEditingTeam = isCrmContext && currentPhase === 'pre_production' && preProductionStep === 'editing'

    // Use combined data if available (IncomingData combined format), else fall back to legacy shape
    const photographer = data.photographer ?? rawData.photographer ?? null
    const videographer = data.videographer ?? rawData.videographer ?? null
    const drone = isEventPhase ? (data.drone ?? rawData.drone ?? null) : null
    const numImages = data.numImages ?? rawData.num_images ?? 0
    const numVideos = data.numVideos ?? rawData.num_videos ?? 0
    const photoDrive = data.drive_link ?? rawData.drive_link ?? null
    const videoDrive = data.video_drive_link ?? rawData.video_drive_link ?? null
    const droneNumImages = isEventPhase ? (data.droneImages ?? rawData.drone_num_images ?? 0) : 0
    const droneNumVideos = isEventPhase ? (data.droneVideos ?? rawData.drone_num_videos ?? 0) : 0
    const dronePhotoDrive = isEventPhase ? (data.drone_photo_drive_link ?? rawData.drone_photo_drive_link ?? null) : null
    const droneVideoDrive = isEventPhase ? (data.drone_video_drive_link ?? rawData.drone_video_drive_link ?? null) : null
    const mediaStats = [
        {
            key: 'photos',
            label: 'Photos',
            value: numImages,
            owner: photographer || 'Photographer',
            available: Boolean(photoDrive) || Number(numImages) > 0 || Boolean(photographer),
            Icon: ImageIcon,
            cardClass: 'bg-blue-50 text-blue-700 border-blue-100',
            valueClass: 'text-blue-900',
        },
        {
            key: 'videos',
            label: 'Videos',
            value: numVideos,
            owner: videographer || 'Videographer',
            available: Boolean(videoDrive) || Number(numVideos) > 0 || Boolean(videographer),
            Icon: Video,
            cardClass: 'bg-pink-50 text-pink-700 border-pink-100',
            valueClass: 'text-pink-900',
        },
        {
            key: 'drone-photos',
            label: 'Drone Photos',
            value: droneNumImages,
            owner: drone || 'Drone Operator',
            available: isEventPhase && (Boolean(dronePhotoDrive) || Number(droneNumImages) > 0 || Boolean(drone)),
            Icon: ImageIcon,
            cardClass: 'bg-teal-50 text-teal-700 border-teal-100',
            valueClass: 'text-teal-900',
        },
        {
            key: 'drone-videos',
            label: 'Drone Videos',
            value: droneNumVideos,
            owner: drone || 'Drone Operator',
            available: isEventPhase && (Boolean(droneVideoDrive) || Number(droneNumVideos) > 0 || Boolean(drone)),
            Icon: Video,
            cardClass: 'bg-indigo-50 text-indigo-700 border-indigo-100',
            valueClass: 'text-indigo-900',
        },
    ].filter(item => item.available)
    const preProductionLinks = [
        { label: 'Save the Date', href: rawData.save_the_date_drive_link, notes: rawData.save_the_date_upload_notes },
        { label: 'Save the Video', href: rawData.save_the_video_drive_link, notes: rawData.save_the_video_upload_notes },
        { label: 'Retouch', href: rawData.retouch_drive_link, notes: rawData.retouch_upload_notes },
    ].filter(item => Boolean(item.href))
    const hardDiskDeliveries = [
        {
            role: 'Photographer',
            employee: photographer,
            date: rawData.photo_hard_disk_delivery_date,
            received: Boolean(rawData.photo_hard_disk_received),
        },
        {
            role: 'Videographer',
            employee: videographer,
            date: rawData.video_hard_disk_delivery_date,
            received: Boolean(rawData.video_hard_disk_received),
        },
        {
            role: 'Drone Operator',
            employee: drone,
            date: isEventPhase ? rawData.drone_hard_disk_delivery_date : null,
            received: Boolean(rawData.drone_hard_disk_received),
        },
    ].filter(item => Boolean(item.date))
    const hasPendingHardDisk = hardDiskDeliveries.some(item => !item.received)
    const leadId = rawData.external_lead_id || rawData.id || data.id
    const displayId = data.serialNumber || rawData.lead_serial_number || leadId
    const verificationStatus = String(data.status ?? rawData.media_status ?? '').trim().toLowerCase()
    const isCrmVerified = verificationStatus === 'crm_verified' || verificationStatus === 'harddisk_closed'
    const isDmVerified = verificationStatus === 'verified' || isCrmVerified
    const verificationDone = isCrmContext ? isCrmVerified : isDmVerified

    const handleAction = async (action: 'verify' | 'request-reupload') => {
        setSubmitting(true)
        try {
            // When in CRM context, use /crm-verify to set status to crm_verified
            const endpoint = action === 'verify' && isCrmContext ? 'crm-verify' : action
            const res = await fetch(`${API_URL}${apiBasePath}/${leadId}/${endpoint}`, {
                method: 'PATCH'
            })
            const result = await res.json()
            if (result.success) {
                toast.success(action === 'verify' ? 'Files verified successfully' : 'Re-upload requested successfully')

                if (action === 'verify') {
                    if (isCrmContext) {
                        // Step 8: CRM Verified
                        await fetch(`${API_URL}/stage/update`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ external_lead_id: leadId, stage_name: 'crm_verified' })
                        }).catch(console.error)
                        
                        if (onCrmVerify) {
                            onCrmVerify(leadId, rawData.client || data.client)
                            return // Prevent calling onBack immediately if moving to assign editors
                        }
                    } else {
                        // Step 6: Data Manager Verification
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

                onBack()
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

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Raw Data Collection</h1>
                    <p className="text-sm text-gray-500 mt-1">Lead ID: {displayId} &nbsp;·&nbsp; Client: {rawData.client || data.client}</p>
                </div>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors text-gray-700"
                >
                    <ArrowLeft size={16} /> Back
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_500px] gap-6">
                <div className="space-y-6">
                    {/* Media Stats Card */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-bold text-gray-900">Uploaded Media Overview</h2>
                                <p className="mt-1 text-xs text-gray-500">Counts adjust to the uploaded roles for this lead.</p>
                            </div>
                            <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-bold text-gray-500">
                                {mediaStats.length} source{mediaStats.length === 1 ? '' : 's'}
                            </span>
                        </div>
                        {mediaStats.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center text-sm font-medium text-gray-400">
                                No uploaded media has been logged yet.
                            </div>
                        ) : (
                            <div
                                className="grid gap-4"
                                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}
                            >
                                {mediaStats.map(item => {
                                    const Icon = item.Icon
                                    return (
                                        <div key={item.key} className={`min-h-[132px] rounded-xl border p-5 ${item.cardClass}`}>
                                            <div className="mb-4 flex items-start justify-between gap-3">
                                                <div className="rounded-lg bg-white/70 p-2">
                                                    <Icon size={20} />
                                                </div>
                                                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase">
                                                    {item.owner}
                                                </span>
                                            </div>
                                            <div className={`text-3xl font-bold ${item.valueClass}`}>{item.value}</div>
                                            <div className="mt-1 text-xs font-bold uppercase tracking-wide">{item.label}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        <div className="mt-5 grid gap-3 text-xs text-gray-500 sm:grid-cols-3">
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                                <span className="block font-bold text-gray-900">{Number(numImages)}</span>
                                Total photos
                            </div>
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                                <span className="block font-bold text-gray-900">{Number(numVideos)}</span>
                                Total videos
                            </div>
                            <div className="rounded-lg bg-gray-50 px-3 py-2">
                                <span className="block font-bold text-gray-900">{preProductionLinks.length}</span>
                                Editing links
                            </div>
                        </div>
                    </div>

                    {/* Drive Links Card */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-gray-900 mb-6 italic underline">Google Drive Links</h2>
                        <div className="grid gap-4">
                            {photoDrive && (
                                <a href={photoDrive} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                            <ImageIcon size={18} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">Photos Drive Link</div>
                                            <div className="text-xs text-gray-500">Provided by {photographer || 'Photographer'}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-indigo-600 group-hover:underline">Open Link ↗</div>
                                </a>
                            )}
                            {videoDrive && (
                                <a href={videoDrive} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                                            <Video size={18} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">Videos Drive Link</div>
                                            <div className="text-xs text-gray-500">Provided by {videographer || 'Videographer'}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-indigo-600 group-hover:underline">Open Link ↗</div>
                                </a>
                            )}
                            {isEventPhase && (
                                <>
                                    {dronePhotoDrive && (
                                        <a href={dronePhotoDrive} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-teal-100 rounded-lg text-teal-600">
                                                    <ImageIcon size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">Drone Photos Drive Link</div>
                                                    <div className="text-xs text-gray-500">Provided by {drone || 'Drone Operator'}</div>
                                                </div>
                                            </div>
                                            <div className="text-xs font-bold text-indigo-600 group-hover:underline">Open Link ↗</div>
                                        </a>
                                    )}
                                    {droneVideoDrive && (
                                        <a href={droneVideoDrive} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                                    <Video size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">Drone Videos Drive Link</div>
                                                    <div className="text-xs text-gray-500">Provided by {drone || 'Drone Operator'}</div>
                                                </div>
                                            </div>
                                            <div className="text-xs font-bold text-indigo-600 group-hover:underline">Open Link ↗</div>
                                        </a>
                                    )}
                                </>
                            )}
                            {preProductionLinks.map((link, idx) => (
                                <a key={idx} href={link.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                            <Camera size={18} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">{link.label} Link</div>
                                            <div className="text-xs text-gray-500">{link.notes || 'No notes provided'}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-purple-600 group-hover:underline">Open Link ↗</div>
                                </a>
                            ))}
                            {!photoDrive && !videoDrive && !dronePhotoDrive && !droneVideoDrive && preProductionLinks.length === 0 && (
                                <div className="text-center py-8 text-gray-400 font-medium italic">No drive links available for this lead.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Hard Disk Deliveries */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-gray-900 mb-6 italic underline">Hard Disk Deliveries</h2>
                        <div className="space-y-4">
                            {hardDiskDeliveries.length > 0 ? hardDiskDeliveries.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.role}</div>
                                        <div className="text-sm font-bold text-gray-900">{item.employee}</div>
                                        <div className="text-xs text-gray-500">{item.date}</div>
                                    </div>
                                    <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${item.received ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {item.received ? 'RECEIVED' : 'PENDING'}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-4 text-xs text-gray-400 font-medium italic">No hard disk deliveries expected.</div>
                            )}

                            {hasPendingHardDisk && !isCrmContext && (
                                <button
                                    onClick={markHardDiskReceived}
                                    disabled={submitting}
                                    className="w-full mt-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                >
                                    Mark All as Received
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Team Info Card */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-gray-900 mb-6 italic underline">Event Team</h2>
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <User size={16} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Photographer</div>
                                    <div className="text-sm font-bold text-gray-900 leading-none">{photographer || 'Unassigned'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                                    <User size={16} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Videographer</div>
                                    <div className="text-sm font-bold text-gray-900 leading-none">{videographer || 'Unassigned'}</div>
                                </div>
                            </div>
                            {isEventPhase && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Drone Operator</div>
                                        <div className="text-sm font-bold text-gray-900 leading-none">{drone || 'Unassigned'}</div>
                                    </div>
                                </div>
                            )}
                            <div className="pt-2 border-t border-gray-50 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                    <Calendar size={16} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Event Date</div>
                                    <div className="text-sm font-bold text-gray-900 leading-none">{data.date}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions Card */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-gray-900 mb-6 italic underline">Verification Actions</h2>
                        {verificationDone ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-emerald-700">
                                    <CheckCircle size={18} />
                                    <div>
                                        <div className="text-sm font-bold">
                                            {isCrmVerified ? 'CRM Verified' : 'Data Manager Verified'}
                                        </div>
                                        <div className="text-xs text-emerald-600">
                                            {isCrmVerified
                                                ? 'All media has been approved by the CRM team.'
                                                : 'All media has been approved by the Data Manager.'}
                                        </div>
                                    </div>
                                </div>
                                {shouldAssignEditingTeam && onAssignEditingTeam ? (
                                    <button
                                        onClick={onAssignEditingTeam}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                                        style={{ background: 'linear-gradient(135deg, #5B5FC7, #4f46e5)' }}
                                    >
                                        <Users size={18} /> Assign Editing Team
                                    </button>
                                ) : isCrmContext && isCrmVerified && onSendToClient && (
                                    <button
                                        onClick={onSendToClient}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                                        style={{ background: 'linear-gradient(135deg, #5B5FC7, #4f46e5)' }}
                                    >
                                        <Send size={18} /> Send to Client
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <button
                                    onClick={() => handleAction('verify')}
                                    disabled={submitting}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                                >
                                    <CheckCircle size={18} /> Approve All Media
                                </button>
                                <button
                                    onClick={() => handleAction('request-reupload')}
                                    disabled={submitting}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                    <RotateCcw size={18} /> Request Re-upload
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
