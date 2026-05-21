import { Camera } from 'lucide-react'
import RoleEventSchedule from '../../components/RoleEventSchedule'

export default function PhotographerEventSchedule() {
    return (
        <RoleEventSchedule
            role="photographer"
            title="Photographer - Event Schedule"
            subtitle="Role-specific shoot dates, tracking state, and upload status"
            emptyText="No photography event work found"
            accentText="text-blue-600"
            accentBg="bg-blue-50"
            Icon={Camera}
        />
    )
}
