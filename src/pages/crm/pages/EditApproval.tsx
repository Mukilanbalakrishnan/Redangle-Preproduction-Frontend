import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardEdit, Eye, Search, Download, Check, RotateCcw, ExternalLink } from 'lucide-react'
import axios from 'axios'

const statusColors: Record<string, { bg: string; text: string }> = {
  Pending: { bg: '#FEF3C7', text: '#D97706' },
  'In Progress': { bg: '#DBEAFE', text: '#1D4ED8' },
  Completed: { bg: '#E0E7FF', text: '#4338CA' },
  Approved: { bg: '#D1FAE5', text: '#059669' },
  Rework: { bg: '#FEE2E2', text: '#DC2626' },
}

export default function CRMEditApproval() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [reviewData, setReviewData] = useState<any | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  const statuses = ['All Status', 'Pending', 'In Progress', 'Completed', 'Approved', 'Rework']

  const fetchData = async () => {
    setLoading(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
      const res = await axios.get(`${API_URL}/employee-projects/all`)
      if (res.data?.success) {
        setProjects(res.data.data)
      }
    } catch (err) {
      console.error('Error fetching edit approval data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = projects.filter(d => {
    const matchesSearch =
      (d.project_name?.toLowerCase().includes(search.toLowerCase())) ||
      (d.employee_name?.toLowerCase().includes(search.toLowerCase())) ||
      (d.project_id?.toLowerCase().includes(search.toLowerCase())) ||
      (d.project_type?.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === 'All Status' || d.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleReview = async (id: number, status: 'Approved' | 'Rework') => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
      await axios.put(`${API_URL}/employee-projects/${id}/review`, {
        status,
        admin_notes: reviewNotes
      })
      setReviewData(null)
      setReviewNotes('')
      fetchData()
    } catch (err) {
      console.error('Failed to review project:', err)
      alert('Failed to update review status')
    }
  }

  const handleDownloadReport = () => {
    if (filtered.length === 0) return

    const headers = ['ID', 'Project ID', 'Project Name', 'Type', 'Employee', 'Status', 'Upload Link', 'Admin Notes', 'Updated At']
    const csvRows = filtered.map(row => [
      row.id, row.project_id, row.project_name, row.project_type || '—',
      row.employee_name || row.employee_id, row.status,
      row.upload_link || '—', row.admin_notes || '—',
      row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '—'
    ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(","))

    const csvContent = [headers.join(","), ...csvRows].join("\n")
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    const d = new Date()
    const dateStr = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`

    link.setAttribute("href", url)
    link.setAttribute("download", `edit_approval_${dateStr}.csv`)
    link.style.display = "none"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return <div className="p-10 text-gray-500">Loading edit approval data...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardEdit size={20} className="text-indigo-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Approval</h1>
            <p className="text-sm text-gray-500 mt-0.5">Review and approve editor submissions</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 w-80 shadow-sm">
          <Search size={15} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by project, employee or type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative shadow-sm rounded-xl">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="flex items-center gap-1 pl-4 pr-10 py-2.5 text-sm font-medium cursor-pointer appearance-none outline-none bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              style={{ color: '#4B5563' }}
            >
              {statuses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
          <button
            onClick={handleDownloadReport}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={15} /> Download report
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">ID</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Project</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Type</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Employee</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Updated</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Status</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={row.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                <td className="px-6 py-4 text-sm font-bold text-indigo-600">{row.id}</td>
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-gray-900">{row.project_name}</p>
                  <p className="text-xs text-gray-400">{row.project_id}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{row.project_type || '—'}</td>
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-gray-900">{row.employee_name || row.employee_id}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-6 py-4">
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: statusColors[row.status]?.bg ?? '#F3F4F6', color: statusColors[row.status]?.text ?? '#6B7280' }}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/crm/edit-approval/${row.project_id}`)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                      title="View Details"
                    >
                      <Eye size={14} /> View
                    </button>
                    {(row.status === 'Completed') && (
                      <button
                        onClick={() => { setReviewData(row); setReviewNotes('') }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
                        title="Review"
                      >
                        <Check size={14} /> Review
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                  No edit approval records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {reviewData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[450px]">
            <h2 className="text-lg font-bold mb-2 text-gray-900">Review Submission</h2>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-medium text-gray-700">{reviewData.project_name}</span> by{' '}
              <span className="font-medium text-gray-700">{reviewData.employee_name || reviewData.employee_id}</span>
            </p>
            {reviewData.upload_link && (
              <a
                href={reviewData.upload_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
              >
                <ExternalLink size={14} /> View Uploaded Work
              </a>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea
                className="w-full border rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 resize-none"
                rows={3}
                placeholder="Add feedback or notes for the editor..."
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 text-sm font-medium border rounded-lg" onClick={() => setReviewData(null)}>Cancel</button>
              <button
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
                onClick={() => handleReview(reviewData.id, 'Rework')}
              >
                <RotateCcw size={14} /> Request Rework
              </button>
              <button
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                style={{ background: '#059669' }}
                onClick={() => handleReview(reviewData.id, 'Approved')}
              >
                <Check size={14} /> Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
