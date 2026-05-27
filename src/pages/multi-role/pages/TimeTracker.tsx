import { useEffect, useMemo, useRef, useState } from 'react'
import { Briefcase, CalendarDays, CheckCircle2, Clock, Pause, Play, Search, Square, UploadCloud, User } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

type TrackerMode = 'event' | 'work'

interface AssignedLead {
    lead_employee_id: number
    lead_id: number
    lead_code: string
    project_id?: string
    name: string
    type: string
    task_name: string
    priority: string
    deadline: string
    accepted?: boolean
    status?: string
    mode: TrackerMode
    task_names?: string[]
    all_assignments?: AssignedLead[]
}

interface RuntimeSession {
    id: number
    external_lead_id?: string
    assigned_project_id?: number
    project_id?: string
    employee_id?: string
    project_type?: string
    work_date: string
    status: 'started' | 'paused' | 'ended' | 'not_started' | string
    started_at?: string | null
    paused_at?: string | null
    ended_at?: string | null
    accumulated_seconds: number
    elapsed_seconds: number
    started_by?: string | null
    ended_by?: string | null
}

interface RuntimeState {
    tracker_status: string
    event_status?: string
    work_status?: string
    sessions: RuntimeSession[]
    current_session?: RuntimeSession | null
    total_elapsed_seconds: number
}

interface WorkSummaryRow {
    assigned_project_id: number
    project_id: string
    project_name?: string
    employee_id: string
    employee_name?: string
    project_type: string
    work_date: string
    status: string
    elapsed_seconds: number
}

const EVENT_TASKS = ['photograph', 'videograph', 'drone']
const WORK_TASKS = [
    'save the date',
    'save the date post',
    'save the video',
    'save the date video',
    'retouch',
    'retouching',
    'traditional video editing',
    'retouch editing',
    'album design',
    'candid video editing',
]

const today = () => new Date().toISOString().slice(0, 10)

const normalizeTask = (task?: string) => String(task || '').toLowerCase().trim()

const isEventTask = (task?: string) => {
    const normalized = normalizeTask(task)
    return EVENT_TASKS.some(eventTask => normalized === eventTask || normalized.includes(eventTask))
}

const isWorkTask = (task?: string) => {
    const normalized = normalizeTask(task)
    return WORK_TASKS.some(workTask => normalized === workTask || normalized.includes(workTask))
}

const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600)
    const mins = Math.floor((totalSec % 3600) / 60)
    const secs = totalSec % 60
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const formatDuration = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600)
    const mins = Math.floor((totalSec % 3600) / 60)
    if (hrs === 0 && mins === 0) return `${totalSec % 60}s`
    if (hrs === 0) return `${mins}m`
    return `${hrs}h ${mins}m`
}

const formatDate = (date: string) => {
    if (!date) return 'Unscheduled'
    const parsed = new Date(`${date}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const getCurrentUserName = () => {
    const raw = localStorage.getItem('ra_user')
    if (!raw) return 'Multi-Role Employee'
    try {
        const user = JSON.parse(raw)
        return user?.name || user?.employee_name || 'Multi-Role Employee'
    } catch {
        return 'Multi-Role Employee'
    }
}

const sessionTone = (status?: string) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'ended') return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    if (normalized === 'started') return 'bg-blue-50 text-blue-700 border-blue-100'
    if (normalized === 'paused') return 'bg-amber-50 text-amber-700 border-amber-100'
    return 'bg-slate-50 text-slate-600 border-slate-100'
}

const statusLabel = (status: string, mode: TrackerMode, uploadUnlocked: boolean) => {
    if (mode === 'event' && uploadUnlocked) return 'Event tracking completed'
    if (status === 'started') return mode === 'work' ? 'Work tracking in progress' : 'Date tracking in progress'
    if (status === 'paused') return mode === 'work' ? 'Work tracking paused' : 'Date tracking paused'
    if (status === 'ended') return mode === 'work' ? 'Work date ended' : 'Date tracking ended'
    return mode === 'work' ? 'Work date not started' : 'Date not started'
}

export default function TimeTracker() {
    const [leads, setLeads] = useState<AssignedLead[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedLead, setSelectedLead] = useState<AssignedLead | null>(null)
    const [selectedDate, setSelectedDate] = useState(today())
    const [runtime, setRuntime] = useState<RuntimeState | null>(null)
    const [workSummary, setWorkSummary] = useState<WorkSummaryRow[]>([])
    const [elapsedSeconds, setElapsedSeconds] = useState(0)
    const [, setTotalSeconds] = useState(0)
    const [savingAction, setSavingAction] = useState('')
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const selectedMode = selectedLead?.mode || 'event'
    const isWorkMode = selectedMode === 'work'
    const selectedEventLookup = selectedLead?.lead_code || (selectedLead ? String(selectedLead.lead_id) : '')
    const selectedWorkId = selectedLead?.lead_employee_id
    const selectedLookup = isWorkMode ? String(selectedWorkId || '') : selectedEventLookup

    const selectedSession = useMemo(() => {
        return runtime?.sessions?.find(session => session.work_date === selectedDate) || null
    }, [runtime?.sessions, selectedDate])

    const uploadUnlocked = selectedMode === 'event' && String(runtime?.event_status || runtime?.tracker_status || '').toLowerCase() === 'ended'
    const selectedStatus = String(selectedSession?.status || 'not_started').toLowerCase()
    const canStart = !uploadUnlocked && (!selectedSession || selectedStatus === 'not_started' || selectedStatus === 'ended')
    const canPause = !uploadUnlocked && selectedStatus === 'started'
    const canResume = !uploadUnlocked && selectedStatus === 'paused'
    const canEndDate = !uploadUnlocked && ['started', 'paused'].includes(selectedStatus)
    const hasSessions = Boolean(runtime?.sessions?.length)

    useEffect(() => {
        const rawUser = localStorage.getItem('ra_user')
        if (!rawUser) {
            setLoading(false)
            return
        }

        const user = JSON.parse(rawUser)
        const employeeId = user.employee_id
        if (!employeeId) {
            setLoading(false)
            return
        }

        Promise.all([
            fetch(`${API_URL}/employee/${employeeId}/assigned-projects`).then(r => r.json()).catch(() => ({ success: false, data: [] })),
            fetch(`${API_URL}/employee-projects/employee/${employeeId}`).then(r => r.json()).catch(() => ({ success: false, data: [] })),
        ])
            .then(([legacyResult, projectResult]) => {
                const legacyAssignments: AssignedLead[] = legacyResult.success
                    ? (legacyResult.data || [])
                        .filter((lead: any) => isEventTask(lead.task_name))
                        .map((lead: any) => ({ ...lead, mode: 'event' as TrackerMode }))
                    : []

                const workAssignments: AssignedLead[] = projectResult.success
                    ? (projectResult.data || [])
                        .filter((project: any) => isWorkTask(project.project_type))
                        .map((project: any) => ({
                            lead_employee_id: project.id,
                            lead_id: Number(String(project.project_id || '').replace(/^CRM-/, '').replace(/\D/g, '')) || 0,
                            lead_code: String(project.project_id || '').replace(/^CRM-/, '') || project.project_id,
                            project_id: project.project_id,
                            name: project.project_name,
                            type: 'Post-production',
                            task_name: project.project_type,
                            priority: '',
                            deadline: project.created_at,
                            accepted: String(project.status || '').toLowerCase() !== 'pending',
                            status: project.status,
                            mode: 'work' as TrackerMode,
                        }))
                    : []

                const eventAssignments = legacyAssignments.filter(lead => {
                    const status = String(lead.status || '').toLowerCase()
                    return lead.accepted || ['accepted', 'in progress', 'completed'].includes(status)
                })
                const acceptedWorkAssignments = workAssignments.filter(lead => {
                    const status = String(lead.status || '').toLowerCase()
                    return lead.accepted || ['accepted', 'in progress', 'completed', 'review', 'approved', 'rework'].includes(status)
                })

                setLeads([...acceptedWorkAssignments, ...eventAssignments])
            })
            .catch(err => console.error('Assigned projects fetch error:', err))
            .finally(() => setLoading(false))
    }, [])

    const refetchRuntime = async (lead = selectedLead) => {
        if (!lead) return
        try {
            if (lead.mode === 'work') {
                const res = await axios.get(`${API_URL}/employee-projects/${encodeURIComponent(String(lead.lead_employee_id))}/work-runtime`)
                const data = res.data?.data || null
                setRuntime({
                    tracker_status: data?.work_status || 'not_started',
                    work_status: data?.work_status || 'not_started',
                    sessions: data?.sessions || [],
                    current_session: data?.current_session || null,
                    total_elapsed_seconds: Number(data?.total_elapsed_seconds || 0),
                })

                const projectId = lead.project_id || `CRM-${lead.lead_code}`
                const summaryRes = await axios.get(`${API_URL}/employee-projects/project/${encodeURIComponent(projectId)}/work-runtime-summary`)
                setWorkSummary(summaryRes.data?.data || [])
                return
            }

            const lookup = lead.lead_code || String(lead.lead_id)
            const res = await axios.get(`${API_URL}/event-coordinator/event/${encodeURIComponent(lookup)}/status`)
            const data = res.data?.data || null
            setRuntime({
                tracker_status: data?.event_status || 'not_started',
                event_status: data?.event_status || 'not_started',
                sessions: data?.sessions || [],
                current_session: data?.current_session || null,
                total_elapsed_seconds: Number(data?.total_elapsed_seconds || 0),
            })
            setWorkSummary([])
        } catch (err) {
            console.error('Runtime fetch failed', err)
            setRuntime({ tracker_status: 'not_started', sessions: [], total_elapsed_seconds: 0 })
            if (lead.mode === 'work') setWorkSummary([])
        }
    }

    useEffect(() => {
        if (!selectedLead || !selectedLookup) return
        refetchRuntime(selectedLead)
    }, [selectedLookup, selectedLead?.mode])

    useEffect(() => {
        const baseSessionSeconds = Number(selectedSession?.elapsed_seconds || 0)
        const baseTotalSeconds = Number(runtime?.total_elapsed_seconds || 0)
        setElapsedSeconds(baseSessionSeconds)
        setTotalSeconds(baseTotalSeconds)

        if (timerRef.current) clearInterval(timerRef.current)
        if (selectedStatus === 'started' && selectedSession?.started_at) {
            const startedAtMs = new Date(selectedSession.started_at).getTime()
            const baseAccumulated = Number(selectedSession.accumulated_seconds || 0)
            const baseOtherSessions = baseTotalSeconds - baseSessionSeconds
            const tick = () => {
                const currentSessionSeconds = baseAccumulated + Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000))
                setElapsedSeconds(currentSessionSeconds)
                setTotalSeconds(baseOtherSessions + currentSessionSeconds)
            }
            tick()
            timerRef.current = setInterval(tick, 1000)
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [selectedSession?.id, selectedSession?.started_at, selectedSession?.elapsed_seconds, selectedSession?.accumulated_seconds, selectedStatus, runtime?.total_elapsed_seconds])

    const runAction = async (action: 'start' | 'pause' | 'end-date' | 'complete') => {
        if (!selectedLead || savingAction) return
        const actionLabel = action
        setSavingAction(actionLabel)
        try {
            const endpointAction = action === 'end-date' || action === 'complete' ? 'end' : action
            if (selectedLead.mode === 'work') {
                await axios.patch(`${API_URL}/employee-projects/${encodeURIComponent(String(selectedLead.lead_employee_id))}/work-runtime/${endpointAction}`, {
                    work_date: selectedDate,
                    started_by: getCurrentUserName(),
                    ended_by: getCurrentUserName(),
                })
            } else {
                const lookup = selectedLead.lead_code || String(selectedLead.lead_id)
                await axios.patch(`${API_URL}/event-coordinator/event/${encodeURIComponent(lookup)}/${endpointAction}`, {
                    work_date: selectedDate,
                    started_by: getCurrentUserName(),
                    paused_by: getCurrentUserName(),
                    ended_by: getCurrentUserName(),
                    role: selectedLead.task_names?.join(', ') || selectedLead.task_name,
                    complete_event: action === 'complete',
                })
            }
            await refetchRuntime(selectedLead)
        } catch (err: any) {
            console.error('Tracker action failed:', err)
            alert(err.response?.data?.message || `Failed to update ${isWorkMode ? 'work' : 'event'} tracker`)
        } finally {
            setSavingAction('')
        }
    }

    const filteredLeadsFlat = leads.filter(lead => {
        const q = searchQuery.toLowerCase()
        return lead.name?.toLowerCase().includes(q)
            || lead.lead_code?.toLowerCase().includes(q)
            || lead.type?.toLowerCase().includes(q)
            || lead.task_name?.toLowerCase().includes(q)
    })

    const groupedLeads = Object.values(filteredLeadsFlat.reduce((acc, curr) => {
        const projectKey = curr.lead_code || String(curr.lead_id)
        const key = `${curr.mode}-${projectKey}`

        if (!acc[key]) {
            acc[key] = {
                ...curr,
                task_names: [curr.task_name],
                all_assignments: [curr]
            }
        } else {
            const taskNames = acc[key].task_names || []
            if (!taskNames.includes(curr.task_name)) {
                acc[key].task_names = [...taskNames, curr.task_name]
            }
            if (!acc[key].all_assignments!.find(a => a.lead_employee_id === curr.lead_employee_id)) {
                acc[key].all_assignments!.push(curr)
            }
        }
        return acc
    }, {} as Record<string, AssignedLead>))

    const knownDates = Array.from(new Set([
        selectedDate,
        ...(runtime?.sessions || []).map(session => session.work_date),
    ])).sort()

    const defaultMode = leads.some(lead => lead.mode === 'work') && !leads.some(lead => lead.mode === 'event') ? 'work' : 'event'
    const emptyTitle = defaultMode === 'work' ? 'Work Time Tracking' : 'Event Time Tracker'
    const emptyCopy = defaultMode === 'work'
        ? 'No editor assignment selected.'
        : 'No event assignment selected.'

    const badgeText = selectedMode === 'work'
        ? selectedStatus === 'started' ? 'Work Active' : 'Work Tracking'
        : uploadUnlocked ? 'Upload Unlocked' : 'Tracking Active'
    const badgeTone = selectedMode === 'work'
        ? 'border-indigo-100 bg-indigo-50 text-indigo-700'
        : uploadUnlocked ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-blue-100 bg-blue-50 text-blue-700'

    const selectedGroup = useMemo(() => {
        return groupedLeads.find(group => group.all_assignments?.some(a => a.lead_employee_id === selectedLead?.lead_employee_id && a.mode === selectedLead?.mode))
    }, [groupedLeads, selectedLead])

    return (
        <div className="flex min-h-[calc(100vh-140px)] gap-6">
            <div className="flex w-80 flex-col rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-4">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                        <User size={16} className="text-blue-600" /> Assigned Projects
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={event => setSearchQuery(event.target.value)}
                            className="w-full rounded-lg border border-gray-100 bg-gray-50 py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-100"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <p className="py-4 text-center text-xs text-gray-400">Loading...</p>
                    ) : groupedLeads.length === 0 ? (
                        <p className="py-4 text-center text-xs text-gray-400">No accepted assignments</p>
                    ) : (
                        <div className="space-y-1">
                            {groupedLeads.map((lead: AssignedLead) => {
                                const isSelectedGroup = lead.all_assignments?.some(a => a.lead_employee_id === selectedLead?.lead_employee_id && a.mode === selectedLead?.mode) || false
                                return (
                                <button
                                    key={`${lead.mode}-${lead.lead_code || lead.lead_id}`}
                                    onClick={() => {
                                        if (timerRef.current) clearInterval(timerRef.current)
                                        const firstAssignment = lead.all_assignments?.[0] || lead
                                        setSelectedLead(firstAssignment)
                                        setSelectedDate(today())
                                        setRuntime(null)
                                        setWorkSummary([])
                                        setElapsedSeconds(0)
                                        setTotalSeconds(0)
                                        refetchRuntime(firstAssignment)
                                    }}
                                    className={`w-full rounded-lg border p-3 text-left transition-all ${isSelectedGroup
                                        ? 'border-blue-200 bg-blue-50 shadow-sm'
                                        : 'border-transparent bg-white hover:border-gray-100 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="mb-1 flex items-start justify-between">
                                        <p className="truncate pr-2 text-sm font-bold text-gray-900">{lead.name}</p>
                                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                                            {lead.lead_code || lead.lead_id}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-xs text-gray-500">{lead.task_names?.join(', ') || lead.task_name}</p>
                                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${lead.mode === 'work' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {lead.mode === 'work' ? 'Work' : 'Event'}
                                        </span>
                                    </div>
                                </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1">
                {!selectedLead ? (
                    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-10 text-center shadow-sm">
                        <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${defaultMode === 'work' ? 'bg-indigo-50 text-indigo-500' : 'bg-blue-50 text-blue-500'}`}>
                            {defaultMode === 'work' ? <Briefcase size={32} /> : <Clock size={32} />}
                        </div>
                        <h2 className="mb-2 text-lg font-bold text-gray-900">{emptyTitle}</h2>
                        <p className="max-w-sm text-sm text-gray-500">{emptyCopy}</p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="mb-6 border-b border-gray-100 pb-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h2 className="mb-1 text-xl font-bold text-gray-900">{selectedLead.name}</h2>
                                    <p className="text-sm font-medium text-gray-500">
                                        {selectedLead.lead_code || `LD-${selectedLead.lead_id}`} - {selectedLead.type}
                                    </p>
                                </div>
                                <div className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeTone}`}>
                                    {badgeText}
                                </div>
                            </div>
                            {selectedGroup?.all_assignments && selectedGroup.all_assignments.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {selectedGroup.all_assignments.map((assignment: AssignedLead) => (
                                        <button
                                            key={assignment.lead_employee_id}
                                            onClick={() => {
                                                if (timerRef.current) clearInterval(timerRef.current)
                                                setSelectedLead(assignment)
                                                setSelectedDate(today())
                                                setRuntime(null)
                                                setWorkSummary([])
                                                setElapsedSeconds(0)
                                                setTotalSeconds(0)
                                                refetchRuntime(assignment)
                                            }}
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                                selectedLead.lead_employee_id === assignment.lead_employee_id
                                                    ? (selectedMode === 'work' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-blue-600 text-white border-blue-600 shadow-sm')
                                                    : (selectedMode === 'work' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100')
                                            }`}
                                        >
                                            {assignment.task_name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
                            <div className="space-y-5">
                                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                    <div className="flex flex-wrap items-end gap-3">
                                        <div>
                                            <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Tracking date</label>
                                            <input
                                                type="date"
                                                value={selectedDate}
                                                disabled={uploadUnlocked}
                                                onChange={event => setSelectedDate(event.target.value || today())}
                                                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {knownDates.map(date => (
                                                <button
                                                    key={date}
                                                    type="button"
                                                    onClick={() => setSelectedDate(date)}
                                                    className={`rounded-full border px-3 py-1.5 text-xs font-bold ${date === selectedDate ? 'border-blue-200 bg-blue-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100'}`}
                                                >
                                                    {formatDate(date)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className={`rounded-3xl border p-8 text-center transition-all ${uploadUnlocked ? 'border-emerald-200 bg-emerald-50' : selectedStatus === 'started' ? 'border-blue-200 bg-blue-50 shadow-sm' : selectedStatus === 'paused' ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
                                    <div className="mb-4 flex items-center justify-center gap-2">
                                        <Clock size={20} className={uploadUnlocked ? 'text-emerald-600' : selectedStatus === 'started' ? 'text-blue-600' : selectedStatus === 'paused' ? 'text-amber-600' : 'text-gray-400'} />
                                        <span className={`text-sm font-bold uppercase ${uploadUnlocked ? 'text-emerald-700' : selectedStatus === 'started' ? 'text-blue-700' : selectedStatus === 'paused' ? 'text-amber-700' : 'text-gray-500'}`}>
                                            {statusLabel(selectedStatus, selectedMode, uploadUnlocked)}
                                        </span>
                                        {selectedStatus === 'started' && !uploadUnlocked && (
                                            <span className="relative ml-2 flex h-3 w-3">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                                                <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
                                            </span>
                                        )}
                                    </div>
                                    <p className={`font-mono text-7xl font-bold tracking-widest ${uploadUnlocked ? 'text-emerald-700' : selectedStatus === 'started' ? 'text-blue-700' : selectedStatus === 'paused' ? 'text-amber-700' : selectedStatus === 'ended' ? 'text-gray-700' : 'text-gray-300'}`}>
                                        {formatTimer(elapsedSeconds)}
                                    </p>
                                    <p className="mt-4 text-sm font-medium text-gray-500">
                                        {formatDate(selectedDate)} session
                                    </p>
                                </div>

                                <div className="flex flex-wrap justify-center gap-3">
                                    {canStart && (
                                        <button onClick={() => runAction('start')} disabled={Boolean(savingAction)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60">
                                            <Play size={18} /> {savingAction === 'start' ? 'Starting...' : `Start ${isWorkMode ? 'Work' : 'Date'} Tracking`}
                                        </button>
                                    )}
                                    {canPause && (
                                        <button onClick={() => runAction('pause')} disabled={Boolean(savingAction)} className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-60">
                                            <Pause size={18} /> {savingAction === 'pause' ? 'Pausing...' : 'Pause Tracking'}
                                        </button>
                                    )}
                                    {canResume && (
                                        <button onClick={() => runAction('start')} disabled={Boolean(savingAction)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60">
                                            <Play size={18} /> {savingAction === 'start' ? 'Resuming...' : 'Resume Tracking'}
                                        </button>
                                    )}
                                    {canEndDate && (
                                        <button onClick={() => runAction('end-date')} disabled={Boolean(savingAction)} className="flex items-center gap-2 rounded-xl bg-slate-700 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60">
                                            <Square size={18} /> {savingAction === 'end-date' ? 'Ending...' : `End ${isWorkMode ? 'Work Date' : 'Date'} Tracking`}
                                        </button>
                                    )}
                                    {!isWorkMode && !uploadUnlocked && hasSessions && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('End the complete event tracker and unlock upload for this client?')) runAction('complete')
                                            }}
                                            disabled={Boolean(savingAction)}
                                            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                                        >
                                            <CheckCircle2 size={18} /> {savingAction === 'complete' ? 'Completing...' : 'End Event Tracking'}
                                        </button>
                                    )}
                                </div>

                                {uploadUnlocked && (
                                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                                        <div className="flex items-center gap-2">
                                            <UploadCloud size={18} />
                                            Upload is now enabled for photographer, videographer, and drone raw data.
                                        </div>
                                    </div>
                                )}
                            </div>

                            <aside className="space-y-4">
                                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">{isWorkMode ? 'Work Sessions' : 'Date Sessions'}</h3>
                                            <p className="text-xs text-gray-500">
                                                {isWorkMode ? 'Track this editor role date-wise.' : 'Track reception, wedding and extra event days separately.'}
                                            </p>
                                        </div>
                                        <CalendarDays size={18} className="text-gray-400" />
                                    </div>
                                    <div className="space-y-3">
                                        {(runtime?.sessions || []).length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center text-sm text-gray-400">
                                                No dates tracked yet.
                                            </div>
                                        ) : (
                                            runtime?.sessions.map(session => (
                                                <button
                                                    key={session.id}
                                                    type="button"
                                                    onClick={() => setSelectedDate(session.work_date)}
                                                    className={`w-full rounded-xl border p-3 text-left transition ${session.work_date === selectedDate ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                                                >
                                                    <div className="mb-2 flex items-center justify-between gap-3">
                                                        <span className="text-sm font-bold text-gray-900">{formatDate(session.work_date)}</span>
                                                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${sessionTone(session.status)}`}>
                                                            {String(session.status).replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-semibold text-gray-500">{formatTimer(Number(session.elapsed_seconds || 0))} - {formatDuration(Number(session.elapsed_seconds || 0))}</p>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {isWorkMode && (
                                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                        <h3 className="mb-1 text-sm font-bold text-gray-900">Role-wise Summary</h3>
                                        <p className="mb-4 text-xs text-gray-500">Totals for editor work on this client.</p>
                                        <div className="space-y-3">
                                            {workSummary.length === 0 ? (
                                                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center text-sm text-gray-400">
                                                    No role time recorded yet.
                                                </div>
                                            ) : (
                                                workSummary.map(row => (
                                                    <div key={`${row.assigned_project_id}-${row.work_date}-${row.status}`} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                                        <div className="mb-1 flex items-center justify-between gap-2">
                                                            <span className="truncate text-sm font-bold text-gray-900">{row.project_type}</span>
                                                            <span className="shrink-0 text-xs font-bold text-indigo-600">{formatDuration(Number(row.elapsed_seconds || 0))}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                                                            <span>{formatDate(row.work_date)}</span>
                                                            <span className="capitalize">{String(row.status || '').replace(/_/g, ' ')}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </aside>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
