import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, User, Calendar } from 'lucide-react'
import axios from 'axios'

const statusColors: Record<string, { bg: string; text: string }> = {
  Pending: { bg: '#FEF3C7', text: '#D97706' },
  'In Progress': { bg: '#DBEAFE', text: '#1D4ED8' },
  Completed: { bg: '#E0E7FF', text: '#4338CA' },
  Approved: { bg: '#D1FAE5', text: '#059669' },
  Rework: { bg: '#FEE2E2', text: '#DC2626' },
}

const typeIcons: Record<string, { emoji: string; gradient: string }> = {
  'Save the Date': { emoji: '📸', gradient: 'linear-gradient(135deg, #EC4899, #F472B6)' },
  'Save the Video': { emoji: '🎬', gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' },
  'Candid': { emoji: '📷', gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)' },
  'Retouching': { emoji: '🎨', gradient: 'linear-gradient(135deg, #10B981, #34D399)' },
}

const cardTypes = ['Save the Date', 'Save the Video', 'Candid', 'Retouching']

export default function EventCoordinatorEditApprovalDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [projectName, setProjectName] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
      const res = await axios.get(`${API_URL}/employee-projects/project/${projectId}`)
      if (res.data?.success) {
        setAssignments(res.data.data)
        if (res.data.data.length > 0) {
          setProjectName(res.data.data[0].project_name)
        }
      }
    } catch (err) {
      console.error('Error fetching project assignments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) fetchData()
  }, [projectId])

  const getAssignmentForType = (type: string) => {
    return assignments.find(a => a.project_type === type) || null
  }

  if (loading) {
    return <div className="p-10 text-gray-500">Loading project details...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/event-coordinator/edit-approval')}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to Edit Approval
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{projectName || 'Project Details'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Project ID: {projectId}</p>
        </div>
      </div>

      {/* Four Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cardTypes.map(type => {
          const assignment = getAssignmentForType(type)
          const typeInfo = typeIcons[type]
          const status = assignment?.status || 'Not Assigned'
          const colors = statusColors[status]

          return (
            <div
              key={type}
              onClick={() => assignment && navigate(`/event-coordinator/edit-approval/${projectId}/${encodeURIComponent(type)}`)}
              className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 ${assignment ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
            >
              {/* Card Header with gradient */}
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ background: typeInfo.gradient }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeInfo.emoji}</span>
                  <h3 className="text-base font-bold text-white">{type}</h3>
                </div>
                {assignment && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: 'rgba(255,255,255,0.9)',
                      color: colors?.text ?? '#6B7280',
                    }}
                  >
                    {status}
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-6">
                {assignment ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                        <User size={16} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Assigned to</p>
                        <p className="text-sm font-semibold text-gray-900">{assignment.employee_name || assignment.employee_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                        <Calendar size={16} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Last Updated</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {assignment.updated_at ? new Date(assignment.updated_at).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Clock size={20} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-400">Not Assigned</p>
                    <p className="text-xs text-gray-300 mt-1">No editor assigned for this type yet</p>
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
