import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Camera, CheckCircle2, Clock3, MapPin, Save, UploadCloud, Users, Video } from 'lucide-react'
import axios from 'axios'
import { getAssignTeam, saveAssignTeam } from '../../../api/assignTeam.api'
import { getEventDetailsByLeadId, saveEventDetails } from '../../../api/eventDetails.api'
import { EmployeePicker, TagInput, type Employee } from '../../../ClientFlow/assignTeamShared'

type ClientLike = {
  id: string
  serialNumber?: string
  name: string
  email: string
  phone: string
  location: string
  eventDate: string
  shootType: string
}

type Props = {
  client: ClientLike
  onBack: () => void
  onNext: () => void
}

type TeamState = {
  photographer: string
  videographer: string
  drone: string
  secondary_photographer: string
  secondary_videographer: string
  event_date: string
  event_time: string
  location: string
}

type UploadProgressItem = {
  key: string
  label: string
  employee_id: string | null
  required: boolean
  uploaded: boolean
  upload_link: string | null
}

type EventDataProgress = {
  media_status: string
  required_count: number
  uploaded_count: number
  all_uploaded: boolean
  data_manager_approved: boolean
  workflow_status: string
  next_owner: string
  next_path: string
  uploads: UploadProgressItem[]
}

const emptyTeamState: TeamState = {
  photographer: '',
  videographer: '',
  drone: '',
  secondary_photographer: '',
  secondary_videographer: '',
  event_date: '',
  event_time: '',
  location: '',
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
      <h3 className="text-sm font-bold mb-4" style={{ color: '#111827' }}>{title}</h3>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>
      {children}
    </label>
  )
}

function InputShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white px-4 py-3" style={{ borderColor: '#E5E7EB' }}>
      {children}
    </div>
  )
}

export default function EventStageClientView({ client, onBack, onNext }: Props) {
  const actualId = client.id;
  const API_URL = import.meta.env.VITE_API_URL
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [teamState, setTeamState] = useState<TeamState>(emptyTeamState)
  const [additionalStaff, setAdditionalStaff] = useState<string[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [phaseStatus, setPhaseStatus] = useState<string>('')
  const [dataProgress, setDataProgress] = useState<EventDataProgress | null>(null)

  const setField = (field: keyof TeamState, value: string) => {
    setTeamState(prev => ({ ...prev, [field]: value }))
  }

  const loadDataProgress = async () => {
    const progressRes = await axios
      .get(`${API_URL}/event-coordinator/event/${actualId}/data-progress`)
      .catch(() => null)
    setDataProgress(progressRes?.data?.data || null)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [phaseRes, employeeRes, assignRes, eventRes] = await Promise.all([
          axios.get(`${API_URL}/crm/leads/${actualId}/phase-info`).catch(() => null),
          axios.get(`${API_URL}/employees`).catch(() => null),
          getAssignTeam(String(actualId), 'event').catch(() => null),
          getEventDetailsByLeadId(String(actualId)).catch(() => null),
        ])

        setPhaseStatus(phaseRes?.data?.data?.phase_status || '')
        setEmployees((employeeRes?.data?.data || []) as Employee[])

        const savedTeam = assignRes?.data?.data
        const eventData = eventRes?.data

        if (savedTeam || eventData) {
          setTeamState({
            photographer: savedTeam?.photographer || '',
            videographer: savedTeam?.videographer || '',
            drone: savedTeam?.drone || '',
            secondary_photographer: Array.isArray(savedTeam?.secondary_photographer)
              ? (savedTeam.secondary_photographer[0] || '')
              : '',
            secondary_videographer: Array.isArray(savedTeam?.secondary_videographer)
              ? (savedTeam.secondary_videographer[0] || '')
              : '',
            event_date: (savedTeam?.event_date || eventData?.preferred_date || '').toString().slice(0, 10),
            event_time: savedTeam?.event_time || eventData?.preferred_time || '',
            location: savedTeam?.location || eventData?.event_location || client.location || '',
          })

          if (savedTeam?.additional_staff) {
            const parsed = Array.isArray(savedTeam.additional_staff)
              ? savedTeam.additional_staff
              : JSON.parse(savedTeam.additional_staff)
            setAdditionalStaff(parsed)
          }
        }

        await loadDataProgress()
      } catch (error) {
        console.error('Failed to load event-stage client data', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [API_URL, actualId, client.location])

  const hasRole = (emp: Employee, expectedRoles: string[]) => {
    const rolesStr = emp.roles ? (typeof emp.roles === 'string' ? emp.roles : JSON.stringify(emp.roles)) : ''
    const roleStr = emp.role || ''
    const normalizedRoles = `${rolesStr} ${roleStr}`.toLowerCase()
    return expectedRoles.some((expectedRole) => normalizedRoles.includes(expectedRole.toLowerCase()))
  }

  const photographers = employees.filter((emp) => hasRole(emp, ['photographer']))
  const videographers = employees.filter((emp) => hasRole(emp, ['videographer']))
  const drones = employees.filter((emp) => hasRole(emp, ['drone']))

  const getEmployeeLabel = (employeeId: string) => {
    if (!employeeId) return 'Unassigned'

    const employee = employees.find((item) => String(item.employee_id) === String(employeeId))
    if (!employee) return employeeId

    const name = [employee.first_name, employee.last_name].filter(Boolean).join(' ').trim()
    return `${name || employee.employee_id} (${employee.employee_id})`
  }

  const removeAdditionalStaff = (value: string) => {
    setAdditionalStaff(prev => prev.filter(item => item !== value))
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      await saveAssignTeam({
        external_lead_id: String(actualId),
        assignment_phase: 'event',
        photographer: teamState.photographer,
        videographer: teamState.videographer,
        drone: teamState.drone,
        secondary_photographer: teamState.secondary_photographer ? [teamState.secondary_photographer] : [],
        secondary_videographer: teamState.secondary_videographer ? [teamState.secondary_videographer] : [],
        secondary_drone: [],
        additional_staff: additionalStaff,
        event_date: teamState.event_date,
        event_time: teamState.event_time,
        location: teamState.location,
      })

      await saveEventDetails({
        external_lead_id: String(actualId),
        client_name: client.name,
        email: client.email,
        phone: client.phone,
        contact_person_name: client.name,
        contact_person_number: client.phone,
        event_type: client.shootType,
        event_location: teamState.location,
        preferred_date: teamState.event_date,
        preferred_time: teamState.event_time,
        budget_range: '',
        services: [],
        deliverables: [],
        invoice_attached: false,
        meeting_type: 'event',
        meeting_details: 'Event coordinator setup',
        client_requirements: '',
        priority_level: 'medium',
      })

      if (phaseStatus !== 'in_progress') {
        await axios.patch(`${API_URL}/crm/leads/${actualId}/phase-status`, {
          status: 'in_progress',
        }).catch(() => null)
      }

      await loadDataProgress()

      const assignmentSummary = [
        `Photographer: ${getEmployeeLabel(teamState.photographer)}`,
        `Videographer: ${getEmployeeLabel(teamState.videographer)}`,
        `Drone: ${getEmployeeLabel(teamState.drone)}`,
        teamState.secondary_photographer ? `Secondary Photographer: ${getEmployeeLabel(teamState.secondary_photographer)}` : '',
        teamState.secondary_videographer ? `Secondary Videographer: ${getEmployeeLabel(teamState.secondary_videographer)}` : '',
      ].filter(Boolean).join('\n')

      alert(`Event setup saved successfully.\n\n${assignmentSummary}`)
      onNext()
    } catch (error) {
      console.error('Failed to save event setup', error)
      alert('Failed to save event setup')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-[32px] bg-white p-10 text-center shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
        <p className="text-sm" style={{ color: '#6B7280' }}>Loading event setup...</p>
      </div>
    )
  }

  const progressPercent = dataProgress?.required_count
    ? Math.round((dataProgress.uploaded_count / dataProgress.required_count) * 100)
    : 0
  const statusLabel = dataProgress?.data_manager_approved
    ? 'Data Manager Approved'
    : dataProgress?.workflow_status === 'reupload_requested'
      ? 'Re-upload Requested'
      : dataProgress?.all_uploaded
      ? 'Waiting for Data Manager Approval'
      : 'Waiting for Field Uploads'
  const statusColor = dataProgress?.data_manager_approved
    ? { bg: '#DCFCE7', text: '#047857', border: '#BBF7D0' }
    : dataProgress?.workflow_status === 'reupload_requested'
      ? { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' }
    : dataProgress?.all_uploaded
      ? { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' }
      : { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' }

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] bg-white p-8 shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-gray-50"
              style={{ borderColor: '#E5E7EB' }}
              title="Go back"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: '#7C3AED' }}>
                Event Coordinator
              </p>
              <h1 className="text-2xl font-bold mt-1" style={{ color: '#111827' }}>Event Setup</h1>
              <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                Manage event assignments and schedule without using the CRM pre-production flow.
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: '#5B5FC7' }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Event Setup'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard title="Client Summary">
          <div className="space-y-3">
            <div className="rounded-2xl p-4" style={{ background: '#F9FAFB' }}>
              <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Client</p>
              <p className="text-sm font-bold mt-1" style={{ color: '#111827' }}>{client.name}</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#F9FAFB' }}>
                <CalendarDays size={16} style={{ color: '#5B5FC7' }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Event Date</p>
                  <p className="text-sm font-semibold" style={{ color: '#111827' }}>{client.eventDate || '—'}</p>
                </div>
              </div>
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#F9FAFB' }}>
                <Users size={16} style={{ color: '#5B5FC7' }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Event Type</p>
                  <p className="text-sm font-semibold" style={{ color: '#111827' }}>{client.shootType || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="lg:col-span-2">
          <SectionCard title="Event Crew">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <EmployeePicker
                label="Photographer"
                value={teamState.photographer}
                placeholder="Select photographer"
                options={photographers}
                onChange={(value) => setField('photographer', value)}
                icon={<Camera size={16} style={{ color: '#64748B' }} />}
              />
              <EmployeePicker
                label="Videographer"
                value={teamState.videographer}
                placeholder="Select videographer"
                options={videographers}
                onChange={(value) => setField('videographer', value)}
                icon={<Video size={16} style={{ color: '#64748B' }} />}
              />
              <EmployeePicker
                label="Secondary Photographer (Optional)"
                value={teamState.secondary_photographer}
                placeholder="Select secondary photographer"
                options={photographers}
                onChange={(value) => setField('secondary_photographer', value)}
                icon={<Camera size={16} style={{ color: '#64748B' }} />}
              />
              <EmployeePicker
                label="Secondary Videographer (Optional)"
                value={teamState.secondary_videographer}
                placeholder="Select secondary videographer"
                options={videographers}
                onChange={(value) => setField('secondary_videographer', value)}
                icon={<Video size={16} style={{ color: '#64748B' }} />}
              />
              <EmployeePicker
                label="Drone Operator (Optional)"
                value={teamState.drone}
                placeholder="Select drone operator"
                options={drones}
                onChange={(value) => setField('drone', value)}
                icon={<Users size={16} style={{ color: '#64748B' }} />}
              />
              <TagInput
                label="Additional Staff"
                tags={additionalStaff}
                onAdd={(value) => setAdditionalStaff(prev => [...prev, value])}
                onRemove={removeAdditionalStaff}
                icon={<Users size={16} style={{ color: '#64748B' }} />}
              />
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Event Data Progress">
        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-5">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold" style={{ color: '#111827' }}>
                  {dataProgress?.uploaded_count || 0} of {dataProgress?.required_count || 0} required uploads completed
                </p>
                <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                  Photographer, videographer and drone uploads are tracked against the assigned crew.
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold"
                style={{ background: statusColor.bg, color: statusColor.text, borderColor: statusColor.border }}
              >
                {dataProgress?.data_manager_approved ? <CheckCircle2 size={13} /> : <UploadCloud size={13} />}
                {statusLabel}
              </span>
            </div>

            <div className="mb-4 h-2 overflow-hidden rounded-full" style={{ background: '#EEF2F7' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progressPercent}%`, background: dataProgress?.data_manager_approved ? '#10B981' : '#5B5FC7' }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(dataProgress?.uploads || []).map((item) => (
                <div key={item.key} className="rounded-2xl border p-4" style={{ borderColor: '#E5E7EB', background: '#F9FAFB' }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold" style={{ color: '#111827' }}>{item.label}</p>
                    <span
                      className="rounded-full px-2 py-1 text-[10px] font-bold"
                      style={{
                        background: item.uploaded ? '#DCFCE7' : '#FEF3C7',
                        color: item.uploaded ? '#047857' : '#B45309',
                      }}
                    >
                      {item.uploaded ? 'Uploaded' : 'Pending'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs" style={{ color: '#6B7280' }}>
                    {getEmployeeLabel(item.employee_id || '')}
                  </p>
                  {item.upload_link && (
                    <a
                      href={item.upload_link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-xs font-semibold"
                      style={{ color: '#5B5FC7' }}
                    >
                      Open uploaded data
                    </a>
                  )}
                </div>
              ))}
              {(!dataProgress || dataProgress.uploads.length === 0) && (
                <div className="rounded-2xl border p-4 text-sm" style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>
                  Assign the event crew to start upload tracking.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ borderColor: '#E5E7EB', background: '#FFFFFF' }}>
            <p className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: '#5B5FC7' }}>
              Next Handoff
            </p>
            <div className="mt-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: '#EEF2FF', color: '#5B5FC7' }}>
                <ArrowRight size={18} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: '#111827' }}>
                  {dataProgress?.next_path || 'Field Team -> Upload Raw Data'}
                </p>
                <p className="mt-1 text-xs leading-5" style={{ color: '#6B7280' }}>
                  {dataProgress?.data_manager_approved
                    ? 'Data Manager has approved the raw data. CRM can now review raw data/QC and continue the next workflow step.'
                    : dataProgress?.workflow_status === 'reupload_requested'
                      ? 'Data Manager requested a re-upload. The field team must correct and submit the required data again before approval.'
                    : dataProgress?.all_uploaded
                      ? 'All required uploads are complete. Waiting for Data Manager to verify and approve the raw data.'
                      : 'The handoff will unlock after every assigned event role submits its required upload.'}
                </p>
                <p className="mt-3 text-xs font-semibold" style={{ color: '#374151' }}>
                  Data Manager status: {dataProgress?.media_status || 'Pending'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Event Schedule">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <FieldLabel>Event Date</FieldLabel>
            <InputShell>
              <div className="flex items-center gap-2">
                <CalendarDays size={15} style={{ color: '#9CA3AF' }} />
                <input
                  type="date"
                  value={teamState.event_date}
                  onChange={(e) => setField('event_date', e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </InputShell>
          </div>
          <div>
            <FieldLabel>Event Time</FieldLabel>
            <InputShell>
              <div className="flex items-center gap-2">
                <Clock3 size={15} style={{ color: '#9CA3AF' }} />
                <input
                  type="time"
                  value={teamState.event_time}
                  onChange={(e) => setField('event_time', e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </InputShell>
          </div>
          <div>
            <FieldLabel>Outdoor Location</FieldLabel>
            <InputShell>
              <div className="flex items-center gap-2">
                <MapPin size={15} style={{ color: '#9CA3AF' }} />
                <input
                  type="text"
                  value={teamState.location}
                  onChange={(e) => setField('location', e.target.value)}
                  placeholder="Enter venue/location"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </InputShell>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
