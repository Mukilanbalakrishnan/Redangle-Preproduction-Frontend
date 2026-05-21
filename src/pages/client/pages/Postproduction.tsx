import { MapPin, Calendar, Users, Info, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Dummy Data for Main Events
const mainEvents = [
    {
        id: 1,
        name: 'The Wedding Ceremony',
        venue: 'The Royal Gardens',
        address: '100 Heritage Lane, Upstate',
        date: 'Oct 14, 2026',
        time: '04:00 PM - 12:00 AM',
        crew: '2 Photographers, 2 Videographers, 1 Drone Pilot',
        notes: ['Traditional setup', 'Requires direct audio feed from DJ/Band', 'Group portraits at 7:00 PM'],
        status: 'UPCOMING'
    }
]

export default function Postproduction() {
    const navigate = useNavigate()

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Main Events</h1>
                <p className="text-slate-500 mt-1">Review the confirmed schedules, locations, and crew details for your main events.</p>
            </div>

            <div className="space-y-6">
                {mainEvents.map(event => (
                    <div
                        key={event.id}
                        onClick={() => navigate(`/client/event/${event.id}`, { state: { event } })}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row cursor-pointer hover:border-purple-400 hover:shadow-md transition-all group"
                    >

                        {/* Event Summary Left Side */}
                        <div className="bg-slate-50 p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                            <span className="self-start text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded uppercase tracking-widest mb-3">
                                {event.status}
                            </span>
                            <h2 className="text-xl font-bold text-slate-900">{event.name}</h2>
                            <p className="text-sm font-semibold text-slate-600 mt-4 flex items-center gap-2">
                                <Calendar size={16} className="text-purple-500" /> {event.date}
                            </p>
                            <p className="text-sm text-slate-500 mt-1 pl-6">{event.time}</p>
                        </div>

                        {/* Event Details Right Side */}
                        <div className="p-6 md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                                        <MapPin size={14} className="text-rose-500" /> Location
                                    </h3>
                                    <p className="font-semibold text-slate-900 text-sm">{event.venue}</p>
                                    <p className="text-slate-500 text-xs mt-0.5">{event.address}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                                        <Users size={14} className="text-blue-500" /> Assigned Crew
                                    </h3>
                                    <p className="text-sm font-medium text-slate-800">{event.crew}</p>
                                </div>
                            </div>

                            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 relative">
                                <h3 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-2">
                                    <AlertTriangle size={14} className="text-amber-500" /> Important Notes
                                </h3>
                                <ul className="list-disc pl-4 text-xs text-amber-700 space-y-1.5">
                                    {event.notes.map((note, idx) => (
                                        <li key={idx}>{note}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                    </div>
                ))}

                {mainEvents.length === 0 && (
                    <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        <Info size={32} className="mx-auto text-slate-300 mb-3" />
                        <h3 className="font-semibold text-slate-600">No Main Events Scheduled</h3>
                        <p className="text-sm text-slate-500 mt-1">Your assigned project manager will populate this section as planning progresses.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
