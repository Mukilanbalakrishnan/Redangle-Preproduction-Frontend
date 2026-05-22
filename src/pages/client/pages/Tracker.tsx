import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'

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

// Employee details for transparency in the Client Tracker
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

const deliverableEmployees: Record<string, { name: string; role: string; status: string }[]> = {
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

// Simulated Client Progress based on dummy CRM data
const clientData = {
    name: 'Acme Corporation',
    event: 'Corporate Shoot',
    eventDate: 'Mar 15, 2026',
    completedStages: ['Team Assigned', 'Outdoor Shoot Tracking', 'Shoot Completed', 'Photographer Upload']
}

export default function Tracker() {
    const [expandedStep, setExpandedStep] = useState<number | null>(null)
    const [deliverablePopup, setDeliverablePopup] = useState<string | null>(null)

    const completedStages = clientData.completedStages
    const completedCount = workflowStages.filter(s => completedStages.includes(s)).length
    const progressPct = Math.round((completedCount / workflowStages.length) * 100)

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Production Tracker</h1>
                    <p className="text-slate-500 mt-1">Real-time status of your project lifecycle.</p>
                </div>
            </div>

            {/* Active Client Banner */}
            <div className="rounded-2xl p-5 mb-4 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
                <div className="font-bold text-lg mb-1">{clientData.name}</div>
                <div className="flex items-center gap-3 text-sm" style={{ opacity: 0.9 }}>
                    <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.2)' }}>{clientData.event}</span>
                    <span className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.2)' }}>📅 {clientData.eventDate}</span>
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative">
                <div className="flex items-center justify-between mb-8">
                    <p className="text-lg font-bold text-slate-900">Work Status</p>
                    <div className="flex items-center gap-3">
                        <div className="w-32 h-2.5 rounded-full" style={{ background: '#F3F4F6' }}>
                            <div className="h-2.5 rounded-full" style={{ background: '#22c55e', width: `${progressPct}%` }} />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: '#6B7280' }}>{completedCount}/{workflowStages.length}</span>
                    </div>
                </div>

                <div className="relative">
                    {timelineSteps.map((s, i) => {
                        const isDone = completedStages.includes(s.label)
                        const stepStatus = isDone ? 'done' : 'waiting'
                        const isExpanded = expandedStep === i
                        const employees = stageEmployees[s.label] || []

                        return (
                            <div key={i} className="flex gap-4 mb-4">
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm border border-white`}
                                        style={{ background: stepStyle[stepStatus].bg, color: stepStyle[stepStatus].text }}>
                                        {isDone ? '✓' : s.step}
                                    </div>
                                    {i < timelineSteps.length - 1 && <div className="w-0.5 mt-2" style={{ background: '#E5E7EB', minHeight: isExpanded ? '100%' : '24px' }} />}
                                </div>
                                <div className="flex-1 mt-0.5">
                                    <div
                                        className="bg-white rounded-xl p-4 cursor-pointer transition-all hover:shadow-md border border-slate-100"
                                        style={{ border: isExpanded ? '1px solid #c4b5fd' : undefined }}
                                        onClick={() => setExpandedStep(isExpanded ? null : i)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Step {s.step}</span>
                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                    style={{ background: stepBadge[stepStatus].bg, color: stepBadge[stepStatus].color }}>
                                                    {stepBadge[stepStatus].label}
                                                </span>
                                            </div>
                                            <ChevronDown
                                                size={16}
                                                style={{
                                                    color: '#9CA3AF',
                                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.2s',
                                                }}
                                            />
                                        </div>
                                        <p className="text-base font-bold text-slate-900">{s.label}</p>
                                        <p className="text-sm text-slate-500 mt-1">{s.desc}</p>
                                    </div>

                                    {/* Expanded details */}
                                    {isExpanded && (
                                        <div className="mt-3 rounded-xl p-5 shadow-inner" style={{ background: '#F9F8FF', border: '1px solid #EDE9FE' }}>
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-sm font-bold" style={{ color: '#5B5FC7' }}>👥 Assigned Team</span>
                                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: '#ede9fe', color: '#5B5FC7' }}>
                                                    {employees.length} {employees.length === 1 ? 'member' : 'members'}
                                                </span>
                                            </div>
                                            {employees.length === 0 ? (
                                                <p className="text-sm italic" style={{ color: '#9CA3AF' }}>No team data available for this stage</p>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-3">
                                                    {employees.map((emp, ei) => (
                                                        <div key={ei} className="flex items-start gap-4 rounded-xl p-4 shadow-sm" style={{ background: '#fff', border: '1px solid #f3f4f6' }}>
                                                            <div
                                                                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                                                                style={{ background: 'linear-gradient(135deg, #a78bfa, #5B5FC7)' }}
                                                            >
                                                                {emp.name.charAt(0)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-sm font-bold" style={{ color: '#111827' }}>{emp.name}</span>
                                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider" style={{ background: '#f3f4f6', color: '#6B7280' }}>{emp.role}</span>
                                                                </div>
                                                                <p className="text-sm mb-1" style={{ color: '#6B7280' }}>{emp.notes}</p>
                                                                <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>📅 {emp.date}</p>
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mt-6">
                <p className="text-lg font-bold text-slate-900 mb-8">Deliverables Tracker</p>
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
                                    className="flex flex-col items-center cursor-pointer group"
                                    style={{ minWidth: 90 }}
                                    onClick={() => setDeliverablePopup(deliverablePopup === step ? null : step)}
                                >
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold mb-3 transition-all group-hover:scale-110 shadow-sm border border-transparent"
                                        style={{
                                            background: isDone ? '#22c55e' : isCurrent ? '#5B5FC7' : '#f3f4f6',
                                            color: isDone || isCurrent ? '#fff' : '#9ca3af',
                                            boxShadow: deliverablePopup === step ? '0 0 0 4px rgba(91,95,199,0.3)' : isCurrent ? '0 0 0 4px rgba(91,95,199,0.2)' : 'none',
                                            borderColor: isDone ? '#16a34a' : isCurrent ? '#4f46e5' : '#e5e7eb'
                                        }}
                                    >
                                        {isDone ? '✓' : i + 1}
                                    </div>
                                    <span className="text-xs text-center font-bold uppercase tracking-wider" style={{
                                        color: isDone ? '#16a34a' : isCurrent ? '#5B5FC7' : '#9CA3AF',
                                    }}>
                                        {step}
                                    </span>
                                    <span className="text-[10px] font-semibold mt-1 uppercase tracking-widest" style={{ color: '#d1d5db' }}>
                                        {isDone ? 'Done' : isCurrent ? 'In Progress' : 'Pending'}
                                    </span>
                                </div>
                                {i < arr.length - 1 && (
                                    <div className="flex-1 h-1 mx-2 rounded-full shadow-inner" style={{
                                        background: isDone ? '#22c55e' : '#f3f4f6',
                                        marginBottom: 40,
                                    }} />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Deliverable Employee Details */}
                {deliverablePopup && (
                    <div className="mt-8 rounded-2xl p-6 shadow-inner" style={{ background: '#F9F8FF', border: '1px solid #EDE9FE' }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-base font-bold" style={{ color: '#5B5FC7' }}>{deliverablePopup}</span>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ background: '#ede9fe', color: '#5B5FC7' }}>
                                    {(deliverableEmployees[deliverablePopup] || []).length} Assignment(s)
                                </span>
                            </div>
                            <button onClick={() => setDeliverablePopup(null)} className="hover:bg-indigo-100 rounded-full p-1.5 transition-colors" style={{ color: '#9CA3AF' }}>
                                <X size={16} />
                            </button>
                        </div>
                        <p className="text-sm font-medium mb-4" style={{ color: '#6B7280' }}>Team working on this deliverable:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(deliverableEmployees[deliverablePopup] || []).map((emp, ei) => (
                                <div key={ei} className="flex items-center gap-4 rounded-xl p-4 shadow-sm" style={{ background: '#fff', border: '1px solid #f3f4f6' }}>
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                                        style={{ background: 'linear-gradient(135deg, #a78bfa, #5B5FC7)' }}
                                    >
                                        {emp.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-bold" style={{ color: '#111827' }}>{emp.name}</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider" style={{ background: '#f3f4f6', color: '#6B7280' }}>{emp.role}</span>
                                        </div>
                                        <p className="text-sm font-medium" style={{ color: '#6B7280' }}>{emp.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
