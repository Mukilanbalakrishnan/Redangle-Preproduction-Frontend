import axios from 'axios'
import type {
  MasterAdminAttendance,
  MasterAdminClient,
  MasterAdminDashboardData,
  MasterAdminEmployee,
  MasterAdminFilters,
  MasterAdminInvoice,
  MasterAdminWorkItem,
} from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const paramsFromFilters = (filters: MasterAdminFilters = {}) => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'all') params.set(key, value)
  })
  return params
}

const getData = async <T,>(path: string, filters?: MasterAdminFilters): Promise<T> => {
  const params = paramsFromFilters(filters)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  const response = await axios.get(`${API_URL}/master-admin${path}${suffix}`)
  return response.data.data
}

export const masterAdminApi = {
  dashboard: () => getData<MasterAdminDashboardData>('/sales/dashboard'),
  clients: (filters?: MasterAdminFilters) => getData<MasterAdminClient[]>('/sales/clients', filters),
  client: (clientId: string) => getData<MasterAdminClient>(`/sales/clients/${clientId}`),
  employees: (filters?: MasterAdminFilters) => getData<MasterAdminEmployee[]>('/sales/employees', filters),
  workTracker: (filters?: MasterAdminFilters) => getData<MasterAdminWorkItem[]>('/sales/work-tracker', filters),
  invoices: (filters?: MasterAdminFilters) => getData<MasterAdminInvoice[]>('/sales/invoices', filters),
  attendance: (filters?: MasterAdminFilters) => getData<MasterAdminAttendance[]>('/sales/attendance', filters),
  reports: (filters?: MasterAdminFilters) => getData<Record<string, unknown>>('/sales/reports', filters),
  clientEmployees: (clientId: string) => getData<MasterAdminEmployee[]>(`/sales/clients/${clientId}/employees`),
  clientWorkTracker: (clientId: string) => getData<MasterAdminWorkItem[]>(`/sales/clients/${clientId}/work-tracker`),
  clientInvoice: (clientId: string) => getData<MasterAdminInvoice[]>(`/sales/clients/${clientId}/invoice`),
  clientAttendance: (clientId: string) => getData<MasterAdminAttendance[]>(`/sales/clients/${clientId}/attendance`),
  clientReport: (clientId: string) => getData<Record<string, unknown>>(`/sales/clients/${clientId}/report`),
}
