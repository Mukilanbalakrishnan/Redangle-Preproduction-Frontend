import { Image } from 'lucide-react'
import EmployeeTaskPage from './EmployeeTaskPage'

export default function SaveTheDate() {
    return <EmployeeTaskPage title="Save the Date" icon={<Image size={20} className="text-amber-600" />} filterType="save the date" />
}
