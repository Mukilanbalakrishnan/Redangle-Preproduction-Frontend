import axios from "axios";

export const createNotification = async (data: {
    type: string;
    title: string;
    detail?: string;
    lead_id?: number | string;
    from_role?: string;
    from_name?: string;
    target_roles: string[];
    target_employee_id?: string;
    source_stage?: string;
}) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const res = await axios.post(`${API_URL}/notifications`, data);
    return res.data;
};

export const getNotifications = async (params: {
    roles: string[];
    employee_id?: string | null;
    type?: string;
    source_stage?: string;
    from_role?: string;
}) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const query = new URLSearchParams();
    const roles = params.roles.filter(Boolean);
    if (roles.length) query.set('roles', roles.join(','));
    if (params.employee_id) query.set('employee_id', String(params.employee_id));
    if (params.type) query.set('type', params.type);
    if (params.source_stage) query.set('source_stage', params.source_stage);
    if (params.from_role) query.set('from_role', params.from_role);
    const res = await axios.get(`${API_URL}/notifications?${query.toString()}`);
    return res.data;
};

export const getNotificationsFiltered = getNotifications;

export const markNotificationRead = async (id: number) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const res = await axios.patch(`${API_URL}/notifications/${id}/read`);
    return res.data;
};

export const markAllNotificationsRead = async (roles: string[], employee_id?: string | null) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const res = await axios.patch(`${API_URL}/notifications/read-all`, { roles, employee_id });
    return res.data;
};

export const clearNotifications = async (roles: string[], employee_id?: string | null) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const res = await axios.delete(`${API_URL}/notifications/clear`, { data: { roles, employee_id } });
    return res.data;
};
