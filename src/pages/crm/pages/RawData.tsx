import React, { useState, useEffect, useMemo } from 'react'
import { Search, ChevronDown, Eye, Pencil, Trash2, Database, Image as ImageIcon, Video, HardDrive, CheckCircle2, Clock, AlertCircle, RotateCcw, XCircle, RefreshCw, Send, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import RawDataView from '../../data-manager/pages/RawDataView'
import AssignEditingTeam from '../../../ClientFlow/AssignEditingTeam'
import { useAssignTeamContext } from '../../../ClientFlow/assignTeamShared'
import { toast } from 'sonner'

// Wrapper that loads context then renders AssignEditingTeam
function AssignEditingTeamWrapper({ clientId, onBack, onNext }: { clientId: string; onBack: () => void; onNext: () => void }) {
  const context = useAssignTeamContext(clientId);
  if (context.isLoading) {
    return (
      <div className="rounded-[32px] bg-white p-10 shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
          <p className="text-sm" style={{ color: '#6B7280' }}>Loading editing team workspace...</p>
        </div>
      </div>
    );
  }
  return <AssignEditingTeam context={context} onBack={onBack} onNext={onNext} />;
}

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
  if (normalized === 'crm_verified')         return { label: 'CRM Verified',         className: 'bg-blue-100 text-blue-700 border-blue-200',      icon: CheckCircle2,  dot: 'bg-blue-500',   crmVerified: true }
  if (normalized === 'verified')             return { label: 'Ready for CRM Review',  className: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: CheckCircle2,  dot: 'bg-indigo-500', crmVerified: false }
  if (normalized === 'pending_verification') return { label: 'DM Review Pending',     className: 'bg-amber-100 text-amber-700 border-amber-200',    icon: Clock,         dot: 'bg-amber-500',  crmVerified: false }
  if (normalized === 'reupload_requested')   return { label: 'Re-upload Requested',   className: 'bg-orange-100 text-orange-700 border-orange-200', icon: RotateCcw,     dot: 'bg-orange-500', crmVerified: false }
  if (normalized === 'rejected')             return { label: 'Rejected',              className: 'bg-red-100 text-red-700 border-red-200',          icon: XCircle,       dot: 'bg-red-500',    crmVerified: false }
  return                                            { label: 'Pending',               className: 'bg-gray-100 text-gray-600 border-gray-200',       icon: AlertCircle,   dot: 'bg-gray-400',   crmVerified: false }
}

const STATUSES = ['All Status', 'Pending', 'Ready for CRM Review', 'CRM Verified', 'DM Review Pending', 'Re-upload Requested', 'Rejected']

export default function RawData({ workflowPhase = 'all', title, description }: RawDataProps = {}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [view, setView] = useState<'list' | 'view' | 'assignTeam'>('list')
  const [selectedData, setSelectedData] = useState<any | null>(null)
  const [rawData, setRawData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()

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
  const [editData, setEditData] = useState<any | null>(null)
  const [deleteData, setDeleteData] = useState<string | null>(null)

  const handleEditSave = async () => {
    if (!editData) return
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
      await axios.put(`${API_URL}/data-manager/incoming/${editData.id}`, {
        num_images: parseInt(editData.images, 10),
        num_videos: parseInt(editData.videos, 10),
      })
      setRawData(prev => prev.map(d => d.id === editData.id ? { ...d, images: parseInt(editData.images, 10) || 0, videos: parseInt(editData.videos, 10) || 0 } : d))
      setEditData(null)
    } catch (err) {
      console.error('Failed to update raw data', err)
      alert('Failed to update raw data')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
      await axios.delete(`${API_URL}/data-manager/incoming/${id}`)
      setRawData(prev => prev.filter(d => d.id !== id))
      setDeleteData(null)
    } catch (err) {
      console.error('Failed to delete raw data', err)
      alert('Failed to delete raw data')
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
      const res = await axios.get(`${API_URL}/data-manager/incoming`)
      if (res.data?.success) {
        const mapped = res.data.data.map((item: any) => ({
          id: String(item.id),
          serialNumber: item.lead_serial_number || String(item.id),
          employee: item.photographer_name || item.photographer || item.videographer_name || item.videographer || item.drone_name || item.drone || 'Unknown',
          role: item.photographer && item.videographer && item.drone
            ? 'Photo, Video & Drone'
            : item.photographer && item.videographer ? 'Photo & Video'
            : item.photographer && item.drone ? 'Photo & Drone'
            : item.videographer && item.drone ? 'Video & Drone'
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
          rawData: item,
        }))
        setRawData(mapped)
      }
    } catch (err) {
      console.error('Error fetching raw data for CRM:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = useMemo(() => rawData.filter(d => {
    const q = search.toLowerCase()
    const matchesSearch =
      d.employee.toLowerCase().includes(q) ||
      (d.drone?.toLowerCase().includes(q) || false) ||
      d.client.toLowerCase().includes(q) ||
      d.serialNumber.toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'All Status' || d.statusMeta.label === statusFilter
    let phaseMatch = true
    if (workflowPhase !== 'all') {
      const phase = (d.currentPhase || 'pre_production').toLowerCase()
      phaseMatch = phase === workflowPhase
    }
    return matchesSearch && matchesStatus && phaseMatch
  }), [rawData, search, statusFilter, workflowPhase])

  // Summary stats
  const stats = useMemo(() => ({
    total: rawData.length,
    verified: rawData.filter(d => d.statusMeta.label === 'CRM Verified').length,
    pending: rawData.filter(d => ['Pending', 'DM Review Pending'].includes(d.statusMeta.label)).length,
    needsAction: rawData.filter(d => ['Re-upload Requested', 'Rejected'].includes(d.statusMeta.label)).length,
    totalPhotos: rawData.reduce((a, d) => a + d.images, 0),
    totalVideos: rawData.reduce((a, d) => a + d.videos, 0),
  }), [rawData])

  // ── Sub-views ───────────────────────────────────────────────────────────
  if (view === 'assignTeam' && selectedData) {
    return (
      <AssignEditingTeamWrapper
        clientId={String(selectedData.id)}
        onBack={() => setView('list')}
        onNext={() => { setView('list'); fetchData() }}
      />
    )
  }

  if (view === 'view' && selectedData) {
    const raw = selectedData.rawData || {}
    const phase = String(raw.current_phase || '').trim().toLowerCase()
    const isEventPhase = phase === 'event'
    const detailData = {
      id: selectedData.id, serialNumber: selectedData.serialNumber, rawId: selectedData.id,
      photographer: selectedData.photographer, videographer: selectedData.videographer,
      drone: isEventPhase ? selectedData.drone : null, client: selectedData.client, date: selectedData.date,
      status: raw.status || raw.media_status || selectedData.status,
      numImages: (raw.num_images || 0) + (isEventPhase ? (raw.drone_num_images || 0) : 0),
      numVideos: (raw.num_videos || 0) + (isEventPhase ? (raw.drone_num_videos || 0) : 0),
      droneImages: isEventPhase ? (raw.drone_num_images || 0) : 0,
      droneVideos: isEventPhase ? (raw.drone_num_videos || 0) : 0,
      drive_link: raw.drive_link, video_drive_link: raw.video_drive_link,
      drone_photo_drive_link: raw.drone_photo_drive_link, drone_video_drive_link: raw.drone_video_drive_link,
      currentPhase: phase, preProductionStep: raw.pre_production_step || selectedData.preProductionStep || 'shoot',
      isEventPhase, rawData: raw,
    }
    return (
      <RawDataView
        data={detailData} onBack={() => { setView('list'); fetchData() }}
        isCrmContext
        onCrmVerify={() => {
          setView('list')
          fetchData()
        }}
      />
    )
  }

  // ── List View ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">{title || 'Raw Data'}</h1>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
          <input
            type="text"
            placeholder="Search by shooter, client or lead ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all placeholder-gray-400 shadow-sm"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-4 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none appearance-none transition-all shadow-sm font-medium text-gray-700 min-w-[200px]"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Active filters badge */}
        {(search || statusFilter !== 'All Status') && (
          <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide">Filtered:</span>
            {search && (
              <span className="inline-flex items-center gap-1.5 bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                "{search}"
                <button onClick={() => setSearch('')} className="hover:text-red-500 transition-colors">×</button>
              </span>
            )}
            {statusFilter !== 'All Status' && (
              <span className="inline-flex items-center gap-1.5 bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                {statusFilter}
                <button onClick={() => setStatusFilter('All Status')} className="hover:text-red-500 transition-colors">×</button>
              </span>
            )}
            <span className="text-xs text-indigo-500 ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100">
                <th className="px-6 py-3.5 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Lead ID</th>
                <th className="px-6 py-3.5 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Shooter</th>
                <th className="px-6 py-3.5 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Client</th>
                <th className="px-6 py-3.5 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Event Date</th>
                <th className="px-6 py-3.5 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Media</th>
                <th className="px-6 py-3.5 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3.5 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                      <span className="text-sm font-medium">Loading raw data…</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No raw data records found matching your search.
                  </td>
                </tr>
              ) : (() => {
                const ROWS_PER_PAGE = 10
                const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE)
                const safePage = Math.min(currentPage, totalPages || 1)
                const paginatedData = filtered.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE)
                return paginatedData.map(row => {
                const StatusIcon = row.statusMeta.icon
                return (
                  <tr key={row.id} className="hover:bg-indigo-50/20 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">#{row.serialNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-extrabold shadow-sm shrink-0">
                          {row.employee.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-none">{row.employee}</p>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">{row.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-800">{row.client}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500 font-medium">{row.date}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="p-1 bg-blue-50 rounded-md"><ImageIcon size={11} className="text-blue-500" /></div>
                          <span className="text-xs font-bold text-gray-700">{row.images}</span>
                        </div>
                        <div className="w-px h-3 bg-gray-200" />
                        <div className="flex items-center gap-1.5">
                          <div className="p-1 bg-pink-50 rounded-md"><Video size={11} className="text-pink-500" /></div>
                          <span className="text-xs font-bold text-gray-700">{row.videos}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">({row.size})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border ${row.statusMeta.className}`}>
                        <StatusIcon size={11} strokeWidth={2.5} />
                        {row.statusMeta.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end items-center gap-1.5">
                        {/* Primary: Assign (only after delivery status is set) */}
                        {row.statusMeta.crmVerified && row.clientDeliveryStatus ? (
                          <button
                            onClick={() => { setSelectedData(row); setView('assignTeam'); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-all"
                            title="Assign Editors"
                          >
                            <Users size={13} strokeWidth={2.5} />
                            Assign
                          </button>
                        ) : row.statusMeta.crmVerified && !row.clientDeliveryStatus ? (
                          <button
                            onClick={() => handleSendToClient(row)}
                            disabled={sendingId === row.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              sendingId === row.id
                                ? 'opacity-50 text-gray-400 bg-gray-50 border-gray-100 cursor-wait'
                                : 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200'
                            }`}
                            title="Send to Client"
                          >
                            {sendingId === row.id ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                            Send
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 bg-gray-50 border border-gray-100 cursor-not-allowed select-none" title="Verify first to assign">
                            <Users size={13} strokeWidth={2.5} />
                            Assign
                          </span>
                        )}


                        {/* Secondary: View (non-pre-production only) */}
                        {workflowPhase !== 'pre_production' && (
                          <button
                            onClick={() => { setSelectedData(row); setView('view') }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                            title="View details"
                          >
                            <Eye size={14} />
                          </button>
                        )}

                        {/* Secondary: Edit */}
                        <button
                          onClick={() => setEditData(row)}
                          disabled={row.statusMeta.crmVerified}
                          className={`p-1.5 rounded-lg transition-all ${row.statusMeta.crmVerified ? 'opacity-25 cursor-not-allowed text-gray-300' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'}`}
                          title={row.statusMeta.crmVerified ? 'Cannot edit verified data' : 'Edit counts'}
                        >
                          <Pencil size={14} />
                        </button>

                        {/* Secondary: Delete */}
                        <button
                          onClick={() => setDeleteData(row.id)}
                          disabled={row.statusMeta.crmVerified}
                          className={`p-1.5 rounded-lg transition-all ${row.statusMeta.crmVerified ? 'opacity-25 cursor-not-allowed text-gray-300' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                          title={row.statusMeta.crmVerified ? 'Cannot delete verified data' : 'Delete record'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
              })()
              }
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && filtered.length > 0 && (() => {
          const ROWS_PER_PAGE = 10
          const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE)
          const safePage = Math.min(currentPage, totalPages || 1)
          const startRow = (safePage - 1) * ROWS_PER_PAGE + 1
          const endRow = Math.min(safePage * ROWS_PER_PAGE, filtered.length)
          return (
            <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">
                Showing <span className="font-bold text-gray-600">{startRow}–{endRow}</span> of <span className="font-bold text-gray-600">{filtered.length}</span> records
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${
                      page === safePage
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )
        })()}
      </div>

      {/* ── Edit Modal ── */}
      {editData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100">
            <div className="px-7 pt-7 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Pencil size={18} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Edit Media Counts</h3>
                  <p className="text-xs text-gray-400 font-medium">Lead #{editData.serialNumber}</p>
                </div>
              </div>
            </div>
            <div className="px-7 py-6 space-y-5">
              {[
                { label: 'Number of Photos', key: 'images', icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'Number of Videos', key: 'videos', icon: Video, color: 'text-pink-500', bg: 'bg-pink-50' },
              ].map(field => {
                const Icon = field.icon
                return (
                  <div key={field.key}>
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      <div className={`p-1 rounded-md ${field.bg}`}><Icon size={12} className={field.color} /></div>
                      {field.label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editData[field.key]}
                      onChange={e => setEditData({ ...editData, [field.key]: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-base font-bold text-gray-900 border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>
                )
              })}
            </div>
            <div className="px-7 pb-7 flex gap-3">
              <button
                onClick={() => setEditData(null)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
              >Cancel</button>
              <button
                onClick={handleEditSave}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all"
              >Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-100">
            <div className="px-8 pt-8 pb-6 text-center">
              <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900 mb-2">Delete this record?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">This action is permanent and cannot be undone. The raw data entry will be removed.</p>
            </div>
            <div className="px-8 pb-8 flex gap-3">
              <button onClick={() => setDeleteData(null)} className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all">Cancel</button>
              <button onClick={() => handleDelete(deleteData)} className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-sm shadow-red-200 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
