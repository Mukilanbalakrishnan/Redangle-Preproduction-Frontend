import { useEffect, useState } from 'react'
import { BarChart3, Download } from 'lucide-react'
import { masterAdminApi } from '../api/masterAdmin.api'
import { formatCurrency } from '../utils'

type ReportsData = Record<string, unknown> & {
  workCompletion?: { total?: number; completed?: number; pending?: number }
  invoiceCollection?: { invoiceTotal?: number; invoicePaid?: number; invoiceBalance?: number }
  attendance?: { total?: number; present?: number; absent?: number }
}

export default function Reports() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    masterAdminApi.reports()
      .then(result => setData(result as ReportsData))
      .catch(error => console.error('Master admin reports failed', error))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Loading reports...</div>

  const work = data?.workCompletion
  const invoice = data?.invoiceCollection
  const attendance = data?.attendance

  return (
    <div>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Sales Reports</h1>
          <p className="text-sm text-gray-500">Combined reporting with flow-aware metrics</p>
        </div>
        <button className="crm-card flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500">
          <Download size={14} /> Export report
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="crm-card p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900"><BarChart3 size={16} /> Work Completion</div>
          <p className="text-sm text-gray-500">Total tasks</p><p className="mb-3 text-2xl font-bold text-gray-900">{work?.total ?? 0}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-500">Completed</p><p className="font-bold text-green-600">{work?.completed ?? 0}</p></div>
            <div><p className="text-gray-500">Pending</p><p className="font-bold text-amber-600">{work?.pending ?? 0}</p></div>
          </div>
        </div>
        <div className="crm-card p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900"><BarChart3 size={16} /> Invoice Collection</div>
          <p className="text-sm text-gray-500">Invoice total</p><p className="mb-3 text-2xl font-bold text-gray-900">{formatCurrency(invoice?.invoiceTotal ?? 0)}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-500">Paid</p><p className="font-bold text-green-600">{formatCurrency(invoice?.invoicePaid ?? 0)}</p></div>
            <div><p className="text-gray-500">Balance</p><p className="font-bold text-amber-600">{formatCurrency(invoice?.invoiceBalance ?? 0)}</p></div>
          </div>
        </div>
        <div className="crm-card p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900"><BarChart3 size={16} /> Attendance</div>
          <p className="text-sm text-gray-500">Total records today</p><p className="mb-3 text-2xl font-bold text-gray-900">{attendance?.total ?? 0}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-500">Present</p><p className="font-bold text-green-600">{attendance?.present ?? 0}</p></div>
            <div><p className="text-gray-500">Absent</p><p className="font-bold text-red-500">{attendance?.absent ?? 0}</p></div>
          </div>
        </div>
      </div>

      <div className="crm-card mt-6 p-8 text-center text-sm text-gray-500">
        Detailed conversion, assignment load, client delivery, and monthly exports can build on this normalized reports API without using dummy data.
      </div>
    </div>
  )
}
