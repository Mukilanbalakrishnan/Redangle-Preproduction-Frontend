import NotificationsPage from '../../../components/NotificationsPage';

export default function Notifications() {
    const userStr = localStorage.getItem('ra_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const role = user?.role || 'employee-1';
    return <NotificationsPage role={role} />;
}
