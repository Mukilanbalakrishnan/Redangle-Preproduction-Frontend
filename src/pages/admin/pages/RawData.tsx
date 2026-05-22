import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, Eye, Search, Download, Pencil, Trash } from 'lucide-react'
import axios from 'axios'
import RawDataView from '../../data-manager/pages/RawDataView'

const statusColors: Record<string, { bg: string; text: string }> = {
  Pending: { bg: '#FEF3C7', text: '#D97706' },
  Verified: { bg: '#D1FAE5', text: '#059669' },
  Reupload_Requested: { bg: '#FEE2E2', text: '#DC2626' },
  crm_verified: { bg: '#DBEAFE', text: '#1D4ED8' },
  Pending_Verification: { bg: '#FEF3C7', text: '#D97706' },
}

export default function AdminRawData() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [view, setView] = useState<'list' | 'view'>('list')
  const [selectedData, setSelectedData] = useState<any | null>(null)
  const [rawData, setRawData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [editData, setEditData] = useState<any | null>(null);
  const [deleteData, setDeleteData] = useState<string | null>(null);

  const handleEditSave = async () => {
    if (!editData) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      await axios.put(`${API_URL}/data-manager/incoming/${editData.id}`, {
        num_images: parseInt(editData.images, 10),
        num_videos: parseInt(editData.videos, 10)
      });
      setRawData(prev => prev.map(d => d.id === editData.id ? { ...d, images: parseInt(editData.images, 10) || 0, videos: parseInt(editData.videos, 10) || 0 } : d));
      setEditData(null);
    } catch (err) {
      console.error("Failed to update raw data", err);
      alert("Failed to update raw data");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      await axios.delete(`${API_URL}/data-manager/incoming/${id}`);
      setRawData(prev => prev.filter(d => d.id !== id));
      setDeleteData(null);
    } catch (err) {
      console.error("Failed to delete raw data", err);
      alert("Failed to delete raw data");
    }
  };

  const statuses = ['All Status', 'Pending', 'Verified', 'crm_verified', 'Pending_Verification', 'Reupload_Requested']

  const fetchData = async () => {
    setLoading(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
      const res = await axios.get(`${API_URL}/data-manager/incoming`)
      if (res.data?.success) {
        const mappedData = res.data.data.map((item: any) => ({
          id: String(item.id),
          photographer: item.photographer || null,
          videographer: item.videographer || null,
          drone: item.drone || null,
          client: item.client,
          date: item.date || '—',
          images: (item.num_images || 0) + (item.drone_num_images || 0),
          videos: (item.num_videos || 0) + (item.drone_num_videos || 0),
          status: item.status || 'Pending',
          rawData: item
        }))
        setRawData(mappedData)
      }
    } catch (err) {
      console.error('Error fetching raw data for admin:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = rawData.filter(d => {
    const matchesSearch =
      (d.photographer?.toLowerCase().includes(search.toLowerCase()) || '') ||
      (d.videographer?.toLowerCase().includes(search.toLowerCase()) || '') ||
      (d.drone?.toLowerCase().includes(search.toLowerCase()) || '') ||
      d.client.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All Status' || d.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDownloadReport = () => {
    if (filtered.length === 0) return;

    const headers = ['ID', 'Employee', 'Role', 'Client', 'Date', 'Images', 'Videos', 'Status'];
    const csvRows = filtered.map(row => [
      row.id, row.employee, row.role, row.client, row.date, row.images, row.videos, row.status.replace('_', ' ')
    ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(","));

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const d = new Date();
    const dateStr = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;

    link.setAttribute("href", url);
    link.setAttribute("download", `raw_data_${dateStr}.csv`);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-10 text-gray-500">Loading raw data...</div>
  }

  if (view === 'view' && selectedData) {
    return (
      <RawDataView
        data={selectedData}
        onBack={() => { setView('list'); fetchData() }}
        apiBasePath="/data-manager"
        isCrmContext={true}
        onCrmVerify={(leadId, clientName) => navigate('/admin/assign-editor', { state: { lead_id: leadId, client: clientName } })}
      />
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database size={20} className="text-indigo-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Raw Data</h1>
            <p className="text-sm text-gray-500 mt-0.5">View verified and pending raw data from field team</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 w-80 shadow-sm">
          <Search size={15} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, employee or client..."
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
              {statuses.map(opt => <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>)}
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
              <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Employee</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Client</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Event Date</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Files</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Status</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={row.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                <td className="px-6 py-4 text-sm font-bold text-indigo-600">{row.id}</td>
                <td className="px-6 py-4">
                  {row.photographer && (
                    <div className="mb-2">
                      <p className="text-sm font-semibold text-gray-900">{row.photographer}</p>
                      <p className="text-xs text-gray-400">Photographer</p>
                    </div>
                  )}
                                    {row.videographer && (
                    <div className={row.drone ? 'mb-2' : ''}>
                      <p className="text-sm font-semibold text-gray-900">{row.videographer}</p>
                      <p className="text-xs text-gray-400">Videographer</p>
                    </div>
                  )}
                  {row.drone && (
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{row.drone}</p>
                      <p className="text-xs text-gray-400">Drone</p>
                    </div>
                  )}
                  {!row.photographer && !row.videographer && !row.drone && (
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Unknown</p>
                      <p className="text-xs text-gray-400">Media</p>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{row.client}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{row.date}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  <span className="mr-2">📷 {row.images}</span>
                  <span>🎬 {row.videos}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: statusColors[row.status]?.bg ?? '#F3F4F6', color: statusColors[row.status]?.text ?? '#6B7280' }}
                  >
                    {row.status?.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setSelectedData(row); setView('view') }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                      title="View Data"
                    >
                      <Eye size={14} /> View
                    </button>
                    <button
                      onClick={() => setEditData(row)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Edit Data"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteData(row.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete Data"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                  No raw data records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {editData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[400px]">
            <h2 className="text-lg font-bold mb-4 text-gray-900">Edit Raw Data</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Number of Images</label>
                <input type="number" className="w-full border rounded-lg p-2 text-sm outline-none focus:border-indigo-500" value={editData.images} onChange={e => setEditData({ ...editData, images: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Number of Videos</label>
                <input type="number" className="w-full border rounded-lg p-2 text-sm outline-none focus:border-indigo-500" value={editData.videos} onChange={e => setEditData({ ...editData, videos: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="px-4 py-2 text-sm font-medium border rounded-lg" onClick={() => setEditData(null)}>Cancel</button>
              <button className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors" style={{ background: '#5B5FC7' }} onClick={handleEditSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {deleteData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[400px]">
            <h2 className="text-lg font-bold mb-2 text-gray-900">Delete Raw Data?</h2>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this raw data record? This action cannot be undone and will remove associated media links.</p>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 text-sm font-medium border rounded-lg" onClick={() => setDeleteData(null)}>Cancel</button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors" onClick={() => handleDelete(deleteData)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
