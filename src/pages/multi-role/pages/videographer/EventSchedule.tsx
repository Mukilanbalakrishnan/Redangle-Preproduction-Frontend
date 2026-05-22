import { Video } from 'lucide-react'
import RoleEventSchedule from '../../components/RoleEventSchedule'

export default function VideographerEventSchedule() {
    return (
        <RoleEventSchedule
            role="videographer"
            title="Videographer - Event Schedule"
            subtitle="Role-specific shoot dates, tracking state, and upload status"
            emptyText="No videography event work found"
            accentText="text-green-600"
            accentBg="bg-green-50"
            Icon={Video}
        />
    )
}
