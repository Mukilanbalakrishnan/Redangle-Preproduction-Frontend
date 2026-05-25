import { useState, useEffect } from 'react'
import { Search, ChevronDown, Filter, Send } from 'lucide-react'
import axios from 'axios'
import RawDataView from '../../data-manager/pages/RawDataView'
import AssignTeam from '../../../ClientFlow/AssignTeam'
import { toast } from 'sonner'

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
  const [view, setView] = useState<'list' | 'view' | 'assignTeam'>('list')
  const [selectedData, setSelectedData] = useState<any | null>(null)

  const [rawData, setRawData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingId, setSendingId] = useState<string | null>(null)

  const handleSendToClient = async (row: any) => {
    if (sendingId) return
    setSendingId(row.id)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
      const res = await axios.post(`${API_URL}/crm/raw-data/${row.id}/send-to-client`)
      if (res.data?.success) {
        toast.success(res.data.message || 'Delivery details sent to client successfully!')
        await fetchData()
      } else {
        toast.error(res.data?.message || 'Failed to send to client')
      }
    } catch (err: any) {
      console.error('Error sending to client:', err)
      toast.error(err.response?.data?.message || 'Failed to send to client')
    } finally {
      setSendingId(null)
    }
  }



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
          clientDeliveryStatus: item.client_delivery_status || null,
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



  if (view === 'assignTeam' && selectedData) {
    return (
      <AssignTeam
        client={selectedData}
        onBack={() => setView('list')}
        onNext={() => {
          setView('list')
          fetchData()
        }}
      />
    )
  }

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
          setView('list')
          fetchData()
        }}
      />
    )
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
                    <div className="flex justify-end gap-2">
                      {row.statusMeta.crmVerified && (
                        <>
                          {row.clientDeliveryStatus === 'client_approved' || row.clientDeliveryStatus === 'pending' || row.clientDeliveryStatus === 'sent_to_client' ? (
                            <button
                              onClick={() => {
                                setSelectedData(row)
                                setView('assignTeam')
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm active:scale-95"
                            >
                              Assign Editors
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSendToClient(row)}
                              disabled={sendingId !== null}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#5B5FC7] hover:bg-[#4f46e5] rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Send size={12} className={sendingId === row.id ? "animate-pulse" : ""} />
                              {sendingId === row.id ? 'Sending...' : 'Send to Client'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
