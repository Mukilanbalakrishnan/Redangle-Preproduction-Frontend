import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL

export function useMediaRole() {
    const location = useLocation()
    const [employeeId, setEmployeeId] = useState<string | null>(() => {
        const raw = localStorage.getItem('ra_user')
        const user = raw ? JSON.parse(raw) : null
        return user?.employee_id ?? null
    })

    const raw = localStorage.getItem('ra_user')
    const user = raw ? JSON.parse(raw) : null

    // If employee_id is missing, refresh from verify-token endpoint
    useEffect(() => {
        if (user && !user.employee_id) {
            const token = localStorage.getItem('ra_token')
            if (!token) return
            fetch(`${API_URL}/auth/verify`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(result => {
                    if (result.success && result.data?.employee_id) {
                        const updated = { ...user, employee_id: result.data.employee_id }
                        localStorage.setItem('ra_user', JSON.stringify(updated))
                        setEmployeeId(result.data.employee_id)
                    }
                })
                .catch(() => {})
        }
    }, [])

    // Check active role first (set by RoleSwitcher), then fall back to primary role
    const activeRole = (localStorage.getItem('ra_active_role') || '').toLowerCase()
    const userRoles: string[] = (user?.roles || [user?.role].filter(Boolean)).map((role: string) => String(role).toLowerCase())
    const isMultiRole = activeRole === 'multi-role' || location.pathname.startsWith('/multi-role')
    const routeScopedRole =
        location.pathname.startsWith('/multi-role/drone')
            ? 'drone'
            : location.pathname.startsWith('/multi-role/videographer')
                ? 'videographer'
                : location.pathname.startsWith('/multi-role/photographer')
                    ? 'photographer'
                    : ''
    const effectiveRole =
        routeScopedRole && userRoles.includes(routeScopedRole)
            ? routeScopedRole
            : !isMultiRole && activeRole && userRoles.includes(activeRole)
            ? activeRole
            : (userRoles[0] || '')

    const hasPhotographerRole = userRoles.includes('photographer')
    const hasVideographerRole = userRoles.includes('videographer')
    const hasDroneRole = userRoles.includes('drone')

    const isPhotographer = effectiveRole === 'photographer'
    const isVideographer = effectiveRole === 'videographer'
    const isDrone = effectiveRole === 'drone'

    const role = isDrone
        ? 'Drone'
        : isVideographer
            ? 'Videographer'
            : isPhotographer
                ? 'Photographer'
                : 'Media'
    const fromRole = isDrone
        ? 'drone'
        : isVideographer
            ? 'videographer'
            : isPhotographer
                ? 'photographer'
                : 'media'
    const userName: string = user?.name || role

    return {
        role,
        fromRole,
        employeeId,
        isPhotographer,
        isVideographer,
        isDrone,
        isMultiRole,
        hasPhotographerRole,
        hasVideographerRole,
        hasDroneRole,
        activeRole,
        userRoles,
        user,
        userName
    }
}
