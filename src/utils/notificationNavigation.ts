import type { NotificationItem } from '../hooks/useNotifications'

export const getNotificationTargetPath = (roles: string[], note: NotificationItem) => {
    if (!roles.includes('data_manager') && !roles.includes('data-manager')) return null

    const text = `${note.type || ''} ${note.title || ''} ${note.detail || ''}`.toLowerCase()
    const stage = text.includes('event') ? 'event' : 'pre-production'

    if (text.includes('verification')) {
        return `/data-manager/${stage}/verification`
    }

    if (text.includes('pixstudio')) {
        if (stage === 'pre-production') return `/data-manager/${stage}/verification`
        return `/data-manager/${stage}/pixoffice`
    }

    if (text.includes('pixoffice')) {
        if (stage === 'pre-production') return `/data-manager/${stage}/verification`
        return `/data-manager/${stage}/pixoffice`
    }

    if (note.type === 'raw_data_uploaded' || text.includes('raw data') || text.includes('uploaded')) {
        return `/data-manager/${stage}/incoming-data`
    }

    return null
}
