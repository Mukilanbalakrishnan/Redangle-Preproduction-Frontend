import NotificationsPage from '../../../components/NotificationsPage';
import { useMediaRole } from '../../../hooks/useMediaRole';

export default function Notifications() {
    const { fromRole } = useMediaRole();
    return <NotificationsPage role={fromRole} />;
}
