import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import Badge from '../../crm/components/ui/Badge'
import { masterAdminApi } from '../api/masterAdmin.api'
import type { MasterAdminEmployee, MasterAdminFilters } from '../types'
import { flowBadgeLabel } from '../utils'

export default function Employees() {
  const [employees, setEmployees] = useState<MasterAdminEmployee[]>([])
  const [filters, setFilters] = useState<MasterAdminFilters>({ flowType: 'all', search: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    masterAdminApi.employees(filters)
      .then(setEmployees)
      .catch(error => console.error('Master admin employees failed', error))
      .finally(() => setLoading(false))
  }, [filters])

  const visible = employees.filter(employee =>
    `${employee.name} ${employee.employeeId} ${employee.role}`.toLowerCase().includes(String(filters.search || '').toLowerCase())
  )

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-bold text-gray-900">Sales Employees</h1>
        <p className="text-sm text-gray-500">Employees involved in sales client assignments</p>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#E0DFFE] bg-[#F0EFFE] px-4 py-2.5">
          <Search size={14} className="text-gray-400" />
          <input value={filters.search || ''} onChange={event => setFilters(current => ({ ...current, search: event.target.value }))} className="flex-1 bg-transparent text-sm outline-none" placeholder="Search employees..." />
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
              {['Employee ID', 'Name', 'Role', 'Current tasks', 'Flow involvement', 'Attendance today', 'Last activity'].map(header => (
                <th key={header} className="px-5 py-3 text-left text-xs font-semibold text-gray-500">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">Loading employees...</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">No assigned employees found.</td></tr>
            ) : visible.map(employee => (
              <tr key={`${employee.employeeId}-${employee.role}`} className="border-t border-gray-100">
                <td className="px-5 py-3 text-sm font-medium text-indigo-600">{employee.employeeId}</td>
                <td className="px-5 py-3 text-sm text-gray-900">{employee.name}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{employee.role}</td>
                <td className="px-5 py-3 text-sm text-gray-900">{employee.currentTasks}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{String(employee.flowInvolvement || '').split(', ').map(flowBadgeLabel).join(', ')}</td>
                <td className="px-5 py-3"><Badge status={employee.attendanceToday || 'Absent'} /></td>
                <td className="px-5 py-3 text-sm text-gray-500">{employee.lastActivity || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
