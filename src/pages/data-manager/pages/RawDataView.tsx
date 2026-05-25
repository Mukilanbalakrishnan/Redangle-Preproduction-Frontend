import { useState } from 'react'
import {
    ArrowLeft, Calendar, CheckCircle, RotateCcw, Image as ImageIcon,
    Send, Users, Video, ExternalLink, HardDrive, Camera, ShieldCheck,
    AlertTriangle, Folder
} from 'lucide-react'
import { toast } from 'sonner'

const API_URL = import.meta.env.VITE_API_URL

const formatDateTime = (dateStr: any) => {
    if (!dateStr) return 'N/A'
    try {
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return String(dateStr)
        const hasTime = String(dateStr).includes('T') || String(dateStr).includes(':')
        if (hasTime) return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    } catch { return String(dateStr) }
}

interface RawDataViewProps {
    onBack: () => void
    data: any
    apiBasePath?: string
    isCrmContext?: boolean
    onCrmVerify?: (leadId: string | number, clientName: string) => void
    onSendToClient?: () => void
    onAssignEditingTeam?: () => void
}

export default function RawDataView({
    onBack, data, apiBasePath = '/data-manager',
    isCrmContext = false, onCrmVerify, onSendToClient, onAssignEditingTeam
}: RawDataViewProps) {
    const [submitting, setSubmitting] = useState(false)
    const rawData = data.rawData || {}
    const currentPhase = String(data.currentPhase ?? rawData.current_phase ?? '').trim().toLowerCase()
    const preProductionStep = String(data.preProductionStep ?? rawData.pre_production_step ?? 'shoot').trim().toLowerCase()
    const isEventPhase = currentPhase === 'event'
    const shouldAssignEditingTeam = isCrmContext && currentPhase === 'pre_production' && preProductionStep === 'editing'

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
            key: 'photos', label: 'Photos', value: numImages, owner: photographer || 'Photographer',
            available: Boolean(photoDrive) || Number(numImages) > 0 || Boolean(photographer),
            Icon: ImageIcon,
            gradient: 'from-blue-500/10 to-indigo-500/5',
            border: 'border-blue-100', iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
            valueColor: 'text-blue-700', badgeBg: 'bg-blue-50 text-blue-600 border-blue-200',
        },
        {
            key: 'videos', label: 'Videos', value: numVideos, owner: videographer || 'Videographer',
            available: Boolean(videoDrive) || Number(numVideos) > 0 || Boolean(videographer),
            Icon: Video,
            gradient: 'from-pink-500/10 to-rose-500/5',
            border: 'border-pink-100', iconBg: 'bg-pink-100', iconColor: 'text-pink-600',
            valueColor: 'text-pink-700', badgeBg: 'bg-pink-50 text-pink-600 border-pink-200',
        },
        {
            key: 'drone-photos', label: 'Drone Photos', value: droneNumImages, owner: drone || 'Drone Operator',
            available: isEventPhase && (Boolean(dronePhotoDrive) || Number(droneNumImages) > 0 || Boolean(drone)),
            Icon: ImageIcon,
            gradient: 'from-teal-500/10 to-emerald-500/5',
            border: 'border-teal-100', iconBg: 'bg-teal-100', iconColor: 'text-teal-600',
            valueColor: 'text-teal-700', badgeBg: 'bg-teal-50 text-teal-600 border-teal-200',
        },
        {
            key: 'drone-videos', label: 'Drone Videos', value: droneNumVideos, owner: drone || 'Drone Operator',
            available: isEventPhase && (Boolean(droneVideoDrive) || Number(droneNumVideos) > 0 || Boolean(drone)),
            Icon: Video,
            gradient: 'from-indigo-500/10 to-purple-500/5',
            border: 'border-indigo-100', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600',
            valueColor: 'text-indigo-700', badgeBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
        },
    ].filter(item => item.available)

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
            const endpoint = action === 'verify' && isCrmContext ? 'crm-verify' : action
            const res = await fetch(`${API_URL}${apiBasePath}/${leadId}/${endpoint}`, { method: 'PATCH' })
            const result = await res.json()
            if (result.success) {
                toast.success(action === 'verify' ? 'Files verified successfully' : 'Re-upload requested successfully')
                if (action === 'verify') {
                    if (isCrmContext) {
                        await fetch(`${API_URL}/stage/update`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ external_lead_id: leadId, stage_name: 'crm_verified' })
                        }).catch(console.error)
                        if (onCrmVerify) { onCrmVerify(leadId, rawData.client || data.client); return }
                    } else {
                        await fetch(`${API_URL}/stage/update`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ external_lead_id: leadId, stage_name: 'data_manager_verification' })
                        }).catch(console.error)
                    }
                }
                if (action === 'request-reupload' && isCrmContext) toast.success('Sent back to Data Manager for re-upload')
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
            const res = await fetch(`${API_URL}${apiBasePath}/${leadId}/hard-disk-received`, { method: 'PATCH' })
            const result = await res.json()
            if (result.success) { toast.success('Hard disk marked as received'); onBack() }
            else toast.error(result.message || 'Failed to mark hard disk as received')
        } catch (error) {
            console.error('Error marking hard disk received:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    // ── Drive link helper ──────────────────────────────────────────────────
    type DriveColor = 'blue' | 'pink' | 'teal' | 'indigo' | 'purple'
    const colorMap: Record<DriveColor, { border: string; hover: string; icon: string; link: string; iconBg: string }> = {
        blue:   { border: 'border-l-blue-500',   hover: 'hover:border-blue-200 hover:bg-blue-50/40',   icon: 'bg-blue-50 border-blue-100 text-blue-600',   link: 'text-blue-600',   iconBg: 'bg-blue-50' },
        pink:   { border: 'border-l-pink-500',   hover: 'hover:border-pink-200 hover:bg-pink-50/40',   icon: 'bg-pink-50 border-pink-100 text-pink-600',   link: 'text-pink-600',   iconBg: 'bg-pink-50' },
        teal:   { border: 'border-l-teal-500',   hover: 'hover:border-teal-200 hover:bg-teal-50/40',   icon: 'bg-teal-50 border-teal-100 text-teal-600',   link: 'text-teal-600',   iconBg: 'bg-teal-50' },
        indigo: { border: 'border-l-indigo-500', hover: 'hover:border-indigo-200 hover:bg-indigo-50/40', icon: 'bg-indigo-50 border-indigo-100 text-indigo-600', link: 'text-indigo-600', iconBg: 'bg-indigo-50' },
        purple: { border: 'border-l-purple-500', hover: 'hover:border-purple-200 hover:bg-purple-50/40', icon: 'bg-purple-50 border-purple-100 text-purple-600', link: 'text-purple-600', iconBg: 'bg-purple-50' },
    }

    const DriveLink = ({ href, label, uploader, ItemIcon, color }: { href: string; label: string; uploader: string; ItemIcon: any; color: DriveColor }) => {
        const c = colorMap[color]
        return (
            <a href={href} target="_blank" rel="noopener noreferrer"
               className={`group flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 border-l-4 ${c.border} ${c.hover} hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200`}
            >
                <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl border ${c.icon} shadow-xs group-hover:scale-105 transition-transform`}>
                        <ItemIcon size={18} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">{label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Uploaded by <span className="font-bold text-gray-600">{uploader}</span></p>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-bold ${c.link} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    Open <ExternalLink size={12} />
                </div>
                <ExternalLink size={14} className={`${c.link} group-hover:opacity-0 opacity-100 transition-opacity shrink-0 ml-2`} />
            </a>
        )
    }

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5">
            {/* ── Hero Header ───────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shrink-0">
                            <Folder size={22} className="text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Raw Data Collection</h1>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                    {isEventPhase ? 'Event Phase' : 'Pre-production'}
                                </span>
                                {verificationDone && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                        <CheckCircle size={11} /> Verified
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                                    <span className="text-[10px] font-extrabold text-gray-400 uppercase">Lead</span>
                                    <span className="font-extrabold text-gray-700">{displayId}</span>
                                </span>
                                <span className="text-gray-300">·</span>
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                                    <span className="text-[10px] font-extrabold text-gray-400 uppercase">Client</span>
                                    <span className="font-extrabold text-gray-700">{rawData.client || data.client}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 rounded-xl hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-xs group"
                    >
                        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back
                    </button>
                </div>

                {/* Quick stats strip */}
                <div className="border-t border-gray-100 grid grid-cols-3 divide-x divide-gray-100">
                    {[
                        { label: 'Photos', value: Number(numImages), Icon: ImageIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Videos', value: Number(numVideos), Icon: Video, color: 'text-pink-600', bg: 'bg-pink-50' },
                        { label: 'Drive Links', value: [photoDrive, videoDrive, dronePhotoDrive, droneVideoDrive].filter(Boolean).length + preProductionLinks.length, Icon: ExternalLink, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    ].map(s => {
                        const Icon = s.Icon
                        return (
                            <div key={s.label} className="flex items-center gap-3 px-6 py-3.5">
                                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                                    <Icon size={15} className={s.color} />
                                </div>
                                <div>
                                    <p className={`text-lg font-extrabold leading-none ${s.color}`}>{s.value}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ── Main Content Grid ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-5">

                {/* Left column */}
                <div className="space-y-5">

                    {/* Media Overview */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                                <div>
                                    <h2 className="text-sm font-extrabold text-gray-900">Uploaded Media Overview</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">Real-time asset status for this project</p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {mediaStats.length} Source{mediaStats.length !== 1 ? 's' : ''} Uploaded
                            </span>
                        </div>

                        <div className="p-6 space-y-5">
                            {mediaStats.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/40">
                                    <ImageIcon size={28} className="text-gray-300 mb-2" />
                                    <p className="text-sm font-semibold text-gray-400">No uploaded media logged yet</p>
                                </div>
                            ) : (
                                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
                                    {mediaStats.map(item => {
                                        const Icon = item.Icon
                                        return (
                                            <div key={item.key} className={`rounded-2xl border bg-gradient-to-br ${item.gradient} ${item.border} p-5 flex flex-col justify-between min-h-[140px] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
                                                <div className="flex items-start justify-between">
                                                    <div className={`w-10 h-10 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shadow-xs`}>
                                                        <Icon size={18} strokeWidth={2} />
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${item.badgeBg}`}>
                                                        {item.owner}
                                                    </span>
                                                </div>
                                                <div className="mt-4">
                                                    <p className={`text-4xl font-black tracking-tight ${item.valueColor}`}>{item.value}</p>
                                                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 mt-1">{item.label}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Totals strip */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Total Photos', value: Number(numImages), Icon: ImageIcon, bg: 'bg-blue-50', color: 'text-blue-500', border: 'border-blue-100' },
                                    { label: 'Total Videos', value: Number(numVideos), Icon: Video, bg: 'bg-pink-50', color: 'text-pink-500', border: 'border-pink-100' },
                                    { label: 'Editing Links', value: preProductionLinks.length, Icon: ExternalLink, bg: 'bg-purple-50', color: 'text-purple-500', border: 'border-purple-100' },
                                ].map(s => {
                                    const Icon = s.Icon
                                    return (
                                        <div key={s.label} className={`flex items-center gap-3 p-3.5 rounded-xl bg-white border ${s.border}`}>
                                            <div className={`p-2 rounded-lg ${s.bg}`}>
                                                <Icon size={14} className={s.color} />
                                            </div>
                                            <div>
                                                <p className="text-base font-extrabold text-gray-900 leading-none">{s.value}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Drive Repositories */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                            <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                            <div>
                                <h2 className="text-sm font-extrabold text-gray-900">Google Drive Repositories</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Direct access to raw media storage directories</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-3">
                            {photoDrive && <DriveLink href={photoDrive} label="Photos Drive Directory" uploader={photographer || 'Photographer'} ItemIcon={ImageIcon} color="blue" />}
                            {videoDrive && <DriveLink href={videoDrive} label="Videos Drive Directory" uploader={videographer || 'Videographer'} ItemIcon={Video} color="pink" />}
                            {isEventPhase && dronePhotoDrive && <DriveLink href={dronePhotoDrive} label="Drone Photos Drive Directory" uploader={drone || 'Drone Operator'} ItemIcon={ImageIcon} color="teal" />}
                            {isEventPhase && droneVideoDrive && <DriveLink href={droneVideoDrive} label="Drone Videos Drive Directory" uploader={drone || 'Drone Operator'} ItemIcon={Video} color="indigo" />}
                            {preProductionLinks.map((link, idx) => (
                                <DriveLink key={idx} href={link.href} label={`${link.label} Directory`} uploader={link.notes || 'No description'} ItemIcon={Camera} color="purple" />
                            ))}
                            {!photoDrive && !videoDrive && !dronePhotoDrive && !droneVideoDrive && preProductionLinks.length === 0 && (
                                <div className="flex flex-col items-center py-12 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/40 text-center">
                                    <ExternalLink size={24} className="text-gray-300 mb-2" />
                                    <p className="text-sm font-semibold text-gray-400">No drive links available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-5">

                    {/* Hard Disk Deliveries */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                <HardDrive size={15} className="text-slate-600" />
                            </div>
                            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">Hard Disk Deliveries</h2>
                        </div>
                        <div className="p-5 space-y-3">
                            {hardDiskDeliveries.length > 0 ? hardDiskDeliveries.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-50/80 transition-colors">
                                    <div>
                                        <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest mb-0.5">{item.role}</p>
                                        <p className="text-sm font-bold text-gray-900">{item.employee || 'Unassigned'}</p>
                                        {item.date && (
                                            <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mt-1">
                                                <Calendar size={10} />{formatDateTime(item.date)}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg border tracking-wider ${item.received ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                        {item.received ? 'RECEIVED' : 'PENDING'}
                                    </span>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center py-8 border border-dashed border-gray-100 rounded-xl bg-gray-50/40 text-center">
                                    <HardDrive size={20} className="text-gray-300 mb-2" />
                                    <p className="text-xs font-semibold text-gray-400">No hard disk deliveries expected</p>
                                </div>
                            )}
                            {hasPendingHardDisk && !isCrmContext && (
                                <button
                                    onClick={markHardDiskReceived}
                                    disabled={submitting}
                                    className="w-full mt-2 py-3 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-all disabled:opacity-50"
                                >
                                    Mark All as Received
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Event Assignment */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <Users size={15} className="text-indigo-600" />
                            </div>
                            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">Event Assignment</h2>
                        </div>
                        <div className="p-5 space-y-2.5">
                            {[
                                { role: 'Photographer', name: photographer, gradient: 'from-blue-500 to-indigo-600', initial: 'P', shadow: 'shadow-blue-200' },
                                { role: 'Videographer', name: videographer, gradient: 'from-pink-500 to-rose-600', initial: 'V', shadow: 'shadow-pink-200' },
                                ...(isEventPhase ? [{ role: 'Drone Operator', name: drone, gradient: 'from-teal-500 to-emerald-600', initial: 'D', shadow: 'shadow-teal-200' }] : []),
                            ].map(member => (
                                <div key={member.role} className="flex items-center gap-3 p-3 bg-gray-50/60 border border-gray-100 rounded-xl hover:bg-white hover:border-gray-200 transition-all">
                                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${member.gradient} flex items-center justify-center text-white text-xs font-extrabold shadow-sm ${member.shadow} shrink-0`}>
                                        {member.initial}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-none">{member.role}</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5">{member.name || 'Unassigned'}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Event Date */}
                            <div className="flex items-center gap-3 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl mt-1">
                                <div className="w-9 h-9 rounded-full bg-white border border-indigo-100 flex items-center justify-center shadow-xs shrink-0">
                                    <Calendar size={15} className="text-indigo-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest leading-none">Event Date</p>
                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{formatDateTime(data.date)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Verification Actions */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <ShieldCheck size={15} className="text-emerald-600" />
                            </div>
                            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">Verification Actions</h2>
                        </div>
                        <div className="p-5">
                            {verificationDone ? (
                                <div className="space-y-4">
                                    {/* Success banner */}
                                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm shrink-0">
                                            <CheckCircle size={18} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-extrabold text-emerald-800">
                                                {isCrmVerified ? 'CRM Verification Approved' : 'Data Manager Approved'}
                                            </p>
                                            <p className="text-xs text-emerald-600 mt-1 leading-relaxed">
                                                {isCrmVerified
                                                    ? 'All uploaded media has been audited and approved by the CRM team.'
                                                    : 'Assets have been verified by the Data Manager.'}
                                            </p>
                                        </div>
                                    </div>

                                    {shouldAssignEditingTeam && onAssignEditingTeam ? (
                                        <button
                                            onClick={onAssignEditingTeam}
                                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                                        >
                                            <Users size={16} /> Assign Editing Team
                                        </button>
                                    ) : isCrmContext && isCrmVerified && onSendToClient && (
                                        <button
                                            onClick={onSendToClient}
                                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                                        >
                                            <Send size={16} /> Send to Client
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Warning hint */}
                                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100 mb-1">
                                        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                            Review all drive links and media counts before approving.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleAction('verify')}
                                        disabled={submitting}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        <CheckCircle size={16} />
                                        {submitting ? 'Processing…' : 'Approve All Media'}
                                    </button>
                                    <button
                                        onClick={() => handleAction('request-reupload')}
                                        disabled={submitting}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-extrabold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        <RotateCcw size={16} />
                                        {submitting ? 'Processing…' : 'Request Re-upload'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
