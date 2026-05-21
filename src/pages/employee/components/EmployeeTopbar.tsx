import { Mail, MessageCircle, Search } from 'lucide-react'
import { getEmployeeRole, getRoleConfig } from '../employeeRoleConfig'
import NotificationDropdown from '../../../components/NotificationDropdown'
import RoleSwitcher from '../../../components/RoleSwitcher'

export default function EmployeeTopbar() {
    const role = getEmployeeRole()
    const config = getRoleConfig(role)

    let userName = 'John Doe'
    let profileImageUrl: string | null = null
    try {
        const userStr = localStorage.getItem('ra_user')
        if (userStr) {
            const user = JSON.parse(userStr)
            if (user.first_name) {
                userName = `${user.first_name} ${user.last_name || ''}`.trim()
            } else if (user.name) {
                userName = user.name
            }
            if (user.profile_image) {
                profileImageUrl = `${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${user.profile_image}`
            }
        }
    } catch {
        // fallback
    }

    return (
        <header className="h-[88px] bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-10 w-full">
            {/* Search */}
            <div className="flex-1 max-w-2xl">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search leads, projects, teams..."
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all placeholder-gray-400 text-gray-600"
                    />
                </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-6">
                <button className="p-2 text-gray-400 hover:text-green-500 transition-colors" title="WhatsApp">
                    <MessageCircle size={20} />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Gmail">
                    <Mail size={20} />
                </button>
                <NotificationDropdown role={role} bellSize={20} notificationsPath="/employee/notifications" />
                <RoleSwitcher />

                <div className="h-10 w-px bg-gray-200"></div>

                {/* Profile */}
                <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors uppercase">{userName}</p>
                        <p className="text-xs text-gray-500 font-medium uppercase">{config.roleLabel}</p>
                    </div>
                    {profileImageUrl ? (
                        <img
                            src={profileImageUrl}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
