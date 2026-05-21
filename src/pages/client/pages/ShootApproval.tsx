import { useState, useEffect } from 'react'
import { CheckCircle, Clock, Camera, Film, AlertTriangle, Check } from 'lucide-react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'

interface AssignedTeam {
  photographer: string
  videographer: string
  photographer_name?: string
  videographer_name?: string
  shoot_locations?: Array<{
    label?: string
    link?: string
    time?: string
    concept?: string
  }>
}

interface PhaseInfo {
  external_id: string
  lead_name: string
  flow_type: string
  current_phase: string
  phase_status: string
  pre_production_step: string
}

export default function ShootApproval() {
  const { leadId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [phaseInfo, setPhaseInfo] = useState<PhaseInfo | null>(null)
  const [assignedTeam, setAssignedTeam] = useState<AssignedTeam | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!leadId) return
      try {
        setLoading(true)
        const [phaseRes, teamRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/crm/leads/${leadId}/phase-info`),
          axios.get(`${import.meta.env.VITE_API_URL}/assign-team/${leadId}`)
        ])
        setPhaseInfo(phaseRes.data?.data)
        setAssignedTeam(teamRes.data?.data)
      } catch (err) {
        console.error('Failed to fetch data', err)
        setError('Unable to load shoot details')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [leadId])

  const handleApproveShoot = async () => {
    if (!leadId) return
    try {
      setApproving(true)
      await axios.patch(`${import.meta.env.VITE_API_URL}/crm/leads/${leadId}/approve-shoot-phase`)
      navigate('/client/dashboard')
    } catch (err: any) {
      console.error('Approval failed', err)
      setError(err?.response?.data?.message || 'Failed to approve shoot phase')
    } finally {
      setApproving(false)
    }
  }

  const isShootStep = phaseInfo?.pre_production_step === 'shoot'
  const isEditingStep = phaseInfo?.pre_production_step === 'editing'

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-32 bg-slate-200 rounded" />
          <div className="h-16 bg-slate-200 rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3">
          <AlertTriangle className="text-red-500" size={24} />
          <div>
            <p className="font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // If already in editing step, show completion message
  if (isEditingStep) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-emerald-800 mb-2">Shoot Phase Approved</h2>
          <p className="text-emerald-600 mb-4">
            Your shoot has been approved. The editing team is now working on your deliverables.
          </p>
          <button
            onClick={() => navigate('/client/dashboard')}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // If not in shoot step, redirect
  if (!isShootStep) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <p className="text-amber-800">
            The shoot phase is not yet ready for approval. Please check back later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Approve Shoot Phase</h1>
        <p className="text-slate-500 mt-1">Review and approve your shoot team assignment</p>
      </div>

      {/* Project Info */}
      {phaseInfo && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <Camera className="text-indigo-600" size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-900">{phaseInfo.lead_name}</p>
              <p className="text-sm text-slate-500">Project ID: {phaseInfo.external_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
              Phase 1 of 2: Shooting
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
              Awaiting Your Approval
            </span>
          </div>
        </div>
      )}

      {/* Assigned Team */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Assigned Shoot Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Camera className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Photographer</p>
              <p className="font-semibold text-slate-900">
                {assignedTeam?.photographer_name || assignedTeam?.photographer || 'Not assigned'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Film className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Videographer</p>
              <p className="font-semibold text-slate-900">
                {assignedTeam?.videographer_name || assignedTeam?.videographer || 'Not assigned'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shoot Locations */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Shoot Locations</h2>
        {assignedTeam?.shoot_locations && assignedTeam.shoot_locations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedTeam.shoot_locations.map((location, index) => (
              <div key={index} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Location {index + 1}</p>
                <p className="font-semibold text-slate-900">
                  {location.label || `Location ${index + 1}`}
                </p>
                {location.time && (
                  <p className="mt-2 text-sm font-medium text-slate-700">Time: {location.time}</p>
                )}
                {location.concept && (
                  <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{location.concept}</p>
                )}
                {location.link && (
                  <a
                    href={location.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    View Location
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-500">
            No shoot locations assigned yet.
          </div>
        )}
      </div>

      {/* Approval Info */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <Clock className="text-indigo-600 mt-1" size={24} />
          <div>
            <h3 className="font-bold text-indigo-900">What happens next?</h3>
            <ul className="mt-2 space-y-2 text-sm text-indigo-700">
              <li className="flex items-center gap-2">
                <Check size={16} className="text-indigo-500" />
                <span>Your shoot team will be confirmed</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-indigo-500" />
                <span>The team will proceed with the shoot as planned</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-indigo-500" />
                <span>After the shoot, the editing team will be assigned</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/client/dashboard')}
          className="flex-1 py-3 px-6 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
        >
          Review Later
        </button>
        <button
          onClick={handleApproveShoot}
          disabled={approving}
          className="flex-1 py-3 px-6 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {approving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Approving...
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              Approve Shoot Team
            </>
          )}
        </button>
      </div>
    </div>
  )
}
