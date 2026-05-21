import { useState, useEffect } from 'react'
import { Play, Pause, Square, Upload, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useMediaRole } from '../../../hooks/useMediaRole'
import axios from 'axios'
import { toast } from 'sonner'

const API_URL = import.meta.env.VITE_API_URL

interface EventStatus {
    external_lead_id: string
    event_status: string
    event_started_at: string | null
    event_paused_at: string | null
    event_ended_at: string | null
    event_started_by: string | null
}

interface AssignedEvent {
    lead_id: number
    lead_code: string
    name: string
    type: string
    deadline: string
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    not_started: { label: 'Not Started', color: '#6B7280', bg: '#F3F4F6', icon: Clock },
    started: { label: 'In Progress', color: '#059669', bg: '#ECFDF5', icon: Play },
    paused: { label: 'Paused', color: '#D97706', bg: '#FFFBEB', icon: Pause },
    ended: { label: 'Ended', color: '#DC2626', bg: '#FEF2F2', icon: CheckCircle },
}

export default function EventActions() {
    const { employeeId, role } = useMediaRole()
    const [events, setEvents] = useState<AssignedEvent[]>([])
    const [eventStatuses, setEventStatuses] = useState<Record<string, EventStatus>>({})
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    useEffect(() => {
        if (!employeeId) { setLoading(false); return }
        fetch(`${API_URL}/employee/${employeeId}/assigned-projects`)
            .then(res => res.json())
            .then(result => {
                if (result.success) setEvents(result.data || [])
            })
            .catch(err => console.error('Events fetch error:', err))
            .finally(() => setLoading(false))
    }, [employeeId])

    // Fetch event status for each event
    useEffect(() => {
        events.forEach(async (event) => {
            try {
                const res = await axios.get(`${API_URL}/event-coordinator/event/${event.lead_id}/status`)
                if (res.data.success) {
                    setEventStatuses(prev => ({ ...prev, [event.lead_id]: res.data.data }))
                }
            } catch { /* event details may not exist yet */ }
        })
    }, [events])

    const handleAction = async (leadId: number, action: 'start' | 'pause' | 'end') => {
        setActionLoading(`${leadId}-${action}`)
        try {
            const userName = (() => {
                try {
                    const u = JSON.parse(localStorage.getItem('ra_user') || '{}')
                    return u.name || u.email || 'Unknown'
                } catch { return 'Unknown' }
            })()

            await axios.patch(`${API_URL}/event-coordinator/event/${leadId}/${action}`, {
                started_by: userName,
                paused_by: userName,
                ended_by: userName,
                role: role || 'photographer',
            })

            // Refresh status
            const res = await axios.get(`${API_URL}/event-coordinator/event/${leadId}/status`)
            if (res.data.success) {
                setEventStatuses(prev => ({ ...prev, [leadId]: res.data.data }))
            }

            const labels = { start: 'started', pause: 'paused', end: 'ended' }
            toast.success(`Event ${labels[action]} successfully`)
        } catch (err: any) {
            toast.error(err.response?.data?.message || `Failed to ${action} event`)
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
        )
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-16">
                <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">No Assigned Events</h3>
                <p className="text-sm text-gray-500 mt-1">You don't have any events assigned to you yet.</p>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Event Actions</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your live event status and upload footages</p>
            </div>

            <div className="space-y-6">
                {events.map(event => {
                    const status = eventStatuses[event.lead_id]
                    const currentStatus = status?.event_status || 'not_started'
                    const config = statusConfig[currentStatus] || statusConfig.not_started
                    const StatusIcon = config.icon

                    return (
                        <div key={event.lead_id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            {/* Header */}
                            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">{event.name}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">{event.type} | {event.lead_code || `Lead #${event.lead_id}`}</p>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: config.bg, color: config.color }}>
                                    <StatusIcon size={14} />
                                    {config.label}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-6 py-5">
                                <div className="flex gap-3 flex-wrap">
                                    {/* Start */}
                                    {(currentStatus === 'not_started' || currentStatus === 'paused') && (
                                        <button
                                            onClick={() => handleAction(event.lead_id, 'start')}
                                            disabled={actionLoading === `${event.lead_id}-start`}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                                        >
                                            <Play size={16} />
                                            {currentStatus === 'paused' ? 'Resume Event' : 'Event Started'}
                                        </button>
                                    )}

                                    {/* Pause */}
                                    {currentStatus === 'started' && (
                                        <button
                                            onClick={() => handleAction(event.lead_id, 'pause')}
                                            disabled={actionLoading === `${event.lead_id}-pause`}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
                                        >
                                            <Pause size={16} />
                                            Event Paused
                                        </button>
                                    )}

                                    {/* End */}
                                    {(currentStatus === 'started' || currentStatus === 'paused') && (
                                        <button
                                            onClick={() => handleAction(event.lead_id, 'end')}
                                            disabled={actionLoading === `${event.lead_id}-end`}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                                        >
                                            <Square size={16} />
                                            Event Ended
                                        </button>
                                    )}

                                    {/* Upload - only after event ended */}
                                    {currentStatus === 'ended' && (
                                        <button
                                            onClick={() => {
                                                // Navigate to upload page with lead context
                                                window.location.href = `/media/upload-files?lead_id=${event.lead_id}&client=${encodeURIComponent(event.name)}`
                                            }}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                                        >
                                            <Upload size={16} />
                                            Upload Footages / Images
                                        </button>
                                    )}
                                </div>

                                {/* Timestamps */}
                                {status && (
                                    <div className="mt-4 flex gap-6 text-xs text-gray-400">
                                        {status.event_started_at && (
                                            <span>Started: {new Date(status.event_started_at).toLocaleString()}</span>
                                        )}
                                        {status.event_paused_at && (
                                            <span>Paused: {new Date(status.event_paused_at).toLocaleString()}</span>
                                        )}
                                        {status.event_ended_at && (
                                            <span>Ended: {new Date(status.event_ended_at).toLocaleString()}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
