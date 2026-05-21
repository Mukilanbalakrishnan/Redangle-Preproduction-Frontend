import { Palette } from 'lucide-react'
import EmployeeTaskPage from './EmployeeTaskPage'

export default function Retouch() {
    return <EmployeeTaskPage title="Retouch" icon={<Palette size={20} className="text-amber-600" />} filterType="retouch" />
}
