import { useState, useEffect, useMemo } from 'react'
import { ShieldCheck, Eye, Search, Download, ArrowLeft, User, Calendar, Camera, Video, CheckCircle, RotateCcw, Image as ImageIcon } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const statusColors: Record<string, { bg: string; text: string }> = {
    Pending:              { bg: '#FEF3C7', text: '#D97706' },
    Verified:             { bg: '#D1FAE5', text: '#059669' },
    Pending_Verification: { bg: '#EDE9FE', text: '#7C3AED' },
    Reupload_Requested:   { bg: '#FEE2E2', text: '#DC2626' },
    crm_verified:         { bg: '#DBEAFE', text: '#1D4ED8' },
    QC_Pending_Pixoffice: { bg: '#FEF9C3', text: '#A16207' },
    QC_Pending_Pixstudio: { bg: '#FEE2E2', text: '#9F1239' },
    harddisk_closed:      { bg: '#ECFDF5', text: '#065F46' },
}

const statuses = [
    'All Status', 'Pending', 'Verified', 'crm_verified',
    'Pending_Verification', 'Reupload_Requested',
    'QC_Pending_Pixoffice', 'QC_Pending_Pixstudio'
]

export type QCWorkflowPhase = 'pre_production' | 'post_production' | 'event' | 'all'

interface QCCheckProps {
    portal?: 'admin' | 'crm' | 'event-coordinator'
    workflowPhase?: QCWorkflowPhase
    title?: string
    description?: string
}

export default function QCCheck({
    portal = 'admin',
    workflowPhase = 'all',
    title,
    description,
}: QCCheckProps) {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('All Status')
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [submitting, setSubmitting] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await axios.get(`${API_URL}/data-manager/incoming`)
            if (res.data?.success && res.data.data) {
                const mapped = res.data.data.map((item: any) => ({
                    isEventPhase: item.current_phase === 'event',
                    id: String(item.id),
                    client: item.client || '—',
                    date: item.date || '—',
                    photographer: item.photographer || null,
                    videographer: item.videographer || null,
                    drone: item.current_phase === 'event' ? (item.drone || null) : null,
                    numImages: (Number(item.num_images) || 0) + (item.current_phase === 'event' ? (Number(item.drone_num_images) || 0) : 0),
                    numVideos: (Number(item.num_videos) || 0) + (item.current_phase === 'event' ? (Number(item.drone_num_videos) || 0) : 0),
                    photographerImages: Number(item.num_images) || 0,
                    videographerVideos: Number(item.num_videos) || 0,
                    droneImages: item.current_phase === 'event' ? (Number(item.drone_num_images) || 0) : 0,
                    droneVideos: item.current_phase === 'event' ? (Number(item.drone_num_videos) || 0) : 0,
                    driveLink: item.drive_link || null,
                    videoDriveLink: item.video_drive_link || null,
                    dronePhotoDriveLink: item.current_phase === 'event' ? (item.drone_photo_drive_link || null) : null,
                    droneVideoDriveLink: item.current_phase === 'event' ? (item.drone_video_drive_link || null) : null,
                    uploadNotes: item.upload_notes || null,
                    videoUploadNotes: item.video_upload_notes || null,
                    droneUploadNotes: item.current_phase === 'event' ? (item.drone_upload_notes || null) : null,
                    droneVideoUploadNotes: item.current_phase === 'event' ? (item.drone_video_upload_notes || null) : null,
                    cameraUsed: item.camera_used || null,
                    videoCameraUsed: item.video_camera_used || null,
                    droneCameraUsed: item.current_phase === 'event' ? (item.drone_camera_used || null) : null,
                    droneVideoCameraUsed: item.current_phase === 'event' ? (item.drone_video_camera_used || null) : null,
                    currentPhase: item.current_phase || '',
                    status: item.status || 'Pending',
                    raw: item,
                }))
                setData(mapped)
            }
        } catch (err) {
            console.error('QCCheck fetch error:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const filtered = useMemo(() => {
        return data.filter(item => {
            const q = search.toLowerCase()
            const matchSearch =
                item.client.toLowerCase().includes(q) ||
                item.id.includes(q) ||
                (item.photographer?.toLowerCase().includes(q) || false) ||
                (item.videographer?.toLowerCase().includes(q) || false) ||
                (item.drone?.toLowerCase().includes(q) || false)
            const matchStatus = statusFilter === 'All Status' || item.status === statusFilter
            // Workflow-aware filter by current_phase. Items without a
            // current_phase fall back to pre_production so legacy rows still
            // appear under the pre-production tabs.
            let matchPhase = true
            if (workflowPhase !== 'all') {
                const phase = (item.currentPhase || 'pre_production').toLowerCase()
                matchPhase = phase === workflowPhase
            }
            return matchSearch && matchStatus && matchPhase
        })
    }, [data, search, statusFilter, workflowPhase])

    const showDroneColumn = filtered.some((item) => item.isEventPhase)

    const handleDownloadReport = () => {
        if (filtered.length === 0) return
        const headers = ['ID', 'Client', 'Date', 'Photographer', 'Videographer', ...(showDroneColumn ? ['Drone'] : []), 'Images', 'Videos', 'Status']
        const csvRows = filtered.map(row =>
            [row.id, row.client, row.date, row.photographer || '—', row.videographer || '—', ...(showDroneColumn ? [row.drone || '—'] : []),
             row.numImages, row.numVideos, row.status.replace(/_/g, ' ')]
            .map(val => `"${String(val || '').replace(/"/g, '""')}"`)
            .join(',')
        )
        const csv = [headers.join(','), ...csvRows].join('\n')
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const d = new Date()
        link.setAttribute('href', URL.createObjectURL(blob))
        link.setAttribute('download', `qc_check_${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}.csv`)
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleAction = async (action: 'verify' | 'request-reupload') => {
        if (!selectedItem) return
        setSubmitting(true)
        try {
            const isCrmCtx = portal === 'crm' || portal === 'event-coordinator'
            const endpoint = action === 'verify' && isCrmCtx ? 'crm-verify' : action
            const res = await fetch(`${API_URL}/data-manager/${selectedItem.id}/${endpoint}`, { method: 'PATCH' })
            const result = await res.json()
            if (result.success) {
                toast.success(action === 'verify' ? 'Files verified successfully' : 'Re-upload requested successfully')
                setSelectedItem(null)
                fetchData()
            } else {
                toast.error(result.message || `Failed to ${action}`)
            }
        } catch (err) {
            console.error(err)
            toast.error('An unexpected error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <div className="p-10 text-gray-500">Loading QC data...</div>
    }

    // ── Detail View (matches RawDataView exactly) ─────────────────────────────
    if (selectedItem) {
        const isCrmCtx = portal === 'crm' || portal === 'event-coordinator'
        const showDroneSection = selectedItem.isEventPhase
        return (
            <div>
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">QC Check — Raw Data</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Lead ID: {selectedItem.id} &nbsp;·&nbsp; Client: {selectedItem.client}
                        </p>
                    </div>
                    <button
                        onClick={() => setSelectedItem(null)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors text-gray-700"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                </div>

                {/* Photographer + Videographer + Drone cards */}
                <div className={`grid grid-cols-1 ${showDroneSection ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 mb-6`}>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="px-6 py-3 border-b border-gray-50 flex items-center gap-2">
                            <Camera size={14} className="text-blue-500" />
                            <h2 className="text-sm font-bold text-gray-900">Photographer</h2>
                        </div>
                        <div className="p-5 flex flex-col gap-4">
                            <div className="flex gap-3 items-start">
                                <div className="text-gray-400 mt-0.5"><User size={15} /></div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Employee</p>
                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedItem.photographer || '—'}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="text-gray-400 mt-0.5"><ImageIcon size={15} /></div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Total Images Uploaded</p>
                                    <p className="text-2xl font-black text-blue-600 mt-0.5">{selectedItem.photographerImages}</p>
                                </div>
                            </div>
                            {selectedItem.cameraUsed && (
                                <div className="flex gap-3 items-start">
                                    <div className="text-gray-400 mt-0.5"><Camera size={15} /></div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Camera Used</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedItem.cameraUsed}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="px-6 py-3 border-b border-gray-50 flex items-center gap-2">
                            <Video size={14} className="text-pink-500" />
                            <h2 className="text-sm font-bold text-gray-900">Videographer</h2>
                        </div>
                        <div className="p-5 flex flex-col gap-4">
                            <div className="flex gap-3 items-start">
                                <div className="text-gray-400 mt-0.5"><User size={15} /></div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Employee</p>
                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedItem.videographer || '—'}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="text-gray-400 mt-0.5"><Video size={15} /></div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Total Videos Uploaded</p>
                                    <p className="text-2xl font-black text-pink-600 mt-0.5">{selectedItem.videographerVideos}</p>
                                </div>
                            </div>
                            {selectedItem.videoCameraUsed && (
                                <div className="flex gap-3 items-start">
                                    <div className="text-gray-400 mt-0.5"><Video size={15} /></div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Equipment Used</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedItem.videoCameraUsed}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-3 items-start">
                                <div className="text-gray-400 mt-0.5"><Calendar size={15} /></div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Shoot Date</p>
                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedItem.date || '—'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {showDroneSection && (
                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                            <div className="px-6 py-3 border-b border-gray-50 flex items-center gap-2">
                                <Camera size={14} className="text-teal-500" />
                                <h2 className="text-sm font-bold text-gray-900">Drone</h2>
                            </div>
                            <div className="p-5 flex flex-col gap-4">
                                <div className="flex gap-3 items-start">
                                    <div className="text-gray-400 mt-0.5"><User size={15} /></div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Employee</p>
                                        <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedItem.drone || '—'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="text-gray-400 mt-0.5"><ImageIcon size={15} /></div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Drone Images Uploaded</p>
                                        <p className="text-2xl font-black text-teal-600 mt-0.5">{selectedItem.droneImages}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="text-gray-400 mt-0.5"><Video size={15} /></div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Drone Videos Uploaded</p>
                                        <p className="text-2xl font-black text-cyan-600 mt-0.5">{selectedItem.droneVideos}</p>
                                    </div>
                                </div>
                                {selectedItem.droneCameraUsed && (
                                    <div className="flex gap-3 items-start">
                                        <div className="text-gray-400 mt-0.5"><Camera size={15} /></div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">Equipment Used</p>
                                            <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedItem.droneCameraUsed}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Upload Notes + Drive Links */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="px-6 py-3 border-b border-gray-50">
                            <h2 className="text-sm font-bold text-gray-900">Upload Notes</h2>
                        </div>
                        <div className="p-5 space-y-3">
                            {selectedItem.uploadNotes && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-1">Photo Notes</p>
                                    <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-lg p-3">{selectedItem.uploadNotes}</p>
                                </div>
                            )}
                            {selectedItem.videoUploadNotes && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-1">Video Notes</p>
                                    <p className="text-sm text-pink-700 bg-pink-50 border border-pink-100 rounded-lg p-3">{selectedItem.videoUploadNotes}</p>
                                </div>
                            )}
                            {showDroneSection && selectedItem.droneUploadNotes && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-1">Drone Notes</p>
                                    <p className="text-sm text-teal-700 bg-teal-50 border border-teal-100 rounded-lg p-3">{selectedItem.droneUploadNotes}</p>
                                </div>
                            )}
                            {!selectedItem.uploadNotes && !selectedItem.videoUploadNotes && !(showDroneSection && selectedItem.droneUploadNotes) && (
                                <p className="text-xs text-gray-400">No upload notes provided.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm flex flex-col">
                        <div className="px-6 py-3 border-b border-gray-50">
                            <h2 className="text-sm font-bold text-gray-900 text-center">Drive Links</h2>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-center items-center gap-4">
                            {selectedItem.driveLink ? (
                                <a href={selectedItem.driveLink} target="_blank" rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors">
                                    <Camera size={16} /> Photo Drive
                                </a>
                            ) : (
                                <span className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-400 rounded-lg text-sm font-semibold">
                                    <Camera size={16} /> No Photos
                                </span>
                            )}
                            {selectedItem.videoDriveLink ? (
                                <a href={selectedItem.videoDriveLink} target="_blank" rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-lg text-sm font-semibold hover:bg-pink-100 transition-colors">
                                    <Video size={16} /> Video Drive
                                </a>
                            ) : (
                                <span className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-400 rounded-lg text-sm font-semibold">
                                    <Video size={16} /> No Videos
                                </span>
                            )}
                            {showDroneSection && selectedItem.dronePhotoDriveLink ? (
                                <a href={selectedItem.dronePhotoDriveLink} target="_blank" rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-lg text-sm font-semibold hover:bg-teal-100 transition-colors">
                                    <Camera size={16} /> Drone Photo Drive
                                </a>
                            ) : showDroneSection ? (
                                <span className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-400 rounded-lg text-sm font-semibold">
                                    <Camera size={16} /> No Drone Photos
                                </span>
                            ) : null}
                            {showDroneSection && selectedItem.droneVideoDriveLink ? (
                                <a href={selectedItem.droneVideoDriveLink} target="_blank" rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-lg text-sm font-semibold hover:bg-cyan-100 transition-colors">
                                    <Video size={16} /> Drone Video Drive
                                </a>
                            ) : showDroneSection ? (
                                <span className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-400 rounded-lg text-sm font-semibold">
                                    <Video size={16} /> No Drone Videos
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={() => handleAction('verify')}
                        disabled={submitting || (!isCrmCtx && selectedItem.status === 'Verified') || selectedItem.status === 'crm_verified'}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                        <CheckCircle size={16} />
                        {selectedItem.status === 'crm_verified' ? '✓ QC Completed' :
                         (!isCrmCtx && selectedItem.status === 'Verified') ? 'Already Verified' :
                         isCrmCtx ? 'Verify Files & continue' : 'Move to Verification'}
                    </button>
                    <button
                        onClick={() => handleAction('request-reupload')}
                        disabled={submitting || selectedItem.status === 'Reupload_Requested'}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white border border-red-200 disabled:border-gray-200 disabled:text-gray-400 text-red-500 hover:bg-red-50 rounded-lg text-sm font-semibold transition-colors"
                    >
                        <RotateCcw size={16} />
                        {selectedItem.status === 'Reupload_Requested' ? 'Re-upload Requested' : 'Request Re-Upload'}
                    </button>
                </div>
            </div>
        )
    }

    // ── List View ─────────────────────────────────────────────────────────────
    return (
        <div>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ShieldCheck size={20} className="text-indigo-500" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{title ?? 'QC Check'}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{description ?? 'Quality control overview for all incoming data across the pipeline'}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 w-80 shadow-sm">
                    <Search size={15} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by ID, client or employee..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative shadow-sm rounded-xl">
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="flex items-center gap-1 pl-4 pr-10 py-2.5 text-sm font-medium cursor-pointer appearance-none outline-none bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                            style={{ color: '#4B5563' }}
                        >
                            {statuses.map(opt => (
                                <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </div>
                    <button
                        onClick={handleDownloadReport}
                        disabled={filtered.length === 0}
                        className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={15} /> Download report
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">ID</th>
                            <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Employee</th>
                            <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Client</th>
                            <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Event Date</th>
                            <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Files</th>
                            <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Status</th>
                            <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((row, i) => (
                            <tr key={row.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                                <td className="px-6 py-4 text-sm font-bold text-indigo-600">{row.id}</td>
                                <td className="px-6 py-4">
                                    {row.photographer && (
                                        <div className="mb-2">
                                            <p className="text-sm font-semibold text-gray-900">{row.photographer}</p>
                                            <p className="text-xs text-gray-400">Photographer</p>
                                        </div>
                                    )}
                                    {row.videographer && (
                                        <div className={row.drone ? 'mb-2' : ''}>
                                            <p className="text-sm font-semibold text-gray-900">{row.videographer}</p>
                                            <p className="text-xs text-gray-400">Videographer</p>
                                        </div>
                                    )}
                                    {row.drone && (
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{row.drone}</p>
                                            <p className="text-xs text-gray-400">Drone</p>
                                        </div>
                                    )}
                                    {!row.photographer && !row.videographer && !row.drone && (
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">Unknown</p>
                                            <p className="text-xs text-gray-400">Media</p>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">{row.client}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{row.date}</td>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                    <span className="mr-2">📷 {row.numImages}</span>
                                    <span>🎬 {row.numVideos}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        className="px-2.5 py-1 rounded-full text-xs font-semibold"
                                        style={{
                                            background: statusColors[row.status]?.bg ?? '#F3F4F6',
                                            color: statusColors[row.status]?.text ?? '#6B7280'
                                        }}
                                    >
                                        {row.status?.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => setSelectedItem(row)}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                                    >
                                        <Eye size={14} /> View
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                                    No QC records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
