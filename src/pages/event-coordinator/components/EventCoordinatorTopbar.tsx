
import { useState, useEffect } from 'react'
import { Mail, MessageCircle } from 'lucide-react'
import NotificationDropdown from '../../../components/NotificationDropdown'
import RoleSwitcher from '../../../components/RoleSwitcher'

export default function EventCoordinatorTopbar() {
    const [user, setUser] = useState<any>(null)
    const [userName, setUserName] = useState('Event Coordinator')
    const [userRole, setUserRole] = useState('Coordinator')

    useEffect(() => {
        try {
            const userStr = localStorage.getItem('ra_user')
            if (userStr) {
                const parsed = JSON.parse(userStr)
                setUser(parsed)
                if (parsed.first_name) {
                    setUserName(`${parsed.first_name} ${parsed.last_name || ''}`.trim())
                } else if (parsed.name) {
                    setUserName(parsed.name)
                }
                if (parsed.role) {
                    setUserRole(parsed.role)
                }
            }
        } catch {
            // fallback
        }
    }, [])

    const profileImageUrl = user?.profile_image
        ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${user.profile_image}`
        : null

    return (
        <header
            className="fixed top-0 right-0 z-30 flex items-center justify-end px-6 bg-white border-b"
            style={{
                left: '280px',
                height: 'var(--topbar-height)',
                borderColor: 'var(--border-color)'
            }}
        >
            {/* Right section */}
            <div className="flex items-center gap-4 relative">
                <button className="p-2 text-gray-400 hover:text-green-500 transition-colors" title="WhatsApp">
                    <MessageCircle size={18} />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Gmail">
                    <Mail size={18} />
                </button>
                <NotificationDropdown role="event_coordinator" bellSize={18} notificationsPath="/event-coordinator/notifications" />
                <RoleSwitcher />

                <div className="flex items-center gap-2.5">
                    <div className="text-right">
                        <div className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{userName}</div>
                        <div className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--text-secondary)' }}>{userRole}</div>
                    </div>
                    <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center">
                        {profileImageUrl ? (
                            <img
                                src={profileImageUrl}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
