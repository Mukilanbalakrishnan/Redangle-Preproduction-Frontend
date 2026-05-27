import { useState, useEffect } from 'react'
import { Search, Mail, MessageCircle } from 'lucide-react'
import NotificationDropdown from '../../../components/NotificationDropdown'
import { getCurrentUserRoles, getCurrentEmployeeId } from '../../../utils/currentUser';
import RoleSwitcher from '../../../components/RoleSwitcher'

export default function DataManagementTopbar() {
    const roles = getCurrentUserRoles(['data_management']);
    const employeeId = getCurrentEmployeeId();
    const [userName, setUserName] = useState('Admin');
    const [userRole, setUserRole] = useState('Admin');
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
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-10 w-full animate-in slide-in-from-top-4 duration-500">
            {/* Search Bar - hidden structurally but kept to match template flow */}
            <div className="flex-1 max-w-xl">
                <div className="relative group hidden md:block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search leads, projects, teams..."
                        className="w-full bg-[#fafafb] text-sm text-gray-900 rounded-xl pl-12 pr-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-200 transition-all border border-transparent font-medium"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">
                <button className="p-2 text-gray-400 hover:text-green-500 transition-colors" title="WhatsApp">
                    <MessageCircle size={20} />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Gmail">
                    <Mail size={20} />
                </button>
                <NotificationDropdown roles={roles} employeeId={employeeId} notificationsPath="/data-management/notifications" />
                <RoleSwitcher />

                <div className="h-8 w-[1px] bg-gray-200"></div>

                <div className="flex items-center gap-3 cursor-pointer group">
                    <div className="text-right">
                        <div className="text-[13px] font-bold text-gray-900 group-hover:text-purple-600 transition-colors uppercase">{userName}</div>
                        <div className="text-[11px] font-semibold text-gray-500 uppercase">{userRole}</div>
                    </div>
                    {profileImageUrl ? (
                        <img
                            src={profileImageUrl}
                            alt="Profile"
                            className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm group-hover:border-purple-100 transition-all"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-xl border-2 border-white shadow-sm bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-sm group-hover:border-purple-100 transition-all">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
