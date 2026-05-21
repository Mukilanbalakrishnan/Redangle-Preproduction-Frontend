import { Film } from 'lucide-react'
import EmployeeTaskPage from './EmployeeTaskPage'

export default function SaveTheVideo() {
    return <EmployeeTaskPage title="Save the Video" icon={<Film size={20} className="text-amber-600" />} filterType="save the video" />
}
