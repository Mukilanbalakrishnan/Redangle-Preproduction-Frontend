import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Calendar, Check, RotateCcw, FileText, Link2, Clock } from 'lucide-react'
import axios from 'axios'

const statusColors: Record<string, { bg: string; text: string }> = {
  Pending: { bg: '#FEF3C7', text: '#D97706' },
  'In Progress': { bg: '#DBEAFE', text: '#1D4ED8' },
  Completed: { bg: '#E0E7FF', text: '#4338CA' },
  Approved: { bg: '#D1FAE5', text: '#059669' },
  Rework: { bg: '#FEE2E2', text: '#DC2626' },
}

const typeConfig: Record<string, { emoji: string; gradient: string; color: string }> = {
  'Save the Date': { emoji: '📸', gradient: 'linear-gradient(135deg, #EC4899, #F472B6)', color: '#EC4899' },
  'Save the Video': { emoji: '🎬', gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', color: '#8B5CF6' },
  'Candid': { emoji: '📷', gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)', color: '#F59E0B' },
  'Retouching': { emoji: '🎨', gradient: 'linear-gradient(135deg, #10B981, #34D399)', color: '#10B981' },
  'Traditional Video Editing': { emoji: '🎞️', gradient: 'linear-gradient(135deg, #4F46E5, #818CF8)', color: '#4F46E5' },
  'Retouch Editing': { emoji: '📷', gradient: 'linear-gradient(135deg, #0891B2, #22D3EE)', color: '#0891B2' },
  'Album Design': { emoji: '🖼️', gradient: 'linear-gradient(135deg, #7C3AED, #A78BFA)', color: '#7C3AED' },
  'Candid Video Editing': { emoji: '🎥', gradient: 'linear-gradient(135deg, #DB2777, #F472B6)', color: '#DB2777' },
}

interface Props {
  basePath: string
}

export default function EditApprovalView({ basePath }: Props) {
  const { projectId, projectType } = useParams<{ projectId: string; projectType: string }>()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [projectName, setProjectName] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const decodedType = decodeURIComponent(projectType || '')

  const fetchData = async () => {
    setLoading(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
      const res = await axios.get(`${API_URL}/employee-projects/project/${projectId}`)
      if (res.data?.success) {
        const all = res.data.data
        if (all.length > 0) {
          setProjectName(all[0].project_name)
        }
        const found = all.find((a: any) => a.project_type === decodedType)
        setAssignment(found || null)
      }
    } catch (err) {
      console.error('Error fetching assignment:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId && projectType) fetchData()
  }, [projectId, projectType])

  const handleReview = async (status: 'Approved' | 'Rework') => {
    if (!assignment) return
    setSubmitting(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
      await axios.put(`${API_URL}/employee-projects/${assignment.id}/review`, {
        status,
        admin_notes: reviewNotes
      })
      fetchData()
      setReviewNotes('')
    } catch (err) {
      console.error('Failed to review:', err)
      alert('Failed to update review status')
    } finally {
      setSubmitting(false)
    }
  }

  const config = typeConfig[decodedType] || { emoji: '📋', gradient: 'linear-gradient(135deg, #6B7280, #9CA3AF)', color: '#6B7280' }

  if (loading) {
    return <div className="p-10 text-gray-500">Loading approval details...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{decodedType} Approval</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Lead ID: {projectId?.replace('CRM-', '')} · Client: {projectName}
          </p>
        </div>
        <button
          onClick={() => navigate(`${basePath}/edit-approval/${projectId}`)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {assignment ? (
        <>
          {/* Info Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Employee Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: config.color + '20' }}>
                  <User size={16} style={{ color: config.color }} />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Employee Details</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50">
                    <User size={15} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Employee</p>
                    <p className="text-sm font-bold text-gray-900">{assignment.employee_name || assignment.employee_id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50">
                    <FileText size={15} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Project Type</p>
                    <p className="text-sm font-bold text-gray-900">{decodedType}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status & Dates Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: config.color + '20' }}>
                  <Clock size={16} style={{ color: config.color }} />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Status & Timeline</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50">
                    <Clock size={15} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Current Status</p>
                    <span
                      className="inline-block mt-0.5 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: statusColors[assignment.status]?.bg ?? '#F3F4F6',
                        color: statusColors[assignment.status]?.text ?? '#6B7280'
                      }}
                    >
                      {assignment.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50">
                    <Calendar size={15} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Last Updated</p>
                    <p className="text-sm font-bold text-gray-900">
                      {assignment.updated_at ? new Date(assignment.updated_at).toLocaleString() : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Notes & Drive Links Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Admin Notes / Feedback */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Upload Notes</h3>
              {assignment.admin_notes ? (
                <div className="rounded-xl px-4 py-3" style={{ background: '#FEF9C3' }}>
                  <p className="text-sm text-gray-700">{assignment.admin_notes}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No notes available</p>
              )}
            </div>

            {/* Upload / Drive Links */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Drive Links</h3>
              {assignment.upload_link ? (
                <a
                  href={assignment.upload_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-colors border-2 hover:shadow-sm"
                  style={{ borderColor: config.color, color: config.color }}
                >
                  <Link2 size={16} /> View Uploaded Work
                </a>
              ) : (
                <p className="text-sm text-gray-400 italic">No upload link submitted yet</p>
              )}
            </div>
          </div>

          {/* Review & Feedback */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Review & Feedback</h3>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-400 resize-none"
              rows={3}
              placeholder="Add feedback or notes for the editor (optional)..."
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleReview('Approved')}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl transition-colors shadow-sm disabled:opacity-50"
              style={{ background: '#059669' }}
            >
              <Check size={16} /> Verify Files & continue
            </button>
            <button
              onClick={() => handleReview('Rework')}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl transition-colors border-2 disabled:opacity-50"
              style={{ borderColor: '#DC2626', color: '#DC2626' }}
            >
              <RotateCcw size={16} /> Request Re-Upload
            </button>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FileText size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-400">No assignment found for this project type</p>
          <p className="text-xs text-gray-300 mt-1">This type hasn't been assigned to an editor yet</p>
        </div>
      )}
    </div>
  )
}
