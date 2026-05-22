export function useEmployeeId(): string | null {
    const raw = localStorage.getItem('ra_user')
    const user = raw ? JSON.parse(raw) : null
    // employee_id should be in EMP-XXX format from the employees table
    const empId = user?.employee_id ?? null
    if (!empId) return null
    // Ensure EMP- prefix
    const str = String(empId)
    if (str === 'NaN' || str === 'undefined' || str === 'null' || str.includes('NaN')) return null
    if (str.startsWith('EMP-')) return str
    return `EMP-${str}`
}
