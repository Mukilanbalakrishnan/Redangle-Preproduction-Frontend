import { Video } from 'lucide-react'
import AssignedProjectTaskPage from './AssignedProjectTaskPage'

type Props = {
    listMode?: 'assigned' | 'works'
}

export default function CandidVideo({ listMode = 'assigned' }: Props) {
    return (
        <AssignedProjectTaskPage
            title="Candid Video Editing"
            projectType="Candid Video Editing"
            icon={<Video size={20} className="text-purple-600" />}
            description="Edit the candid video deliverable, submit your final link, and wait for CRM verification."
            listMode={listMode}
            roleLabel="Candid Video"
        />
    )
}
