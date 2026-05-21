import { useState, useEffect } from 'react'
import { Download, Eye, ChevronDown, X } from 'lucide-react'
import axios from 'axios'

type ClientData = {
    name: string
    event: string
    eventDate: string
    completedStages: string[]
}

type View = 'list' | 'detail'

const workflowStages = [
    'Team Assigned',
    'Outdoor Shoot Tracking',
    'Shoot Completed',
    'Photographer Upload',
    'Videographer Upload',
    'Data Manager Verification',
    'Assigned to CRM',
    'CRM Verified',
    'Pre-production CRM Deliverables',
]





const timelineSteps = [
    { step: 1, label: 'Team Assigned', desc: 'Photographer and videographer assigned for the shoot', status: 'waiting' },
    { step: 2, label: 'Outdoor Shoot Tracking', desc: 'Outdoor shoot schedule confirmed and team dispatched', status: 'waiting' },
    { step: 3, label: 'Shoot Completed', desc: 'Outdoor shoot completed by assigned team', status: 'waiting' },
    { step: 4, label: 'Photographer Upload', desc: 'Raw images uploaded by photographer', status: 'waiting' },
    { step: 5, label: 'Videographer Upload', desc: 'Raw videos uploaded by videographer', status: 'waiting' },
    { step: 6, label: 'Data Manager Verification', desc: 'Raw images and videos verified by data manager', status: 'waiting' },
    { step: 7, label: 'Assigned to CRM', desc: 'Raw data assigned to CRM for editing & quality check', status: 'waiting' },
    { step: 8, label: 'CRM Verified', desc: 'CRM team verifies edited content for quality and completeness', status: 'waiting' },
    { step: 9, label: 'Pre-production CRM Deliverables', desc: 'CRM prepares and delivers pre-production assets to the client', status: 'waiting' },
]

const stepStyle = {
    done: { bg: '#22c55e', text: '#fff' },
    pending: { bg: '#fb923c', text: '#fff' },
    waiting: { bg: '#e5e7eb', text: '#9ca3af' },
}

const stepBadge = {
    done: { bg: '#dcfce7', color: '#16a34a', label: 'Completed' },
    pending: { bg: '#ffedd5', color: '#ea580c', label: 'On-going' },
    waiting: { bg: '#f3f4f6', color: '#6b7280', label: 'Pending' },
}

const EVENT_TYPES = ['All', 'Wedding', 'Pre-Wedding', 'Birthday', 'Corporate Shoot']
const STAGE_FILTERS = ['All', ...workflowStages]

// Employee details for each stage
const stageEmployees: Record<string, { name: string; role: string; date: string; notes: string }[]> = {
    'Team Assigned': [
        { name: 'Rahul Kumar', role: 'Photographer', date: '15-02-2026', notes: 'Lead photographer assigned' },
        { name: 'Vikram Sinha', role: 'Videographer', date: '15-02-2026', notes: 'Main videographer for the event' },
        { name: 'Priya Desai', role: 'Assistant', date: '15-02-2026', notes: 'Assisting with lighting and setup' },
    ],
    'Outdoor Shoot Tracking': [
        { name: 'Rahul Kumar', role: 'Photographer', date: '16-02-2026', notes: 'Outdoor shoot at venue confirmed' },
        { name: 'Vikram Sinha', role: 'Videographer', date: '16-02-2026', notes: 'Drone footage planned for outdoor shots' },
    ],
    'Shoot Completed': [
        { name: 'Rahul Kumar', role: 'Photographer', date: '17-02-2026', notes: 'Captured 500+ photos at venue' },
        { name: 'Vikram Sinha', role: 'Videographer', date: '17-02-2026', notes: 'Recorded 4 hours of footage' },
        { name: 'Priya Desai', role: 'Assistant', date: '17-02-2026', notes: 'Managed equipment and lighting' },
    ],
    'Photographer Upload': [
        { name: 'Rahul Kumar', role: 'Photographer', date: '18-02-2026', notes: 'Uploaded 500 raw images to server' },
    ],
    'Videographer Upload': [
        { name: 'Vikram Sinha', role: 'Videographer', date: '19-02-2026', notes: 'Uploaded 4 hours of raw footage' },
    ],
    'Data Manager Verification': [
        { name: 'Arjun Nair', role: 'Data Manager', date: '20-02-2026', notes: 'Verified file integrity and formats' },
    ],
    'Assigned to CRM': [
        { name: 'Sneha Mehta', role: 'CRM Manager', date: '21-02-2026', notes: 'Data assigned for editing and QC' },
    ],
    'CRM Verified': [
        { name: 'Sneha Mehta', role: 'CRM Manager', date: '23-02-2026', notes: 'Quality check completed, all assets approved' },
        { name: 'Kavitha Rao', role: 'Editor', date: '22-02-2026', notes: 'Color correction and retouching done' },
    ],
    'Pre-production CRM Deliverables': [
        { name: 'Sneha Mehta', role: 'CRM Manager', date: '25-02-2026', notes: 'Final deliverables sent to client' },
    ],
}

const deliverableEmployees: Record<
    string,
    { name: string; role: string; status: string }[]
> = {
    'Save the Date Post': [
        { name: 'Kavitha Rao', role: 'Designer', status: 'Designing post layout' },
        { name: 'Arjun Nair', role: 'Editor', status: 'Color correction' },
    ],

    'Save the Date Video': [
        { name: 'Vikram Sinha', role: 'Video Editor', status: 'Editing highlight clips' },
        { name: 'Sneha Mehta', role: 'CRM Manager', status: 'Reviewing draft video' },
    ],

    'Candid': [
        { name: 'Rahul Kumar', role: 'Photographer', status: 'Selecting best candid shots' },
        { name: 'Priya Desai', role: 'Assistant', status: 'Organizing image files' },
    ],

    'Retouch': [
        { name: 'Kavitha Rao', role: 'Photo Editor', status: 'Skin retouching and color grading' },
    ],
}

function FilterDropdown({
    label,
    options,
    value,
    onChange,
}: {
    label: string
    options: string[]
    value: string
    onChange: (v: string) => void
}) {
    const [open, setOpen] = useState(false)
    const isFiltered = value !== 'All'

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{
                    background: isFiltered ? '#ede9fe' : '#f3f4f6',
                    color: isFiltered ? '#5B5FC7' : '#6B7280',
                    border: isFiltered ? '1px solid #c4b5fd' : '1px solid #e5e7eb',
                }}
            >
                {isFiltered ? value : label}
                {isFiltered ? (
                    <X
                        size={11}
                        onClick={e => { e.stopPropagation(); onChange('All'); setOpen(false) }}
                        className="cursor-pointer hover:text-red-500"
                    />
                ) : (
                    <ChevronDown size={11} />
                )}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div
                        className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden shadow-lg"
                        style={{ background: '#fff', border: '1px solid #e5e7eb', minWidth: '180px', maxHeight: '250px', overflowY: 'auto' }}
                    >
                        {options.map(opt => (
                            <button
                                key={opt}
                                onClick={() => { onChange(opt); setOpen(false) }}
                                className="flex items-center w-full px-4 py-2.5 text-xs font-medium text-left transition-colors hover:bg-purple-50"
                                style={{ color: opt === value ? '#5B5FC7' : '#374151', fontWeight: opt === value ? 700 : 500 }}
                            >
                                {opt === value && <span className="mr-2 text-purple-600">✓</span>}
                                {opt}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default function ClientTracker() {
    const [view, setView] = useState<View>('list')
    const [selectedClient, setSelectedClient] = useState<ClientData | null>(null)
    const [clientSearch, setClientSearch] = useState('')
    const [eventFilter, setEventFilter] = useState('All')
    const [stageFilter, setStageFilter] = useState('All')
    const [expandedStep, setExpandedStep] = useState<number | null>(null)
    const [clientTracking, setClientTracking] = useState<ClientData[]>([])
    const [loading, setLoading] = useState(true)
    const [deliverablePopup, setDeliverablePopup] = useState<string | null>(null)

    const clientFiltered = clientTracking.filter(c => {
        const matchSearch = c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
            c.event.toLowerCase().includes(clientSearch.toLowerCase())
        const matchEvent = eventFilter === 'All' || c.event === eventFilter
        const matchStage = stageFilter === 'All' || c.completedStages.includes(stageFilter)
        return matchSearch && matchEvent && matchStage
    })

    const hasClientFilters = eventFilter !== 'All' || stageFilter !== 'All'


    useEffect(() => {

        const fetchTrackingData = async () => {

            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/work-tracking`
                )

                const formatted = (res.data.data || []).map((item: any) => ({
                    name: item.client_name,
                    event: item.event_type,
                    eventDate: item.event_date,
                    completedStages: item.completed_stages || []
                }))

                setClientTracking(formatted)
            } catch (error) {
                console.error("Work tracking fetch failed, falling back to mock data", error)
                // Fallback mock data when API is unavailable
                setClientTracking([
                    { name: 'Sarah Chen', event: 'Wedding', eventDate: '15-02-2026', completedStages: ['Team Assigned', 'Outdoor Shoot Tracking', 'Shoot Completed', 'Photographer Upload', 'Videographer Upload'] },
                    { name: 'Michael Smith', event: 'Pre-Wedding', eventDate: '28-02-2026', completedStages: ['Team Assigned', 'Outdoor Shoot Tracking', 'Shoot Completed', 'Photographer Upload', 'Videographer Upload', 'Data Manager Verification', 'Assigned to CRM', 'CRM Verified'] },
                    { name: 'Emily Davis', event: 'Birthday', eventDate: '10-04-2026', completedStages: ['Team Assigned'] },
                    { name: 'James Wilson', event: 'Corporate Shoot', eventDate: '05-03-2026', completedStages: workflowStages }
                ])
            } finally {
                setLoading(false)

            }

        }

        fetchTrackingData()

    }, [])

    // Detail view â€” 9-step timeline for selected client
    if (view === 'detail' && selectedClient) {
        const completedStages = selectedClient.completedStages
        const completedCount = workflowStages.filter(s => completedStages.includes(s)).length
        const progressPct = Math.round((completedCount / workflowStages.length) * 100)




        if (loading) {
            return (
                <div className="p-10 text-gray-500">
                    Loading work tracking...
                </div>
            )
        }


        return (
            <div>
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Client Tracking</h1>
                        <p className="text-sm" style={{ color: '#6B7280' }}>Track your project workflow progress</p>
                    </div>
                    <button
                        onClick={() => { setView('list'); setSelectedClient(null); setExpandedStep(null) }}
                        className="crm-card flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all hover:shadow-md"
                        style={{ color: '#5B5FC7' }}
                    >
                        ← Back to list
                    </button>
                </div>

                {/* Active Client Banner */}
                <div className="rounded-2xl p-5 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
                    <div className="font-bold text-base mb-1">{selectedClient.name}</div>
                    <div className="flex items-center gap-3 text-sm" style={{ opacity: 0.9 }}>
                        <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.2)' }}>{selectedClient.event}</span>
                        <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.2)' }}>📅 {selectedClient.eventDate}</span>
                    </div>
                </div>

                {/* Timeline */}
                <div className="crm-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold" style={{ color: '#111827' }}>Work Status</p>
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-2 rounded-full" style={{ background: '#F3F4F6' }}>
                                <div className="h-2 rounded-full" style={{ background: '#22c55e', width: `${progressPct}%` }} />
                            </div>
                            <span className="text-xs" style={{ color: '#6B7280' }}>{completedCount}/{workflowStages.length}</span>
                        </div>
                    </div>
                    <div>
                        {timelineSteps.map((s, i) => {
                            const isDone = completedStages.includes(s.label)
                            const stepStatus = isDone ? 'done' : 'waiting'
                            const isExpanded = expandedStep === i
                            const employees = stageEmployees[s.label] || []
                            return (
                                <div key={i} className="flex gap-4 mb-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                            style={{ background: stepStyle[stepStatus].bg, color: stepStyle[stepStatus].text }}>
                                            {isDone ? '✓' : s.step}
                                        </div>
                                        {i < timelineSteps.length - 1 && <div className="w-0.5 mt-1" style={{ background: '#E5E7EB', minHeight: isExpanded ? '100%' : '24px' }} />}
                                    </div>
                                    <div className="flex-1">
                                        <div
                                            className="crm-card p-3 cursor-pointer transition-all hover:shadow-md"
                                            style={{ border: isExpanded ? '1px solid #c4b5fd' : undefined }}
                                            onClick={() => setExpandedStep(isExpanded ? null : i)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs" style={{ color: '#9CA3AF' }}>Step {s.step}</span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full"
                                                        style={{ background: stepBadge[stepStatus].bg, color: stepBadge[stepStatus].color }}>
                                                        {stepBadge[stepStatus].label}
                                                    </span>
                                                </div>
                                                <ChevronDown
                                                    size={14}
                                                    style={{
                                                        color: '#9CA3AF',
                                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                        transition: 'transform 0.2s',
                                                    }}
                                                />
                                            </div>
                                            <p className="text-sm font-medium" style={{ color: '#111827' }}>{s.label}</p>
                                            <p className="text-xs" style={{ color: '#6B7280' }}>{s.desc}</p>
                                        </div>

                                        {/* Expanded details */}
                                        {isExpanded && (
                                            <div className="mt-2 rounded-xl p-4" style={{ background: '#F9F8FF', border: '1px solid #EDE9FE' }}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-xs font-bold" style={{ color: '#5B5FC7' }}>👥 Employees involved</span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#ede9fe', color: '#5B5FC7' }}>
                                                        {employees.length} {employees.length === 1 ? 'person' : 'people'}
                                                    </span>
                                                </div>
                                                {employees.length === 0 ? (
                                                    <p className="text-xs" style={{ color: '#9CA3AF' }}>No employee data available for this stage</p>
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        {employees.map((emp, ei) => (
                                                            <div key={ei} className="flex items-start gap-3 rounded-lg p-2.5" style={{ background: '#fff', border: '1px solid #f3f4f6' }}>
                                                                <div
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                                                                    style={{ background: 'linear-gradient(135deg, #a78bfa, #5B5FC7)' }}
                                                                >
                                                                    {emp.name.charAt(0)}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-medium" style={{ color: '#111827' }}>{emp.name}</span>
                                                                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#f3f4f6', color: '#6B7280' }}>{emp.role}</span>
                                                                    </div>
                                                                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{emp.notes}</p>
                                                                    <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>📅 {emp.date}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Horizontal Deliverables Tracker */}
                <div className="crm-card p-5 mt-4">
                    <p className="text-sm font-semibold mb-5" style={{ color: '#111827' }}>Deliverables Tracker</p>
                    <div className="flex items-center justify-between">
                        {['Save the Date Post', 'Save the Date Video', 'Candid', 'Retouch'].map((step, i, arr) => {
                            const doneCount = completedStages.length >= 9 ? 4
                                : completedStages.length >= 7 ? 3
                                    : completedStages.length >= 5 ? 2
                                        : completedStages.length >= 2 ? 1 : 0
                            const isDone = i < doneCount
                            const isCurrent = i === doneCount
                            return (
                                <div key={i} className="flex items-center flex-1">
                                    <div
                                        className="flex flex-col items-center cursor-pointer"
                                        style={{ minWidth: 80 }}
                                        onClick={() => setDeliverablePopup(deliverablePopup === step ? null : step)}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-all hover:scale-110"
                                            style={{
                                                background: isDone ? '#22c55e' : isCurrent ? '#5B5FC7' : '#e5e7eb',
                                                color: isDone || isCurrent ? '#fff' : '#9ca3af',
                                                boxShadow: deliverablePopup === step ? '0 0 0 4px rgba(91,95,199,0.3)' : isCurrent ? '0 0 0 4px rgba(91,95,199,0.2)' : 'none',
                                            }}
                                        >
                                            {isDone ? '✓' : i + 1}
                                        </div>
                                        <span className="text-xs text-center font-medium" style={{
                                            color: isDone ? '#16a34a' : isCurrent ? '#5B5FC7' : '#9CA3AF',
                                        }}>
                                            {step}
                                        </span>
                                        <span className="text-xs mt-0.5" style={{ color: '#d1d5db' }}>
                                            {isDone ? 'Done' : isCurrent ? 'In Progress' : 'Pending'}
                                        </span>
                                    </div>
                                    {i < arr.length - 1 && (
                                        <div className="flex-1 h-0.5 mx-1 rounded-full" style={{
                                            background: isDone ? '#22c55e' : '#e5e7eb',
                                            marginBottom: 32,
                                        }} />
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Deliverable Employee Details â€” inline below steps */}
                    {deliverablePopup && (
                        <div className="mt-5 rounded-xl p-4" style={{ background: '#F9F8FF', border: '1px solid #EDE9FE' }}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold" style={{ color: '#5B5FC7' }}>{deliverablePopup}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#ede9fe', color: '#5B5FC7' }}>
                                        {(deliverableEmployees[deliverablePopup] || []).length} people
                                    </span>
                                </div>
                                <button onClick={() => setDeliverablePopup(null)} className="hover:bg-gray-100 rounded-full p-1 transition-colors" style={{ color: '#9CA3AF' }}><X size={14} /></button>
                            </div>
                            <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Employees working on this deliverable:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(deliverableEmployees[deliverablePopup] || []).map((emp, ei) => (
                                    <div key={ei} className="flex items-center gap-3 rounded-lg p-3" style={{ background: '#fff', border: '1px solid #f3f4f6' }}>
                                        <div
                                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                                            style={{ background: 'linear-gradient(135deg, #a78bfa, #5B5FC7)' }}
                                        >
                                            {emp.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium" style={{ color: '#111827' }}>{emp.name}</span>
                                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#f3f4f6', color: '#6B7280' }}>{emp.role}</span>
                                            </div>
                                            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{emp.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end mt-4">
                    <button onClick={() => { setView('list'); setSelectedClient(null) }} className="crm-card px-5 py-2 text-sm" style={{ color: '#374151' }}>â† Back</button>
                </div>
            </div >
        )
    }

    return (
        <div>
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Client Tracking</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Monitor client project progress and workflow stages</p>
                </div>
                <button className="crm-card flex items-center gap-2 px-4 py-2 text-sm" style={{ color: '#6B7280' }}>
                    <Download size={14} /> Download report
                </button>
            </div>

            {/* Search + Filters */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 flex-1"
                    style={{ background: '#F0EFFE', border: '1px solid #E0DFFE' }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2}>
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by client name or event..."
                        value={clientSearch}
                        onChange={e => setClientSearch(e.target.value)}
                        className="bg-transparent outline-none text-sm flex-1"
                        style={{ color: '#374151' }}
                    />
                    {clientSearch && (
                        <button onClick={() => setClientSearch('')} style={{ color: '#9CA3AF' }}><X size={13} /></button>
                    )}
                </div>
                <FilterDropdown label="Event Type" options={EVENT_TYPES} value={eventFilter} onChange={setEventFilter} />
                <FilterDropdown label="Stage" options={STAGE_FILTERS} value={stageFilter} onChange={setStageFilter} />
                {hasClientFilters && (
                    <button
                        onClick={() => { setEventFilter('All'); setStageFilter('All') }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
                        style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}
                    >
                        <X size={11} /> Clear
                    </button>
                )}
            </div>

            {/* Client Tracking Table */}
            <div className="crm-table-wrap">
                <table className="w-full">
                    <thead>
                        <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                            <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#5B5FC7' }}>Client name</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#5B5FC7' }}>Event type</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#5B5FC7' }}>Current stage</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#5B5FC7' }}>Stages</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#5B5FC7' }}>Event date</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#5B5FC7' }}>Status</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#5B5FC7' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientFiltered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center px-5 py-10 text-sm" style={{ color: '#9CA3AF' }}>
                                    <div className="flex flex-col items-center gap-2">
                                        <span>No clients match the current filters</span>
                                        {hasClientFilters && (
                                            <button
                                                onClick={() => { setEventFilter('All'); setStageFilter('All'); setClientSearch('') }}
                                                className="text-xs underline mt-1"
                                                style={{ color: '#5B5FC7' }}
                                            >
                                                Clear all filters
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : clientFiltered.map((client, idx) => {
                            const completedSteps = workflowStages.filter(s => client.completedStages.includes(s)).length
                            const progressPct = Math.round((completedSteps / workflowStages.length) * 100)
                            const currentStage = client.completedStages[client.completedStages.length - 1] ?? 'Not started'
                            return (
                                <tr key={idx} style={{ borderTop: '1px solid #F3F4F6' }}>
                                    {/* Client name */}
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                                                style={{ background: 'linear-gradient(135deg, #a78bfa, #5B5FC7)' }}
                                            >
                                                {client.name.charAt(0)}
                                            </div>
                                            <span className="text-sm font-medium" style={{ color: '#111827' }}>{client.name}</span>
                                        </div>
                                    </td>
                                    {/* Event type */}
                                    <td className="px-5 py-3 text-sm" style={{ color: '#6B7280' }}>{client.event}</td>
                                    {/* Current stage */}
                                    <td className="px-5 py-3">
                                        <span
                                            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                                            style={{ background: '#ede9fe', color: '#5B5FC7' }}
                                        >
                                            {currentStage}
                                        </span>
                                    </td>
                                    {/* Stages count */}
                                    <td className="px-5 py-3 text-sm" style={{ color: '#6B7280' }}>{completedSteps}/{workflowStages.length}</td>
                                    {/* Event date */}
                                    <td className="px-5 py-3 text-sm" style={{ color: '#6B7280' }}>{client.eventDate}</td>
                                    {/* Status badge */}
                                    <td className="px-5 py-3">
                                        <span
                                            className="text-xs px-2.5 py-1 rounded-full font-semibold"
                                            style={{
                                                background: progressPct === 100 ? '#dcfce7' : progressPct >= 55 ? '#ede9fe' : '#fff7ed',
                                                color: progressPct === 100 ? '#16a34a' : progressPct >= 55 ? '#5B5FC7' : '#ea580c',
                                            }}
                                        >
                                            {progressPct === 100 ? '✓ Completed' : `${progressPct}%`}
                                        </span>
                                    </td>
                                    {/* Action */}
                                    <td className="px-5 py-3">
                                        <button
                                            onClick={() => { setSelectedClient(client); setView('detail') }}
                                            style={{ color: '#9CA3AF' }}
                                            title="View workflow timeline"
                                        >
                                            <Eye size={15} />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
