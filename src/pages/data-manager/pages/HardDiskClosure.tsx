import { useState, useEffect, useMemo } from 'react'
import { Search, HardDrive, CheckCircle2, Eye, ArrowLeft, Save } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'

export default function HardDiskClosure() {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

    const [view, setView] = useState<'list' | 'form'>('list')
    const [selectedLead, setSelectedLead] = useState<any>(null)

    // Data State for List View
    const [incomingData, setIncomingData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Form States - Client
    const [clientId, setClientId] = useState('')
    const [clientData, setClientData] = useState({ name: '', phone: '', email: '', eventDate: '', location: '' })
    
    // Form States - Handover
    const [handoverDiskNumber, setHandoverDiskNumber] = useState('')
    const [handoverDiskLabel, setHandoverDiskLabel] = useState('')
    const [handoverDate, setHandoverDate] = useState('')
    const [handoverPerson, setHandoverPerson] = useState('')
    const [handoverNotes, setHandoverNotes] = useState('')

    // Form States - Receive
    const [receiveDiskNumber, setReceiveDiskNumber] = useState('')
    const [receiveDiskLabel, setReceiveDiskLabel] = useState('')
    const [receiveDate, setReceiveDate] = useState('')
    const [receivePerson, setReceivePerson] = useState('')
    const [receiveNotes, setReceiveNotes] = useState('')

    const [submitted, setSubmitted] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const fetchIncomingData = async () => {
            try {
                const res = await axios.get(`${API_URL}/data-manager/incoming`)
                if (res.data.success && res.data.data) {
                    const mappedData = res.data.data
                        .filter((item: any) => item.status === 'crm_verified' || item.status === 'harddisk_closed')
                        .map((item: any) => ({
                            id: String(item.id),
                            client: item.client,
                            date: item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
                            status: item.status === 'harddisk_closed' ? 'Closed' : 'QC Completed',
                            rawData: item
                        }))
                    setIncomingData(mappedData)
                }
            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setLoading(false)
            }
        }
        if (view === 'list') {
            fetchIncomingData()
        }
    }, [view, API_URL])

    // Pre-fill form when lead is selected and fetch any saved progress
    useEffect(() => {
        if (selectedLead && view === 'form') {
            setClientId(selectedLead.id)
            setClientData({
                name: selectedLead.client,
                phone: selectedLead.rawData?.phone || '—',
                email: selectedLead.rawData?.email || '—',
                eventDate: selectedLead.date,
                location: selectedLead.rawData?.location || '—',
            })

            // Fetch saved Hard Disk Closure Data
            const fetchClosureData = async () => {
                try {
                    const res = await axios.get(`${API_URL}/data-manager/hard-disk-closure/${selectedLead.id}`)
                    if (res.data.success && res.data.data) {
                        const d = res.data.data;
                        if (d.handover_disk_number) setHandoverDiskNumber(d.handover_disk_number);
                        if (d.handover_disk_label) setHandoverDiskLabel(d.handover_disk_label);
                        if (d.handover_date) setHandoverDate(new Date(d.handover_date).toISOString().split('T')[0]);
                        if (d.handover_person) setHandoverPerson(d.handover_person);
                        if (d.handover_notes) setHandoverNotes(d.handover_notes);

                        if (d.receive_disk_number) setReceiveDiskNumber(d.receive_disk_number);
                        if (d.receive_disk_label) setReceiveDiskLabel(d.receive_disk_label);
                        if (d.receive_date) setReceiveDate(new Date(d.receive_date).toISOString().split('T')[0]);
                        if (d.receive_person) setReceivePerson(d.receive_person);
                        if (d.receive_notes) setReceiveNotes(d.receive_notes);
                    }
                } catch (error) {
                    console.error('Error fetching closure data:', error)
                }
            }
            fetchClosureData()
        }
    }, [selectedLead, view, API_URL])

    const filteredData = useMemo(() => {
        return incomingData.filter((item) => {
            const searchLower = searchTerm.toLowerCase()
            return item.client.toLowerCase().includes(searchLower) ||
                   item.id.toLowerCase().includes(searchLower)
        })
    }, [incomingData, searchTerm])

    const saveChanges = async (isFinal: boolean) => {
        if (!clientId) return;
        setIsSaving(true);
        try {
            const payload = {
                handover_disk_number: handoverDiskNumber,
                handover_disk_label: handoverDiskLabel,
                handover_date: handoverDate,
                handover_person: handoverPerson,
                handover_notes: handoverNotes,
                receive_disk_number: receiveDiskNumber,
                receive_disk_label: receiveDiskLabel,
                receive_date: receiveDate,
                receive_person: receivePerson,
                receive_notes: receiveNotes,
                status: isFinal ? 'Closed' : 'Pending'
            };
            const res = await axios.post(`${API_URL}/data-manager/hard-disk-closure/${clientId}`, payload);
            if (res.data.success) {
                if (isFinal) {
                    setSubmitted(true);
                } else {
                    toast.success("Progress saved successfully");
                }
            }
        } catch (error) {
            console.error('Failed to save closure data', error);
            toast.error("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    }

    const canSubmit = clientId && 
                      (handoverDiskNumber || receiveDiskNumber) && 
                      (handoverPerson || receivePerson) && 
                      (handoverDate || receiveDate)

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#dcfce7' }}>
                    <CheckCircle2 size={32} style={{ color: '#16a34a' }} />
                </div>
                <h2 className="text-lg font-bold mb-1" style={{ color: '#111827' }}>Project Closed Successfully!</h2>
                <p className="text-sm mb-1" style={{ color: '#6B7280' }}>Client: {clientData.name} ({clientId.toUpperCase()})</p>
                <p className="text-sm mb-6" style={{ color: '#6B7280' }}>Hard Disk handover/receive recorded and status set to <b style={{ color: '#16a34a' }}>Closed</b></p>
                <div className="flex gap-3">
                    <span className="px-4 py-2 rounded-full text-xs font-bold" style={{ background: '#dcfce7', color: '#16a34a' }}>Project Closed</span>
                </div>
                <button
                    onClick={() => {
                        setSubmitted(false);
                        setClientId('');
                        setClientData({ name: '', phone: '', email: '', eventDate: '', location: '' });
                        
                        setHandoverDiskNumber(''); setHandoverDiskLabel(''); setHandoverDate(''); setHandoverPerson(''); setHandoverNotes('');
                        setReceiveDiskNumber(''); setReceiveDiskLabel(''); setReceiveDate(''); setReceivePerson(''); setReceiveNotes('');
                        
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
                    <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Hard Disk & Closure Management</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Select a QC Completed lead to process hard disk handover</p>
                </div>

                <div className="flex gap-4 mb-6 relative">
                    <div className="flex-1 relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by client name or ID..."
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
                                {['Lead ID', 'Client Name', 'Event Date', 'Status', 'Action'].map((h) => (
                                    <th key={h} className="text-left px-5 py-4 text-xs font-bold text-indigo-600">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm font-medium text-gray-500">
                                        Loading ready leads...
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
                                                row.status === 'Closed' 
                                                    ? 'bg-green-100 text-green-600' 
                                                    : 'bg-blue-100 text-blue-600'
                                            }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                onClick={() => { setSelectedLead(row); setView('form') }}
                                                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                                            >
                                                <Eye size={14} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm font-medium text-gray-500">
                                        No QC Completed leads ready for closure found.
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
        <div className="max-w-4xl mx-auto pb-10">
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
                    <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Hard Disk & Closure</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Record footage deliverables and project closure</p>
                </div>
            </div>

            {/* Client Lookup Section (Readonly) */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
                <h2 className="text-sm font-bold mb-4" style={{ color: '#111827' }}>Client Details</h2>
                <div className="flex gap-3 mb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Client Relationship ID (Auto-filled)"
                            value={clientId}
                            readOnly
                            className="w-full pl-10 pr-4 py-3 bg-purple-50 rounded-xl text-sm border-none outline-none transition-all text-gray-500 cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl" style={{ background: '#F9F8FF', border: '1px solid #EDE9FE' }}>
                    {[
                        { label: 'Client Name', value: clientData.name },
                        { label: 'Phone', value: clientData.phone },
                        { label: 'Email', value: clientData.email },
                        { label: 'Event Date', value: clientData.eventDate },
                    ].map(f => (
                        <div key={f.label}>
                            <p className="text-xs font-semibold mb-1" style={{ color: '#5B5FC7' }}>{f.label}</p>
                            <p className="text-sm font-medium" style={{ color: '#111827' }}>{f.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                {/* Handover Details */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#111827' }}>
                        <HardDrive size={16} className="text-purple-500" />
                        Hard Disk Handover Details
                    </h2>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Hard Disk Number</label>
                            <input
                                type="text"
                                placeholder="e.g. HD-2026-045"
                                value={handoverDiskNumber}
                                onChange={e => setHandoverDiskNumber(e.target.value)}
                                className="w-full px-4 py-2.5 bg-purple-50 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-purple-200"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Hard Disk Name/Label</label>
                            <input
                                type="text"
                                placeholder="e.g. WD MyPassport 2TB"
                                value={handoverDiskLabel}
                                onChange={e => setHandoverDiskLabel(e.target.value)}
                                className="w-full px-4 py-2.5 bg-purple-50 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-purple-200"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Handover Person Name</label>
                            <input
                                type="text"
                                placeholder="Name of person handing over"
                                value={handoverPerson}
                                onChange={e => setHandoverPerson(e.target.value)}
                                className="w-full px-4 py-2.5 bg-purple-50 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-purple-200"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Handover Date</label>
                            <input
                                type="date"
                                value={handoverDate}
                                onChange={e => setHandoverDate(e.target.value)}
                                className="w-full px-4 py-2.5 bg-purple-50 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-purple-200"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Handover Notes</label>
                            <textarea
                                placeholder="Add notes..."
                                value={handoverNotes}
                                onChange={e => setHandoverNotes(e.target.value)}
                                className="w-full px-4 py-2.5 bg-purple-50 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-purple-200 min-h-[80px] resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Receive Details */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                    <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#111827' }}>
                        <HardDrive size={16} className="text-blue-500" />
                        Hard Disk Receive Details
                    </h2>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Hard Disk Number</label>
                            <input
                                type="text"
                                placeholder="e.g. HD-2026-045"
                                value={receiveDiskNumber}
                                onChange={e => setReceiveDiskNumber(e.target.value)}
                                className="w-full px-4 py-2.5 bg-blue-50 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Hard Disk Name/Label</label>
                            <input
                                type="text"
                                placeholder="e.g. WD MyPassport 2TB"
                                value={receiveDiskLabel}
                                onChange={e => setReceiveDiskLabel(e.target.value)}
                                className="w-full px-4 py-2.5 bg-blue-50 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Receive Person Name</label>
                            <input
                                type="text"
                                placeholder="Name of person receiving"
                                value={receivePerson}
                                onChange={e => setReceivePerson(e.target.value)}
                                className="w-full px-4 py-2.5 bg-blue-50 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Receive Date</label>
                            <input
                                type="date"
                                value={receiveDate}
                                onChange={e => setReceiveDate(e.target.value)}
                                className="w-full px-4 py-2.5 bg-blue-50 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>Receive Notes</label>
                            <textarea
                                placeholder="Add notes..."
                                value={receiveNotes}
                                onChange={e => setReceiveNotes(e.target.value)}
                                className="w-full px-4 py-2.5 bg-blue-50 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-blue-200 min-h-[80px] resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={() => saveChanges(false)}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-gray-700 bg-white border border-gray-200 transition-all hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Save size={16} className="text-gray-500" /> Save Progress
                </button>
                <button
                    onClick={() => saveChanges(true)}
                    disabled={!canSubmit || isSaving}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #a78bfa, #5B5FC7)' }}
                >
                    <HardDrive size={16} /> Mark Project as Closed
                </button>
            </div>
        </div>
    )
}
