import { useState, useEffect } from 'react'
import { Mail, MessageCircle } from 'lucide-react'
import NotificationDropdown from '../../../components/NotificationDropdown'
import { getCurrentUserRoles, getCurrentEmployeeId } from '../../../utils/currentUser';
import RoleSwitcher from '../../../components/RoleSwitcher'

export default function AdminTopbar() {
    const roles = getCurrentUserRoles(['admin']);
    const employeeId = getCurrentEmployeeId();
    const [user, setUser] = useState({ name: 'John Doe', role: 'Admin', profileImageUrl: null as string | null });

    useEffect(() => {
        try {
            const stored = localStorage.getItem('ra_user')
            if (stored) {
                const parsed = JSON.parse(stored)
                setUser({
                    name: parsed.first_name ? `${parsed.first_name} ${parsed.last_name || ''}`.trim() : parsed.name || 'User',
                    role: parsed.role || 'Admin',
                    profileImageUrl: parsed.profile_image ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${parsed.profile_image}` : null
                })
            }
        } catch (e) { }
    }, []);

    return (
        <header className="h-[80px] bg-white border-b border-gray-100 flex items-center justify-end px-8 sticky top-0 z-10 shadow-sm rounded-bl-3xl">
            <div className="flex items-center gap-6">
                <button className="p-2 text-gray-400 hover:text-green-500 transition-colors" title="WhatsApp">
                    <MessageCircle size={20} />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Gmail">
                    <Mail size={20} />
                </button>
                <NotificationDropdown roles={roles} employeeId={employeeId} notificationsPath="/admin/notifications" />
                <RoleSwitcher />
                <div className="flex items-center gap-3 border-l border-gray-100 pl-6 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="text-right">
                        <p className="text-[13px] font-bold text-gray-900 capitalize">{user.name}</p>
                        <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">{user.role}</p>
                    </div>
                    {user.profileImageUrl ? (
                        <img
                            src={user.profileImageUrl}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
