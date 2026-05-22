import { NavLink, useNavigate } from 'react-router-dom'
import { BarChart3, Bell, Briefcase, CalendarCheck, FileText, LayoutDashboard, LogOut, Receipt, Users } from 'lucide-react'

const navItems = [
  { to: '/master-admin/sales/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/master-admin/sales/clients', icon: Users, label: 'Clients' },
  { to: '/master-admin/sales/employees', icon: Briefcase, label: 'Employees' },
  { to: '/master-admin/sales/work-tracker', icon: BarChart3, label: 'Work Tracker' },
  { to: '/master-admin/sales/invoices', icon: Receipt, label: 'Invoices' },
  { to: '/master-admin/sales/attendance', icon: CalendarCheck, label: 'Attendance' },
  { to: '/master-admin/sales/reports', icon: FileText, label: 'Reports' },
  { to: '/master-admin/notifications', icon: Bell, label: 'Notifications' },
]

export default function MasterAdminSidebar() {
  const navigate = useNavigate()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col overflow-y-auto border-r border-purple-100 bg-[#F8F6FF]">
      <div className="px-5 pb-4 pt-6">
        <div className="flex cursor-pointer items-center gap-2" onClick={() => navigate('/master-admin/sales/dashboard')}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #5B5FC7)' }}>
            <span style={{ fontStyle: 'italic', fontWeight: 900 }}>ra</span>
          </div>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-widest text-gray-900">Red Angle</div>
            <div className="text-[10px] uppercase tracking-widest text-gray-400">Master Admin</div>
          </div>
        </div>
      </div>

      <div className="mx-4 mb-2 h-px bg-purple-200/50" />

      <nav className="flex-1 overflow-y-auto px-3" style={{ scrollbarWidth: 'none' }}>
        <div className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Sales</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className="mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150"
            style={({ isActive }) => ({
              color: isActive ? '#7c3aed' : '#374151',
              background: isActive ? '#fff' : undefined,
              boxShadow: isActive ? '0 1px 3px rgba(124,58,237,0.1)' : undefined,
            })}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-6 pt-2">
        <div className="mb-3 h-px bg-purple-200/50" />
        <button
          onClick={() => {
            localStorage.removeItem('ra_token')
            localStorage.removeItem('ra_user')
            localStorage.removeItem('ra_active_role')
            navigate('/login')
          }}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 transition-all hover:bg-white hover:text-gray-700"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
