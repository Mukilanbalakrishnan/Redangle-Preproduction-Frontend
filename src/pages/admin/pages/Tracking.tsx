import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, Download, ExternalLink, Eye, Pencil, Trash, X } from 'lucide-react'
import axios from 'axios'
import { Link, useLocation } from 'react-router-dom'

type PhaseScope = 'all' | 'pre_production' | 'event' | 'post_production'

type TeamMember = {
    name: string
    role: string
    employee_id?: string
}

type ProjectStatus = {
    project_type: string
    employee_id?: string
    employee_name?: string
    status?: string
    upload_link?: string
    admin_notes?: string
}

type DetailLink = {
    label: string
    url: string
}

type ClientData = {
    id: string
    externalLeadId: string
    name: string
    event: string
    eventDate: string
    flowType: string
    currentPhase: PhaseScope | ''
    phaseStatus: string
    preProductionStep: string
    eventStatus: string
    mediaStatus: string
    completedStages: string[]
    assignedTeam: TeamMember[]
    projectStatuses: ProjectStatus[]
    uploads: Record<string, string>
}

type View = 'list' | 'detail'

type DetailLine = {
    id: string
    label: string
    complete: (client: ClientData) => boolean
    visible?: (client: ClientData) => boolean
    detail?: (client: ClientData) => string
    links?: (client: ClientData) => DetailLink[]
    children?: DetailLine[]
}

type WorkflowConfig = {
    title: string
    description: string
    phase: PhaseScope
    stages: string[]
    tree: DetailLine[]
}

const EVENT_TYPES = ['All', 'Wedding', 'Pre-Wedding', 'Birthday', 'Corporate Shoot']

const stageMap: Record<string, string> = {
    completed_assign_team: 'Team Assigned',
    team_assignment: 'Team Assigned',
    confirmed_shoot_team: 'Team Assigned',
    media_accepted: 'Outdoor Shoot Tracking',
    event_started: 'Event Started',
    shoot_completed: 'Shoot Completed',
    photographer_upload: 'Photographer Submission',
    videographer_upload: 'Videographer Submission',
    drone_upload: 'Drone Submission',
    data_manager_verification: 'Data Manager Verification',
    assigned_to_crm: 'Assigned to CRM',
    crm_verified: 'CRM Verification',
    editor_team_assigned: 'Phase 2 Assigned Team',
    harddisk_closed: 'Hard Disk Closed',
}

const normalizeStage = (stage: string) => stageMap[stage] || stage
const hasValue = (value?: string | null) => Boolean(String(value || '').trim())
const lower = (value?: string | null) => String(value || '').toLowerCase()

const hasStage = (client: ClientData, stages: string[]) => {
    const raw = new Set(client.completedStages)
    return stages.some(stage => raw.has(stage) || raw.has(normalizeStage(stage)))
}

const hasTeamRole = (client: ClientData, role: string) =>
    client.assignedTeam.some(member => lower(member.role).includes(lower(role)))

const getTeamDetail = (role: string) => (client: ClientData) => {
    const members = client.assignedTeam.filter(member => lower(member.role).includes(lower(role)))
    return members.length ? members.map(member => member.name).join(', ') : 'No assignment details yet'
}

const getProject = (client: ClientData, projectType: string) =>
    client.projectStatuses.find(project => project.project_type === projectType)

const isProjectAssigned = (client: ClientData, projectType: string) => Boolean(getProject(client, projectType))

const isProjectSubmitted = (client: ClientData, projectType: string, uploadKey?: string) => {
    const project = getProject(client, projectType)
    const status = lower(project?.status)
    return hasValue(project?.upload_link) ||
        (uploadKey ? hasValue(client.uploads[uploadKey]) : false) ||
        ['completed', 'approved', 'submitted'].includes(status)
}

const isProjectApproved = (client: ClientData, projectType: string) =>
    lower(getProject(client, projectType)?.status) === 'approved'

const getProjectDetail = (projectType: string, uploadKey?: string) => (client: ClientData) => {
    const project = getProject(client, projectType)
    if (!project && uploadKey && hasValue(client.uploads[uploadKey])) return 'Submitted'
    if (!project) return 'No assignment details yet'
    const owner = project.employee_name || project.employee_id || 'Assigned employee'
    const status = project.status || 'Pending'
    return `${owner} - ${status}`
}

const getUploadLinks = (items: { key: string; label: string }[]) => (client: ClientData) =>
    items
        .map(item => ({ label: item.label, url: client.uploads[item.key] || '' }))
        .filter(item => hasValue(item.url))

const getProjectLinks = (projectType: string, uploadKey?: string) => (client: ClientData) => {
    const links: DetailLink[] = []
    const projectLink = getProject(client, projectType)?.upload_link
    if (hasValue(projectLink)) links.push({ label: `${projectType} upload`, url: projectLink || '' })
    if (uploadKey && hasValue(client.uploads[uploadKey])) links.push({ label: `${projectType} upload`, url: client.uploads[uploadKey] })
    return Array.from(new Map(links.map(link => [link.url, link])).values())
}

const getSubmissionDetail = (links: (client: ClientData) => DetailLink[]) => (client: ClientData) =>
    links(client).length > 0 ? 'Submitted link available' : 'Submission recorded, no link available yet'

const isDmVerified = (client: ClientData) =>
    hasStage(client, ['data_manager_verification']) ||
    ['verified', 'dm_verified', 'crm_verified', 'harddisk_closed'].includes(lower(client.mediaStatus))

const isCrmVerifiedRaw = (client: ClientData) =>
    hasStage(client, ['crm_verified', 'harddisk_closed']) ||
    ['crm_verified', 'harddisk_closed'].includes(lower(client.mediaStatus)) ||
    ['approved', 'completed'].includes(lower(client.phaseStatus))

const isPhase1PhotoSubmitted = (client: ClientData) =>
    hasStage(client, ['photographer_upload']) || hasValue(client.uploads.drive_link)

const isPhase1VideoSubmitted = (client: ClientData) =>
    hasStage(client, ['videographer_upload']) || hasValue(client.uploads.video_drive_link)

const isDroneSubmitted = (client: ClientData) =>
    hasStage(client, ['drone_upload']) ||
    hasValue(client.uploads.drone_photo_drive_link) ||
    hasValue(client.uploads.drone_video_drive_link)

const isPhase1CaptureComplete = (client: ClientData, includeDrone = false) => {
    const required = [
        {
            assigned: hasTeamRole(client, 'Photographer') || isPhase1PhotoSubmitted(client),
            submitted: isPhase1PhotoSubmitted(client),
        },
        {
            assigned: hasTeamRole(client, 'Videographer') || isPhase1VideoSubmitted(client),
            submitted: isPhase1VideoSubmitted(client),
        },
        {
            assigned: includeDrone && (hasTeamRole(client, 'Drone') || isDroneSubmitted(client)),
            submitted: isDroneSubmitted(client),
        },
    ].filter(item => item.assigned)

    return required.length > 0 && required.every(item => item.submitted)
}

const isPrePhase1DmVerified = (client: ClientData) =>
    isPhase1CaptureComplete(client) && isDmVerified(client)

const isPrePhase1CrmVerified = (client: ClientData) =>
    isPrePhase1DmVerified(client) && isCrmVerifiedRaw(client)

const isEventDmVerified = (client: ClientData) =>
    isPhase1CaptureComplete(client, true) && isDmVerified(client)

const isEventCrmVerified = (client: ClientData) =>
    isEventDmVerified(client) && isCrmVerifiedRaw(client)

const allProjectsApproved = (client: ClientData, projectTypes: string[]) => {
    const assigned = projectTypes.filter(projectType => isProjectAssigned(client, projectType))
    return assigned.length > 0 && assigned.every(projectType => isProjectApproved(client, projectType))
}

const PRE_PROJECTS = ['Save the Date', 'Save the Video', 'Retouching']
const POST_PROJECTS = ['Traditional Video Editing', 'Retouch Editing', 'Album Design']
const hasPrePhase2Assignments = (client: ClientData) =>
    PRE_PROJECTS.some(projectType => isProjectAssigned(client, projectType)) ||
    hasTeamRole(client, 'Save the Date') ||
    hasTeamRole(client, 'Retouch')

const isPrePhase2Active = (client: ClientData) =>
    isPrePhase1CrmVerified(client) && (
    client.preProductionStep === 'editing' ||
    ['submitted', 'approved', 'completed'].includes(lower(client.phaseStatus)) ||
    hasPrePhase2Assignments(client)
    )

const isPrePhase2Submitted = (client: ClientData) =>
    isPrePhase2Active(client) &&
    PRE_PROJECTS.some(projectType => isProjectAssigned(client, projectType)) &&
    PRE_PROJECTS
        .filter(projectType => isProjectAssigned(client, projectType))
        .every(projectType => isProjectSubmitted(client, projectType))

const configs: Record<Exclude<PhaseScope, 'all'>, WorkflowConfig> = {
    pre_production: {
        title: 'Pre-production Work Tracking',
        description: 'Track only pre-production phase work and approvals',
        phase: 'pre_production',
        stages: [
            'Phase 1 - Assigned Team',
            'Photographer Submission',
            'Videographer Submission',
            'Data Manager Verification',
            'Pre-production CRM Verification',
            'Phase 2 - Assigned Team',
            'Save the Date Post Submission',
            'Save the Date Video Submission',
            'Retouch Submission',
            'Stage 1 Completed',
        ],
        tree: [
            {
                id: 'pre-p1-team',
                label: 'Phase 1 - Assigned Team',
                complete: client => hasTeamRole(client, 'Photographer') || hasTeamRole(client, 'Videographer') || hasStage(client, ['completed_assign_team', 'team_assignment', 'confirmed_shoot_team']),
                children: [
                    { id: 'pre-photographer', label: 'Photographer Assigned', complete: client => hasTeamRole(client, 'Photographer'), detail: getTeamDetail('Photographer') },
                    { id: 'pre-videographer', label: 'Videographer Assigned', complete: client => hasTeamRole(client, 'Videographer'), detail: getTeamDetail('Videographer') },
                ],
            },
            {
                id: 'pre-photo-submit',
                label: 'Photographer Submission',
                complete: isPhase1PhotoSubmitted,
                detail: getSubmissionDetail(getUploadLinks([{ key: 'drive_link', label: 'Photographer upload' }])),
                links: getUploadLinks([{ key: 'drive_link', label: 'Photographer upload' }]),
            },
            {
                id: 'pre-video-submit',
                label: 'Videographer Submission',
                complete: isPhase1VideoSubmitted,
                detail: getSubmissionDetail(getUploadLinks([{ key: 'video_drive_link', label: 'Videographer upload' }])),
                links: getUploadLinks([{ key: 'video_drive_link', label: 'Videographer upload' }]),
            },
            { id: 'pre-dm', label: 'Data Manager Verification', complete: isPrePhase1DmVerified },
            { id: 'pre-crm-p1', label: 'Pre-production CRM Verification', complete: isPrePhase1CrmVerified },
            {
                id: 'pre-p2-team',
                label: 'Phase 2 - Assigned Team',
                complete: client => isPrePhase2Active(client) && hasPrePhase2Assignments(client),
                children: [
                    { id: 'pre-std', label: 'Save the Date Post', complete: client => isProjectAssigned(client, 'Save the Date') || hasTeamRole(client, 'Save the Date Post'), detail: getProjectDetail('Save the Date', 'save_the_date_drive_link') },
                    { id: 'pre-stv', label: 'Save the Date Video', complete: client => isProjectAssigned(client, 'Save the Video') || hasTeamRole(client, 'Save the Date Video'), detail: getProjectDetail('Save the Video', 'save_the_video_drive_link') },
                    { id: 'pre-retouch', label: 'Retouch', complete: client => isProjectAssigned(client, 'Retouching') || hasTeamRole(client, 'Retouch'), detail: getProjectDetail('Retouching', 'retouch_drive_link') },
                ],
            },
            {
                id: 'pre-std-submit',
                label: 'Save the Date Post Submission',
                complete: client => isPrePhase2Active(client) && isProjectSubmitted(client, 'Save the Date', 'save_the_date_drive_link'),
                detail: getSubmissionDetail(getProjectLinks('Save the Date', 'save_the_date_drive_link')),
                links: getProjectLinks('Save the Date', 'save_the_date_drive_link'),
            },
            {
                id: 'pre-stv-submit',
                label: 'Save the Date Video Submission',
                complete: client => isPrePhase2Active(client) && isProjectSubmitted(client, 'Save the Video', 'save_the_video_drive_link'),
                detail: getSubmissionDetail(getProjectLinks('Save the Video', 'save_the_video_drive_link')),
                links: getProjectLinks('Save the Video', 'save_the_video_drive_link'),
            },
            {
                id: 'pre-retouch-submit',
                label: 'Retouch Submission',
                complete: client => isPrePhase2Active(client) && isProjectSubmitted(client, 'Retouching', 'retouch_drive_link'),
                detail: getSubmissionDetail(getProjectLinks('Retouching', 'retouch_drive_link')),
                links: getProjectLinks('Retouching', 'retouch_drive_link'),
            },
            { id: 'pre-stage-complete', label: 'Stage 1 Completed', complete: client => isPrePhase2Active(client) && (isPrePhase2Submitted(client) || allProjectsApproved(client, PRE_PROJECTS) || (client.currentPhase !== 'pre_production' && client.currentPhase !== '')) },
        ],
    },
    event: {
        title: 'Event Work Tracking',
        description: 'Track only event phase assignment, runtime, and media approval',
        phase: 'event',
        stages: [
            'Event Team Assigned',
            'Event Started',
            'Shoot Completed',
            'Photographer Submission',
            'Videographer Submission',
            'Drone Submission',
            'Data Manager Verification',
            'Event Raw Data Approval',
            'Event Stage Completed',
        ],
        tree: [
            {
                id: 'event-team',
                label: 'Event Team Assigned',
                complete: client => hasTeamRole(client, 'Photographer') || hasTeamRole(client, 'Videographer') || hasTeamRole(client, 'Drone') || hasStage(client, ['completed_assign_team', 'team_assignment', 'confirmed_shoot_team']),
                children: [
                    { id: 'event-photographer', label: 'Photographer Assigned', complete: client => hasTeamRole(client, 'Photographer'), detail: getTeamDetail('Photographer') },
                    { id: 'event-videographer', label: 'Videographer Assigned', complete: client => hasTeamRole(client, 'Videographer'), detail: getTeamDetail('Videographer') },
                    { id: 'event-drone', label: 'Drone Assigned', complete: client => hasTeamRole(client, 'Drone'), visible: client => hasTeamRole(client, 'Drone'), detail: getTeamDetail('Drone') },
                ],
            },
            { id: 'event-started', label: 'Event Started', complete: client => hasStage(client, ['event_started']) || ['started', 'paused', 'ended'].includes(lower(client.eventStatus)) },
            { id: 'event-ended', label: 'Shoot Completed', complete: client => hasStage(client, ['shoot_completed']) || lower(client.eventStatus) === 'ended' },
            {
                id: 'event-photo-submit',
                label: 'Photographer Submission',
                complete: isPhase1PhotoSubmitted,
                detail: getSubmissionDetail(getUploadLinks([{ key: 'drive_link', label: 'Photographer upload' }])),
                links: getUploadLinks([{ key: 'drive_link', label: 'Photographer upload' }]),
            },
            {
                id: 'event-video-submit',
                label: 'Videographer Submission',
                complete: isPhase1VideoSubmitted,
                detail: getSubmissionDetail(getUploadLinks([{ key: 'video_drive_link', label: 'Videographer upload' }])),
                links: getUploadLinks([{ key: 'video_drive_link', label: 'Videographer upload' }]),
            },
            {
                id: 'event-drone-submit',
                label: 'Drone Submission',
                visible: client => hasTeamRole(client, 'Drone'),
                complete: isDroneSubmitted,
                detail: getSubmissionDetail(getUploadLinks([
                    { key: 'drone_photo_drive_link', label: 'Drone photo upload' },
                    { key: 'drone_video_drive_link', label: 'Drone video upload' },
                ])),
                links: getUploadLinks([
                    { key: 'drone_photo_drive_link', label: 'Drone photo upload' },
                    { key: 'drone_video_drive_link', label: 'Drone video upload' },
                ]),
            },
            { id: 'event-dm', label: 'Data Manager Verification', complete: isEventDmVerified },
            { id: 'event-raw-data', label: 'Event Raw Data Approval', complete: isEventCrmVerified },
            { id: 'event-complete', label: 'Event Stage Completed', complete: client => isEventCrmVerified(client) && client.currentPhase !== 'event' && client.currentPhase !== '' },
        ],
    },
    post_production: {
        title: 'Post-production Work Tracking',
        description: 'Track only post-production specialist assignment and submissions',
        phase: 'post_production',
        stages: [
            'Post-production Team Assigned',
            'Traditional Video Submission',
            'Retouch Submission',
            'Album Design Submission',
            'Data Manager Verification',
            'Post-production CRM Verification',
            'Post-production Completed',
        ],
        tree: [
            {
                id: 'post-team',
                label: 'Post-production Team Assigned',
                complete: client => POST_PROJECTS.some(projectType => isProjectAssigned(client, projectType)),
                children: [
                    { id: 'post-video', label: 'Traditional Video Editor', complete: client => isProjectAssigned(client, 'Traditional Video Editing'), detail: getProjectDetail('Traditional Video Editing') },
                    { id: 'post-photo', label: 'Retouch Editor', complete: client => isProjectAssigned(client, 'Retouch Editing'), detail: getProjectDetail('Retouch Editing') },
                    { id: 'post-album', label: 'Album Designer', complete: client => isProjectAssigned(client, 'Album Design'), detail: getProjectDetail('Album Design') },
                ],
            },
            {
                id: 'post-video-submit',
                label: 'Traditional Video Submission',
                complete: client => isProjectSubmitted(client, 'Traditional Video Editing'),
                detail: getSubmissionDetail(getProjectLinks('Traditional Video Editing')),
                links: getProjectLinks('Traditional Video Editing'),
            },
            {
                id: 'post-photo-submit',
                label: 'Retouch Submission',
                complete: client => isProjectSubmitted(client, 'Retouch Editing'),
                detail: getSubmissionDetail(getProjectLinks('Retouch Editing')),
                links: getProjectLinks('Retouch Editing'),
            },
            {
                id: 'post-album-submit',
                label: 'Album Design Submission',
                complete: client => isProjectSubmitted(client, 'Album Design'),
                detail: getSubmissionDetail(getProjectLinks('Album Design')),
                links: getProjectLinks('Album Design'),
            },
            { id: 'post-dm', label: 'Data Manager Verification', complete: client => lower(client.phaseStatus) === 'submitted' || allProjectsApproved(client, POST_PROJECTS) },
            { id: 'post-crm', label: 'Post-production CRM Verification', complete: client => allProjectsApproved(client, POST_PROJECTS) },
            { id: 'post-complete', label: 'Post-production Completed', complete: client => lower(client.phaseStatus) === 'completed' || allProjectsApproved(client, POST_PROJECTS) },
        ],
    },
}

const detectScope = (pathname: string): PhaseScope => {
    if (pathname.startsWith('/pre-production-crm')) return 'pre_production'
    if (pathname.startsWith('/event-coordinator')) return 'event'
    if (pathname.startsWith('/post-production-crm/event-raw-data')) return 'event'
    if (pathname.startsWith('/post-production-crm')) return 'post_production'
    return 'all'
}

const getConfigForClient = (client: ClientData, fallback: PhaseScope): WorkflowConfig => {
    const phase = fallback === 'all' ? client.currentPhase : fallback
    if (phase === 'event' || phase === 'post_production' || phase === 'pre_production') return configs[phase]
    return configs.pre_production
}

const uniqueByRole = (team: TeamMember[]) =>
    Array.from(new Map(team.filter(member => member.name).map(member => [`${member.name}-${member.role}`, member])).values())

const buildClient = (item: any): ClientData => ({
    id: String(item.id),
    externalLeadId: String(item.external_lead_id || item.id),
    name: item.client_name || 'Unnamed client',
    event: item.event_type || 'Unspecified',
    eventDate: item.event_date || '',
    flowType: item.flow_type || '',
    currentPhase: item.current_phase || '',
    phaseStatus: item.phase_status || '',
    preProductionStep: item.pre_production_step || 'shoot',
    eventStatus: item.event_status || 'not_started',
    mediaStatus: item.media_status || '',
    completedStages: (item.completed_stages || []).map((stage: string) => normalizeStage(stage)),
    assignedTeam: uniqueByRole(item.assigned_team || []),
    projectStatuses: item.project_statuses || [],
    uploads: {
        drive_link: item.drive_link || '',
        video_drive_link: item.video_drive_link || '',
        drone_photo_drive_link: item.drone_photo_drive_link || '',
        drone_video_drive_link: item.drone_video_drive_link || '',
        save_the_date_drive_link: item.save_the_date_drive_link || '',
        save_the_video_drive_link: item.save_the_video_drive_link || '',
        retouch_drive_link: item.retouch_drive_link || '',
    },
})

const isLineVisible = (line: DetailLine, client: ClientData) => line.visible ? line.visible(client) : true
const getVisibleLines = (config: WorkflowConfig, client: ClientData) => config.tree.filter(line => isLineVisible(line, client))
const getVisibleChildren = (line: DetailLine, client: ClientData) => (line.children || []).filter(child => isLineVisible(child, client))
const getMilestones = (config: WorkflowConfig, client: ClientData) =>
    getVisibleLines(config, client).flatMap(line => [line, ...getVisibleChildren(line, client)])
const getCompletedCount = (config: WorkflowConfig, client: ClientData) => getVisibleLines(config, client).filter(line => line.complete(client)).length
const getTotalCount = (config: WorkflowConfig, client: ClientData) => getVisibleLines(config, client).length
const getCurrentStage = (config: WorkflowConfig, client: ClientData) => {
    const pending = getVisibleLines(config, client).find(line => !line.complete(client))
    return pending?.label || 'Completed'
}

function FilterDropdown({
    label, options, value, onChange,
}: {
    label: string; options: string[]; value: string; onChange: (v: string) => void
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
                <X size={11} className={isFiltered ? 'cursor-pointer hover:text-red-500' : 'hidden'} onClick={e => { e.stopPropagation(); onChange('All'); setOpen(false) }} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden shadow-lg"
                        style={{ background: '#fff', border: '1px solid #e5e7eb', minWidth: '210px', maxHeight: '270px', overflowY: 'auto' }}>
                        {options.map(opt => (
                            <button key={opt} onClick={() => { onChange(opt); setOpen(false) }}
                                className="flex items-center w-full px-4 py-2.5 text-xs font-medium text-left transition-colors hover:bg-purple-50"
                                style={{ color: opt === value ? '#5B5FC7' : '#374151', fontWeight: opt === value ? 700 : 500 }}>
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

function TimelineStep({
    line,
    client,
    index,
    isLast,
    expanded,
    onToggle,
}: {
    line: DetailLine
    client: ClientData
    index: number
    isLast: boolean
    expanded: boolean
    onToggle: () => void
}) {
    const done = line.complete(client)
    const detail = line.detail?.(client)
    const links = line.links?.(client) || []
    const visibleChildren = getVisibleChildren(line, client)
    const hasDetails = Boolean(links.length || visibleChildren.length)
    return (
        <div className="mb-4 flex gap-4">
            <div className="flex flex-col items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
                    style={{ background: done ? '#22c55e' : '#e5e7eb', color: done ? '#fff' : '#9ca3af' }}>
                    {done ? <Check size={17} /> : index + 1}
                </div>
                {!isLast && <div className="mt-1 w-0.5 flex-1" style={{ minHeight: expanded ? 86 : 24, background: '#E5E7EB' }} />}
            </div>
            <div className="min-w-0 flex-1">
                <button
                    type="button"
                    onClick={hasDetails ? onToggle : undefined}
                    className="crm-card w-full p-3 text-left transition-all hover:shadow-md"
                    style={{ border: expanded ? '1px solid #c4b5fd' : undefined }}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                <span className="text-xs" style={{ color: '#9CA3AF' }}>Step {index + 1}</span>
                                <span className="rounded-full px-2 py-0.5 text-xs"
                                    style={{ background: done ? '#dcfce7' : '#f3f4f6', color: done ? '#16a34a' : '#6b7280' }}>
                                    {done ? 'Completed' : 'Pending'}
                                </span>
                            </div>
                            <p className="text-sm font-semibold" style={{ color: '#111827' }}>{line.label}</p>
                            <p className="mt-0.5 text-xs" style={{ color: '#6B7280' }}>
                                {detail || (line.children?.length ? 'Open to view assignment details' : 'Waiting for this workflow step')}
                            </p>
                        </div>
                        {hasDetails && (
                            <ChevronDown
                                size={15}
                                className="mt-2 shrink-0 transition-transform"
                                style={{ color: '#9CA3AF', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            />
                        )}
                    </div>
                </button>
                {expanded && hasDetails && (
                    <div className="mt-2 rounded-xl p-4" style={{ background: '#F9F8FF', border: '1px solid #EDE9FE' }}>
                        {detail && <p className="mb-3 text-xs font-medium" style={{ color: '#5B5FC7' }}>{detail}</p>}
                        {links.length > 0 && (
                            <div className="mb-3 space-y-2">
                                {links.map(link => (
                                    <a
                                        key={link.url}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium underline"
                                        style={{ border: '1px solid #E5E7EB', color: '#5B5FC7' }}
                                    >
                                        <ExternalLink size={13} />
                                        <span className="shrink-0">{link.label}</span>
                                        <span className="min-w-0 flex-1 truncate">{link.url}</span>
                                    </a>
                                ))}
                            </div>
                        )}
                        <div className="space-y-2">
                            {visibleChildren.map(child => {
                                const childDone = child.complete(client)
                                const childDetail = child.detail?.(client)
                                return (
                                    <div key={child.id} className="flex items-start gap-2 rounded-lg bg-white px-3 py-2" style={{ border: '1px solid #E5E7EB' }}>
                                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                                            style={{ background: childDone ? '#22c55e' : '#e5e7eb', color: childDone ? '#fff' : '#9ca3af' }}>
                                            {childDone ? <Check size={12} /> : ''}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold" style={{ color: '#111827' }}>{child.label}</p>
                                            <p className="text-xs" style={{ color: '#6B7280' }}>{childDetail || 'No details yet'}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function Tracking() {
    const location = useLocation()
    const phaseScope = useMemo(() => detectScope(location.pathname), [location.pathname])
    const activeConfig = phaseScope === 'all' ? null : configs[phaseScope]
    const [view, setView] = useState<View>('list')
    const [selectedClient, setSelectedClient] = useState<ClientData | null>(null)
    const [clientSearch, setClientSearch] = useState('')
    const [eventFilter, setEventFilter] = useState('All')
    const [stageFilter, setStageFilter] = useState('All')
    const [clientTracking, setClientTracking] = useState<ClientData[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedLine, setExpandedLine] = useState<string | null>(null)
    const [editWork, setEditWork] = useState<ClientData | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

    const stageOptions = useMemo(() => {
        const stages = phaseScope === 'all'
            ? Array.from(new Set(Object.values(configs).flatMap(config => config.stages)))
            : configs[phaseScope].stages
        return ['All', ...stages]
    }, [phaseScope])

    useEffect(() => {
        const fetchTrackingData = async () => {
            setLoading(true)
            try {
                const params = phaseScope === 'all' ? {} : { phase: phaseScope }
                const res = await axios.get(`${API_URL}/work-tracking`, { params })
                setClientTracking((res.data.data || []).map(buildClient))
            } catch (err) {
                console.error('Error fetching work tracking data:', err)
                setClientTracking([])
            } finally {
                setLoading(false)
            }
        }
        fetchTrackingData()
    }, [API_URL, phaseScope])

    const handleEditSave = async () => {
        if (!editWork) return
        try {
            await axios.put(`${API_URL}/work-tracking/${editWork.id}`, {
                client_name: editWork.name,
                event_type: editWork.event,
                event_date: editWork.eventDate,
            })
            setClientTracking(prev => prev.map(c => (c.id === editWork.id ? editWork : c)))
            setEditWork(null)
        } catch {
            alert('Failed to update work tracking')
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await axios.delete(`${API_URL}/work-tracking/${id}`)
            setClientTracking(prev => prev.filter(c => c.id !== id))
            setDeleteConfirm(null)
        } catch {
            alert('Failed to delete work tracking')
        }
    }

    const clientFiltered = clientTracking.filter(client => {
        const config = getConfigForClient(client, phaseScope)
        const matchSearch = client.name.toLowerCase().includes(clientSearch.toLowerCase()) || client.event.toLowerCase().includes(clientSearch.toLowerCase())
        const matchEvent = eventFilter === 'All' || client.event === eventFilter
        const matchStage = stageFilter === 'All' || getCurrentStage(config, client) === stageFilter || config.stages.includes(stageFilter) && getMilestones(config, client).some(line => line.label === stageFilter && line.complete(client))
        return matchSearch && matchEvent && matchStage
    })

    const hasClientFilters = eventFilter !== 'All' || stageFilter !== 'All'

    const handleDownloadReport = () => {
        if (clientFiltered.length === 0) return
        const headers = ['Client Name', 'Event Type', 'Phase', 'Current Stage', 'Stages Completed', 'Event Date', 'Status']
        const csvRows = clientFiltered.map(client => {
            const config = getConfigForClient(client, phaseScope)
            const completedSteps = getCompletedCount(config, client)
            const totalSteps = getTotalCount(config, client)
            const progressPct = Math.round((completedSteps / totalSteps) * 100)
            return [client.name, client.event, config.title, getCurrentStage(config, client), `${completedSteps}/${totalSteps}`, client.eventDate, `${progressPct}%`]
                .map(val => `"${String(val || '').replace(/"/g, '""')}"`)
                .join(',')
        })
        const csvContent = [headers.join(','), ...csvRows].join('\n')
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        const d = new Date()
        link.setAttribute('href', url)
        link.setAttribute('download', `work_tracking_${phaseScope}_${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}.csv`)
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    if (view === 'detail' && selectedClient) {
        const config = getConfigForClient(selectedClient, phaseScope)
        const visibleLines = getVisibleLines(config, selectedClient)
        const completedCount = getCompletedCount(config, selectedClient)
        const totalCount = getTotalCount(config, selectedClient)
        const progressPct = Math.round((completedCount / totalCount) * 100)

        return (
            <div>
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold" style={{ color: '#111827' }}>{config.title}</h1>
                        <p className="text-sm" style={{ color: '#6B7280' }}>{config.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/client/tracker" target="_blank"
                            className="crm-card flex items-center gap-2 bg-indigo-50 px-4 py-2 text-sm font-medium transition-all hover:shadow-md"
                            style={{ color: '#5B5FC7', border: '1px solid #e0e7ff' }}>
                            <ExternalLink size={16} /> View Client Tracker
                        </Link>
                        <button onClick={() => { setView('list'); setSelectedClient(null); setExpandedLine(null) }}
                            className="crm-card flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all hover:shadow-md"
                            style={{ color: '#5B5FC7' }}>
                            Back to list
                        </button>
                    </div>
                </div>

                <div className="mb-4 rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
                    <div className="mb-1 text-base font-bold">{selectedClient.name}</div>
                    <div className="flex flex-wrap items-center gap-3 text-sm" style={{ opacity: 0.9 }}>
                        <span className="rounded px-2 py-0.5 text-xs" style={{ background: 'rgba(255,255,255,0.2)' }}>{selectedClient.event}</span>
                        <span className="rounded px-2 py-0.5 text-xs" style={{ background: 'rgba(255,255,255,0.2)' }}>{selectedClient.eventDate}</span>
                        <span className="rounded px-2 py-0.5 text-xs" style={{ background: 'rgba(255,255,255,0.2)' }}>{selectedClient.flowType || 'Flow not set'}</span>
                    </div>
                </div>

                <div className="crm-card p-5">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-semibold" style={{ color: '#111827' }}>Work Status</p>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-24 rounded-full" style={{ background: '#F3F4F6' }}>
                                <div className="h-2 rounded-full" style={{ background: '#22c55e', width: `${progressPct}%` }} />
                            </div>
                            <span className="text-xs" style={{ color: '#6B7280' }}>{completedCount}/{totalCount}</span>
                        </div>
                    </div>
                    <div>
                        {visibleLines.map((line, index) => (
                            <TimelineStep
                                key={line.id}
                                line={line}
                                client={selectedClient}
                                index={index}
                                isLast={index === visibleLines.length - 1}
                                expanded={expandedLine === line.id}
                                onToggle={() => setExpandedLine(expandedLine === line.id ? null : line.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (loading) return <div className="p-10 text-gray-500">Loading work tracking...</div>

    return (
        <div>
            <div className="mb-5 flex items-start justify-between">
                <div>
                    <h1 className="text-lg font-bold" style={{ color: '#111827' }}>{activeConfig?.title || 'Work Tracking'}</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>{activeConfig?.description || 'Monitor client project progress and workflow stages'}</p>
                </div>
                <button onClick={handleDownloadReport}
                    className="crm-card flex items-center gap-2 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ color: '#6B7280' }} disabled={clientFiltered.length === 0}>
                    <Download size={14} /> Download report
                </button>
            </div>

            <div className="mb-4 flex items-center gap-3">
                <div className="flex flex-1 items-center gap-2 rounded-xl px-4 py-2.5" style={{ background: '#F0EFFE', border: '1px solid #E0DFFE' }}>
                    <input type="text" placeholder="Search by client name or event..." value={clientSearch}
                        onChange={e => setClientSearch(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#374151' }} />
                    {clientSearch && <button onClick={() => setClientSearch('')} style={{ color: '#9CA3AF' }}><X size={13} /></button>}
                </div>
                <FilterDropdown label="Event Type" options={EVENT_TYPES} value={eventFilter} onChange={setEventFilter} />
                <FilterDropdown label="Stage" options={stageOptions} value={stageFilter} onChange={setStageFilter} />
                {hasClientFilters && (
                    <button onClick={() => { setEventFilter('All'); setStageFilter('All') }}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"
                        style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
                        <X size={11} /> Clear
                    </button>
                )}
            </div>

            <div className="crm-table-wrap">
                <table className="w-full">
                    <thead>
                        <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                            {['Client name', 'Event type', 'Current stage', 'Stages', 'Event date', 'Status', 'Action'].map(h => (
                                <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: '#5B5FC7' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {clientFiltered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: '#9CA3AF' }}>
                                    No clients match the current filters
                                </td>
                            </tr>
                        ) : clientFiltered.map(client => {
                            const config = getConfigForClient(client, phaseScope)
                            const completedSteps = getCompletedCount(config, client)
                            const totalSteps = getTotalCount(config, client)
                            const progressPct = Math.round((completedSteps / totalSteps) * 100)
                            const currentStage = getCurrentStage(config, client)
                            return (
                                <tr key={client.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                                                style={{ background: 'linear-gradient(135deg, #a78bfa, #5B5FC7)' }}>
                                                {client.name.charAt(0)}
                                            </div>
                                            <span className="text-sm font-medium" style={{ color: '#111827' }}>{client.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-sm" style={{ color: '#6B7280' }}>{client.event}</td>
                                    <td className="px-5 py-3">
                                        <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: '#ede9fe', color: '#5B5FC7' }}>
                                            {currentStage}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-sm" style={{ color: '#6B7280' }}>{completedSteps}/{totalSteps}</td>
                                    <td className="px-5 py-3 text-sm" style={{ color: '#6B7280' }}>{client.eventDate}</td>
                                    <td className="px-5 py-3">
                                        <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                                            style={{
                                                background: progressPct === 100 ? '#dcfce7' : progressPct >= 55 ? '#ede9fe' : '#fff7ed',
                                                color: progressPct === 100 ? '#16a34a' : progressPct >= 55 ? '#5B5FC7' : '#ea580c',
                                            }}>
                                            {progressPct === 100 ? 'Completed' : `${progressPct}%`}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex gap-3">
                                            <button onClick={() => { setSelectedClient(client); setExpandedLine(null); setView('detail') }}
                                                style={{ color: '#9CA3AF' }} className="transition-colors hover:text-purple-600" title="View">
                                                <Eye size={15} />
                                            </button>
                                            <button onClick={() => setEditWork(client)}
                                                style={{ color: '#9CA3AF' }} className="transition-colors hover:text-indigo-600" title="Edit">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => setDeleteConfirm(client.id)}
                                                style={{ color: '#9CA3AF' }} className="transition-colors hover:text-red-500" title="Delete">
                                                <Trash size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {editWork && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-[500px] rounded-xl bg-white p-6">
                        <h2 className="mb-4 text-lg font-bold" style={{ color: '#111827' }}>Edit Work Tracking</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Client Name</label>
                                <input type="text" className="w-full rounded-lg border p-2 text-sm outline-none focus:border-indigo-500"
                                    value={editWork.name} onChange={e => setEditWork({ ...editWork, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Event Type</label>
                                    <input type="text" className="w-full rounded-lg border p-2 text-sm outline-none focus:border-indigo-500"
                                        value={editWork.event} onChange={e => setEditWork({ ...editWork, event: e.target.value })} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Event Date</label>
                                    <input type="text" className="w-full rounded-lg border p-2 text-sm outline-none focus:border-indigo-500"
                                        value={editWork.eventDate} onChange={e => setEditWork({ ...editWork, eventDate: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button className="rounded-lg border px-4 py-2 text-sm font-medium" onClick={() => setEditWork(null)}>Cancel</button>
                            <button className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: '#5B5FC7' }} onClick={handleEditSave}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-[400px] rounded-xl bg-white p-6">
                        <h2 className="mb-2 text-lg font-bold text-gray-900">Delete Record?</h2>
                        <p className="mb-6 text-sm text-gray-500">Are you sure you want to delete this tracking record? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button className="rounded-lg border px-4 py-2 text-sm font-medium" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                                onClick={() => handleDelete(deleteConfirm)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
