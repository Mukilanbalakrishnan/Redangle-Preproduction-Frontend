import { useEffect, useMemo, useState } from 'react'
import {
    ArrowLeft,
    Calendar,
    Camera,
    CheckCircle2,
    ClipboardCheck,
    Database,
    Eye,
    FileText,
    HardDrive,
    Link as LinkIcon,
    Mail,
    MapPin,
    Phone,
    Search,
    ShieldCheck,
    Video,
} from 'lucide-react'
import { matchesDataManagerStage, useDataManagerStageScope } from '../utils/stageScope'
import { ShootDetailsViewer } from './RawDataView'

const API_URL = import.meta.env.VITE_API_URL

const safeParseJSON = (str: string | null) => {
    if (!str) return null
    try {
        return JSON.parse(str)
    } catch {
        return null
    }
}

const initialChecks = [
    { id: 1, label: 'All files received and accessible', group: 'Access' },
    { id: 2, label: 'File formats match requirements (RAW/JPEG/MP4)', group: 'Format' },
    { id: 3, label: 'File count matches shoot log', group: 'Count' },
    { id: 4, label: 'No corrupt or missing files', group: 'Quality' },
    { id: 5, label: 'Folder structure follows naming convention', group: 'Structure' },
    { id: 6, label: 'Audio sync verified for video files', group: 'Video' },
    { id: 7, label: 'Color profile and white balance checked', group: 'Quality' },
    { id: 8, label: 'Resolution matches contract specs', group: 'Specs' },
    { id: 9, label: 'Backup copy verified', group: 'Backup' },
].map(item => ({ ...item, checked: false }))

const issuePresets = [
    'Missing files',
    'Corrupt files',
    'Wrong format',
    'Count mismatch',
    'Audio issue',
    'Folder naming issue',
]

const normalizeStatus = (status?: string) => String(status || 'Pending').replace(/_/g, ' ')

const statusStyle = (status?: string) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'pending_verification') return 'bg-orange-50 text-orange-700 border-orange-100'
    if (normalized === 'verified') return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    if (normalized === 'reupload_requested') return 'bg-red-50 text-red-700 border-red-100'
    return 'bg-blue-50 text-blue-700 border-blue-100'
}

const formatDate = (value?: string) => {
    if (!value || value === '-') return '-'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const hasText = (value: unknown) => String(value || '').trim().length > 0

const openLink = (link?: string) => {
    if (!hasText(link)) return
    window.open(String(link), '_blank', 'noopener,noreferrer')
}

const getUploadedGroups = (rawData: any, isPreProduction: boolean) => {
    const groups = [
        {
            key: 'photo',
            label: 'Photography',
            owner: rawData?.photographer,
            link: rawData?.drive_link,
            notes: rawData?.upload_notes,
            count: Number(rawData?.num_images || 0),
            camera: rawData?.camera_used,
            deliveryMethod: rawData?.photo_delivery_method,
            hardDiskDate: rawData?.photo_hard_disk_delivery_date,
            hardDiskReceived: rawData?.photo_hard_disk_received,
            Icon: Camera,
            tone: 'text-blue-600 bg-blue-50',
        },
        {
            key: 'video',
            label: 'Videography',
            owner: rawData?.videographer,
            link: rawData?.video_drive_link,
            notes: rawData?.video_upload_notes,
            count: Number(rawData?.num_videos || 0),
            camera: rawData?.video_camera_used,
            deliveryMethod: rawData?.video_delivery_method,
            hardDiskDate: rawData?.video_hard_disk_delivery_date,
            hardDiskReceived: rawData?.video_hard_disk_received,
            Icon: Video,
            tone: 'text-pink-600 bg-pink-50',
        },
        {
            key: 'save-date',
            label: 'Save the Date',
            owner: rawData?.save_the_date,
            link: rawData?.save_the_date_drive_link,
            notes: rawData?.save_the_date_upload_notes,
            count: hasText(rawData?.save_the_date_drive_link) ? 1 : 0,
            camera: rawData?.save_the_date_submission_status,
            Icon: FileText,
            tone: 'text-purple-600 bg-purple-50',
        },
        {
            key: 'save-video',
            label: 'Save the Video',
            owner: rawData?.save_the_video,
            link: rawData?.save_the_video_drive_link,
            notes: rawData?.save_the_video_upload_notes,
            count: hasText(rawData?.save_the_video_drive_link) ? 1 : 0,
            camera: rawData?.save_the_video_submission_status,
            Icon: Video,
            tone: 'text-indigo-600 bg-indigo-50',
        },
        {
            key: 'retouch',
            label: 'Retouch',
            owner: rawData?.retouch,
            link: rawData?.retouch_drive_link,
            notes: rawData?.retouch_upload_notes,
            count: hasText(rawData?.retouch_drive_link) ? 1 : 0,
            camera: rawData?.retouch_submission_status,
            Icon: FileText,
            tone: 'text-amber-600 bg-amber-50',
        },
        {
            key: 'drone-photo',
            label: 'Drone Photos',
            owner: rawData?.drone,
            link: rawData?.drone_photo_drive_link,
            notes: rawData?.drone_upload_notes,
            count: Number(rawData?.drone_num_images || 0),
            camera: rawData?.drone_camera_used,
            deliveryMethod: rawData?.drone_delivery_method,
            hardDiskDate: rawData?.drone_hard_disk_delivery_date,
            hardDiskReceived: rawData?.drone_hard_disk_received,
            Icon: Camera,
            tone: 'text-teal-600 bg-teal-50',
        },
        {
            key: 'drone-video',
            label: 'Drone Videos',
            owner: rawData?.drone,
            link: rawData?.drone_video_drive_link,
            notes: rawData?.drone_video_upload_notes,
            count: Number(rawData?.drone_num_videos || 0),
            camera: rawData?.drone_video_camera_used,
            deliveryMethod: rawData?.drone_delivery_method,
            hardDiskDate: rawData?.drone_hard_disk_delivery_date,
            hardDiskReceived: rawData?.drone_hard_disk_received,
            Icon: Video,
            tone: 'text-teal-600 bg-teal-50',
        },
    ]

    return groups.filter(group => {
        if (!isPreProduction && ['save-date', 'save-video', 'retouch'].includes(group.key)) return false
        return hasText(group.link) || group.count > 0 || hasText(group.hardDiskDate)
    })
}

export default function Verification() {
    const stageScope = useDataManagerStageScope()
    const isPreProduction = stageScope.stage === 'pre_production'
    const [view, setView] = useState<'list' | 'details'>('list')
    const [selectedData, setSelectedData] = useState<any | null>(null)
    const [tableData, setTableData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [checks, setChecks] = useState(initialChecks)
    const [remarks, setRemarks] = useState('')
    const [selectedIssues, setSelectedIssues] = useState<string[]>([])
    const [submitted, setSubmitted] = useState(false)
    const [submittingData, setSubmittingData] = useState(false)

    useEffect(() => {
        if (view === 'list' && !submitted) {
            fetchVerificationData()
        }
    }, [view, submitted, stageScope.stage])

    const fetchVerificationData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/data-manager/incoming`)
            const result = await res.json()
            if (result.success && result.data) {
                const mappedData = result.data
                    .filter((item: any) => matchesDataManagerStage(item, stageScope.stage))
                    .map((item: any) => {
                        const uploadGroups = getUploadedGroups(item, isPreProduction)
                        return {
                            id: item.lead_serial_number || String(item.id),
                            rawId: String(item.id),
                            client: item.client,
                            date: item.date || '-',
                            status: item.status,
                            uploadCount: uploadGroups.length,
                            imageCount: Number(item.num_images || 0) + Number(item.drone_num_images || 0),
                            videoCount: Number(item.num_videos || 0) + Number(item.drone_num_videos || 0),
                            rawData: item,
                        }
                    })
                    .filter((item: any) => ['Pending_Verification', 'Verified', 'crm_verified'].includes(item.status))

                setTableData(mappedData)
            }
        } catch (error) {
            console.error('Error fetching verification data:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredData = useMemo(() => {
        return tableData.filter((item) => {
            const searchLower = searchTerm.toLowerCase()
            return item.client.toLowerCase().includes(searchLower) ||
                item.id.toLowerCase().includes(searchLower)
        })
    }, [tableData, searchTerm])

    const selectedRaw = selectedData?.rawData || {}
    const uploadedGroups = useMemo(() => getUploadedGroups(selectedRaw, isPreProduction), [selectedRaw, isPreProduction])
    const completedChecks = checks.filter(c => c.checked).length
    const totalChecks = checks.length
    const progressPercentage = Math.round((completedChecks / totalChecks) * 100)
    const rejectReady = remarks.trim().length >= 10 || selectedIssues.length > 0

    const stats = useMemo(() => ({
        pending: tableData.filter(i => i.status === 'Pending_Verification').length,
        completed: tableData.filter(i => i.status === 'Verified' || i.status === 'crm_verified').length,
        uploads: tableData.reduce((sum, item) => sum + item.uploadCount, 0),
        images: tableData.reduce((sum, item) => sum + item.imageCount, 0),
        videos: tableData.reduce((sum, item) => sum + item.videoCount, 0),
    }), [tableData])

    const resetDetailState = () => {
        setChecks(initialChecks)
        setRemarks('')
        setSelectedIssues([])
    }

    const loadDetailState = (row: any) => {
        const draft = row?.rawData?.verification_draft
        if (draft) {
            setChecks(draft.checks || initialChecks)
            setRemarks(draft.remarks || '')
            setSelectedIssues(draft.selectedIssues || [])
        } else {
            resetDetailState()
        }
    }

    const toggleCheck = (id: number) => {
        setChecks(checks.map(c => c.id === id ? { ...c, checked: !c.checked } : c))
    }

    const toggleIssue = (issue: string) => {
        setSelectedIssues(prev => prev.includes(issue) ? prev.filter(item => item !== issue) : [...prev, issue])
    }

    const handleApprove = async () => {
        if (!selectedData) return
        setSubmittingData(true)
        try {
            const res = await fetch(`${API_URL}/data-manager/${selectedData.rawId}/approve`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ remarks }),
            })
            const result = await res.json()
            if (result.success) {
                setSubmitted(true)
            } else {
                alert(result.message || 'Failed to approve data')
            }
        } catch (error) {
            console.error('Error approving data:', error)
            alert('An unexpected error occurred')
        } finally {
            setSubmittingData(false)
        }
    }

    const handleSaveDraft = async () => {
        if (!selectedData) return
        setSubmittingData(true)
        try {
            const draftData = { checks, remarks, selectedIssues }
            const res = await fetch(`${API_URL}/data-manager/${selectedData.rawId}/verification-draft`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ draft: draftData }),
            })
            const result = await res.json()
            if (result.success) {
                alert('Draft saved successfully!')
                fetchVerificationData()
            } else {
                alert(result.message || 'Failed to save draft')
            }
        } catch (error) {
            console.error('Error saving draft:', error)
            alert('An unexpected error occurred')
        } finally {
            setSubmittingData(false)
        }
    }

    if (submitted && selectedData) {
        return (
            <div className="flex max-w-6xl flex-col items-center justify-center py-20">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                    <CheckCircle2 size={32} className="text-emerald-600" />
                </div>
                <h2 className="mb-1 text-lg font-bold text-gray-900">Verification Complete</h2>
                <p className="mb-1 text-sm text-gray-500">Data from {selectedData.client} - {selectedData.id}</p>
                <p className="mb-6 text-sm text-gray-500">
                    Status has been set to <b className="text-emerald-600">Data Received / Verified</b>
                </p>
                <div className="mb-8 flex gap-3">
                    <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">Data Received</span>
                    <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700">
                        {isPreProduction ? 'Sent to CRM' : 'Sent to Pixoffice'}
                    </span>
                </div>
                <button
                    onClick={() => {
                        setSubmitted(false)
                        resetDetailState()
                        setSelectedData(null)
                        setView('list')
                    }}
                    className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                    Verify Another Task
                </button>
            </div>
        )
    }

    if (view === 'list') {
        return (
            <div className="max-w-7xl">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{stageScope.label} Verification Tasks</h1>
                        <p className="mt-1 text-sm text-gray-500">Review uploaded files, run QC checks, and approve or request rework.</p>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                        {[
                            ['Pending', stats.pending],
                            ['Completed', stats.completed],
                            ['Uploads', stats.uploads],
                            ['Images', stats.images],
                            ['Videos', stats.videos],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
                                <p className="mt-1 text-xl font-black text-gray-900">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-6 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by client name or lead ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-purple-200 focus:ring-2 focus:ring-purple-100"
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr className="border-b border-gray-100">
                                {['Lead ID', 'Client Name', 'Event Date', 'Files', 'Media Count', 'Status', 'Action'].map((h) => (
                                    <th key={h} className="px-5 py-4 text-left text-xs font-bold text-gray-600">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-sm font-medium text-gray-500">
                                        Loading verification tasks...
                                    </td>
                                </tr>
                            ) : filteredData.length > 0 ? (
                                filteredData.map((row) => (
                                    <tr key={row.rawId} className="border-b border-gray-50 transition last:border-none hover:bg-gray-50">
                                        <td className="px-5 py-4 text-xs font-bold text-indigo-600">#{row.id}</td>
                                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">{row.client}</td>
                                        <td className="px-5 py-4 text-xs text-gray-500">{formatDate(row.date)}</td>
                                        <td className="px-5 py-4">
                                            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{row.uploadCount} uploads</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex gap-2">
                                                <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700">{row.imageCount} images</span>
                                                <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700">{row.videoCount} videos</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${statusStyle(row.status)}`}>
                                                {normalizeStatus(row.status)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                onClick={() => {
                                                    loadDetailState(row)
                                                    setSelectedData(row)
                                                    setView('details')
                                                }}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                                            >
                                                <Eye size={14} /> {['Verified', 'crm_verified'].includes(row.status) ? 'View QC' : 'Start Verification'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-sm font-medium text-gray-500">
                                        No pending verifications found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Verify Raw Data</h1>
                    <p className="mt-1 text-sm text-gray-500">Verifying data from {selectedData?.client} - {selectedData?.id}</p>
                </div>
                <button
                    onClick={() => {
                        setView('list')
                        setSelectedData(null)
                        resetDetailState()
                    }}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                    <ArrowLeft size={16} /> Back to List
                </button>
            </div>

            <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                    <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">#{selectedData?.id}</span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(selectedData?.status)}`}>
                                {normalizeStatus(selectedData?.status)}
                            </span>
                            <span className="rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">{stageScope.label}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedData?.client}</h2>
                        <div className="mt-4 grid gap-3 text-sm text-gray-500 md:grid-cols-3">
                            <span className="flex items-center gap-2"><MapPin size={15} /> {selectedRaw.location || 'Location not added'}</span>
                            <span className="flex items-center gap-2"><Phone size={15} /> {selectedRaw.phone || 'Phone not added'}</span>
                            <span className="flex items-center gap-2"><Mail size={15} /> {selectedRaw.email || 'Email not added'}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {([
                            { label: 'Event Date', value: formatDate(selectedData?.date), Icon: Calendar },
                            { label: 'Uploads', value: String(uploadedGroups.length), Icon: Database },
                            { label: 'Progress', value: `${progressPercentage}%`, Icon: ShieldCheck },
                        ]).map(({ label, value, Icon }) => {
                            return (
                                <div key={label} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                    <Icon size={18} className="mb-3 text-gray-400" />
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
                                    <p className="mt-1 text-sm font-bold text-gray-900">{value}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-6">
                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                    <Database size={16} className="text-indigo-600" /> Uploaded Evidence
                                </h2>
                                <p className="mt-1 text-xs text-gray-500">Open each source and verify counts, accessibility, and notes.</p>
                            </div>
                        </div>

                        {uploadedGroups.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
                                No uploaded evidence found for this lead.
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {uploadedGroups.map(group => {
                                    const Icon = group.Icon
                                    const hardDisk = hasText(group.hardDiskDate)
                                    return (
                                        <div key={group.key} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="flex gap-3">
                                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${group.tone}`}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-gray-900">{group.label}</h3>
                                                        <p className="text-xs text-gray-500">{group.owner || 'Owner not assigned'}</p>
                                                    </div>
                                                </div>
                                                {group.link ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openLink(group.link)}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                                                    >
                                                        <LinkIcon size={14} /> Open Files
                                                    </button>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                                                        <HardDrive size={14} /> Hard Disk
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-4 grid gap-3 text-xs text-gray-500 md:grid-cols-3">
                                                <span className="rounded-lg bg-white px-3 py-2 font-semibold">{group.count || 0} files logged</span>
                                                <span className="rounded-lg bg-white px-3 py-2 font-semibold">{group.camera || 'Camera not added'}</span>
                                                <span className="rounded-lg bg-white px-3 py-2 font-semibold">
                                                    {hardDisk ? `Disk date ${formatDate(group.hardDiskDate)}` : group.deliveryMethod || 'Drive link'}
                                                </span>
                                            </div>
                                            {(() => {
                                                const parsedNotes = safeParseJSON(group.notes)
                                                if (parsedNotes && typeof parsedNotes === 'object') {
                                                    return (
                                                        <div className="mt-4">
                                                            <ShootDetailsViewer details={parsedNotes} clientName={selectedData?.client} />
                                                        </div>
                                                    )
                                                }
                                                return group.notes ? (
                                                    <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-600">{group.notes}</p>
                                                ) : null
                                            })()}
                                            {hardDisk && (
                                                <p className={`mt-3 text-xs font-bold ${group.hardDiskReceived ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    {group.hardDiskReceived ? 'Hard disk received' : 'Hard disk receipt pending'}
                                                </p>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </section>

                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                    <ClipboardCheck size={16} className="text-purple-600" /> Verification Checklist
                                </h2>
                                <p className="mt-1 text-xs text-gray-500">{completedChecks} of {totalChecks} checks completed</p>
                            </div>
                            <button
                                onClick={() => {
                                    const allChecked = checks.every(c => c.checked)
                                    setChecks(checks.map(c => ({ ...c, checked: !allChecked })))
                                }}
                                className="rounded-lg bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 transition hover:bg-purple-100"
                            >
                                {checks.every(c => c.checked) ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="mb-5 h-2 overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-purple-600 transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            {checks.map(check => (
                                <button
                                    key={check.id}
                                    type="button"
                                    onClick={() => toggleCheck(check.id)}
                                    className={`flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left transition ${check.checked ? 'border-purple-100 bg-purple-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${check.checked ? 'border-purple-600 bg-purple-600' : 'border-purple-200 bg-white'}`}>
                                        {check.checked && <CheckCircle2 size={14} className="text-white" strokeWidth={3} />}
                                    </span>
                                    <span>
                                        <span className={`block text-sm font-bold ${check.checked ? 'text-purple-700' : 'text-gray-700'}`}>{check.label}</span>
                                        <span className="text-[11px] font-semibold text-gray-400">{check.group}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                <aside className="space-y-6">
                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-5 flex items-center gap-2 text-sm font-bold text-gray-900">
                            <FileText size={16} className="text-gray-500" /> Verification Notes
                        </h2>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400">Remarks</label>
                        <textarea
                            value={remarks}
                            onChange={event => setRemarks(event.target.value)}
                            placeholder="Add observations, file gaps, drive access issues, or approval notes..."
                            className="min-h-52 w-full resize-none rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-purple-200 focus:ring-2 focus:ring-purple-100"
                        />

                        <div className="mt-5">
                            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Issue Tags</p>
                            <div className="flex flex-wrap gap-2">
                                {issuePresets.map(issue => (
                                    <button
                                        key={issue}
                                        type="button"
                                        onClick={() => toggleIssue(issue)}
                                        className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${selectedIssues.includes(issue) ? 'border-red-100 bg-red-50 text-red-700' : 'border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        {issue}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-sm font-bold text-gray-900">Decision</h2>
                        <div className="mb-5 grid gap-3">
                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Approval Requirement</p>
                                <p className="mt-1 text-sm font-bold text-gray-900">{completedChecks === totalChecks ? 'Ready to approve' : `${totalChecks - completedChecks} checks remaining`}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Draft Notes</p>
                                <p className="mt-1 text-sm font-bold text-gray-900">{rejectReady ? 'Issues and remarks noted' : 'No issues noted'}</p>
                            </div>
                        </div>
                        <div className="grid gap-3">
                            <button
                                onClick={handleApprove}
                                disabled={completedChecks !== totalChecks || submittingData || ['Verified', 'crm_verified'].includes(selectedData?.status)}
                                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <CheckCircle2 size={16} /> {['Verified', 'crm_verified'].includes(selectedData?.status) ? 'Already Approved' : submittingData ? 'Submitting...' : 'Approve Data'}
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                disabled={submittingData || ['Verified', 'crm_verified'].includes(selectedData?.status)}
                                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <ClipboardCheck size={16} /> {submittingData ? 'Saving...' : 'Save Draft'}
                            </button>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    )
}
