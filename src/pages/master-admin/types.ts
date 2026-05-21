export interface MasterAdminClient {
  id: string
  serialNumber: string
  name: string
  email: string
  phone: string
  location: string
  eventType: string
  eventDate: string | null
  flowType: string
  currentPhase: string
  phaseStatus: string
  phaseOwner: string
  preProductionStep: string
  assignmentStatus: string
  assignedTeamSummary: string
  invoiceId: string
  invoiceTotal: number
  invoicePaid: number
  invoiceBalance: number
  status: string
  createdAt: string | null
}

export interface MasterAdminFilters {
  flowType?: string
  phase?: string
  status?: string
  search?: string
  fromDate?: string
  toDate?: string
}

export interface MasterAdminDashboardData {
  combined: {
    totalClients: number
    activeClients: number
    completedClients: number
    pendingFollowUps: number
    assignedEmployees: number
    openWorkItems: number
    invoiceTotal: number
    invoicePaid: number
    invoiceBalance: number
  }
  breakdown: {
    preWedding: FlowSummary
    postWedding: FlowSummary
  }
  recentClients: MasterAdminClient[]
  attendanceSummary: {
    total: number
    present: number
    absent: number
  }
}

export interface FlowSummary {
  clients: number
  activeClients: number
  completedClients: number
  invoiceTotal: number
  invoicePaid: number
  invoiceBalance: number
}

export interface MasterAdminEmployee {
  employeeId: string
  name: string
  role: string
  currentTasks: string | number
  flowCount: string | number
  flowInvolvement: string
  attendanceToday: string | null
  lastActivity: string
  group?: string
  task?: string
}

export interface MasterAdminWorkItem {
  id: string | number
  clientId: string
  serialNumber: string
  client: string
  flowType: string
  currentPhase: string
  task: string
  employee: string
  role: string
  priority: string
  status: string
  startDate: string | null
  deadline: string | null
}

export interface MasterAdminInvoice {
  invoiceId: string
  clientId: string
  serialNumber: string
  client: string
  flowType: string
  eventType: string
  total: number
  paid: number
  balance: number
  status: string
  dueDate: string | null
}

export interface MasterAdminAttendance {
  id: string | number
  employeeId: string
  employee: string
  role: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: string
}
