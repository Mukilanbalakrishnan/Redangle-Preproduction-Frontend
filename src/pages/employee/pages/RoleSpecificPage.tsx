import { getEmployeeRole } from '../employeeRoleConfig'
import { Briefcase, Video } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import EmployeeProjectWorkspace from './EmployeeProjectWorkspace'
import MRTraditionalVideo from '../../multi-role/pages/employee/TraditionalVideo'
import MRTraditionalPhoto from '../../multi-role/pages/employee/TraditionalPhoto'
import MRAlbumDesign from '../../multi-role/pages/employee/AlbumDesign'
import MRCandidVideo from '../../multi-role/pages/employee/CandidVideo'

export default function RoleSpecificPage() {
    const location = useLocation()
    const pathRole =
        location.pathname.includes('/traditional-video') ? 'traditional-video-editor'
            : location.pathname.includes('/traditional-photo') ? 'retouch-editor'
                : location.pathname.includes('/album-design') ? 'album-designer'
                    : location.pathname.includes('/candid-video') ? 'candid-video-editor'
                        : location.pathname.includes('/save-the-video') ? 'employee-2'
                            : location.pathname.includes('/outdoor-retouch') ? 'employee-4'
                                : location.pathname.includes('/save-the-date') ? 'employee-1'
                                    : ''
    const role = pathRole || getEmployeeRole()
    const listMode = location.pathname.endsWith('/works') ? 'works' : 'assigned'

    switch (role) {
        case 'employee-1':
            return (
                <EmployeeProjectWorkspace
                    title="Save the Date Workspace"
                    subtitle="Manage and design your assigned Save the Date projects"
                    projectType="Save the Date"
                    submitLabel="Save the Date deliverable"
                    defaultRequirements="Create a cinematic Save the Date deliverable. Follow the provided client notes, keep pacing clean, and submit the final cloud link for review."
                    icon={Briefcase}
                />
            )
        case 'employee-2':
            return (
                <EmployeeProjectWorkspace
                    title="Save the Video Workspace"
                    subtitle="Manage and design your assigned Save the Video projects"
                    projectType="Save the Video"
                    submitLabel="Save the Video deliverable"
                    defaultRequirements="Create a cinematic Save the Video deliverable. Follow the provided client notes, emphasize clean transitions, and submit the final cloud link for review."
                    icon={Video}
                />
            )
        case 'employee-4':
            return (
                <EmployeeProjectWorkspace
                    title="Retouching Workspace"
                    subtitle="Manage and deliver your assigned Retouching projects"
                    projectType="Retouching"
                    submitLabel="Retouching deliverable"
                    defaultRequirements="Retouch the selected images according to the provided instructions. Keep skin tones natural, remove distractions, and submit the final cloud link for review."
                    toolLabel="Open Editor"
                    icon={Briefcase}
                />
            )
        case 'traditional-video-editor':
            return <MRTraditionalVideo listMode={listMode} />
        case 'retouch-editor':
            return <MRTraditionalPhoto listMode={listMode} />
        case 'album-designer':
            return <MRAlbumDesign listMode={listMode} />
        case 'candid-video-editor':
            return <MRCandidVideo listMode={listMode} />
        default:
            return (
                <EmployeeProjectWorkspace
                    title="Save the Date Workspace"
                    subtitle="Manage and design your assigned Save the Date projects"
                    projectType="Save the Date"
                    submitLabel="Save the Date deliverable"
                    defaultRequirements="Create a cinematic Save the Date deliverable. Follow the provided client notes, keep pacing clean, and submit the final cloud link for review."
                    icon={Briefcase}
                />
            )
    }
}
