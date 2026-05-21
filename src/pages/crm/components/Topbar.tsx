import { useState, useEffect } from 'react'
import { Mail, MessageCircle } from 'lucide-react'
import NotificationDropdown from '../../../components/NotificationDropdown'
import RoleSwitcher from '../../../components/RoleSwitcher'
import { useLocation } from 'react-router-dom'

const getProfileImageUrl = (profileImage?: string | null) => {
    if (!profileImage) return null
    if (/^https?:\/\//i.test(profileImage)) return profileImage

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
    const serverUrl = apiUrl.replace(/\/api\/?$/, '')
    const normalizedImage = profileImage.startsWith('/')
        ? profileImage
        : `/uploads/${profileImage}`

    return `${serverUrl}${normalizedImage}`
}

export default function Topbar() {
    const [user, setUser] = useState({ name: 'User', role: 'CRM', profileImageUrl: null as string | null });
    const location = useLocation()

    const roleInfo = location.pathname.startsWith('/pre-production-crm')
        ? { label: 'Pre-production CRM', role: 'pre-production-crm', notificationsPath: '/pre-production-crm/notifications' }
        : location.pathname.startsWith('/post-production-crm')
            ? { label: 'Post-production CRM', role: 'post-production-crm', notificationsPath: '/post-production-crm/notifications' }
            : { label: 'CRM', role: 'crm', notificationsPath: '/crm/notifications' }
    const isSplitCrm = roleInfo.role !== 'crm'

    useEffect(() => {
        try {
            const stored = localStorage.getItem('ra_user')
            if (stored) {
                const parsed = JSON.parse(stored)
                setUser({
                    name: parsed.first_name ? `${parsed.first_name} ${parsed.last_name || ''}`.trim() : parsed.name || 'User',
                    role: roleInfo.label,
                    profileImageUrl: getProfileImageUrl(parsed.profile_image)
                })
            }
        } catch (e) { }
    }, [roleInfo.label]);

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
                <NotificationDropdown role={roleInfo.role} bellSize={18} notificationsPath={roleInfo.notificationsPath} />
                {!isSplitCrm && <RoleSwitcher />}

                <div className="flex items-center gap-2.5">
                    <div className="text-right">
                        <div className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{user.name}</div>
                        <div className="text-xs uppercase tracking-wide font-medium" style={{ color: 'var(--text-secondary)' }}>{user.role}</div>
                    </div>
                    <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center">
                        {user.profileImageUrl ? (
                            <img
                                src={user.profileImageUrl}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
