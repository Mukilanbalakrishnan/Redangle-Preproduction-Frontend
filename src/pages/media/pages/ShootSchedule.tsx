import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Users, Settings } from 'lucide-react'
import { useMediaRole } from '../../../hooks/useMediaRole'

const API_URL = import.meta.env.VITE_API_URL


interface ScheduleEvent {
    lead_employee_id: number
    lead_id: number
    lead_code: string
    name: string
    type: string
    task_name: string
    priority: string
    deadline: string
    description: string
}

export default function ShootSchedule() {
    const { employeeId, isPhotographer, isVideographer, isDrone } = useMediaRole()
    const [events, setEvents] = useState<ScheduleEvent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!employeeId) { setLoading(false); return }
        fetch(`${API_URL}/employee/${employeeId}/assigned-projects`)
            .then(res => res.json())
            .then(result => {
                if (result.success) setEvents(result.data)
            })
            .catch(err => console.error('Shoot schedule fetch error:', err))
            .finally(() => setLoading(false))
    }, [employeeId])

    const roleEvents = events.filter(e => {
        const task = (e.task_name || '').toLowerCase()
        if (isDrone) return task.includes('drone')
        if (isVideographer) return task.includes('video')
        if (isPhotographer) return task.includes('photo')
        return true
    })

    const now = new Date()
    const upcomingEvents = roleEvents.filter(e => !e.deadline || new Date(e.deadline) >= now)
    const pastEvents = roleEvents.filter(e => e.deadline && new Date(e.deadline) < now)

    const renderEventCard = (event: ScheduleEvent) => (
        <div key={event.lead_employee_id} className="crm-card overflow-hidden">
            <div className="px-5 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid #F3F4F6' }}>
                <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>{event.name} — {event.task_name || event.type}</h3>
                <span className="crm-badge" style={{ background: '#F5F3FF', color: '#5B5FC7' }}>{event.type || '—'}</span>
            </div>
            <div className="grid grid-cols-4 gap-4 px-5 py-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
                <div className="flex gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#E8F0FE', color: '#1565C0' }}><Calendar size={14} /></div><div><p className="text-xs font-medium" style={{ color: '#6B7280' }}>Event Date</p><p className="text-sm font-semibold mt-0.5" style={{ color: '#111827' }}>{event.deadline || '—'}</p></div></div>
                <div className="flex gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#F5F3FF', color: '#5B5FC7' }}><Clock size={14} /></div><div><p className="text-xs font-medium" style={{ color: '#6B7280' }}>Priority</p><p className="text-sm font-semibold mt-0.5" style={{ color: '#111827' }}>{event.priority || '—'}</p></div></div>
                <div className="flex gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FCE4EC', color: '#C2185B' }}><MapPin size={14} /></div><div><p className="text-xs font-medium" style={{ color: '#6B7280' }}>Lead ID</p><p className="text-sm font-semibold mt-0.5 leading-snug" style={{ color: '#111827' }}>{event.lead_code || `LD-${event.lead_id}`}</p></div></div>
                <div className="flex gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#E8F5E9', color: '#2E7D32' }}><Users size={14} /></div><div><p className="text-xs font-medium" style={{ color: '#6B7280' }}>Task</p><p className="text-sm font-semibold mt-0.5" style={{ color: '#111827' }}>{event.task_name || '—'}</p></div></div>
            </div>
            {event.description && (
                <div className="px-5 py-4" style={{ background: '#FAFAFA' }}>
                    <div className="flex items-center gap-2 mb-2"><Settings size={14} style={{ color: '#9CA3AF' }} /><span className="text-xs font-semibold" style={{ color: '#4B5563' }}>Notes</span></div>
                    <p className="text-xs font-medium" style={{ color: '#4B5563' }}>{event.description}</p>
                </div>
            )}
        </div>
    )

    if (loading) {
        return (
            <div>
                <div className="mb-4"><h2 className="text-lg font-bold" style={{ color: '#111827' }}>Event Schedule</h2><p className="text-sm" style={{ color: '#6B7280' }}>Your upcoming sessions</p></div>
                <p className="text-sm text-gray-400 text-center py-10">Loading schedule...</p>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-8">
                <div className="mb-4"><h2 className="text-lg font-bold" style={{ color: '#111827' }}>Upcoming Shoots</h2><p className="text-sm" style={{ color: '#6B7280' }}>Your upcoming sessions</p></div>
                <div className="flex flex-col gap-4">
                    {upcomingEvents.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">No upcoming shoots</p>
                    ) : (
                        upcomingEvents.map(renderEventCard)
                    )}
                </div>
            </div>

            {pastEvents.length > 0 && (
                <div className="mb-8">
                    <div className="mb-4"><h2 className="text-lg font-bold" style={{ color: '#111827' }}>Past Shoots</h2><p className="text-sm" style={{ color: '#6B7280' }}>Completed sessions</p></div>
                    <div className="flex flex-col gap-4">
                        {pastEvents.map(renderEventCard)}
                    </div>
                </div>
            )}
        </div>
    )
}
