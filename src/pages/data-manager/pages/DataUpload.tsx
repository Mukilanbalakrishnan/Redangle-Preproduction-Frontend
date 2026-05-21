import { useState, useMemo, useEffect } from 'react'
import { Search, ChevronDown, X, Upload, CheckCircle2, ArrowLeft } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

const EVENT_TYPES = [
    'Wedding', 'Reception', 'Engagement', 'Puberty', 'Birthday',
    'Haldi', 'Mehandi', 'Ear Piercing', 'Outdoor Shoot', 'Others'
]
const OUTDOOR_SUBTYPES = ['Pre-wedding Shoot', 'Post-wedding Shoot']
// Candid is removed as an active workflow role per Red Angle Structure v2. The historical
// "Candid Photo/Video" service labels are kept as legacy-safe aliases mapped to the
// Retouch / Traditional Video output buckets so older data still reads cleanly. Any new
// selections should prefer the non-Candid names.
const SERVICES = [
    'Traditional Photo', 'Retouch Photo', 'Traditional Video', 'Drone',
    'Photo Booth', 'Insta 360', 'Secondary Traditional Video', 'Secondary Traditional Photo',
    'Secondary Retouch Photo',
]

export default function DataUpload() {
    const [view, setView] = useState<'list' | 'upload'>('list')
    const [selectedLead, setSelectedLead] = useState<any | null>(null)

    // List State
    const [tableData, setTableData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Upload Form State
    const [clientData, setClientData] = useState({ name: '', phone: '', email: '', eventDate: '', location: '' })
    const [eventType, setEventType] = useState('')
    const [eventDropdownOpen, setEventDropdownOpen] = useState(false)
    const [outdoorSubtype, setOutdoorSubtype] = useState('')
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false)
    const [customService, setCustomService] = useState('')
    const [fileSize, setFileSize] = useState('')
    const [photoDriveLink, setPhotoDriveLink] = useState('')
    const [videoDriveLink, setVideoDriveLink] = useState('')
    const [submitted, setSubmitted] = useState(false)

    useEffect(() => {
        if (view === 'list') {
            fetchLeads()
        }
    }, [view])

    const fetchLeads = async () => {
        setLoading(true)
        try {
            const res = await axios.get(`${API_URL}/dashboard/leads`)
            if (res.data?.success) {
                setTableData(res.data.data)
            }
        } catch (error) {
            console.error('Error fetching leads:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredData = useMemo(() => {
        return tableData.filter((item) => {
            const searchLower = searchTerm.toLowerCase()
            return (
                (item.leadName || '').toLowerCase().includes(searchLower) ||
                (String(item.id)).includes(searchLower) ||
                (item.eventType || '').toLowerCase().includes(searchLower)
            )
        })
    }, [tableData, searchTerm])

    const handleSelectLead = (lead: any) => {
        setSelectedLead(lead)
        setClientData({
            name: lead.leadName || '',
            phone: lead.phone || '',
            email: lead.email || '',
            eventDate: lead.eventDate || '',
            location: lead.location || ''
        })
        setEventType(lead.eventType || '')
        setSelectedServices([])
        setFileSize('')
        setPhotoDriveLink('')
        setVideoDriveLink('')
        setSubmitted(false)
        setView('upload')
    }

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

    const handleSubmit = () => {
        setSubmitted(true)
    }

    const canSubmit = selectedLead && eventType && selectedServices.length > 0 && fileSize && (photoDriveLink || videoDriveLink)

    if (view === 'list') {
        return (
            <div>
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Data Upload</h1>
                        <p className="text-sm" style={{ color: '#6B7280' }}>Upload and manage raw data files for client projects</p>
                    </div>
                </div>

                <div className="flex gap-4 mb-6 relative">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by lead name, ID, or event type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-purple-50 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-purple-200 transition-all placeholder-gray-500"
                        />
                    </div>
                </div>

                <div className="crm-card bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                {['Lead ID', 'Client Name', 'Event Type', 'Event Date', 'Status', 'Action'].map((h) => (
                                    <th key={h} className="text-left px-5 py-4 text-xs font-bold text-indigo-600">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-sm font-medium text-gray-500">
                                        Loading assignments...
                                    </td>
                                </tr>
                            ) : filteredData.length > 0 ? (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4 text-xs font-semibold text-indigo-500">#{row.id}</td>
                                        <td className="px-5 py-4 text-xs font-semibold text-gray-900">{row.leadName}</td>
                                        <td className="px-5 py-4 text-xs font-medium text-gray-700">{row.eventType || '—'}</td>
                                        <td className="px-5 py-4 text-xs text-gray-500">{row.eventDate ? row.eventDate.substring(0, 10) : '—'}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-3 py-1 text-[10px] font-bold rounded-lg ${
                                                row.status === 'new' ? 'bg-blue-100 text-blue-600' :
                                                row.status === 'completed' ? 'bg-green-100 text-green-600' :
                                                'bg-yellow-100 text-yellow-600'
                                            }`}>
                                                {row.status ? row.status.toUpperCase() : 'PENDING'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                onClick={() => handleSelectLead(row)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                                            >
                                                <Upload size={14} /> Upload Data
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-sm font-medium text-gray-500">
                                        No data found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#dcfce7' }}>
                    <CheckCircle2 size={32} style={{ color: '#16a34a' }} />
                </div>
                <h2 className="text-lg font-bold mb-1" style={{ color: '#111827' }}>Data sent to client successfully!</h2>
                <p className="text-sm mb-1" style={{ color: '#6B7280' }}>Client: {clientData.name} (#{selectedLead?.id})</p>
                <p className="text-sm mb-6" style={{ color: '#6B7280' }}>Status has been set to <b style={{ color: '#d97706' }}>QC Pending</b></p>
                <button
                    onClick={() => { setView('list'); setSubmitted(false) }}
                    className="mt-8 px-6 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #a78bfa, #5B5FC7)' }}
                >
                    Back to List
                </button>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Upload Raw Data</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Uploading files for {clientData.name} (#{selectedLead?.id})</p>
                </div>
                <button
                    onClick={() => setView('list')}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors text-gray-700"
                >
                    <ArrowLeft size={16} /> Back
                </button>
            </div>

            {/* Client Info Section */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6 flex flex-col gap-4">
                <h2 className="text-sm font-bold" style={{ color: '#111827' }}>Client Information</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl relative" style={{ background: '#F9F8FF', border: '1px solid #EDE9FE' }}>
                    {[
                        { label: 'Client Name', value: clientData.name },
                        { label: 'Phone', value: clientData.phone || '—' },
                        { label: 'Event Date', value: clientData.eventDate?.substring(0, 10) || '—' },
                        { label: 'Location', value: clientData.location || '—' },
                    ].map(f => (
                        <div key={f.label}>
                            <p className="text-xs font-semibold mb-1" style={{ color: '#5B5FC7' }}>{f.label}</p>
                            <p className="text-sm font-medium" style={{ color: '#111827' }}>{f.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Event & Services Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Event Name */}
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

                {/* Services */}
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
                                    {/* Custom "Edit" service */}
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

            {/* File Metadata Section */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
                <h2 className="text-sm font-bold mb-4" style={{ color: '#111827' }}>File Information</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold mb-2" style={{ color: '#374151' }}>Overall File Size</label>
                        <input
                            type="text"
                            placeholder="e.g. 256 GB"
                            value={fileSize}
                            onChange={e => setFileSize(e.target.value)}
                            className="w-full px-4 py-3 bg-purple-50 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-purple-200 transition-all placeholder-gray-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-2" style={{ color: '#374151' }}>Photo Drive Link</label>
                        <input
                            type="text"
                            placeholder="e.g. https://drive.google.com/..."
                            value={photoDriveLink}
                            onChange={e => setPhotoDriveLink(e.target.value)}
                            className="w-full px-4 py-3 bg-purple-50 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-purple-200 transition-all placeholder-gray-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-2" style={{ color: '#374151' }}>Video Drive Link</label>
                        <input
                            type="text"
                            placeholder="e.g. https://drive.google.com/..."
                            value={videoDriveLink}
                            onChange={e => setVideoDriveLink(e.target.value)}
                            className="w-full px-4 py-3 bg-purple-50 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-purple-200 transition-all placeholder-gray-500"
                        />
                    </div>
                </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #a78bfa, #5B5FC7)' }}
                >
                    <Upload size={16} /> Send to Client
                </button>
            </div>
        </div>
    )
}
