import { useState, useEffect, useMemo } from 'react'
import { Search, ChevronDown, X, Upload, Eye, CheckCircle2, Filter, ArrowLeft } from 'lucide-react'
import axios from 'axios'
import { matchesDataManagerStage, useDataManagerStageScope } from '../utils/stageScope'

const EVENT_TYPES = [
    'Wedding', 'Reception', 'Engagement', 'Puberty', 'Birthday',
    'Haldi', 'Mehandi', 'Ear Piercing', 'Outdoor Shoot', 'Others'
]

const OUTDOOR_SUBTYPES = ['Pre-wedding Shoot', 'Post-wedding Shoot']

const SERVICES = [
    'Traditional Photo', 'Candid Photo', 'Drone',
    'Photo Booth', 'Insta 360', 'Secondary Traditional Photo',
    'Secondary Candid Photo',
]

export default function Pixstudio() {
    const API_URL = import.meta.env.VITE_API_URL
    const stageScope = useDataManagerStageScope()

    const [view, setView] = useState<'list' | 'details'>('list')
    const [selectedLead, setSelectedLead] = useState<any>(null)

    // Data State for List View
    const [incomingData, setIncomingData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('All')
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    // Form States
    const [clientId, setClientId] = useState('')
    const [clientFound, setClientFound] = useState(false)
    const [clientData, setClientData] = useState({ name: '', phone: '', email: '', eventDate: '', location: '' })

    const [eventType, setEventType] = useState('')
    const [eventDropdownOpen, setEventDropdownOpen] = useState(false)
    const [outdoorSubtype, setOutdoorSubtype] = useState('')

    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false)
    const [customService, setCustomService] = useState('')

    const [fileSize, setFileSize] = useState('')
    const [storagePath, setStoragePath] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const fetchIncomingData = async () => {
            try {
                const res = await axios.get(`${API_URL}/data-manager/incoming`)
                if (res.data.success && res.data.data) {
                    const mappedData = res.data.data
                        .filter((item: any) => matchesDataManagerStage(item, stageScope.stage))
                        .filter((item: any) => item.status === 'Verified' || item.status === 'QC_Pending_Pixoffice' || item.status === 'crm_verified')
                        .map((item: any) => ({
                        id: item.lead_serial_number || String(item.id),
                        rawId: String(item.id),
                        photographer: item.photographer || null,
                        videographer: item.videographer || null,
                        client: item.client,
                        date: item.date || '—',
                        status: item.status || 'Pending',
                        numImages: item.num_images || 0,
                        numVideos: item.num_videos || 0,
                        rawData: item
                    }))
                    setIncomingData(mappedData)
                }
            } catch (error) {
                console.error('Error fetching incoming data:', error)
            } finally {
                setLoading(false)
            }
        }
        if (view === 'list') {
            fetchIncomingData()
        }
    }, [view, API_URL, stageScope.stage])

    // Pre-fill form when lead is selected
    useEffect(() => {
        if (selectedLead && view === 'details') {
            setClientId(selectedLead.id)
            setClientData({
                name: selectedLead.client,
                phone: selectedLead.rawData?.phone || '—',
                email: selectedLead.rawData?.email || '—',
                eventDate: selectedLead.date,
                location: selectedLead.rawData?.location || '—',
            })
            setClientFound(true)
            setEventType(selectedLead.rawData?.title || '') // Set eventType if exists
        }
    }, [selectedLead, view])

    const filteredData = useMemo(() => {
        return incomingData.filter((item) => {
            const searchLower = searchTerm.toLowerCase()
            const matchesSearch =
                item.client.toLowerCase().includes(searchLower) ||
                item.id.toLowerCase().includes(searchLower)

            const matchesStatus = statusFilter === 'All' || 
                                  item.status === statusFilter || 
                                  (statusFilter === 'QC_Completed' && item.status === 'crm_verified') ||
                                  (statusFilter === 'Pending' && item.status === 'Verified')

            return matchesSearch && matchesStatus
        })
    }, [incomingData, searchTerm, statusFilter])

    const toggleService = (service: string) => {
        setSelectedServices(prev =>
            prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
        )
    }

    const addCustomService = () => {
        if (customService.trim() && !selectedServices.includes(customService.trim())) {
            setSelectedServices(prev => [...prev, customService.trim()])
            setCustomService('')
        }
    }

    const handleSubmit = async () => {
        if (!canSubmit || isSubmitting) return

        setIsSubmitting(true)
        try {
            const data = {
                external_lead_id: selectedLead.rawId, // Use numeric ID for backend
                event_name: eventType,
                sub_category: outdoorSubtype,
                services: selectedServices,
                file_size: fileSize,
                storage_path: storagePath
            };
            const response = await axios.post(`${API_URL}/pixoffice/submit`, data);
            if (response.data.success) {
                setSubmitted(true);
            } else {
                alert("Failed to save Pixstudio data: " + response.data.message);
            }
        } catch (err: any) {
            console.error("Error submitting pixstudio data", err);
            alert("Error submitting data. Please try again.");
        } finally {
            setIsSubmitting(false)
        }
    }

    const canSubmit = clientFound && eventType && selectedServices.length > 0;

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#dcfce7' }}>
                    <CheckCircle2 size={32} style={{ color: '#16a34a' }} />
                </div>
                <h2 className="text-lg font-bold mb-1" style={{ color: '#111827' }}>Pixstudio Data Submitted!</h2>
                <p className="text-sm mb-1" style={{ color: '#6B7280' }}>Client: {clientData.name} ({clientId.toUpperCase()})</p>
                <p className="text-sm mb-6" style={{ color: '#6B7280' }}>Status has been set to <b style={{ color: '#d97706' }}>QC Pending</b></p>
                <div className="flex gap-3">
                    <span className="px-4 py-2 rounded-full text-xs font-bold" style={{ background: '#fef3c7', color: '#d97706' }}>QC Pending</span>
                    <span className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1" style={{ background: '#dbeafe', color: '#2563eb' }}>
                        → Assigned to CRM
                    </span>
                </div>
                <button
                    onClick={() => {
                        setSubmitted(false);
                        setClientId('');
                        setClientFound(false);
                        setClientData({ name: '', phone: '', email: '', eventDate: '', location: '' });
                        setEventType('');
                        setSelectedServices([]);
                        setFileSize('');
                        setStoragePath('');
                        setSelectedLead(null);
                        setView('list');
                    }}
                    className="mt-8 px-6 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #a78bfa, #5B5FC7)' }}
                >
                    Back to List
                </button>
            </div>
        )
    }

    if (view === 'list') {
        return (
            <div>
                <div className="mb-6">
                    <h1 className="text-lg font-bold" style={{ color: '#111827' }}>{stageScope.label} Pixstudio</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Select a {stageScope.label.toLowerCase()} lead to process for Pixstudio</p>
                </div>

                <div className="flex gap-4 mb-6 relative">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by client name or ID..."
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
                                    {['All', 'Pending', 'QC_Pending_Pixoffice', 'QC_Completed'].map((status) => (
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
                                {['Lead ID', 'Client Name', 'Event Date', 'Status', 'Action'].map((h) => (
                                    <th key={h} className="text-left px-5 py-4 text-xs font-bold text-indigo-600">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm font-medium text-gray-500">
                                        Loading incoming data...
                                    </td>
                                </tr>
                            ) : filteredData.length > 0 ? (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4 text-xs font-semibold text-indigo-500">#{row.id}</td>
                                        <td className="px-5 py-4 text-xs font-semibold text-gray-900">{row.client}</td>
                                        <td className="px-5 py-4 text-xs text-gray-500">{row.date}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-3 py-1 text-[10px] font-bold rounded-lg ${
                                                row.status === 'QC_Pending_Pixoffice' ? 'bg-yellow-100 text-yellow-600' :
                                                row.status === 'crm_verified' ? 'bg-blue-100 text-blue-600' :
                                                row.status === 'Verified' ? 'bg-orange-100 text-orange-500' :
                                                'bg-gray-100 text-gray-500'
                                            }`}>
                                                {row.status === 'QC_Pending_Pixoffice' ? 'QC Pending' : 
                                                 row.status === 'crm_verified' ? 'QC Completed' : 
                                                 row.status === 'Verified' ? 'Pending' :
                                                 row.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {row.status === 'QC_Pending_Pixoffice' ? (
                                                <span className="px-4 py-1.5 bg-yellow-50 text-yellow-600 rounded-lg text-xs font-bold">
                                                    ✓ Submitted
                                                </span>
                                            ) : row.status === 'crm_verified' ? (
                                                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                                                    ✓ QC Completed
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => { setSelectedLead(row); setView('details') }}
                                                    className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                                                >
                                                    <Eye size={14} /> View
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm font-medium text-gray-500">
                                        No leads found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => {
                        setView('list')
                        setSelectedLead(null)
                    }}
                    className="p-2 bg-white border border-gray-100 shadow-sm rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Pixstudio Management</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Manage and trigger QC for Pixstudio data entries</p>
                </div>
            </div>

            {/* Client Lookup Section */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
                <h2 className="text-sm font-bold mb-4" style={{ color: '#111827' }}>Client Lookup</h2>
                <div className="flex gap-3 mb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Client Relationship ID (Auto-filled)"
                            value={clientId}
                            readOnly
                            className="w-full pl-10 pr-4 py-3 bg-purple-50 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-purple-200 transition-all placeholder-gray-500"
                        />
                    </div>
                </div>

                {clientFound && (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-xl" style={{ background: '#F9F8FF', border: '1px solid #EDE9FE' }}>
                        {[
                            { label: 'Client Name', value: clientData.name },
                            { label: 'Phone', value: clientData.phone },
                            { label: 'Email', value: clientData.email },
                            { label: 'Event Date', value: clientData.eventDate },
                            { label: 'Location', value: clientData.location },
                        ].map(f => (
                            <div key={f.label}>
                                <p className="text-xs font-semibold mb-1" style={{ color: '#5B5FC7' }}>{f.label}</p>
                                <p className="text-sm font-medium" style={{ color: '#111827' }}>{f.value}</p>
                            </div>
                        ))}
                        <div className="flex items-end">
                            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#dcfce7', color: '#16a34a' }}>✓ Client Found</span>
                        </div>
                    </div>
                )}

            </div>

            {/* Event & Services Section - Similar to Data Upload */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <h2 className="text-sm font-bold mb-4" style={{ color: '#111827' }}>Event Name</h2>
                    <div className="relative">
                        <button
                            onClick={() => setEventDropdownOpen(!eventDropdownOpen)}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-left transition-all"
                            style={{ background: '#F0EFFE', border: '1px solid #E0DFFE', color: eventType ? '#111827' : '#9ca3af' }}
                        >
                            {eventType || 'Select event type'}
                            <ChevronDown size={14} />
                        </button>
                        {eventDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setEventDropdownOpen(false)} />
                                <div
                                    className="absolute left-0 top-full mt-1 z-20 w-full rounded-xl overflow-hidden shadow-lg"
                                    style={{ background: '#fff', border: '1px solid #e5e7eb', maxHeight: 250, overflowY: 'auto' }}
                                >
                                    {EVENT_TYPES.map(ev => (
                                        <button
                                            key={ev}
                                            onClick={() => { setEventType(ev); setEventDropdownOpen(false); if (ev !== 'Outdoor Shoot') setOutdoorSubtype('') }}
                                            className="flex items-center w-full px-4 py-3 text-sm text-left transition-colors hover:bg-purple-50"
                                            style={{ color: ev === eventType ? '#5B5FC7' : '#374151', fontWeight: ev === eventType ? 700 : 400 }}
                                        >
                                            {ev === eventType && <span className="mr-2">✓</span>}
                                            {ev}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {eventType === 'Outdoor Shoot' && (
                        <div className="mt-3">
                            <p className="text-xs font-semibold mb-2" style={{ color: '#5B5FC7' }}>Sub-category</p>
                            <div className="flex gap-2">
                                {OUTDOOR_SUBTYPES.map(sub => (
                                    <button
                                        key={sub}
                                        onClick={() => setOutdoorSubtype(sub)}
                                        className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
                                        style={{
                                            background: outdoorSubtype === sub ? '#5B5FC7' : '#f3f4f6',
                                            color: outdoorSubtype === sub ? '#fff' : '#374151',
                                        }}
                                    >
                                        {sub}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <h2 className="text-sm font-bold mb-4" style={{ color: '#111827' }}>Services</h2>
                    <div className="relative">
                        <button
                            onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-left transition-all"
                            style={{ background: '#F0EFFE', border: '1px solid #E0DFFE', color: selectedServices.length ? '#111827' : '#9ca3af' }}
                        >
                            {selectedServices.length ? `${selectedServices.length} service(s) selected` : 'Select services'}
                            <ChevronDown size={14} />
                        </button>
                        {servicesDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setServicesDropdownOpen(false)} />
                                <div
                                    className="absolute left-0 top-full mt-1 z-20 w-full rounded-xl overflow-hidden shadow-lg"
                                    style={{ background: '#fff', border: '1px solid #e5e7eb', maxHeight: 300, overflowY: 'auto' }}
                                >
                                    {SERVICES.map(srv => (
                                        <button
                                            key={srv}
                                            onClick={() => toggleService(srv)}
                                            className="flex items-center w-full px-4 py-2.5 text-sm text-left transition-colors hover:bg-purple-50"
                                            style={{ color: selectedServices.includes(srv) ? '#5B5FC7' : '#374151', fontWeight: selectedServices.includes(srv) ? 700 : 400 }}
                                        >
                                            <div
                                                className="w-4 h-4 rounded border mr-3 flex items-center justify-center shrink-0"
                                                style={{
                                                    background: selectedServices.includes(srv) ? '#5B5FC7' : '#fff',
                                                    borderColor: selectedServices.includes(srv) ? '#5B5FC7' : '#d1d5db',
                                                }}
                                            >
                                                {selectedServices.includes(srv) && <span className="text-white text-[10px]">✓</span>}
                                            </div>
                                            {srv}
                                        </button>
                                    ))}
                                    <div className="p-3 border-t border-gray-100">
                                        <p className="text-xs font-semibold mb-2" style={{ color: '#5B5FC7' }}>Add custom service</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Enter service name..."
                                                value={customService}
                                                onChange={e => setCustomService(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && addCustomService()}
                                                className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-200"
                                            />
                                            <button
                                                onClick={addCustomService}
                                                className="px-3 py-2 rounded-lg text-xs font-semibold text-white"
                                                style={{ background: '#5B5FC7' }}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {selectedServices.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {selectedServices.map(srv => (
                                <span key={srv} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: '#ede9fe', color: '#5B5FC7' }}>
                                    {srv}
                                    <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => toggleService(srv)} />
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
                <h2 className="text-sm font-bold mb-4" style={{ color: '#111827' }}>File Information</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold mb-2" style={{ color: '#374151' }}>Overall File Size</label>
                        <input
                            type="text"
                            placeholder="e.g. 120 GB"
                            value={fileSize}
                            onChange={e => setFileSize(e.target.value)}
                            className="w-full px-4 py-3 bg-purple-50 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-purple-200 transition-all placeholder-gray-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-2" style={{ color: '#374151' }}>Pixstudio Storage Path</label>
                        <input
                            type="text"
                            placeholder="e.g. \\\\NAS-01\\Pixstudio\\SharmaWedding"
                            value={storagePath}
                            onChange={e => setStoragePath(e.target.value)}
                            className="w-full px-4 py-3 bg-purple-50 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-purple-200 transition-all placeholder-gray-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-2" style={{ color: '#374151' }}>Preview</label>
                        <button
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-purple-100"
                            style={{ background: '#F0EFFE', color: '#5B5FC7', border: '1px solid #E0DFFE' }}
                        >
                            <Eye size={14} /> Open Preview (Nash Server)
                        </button>
                    </div>
                </div>
            </div>

            <div
                className="sticky bottom-0 z-30 flex justify-end gap-3 pt-4"
                style={{
                    background: 'rgba(240,242,245,0.96)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting}
                    className="relative z-40 pointer-events-auto flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #a78bfa, #5B5FC7)' }}
                >
                    <Upload size={16} /> {isSubmitting ? 'Submitting...' : 'Submit — Set as QC Pending'}
                </button>
            </div>
        </div>
    )
}
