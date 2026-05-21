import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../crm/components/ui/Badge'
import { masterAdminApi } from '../api/masterAdmin.api'
import type { MasterAdminFilters, MasterAdminInvoice } from '../types'
import { flowBadgeLabel, formatCurrency, formatDate } from '../utils'

export default function Invoices() {
  const [invoices, setInvoices] = useState<MasterAdminInvoice[]>([])
  const [filters, setFilters] = useState<MasterAdminFilters>({ flowType: 'all' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    masterAdminApi.invoices(filters)
      .then(setInvoices)
      .catch(error => console.error('Master admin invoices failed', error))
      .finally(() => setLoading(false))
  }, [filters])

  return (
    <div>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Sales Invoices</h1>
          <p className="text-sm text-gray-500">Combined billing across pre-wedding and post-wedding clients</p>
        </div>
        <select value={filters.flowType || 'all'} onChange={event => setFilters({ flowType: event.target.value })} className="rounded-xl border border-[#E0DFFE] bg-[#F0EFFE] px-4 py-2.5 text-sm text-indigo-700 outline-none">
          <option value="all">All flows</option>
          <option value="pre_wedding">Pre-wedding</option>
          <option value="post_wedding">Post-wedding</option>
        </select>
      </div>
      <div className="crm-table-wrap">
        <table className="w-full">
          <thead>
            <tr className="bg-[#FAFAFA]">
              {['Invoice ID', 'Client', 'Flow', 'Event type', 'Total', 'Paid', 'Balance', 'Status', 'Due date'].map(header => (
                <th key={header} className="px-5 py-3 text-left text-xs font-semibold text-gray-500">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-gray-400">Loading invoices...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-gray-400">No invoices found.</td></tr>
            ) : invoices.map(invoice => (
              <tr key={`${invoice.clientId}-${invoice.invoiceId}`} className="border-t border-gray-100">
                <td className="px-5 py-3 text-sm font-medium text-indigo-600">{invoice.invoiceId}</td>
                <td className="px-5 py-3 text-sm"><Link to={`/master-admin/sales/clients/${invoice.clientId}`} className="text-indigo-600 hover:underline">{invoice.client}</Link></td>
                <td className="px-5 py-3 text-sm text-gray-600">{flowBadgeLabel(invoice.flowType)}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{invoice.eventType}</td>
                <td className="px-5 py-3 text-sm text-gray-900">{formatCurrency(invoice.total)}</td>
                <td className="px-5 py-3 text-sm text-gray-900">{formatCurrency(invoice.paid)}</td>
                <td className="px-5 py-3 text-sm text-gray-900">{formatCurrency(invoice.balance)}</td>
                <td className="px-5 py-3"><Badge status={invoice.status} /></td>
                <td className="px-5 py-3 text-sm text-gray-500">{formatDate(invoice.dueDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
