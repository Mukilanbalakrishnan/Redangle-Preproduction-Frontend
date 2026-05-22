import { Video } from 'lucide-react'
import AssignedProjectTaskPage from './AssignedProjectTaskPage'

type Props = {
    listMode?: 'assigned' | 'works'
}

export default function TraditionalVideo({ listMode = 'assigned' }: Props) {
    return (
        <AssignedProjectTaskPage
            title="Traditional Video Editing"
            projectType="Traditional Video Editing"
            icon={<Video size={20} className="text-purple-600" />}
            description="Edit the traditional event video, submit your final link, and wait for CRM verification."
            listMode={listMode}
            roleLabel="Traditional Video"
        />
    )
}
