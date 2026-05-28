import { Mail, MessageCircle } from 'lucide-react'
import { useMediaRole } from '../../../hooks/useMediaRole'
import NotificationDropdown from '../../../components/NotificationDropdown'
import { getCurrentUserRoles, getCurrentEmployeeId } from '../../../utils/currentUser';
import RoleSwitcher from '../../../components/RoleSwitcher'

export default function MediaTopbar() {
    const { role, fromRole, user } = useMediaRole()
    const userName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.name || 'Media'
    const roles = getCurrentUserRoles([fromRole]);
    const employeeId = getCurrentEmployeeId();
    
    const profileImageUrl = user?.profile_image
        ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${user.profile_image}`
        : null

    return (
        <header
            className="fixed top-0 right-0 z-30 flex items-center justify-between px-6"
            style={{
                height: 'var(--topbar-height)',
                width: 'calc(100% - var(--sidebar-width))',
                background: 'var(--topbar-bg)',
                borderBottom: '1px solid rgba(0,0,0,0.05)'
            }}
        >
            <div className="flex-1 mr-6">
                <div className="relative w-full max-w-md">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search leads, projects, teams..."
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-100 transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6 relative">
                <button className="p-2 text-gray-500 hover:text-green-500 transition-colors" title="WhatsApp">
                    <MessageCircle size={18} />
                </button>
                <button className="p-2 text-gray-500 hover:text-red-500 transition-colors" title="Gmail">
                    <Mail size={18} />
                </button>
                <NotificationDropdown roles={roles} employeeId={employeeId} bellSize={18} notificationsPath="/media/notifications" />
                <RoleSwitcher />

                <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 leading-tight uppercase">{userName}</p>
                        <p className="text-xs text-gray-500 font-medium uppercase">{role}</p>
                    </div>
                    {profileImageUrl ? (
                        <img
                            src={profileImageUrl}
                            alt="Profile"
                            className="w-9 h-9 rounded-full border border-gray-200 object-cover"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full border border-gray-200 bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
                            {userName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
