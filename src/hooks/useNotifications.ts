import { useState, useEffect, useCallback } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead, clearNotifications } from '../api/notification.api';

export interface NotificationItem {
    id: number;
    notification_id?: number;
    type: string;
    title: string;
    detail: string | null;
    lead_id: number | null;
    from_role: string | null;
    from_name: string | null;
    target_roles: string[];
    target_employee_id?: string | null;
    source_stage?: string | null;
    is_read: boolean;
    created_at: string;
}

export function useNotifications(roles: string[], employeeId?: string | null) {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const effectiveRoles = roles.filter(Boolean);
    const roleKey = effectiveRoles.join(',');

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await getNotifications({ roles: effectiveRoles.length ? effectiveRoles : ['__none__'], employee_id: employeeId });
            if (res.success) {
                setNotifications(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [roleKey, employeeId]);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleMarkRead = async (id: number) => {
        try {
            await markNotificationRead(id);
            setNotifications(prev =>
                prev.map(n => (n.id === id || n.notification_id === id) ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead(effectiveRoles.length ? effectiveRoles : ['__none__'], employeeId);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const handleClearAll = async () => {
        try {
            await clearNotifications(effectiveRoles.length ? effectiveRoles : ['__none__'], employeeId);
            setNotifications([]);
        } catch (error) {
            console.error('Failed to clear notifications:', error);
        }
    };

    return {
        notifications,
        loading,
        unreadCount,
        handleMarkRead,
        handleMarkAllRead,
        handleClearAll,
        refetch: fetchNotifications,
    };
}
