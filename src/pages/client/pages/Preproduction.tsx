import { MapPin, Calendar, Users, Info, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Dummy Data for Pre-Events
const preEvents = [
    {
        id: 1,
        name: 'Sangeet Ceremony',
        venue: 'Grand Taj Palace, Hall B',
        address: '45 Serenity Route, Downtown',
        date: 'Oct 12, 2026',
        time: '06:00 PM - 11:30 PM',
        crew: '2 Photographers, 1 Videographer',
        notes: ['Drone clearance required', 'Focus points on couple dance performance'],
        status: 'UPCOMING'
    },
    {
        id: 2,
        name: 'Haldi & Mehendi',
        venue: 'Bride\'s Residence (Backyard)',
        address: '12 Maple Street, Willow Creek',
        date: 'Oct 13, 2026',
        time: '10:00 AM - 03:00 PM',
        crew: '1 Photographer, 1 Candid Videographer',
        notes: ['Natural lighting focus', 'Requesting drone shots of the house exterior'],
        status: 'UPCOMING'
    }
]

export default function Preproduction() {
    const navigate = useNavigate()

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pre-Events</h1>
                <p className="text-slate-500 mt-1">Review the confirmed schedules, locations, and crew details for your pre-wedding events.</p>
            </div>

            <div className="space-y-6">
                {preEvents.map(event => (
                    <div
                        key={event.id}
                        onClick={() => navigate(`/client/event/${event.id}`, { state: { event } })}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group"
                    >

                        {/* Event Summary Left Side */}
                        <div className="bg-slate-50 p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                            <span className="self-start text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded uppercase tracking-widest mb-3">
                                {event.status}
                            </span>
                            <h2 className="text-xl font-bold text-slate-900">{event.name}</h2>
                            <p className="text-sm font-semibold text-slate-600 mt-4 flex items-center gap-2">
                                <Calendar size={16} className="text-indigo-500" /> {event.date}
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

                {preEvents.length === 0 && (
                    <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        <Info size={32} className="mx-auto text-slate-300 mb-3" />
                        <h3 className="font-semibold text-slate-600">No Pre-events Scheduled</h3>
                        <p className="text-sm text-slate-500 mt-1">Your assigned project manager will populate this section as planning progresses.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
