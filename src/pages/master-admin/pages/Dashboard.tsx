import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Clock, IndianRupee, Receipt, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import StatCard from '../../crm/components/ui/StatCard'
import Badge from '../../crm/components/ui/Badge'
import { masterAdminApi } from '../api/masterAdmin.api'
import type { MasterAdminDashboardData } from '../types'
import { flowBadgeLabel, formatCurrency, formatDate, formatLabel } from '../utils'

export default function Dashboard() {
  const [data, setData] = useState<MasterAdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    masterAdminApi.dashboard()
      .then(setData)
      .catch(error => console.error('Master admin dashboard failed', error))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Loading dashboard...</div>
  if (!data) return <div className="crm-card p-8 text-center text-sm text-gray-500">No dashboard data available.</div>

  const combined = data.combined

  return (
    <div>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-sm text-gray-500">Combined sales overview with pre-wedding and post-wedding breakdowns</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard title="Total clients" value={combined.totalClients} subtitle="Combined Sales" iconBg="#EDE9FE" icon={<Users size={17} color="#7C3AED" />} />
        <StatCard title="Active clients" value={combined.activeClients} subtitle="Open assignments" iconBg="#E8F0FE" icon={<Clock size={17} color="#1565C0" />} />
        <StatCard title="Completed clients" value={combined.completedClients} subtitle="Closed or delivered" iconBg="#E8F5E9" icon={<CheckCircle size={17} color="#2E7D32" />} />
        <StatCard title="Pending follow-ups" value={combined.pendingFollowUps} subtitle="Needs attention" iconBg="#FCE4EC" icon={<AlertCircle size={17} color="#C2185B" />} />
      </div>

      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard title="Assigned employees" value={combined.assignedEmployees} subtitle="Available in system" iconBg="#ECFDF5" icon={<Users size={17} color="#059669" />} />
        <StatCard title="Open work items" value={combined.openWorkItems} subtitle="Across clients" iconBg="#FFF3E0" icon={<Clock size={17} color="#F57C00" />} />
        <StatCard title="Invoice paid" value={formatCurrency(combined.invoicePaid)} subtitle="Collected" iconBg="#DCFCE7" icon={<IndianRupee size={17} color="#16A34A" />} />
        <StatCard title="Invoice balance" value={formatCurrency(combined.invoiceBalance)} subtitle="Pending collection" iconBg="#FEF9C3" icon={<Receipt size={17} color="#CA8A04" />} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        {[
          { label: 'Pre-wedding', summary: data.breakdown.preWedding },
          { label: 'Post-wedding', summary: data.breakdown.postWedding },
        ].map(({ label, summary }) => (
          <div key={label} className="crm-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <Badge status={label} />
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-gray-500">Clients</p><p className="mt-1 font-bold text-gray-900">{summary.clients}</p></div>
              <div><p className="text-gray-500">Active</p><p className="mt-1 font-bold text-gray-900">{summary.activeClients}</p></div>
              <div><p className="text-gray-500">Completed</p><p className="mt-1 font-bold text-gray-900">{summary.completedClients}</p></div>
              <div><p className="text-gray-500">Total</p><p className="mt-1 font-bold text-gray-900">{formatCurrency(summary.invoiceTotal)}</p></div>
              <div><p className="text-gray-500">Paid</p><p className="mt-1 font-bold text-gray-900">{formatCurrency(summary.invoicePaid)}</p></div>
              <div><p className="text-gray-500">Balance</p><p className="mt-1 font-bold text-gray-900">{formatCurrency(summary.invoiceBalance)}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="crm-table-wrap">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <p className="text-sm font-semibold text-gray-900">Recent Clients</p>
          <Link to="/master-admin/sales/clients" className="text-xs font-semibold text-indigo-600">View all</Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-[#FAFAFA]">
              {['Lead ID', 'Client', 'Flow', 'Phase', 'Event date', 'Balance', 'Status'].map(header => (
                <th key={header} className="px-5 py-3 text-left text-xs font-semibold text-gray-500">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.recentClients.map(client => (
              <tr key={client.id} className="border-t border-gray-100">
                <td className="px-5 py-3 text-sm font-medium text-indigo-600">{client.serialNumber}</td>
                <td className="px-5 py-3 text-sm"><Link className="text-indigo-600 hover:underline" to={`/master-admin/sales/clients/${client.id}`}>{client.name}</Link></td>
                <td className="px-5 py-3 text-sm text-gray-600">{flowBadgeLabel(client.flowType)}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{formatLabel(client.currentPhase)}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{formatDate(client.eventDate)}</td>
                <td className="px-5 py-3 text-sm text-gray-900">{formatCurrency(client.invoiceBalance)}</td>
                <td className="px-5 py-3"><Badge status={formatLabel(client.status)} /></td>
              </tr>
            ))}
            {data.recentClients.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">No clients found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
