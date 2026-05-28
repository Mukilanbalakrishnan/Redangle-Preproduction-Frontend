import { Search, Mail, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import NotificationDropdown from '../../../components/NotificationDropdown'
import { getCurrentUserRoles, getCurrentEmployeeId } from '../../../utils/currentUser';
import RoleSwitcher from '../../../components/RoleSwitcher'

export default function OperationalManagerTopbar() {
    const roles = getCurrentUserRoles(['operational_manager']);
    const employeeId = getCurrentEmployeeId();
    const [userName, setUserName] = useState('Operational Manager');
    const [userRole, setUserRole] = useState('Operational Manager');
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('ra_user');
            if (stored) {
                const user = JSON.parse(stored);
                if (user.first_name) {
                    setUserName(`${user.first_name} ${user.last_name || ''}`.trim());
                } else if (user.name) {
                    setUserName(user.name);
                }
                if (user.role) setUserRole(user.role);
                if (user.profile_image) {
                    setProfileImageUrl(`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${user.profile_image}`);
                }
            }
        } catch (e) {
            console.error('Failed to parse user', e);
        }
    }, []);

    return (
        <header
            className="fixed top-0 right-0 z-30 flex items-center justify-between px-6 bg-white border-b"
            style={{
                left: '280px',
                height: 'var(--topbar-height)',
                borderColor: 'var(--border-color)'
            }}
        >
            <div className="flex-1 max-w-xl">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        type="text"
                        placeholder="Search projects, teams..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all placeholder-gray-400 text-gray-600"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 text-gray-400 hover:text-green-500 transition-colors" title="WhatsApp">
                    <MessageCircle size={18} />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Gmail">
                    <Mail size={18} />
                </button>
                <NotificationDropdown roles={roles} employeeId={employeeId} notificationsPath="/operational-manager/notifications" />
                <RoleSwitcher />

                <div className="flex items-center gap-2.5">
                    <div className="text-right">
                        <div className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{userName}</div>
                        <div className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--text-secondary)' }}>{userRole}</div>
                    </div>
                    {profileImageUrl ? (
                        <img
                            src={profileImageUrl}
                            alt="Profile"
                            className="w-9 h-9 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
