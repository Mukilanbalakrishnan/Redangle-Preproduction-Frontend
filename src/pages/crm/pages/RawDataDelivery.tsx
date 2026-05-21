import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { ArrowLeft, Bell, CalendarDays, Check, Copy, ExternalLink, Image as ImageIcon, Send, User, Video } from 'lucide-react'
import { toast } from 'sonner'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

type RawDataDeliveryProps = {
    leadId?: string
    projectId?: string
    mode?: 'raw' | 'final'
    onBack: () => void
    onSent?: () => void
}

type DeliverySummary = {
    display_id: string
    client_name: string
    project_phase: string
    delivery_type: string
    project_id?: string
    drive_link?: string | null
    video_drive_link?: string | null
    drone_photo_drive_link?: string | null
    drone_video_drive_link?: string | null
    total_images: number
    total_videos: number
    drone_num_images?: number
    drone_num_videos?: number
    estimated_size_gb: number
    client_portal_url: string
    client_delivery_status?: string | null
    event_date?: string | null
    assigned_event_date?: string | null
}

const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
}

const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
}

export default function RawDataDelivery({ leadId, projectId, mode = 'raw', onBack, onSent }: RawDataDeliveryProps) {
    const [summary, setSummary] = useState<DeliverySummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')

    useEffect(() => {
        let active = true
        const lookupId = mode === 'final' ? projectId : leadId
        if (!lookupId) return
        setLoading(true)
        const url = mode === 'final'
            ? `${API_URL}/crm/projects/${encodeURIComponent(lookupId)}/final-delivery`
            : `${API_URL}/crm/raw-data/${encodeURIComponent(lookupId)}/delivery`
        axios.get(url)
            .then(res => {
                if (active) setSummary(res.data?.data || null)
            })
            .catch(error => {
                console.error('Raw data delivery summary failed:', error)
                toast.error(error.response?.data?.message || 'Failed to load raw data delivery')
            })
            .finally(() => {
                if (active) setLoading(false)
            })

        return () => {
            active = false
        }
    }, [leadId, mode, projectId])

    const fileLinks = useMemo(() => {
        if (!summary) return []
        return [
            { label: mode === 'final' ? 'Photos / Album Delivery Link' : 'Photos Download Link', url: summary.drive_link, icon: ImageIcon },
            { label: mode === 'final' ? 'Video Delivery Link' : 'Videos Download Link', url: summary.video_drive_link, icon: Video },
            { label: 'Drone Photos Download Link', url: summary.drone_photo_drive_link, icon: ImageIcon },
            { label: 'Drone Videos Download Link', url: summary.drone_video_drive_link, icon: Video },
        ].filter(item => Boolean(item.url))
    }, [mode, summary])

    const handleSend = async () => {
        if (!summary || submitting) return
        const lookupId = mode === 'final' ? projectId : leadId
        if (!lookupId) return
        setSubmitting(true)
        try {
            const defaultNotes = mode === 'final'
                ? `${summary.project_phase} final deliverables are ready for review.`
                : `${summary.project_phase} raw files are ready for review.`
            const subjectText = subject.trim()
            const messageText = message.trim()
            const notes = [
                subjectText ? `Subject: ${subjectText}` : '',
                messageText || defaultNotes,
            ].filter(Boolean).join('\n\n')
            const url = mode === 'final'
                ? `${API_URL}/crm/projects/${encodeURIComponent(lookupId)}/send-final-to-client`
                : `${API_URL}/crm/raw-data/${encodeURIComponent(lookupId)}/send-to-client`
            await axios.post(url, { notes, subject: subjectText || undefined, message: messageText || undefined })
            toast.success(mode === 'final' ? 'Final delivery sent to client successfully!' : 'Delivery details sent to client successfully!')
            onSent?.()
        } catch (error: any) {
            console.error('Send raw data to client failed:', error)
            toast.error(error.response?.data?.message || 'Failed to send delivery to client')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <div className="p-10 text-sm text-gray-500">Loading {mode === 'final' ? 'final' : 'raw data'} delivery...</div>
    }

    if (!summary) {
        return (
            <div className="space-y-5">
                <button onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="rounded-2xl border border-gray-100 bg-white p-8 text-sm text-gray-500 shadow-sm">
                    No {mode === 'final' ? 'final' : 'raw data'} delivery details found.
                </div>
            </div>
        )
    }

    const eventDate = summary.event_date || summary.assigned_event_date || new Date().toLocaleDateString('en-GB')
    const filesText = `${summary.total_images || 0} photos, ${summary.total_videos || 0} videos`
    return (
        <div>
            <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <button onClick={onBack} className="mt-1 rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{mode === 'final' ? 'Final Delivery' : 'Raw Data Delivery'}</h1>
                        <p className="mt-1 text-sm text-gray-500">{mode === 'final' ? 'Send approved editor output to the client' : 'Send raw data output to the client'}</p>
                    </div>
                </div>
                {summary.client_delivery_status && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        {summary.client_delivery_status === 'client_approved' ? 'Client Approved' : 'Sent to Client'}
                    </span>
                )}
            </div>

            <div className="crm-card mb-5 p-5">
                <p className="mb-4 text-sm font-semibold text-gray-900">Delivery Summary</p>
                <div className="flex flex-wrap items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-purple-700"><User size={16} /></div>
                        <div>
                            <div className="text-xs text-gray-400">Client</div>
                            <div className="text-sm font-semibold text-gray-900">{summary.client_name}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700"><ImageIcon size={16} /></div>
                        <div>
                            <div className="text-xs text-gray-400">Project Phase</div>
                            <div className="text-sm font-semibold text-gray-900">{summary.project_phase}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Check size={16} /></div>
                        <div>
                            <div className="text-xs text-gray-400">Status</div>
                            <div className="text-sm font-semibold text-emerald-600">Ready For Delivery</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
                <div className="crm-card p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <ExternalLink size={14} className="text-gray-500" />
                        <span className="text-sm font-semibold text-gray-900">{mode === 'final' ? 'Approved Delivery Links' : 'Raw File Links'}</span>
                    </div>
                    {fileLinks.length > 0 ? fileLinks.map(link => {
                        const Icon = link.icon
                        return (
                            <div key={link.label} className="mb-4 last:mb-0">
                                <p className="mb-1.5 text-xs font-medium text-gray-700">{link.label}</p>
                                <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
                                    <Icon size={15} className="text-gray-400" />
                                    <span className="flex-1 truncate text-sm text-gray-500">{link.url}</span>
                                    <button onClick={() => copyText(link.url || '')} className="text-gray-400 transition hover:text-indigo-600" title="Copy link"><Copy size={14} /></button>
                                    <button onClick={() => openLink(link.url || '')} className="text-gray-400 transition hover:text-indigo-600" title="Open link"><ExternalLink size={14} /></button>
                                </div>
                            </div>
                        )
                    }) : (
                        <div className="rounded-xl bg-gray-50 p-6 text-center text-sm font-medium text-gray-400">
                            No {mode === 'final' ? 'approved delivery' : 'raw file'} links are available.
                        </div>
                    )}
                </div>

                <div className="crm-card p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Bell size={15} className="text-purple-500" />
                        <span className="text-sm font-semibold text-gray-900">Client Message</span>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="mb-1.5 flex items-center justify-between gap-3">
                                <label className="text-xs font-medium text-gray-700">Subject</label>
                                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Optional</span>
                            </div>
                            <input
                                type="text"
                                value={subject}
                                onChange={event => setSubject(event.target.value)}
                                placeholder={mode === 'final' ? 'Final delivery ready for review' : 'Raw files ready for review'}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-200 focus:ring-2 focus:ring-purple-100"
                            />
                        </div>
                        <div>
                            <div className="mb-1.5 flex items-center justify-between gap-3">
                                <label className="text-xs font-medium text-gray-700">Message</label>
                                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Optional</span>
                            </div>
                            <textarea
                                value={message}
                                onChange={event => setMessage(event.target.value)}
                                placeholder={mode === 'final'
                                    ? 'Add any delivery notes for the client...'
                                    : 'Add any raw data notes for the client...'}
                                className="min-h-[122px] w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-200 focus:ring-2 focus:ring-purple-100"
                            />
                        </div>
                        <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
                            If left blank, the system will send the standard {mode === 'final' ? 'final delivery' : 'raw data'} notification.
                        </p>
                    </div>
                </div>
            </div>

            <div className="crm-card mb-5 p-5">
                <div className="mb-4 flex items-center gap-2">
                    <CalendarDays size={14} className="text-gray-500" />
                    <span className="text-sm font-semibold text-gray-900">Delivery Details</span>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <div>
                        <p className="mb-1.5 text-xs font-medium text-gray-700">Delivery Date</p>
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900">
                            {new Date().toLocaleDateString('en-GB')} <CalendarDays size={14} className="text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <p className="mb-1.5 text-xs font-medium text-gray-700">Files</p>
                        <div className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900">{filesText}</div>
                    </div>
                    <div>
                        <p className="mb-1.5 text-xs font-medium text-gray-700">Estimated Size</p>
                        <div className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900">{Number(summary.estimated_size_gb || 0).toFixed(1)} GB</div>
                    </div>
                </div>
                    <p className="mt-3 text-xs text-gray-400">Lead ID: {summary.display_id} · Event Date: {eventDate}</p>
            </div>

            <div className="flex justify-end gap-3">
                <button onClick={onBack} className="px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:text-gray-900">Cancel</button>
                <button className="crm-card flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                    <Bell size={13} /> Notify Chat
                </button>
                <button
                    onClick={handleSend}
                    disabled={submitting || fileLinks.length === 0}
                    className="flex items-center gap-2 rounded-2xl bg-[#5B5FC7] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4f46e5] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Send size={13} /> {submitting ? 'Sending...' : 'Send to Client'}
                </button>
            </div>
        </div>
    )
}
