import { useState, useEffect } from 'react'
import { Search, ChevronDown, Filter, Eye, Pencil, Trash } from 'lucide-react'
import axios from 'axios'
import RawDataView from '../../data-manager/pages/RawDataView'
import AssignTeam from '../../../ClientFlow/AssignTeam'
import RawDataDelivery from './RawDataDelivery'

type RawDataWorkflowPhase = 'pre_production' | 'event' | 'post_production' | 'all'

interface RawDataProps {
  workflowPhase?: RawDataWorkflowPhase
  title?: string
  description?: string
}

const estimateRawDataSize = (item: any) => {
  const images = (item.num_images || 0) + (item.drone_num_images || 0)
  const videos = (item.num_videos || 0) + (item.drone_num_videos || 0)
  const totalGB = (images * 0.05) + (videos * 0.5)
  return totalGB.toFixed(1) + ' GB'
}

const normalizeStatus = (status?: string | null) => String(status || 'Pending').trim()

const getCrmStatusMeta = (status?: string | null) => {
  const normalized = normalizeStatus(status).toLowerCase()

  if (normalized === 'crm_verified') {
    return {
      label: 'CRM Verified',
      className: 'bg-blue-100 text-blue-700',
      crmVerified: true,
    }
  }

  if (normalized === 'verified') {
    return {
      label: 'Ready for CRM Review',
      className: 'bg-indigo-100 text-indigo-700',
      crmVerified: false,
    }
  }

  if (normalized === 'pending_verification') {
    return {
      label: 'DM Review Pending',
      className: 'bg-orange-100 text-orange-700',
      crmVerified: false,
    }
  }

  if (normalized === 'reupload_requested') {
    return {
      label: 'Re-upload Requested',
      className: 'bg-yellow-100 text-yellow-700',
      crmVerified: false,
    }
  }

  if (normalized === 'rejected') {
    return {
      label: 'Rejected',
      className: 'bg-red-100 text-red-700',
      crmVerified: false,
    }
  }

  return {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-600',
    crmVerified: false,
  }
}

export default function RawData({
  workflowPhase = 'all',
  title,
  description,
}: RawDataProps = {}) {

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [view, setView] = useState<'list' | 'view' | 'assignTeam' | 'sendDelivery'>('list')
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

  const statuses = ['All Status', 'Pending', 'Ready for CRM Review', 'CRM Verified', 'DM Review Pending', 'Re-upload Requested', 'Rejected']

  const fetchData = async () => {
    setLoading(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
      const res = await axios.get(`${API_URL}/data-manager/incoming`)
      if (res.data?.success) {
        const mappedData = res.data.data.map((item: any) => ({
          id: String(item.id),
          serialNumber: item.lead_serial_number || String(item.id),
          employee: item.photographer ? item.photographer : (item.videographer ? item.videographer : (item.drone ? item.drone : 'Unknown')),
          role: item.photographer && item.videographer && item.drone
            ? 'Photo, Video & Drone'
            : item.photographer && item.videographer
              ? 'Photo & Video'
              : item.photographer && item.drone
                ? 'Photo & Drone'
                : item.videographer && item.drone
                  ? 'Video & Drone'
                  : (item.photographer ? 'Photographer' : (item.videographer ? 'Videographer' : (item.drone ? 'Drone' : 'Employee'))),
          photographer: item.photographer || null,
          videographer: item.videographer || null,
          drone: item.drone || null,
          client: item.client || 'Unknown Client',
          date: item.date || 'TBD',
          images: (item.num_images || 0) + (item.drone_num_images || 0),
          videos: (item.num_videos || 0) + (item.drone_num_videos || 0),
          size: estimateRawDataSize(item),
          status: normalizeStatus(item.status),
          statusMeta: getCrmStatusMeta(item.status),
          currentPhase: item.current_phase || '',
          preProductionStep: item.pre_production_step || 'shoot',
          rawData: item
        }))
        setRawData(mappedData)
      }
    } catch (err) {
      console.error('Error fetching raw data for CRM:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = rawData.filter(d => {
    const matchesSearch =
      d.employee.toLowerCase().includes(search.toLowerCase()) ||
      (d.drone?.toLowerCase().includes(search.toLowerCase()) || false) ||
      d.client.toLowerCase().includes(search.toLowerCase()) ||
      d.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All Status' || d.statusMeta.label === statusFilter

    let phaseMatch = true
    if (workflowPhase !== 'all') {
      const phase = (d.currentPhase || 'pre_production').toLowerCase()
      phaseMatch = phase === workflowPhase
    }

    return matchesSearch && matchesStatus && phaseMatch
  })

  if (view === 'view' && selectedData) {
    const raw = selectedData.rawData || {}
    const phase = String(raw.current_phase || '').trim().toLowerCase()
    const isEventPhase = phase === 'event'
    const detailData = {
      id: selectedData.id,
      serialNumber: selectedData.serialNumber,
      rawId: selectedData.id,
      photographer: selectedData.photographer,
      videographer: selectedData.videographer,
      drone: isEventPhase ? selectedData.drone : null,
      client: selectedData.client,
      date: selectedData.date,
      status: raw.status || raw.media_status || selectedData.status,
      numImages: (raw.num_images || 0) + (isEventPhase ? (raw.drone_num_images || 0) : 0),
      numVideos: (raw.num_videos || 0) + (isEventPhase ? (raw.drone_num_videos || 0) : 0),
      droneImages: isEventPhase ? (raw.drone_num_images || 0) : 0,
      droneVideos: isEventPhase ? (raw.drone_num_videos || 0) : 0,
      drive_link: raw.drive_link,
      video_drive_link: raw.video_drive_link,
      drone_photo_drive_link: raw.drone_photo_drive_link,
      drone_video_drive_link: raw.drone_video_drive_link,
      currentPhase: phase,
      preProductionStep: raw.pre_production_step || selectedData.preProductionStep || 'shoot',
      isEventPhase,
      rawData: raw,
    }
    return (
      <RawDataView
        data={detailData}
        onBack={() => {
          setView('list')
          fetchData()
        }}
        isCrmContext
        onCrmVerify={() => {
          if (isEventPhase) {
            setView('list')
            fetchData()
            return
          }
          setView('sendDelivery')
        }}
        onSendToClient={() => setView('sendDelivery')}
        onAssignEditingTeam={() => setView('assignTeam')}
      />
    )
  }

  if (view === 'sendDelivery' && selectedData) {
    return (
      <RawDataDelivery
        leadId={selectedData.serialNumber || selectedData.id}
        onBack={() => setView('view')}
        onSent={() => {
          setView('list')
          fetchData()
        }}
      />
    )
  }

  if (view === 'assignTeam' && selectedData) {
    return <AssignTeam client={selectedData} onBack={() => setView('list')} onNext={() => { setView('list'); fetchData(); }} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title || 'Raw Data'}</h1>
          <p className="text-gray-500">{description || 'Monitor and verify incoming raw data from shooters'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search shooter, client, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none appearance-none"
          >
            {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-indigo-600 uppercase tracking-wider">Lead ID</th>
                <th className="px-6 py-4 text-xs font-bold text-indigo-600 uppercase tracking-wider">Shooter</th>
                <th className="px-6 py-4 text-xs font-bold text-indigo-600 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-xs font-bold text-indigo-600 uppercase tracking-wider">Event Date</th>
                <th className="px-6 py-4 text-xs font-bold text-indigo-600 uppercase tracking-wider">Storage</th>
                <th className="px-6 py-4 text-xs font-bold text-indigo-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-indigo-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      <span>Loading raw data...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No raw data records found matching your search.
                  </td>
                </tr>
              ) : filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-indigo-600">#{row.serialNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">{row.employee}</span>
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{row.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{row.client}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{row.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{row.images} Photos</span>
                      <span className="text-xs text-gray-500">{row.videos} Videos ({row.size})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${row.statusMeta.className}`}>
                      {row.statusMeta.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setSelectedData(row)
                          setView('view')
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                        title="View Data"
                      >
                        <Eye size={14} /> View
                      </button>
                      <button
                        onClick={() => setEditData(row)}
                        disabled={row.statusMeta.crmVerified}
                        className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${row.statusMeta.crmVerified ? 'opacity-40 cursor-not-allowed text-gray-400' : 'text-gray-500 hover:text-indigo-600'}`}
                        title={row.statusMeta.crmVerified ? "Cannot edit CRM verified data" : "Edit Data"}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteData(row.id)}
                        disabled={row.statusMeta.crmVerified}
                        className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${row.statusMeta.crmVerified ? 'opacity-40 cursor-not-allowed text-gray-400' : 'text-gray-500 hover:text-red-500'}`}
                        title={row.statusMeta.crmVerified ? "Cannot delete CRM verified data" : "Delete Data"}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 text-center">Edit Media Counts</h3>
              <p className="text-center text-sm text-gray-500 mt-1">Lead: #{editData.serialNumber}</p>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Number of Images</label>
                <input
                  type="number"
                  value={editData.images}
                  onChange={e => setEditData({ ...editData, images: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-lg font-bold text-gray-900 border-none focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Number of Videos</label>
                <input
                  type="number"
                  value={editData.videos}
                  onChange={e => setEditData({ ...editData, videos: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-lg font-bold text-gray-900 border-none focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button
                onClick={() => setEditData(null)}
                className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash className="text-red-500" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Record?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">This action cannot be undone. Are you sure you want to remove this raw data entry?</p>
            </div>
            <div className="p-6 flex gap-3">
              <button onClick={() => setDeleteData(null)} className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all">Cancel</button>
              <button onClick={() => handleDelete(deleteData)} className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 hover:scale-[1.02] active:scale-95 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
