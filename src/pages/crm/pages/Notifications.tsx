import NotificationsPage from '../../../components/NotificationsPage';
import { useLocation } from 'react-router-dom';

export default function Notifications() {
    const location = useLocation();
    const role = location.pathname.startsWith('/pre-production-crm')
        ? 'pre-production-crm'
        : location.pathname.startsWith('/post-production-crm')
            ? 'post-production-crm'
            : 'crm';

    return <NotificationsPage role={role} />;
}
