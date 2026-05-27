import { getCurrentUserRoles, getCurrentEmployeeId } from '../../../utils/currentUser';
import NotificationsPage from '../../../components/NotificationsPage';

export default function Notifications() {
    const roles = getCurrentUserRoles(['event_coordinator']);
    const employeeId = getCurrentEmployeeId();
    return <NotificationsPage roles={roles} employeeId={employeeId} showRoleFilter={true} showStageFilter={true} />;
}
