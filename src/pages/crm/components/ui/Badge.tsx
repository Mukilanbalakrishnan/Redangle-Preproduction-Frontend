interface BadgeProps {
    status: string
}

const config: Record<string, { bg: string; color: string }> = {
    // Client statuses
    'New': { bg: '#FFF3E0', color: '#E65100' },
    'Contacted': { bg: '#EDE9FE', color: '#5B5FC7' },
    'Pending': { bg: '#FEF9C3', color: '#CA8A04' },
    'In Progress': { bg: '#E8F0FE', color: '#1565C0' },
    'Assign Team': { bg: '#DBEAFE', color: '#2563EB' },
    'Completed': { bg: '#E8F5E9', color: '#2E7D32' },
    // Legacy display labels
    'In progress': { bg: '#E8F0FE', color: '#1565C0' },
    // Approval
    'Approved': { bg: '#E8F5E9', color: '#2E7D32' },
    'Rejected': { bg: '#FEE2E2', color: '#DC2626' },
    // Work tracking
    'Pending tasks': { bg: '#EDE9FE', color: '#5B5FC7' },
    'In-Review (QC Pending)': { bg: '#E0F2FE', color: '#0369A1' },
    'Pending client approval': { bg: '#FFEDD5', color: '#C2410C' },
    'In-Progress': { bg: '#FEE2E2', color: '#DC2626' },
    // Attendance
    'Present': { bg: '#DCFCE7', color: '#16A34A' },
    'Absent': { bg: '#FEE2E2', color: '#DC2626' },
    'Late': { bg: '#FEF9C3', color: '#CA8A04' },
    'Half-day': { bg: '#DBEAFE', color: '#2563EB' },
    // Leave
    'Accepted': { bg: '#DCFCE7', color: '#16A34A' },
    // Raw data
    'Verified': { bg: '#DBEAFE', color: '#2563EB' },
    'Assigned': { bg: '#D1FAE5', color: '#059669' },
}

export default function Badge({ status }: BadgeProps) {
    const style = config[status] || { bg: '#F3F4F6', color: '#6B7280' }
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            background: style.bg,
            color: style.color,
            lineHeight: '1.4',
        }}>
            {status}
        </span>
    )
}
