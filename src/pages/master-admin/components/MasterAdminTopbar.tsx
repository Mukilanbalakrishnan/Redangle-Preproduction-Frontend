import { useEffect, useState } from 'react'
import { Mail, MessageCircle } from 'lucide-react'
import NotificationDropdown from '../../../components/NotificationDropdown'
import { getCurrentUserRoles, getCurrentEmployeeId } from '../../../utils/currentUser';
import RoleSwitcher from '../../../components/RoleSwitcher'

const getProfileImageUrl = (profileImage?: string | null) => {
  if (!profileImage) return null
  if (/^https?:\/\//i.test(profileImage)) return profileImage
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
  return `${apiUrl.replace(/\/api\/?$/, '')}/uploads/${profileImage}`
}

export default function MasterAdminTopbar() {
    const roles = getCurrentUserRoles(['master-admin']);
    const employeeId = getCurrentEmployeeId();
  const [user, setUser] = useState({ name: 'User', profileImageUrl: null as string | null })

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ra_user')
      if (!stored) return
      const parsed = JSON.parse(stored)
      setUser({
        name: parsed.first_name ? `${parsed.first_name} ${parsed.last_name || ''}`.trim() : parsed.name || 'User',
        profileImageUrl: getProfileImageUrl(parsed.profile_image),
      })
    } catch {
      setUser({ name: 'User', profileImageUrl: null })
    }
  }, [])

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-end border-b bg-white px-6"
      style={{ left: '280px', height: 'var(--topbar-height)', borderColor: 'var(--border-color)' }}
    >
      <div className="relative flex items-center gap-4">
        <button className="p-2 text-gray-400 transition-colors hover:text-green-500" title="WhatsApp">
          <MessageCircle size={18} />
        </button>
        <button className="p-2 text-gray-400 transition-colors hover:text-red-500" title="Gmail">
          <Mail size={18} />
        </button>
        <NotificationDropdown roles={roles} employeeId={employeeId} notificationsPath="/master-admin/notifications" />
        <RoleSwitcher />

        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <div className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{user.name}</div>
            <div className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Master Admin</div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full">
            {user.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-sm font-bold text-indigo-700">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
