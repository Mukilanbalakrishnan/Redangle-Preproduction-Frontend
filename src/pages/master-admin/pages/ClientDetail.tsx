import { useEffect, useState } from 'react'
import { ArrowLeft, Download } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import Badge from '../../crm/components/ui/Badge'
import { masterAdminApi } from '../api/masterAdmin.api'
import type {
  MasterAdminAttendance,
  MasterAdminClient,
  MasterAdminEmployee,
  MasterAdminInvoice,
  MasterAdminWorkItem,
} from '../types'
import { flowBadgeLabel, formatCurrency, formatDate, formatLabel } from '../utils'

type Tab = 'details' | 'employees' | 'work' | 'invoice' | 'attendance' | 'report'

const tabs: { key: Tab; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'employees', label: 'Employees' },
  { key: 'work', label: 'Work Tracker' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'report', label: 'Report' },
]

export default function ClientDetail() {
  const { clientId = '' } = useParams()
  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [client, setClient] = useState<MasterAdminClient | null>(null)
  const [employees, setEmployees] = useState<MasterAdminEmployee[]>([])
  const [workItems, setWorkItems] = useState<MasterAdminWorkItem[]>([])
  const [invoices, setInvoices] = useState<MasterAdminInvoice[]>([])
  const [attendance, setAttendance] = useState<MasterAdminAttendance[]>([])
  const [report, setReport] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) return
    setLoading(true)
    Promise.all([
      masterAdminApi.client(clientId),
      masterAdminApi.clientEmployees(clientId),
      masterAdminApi.clientWorkTracker(clientId),
      masterAdminApi.clientInvoice(clientId),
      masterAdminApi.clientAttendance(clientId),
      masterAdminApi.clientReport(clientId),
    ])
      .then(([clientData, employeeData, workData, invoiceData, attendanceData, reportData]) => {
        setClient(clientData)
        setEmployees(employeeData)
        setWorkItems(workData)
        setInvoices(invoiceData)
        setAttendance(attendanceData)
        setReport(reportData)
      })
      .catch(error => console.error('Master admin client detail failed', error))
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Loading client...</div>
  if (!client) return <div className="crm-card p-8 text-center text-sm text-gray-500">Client not found.</div>

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <Link to="/master-admin/sales/clients" className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
          <ArrowLeft size={16} /> Back to clients
        </Link>
        <button className="crm-card flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500">
          <Download size={14} /> Export client report
        </button>
      </div>

      <div className="crm-card mb-5 p-5">
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
              <Badge status={flowBadgeLabel(client.flowType)} />
              <Badge status={client.assignmentStatus} />
            </div>
            <p className="text-sm text-gray-500">{client.serialNumber} · {client.eventType} · {formatDate(client.eventDate)}</p>
          </div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div><p className="text-gray-500">Current phase</p><p className="mt-1 font-bold text-gray-900">{formatLabel(client.currentPhase)}</p></div>
            <div><p className="text-gray-500">Phase owner</p><p className="mt-1 font-bold text-gray-900">{formatLabel(client.phaseOwner)}</p></div>
            <div><p className="text-gray-500">Pre-production step</p><p className="mt-1 font-bold text-gray-900">{formatLabel(client.preProductionStep)}</p></div>
            <div><p className="text-gray-500">Invoice balance</p><p className="mt-1 font-bold text-gray-900">{formatCurrency(client.invoiceBalance)}</p></div>
          </div>
        </div>
      </div>

      <div className="mb-5 flex gap-2 border-b border-gray-100">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-semibold transition-colors ${activeTab === tab.key ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'details' && <DetailsTab client={client} />}
      {activeTab === 'employees' && <EmployeesTab employees={employees} />}
      {activeTab === 'work' && <WorkTab items={workItems} />}
      {activeTab === 'invoice' && <InvoiceTab invoices={invoices} />}
      {activeTab === 'attendance' && <AttendanceTab records={attendance} />}
      {activeTab === 'report' && <ReportTab report={report} />}
    </div>
  )
}

function DetailsTab({ client }: { client: MasterAdminClient }) {
  const fields = [
    ['Lead ID', client.serialNumber],
    ['Client name', client.name],
    ['Email', client.email],
    ['Phone', client.phone],
    ['Location', client.location],
    ['Event type', client.eventType],
    ['Event date', formatDate(client.eventDate)],
    ['Flow type', flowBadgeLabel(client.flowType)],
    ['Current phase', formatLabel(client.currentPhase)],
    ['Phase status', formatLabel(client.phaseStatus)],
    ['Phase owner', formatLabel(client.phaseOwner)],
    ['Assigned team', client.assignedTeamSummary],
  ]

  return (
    <div className="crm-card p-5">
      <div className="grid grid-cols-3 gap-5">
        {fields.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmployeesTab({ employees }: { employees: MasterAdminEmployee[] }) {
  return (
    <div className="crm-table-wrap">
      <table className="w-full">
        <thead><tr className="bg-[#FAFAFA]">{['Group', 'Task', 'Employee ID', 'Name', 'Role'].map(header => <th key={header} className="px-5 py-3 text-left text-xs font-semibold text-gray-500">{header}</th>)}</tr></thead>
        <tbody>
          {employees.length === 0 ? <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">No employees assigned to this client.</td></tr> : employees.map(employee => (
            <tr key={`${employee.employeeId}-${employee.task}`} className="border-t border-gray-100">
              <td className="px-5 py-3 text-sm text-gray-600">{employee.group || '-'}</td>
              <td className="px-5 py-3 text-sm text-gray-900">{employee.task || '-'}</td>
              <td className="px-5 py-3 text-sm font-medium text-indigo-600">{employee.employeeId}</td>
              <td className="px-5 py-3 text-sm text-gray-900">{employee.name}</td>
              <td className="px-5 py-3 text-sm text-gray-600">{employee.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function WorkTab({ items }: { items: MasterAdminWorkItem[] }) {
  return (
    <div className="crm-table-wrap">
      <table className="w-full">
        <thead><tr className="bg-[#FAFAFA]">{['Task', 'Employee', 'Role', 'Priority', 'Status', 'Start', 'Deadline'].map(header => <th key={header} className="px-5 py-3 text-left text-xs font-semibold text-gray-500">{header}</th>)}</tr></thead>
        <tbody>
          {items.length === 0 ? <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">No client-scoped work items found.</td></tr> : items.map(item => (
            <tr key={item.id} className="border-t border-gray-100">
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
  )
}

function InvoiceTab({ invoices }: { invoices: MasterAdminInvoice[] }) {
  return (
    <div className="crm-table-wrap">
      <table className="w-full">
        <thead><tr className="bg-[#FAFAFA]">{['Invoice ID', 'Total', 'Paid', 'Balance', 'Status', 'Due date'].map(header => <th key={header} className="px-5 py-3 text-left text-xs font-semibold text-gray-500">{header}</th>)}</tr></thead>
        <tbody>
          {invoices.length === 0 ? <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">No invoice data found for this client.</td></tr> : invoices.map(invoice => (
            <tr key={invoice.invoiceId} className="border-t border-gray-100">
              <td className="px-5 py-3 text-sm font-medium text-indigo-600">{invoice.invoiceId}</td>
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
  )
}

function AttendanceTab({ records }: { records: MasterAdminAttendance[] }) {
  return (
    <div className="crm-table-wrap">
      <table className="w-full">
        <thead><tr className="bg-[#FAFAFA]">{['Employee', 'Role', 'Date', 'Check-in', 'Check-out', 'Status'].map(header => <th key={header} className="px-5 py-3 text-left text-xs font-semibold text-gray-500">{header}</th>)}</tr></thead>
        <tbody>
          {records.length === 0 ? <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">No attendance records for assigned employees.</td></tr> : records.map(record => (
            <tr key={`${record.employeeId}-${record.date}-${record.id}`} className="border-t border-gray-100">
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
  )
}

function ReportTab({ report }: { report: Record<string, unknown> | null }) {
  const workProgress = report?.workProgress as { total?: number; completed?: number; pending?: number } | undefined
  const invoiceSummary = report?.invoiceSummary as MasterAdminInvoice | null | undefined

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="crm-card p-5">
        <p className="text-sm font-semibold text-gray-900">Work progress</p>
        <p className="mt-4 text-2xl font-bold text-gray-900">{workProgress?.total ?? 0}</p>
        <p className="mt-2 text-sm text-gray-500">Completed: {workProgress?.completed ?? 0} · Pending: {workProgress?.pending ?? 0}</p>
      </div>
      <div className="crm-card p-5">
        <p className="text-sm font-semibold text-gray-900">Invoice summary</p>
        <p className="mt-4 text-2xl font-bold text-gray-900">{formatCurrency(invoiceSummary?.balance ?? 0)}</p>
        <p className="mt-2 text-sm text-gray-500">Balance pending for this client</p>
      </div>
      <div className="crm-card p-5">
        <p className="text-sm font-semibold text-gray-900">Pending blockers</p>
        <p className="mt-4 text-2xl font-bold text-gray-900">{Array.isArray(report?.blockers) ? report.blockers.length : 0}</p>
        <p className="mt-2 text-sm text-gray-500">Client-scoped blocker count</p>
      </div>
    </div>
  )
}
