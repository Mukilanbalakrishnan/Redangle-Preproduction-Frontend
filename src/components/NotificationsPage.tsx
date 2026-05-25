import { useState, useMemo } from 'react';
import {
    Bell, Users, CheckCircle2, Calendar, MessageSquare, Briefcase,
    UserPlus, FileText, Camera, Send, Search, Check, Inbox
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import type { NotificationItem } from '../hooks/useNotifications';
import { getNotificationTargetPath } from '../utils/notificationNavigation';

// ─── Helpers ────────────────────────────────────────────────────────────────

const getNotificationStyles = (type: string) => {
    switch (type) {
        case 'query':
            return { icon: MessageSquare, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', accent: '#7c3aed' };
        case 'assignment_accepted':
            return { icon: CheckCircle2, iconBg: 'bg-green-100', iconColor: 'text-green-600', accent: '#16a34a' };
        case 'client':
        case 'new_client':
            return { icon: Users, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', accent: '#2563eb' };
        case 'leave':
        case 'leave_request':
            return { icon: Calendar, iconBg: 'bg-red-100', iconColor: 'text-red-500', accent: '#ef4444' };
        case 'employee':
        case 'new_employee':
            return { icon: UserPlus, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', accent: '#4f46e5' };
        case 'delivery':
        case 'client_delivery':
            return { icon: Send, iconBg: 'bg-teal-100', iconColor: 'text-teal-600', accent: '#0d9488' };
        case 'work_assigned':
        case 'assignment':
            return { icon: FileText, iconBg: 'bg-orange-100', iconColor: 'text-orange-600', accent: '#ea580c' };
        case 'shoot':
        case 'shoot_assigned':
            return { icon: Camera, iconBg: 'bg-pink-100', iconColor: 'text-pink-600', accent: '#db2777' };
        case 'raw_data_uploaded':
            return { icon: Camera, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', accent: '#2563eb' };
        default:
            return { icon: Briefcase, iconBg: 'bg-gray-100', iconColor: 'text-gray-600', accent: '#6b7280' };
    }
};

const timeAgo = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 5) return 'just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getDateLabel = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDays < 7) return date.toLocaleDateString('default', { weekday: 'long' });
    if (diffDays < 30) return 'Earlier this month';
    return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
};

// Friendly type labels for the filter chips
const TYPE_LABELS: Record<string, string> = {
    all: 'All',
    query: 'Queries',
    new_client: 'Clients',
    client: 'Clients',
    leave_request: 'Leave',
    leave: 'Leave',
    work_assigned: 'Assignments',
    assignment: 'Assignments',
    shoot: 'Shoots',
    shoot_assigned: 'Shoots',
    raw_data_uploaded: 'Raw Data',
    delivery: 'Delivery',
    client_delivery: 'Delivery',
    employee: 'Employees',
    new_employee: 'Employees',
    assignment_accepted: 'Accepted',
};

const normalizeType = (type: string): string => {
    if (type === 'client') return 'new_client';
    if (type === 'leave') return 'leave_request';
    if (type === 'assignment') return 'work_assigned';
    if (type === 'shoot') return 'shoot_assigned';
    if (type === 'client_delivery') return 'delivery';
    if (type === 'employee') return 'new_employee';
    return type;
};

// ─── Component ──────────────────────────────────────────────────────────────

interface NotificationsPageProps {
    role: string;
}

export default function NotificationsPage({ role }: NotificationsPageProps) {
    const navigate = useNavigate();
    const { notifications, loading, unreadCount, handleMarkRead, handleMarkAllRead } = useNotifications(role);

    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Build unique type chips from actual notifications
    const typeChips = useMemo(() => {
        const seen = new Set<string>();
        const chips: { key: string; label: string }[] = [{ key: 'all', label: 'All' }];
        for (const n of notifications) {
            const norm = normalizeType(n.type);
            if (!seen.has(norm) && TYPE_LABELS[norm]) {
                seen.add(norm);
                chips.push({ key: norm, label: TYPE_LABELS[norm] });
            }
        }
        return chips;
    }, [notifications]);

    // Filter + search
    const filtered = useMemo(() => {
        let list = notifications;
        if (activeFilter !== 'all') {
            list = list.filter(n => normalizeType(n.type) === activeFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(n =>
                n.title?.toLowerCase().includes(q) ||
                n.detail?.toLowerCase().includes(q) ||
                n.from_name?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [notifications, activeFilter, searchQuery]);

    // Group by date bucket
    const grouped = useMemo(() => {
        const groups: { label: string; items: NotificationItem[] }[] = [];
        for (const note of filtered) {
            const label = getDateLabel(note.created_at);
            const existing = groups.find(g => g.label === label);
            if (existing) existing.items.push(note);
            else groups.push({ label, items: [note] });
        }
        return groups;
    }, [filtered]);

    const unreadFiltered = filtered.filter(n => !n.is_read).length;

    return (
        <div className="max-w-4xl space-y-5 animate-in fade-in zoom-in-95 duration-300">
            {/* Page header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                    <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Notifications</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Stay updated on everything that matters</p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[12px] font-bold transition-colors shadow-sm"
                    >
                        <Check size={13} strokeWidth={3} />
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Total', value: notifications.length, color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' },
                    { label: 'Unread', value: unreadCount, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
                    { label: 'Read', value: notifications.length - unreadCount, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl px-5 py-4 flex items-center justify-between`}>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</span>
                        <span className={`text-2xl font-extrabold ${s.color}`}>{s.value}</span>
                    </div>
                ))}
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search notifications…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-white outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all placeholder-gray-400"
                    />
                </div>

                {/* Type filter chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5 flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
                    {typeChips.map(chip => (
                        <button
                            key={chip.key}
                            onClick={() => setActiveFilter(chip.key)}
                            className={`shrink-0 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all duration-150 border ${
                                activeFilter === chip.key
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-600'
                            }`}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main panel */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="w-8 h-8 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                        <p className="text-sm text-gray-400 font-medium">Loading notifications...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                            <Inbox size={28} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-bold text-gray-500">
                            {searchQuery ? 'No matching notifications' : 'Nothing here yet'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 text-center">
                            {searchQuery
                                ? `No notifications match "${searchQuery}"`
                                : "You're all caught up — new notifications will appear here."}
                        </p>
                        {(searchQuery || activeFilter !== 'all') && (
                            <button
                                onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                                className="mt-4 text-xs text-purple-600 font-semibold hover:underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div>
                        {/* Inline unread summary bar */}
                        {unreadFiltered > 0 && (
                            <div className="flex items-center justify-between px-6 py-3 bg-purple-50 border-b border-purple-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                    <span className="text-[12px] font-semibold text-purple-700">
                                        {unreadFiltered} unread notification{unreadFiltered > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-[11px] font-bold text-purple-600 hover:text-purple-800 transition-colors"
                                >
                                    Mark all read
                                </button>
                            </div>
                        )}

                        {grouped.map(group => (
                            <div key={group.label}>
                                {/* Group header */}
                                <div className="sticky top-0 z-10 px-6 py-2 bg-gray-50/95 backdrop-blur-sm border-y border-gray-100 flex items-center gap-2">
                                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{group.label}</span>
                                    <span className="text-[10px] text-gray-300 font-medium">— {group.items.length} item{group.items.length > 1 ? 's' : ''}</span>
                                </div>

                                {group.items.map((note: NotificationItem) => {
                                    const { icon: Icon, iconBg, iconColor, accent } = getNotificationStyles(note.type);
                                    const noteId = note.id || note.notification_id || 0;
                                    const targetPath = getNotificationTargetPath(role, note);
                                    return (
                                        <div
                                            key={noteId}
                                            onClick={() => {
                                                if (!note.is_read) handleMarkRead(noteId);
                                                if (targetPath) navigate(targetPath);
                                            }}
                                            className={`group flex items-start gap-4 px-6 py-4 border-b border-gray-50 transition-all duration-150 ${
                                                targetPath ? 'cursor-pointer' : 'cursor-default'
                                            } ${
                                                !note.is_read
                                                    ? 'bg-purple-50/40 hover:bg-purple-50/70'
                                                    : 'bg-white hover:bg-gray-50'
                                            }`}
                                            style={
                                                !note.is_read
                                                    ? { borderLeft: `3px solid ${accent}` }
                                                    : { borderLeft: '3px solid transparent' }
                                            }
                                        >
                                            {/* Icon */}
                                            <div className={`w-10 h-10 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
                                                <Icon size={18} strokeWidth={2.5} />
                                            </div>

                                            {/* Body */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className={`text-[13px] leading-snug ${
                                                            !note.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'
                                                        }`}>
                                                            {note.title}
                                                        </h3>
                                                        {note.detail && (
                                                            <p className="text-[12px] text-gray-500 mt-1 leading-relaxed line-clamp-2">
                                                                {note.detail}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                            <span className={`text-[11px] font-semibold ${
                                                                !note.is_read ? 'text-gray-600' : 'text-gray-400'
                                                            }`}>
                                                                {timeAgo(note.created_at)}
                                                            </span>
                                                            {note.from_name && (
                                                                <>
                                                                    <span className="text-gray-300 text-xs">·</span>
                                                                    <span className="text-[11px] text-gray-400">
                                                                        from <span className="font-semibold text-gray-500">{note.from_name}</span>
                                                                    </span>
                                                                </>
                                                            )}
                                                            {!note.is_read && (
                                                                <span
                                                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                                                                    style={{ backgroundColor: accent }}
                                                                >
                                                                    New
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Read indicator dot */}
                                                    {!note.is_read && (
                                                        <div
                                                            className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 shadow-sm"
                                                            style={{ backgroundColor: accent }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}

                        {/* Footer count */}
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
                            <span className="text-[11px] text-gray-400 font-medium">
                                Showing {filtered.length} of {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
