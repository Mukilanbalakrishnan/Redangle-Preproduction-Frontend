import { Copy, ExternalLink, Bell, Send, CalendarDays, Eye, ArrowLeft, Filter, Download } from 'lucide-react'
import { useState, useEffect } from 'react'
import axios from 'axios'

type Client = {
    id: string
    serialNumber?: string
    name: string
    email: string
    phone: string
    location: string
    eventDate: string
    shootType: string
    status: string
    executive: string
}

export default function ClientDelivery() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const [search, setSearch] = useState('');
    const [eventDateSearch, setEventDateSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/dashboard/leads`
                );

                const formatted = (res.data.data || []).map((lead: any) => ({
                    id: String(lead.id),
                    serialNumber: lead.serialNumber,
                    name: lead.leadName ?? "Unknown Client",
                    email: lead.email ?? "-",
                    phone: lead.phone ?? "-",
                    location: lead.location ?? "-",
                    eventDate: lead.eventDate ? new Date(lead.eventDate).toLocaleDateString('en-GB') : "-",
                    shootType: lead.eventType ?? "-",
                    status: lead.status === "new" ? "New" : lead.status === "completed" ? "Completed" : "New",
                    executive: "Unassigned",
                }));

                setClients(formatted);
            } catch (err) {
                console.error("Client fetch failed", err);
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, []);

    const handleOpenDetail = (client: Client) => {
        setSelectedClient(client);
        setView('detail');
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const handleOpenLink = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const filtered = clients.filter(c => {
        const textMatch = (c.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (c.id ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (c.serialNumber ?? "").toLowerCase().includes(search.toLowerCase());

        let formattedSearchDate = '';
        if (eventDateSearch) {
            const [year, month, day] = eventDateSearch.split('-');
            formattedSearchDate = `${day}/${month}/${year}`;
        }
        const dateMatch = eventDateSearch ? c.eventDate === formattedSearchDate : true;

        const statusMatch = statusFilter === 'All' ? true : c.status === statusFilter;
        const typeMatch = typeFilter === 'All' ? true : c.shootType === typeFilter;

        return textMatch && dateMatch && statusMatch && typeMatch;
    });

    const uniqueTypes = Array.from(new Set(clients.map(c => c.shootType).filter(t => t && t !== "-")));
    const uniqueStatuses = Array.from(new Set(clients.map(c => c.status).filter(s => s && s !== "-")));

    const handleDownloadReport = () => {
        if (filtered.length === 0) return;

        const headers = ['Lead ID', 'Client Name', 'E-mail ID', 'Event date', 'Event type', 'Status', 'Executive'];
        const csvRows = filtered.map(c => [
            c.serialNumber || c.id, c.name, c.email, c.eventDate, c.shootType, c.status, c.executive
        ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(","));

        const csvContent = [headers.join(","), ...csvRows].join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        const d = new Date();
        const dateStr = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;

        link.setAttribute("href", url);
        link.setAttribute("download", `client_delivery_report_${dateStr}.csv`);
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (view === 'list') {
        return (
            <div>
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Client Delivery</h1>
                        <p className="text-sm" style={{ color: '#6B7280' }}>Manage client deliveries</p>
                    </div>
                    <button
                        onClick={handleDownloadReport}
                        className="crm-card flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ color: '#6B7280' }}
                        disabled={filtered.length === 0}
                    >
                        <Download size={14} /> Download report
                    </button>
                </div>

                {/* Search + Filter bar */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 flex-1"
                        style={{ background: '#F0EFFE', border: '1px solid #E0DFFE' }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2}>
                            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                        </svg>
                        <input type="text" placeholder="Search by client name or ID..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="bg-transparent outline-none text-sm flex-1" style={{ color: '#374151' }} />
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm"
                        style={{ background: '#F0EFFE', border: '1px solid #E0DFFE', color: '#5B5FC7', cursor: 'pointer' }}>
                        <input type="date" className="bg-transparent outline-none" value={eventDateSearch} onChange={(e) => setEventDateSearch(e.target.value)} />
                    </div>
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flex items-center gap-1.5 px-8 pt-2.5 pb-2.5 rounded-xl text-sm appearance-none outline-none"
                            style={{ background: '#F0EFFE', border: '1px solid #E0DFFE', color: '#5B5FC7', cursor: 'pointer', paddingLeft: '36px', paddingRight: '28px' }}
                        >
                            <option value="All">All Status</option>
                            {uniqueStatuses.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <Filter size={14} className="absolute left-3 top-3" style={{ color: '#5B5FC7', pointerEvents: 'none' }} />
                        <svg className="absolute right-3 top-3.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5B5FC7" strokeWidth={2} style={{ pointerEvents: 'none' }}><path d="M6 9l6 6 6-6" /></svg>
                    </div>
                    <div className="relative">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="flex items-center gap-1.5 px-4 pt-2.5 pb-2.5 rounded-xl text-sm appearance-none outline-none"
                            style={{ background: '#F0EFFE', border: '1px solid #E0DFFE', color: '#5B5FC7', cursor: 'pointer', paddingRight: '28px' }}
                        >
                            <option value="All">All Types</option>
                            {uniqueTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        <svg className="absolute right-3 top-3.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5B5FC7" strokeWidth={2} style={{ pointerEvents: 'none' }}><path d="M6 9l6 6 6-6" /></svg>
                    </div>
                </div>

                <div className="crm-table-wrap">
                    <table className="w-full">
                        <thead>
                            <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                                {['Lead ID', 'Client Name', 'E-mail ID', 'Event date', 'Event type', 'Action'].map(h => (
                                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center px-5 py-12 text-sm" style={{ color: '#9CA3AF' }}>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                            <span>Loading clients...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center px-5 py-12 text-sm" style={{ color: '#9CA3AF' }}>No clients found</td>
                                </tr>
                            ) : (
                                filtered.map((c, i) => (
                                    <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}>
                                        <td className="px-5 py-3 text-sm font-medium" style={{ color: '#5B5FC7' }}>{c.serialNumber || c.id}</td>
                                        <td className="px-5 py-3 text-sm" style={{ color: '#111827' }}>{c.name}</td>
                                        <td className="px-5 py-3 text-sm" style={{ color: '#6B7280' }}>{c.email}</td>
                                        <td className="px-5 py-3 text-sm" style={{ color: '#111827' }}>{c.eventDate}</td>
                                        <td className="px-5 py-3 text-sm" style={{ color: '#111827' }}>{c.shootType}</td>
                                        <td className="px-5 py-3">
                                            <button onClick={() => handleOpenDetail(c)} style={{ color: '#9CA3AF' }} className="hover:text-indigo-600 transition-colors">
                                                <Eye size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-3 mb-5">
                <button
                    onClick={() => setView('list')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                >
                    <ArrowLeft size={20} className="text-gray-500 group-hover:text-gray-900" />
                </button>
                <div>
                    <h1 className="text-lg font-bold" style={{ color: '#111827' }}>Client Delivery</h1>
                    <p className="text-sm" style={{ color: '#6B7280' }}>Send final output to the client</p>
                </div>
            </div>

            {/* Delivery Summary */}
            <div className="crm-card p-5 mb-5">
                <p className="text-sm font-semibold mb-4" style={{ color: '#111827' }}>Delivery Summary</p>
                <div className="flex items-center gap-8">
                    {[
                        { label: 'Client', value: selectedClient?.name || 'Unknown Client', icon: '👤', bg: '#FFF3E0' },
                        { label: 'Project', value: selectedClient?.shootType || 'Unknown Project', icon: '📷', bg: '#EDE9FE' },
                        { label: 'Status', value: 'Ready for Delivery', icon: '✓', bg: '#DCFCE7', valueColor: '#16A34A' },
                    ].map(item => (
                        <div key={item.label} className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: item.bg }}>{item.icon}</div>
                            <div>
                                <div className="text-xs" style={{ color: '#9CA3AF' }}>{item.label}</div>
                                <div className="text-sm font-semibold" style={{ color: item.valueColor || '#111827' }}>{item.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-5">
                {/* Final File Links */}
                <div className="crm-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <ExternalLink size={14} style={{ color: '#6B7280' }} />
                        <span className="text-sm font-semibold" style={{ color: '#111827' }}>Final File Links</span>
                    </div>
                    {[{ label: 'Photos Download Link', url: 'https://drive.google.com/folder/abc12' },
                    { label: 'Videos Download Link', url: 'https://drive.google.com/folder/abc12' }].map(link => (
                        <div key={link.label} className="mb-4">
                            <p className="text-xs font-medium mb-1.5" style={{ color: '#374151' }}>{link.label}</p>
                            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ border: '1px solid #E5E7EB' }}>
                                <span className="text-sm flex-1 truncate" style={{ color: '#6B7280' }}>{link.url}</span>
                                <button onClick={() => handleCopy(link.url)} style={{ color: '#9CA3AF' }} className="hover:text-indigo-600 transition-colors" title="Copy link"><Copy size={14} /></button>
                                <button onClick={() => handleOpenLink(link.url)} style={{ color: '#9CA3AF' }} className="hover:text-indigo-600 transition-colors" title="Open link"><ExternalLink size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Cloud Storage Access */}
                <div className="crm-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <span>☁️</span>
                        <span className="text-sm font-semibold" style={{ color: '#111827' }}>Cloud Storage Access</span>
                    </div>
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-2" style={{ color: '#374151' }}>
                            <span>Storage Used</span><span>12.5 GB/50 GB</span>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: '#F3F4F6' }}>
                            <div className="h-2 rounded-full" style={{ width: '25%', background: '#5B5FC7' }} />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Client Portal Access</p>
                        <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ border: '1px solid #E5E7EB' }}>
                            <span className="text-sm flex-1 truncate" style={{ color: '#6B7280' }}>https://portal.photostudio.com/client/sharma</span>
                            <button onClick={() => handleCopy('https://portal.photostudio.com/client/sharma')} style={{ color: '#9CA3AF' }} className="hover:text-indigo-600 transition-colors" title="Copy link"><Copy size={14} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delivery Details */}
            <div className="crm-card p-5 mb-5">
                <div className="flex items-center gap-2 mb-4">
                    <CalendarDays size={14} style={{ color: '#6B7280' }} />
                    <span className="text-sm font-semibold" style={{ color: '#111827' }}>Delivery Details</span>
                </div>
                <div className="grid grid-cols-3 gap-5">
                    {[
                        { label: 'Delivery Date', placeholder: 'dd-mm-yyyy', icon: true },
                        { label: 'Text Files', value: '245 photos, 3 Videos' },
                        { label: 'Total Size', value: '12.5 GB' },
                    ].map(item => (
                        <div key={item.label}>
                            <p className="text-xs font-medium mb-1.5" style={{ color: '#374151' }}>{item.label}</p>
                            <div className="flex items-center justify-between rounded-lg px-3 py-2.5"
                                style={{ border: '1px solid #E5E7EB' }}>
                                <span className="text-sm" style={{ color: item.value ? '#111827' : '#9CA3AF' }}>
                                    {item.value || item.placeholder}
                                </span>
                                {item.icon && <CalendarDays size={14} style={{ color: '#9CA3AF' }} />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <button className="crm-card px-5 py-2.5 text-sm font-medium" style={{ color: '#374151' }}>Cancel</button>
                <button className="crm-card flex items-center gap-2 px-5 py-2.5 text-sm font-medium" style={{ color: '#374151' }}>
                    <Bell size={13} /> Notify Chat
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium text-white"
                    style={{ background: '#5B5FC7' }}>
                    <Send size={13} /> Send to Client
                </button>
            </div>
        </div>
    )
}
