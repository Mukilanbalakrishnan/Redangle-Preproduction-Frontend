import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckSquare, Eye, Search, Download } from 'lucide-react'
import axios from 'axios'

export default function AdminClientApproval() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
      const res = await axios.get(`${API_URL}/employee-projects/approved-clients`)
      if (res.data?.success) {
        setClients(res.data.data)
      }
    } catch (err) {
      console.error('Error fetching approved clients:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = clients.filter(d => {
    const matchesSearch =
      (d.project_name?.toLowerCase().includes(search.toLowerCase())) ||
      (d.project_id?.toLowerCase().includes(search.toLowerCase()))
    return matchesSearch
  })

  const handleDownloadReport = () => {
    if (filtered.length === 0) return

    const headers = ['Project ID', 'Client Name', 'Approved Links Count', 'Latest Approval']
    const csvRows = filtered.map(row => [
      row.project_id, row.project_name, row.link_count, 
      row.latest_approval ? new Date(row.latest_approval).toLocaleDateString() : '—'
    ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(","))

    const csvContent = [headers.join(","), ...csvRows].join("\n")
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    const d = new Date()
    const dateStr = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`

    link.setAttribute("href", url)
    link.setAttribute("download", `client_approval_${dateStr}.csv`)
    link.style.display = "none"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return <div className="p-10 text-gray-500">Loading client approval data...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <CheckSquare size={20} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Client Approval</h1>
            <p className="text-sm text-gray-500 mt-0.5">Review approved deliverables and send to clients</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 w-80 shadow-sm">
          <Search size={15} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by client name or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
          />
        </div>
        <div className="flex items-center gap-3">
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
              <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Client</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Approved Links</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Latest Approval</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={row.project_id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-gray-900">{row.project_name}</p>
                  <p className="text-xs text-gray-400">{row.project_id}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: '#E0E7FF', color: '#4338CA' }}>
                    {row.link_count} Deliverables
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {row.latest_approval ? new Date(row.latest_approval).toLocaleString() : '—'}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => navigate(row.project_id.toString())}
                    className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg"
                  >
                    <Eye size={14} /> View Deliverables
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-400">
                  No approved clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
