import NotificationsPage from '../../../components/NotificationsPage'
import { getCurrentEmployeeId, getCurrentUserRoles } from '../../../utils/currentUser'

export default function MultiRoleNotifications() {
    const roles = getCurrentUserRoles(['photographer'])
    const employeeId = getCurrentEmployeeId()

    return (
        <NotificationsPage
            roles={roles}
            employeeId={employeeId}
            showRoleFilter={roles.length > 1}
            showStageFilter={true}
        />
    )
}
