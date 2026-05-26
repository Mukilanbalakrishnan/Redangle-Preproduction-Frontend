import { useState, useMemo, useEffect } from 'react'
import { Eye, Filter, Search, Download, ChevronDown, Camera, Video } from 'lucide-react'
import RawDataView from './RawDataView'
import { matchesDataManagerStage, useDataManagerStageScope } from '../utils/stageScope'

const API_URL = import.meta.env.VITE_API_URL

export default function IncomingData() {
    const stageScope = useDataManagerStageScope()
    const [view, setView] = useState<'list' | 'details'>('list')
    const [selectedData, setSelectedData] = useState<any | null>(null)

    // Data State
    const [tableData, setTableData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Search and Filter States
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('All')
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    useEffect(() => {
        fetchIncomingData()
    }, [stageScope.stage])

    const fetchIncomingData = async () => {
        try {
            const res = await fetch(`${API_URL}/data-manager/incoming`)
            const result = await res.json()
            if (result.success && result.data) {
                // ONE row per lead — combines photographer + videographer into one entry
                    const normalizedData = result.data.filter((item: any) => matchesDataManagerStage(item, stageScope.stage)).map((item: any) => {
                        const currentPhase = String(item.current_phase || '').trim().toLowerCase()
                        const showDrone = currentPhase === 'event'
                        const preProductionUploads = [
                            item.save_the_date_drive_link ? 'Save the Date' : '',
                            item.save_the_video_drive_link ? 'Save the Video' : '',
                            item.retouch_drive_link ? 'Retouch' : '',
                        ].filter(Boolean)
                        return {
                            id: item.lead_serial_number || String(item.id),
                            rawId: String(item.id),
                    photographer: item.photographer || null,
                    photographerName: item.photographer_name || null,
                    videographer: item.videographer || null,
                    videographerName: item.videographer_name || null,
                    drone: showDrone ? (item.drone || null) : null,
                    droneName: showDrone ? (item.drone_name || null) : null,
                    client: item.client,
                    date: item.date || '—',
                    status: item.status === 'Pending' ? 'New' : item.status || 'New',
                    numImages: (item.num_images || 0) + (showDrone ? (item.drone_num_images || 0) : 0) + preProductionUploads.length,
                    numVideos: (item.num_videos || 0) + (showDrone ? (item.drone_num_videos || 0) : 0),
                    photographerImages: item.num_images || 0,
                    videographerVideos: item.num_videos || 0,
                    droneImages: showDrone ? (item.drone_num_images || 0) : 0,
                    droneVideos: showDrone ? (item.drone_num_videos || 0) : 0,
                    currentPhase,
                    isEventPhase: showDrone,
                    preProductionUploads,
                    rawData: item
                    }
                })
                setTableData(normalizedData)
            }
        } catch (error) {
            console.error('Error fetching incoming data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Filtering Logic
    const filteredData = useMemo(() => {
        return tableData.filter((item) => {
            const searchLower = searchTerm.toLowerCase()
            const matchesSearch =
                (item.photographer || '').toLowerCase().includes(searchLower) ||
                (item.videographer || '').toLowerCase().includes(searchLower) ||
                (item.drone || '').toLowerCase().includes(searchLower) ||
                item.client.toLowerCase().includes(searchLower) ||
                item.id.toLowerCase().includes(searchLower)

            const matchesStatus = statusFilter === 'All' || item.status === statusFilter

            return matchesSearch && matchesStatus
        })
    }, [tableData, searchTerm, statusFilter])

    const showDroneColumn = filteredData.some((item) => item.isEventPhase)

    if (view === 'details' && selectedData) {
        return <RawDataView
            data={selectedData}
            onBack={() => {
                setView('list')
                fetchIncomingData()
            }}
        />
    }

    return (
        <div>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-lg font-bold" style={{ color: '#111827' }}>{stageScope.label} Incoming Raw Data</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>View and manage {stageScope.label.toLowerCase()} uploaded raw files from employees</p>
                </div>
                <button className="crm-card flex items-center gap-2 px-4 py-2 text-sm font-medium" style={{ color: '#6B7280' }}>
                    <Download size={14} /> Download report
                </button>
            </div>

            <div className="flex gap-4 mb-6 relative">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by employee or client name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-purple-50 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-purple-200 transition-all placeholder-gray-500"
                    />
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-100 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-200 transition-colors h-full"
                    >
                        <Filter size={16} />
                        {statusFilter === 'All' ? 'Filter' : statusFilter.replace('_', ' ')}
                        <ChevronDown size={14} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isFilterOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 overflow-hidden">
                                {['All', 'New', 'Pending_Verification', 'Verified', 'Reupload_Requested'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => {
                                            setStatusFilter(status)
                                            setIsFilterOpen(false)
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition-colors ${statusFilter === status ? 'text-purple-700 font-bold bg-purple-50' : 'text-gray-700 font-medium'}`}
                                    >
                                        {status.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="crm-card bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100">
                            {['Lead ID', 'Client Name', 'Photographer', 'Videographer', ...(showDroneColumn ? ['Drone'] : []), 'Images', 'Videos', 'Event Date', 'Status', 'Action'].map((h) => (
                                <th key={h} className="text-left px-5 py-4 text-xs font-bold text-indigo-600">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={showDroneColumn ? 10 : 9} className="px-6 py-8 text-center text-sm font-medium text-gray-500">
                                    Loading incoming data...
                                </td>
                            </tr>
                        ) : filteredData.length > 0 ? (
                            filteredData.map((row) => (
                                <tr key={row.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4 text-xs font-semibold text-indigo-500">#{row.id}</td>
                                    <td className="px-5 py-4 text-xs font-semibold text-gray-900">{row.client}</td>
                                    <td className="px-5 py-4">
                                        {row.photographer ? (
                                            <div className="flex items-center gap-1.5">
                                                <Camera size={12} className="text-blue-500 shrink-0" />
                                                <span className="text-xs font-medium text-gray-700">{row.photographerName || row.photographer}</span>
                                            </div>
                                        ) : row.preProductionUploads?.length ? (
                                            <div className="flex max-w-[180px] flex-wrap gap-1">
                                                {row.preProductionUploads.map((label: string) => (
                                                    <span key={label} className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                                                        {label}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        {row.videographer ? (
                                            <div className="flex items-center gap-1.5">
                                                <Video size={12} className="text-pink-500 shrink-0" />
                                                <span className="text-xs font-medium text-gray-700">{row.videographerName || row.videographer}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </td>
                                    {showDroneColumn && (
                                        <td className="px-5 py-4">
                                            {row.drone ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Camera size={12} className="text-teal-500 shrink-0" />
                                                    <span className="text-xs font-medium text-gray-700">{row.droneName || row.drone}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>
                                    )}
                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                            📷 {row.numImages}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-md">
                                            🎬 {row.numVideos}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-gray-500">{row.date}</td>
                                    <td className="px-5 py-4">
                                        <span className={`px-3 py-1 text-[10px] font-bold rounded-lg ${
                                            row.status === 'New' ? 'bg-blue-100 text-blue-600' :
                                            row.status === 'Pending_Verification' ? 'bg-orange-100 text-orange-500' :
                                            row.status === 'crm_verified' ? 'bg-blue-100 text-blue-600' :
                                            row.status === 'Verified' ? 'bg-green-100 text-green-600' :
                                            'bg-red-100 text-red-500'
                                        }`}>
                                            {row.status === 'crm_verified' ? 'QC Completed' : row.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <button
                                            onClick={() => { setSelectedData(row); setView('details') }}
                                            className="flex items-center gap-1.5 text-xs font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                                        >
                                            <Eye size={14} className="text-pink-500" /> View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={showDroneColumn ? 10 : 9} className="px-6 py-8 text-center text-sm font-medium text-gray-500">
                                    No incoming data found matching your search or filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
