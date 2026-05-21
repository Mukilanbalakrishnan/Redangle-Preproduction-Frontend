import { Image } from 'lucide-react'
import AssignedProjectTaskPage from './AssignedProjectTaskPage'

type Props = {
    listMode?: 'assigned' | 'works'
}

export default function AlbumDesign({ listMode = 'assigned' }: Props) {
    return (
        <AssignedProjectTaskPage
            title="Album Design"
            projectType="Album Design"
            icon={<Image size={20} className="text-purple-600" />}
            description="Design the album proof, submit your final link, and wait for CRM verification."
            listMode={listMode}
            roleLabel="Album Designer"
        />
    )
}
