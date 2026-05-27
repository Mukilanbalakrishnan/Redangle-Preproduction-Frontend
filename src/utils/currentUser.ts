export const getCurrentUser = () => {
    try {
        const raw = localStorage.getItem('ra_user')
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

export const getCurrentUserRoles = (fallback: string[] = []) => {
    const user = getCurrentUser()
    const roles = Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : fallback)
    return roles.map((role: string) => String(role).toLowerCase()).filter(Boolean)
}

export const getCurrentUserDisplayName = () => {
    const user = getCurrentUser()
    const name = user?.first_name
        ? `${user.first_name} ${user.last_name || ''}`.trim()
        : user?.name
    return name ? String(name) : 'User'
}

export const getCurrentUserRole = (fallback = 'system') => {
    const activeRole = localStorage.getItem('ra_active_role')
    if (activeRole && activeRole !== 'multi-role') return activeRole
    const roles = getCurrentUserRoles()
    return roles[0] || fallback
}

export const getCurrentEmployeeId = () => {
    const user = getCurrentUser()
    const employeeId = user?.employee_id || localStorage.getItem('employee_id')
    return employeeId ? String(employeeId) : null
}
