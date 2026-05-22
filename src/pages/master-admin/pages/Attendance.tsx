import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import Badge from '../../crm/components/ui/Badge'
import { masterAdminApi } from '../api/masterAdmin.api'
import type { MasterAdminAttendance, MasterAdminFilters } from '../types'
import { formatDate } from '../utils'

export default function Attendance() {
  const [records, setRecords] = useState<MasterAdminAttendance[]>([])
  const [filters, setFilters] = useState<MasterAdminFilters>({ flowType: 'all' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    masterAdminApi.attendance(filters)
      .then(setRecords)
      .catch(error => console.error('Master admin attendance failed', error))
      .finally(() => setLoading(false))
  }, [filters])

  const present = records.filter(record => record.status === 'Present').length
  const absent = records.filter(record => record.status === 'Absent').length

  return (
    <div>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Sales Attendance</h1>
          <p className="text-sm text-gray-500">Attendance for employees assigned to sales clients</p>
        </div>
        <div className="flex gap-3">
          <select value={filters.flowType || 'all'} onChange={event => setFilters({ flowType: event.target.value })} className="rounded-xl border border-[#E0DFFE] bg-[#F0EFFE] px-4 py-2.5 text-sm text-indigo-700 outline-none">
            <option value="all">All flows</option>
            <option value="pre_wedding">Pre-wedding</option>
            <option value="post_wedding">Post-wedding</option>
          </select>
          <button className="crm-card flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="crm-card p-5"><p className="text-sm text-gray-500">Total records</p><p className="mt-2 text-2xl font-bold text-gray-900">{records.length}</p></div>
        <div className="crm-card p-5"><p className="text-sm text-gray-500">Present</p><p className="mt-2 text-2xl font-bold text-green-600">{present}</p></div>
        <div className="crm-card p-5"><p className="text-sm text-gray-500">Absent</p><p className="mt-2 text-2xl font-bold text-red-500">{absent}</p></div>
      </div>

      <div className="crm-table-wrap">
        <table className="w-full">
          <thead>
            <tr className="bg-[#FAFAFA]">
              {['Employee ID', 'Employee', 'Role', 'Date', 'Check-in', 'Check-out', 'Status'].map(header => (
                <th key={header} className="px-5 py-3 text-left text-xs font-semibold text-gray-500">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">Loading attendance...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">No attendance records found.</td></tr>
            ) : records.map(record => (
              <tr key={`${record.employeeId}-${record.date}-${record.id}`} className="border-t border-gray-100">
                <td className="px-5 py-3 text-sm font-medium text-indigo-600">{record.employeeId}</td>
                <td className="px-5 py-3 text-sm text-gray-900">{record.employee}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{record.role || '-'}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{formatDate(record.date)}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{record.checkIn || '-'}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{record.checkOut || '-'}</td>
                <td className="px-5 py-3"><Badge status={record.status || 'Absent'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
