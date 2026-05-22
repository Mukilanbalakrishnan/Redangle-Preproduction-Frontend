import { useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Calendar, CheckCircle2, ChevronDown, Clock, ExternalLink, MapPin, PlayCircle, UploadCloud } from 'lucide-react'
import { Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL

type ScheduleRole = 'photographer' | 'videographer' | 'drone'

interface RawEvent {
    lead_employee_id: number | string
    lead_id: number | string
    lead_code?: string
    name: string
    type?: string
    task_key?: string
    task_name?: string
    flow_stage?: string
    request_source?: string
    stage_path?: string
    priority?: string
    deadline?: string
    description?: string
    accepted?: boolean
    upload_link?: string
    upload_notes?: string
    status?: string
    event_status?: string
    event_started_at?: string
    event_paused_at?: string
    event_ended_at?: string
    created_at?: string
}

interface ScheduleItem extends RawEvent {
    task_names: string[]
    upload_links: string[]
    upload_notes_list: string[]
}

interface RoleEventScheduleProps {
    role: ScheduleRole
    title: string
    subtitle: string
    emptyText: string
    accentText: string
    accentBg: string
    Icon: LucideIcon
}

const roleMatches = (event: RawEvent, role: ScheduleRole) => {
    const key = String(event.task_key || '').toLowerCase()
    const task = String(event.task_name || '').toLowerCase()
    if (role === 'photographer') return key.includes('photography') || task.includes('photograph')
    if (role === 'videographer') return key.includes('videography') || task.includes('video')
    return key.includes('drone') || task.includes('drone')
}

const priorityStyle = (priority?: string) => {
    switch (String(priority || '').toLowerCase()) {
        case 'high': return 'border-red-100 bg-red-50 text-red-700'
        case 'medium': return 'border-orange-100 bg-orange-50 text-orange-700'
        case 'low': return 'border-green-100 bg-green-50 text-green-700'
        default: return 'border-gray-100 bg-gray-50 text-gray-600'
    }
}

const trackingStyle = (status?: string) => {
    switch (String(status || '').toLowerCase()) {
        case 'ended': return 'border-emerald-100 bg-emerald-50 text-emerald-700'
        case 'started': return 'border-blue-100 bg-blue-50 text-blue-700'
        case 'paused': return 'border-amber-100 bg-amber-50 text-amber-700'
        default: return 'border-gray-100 bg-gray-50 text-gray-600'
    }
}

const parseDate = (value?: string) => {
    if (!value) return null
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

const dateKey = (value?: string) => {
    const parsed = parseDate(value)
    return parsed ? parsed.toISOString().slice(0, 10) : 'unscheduled'
}

const dateTimeValue = (value?: string) => parseDate(value)?.getTime() ?? Number.MIN_SAFE_INTEGER

const formatDateTime = (value?: string) => {
    const parsed = parseDate(value)
    if (!parsed) return 'Not scheduled'
    return parsed.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const formatDateOnly = (value?: string) => {
    const parsed = parseDate(value)
    if (!parsed) return 'Needs schedule'
    return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const labelText = (value?: string, fallback = '-') => {
    const text = String(value || '').trim()
    return text || fallback
}

const cleanStatus = (value?: string) => {
    const status = String(value || 'not_started').replace(/_/g, ' ')
    return status.charAt(0).toUpperCase() + status.slice(1)
}

const groupEvents = (events: RawEvent[]): ScheduleItem[] => {
    const grouped = new Map<string, ScheduleItem>()

    events.forEach(event => {
        const key = `${event.lead_code || event.lead_id}-${dateKey(event.deadline)}`
        const taskName = labelText(event.task_name || event.type, 'Assigned work')
        const existing = grouped.get(key)

        if (!existing) {
            grouped.set(key, {
                ...event,
                task_names: [taskName],
                upload_links: event.upload_link ? [event.upload_link] : [],
                upload_notes_list: event.upload_notes ? [event.upload_notes] : [],
            })
            return
        }

        if (!existing.task_names.includes(taskName)) existing.task_names.push(taskName)
        if (event.upload_link && !existing.upload_links.includes(event.upload_link)) existing.upload_links.push(event.upload_link)
        if (event.upload_notes && !existing.upload_notes_list.includes(event.upload_notes)) existing.upload_notes_list.push(event.upload_notes)
        existing.accepted = existing.accepted || event.accepted
        existing.status = existing.status || event.status
        existing.event_status = existing.event_status || event.event_status
    })

    return Array.from(grouped.values())
}

const startOfDay = (date: Date) => {
    const copy = new Date(date)
    copy.setHours(0, 0, 0, 0)
    return copy
}

const splitSections = (items: ScheduleItem[]) => {
    const todayStart = startOfDay(new Date())
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(todayStart.getDate() + 1)

    const today: ScheduleItem[] = []
    const upcoming: ScheduleItem[] = []
    const unscheduled: ScheduleItem[] = []
    const past: ScheduleItem[] = []

    items.forEach(item => {
        const parsed = parseDate(item.deadline)
        if (!parsed) {
            unscheduled.push(item)
        } else if (parsed >= todayStart && parsed < tomorrowStart) {
            today.push(item)
        } else if (parsed >= tomorrowStart) {
            upcoming.push(item)
        } else {
            past.push(item)
        }
    })

    const soonestFirst = (a: ScheduleItem, b: ScheduleItem) =>
        dateTimeValue(a.deadline) - dateTimeValue(b.deadline)
        || String(a.lead_code || '').localeCompare(String(b.lead_code || ''))
    const newestFirst = (a: ScheduleItem, b: ScheduleItem) =>
        dateTimeValue(b.deadline) - dateTimeValue(a.deadline)
        || String(a.lead_code || '').localeCompare(String(b.lead_code || ''))

    return {
        today: today.sort(soonestFirst),
        upcoming: upcoming.sort(soonestFirst),
        unscheduled: unscheduled.sort((a, b) => String(a.lead_code || '').localeCompare(String(b.lead_code || ''))),
        past: past.sort(newestFirst),
    }
}

const openUpload = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer')
}

export default function RoleEventSchedule({ role, title, subtitle, emptyText, accentText, accentBg, Icon }: RoleEventScheduleProps) {
    const [events, setEvents] = useState<RawEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedKey, setSelectedKey] = useState<string>('')

    useEffect(() => {
        const raw = localStorage.getItem('ra_user')
        if (!raw) {
            setLoading(false)
            return
        }

        const user = JSON.parse(raw)
        const empId = user?.employee_id
        if (!empId) {
            setLoading(false)
            return
        }

        fetch(`${API_URL}/employee/${empId}/assigned-projects`)
            .then(r => r.json())
            .then(result => {
                const nextEvents = result.success ? (result.data || []).filter((event: RawEvent) => roleMatches(event, role)) : []
                setEvents(nextEvents)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [role])

    const items = useMemo(() => groupEvents(events), [events])
    const sections = useMemo(() => splitSections(items), [items])
    const totalScheduled = sections.today.length + sections.upcoming.length + sections.unscheduled.length + sections.past.length

    const renderDetail = (item: ScheduleItem) => (
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Client</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{labelText(item.name)}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Event</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{labelText(item.type)}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Role Work</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{item.task_names.join(', ')}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Assignment</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{item.accepted ? 'Accepted' : 'Pending acceptance'}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Location</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{labelText(item.description, 'Not added')}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Flow</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{labelText(item.flow_stage || item.request_source, 'Event')}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Upload</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{item.upload_links.length ? `${item.upload_links.length} file link available` : 'No upload yet'}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Tracker</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{cleanStatus(item.event_status)}</p>
                </div>
            </div>

            {item.upload_notes_list.length > 0 && (
                <div className="mt-4 rounded-lg border border-gray-100 bg-white p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Upload Notes</p>
                    <p className="mt-1 text-sm text-gray-600">{item.upload_notes_list.join(' | ')}</p>
                </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
                <Link
                    to="/multi-role/time-tracker"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                >
                    <PlayCircle size={14} /> Open Tracker
                </Link>
                {item.upload_links.length > 0 ? (
                    item.upload_links.map(link => (
                        <button
                            key={link}
                            type="button"
                            onClick={() => openUpload(link)}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                            <ExternalLink size={14} /> View Files
                        </button>
                    ))
                ) : (
                    <span className="inline-flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs font-bold text-gray-400">
                        <UploadCloud size={14} /> No upload yet
                    </span>
                )}
            </div>
        </div>
    )

    const renderCard = (item: ScheduleItem) => {
        const key = `${item.lead_code || item.lead_id}-${dateKey(item.deadline)}`
        const selected = selectedKey === key

        return (
            <div key={key} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className={`rounded-md px-2 py-1 text-xs font-bold ${accentBg} ${accentText}`}>
                                {item.lead_code || `LD-${item.lead_id}`}
                            </span>
                            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${priorityStyle(item.priority)}`}>
                                {labelText(item.priority, 'Normal')}
                            </span>
                            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${trackingStyle(item.event_status)}`}>
                                {cleanStatus(item.event_status)}
                            </span>
                        </div>
                        <h3 className="truncate text-base font-bold text-gray-900">{labelText(item.name)}</h3>
                        <p className="mt-1 text-sm text-gray-500">{item.task_names.join(', ')}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSelectedKey(selected ? '' : key)}
                        className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
                    >
                        View Details <ChevronDown size={14} className={selected ? 'rotate-180 transition' : 'transition'} />
                    </button>
                </div>

                <div className="mt-4 grid gap-3 text-xs text-gray-500 md:grid-cols-3">
                    <span className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" /> {formatDateTime(item.deadline)}
                    </span>
                    <span className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" /> {labelText(item.type, 'Event')}
                    </span>
                    <span className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400" /> {labelText(item.description, 'Location not added')}
                    </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${item.upload_links.length ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                        {item.upload_links.length ? <CheckCircle2 size={12} /> : <UploadCloud size={12} />}
                        {item.upload_links.length ? 'Upload available' : 'No upload'}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-400">{formatDateOnly(item.deadline)}</span>
                </div>

                {selected && renderDetail(item)}
            </div>
        )
    }

    const renderSection = (label: string, sectionItems: ScheduleItem[], emptyMessage: string) => (
        <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-800">{label} ({sectionItems.length})</h2>
            </div>
            {sectionItems.length === 0 ? (
                <div className="rounded-xl border border-gray-100 bg-white py-6 text-center text-sm text-gray-400">{emptyMessage}</div>
            ) : (
                <div className="grid gap-4">{sectionItems.map(renderCard)}</div>
            )}
        </section>
    )

    return (
        <div>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                        <Icon size={20} className={accentText} /> {title}
                    </h1>
                    <p className="text-sm text-gray-500">{subtitle}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Schedule Items</p>
                    <p className="mt-1 text-lg font-bold text-gray-900">{totalScheduled}</p>
                </div>
            </div>

            {loading ? (
                <div className="rounded-xl border border-gray-100 bg-white py-10 text-center text-sm text-gray-400">Loading schedule...</div>
            ) : totalScheduled === 0 ? (
                <div className="rounded-xl border border-gray-100 bg-white py-10 text-center text-sm text-gray-400">{emptyText}</div>
            ) : (
                <>
                    {renderSection('Today', sections.today, 'No event work scheduled for today')}
                    {renderSection('Upcoming', sections.upcoming, 'No upcoming scheduled event work')}
                    {sections.unscheduled.length > 0 && renderSection('Needs Schedule', sections.unscheduled, 'No unscheduled work')}
                    {renderSection('Past', sections.past, 'No past event work')}
                </>
            )}
        </div>
    )
}
