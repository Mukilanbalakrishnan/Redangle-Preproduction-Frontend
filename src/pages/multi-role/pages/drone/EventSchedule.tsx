import { Plane } from 'lucide-react'
import RoleEventSchedule from '../../components/RoleEventSchedule'

export default function DroneEventSchedule() {
    return (
        <RoleEventSchedule
            role="drone"
            title="Drone - Event Schedule"
            subtitle="Role-specific drone shoot dates, tracking state, and upload status"
            emptyText="No drone event work found"
            accentText="text-teal-600"
            accentBg="bg-teal-50"
            Icon={Plane}
        />
    )
}
