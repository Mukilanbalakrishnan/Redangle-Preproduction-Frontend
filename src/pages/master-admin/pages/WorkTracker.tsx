import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../../crm/components/ui/Badge'
import { masterAdminApi } from '../api/masterAdmin.api'
import type { MasterAdminFilters, MasterAdminWorkItem } from '../types'
import { flowBadgeLabel, formatDate, formatLabel } from '../utils'

export default function WorkTracker() {
  const [items, setItems] = useState<MasterAdminWorkItem[]>([])
  const [filters, setFilters] = useState<MasterAdminFilters>({ flowType: 'all', phase: 'all', search: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    masterAdminApi.workTracker(filters)
      .then(setItems)
      .catch(error => console.error('Master admin work tracker failed', error))
      .finally(() => setLoading(false))
  }, [filters])

  const visible = items.filter(item =>
    `${item.client} ${item.task} ${item.employee}`.toLowerCase().includes(String(filters.search || '').toLowerCase())
  )

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-bold text-gray-900">Sales Work Tracker</h1>
        <p className="text-sm text-gray-500">Combined work tracking across all sales clients</p>
      </div>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#E0DFFE] bg-[#F0EFFE] px-4 py-2.5">
          <Search size={14} className="text-gray-400" />
          <input value={filters.search || ''} onChange={event => setFilters(current => ({ ...current, search: event.target.value }))} className="flex-1 bg-transparent text-sm outline-none" placeholder="Search client, task, or employee..." />
        </div>
        <select value={filters.flowType || 'all'} onChange={event => setFilters(current => ({ ...current, flowType: event.target.value }))} className="rounded-xl border border-[#E0DFFE] bg-[#F0EFFE] px-4 py-2.5 text-sm text-indigo-700 outline-none">
          <option value="all">All flows</option>
          <option value="pre_wedding">Pre-wedding</option>
          <option value="post_wedding">Post-wedding</option>
        </select>
      </div>
      <div className="crm-table-wrap">
        <table className="w-full">
          <thead>
            <tr className="bg-[#FAFAFA]">
              {['Client', 'Flow', 'Phase', 'Task', 'Employee', 'Role', 'Priority', 'Status', 'Start', 'Deadline'].map(header => (
                <th key={header} className="px-5 py-3 text-left text-xs font-semibold text-gray-500">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="px-5 py-12 text-center text-sm text-gray-400">Loading work tracker...</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={10} className="px-5 py-12 text-center text-sm text-gray-400">No work tracker rows found.</td></tr>
            ) : visible.map(item => (
              <tr key={item.id} className="border-t border-gray-100">
                <td className="px-5 py-3 text-sm"><Link to={`/master-admin/sales/clients/${item.clientId}`} className="text-indigo-600 hover:underline">{item.client}</Link></td>
                <td className="px-5 py-3 text-sm text-gray-600">{flowBadgeLabel(item.flowType)}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{formatLabel(item.currentPhase)}</td>
                <td className="px-5 py-3 text-sm text-gray-900">{item.task}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{item.employee}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{item.role || '-'}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{item.priority || '-'}</td>
                <td className="px-5 py-3"><Badge status={formatLabel(item.status)} /></td>
                <td className="px-5 py-3 text-sm text-gray-500">{formatDate(item.startDate)}</td>
                <td className="px-5 py-3 text-sm text-gray-500">{formatDate(item.deadline)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
