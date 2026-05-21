import { Camera } from 'lucide-react'
import AssignedProjectTaskPage from './AssignedProjectTaskPage'

type Props = {
    listMode?: 'assigned' | 'works'
}

export default function TraditionalPhoto({ listMode = 'assigned' }: Props) {
    return (
        <AssignedProjectTaskPage
            title="Retouch Editing"
            projectType="Retouch Editing"
            icon={<Camera size={20} className="text-purple-600" />}
            description="Edit the traditional event photos, submit your final link, and wait for CRM verification."
            listMode={listMode}
            roleLabel="Retouch"
        />
    )
}
