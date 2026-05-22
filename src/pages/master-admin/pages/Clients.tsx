import { useEffect, useState } from 'react'
import { Download, Eye, Filter, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../../crm/components/ui/Badge'
import { masterAdminApi } from '../api/masterAdmin.api'
import type { MasterAdminClient, MasterAdminFilters } from '../types'
import { flowBadgeLabel, formatCurrency, formatDate, formatLabel } from '../utils'

export default function Clients() {
  const [clients, setClients] = useState<MasterAdminClient[]>([])
  const [filters, setFilters] = useState<MasterAdminFilters>({ flowType: 'all', phase: 'all', search: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    masterAdminApi.clients(filters)
      .then(setClients)
      .catch(error => console.error('Master admin clients failed', error))
      .finally(() => setLoading(false))
  }, [filters])

  return (
    <div>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Sales Clients</h1>
          <p className="text-sm text-gray-500">Combined client list across pre-wedding and post-wedding flows</p>
        </div>
        <button className="crm-card flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500">
          <Download size={14} /> Download report
        </button>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl px-4 py-2.5" style={{ background: '#F0EFFE', border: '1px solid #E0DFFE' }}>
          <Search size={14} className="text-gray-400" />
          <input
            value={filters.search || ''}
            onChange={event => setFilters(current => ({ ...current, search: event.target.value }))}
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
            placeholder="Search by client name, lead ID, phone, or email..."
          />
        </div>
        <select value={filters.flowType || 'all'} onChange={event => setFilters(current => ({ ...current, flowType: event.target.value }))} className="rounded-xl border border-[#E0DFFE] bg-[#F0EFFE] px-4 py-2.5 text-sm text-indigo-700 outline-none">
          <option value="all">All flows</option>
          <option value="pre_wedding">Pre-wedding</option>
          <option value="post_wedding">Post-wedding</option>
        </select>
        <select value={filters.phase || 'all'} onChange={event => setFilters(current => ({ ...current, phase: event.target.value }))} className="rounded-xl border border-[#E0DFFE] bg-[#F0EFFE] px-4 py-2.5 text-sm text-indigo-700 outline-none">
          <option value="all">All phases</option>
          <option value="pre_production">Pre-production</option>
          <option value="event">Event</option>
          <option value="post_production">Post-production</option>
        </select>
        <div className="flex items-center gap-1.5 rounded-xl border border-[#E0DFFE] bg-[#F0EFFE] px-4 py-2.5 text-sm text-indigo-700">
          <Filter size={14} /> Filters
        </div>
      </div>

      <div className="crm-table-wrap">
        <table className="w-full">
          <thead>
            <tr className="bg-[#FAFAFA]">
              {['Lead ID', 'Client', 'Contact', 'Event', 'Flow', 'Phase', 'Assignment', 'Team', 'Balance', 'Action'].map(header => (
                <th key={header} className="px-5 py-3 text-left text-xs font-semibold text-gray-500">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="px-5 py-12 text-center text-sm text-gray-400">Loading clients...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={10} className="px-5 py-12 text-center text-sm text-gray-400">No clients found.</td></tr>
            ) : clients.map(client => (
              <tr key={client.id} className="border-t border-gray-100">
                <td className="px-5 py-3 text-sm font-medium text-indigo-600">{client.serialNumber}</td>
                <td className="px-5 py-3 text-sm"><Link className="text-indigo-600 hover:underline" to={`/master-admin/sales/clients/${client.id}`}>{client.name}</Link></td>
                <td className="px-5 py-3 text-sm text-gray-500">{client.phone}<br /><span className="text-xs">{client.email}</span></td>
                <td className="px-5 py-3 text-sm text-gray-700">{client.eventType}<br /><span className="text-xs text-gray-500">{formatDate(client.eventDate)}</span></td>
                <td className="px-5 py-3 text-sm text-gray-600">{flowBadgeLabel(client.flowType)}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{formatLabel(client.currentPhase)}</td>
                <td className="px-5 py-3"><Badge status={client.assignmentStatus} /></td>
                <td className="max-w-[220px] truncate px-5 py-3 text-sm text-gray-500">{client.assignedTeamSummary}</td>
                <td className="px-5 py-3 text-sm text-gray-900">{formatCurrency(client.invoiceBalance)}</td>
                <td className="px-5 py-3">
                  <Link to={`/master-admin/sales/clients/${client.id}`} title="View client" className="inline-flex text-gray-400 transition-colors hover:text-indigo-600">
                    <Eye size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
