import { useState, useEffect } from 'react'
import { Mail, MessageCircle } from 'lucide-react'
import NotificationDropdown from '../../../components/NotificationDropdown'
import { getCurrentUserRoles, getCurrentEmployeeId } from '../../../utils/currentUser';
import RoleSwitcher from '../../../components/RoleSwitcher'

export default function MultiRoleTopbar() {
    const roles = getCurrentUserRoles(['photographer']);
    const employeeId = getCurrentEmployeeId();
    const [user, setUser] = useState({ name: 'User', role: 'Multi-Role', profileImageUrl: null as string | null });

    useEffect(() => {
        try {
            const stored = localStorage.getItem('ra_user')
            if (stored) {
                const parsed = JSON.parse(stored)
                setUser({
                    name: parsed.first_name ? `${parsed.first_name} ${parsed.last_name || ''}`.trim() : parsed.name || 'User',
                    role: 'Multi-Role',
                    profileImageUrl: parsed.profile_image ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${parsed.profile_image}` : null
                })
            }
        } catch (e) { }
    }, []);

    return (
        <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-end px-6 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-4">
                <button className="p-2 text-gray-400 hover:text-green-500 transition-colors" title="WhatsApp">
                    <MessageCircle size={18} />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Gmail">
                    <Mail size={18} />
                </button>
                <NotificationDropdown roles={roles} employeeId={employeeId} notificationsPath="/multi-role/notifications" />
                <RoleSwitcher />

                <div className="flex items-center gap-2.5 border-l border-gray-100 pl-4">
                    <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900 capitalize">{user.name}</div>
                        <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">{user.role}</div>
                    </div>
                    {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt="Profile" className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm" />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
