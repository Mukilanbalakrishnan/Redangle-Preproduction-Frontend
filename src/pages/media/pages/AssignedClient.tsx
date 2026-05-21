import { useState, useEffect } from 'react'
import { Eye, Filter, Search } from 'lucide-react'

import ClientDetailsView from './ClientDetailsView'
import { useMediaRole } from '../../../hooks/useMediaRole'

const API_URL = import.meta.env.VITE_API_URL


interface AssignedLead {
    lead_employee_id: number
    lead_id: number
    lead_code: string
    name: string
    type: string
    task_name: string
    priority: string
    deadline: string
    description: string
    status?: string
    accepted?: boolean
}

const getStatusStyle = (s: string) => {
    switch (s?.toLowerCase()) {
        case 'high': return { background: '#FCE4EC', color: '#C2185B' }
        case 'medium': return { background: '#FFF3E0', color: '#E65100' }
        case 'low': return { background: '#E8F5E9', color: '#2E7D32' }
        case 'pending': return { background: '#FFF3E0', color: '#E65100' }
        case 'in progress': return { background: '#E8F0FE', color: '#1565C0' }
        case 'completed': return { background: '#E8F5E9', color: '#2E7D32' }
        default: return { background: '#F3F4F6', color: '#6B7280' }
    }
}

export default function AssignedClient() {
    const { employeeId, isPhotographer, isVideographer, isDrone } = useMediaRole()
    const [view, setView] = useState<'list' | 'details'>('list')
    const [selectedLead, setSelectedLead] = useState<any>(null)
    const [leads, setLeads] = useState<AssignedLead[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (!employeeId) { setLoading(false); return }
        fetch(`${API_URL}/employee/${employeeId}/assigned-projects`)
            .then(res => res.json())
            .then(result => {
                if (result.success) setLeads(result.data)
            })
            .catch(err => console.error('Assigned leads fetch error:', err))
            .finally(() => setLoading(false))
    }, [employeeId])

    if (view === 'details' && selectedLead) return <ClientDetailsView client={selectedLead} onBack={() => setView('list')} />

    const roleLeads = leads.filter(p => {
        const task = (p.task_name || '').toLowerCase()
        if (isDrone) return task.includes('drone')
        if (isVideographer) return task.includes('video')
        if (isPhotographer) return task.includes('photo')
        return true
    })

    const filteredLeads = roleLeads.filter(p => {
        const q = searchQuery.toLowerCase()
        return p.name?.toLowerCase().includes(q) || p.type?.toLowerCase().includes(q) || p.lead_code?.toLowerCase().includes(q)
    })

    return (
        <div>
            <div className="flex items-start justify-between mb-5"><div><h1 className="text-lg font-bold" style={{ color: '#111827' }}>Assigned Leads</h1><p className="text-sm" style={{ color: '#6B7280' }}>View and manage your assigned leads</p></div></div>
            <div className="flex gap-4 mb-5">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={16} style={{ color: '#9CA3AF' }} />
                    <input
                        type="text"
                        placeholder="Search by client name or ID..."
                        className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm font-medium outline-none transition-colors"
                        style={{ borderColor: '#E5E7EB', color: '#111827' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors" style={{ background: '#F5F3FF', color: '#5B5FC7', border: '1px solid #E5E7EB' }}><Filter size={16} /> Filter</button>
            </div>
            <div className="crm-table-wrap">
                <table className="w-full">
                    <thead><tr style={{ background: '#FAFAFA' }}>{['Lead ID', 'Client Name', 'Event Type', 'Task', 'Priority', 'Deadline', 'Action'].map(h => (<th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>))}</tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="text-center px-5 py-10 text-sm" style={{ color: '#9CA3AF' }}>Loading...</td></tr>
                        ) : filteredLeads.length === 0 ? (
                            <tr><td colSpan={7} className="text-center px-5 py-10 text-sm" style={{ color: '#9CA3AF' }}>No assigned leads found</td></tr>
                        ) : (
                            filteredLeads.map((lead) => (
    <tr key={lead.lead_id} style={{ borderTop: '1px solid #F3F4F6' }}>
                                    <td className="px-5 py-3 text-sm font-medium" style={{ color: '#5B5FC7' }}>{lead.lead_code || `LD-${lead.lead_id}`}</td>
                                    <td className="px-5 py-3 text-sm font-medium" style={{ color: '#111827' }}>{lead.name}</td>
                                    <td className="px-5 py-3 text-sm" style={{ color: '#111827' }}>{lead.type || '—'}</td>
                                    <td className="px-5 py-3 text-sm" style={{ color: '#6B7280' }}>{lead.task_name || '—'}</td>
                                    <td className="px-5 py-3"><span className="crm-badge" style={getStatusStyle(lead.priority)}>{lead.priority || '—'}</span></td>
                                    <td className="px-5 py-3 text-sm" style={{ color: '#6B7280' }}>{lead.deadline || '—'}</td>
                                    <td className="px-5 py-3">
                                        <button
                                            onClick={() => {
                                                setSelectedLead({
                                                    id: lead.lead_code || `LD-${lead.lead_id}`,
                                                    name: lead.name,
                                                    eventType: lead.type,
                                                    location: '',
                                                    date: lead.deadline,
                                                    status: lead.priority,
                                                    lead_id: String(lead.lead_id),
                                                    task_name: lead.task_name
                                                })
                                                setView('details')
                                            }}
                                            className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-purple-600"
                                            style={{ color: '#9CA3AF' }}
                                        >
                                            <Eye size={15} /> View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

