import { useState } from 'react'
import { ArrowLeft, Link2, Camera, Video, FileText, Image, Send, CheckCircle, Calendar, User, Tag } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { useMediaRole } from '../../../hooks/useMediaRole'

const API_URL = import.meta.env.VITE_API_URL

interface TaskInfo {
    leadCode: string
    leadId: number
    title: string
    client: string
    deadline: string
    priority: string
}

export default function UploadFiles() {
    const navigate = useNavigate()
    const location = useLocation()
    const { isPhotographer, isVideographer, isDrone } = useMediaRole()
    const taskInfo = (location.state as TaskInfo) || null
    const basePath = location.pathname.startsWith('/multi-role/drone') ? '/multi-role/drone' : '/media'

    const [form, setForm] = useState({
        deliveryMethod: 'drive_link' as 'drive_link' | 'hard_disk',
        driveLink: '',
        hardDiskDeliveryDate: '',
        cameraUsed: '',
        numImages: '',
        numVideos: '',
        notes: '',
    })
    const [submitted, setSubmitted] = useState(false)

    // Drone captures BOTH photo and video assets; photographer captures photos; videographer captures videos.
    const isPhotoCapable = isPhotographer || isDrone
    const isVideoCapable = isVideographer || isDrone

    const totalFiles = (isPhotoCapable ? (parseInt(form.numImages) || 0) : 0)
                     + (isVideoCapable ? (parseInt(form.numVideos) || 0) : 0)

    const uploaderRole = isDrone ? 'drone' : isVideographer ? 'videographer' : 'photographer'

    const handleSubmit = async () => {
        if (form.deliveryMethod === 'drive_link' && !form.driveLink) {
            const label = isDrone ? 'Drone' : isPhotographer ? 'Photo' : 'Video'
            toast.error(`Please provide a ${label} Drive link`)
            return
        }
        if (form.deliveryMethod === 'hard_disk' && !form.hardDiskDeliveryDate) {
            toast.error('Please select the hard disk delivery date')
            return
        }
        if (!taskInfo?.leadId) {
            toast.error('No lead ID found. Please go back to My Work and try again.')
            return
        }
        try {
            // For drone, a single drive link is used for both drone_photo_drive_link and drone_video_drive_link
            // on the backend via the isDroneUpload branch in updateUploadDetailsQuery. The backend expects
            // the link in drive_link (for photographer/drone) or video_drive_link (for videographer/drone).
            const driveLinkPayload = form.deliveryMethod === 'drive_link' && !isVideographer ? form.driveLink : ''
            const videoDriveLinkPayload = form.deliveryMethod === 'drive_link' && (isVideographer || isDrone) ? form.driveLink : ''
            const res = await fetch(`${API_URL}/event-details/${taskInfo.leadId}/upload`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    drive_link: driveLinkPayload,
                    video_drive_link: videoDriveLinkPayload,
                    camera_used: form.cameraUsed,
                    video_camera_used: form.cameraUsed,
                    num_images: parseInt(form.numImages) || 0,
                    num_videos: parseInt(form.numVideos) || 0,
                    upload_notes: form.notes,
                    video_upload_notes: form.notes,
                    delivery_method: form.deliveryMethod,
                    hard_disk_delivery_date: form.deliveryMethod === 'hard_disk' ? form.hardDiskDeliveryDate : '',
                    uploader_role: uploaderRole
                })
            })
            const result = await res.json()
            if (result.success) {
                toast.success(form.deliveryMethod === 'hard_disk' ? 'Hard disk delivery sent to Data Manager successfully!' : 'Files sent to Data Manager successfully!')
                setSubmitted(true)
            } else {
                toast.error(result.message || 'Failed to submit')
            }
        } catch (err) {
            console.error('Upload submit error:', err)
            toast.error('Failed to submit upload details')
        }
    }

    const RoleIcon = isDrone ? Camera : isVideographer ? Video : Camera
    const driveLinkLabel = isDrone
        ? 'Drone Footage Drive Link'
        : isVideographer
            ? 'Video Drive Link'
            : 'Photo Drive Link'
    const driveLinkPlaceholder = isDrone
        ? 'https://drive.google.com/drive/folders/... (drone footage)'
        : isVideographer
            ? 'https://drive.google.com/drive/folders/... (videos)'
            : 'https://drive.google.com/drive/folders/... (photos)'

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <button onClick={() => navigate(`${basePath}/my-work`)} className="flex items-center gap-1.5 text-sm font-medium hover:text-purple-700 transition-colors mb-4" style={{ color: '#6B7280' }}><ArrowLeft size={16} /> Back to My Work</button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Submit Files</h1>
                        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                            {taskInfo ? `${taskInfo.leadCode} — ${taskInfo.title}` : `Share your ${isDrone ? 'drone' : isVideographer ? 'video' : 'photo'} Google Drive link`}
                        </p>
                    </div>
                    {taskInfo && (
                        <span className="crm-badge" style={
                            taskInfo.priority?.toLowerCase() === 'high' ? { background: '#FCE4EC', color: '#C2185B' } :
                                taskInfo.priority?.toLowerCase() === 'medium' ? { background: '#FFF3E0', color: '#E65100' } :
                                    { background: '#E8F5E9', color: '#2E7D32' }
                        }>{taskInfo.priority}</span>
                    )}
                </div>
            </div>

            {/* Task Info Strip */}
            {taskInfo && (
                <div className="crm-card p-4 mb-5">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#F5F3FF', color: '#5B5FC7' }}><Tag size={14} /></div>
                            <div><p className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>Lead ID</p><p className="text-sm font-semibold" style={{ color: '#111827' }}>{taskInfo.leadCode}</p></div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#E8F0FE', color: '#1565C0' }}><User size={14} /></div>
                            <div><p className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>Client</p><p className="text-sm font-semibold" style={{ color: '#111827' }}>{taskInfo.client}</p></div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FCE4EC', color: '#C2185B' }}><RoleIcon size={14} /></div>
                            <div><p className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>Event Type</p><p className="text-sm font-semibold" style={{ color: '#111827' }}>{taskInfo.title}</p></div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FFF3E0', color: '#E65100' }}><Calendar size={14} /></div>
                            <div><p className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>Deadline</p><p className="text-sm font-semibold" style={{ color: '#111827' }}>{taskInfo.deadline || '—'}</p></div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Left Column — Delivery + Additional Details */}
                <div className="lg:col-span-3 flex flex-col gap-5">
                    {/* Delivery Card */}
                    <div className="crm-card p-6">
                        <h2 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: '#111827' }}>
                            <RoleIcon size={16} style={{ color: '#7C3AED' }} /> Delivery Method
                        </h2>
                        <div className="mb-5 grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => setForm(p => ({ ...p, deliveryMethod: 'hard_disk' }))}
                                className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${form.deliveryMethod === 'hard_disk' ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                                Hard Disk
                                <span className="block text-xs font-medium text-gray-500">Send delivery date to Data Manager</span>
                            </button>
                            <button type="button" onClick={() => setForm(p => ({ ...p, deliveryMethod: 'drive_link' }))}
                                className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${form.deliveryMethod === 'drive_link' ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white text-gray-600'}`}>
                                Upload Drive Link
                                <span className="block text-xs font-medium text-gray-500">Share a Google Drive folder</span>
                            </button>
                        </div>
                        {form.deliveryMethod === 'drive_link' ? (
                            <>
                                <p className="text-xs mb-4" style={{ color: '#6B7280' }}>
                                    Share the Google Drive folder link containing all {isDrone ? 'drone media' : isVideographer ? 'video' : 'photo'} files for this project
                                </p>
                                <div className="relative">
                                    <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                                    <input
                                        type="url"
                                        placeholder={driveLinkPlaceholder}
                                        className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-purple-100 focus:border-purple-400"
                                        style={{ borderColor: '#E5E7EB', color: '#111827' }}
                                        value={form.driveLink}
                                        onChange={e => setForm(p => ({ ...p, driveLink: e.target.value }))}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-xs mb-4" style={{ color: '#6B7280' }}>
                                    Tell the Data Manager when the hard disk will be delivered.
                                </p>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                                    <input
                                        type="date"
                                        className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-purple-100 focus:border-purple-400"
                                        style={{ borderColor: '#E5E7EB', color: '#111827' }}
                                        value={form.hardDiskDeliveryDate}
                                        onChange={e => setForm(p => ({ ...p, hardDiskDeliveryDate: e.target.value }))}
                                    />
                                </div>
                            </>
                        )}
                        {form.deliveryMethod === 'drive_link' && form.driveLink && (
                            <div className="flex items-center gap-2 mt-3 text-xs font-medium" style={{ color: '#2E7D32' }}>
                                <CheckCircle size={13} /> Drive link added
                            </div>
                        )}
                        {form.deliveryMethod === 'hard_disk' && form.hardDiskDeliveryDate && (
                            <div className="flex items-center gap-2 mt-3 text-xs font-medium" style={{ color: '#2E7D32' }}>
                                <CheckCircle size={13} /> Delivery date selected
                            </div>
                        )}
                    </div>

                    {/* Additional Details Card */}
                    <div className="crm-card p-6">
                        <h2 className="text-sm font-semibold flex items-center gap-2 mb-5" style={{ color: '#111827' }}>
                            <FileText size={16} style={{ color: '#C2185B' }} /> Additional Details
                        </h2>
                        <div className={`grid ${isDrone ? 'grid-cols-3' : 'grid-cols-2'} gap-4 mb-5`}>
                            <div>
                                <label className="block text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>
                                    {isDrone ? 'Drone / Equipment' : isPhotographer ? 'Camera Used' : 'Equipment Used'}
                                </label>
                                <input
                                    type="text"
                                    placeholder={isDrone ? 'e.g., DJI Mavic 3' : isPhotographer ? 'e.g., Canon R5' : 'e.g., Sony A7S III'}
                                    className="w-full px-3 py-2.5 border rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-purple-100 focus:border-purple-400"
                                    style={{ borderColor: '#E5E7EB', color: '#111827' }}
                                    value={form.cameraUsed}
                                    onChange={e => setForm(p => ({ ...p, cameraUsed: e.target.value }))}
                                />
                            </div>
                            {isPhotoCapable && (
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>
                                        <Image size={12} style={{ color: '#7C3AED' }} /> Number of Photos
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        min="0"
                                        className="w-full px-3 py-2.5 border rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-purple-100 focus:border-purple-400"
                                        style={{ borderColor: '#E5E7EB', color: '#111827' }}
                                        value={form.numImages}
                                        onChange={e => setForm(p => ({ ...p, numImages: e.target.value }))}
                                    />
                                </div>
                            )}
                            {isVideoCapable && (
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>
                                        <Video size={12} style={{ color: '#C2185B' }} /> Number of Videos
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        min="0"
                                        className="w-full px-3 py-2.5 border rounded-xl text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-purple-100 focus:border-purple-400"
                                        style={{ borderColor: '#E5E7EB', color: '#111827' }}
                                        value={form.numVideos}
                                        onChange={e => setForm(p => ({ ...p, numVideos: e.target.value }))}
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>Short Notes</label>
                            <textarea
                                rows={4}
                                placeholder="Add any notes about the shoot, special instructions, or remarks..."
                                className="w-full px-3 py-2.5 border rounded-xl text-sm resize-none font-medium outline-none transition-all focus:ring-2 focus:ring-purple-100 focus:border-purple-400"
                                style={{ borderColor: '#E5E7EB', color: '#111827' }}
                                value={form.notes}
                                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column — Summary + Actions */}
                <div className="lg:col-span-2 flex flex-col gap-5">
                    <div className="crm-card p-6">
                        <h2 className="text-sm font-semibold mb-5" style={{ color: '#111827' }}>Submission Summary</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #F3F4F6' }}>
                                <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Delivery Method</span>
                                <span className="text-xs font-semibold" style={{ color: '#111827' }}>
                                    {form.deliveryMethod === 'hard_disk' ? 'Hard Disk' : 'Upload Drive Link'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #F3F4F6' }}>
                                <span className="text-xs font-medium" style={{ color: '#6B7280' }}>{form.deliveryMethod === 'hard_disk' ? 'Delivery Date' : driveLinkLabel}</span>
                                <span className="text-xs font-semibold" style={{ color: (form.deliveryMethod === 'hard_disk' ? form.hardDiskDeliveryDate : form.driveLink) ? '#2E7D32' : '#9CA3AF' }}>
                                    {form.deliveryMethod === 'hard_disk'
                                        ? (form.hardDiskDeliveryDate || 'Not selected')
                                        : (form.driveLink ? 'Provided' : 'Not provided')}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #F3F4F6' }}>
                                <span className="text-xs font-medium" style={{ color: '#6B7280' }}>{isDrone ? 'Drone' : isPhotographer ? 'Camera' : 'Equipment'}</span>
                                <span className="text-xs font-semibold" style={{ color: form.cameraUsed ? '#111827' : '#9CA3AF' }}>
                                    {form.cameraUsed || 'Not specified'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #F3F4F6' }}>
                                <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Total Files</span>
                                <span className="text-xs font-semibold" style={{ color: '#111827' }}>
                                    {totalFiles} <span style={{ color: '#6B7280', fontWeight: 500 }}>(
                                        {isPhotoCapable ? `${form.numImages || 0} photos` : ''}
                                        {isPhotoCapable && isVideoCapable ? ', ' : ''}
                                        {isVideoCapable ? `${form.numVideos || 0} videos` : ''}
                                    )</span>
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2.5">
                                <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Notes</span>
                                <span className="text-xs font-semibold" style={{ color: form.notes ? '#111827' : '#9CA3AF' }}>
                                    {form.notes ? `${form.notes.length} chars` : 'None'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={(form.deliveryMethod === 'drive_link' ? !form.driveLink : !form.hardDiskDeliveryDate) || submitted}
                            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                            style={{ background: submitted ? '#E8F5E9' : '#5B5FC7', color: submitted ? '#2E7D32' : '#fff' }}
                        >
                            {submitted ? (
                                <><CheckCircle size={16} /> Submitted</>
                            ) : (
                                <><Send size={16} /> Send to Data Manager</>
                            )}
                        </button>

                        {submitted && (
                            <div className="w-full py-3 rounded-xl border text-center flex items-center justify-center gap-2" style={{ background: '#E8F5E9', borderColor: '#C8E6C9', color: '#2E7D32' }}>
                                <CheckCircle size={15} />
                                <p className="text-sm font-semibold">Files sent to CRM admin for quality verification</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
